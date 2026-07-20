import 'dotenv/config';
import PrismaPkg from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const { PrismaClient } = PrismaPkg;

export type ProcessPrisma = InstanceType<typeof PrismaClient>;

/** Standalone Prisma client for process seed helpers (not Nest-injected). */
export function createProcessPrisma(): ProcessPrisma {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL is required for process tests');
  }
  const adapter = new PrismaPg({ connectionString: dbUrl });
  return new PrismaClient({ adapter });
}

export async function canConnectDatabase(
  prisma: ProcessPrisma,
): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
