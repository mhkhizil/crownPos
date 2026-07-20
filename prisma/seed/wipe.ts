import type { SeedPrisma } from './types.js';

export async function wipePublicApplicationData(
  prisma: SeedPrisma,
): Promise<void> {
  const rows = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename <> '_prisma_migrations'
  `;
  const names = rows
    .map((r) => r.tablename)
    .filter((n) => /^[a-z0-9_]+$/i.test(n));
  if (names.length === 0) {
    console.log('[seed] no public tables to truncate');
    return;
  }
  const quoted = names.map((n) => `"${n}"`).join(', ');
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE`,
  );
  console.log(`[seed] truncated ${names.length} public tables`);
}
