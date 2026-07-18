import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/** Placeholder so `prisma generate` works before a real .env exists. */
const datasourceUrl =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/app_db';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // Prefer DIRECT_URL when available (non-pgbouncer direct connection).
    url: datasourceUrl,
  },
});
