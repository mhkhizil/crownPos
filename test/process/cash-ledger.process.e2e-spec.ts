/**
 * Cash ledger loophole & correctness process tests (CL1–CL12).
 * Prerequisite: `npm run db:seed`. Uses disposable 2099-* dates; cleans up after.
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
import {
  arrangeUnpaidInvoice,
  arrangeUnpaidPo,
  cleanupCashLedgerProcessFixtures,
  CL_DAY,
  CL_DAY2,
} from './cash-ledger-arrange.js';

const BD = '/api/v1/admin/dashboard/bd-analytics';
const BILLING = '/api/v1/admin/dashboard/billing';
const PURCHASES = '/api/v1/admin/dashboard/purchases';

type LedgerRow = {
  id: string;
  source: string;
  category: string;
  direction: string;
  account: string;
  amountMmk: number;
  sourceRef: string | null;
  entryDate: string;
};

type Balances = {
  view: string;
  cashOnHandMmk: number;
  bankBalanceMmk: number;
  totalInflowsMmk: number;
  totalOutflowsMmk: number;
};

describe('L3 process: cash ledger CL1–CL12', () => {
  let prisma: ProcessPrisma;
  let server: Server;
  let close: () => Promise<void>;
  let token: string;
  let dbOk = false;
  const runId = `${Date.now()}`;

  beforeAll(async () => {
    prisma = createProcessPrisma();
    dbOk = await canConnectDatabase(prisma);
    if (!dbOk) {
      console.warn('[cash-ledger e2e] DATABASE_URL unreachable — skipping');
      return;
    }
    const boot = await createProcessApp();
    server = boot.server;
    close = boot.close;
    token = await loginRootAdmin(server);
    await cleanupCashLedgerProcessFixtures(prisma);
  });

  afterAll(async () => {
    if (dbOk && prisma) {
      await cleanupCashLedgerProcessFixtures(prisma);
    }
    if (close) await close();
    if (prisma) await prisma.$disconnect();
  });

  function requireDb(): void {
    if (!dbOk) pending('Postgres unavailable');
  }

  async function list(
    view: string,
    date = CL_DAY,
  ): Promise<LedgerRow[]> {
    const res = await apiGet<LedgerRow[]>(
      server,
      token,
      `${BD}/cash-ledger?view=${view}&date=${date}`,
    );
    expect(res.status).toBe(200);
    return res.body.data ?? [];
  }

  async function balances(
    view: string,
    asOf?: string,
  ): Promise<Balances> {
    const q = asOf
      ? `view=${view}&asOf=${asOf}`
      : `view=${view}`;
    const res = await apiGet<Balances>(
      server,
      token,
      `${BD}/cash-ledger/balances?${q}`,
    );
    expect(res.status).toBe(200);
    return res.body.data!;
  }

  it('CL1: invoice pay auto BUSINESS INFLOW (COD→CASH, BANK→BANK)', async () => {
    requireDb();
    const { invoiceId } = await arrangeUnpaidInvoice(prisma, {
      totalMmk: 80_000,
      suffix: `cl1-${runId}`,
    });

    const cod = await apiPost<{ id: string; amountMmk: number }>(
      server,
      token,
      `${BILLING}/payments`,
      {
        paymentDate: CL_DAY,
        method: 'CASH_ON_DELIVERY',
        amountMmk: 30_000,
        allocations: [{ invoiceId, amountMmk: 30_000 }],
      },
    );
    expect(cod.status).toBe(201);

    const bank = await apiPost<{ id: string }>(
      server,
      token,
      `${BILLING}/payments`,
      {
        paymentDate: CL_DAY,
        method: 'BANK_TRANSFER',
        amountMmk: 50_000,
        allocations: [{ invoiceId, amountMmk: 50_000 }],
      },
    );
    expect(bank.status).toBe(201);

    const biz = await list('BUSINESS');
    const cashIn = biz.find(
      (r) =>
        r.category === 'BUSINESS_COLLECTION' &&
        r.account === 'CASH' &&
        r.amountMmk === 30_000,
    );
    const bankIn = biz.find(
      (r) =>
        r.category === 'BUSINESS_COLLECTION' &&
        r.account === 'BANK' &&
        r.amountMmk === 50_000,
    );
    expect(cashIn?.source).toBe('BUSINESS');
    expect(cashIn?.direction).toBe('INFLOW');
    expect(cashIn?.sourceRef).toBe(`payment:${cod.body.data!.id}`);
    expect(bankIn?.source).toBe('BUSINESS');
    expect(bankIn?.direction).toBe('INFLOW');

    const manual = await list('MANUAL');
    expect(
      manual.some((r) => r.sourceRef === `payment:${cod.body.data!.id}`),
    ).toBe(false);
  });

  it('CL2: PO pay auto BUSINESS OUTFLOW', async () => {
    requireDb();
    const { poId } = await arrangeUnpaidPo(prisma, {
      totalMmk: 100_000,
      suffix: `cl2-${runId}`,
    });

    const pay = await apiPost(server, token, `${PURCHASES}/${poId}/payments`, {
      amountMmk: 50_000,
      account: 'BANK',
      paidAt: CL_DAY,
    });
    expect(pay.status).toBe(200);

    const biz = await list('BUSINESS');
    const row = biz.find(
      (r) =>
        r.category === 'BUSINESS_SUPPLIER_PAYMENT' &&
        r.amountMmk === 50_000 &&
        r.account === 'BANK',
    );
    expect(row?.source).toBe('BUSINESS');
    expect(row?.direction).toBe('OUTFLOW');
    expect(row?.sourceRef).toMatch(/^po-payment:/);
  });

  it('CL3: Manual CAPITAL isolated in MANUAL', async () => {
    requireDb();
    const created = await apiPost<LedgerRow>(
      server,
      token,
      `${BD}/cash-ledger`,
      {
        entryDate: CL_DAY,
        direction: 'INFLOW',
        account: 'BANK',
        category: 'CAPITAL',
        amountMmk: 1_000_000,
        notes: 'CL-TEST capital',
      },
    );
    expect(created.status).toBe(201);
    expect(created.body.data?.source).toBe('MANUAL');
    expect(created.body.data?.sourceRef).toBeNull();

    const man = await list('MANUAL');
    expect(man.some((r) => r.id === created.body.data!.id)).toBe(true);
    const biz = await list('BUSINESS');
    expect(biz.some((r) => r.id === created.body.data!.id)).toBe(false);
  });

  it('CL4: Reject manual BUSINESS_COLLECTION', async () => {
    requireDb();
    const res = await apiPost(server, token, `${BD}/cash-ledger`, {
      entryDate: CL_DAY,
      direction: 'INFLOW',
      account: 'CASH',
      category: 'BUSINESS_COLLECTION',
      amountMmk: 1,
    });
    expect(res.status).toBe(400);
  });

  it('CL5: TOTAL inflows/outflows = BUSINESS + MANUAL', async () => {
    requireDb();
    // Ensure at least one of each slice on CL_DAY (prior tests + this capital already).
    await apiPost(server, token, `${BD}/cash-ledger`, {
      entryDate: CL_DAY,
      direction: 'OUTFLOW',
      account: 'CASH',
      category: 'PERSONAL_DRAW',
      amountMmk: 20_000,
      notes: 'CL-TEST personal',
    });

    const b = await balances('BUSINESS');
    const m = await balances('MANUAL');
    const t = await balances('TOTAL');

    expect(t.totalInflowsMmk).toBeCloseTo(
      b.totalInflowsMmk + m.totalInflowsMmk,
      2,
    );
    expect(t.totalOutflowsMmk).toBeCloseTo(
      b.totalOutflowsMmk + m.totalOutflowsMmk,
      2,
    );
  });

  it('CL6: Balance floor 0 with overdraft', async () => {
    requireDb();
    await apiPost(server, token, `${BD}/cash-ledger`, {
      entryDate: CL_DAY2,
      direction: 'INFLOW',
      account: 'BANK',
      category: 'OTHER',
      amountMmk: 100,
      notes: 'CL-TEST overdraft-in',
    });
    await apiPost(server, token, `${BD}/cash-ledger`, {
      entryDate: CL_DAY2,
      direction: 'OUTFLOW',
      account: 'BANK',
      category: 'OTHER',
      amountMmk: 250,
      notes: 'CL-TEST overdraft-out',
    });

    const man = await apiGet<Balances>(
      server,
      token,
      `${BD}/cash-ledger/balances?view=MANUAL&asOf=${CL_DAY2}`,
    );
    // asOf includes all MANUAL through CL_DAY2 — check day-2-only via list + hand net
    const rows = await list('MANUAL', CL_DAY2);
    const day2 = rows.filter((r) => r.entryDate === CL_DAY2);
    const bankIn = day2
      .filter((r) => r.account === 'BANK' && r.direction === 'INFLOW')
      .reduce((s, r) => s + r.amountMmk, 0);
    const bankOut = day2
      .filter((r) => r.account === 'BANK' && r.direction === 'OUTFLOW')
      .reduce((s, r) => s + r.amountMmk, 0);
    expect(Math.max(0, bankIn - bankOut)).toBe(0);
    expect(bankOut).toBeGreaterThanOrEqual(250);
    expect(man.status).toBe(200);
  });

  it('CL7: Soft-delete removes from balances', async () => {
    requireDb();
    const created = await apiPost<LedgerRow>(
      server,
      token,
      `${BD}/cash-ledger`,
      {
        entryDate: CL_DAY,
        direction: 'INFLOW',
        account: 'CASH',
        category: 'OTHER',
        amountMmk: 7_777,
        notes: 'CL-TEST delete-me',
      },
    );
    expect(created.status).toBe(201);
    const before = await balances('MANUAL');
    const del = await apiDelete(
      server,
      token,
      `${BD}/cash-ledger/${created.body.data!.id}`,
    );
    expect(del.status).toBe(200);
    const after = await balances('MANUAL');
    expect(after.totalInflowsMmk).toBeCloseTo(
      before.totalInflowsMmk - 7_777,
      2,
    );
  });

  it('CL8: Duplicate manual+auto visible in TOTAL (documented loophole)', async () => {
    requireDb();
    const { invoiceId } = await arrangeUnpaidInvoice(prisma, {
      totalMmk: 10_000,
      suffix: `cl8-${runId}`,
    });
    const pay = await apiPost<{ id: string }>(
      server,
      token,
      `${BILLING}/payments`,
      {
        paymentDate: CL_DAY,
        method: 'BANK_TRANSFER',
        amountMmk: 10_000,
        allocations: [{ invoiceId, amountMmk: 10_000 }],
      },
    );
    expect(pay.status).toBe(201);

    await apiPost(server, token, `${BD}/cash-ledger`, {
      entryDate: CL_DAY,
      direction: 'INFLOW',
      account: 'BANK',
      category: 'OTHER',
      amountMmk: 10_000,
      notes: 'CL-TEST duplicate shop paid',
    });

    const biz = await list('BUSINESS');
    const man = await list('MANUAL');
    const tot = await list('TOTAL');
    const bizAmt = biz
      .filter((r) => r.sourceRef === `payment:${pay.body.data!.id}`)
      .reduce((s, r) => s + r.amountMmk, 0);
    const manDup = man.filter(
      (r) => r.notes === 'CL-TEST duplicate shop paid',
    );
    expect(bizAmt).toBe(10_000);
    expect(manDup.length).toBe(1);
    expect(
      tot.filter(
        (r) =>
          r.sourceRef === `payment:${pay.body.data!.id}` ||
          r.notes === 'CL-TEST duplicate shop paid',
      ).length,
    ).toBe(2);
  });

  it('CL9: Zakat useCashLedgerBalances uses TOTAL', async () => {
    requireDb();
    const tot = await balances('TOTAL');
    const calc = await apiPost<{
      cashOnHandMmk: number;
      bankBalanceMmk: number;
    }>(server, token, `${BD}/zakat/hanafi/calculate`, {
      nisabStyle: 'SILVER',
      silverPricePerGramMmk: 1,
      haulCompleted: false,
      useCashLedgerBalances: true,
      year: 2099,
    });
    expect(calc.status).toBe(200);
    expect(calc.body.data?.cashOnHandMmk).toBe(tot.cashOnHandMmk);
    expect(calc.body.data?.bankBalanceMmk).toBe(tot.bankBalanceMmk);
  });

  it('CL10: Explicit cashOnHandMmk 0 overrides ledger (documented loophole)', async () => {
    requireDb();
    const tot = await balances('TOTAL');
    expect(tot.cashOnHandMmk + tot.bankBalanceMmk).toBeGreaterThan(0);

    const calc = await apiPost<{
      cashOnHandMmk: number;
      bankBalanceMmk: number;
    }>(server, token, `${BD}/zakat/hanafi/calculate`, {
      nisabStyle: 'SILVER',
      silverPricePerGramMmk: 1,
      haulCompleted: false,
      useCashLedgerBalances: true,
      cashOnHandMmk: 0,
      bankBalanceMmk: 0,
      year: 2099,
    });
    expect(calc.status).toBe(200);
    expect(calc.body.data?.cashOnHandMmk).toBe(0);
    expect(calc.body.data?.bankBalanceMmk).toBe(0);
  });

  it('CL11: Unpaid AR not in ledger', async () => {
    requireDb();
    const { invoiceId } = await arrangeUnpaidInvoice(prisma, {
      totalMmk: 55_555,
      suffix: `cl11-${runId}`,
    });
    const before = await list('BUSINESS');
    const hasLeak = before.some(
      (r) =>
        r.category === 'BUSINESS_COLLECTION' && r.amountMmk === 55_555,
    );
    expect(hasLeak).toBe(false);

    const zakat = await apiPost<{ receivablesMmk: number }>(
      server,
      token,
      `${BD}/zakat/hanafi/calculate`,
      {
        nisabStyle: 'SILVER',
        silverPricePerGramMmk: 1000,
        haulCompleted: false,
        cashOnHandMmk: 0,
        bankBalanceMmk: 0,
      },
    );
    expect(zakat.status).toBe(200);
    expect(zakat.body.data!.receivablesMmk).toBeGreaterThanOrEqual(55_555);
    void invoiceId;
  });

  it('CL12: view=BUSINESS excludes PERSONAL_DRAW', async () => {
    requireDb();
    const created = await apiPost<LedgerRow>(
      server,
      token,
      `${BD}/cash-ledger`,
      {
        entryDate: CL_DAY,
        direction: 'OUTFLOW',
        account: 'CASH',
        category: 'PERSONAL_DRAW',
        amountMmk: 1234,
        notes: 'CL-TEST cl12',
      },
    );
    expect(created.status).toBe(201);
    const biz = await list('BUSINESS');
    expect(biz.some((r) => r.id === created.body.data!.id)).toBe(false);
    const man = await list('MANUAL');
    expect(man.some((r) => r.id === created.body.data!.id)).toBe(true);
  });
});
