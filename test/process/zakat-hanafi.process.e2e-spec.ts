/**
 * Hanafi zakat tracker + calculate HTTP process tests.
 * Prerequisite: `npm run db:seed` (includes ZakatPayment).
 * Manual-verify suite mutates inventory/AR — re-seed after running.
 */
import 'dotenv/config';
import type { Server } from 'http';
import {
  apiDelete,
  apiGet,
  apiPost,
  createProcessApp,
  loginRootAdmin,
} from './process-http.js';
import {
  canConnectDatabase,
  createProcessPrisma,
  type ProcessPrisma,
} from './process-prisma.js';

const BASE = '/api/v1/admin/dashboard/bd-analytics';

describe('L3 process: zakat tracker + calculate', () => {
  let prisma: ProcessPrisma;
  let server: Server;
  let close: () => Promise<void>;
  let token: string;
  let dbOk = false;

  beforeAll(async () => {
    prisma = createProcessPrisma();
    dbOk = await canConnectDatabase(prisma);
    if (!dbOk) {
      console.warn('[zakat e2e] DATABASE_URL unreachable — skipping');
      return;
    }
    const boot = await createProcessApp();
    server = boot.server;
    close = boot.close;
    token = await loginRootAdmin(server);
  });

  afterAll(async () => {
    if (close) await close();
    if (prisma) await prisma.$disconnect();
  });

  function requireDb(): void {
    if (!dbOk) {
      pending('Postgres unavailable');
    }
  }

  it('H3: calculate returns breakdown + considerations', async () => {
    requireDb();
    const res = await apiPost<{
      zakatDueMmk: number;
      considerations: string[];
      nisabStyle: string;
    }>(server, token, `${BASE}/zakat/hanafi/calculate`, {
      nisabStyle: 'SILVER',
      silverPricePerGramMmk: 1000,
      cashOnHandMmk: 0,
      bankBalanceMmk: 0,
      payablesMmk: 0,
      haulCompleted: true,
    });
    expect(res.status).toBe(200);
    expect(res.body.data?.considerations?.length).toBeGreaterThan(0);
    expect(res.body.data?.nisabStyle).toBe('SILVER');
  });

  it('H4/H5/H6/H8: record, coverage, duplicate sum, delete', async () => {
    requireDb();
    const body = {
      periodType: 'MONTH',
      year: 2030,
      month: 3,
      amountPaidMmk: 10_000,
      paidAt: '2030-03-15',
      notes: 'zakat-process-test',
    };
    const a = await apiPost<{ id: string }>(
      server,
      token,
      `${BASE}/zakat/payments`,
      body,
    );
    expect(a.status).toBe(201);
    const b = await apiPost<{ id: string }>(
      server,
      token,
      `${BASE}/zakat/payments`,
      body,
    );
    expect(b.status).toBe(201);

    const cov = await apiGet<{ totalPaidMmk: number; payments: unknown[] }>(
      server,
      token,
      `${BASE}/zakat/payments/coverage?periodType=MONTH&year=2030&month=3`,
    );
    expect(cov.status).toBe(200);
    expect(cov.body.data?.totalPaidMmk).toBe(20_000);

    const del = await apiDelete(
      server,
      token,
      `${BASE}/zakat/payments/${a.body.data!.id}`,
    );
    expect(del.status).toBe(200);

    const cov2 = await apiGet<{ totalPaidMmk: number }>(
      server,
      token,
      `${BASE}/zakat/payments/coverage?periodType=MONTH&year=2030&month=3`,
    );
    expect(cov2.body.data?.totalPaidMmk).toBe(10_000);

    await apiDelete(server, token, `${BASE}/zakat/payments/${b.body.data!.id}`);
  });

  it('H7: invalid YEAR+month → 400', async () => {
    requireDb();
    const res = await apiPost(server, token, `${BASE}/zakat/payments`, {
      periodType: 'YEAR',
      year: 2031,
      month: 5,
      amountPaidMmk: 1,
      paidAt: '2031-01-01',
    });
    expect(res.status).toBe(400);
  });

  it('D6: calculate twice does not create ZakatPayment', async () => {
    requireDb();
    const before = await prisma.zakatPayment.count({
      where: { deletedAt: null },
    });
    const payload = {
      nisabStyle: 'GOLD',
      goldPricePerGramMmk: 100_000,
      cashOnHandMmk: 0,
      haulCompleted: false,
    };
    await apiPost(server, token, `${BASE}/zakat/hanafi/calculate`, payload);
    await apiPost(server, token, `${BASE}/zakat/hanafi/calculate`, payload);
    const after = await prisma.zakatPayment.count({
      where: { deletedAt: null },
    });
    expect(after).toBe(before);
  });
});
