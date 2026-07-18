import 'dotenv/config';
import PrismaPkg from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcrypt';
import { readFileSync } from 'fs';

const { PrismaClient } = PrismaPkg;

function getEnvFromFile() {
  try {
    const envContent = readFileSync('.env', 'utf-8');
    const lines = envContent.split('\n');

    lines.forEach((line) => {
      if (line.trim() && !line.trim().startsWith('#')) {
        const eqIdx = line.indexOf('=');
        if (eqIdx > 0) {
          const key = line.substring(0, eqIdx).trim();
          let value = line.substring(eqIdx + 1).trim();
          value = value.replace(/^["'](.*)["']$/, '$1');
          process.env[key] = value;
        }
      }
    });
  } catch (e) {
    console.error('Error: Could not read .env file');
    throw e;
  }
}

getEnvFromFile();

/**
 * Deletes all rows from every application table in `public`. Table definitions
 * and `_prisma_migrations` are unchanged.
 */
async function wipePublicApplicationData(
  prisma: InstanceType<typeof PrismaClient>,
): Promise<void> {
  const rows = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename <> '_prisma_migrations'
  `;
  const names = rows
    .map((r) => r.tablename)
    .filter((n) => /^[a-z0-9_]+$/.test(n));
  if (names.length === 0) {
    console.log('[seed] no public tables to truncate');
    return;
  }
  const quoted = names.map((n) => `"${n}"`).join(', ');
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE`,
  );
  console.log(
    `[seed] truncated ${names.length} public tables (migrations preserved)`,
  );
}

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  const email = process.env.ROOT_ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ROOT_ADMIN_PASSWORD || 'change-me';
  const phone = process.env.ROOT_ADMIN_PHONE || '+959000000000';
  const nickname = process.env.ROOT_ADMIN_NICKNAME || 'Root Admin';

  const rawClientPhone =
    process.env.TEST_CLIENT_PHONE ||
    process.env.DATABASE_SEED_PHONE ||
    '+959111111111';
  const rawClientEmail =
    process.env.TEST_CLIENT_EMAIL ||
    process.env.DATABASE_SEED_EMAIL ||
    'client@example.com';
  const clientPassword =
    process.env.TEST_CLIENT_PASSWORD ||
    process.env.DATABASE_SEED_PASSWORD ||
    'client-1234';
  const clientNickname =
    process.env.TEST_CLIENT_NICKNAME ||
    process.env.DATABASE_SEED_NICKNAME ||
    'Test Client';

  const normalizeEmail = (v: string) => v.trim().toLowerCase();
  const normalizePhone = (v: string) => v.trim();

  const rootEmailNorm = normalizeEmail(email);
  const rootPhoneNorm = normalizePhone(phone);

  let clientPhone = normalizePhone(rawClientPhone);
  let clientEmail = normalizeEmail(rawClientEmail);

  if (clientPhone === rootPhoneNorm) {
    const m = clientPhone.match(/^(.*?)(\d)$/);
    if (m) {
      const prefix = m[1];
      const last = Number(m[2]);
      clientPhone = `${prefix}${(last + 1) % 10}`;
    } else {
      clientPhone = `${clientPhone}-client`;
    }
    console.warn(
      `[warn] TEST_CLIENT_PHONE conflicted with ROOT_ADMIN_PHONE; using ${clientPhone} for seeded client`,
    );
  }

  if (clientEmail === rootEmailNorm) {
    const at = clientEmail.indexOf('@');
    clientEmail =
      at > 0
        ? `${clientEmail.slice(0, at)}+client${clientEmail.slice(at)}`
        : `${clientEmail}.client`;
    console.warn(
      `[warn] TEST_CLIENT_EMAIL conflicted with ROOT_ADMIN_EMAIL; using ${clientEmail} for seeded client`,
    );
  }

  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const adapter = new PrismaPg({
    connectionString: dbUrl,
  });
  const prisma = new PrismaClient({ adapter });

  console.warn(
    '[seed] removing all rows from public tables (schema unchanged), then seeding…',
  );
  await wipePublicApplicationData(prisma);

  const rootPermissions = [
    { permission: 'MANAGE_USERS' as const },
    { permission: 'VIEW_ANALYTICS' as const },
  ];

  const rootRole = await prisma.adminRole.upsert({
    where: { name: 'ROOT_ADMIN' },
    create: {
      name: 'ROOT_ADMIN',
      description: 'System root admin (seeded, immutable)',
      isSystem: true,
      permissions: {
        createMany: { data: rootPermissions },
      },
    },
    update: {
      isSystem: true,
      permissions: {
        deleteMany: {},
        createMany: { data: rootPermissions },
      },
    },
  });

  const passwordHash = await hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    create: {
      phone,
      email,
      password: passwordHash,
      nickname,
      isEmailVerified: true,
      isPhoneVerified: true,
      emailVerifiedAt: new Date(),
      phoneVerifiedAt: new Date(),
      isActive: true,
      isBanned: false,
      adminRoleId: rootRole.id,
    },
    update: {
      phone,
      password: passwordHash,
      nickname,
      isEmailVerified: true,
      isPhoneVerified: true,
      emailVerifiedAt: new Date(),
      phoneVerifiedAt: new Date(),
      isActive: true,
      isBanned: false,
      adminRoleId: rootRole.id,
    },
  });

  console.log('[ok] Root admin user seeded successfully');

  const clientPasswordHash = await hash(clientPassword, 12);
  await prisma.user.upsert({
    where: { phone: clientPhone },
    create: {
      phone: clientPhone,
      email: clientEmail,
      password: clientPasswordHash,
      nickname: clientNickname,
      isEmailVerified: true,
      isPhoneVerified: true,
      emailVerifiedAt: new Date(),
      phoneVerifiedAt: new Date(),
      isActive: true,
      isBanned: false,
      adminRoleId: null,
    },
    update: {
      email: clientEmail,
      password: clientPasswordHash,
      nickname: clientNickname,
      isEmailVerified: true,
      isPhoneVerified: true,
      emailVerifiedAt: new Date(),
      phoneVerifiedAt: new Date(),
      isActive: true,
      isBanned: false,
      adminRoleId: null,
    },
  });

  console.log('[ok] Test client user seeded successfully');
  console.log(`  phone: ${clientPhone}`);
  console.log(`  email: ${clientEmail}`);
  console.log(`  password: ${clientPassword}`);
  await prisma.$disconnect();
}

main()
  .then(async () => {
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(e);
    process.exit(1);
  });
