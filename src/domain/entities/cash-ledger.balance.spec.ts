import { describe, expect, it } from '@jest/globals';
import { CashFlowView } from '../enums/cash-flow-view.enum.js';
import { CashLedgerAccount } from '../enums/cash-ledger-account.enum.js';
import { CashLedgerDirection } from '../enums/cash-ledger-direction.enum.js';
import { CashLedgerSource } from '../enums/cash-ledger-source.enum.js';

type Row = {
  account: CashLedgerAccount;
  direction: CashLedgerDirection;
  source: CashLedgerSource;
  amountMmk: number;
};

function filterByView(rows: Row[], view: CashFlowView): Row[] {
  if (view === CashFlowView.BUSINESS) {
    return rows.filter((r) => r.source === CashLedgerSource.BUSINESS);
  }
  if (view === CashFlowView.MANUAL) {
    return rows.filter((r) => r.source === CashLedgerSource.MANUAL);
  }
  return rows;
}

function computeBalances(rows: Row[]): {
  cashOnHandMmk: number;
  bankBalanceMmk: number;
  totalInflowsMmk: number;
  totalOutflowsMmk: number;
} {
  let cashIn = 0;
  let cashOut = 0;
  let bankIn = 0;
  let bankOut = 0;
  let totalInflowsMmk = 0;
  let totalOutflowsMmk = 0;
  for (const r of rows) {
    if (r.direction === CashLedgerDirection.INFLOW) {
      totalInflowsMmk += r.amountMmk;
      if (r.account === CashLedgerAccount.CASH) cashIn += r.amountMmk;
      else bankIn += r.amountMmk;
    } else {
      totalOutflowsMmk += r.amountMmk;
      if (r.account === CashLedgerAccount.CASH) cashOut += r.amountMmk;
      else bankOut += r.amountMmk;
    }
  }
  const round2 = (n: number) => Math.round(n * 100) / 100;
  return {
    cashOnHandMmk: round2(Math.max(0, cashIn - cashOut)),
    bankBalanceMmk: round2(Math.max(0, bankIn - bankOut)),
    totalInflowsMmk: round2(totalInflowsMmk),
    totalOutflowsMmk: round2(totalOutflowsMmk),
  };
}

const fixture: Row[] = [
  {
    account: CashLedgerAccount.CASH,
    direction: CashLedgerDirection.INFLOW,
    source: CashLedgerSource.BUSINESS,
    amountMmk: 80_000,
  },
  {
    account: CashLedgerAccount.BANK,
    direction: CashLedgerDirection.INFLOW,
    source: CashLedgerSource.BUSINESS,
    amountMmk: 120_000,
  },
  {
    account: CashLedgerAccount.BANK,
    direction: CashLedgerDirection.OUTFLOW,
    source: CashLedgerSource.BUSINESS,
    amountMmk: 50_000,
  },
  {
    account: CashLedgerAccount.BANK,
    direction: CashLedgerDirection.INFLOW,
    source: CashLedgerSource.MANUAL,
    amountMmk: 1_000_000,
  },
  {
    account: CashLedgerAccount.CASH,
    direction: CashLedgerDirection.OUTFLOW,
    source: CashLedgerSource.MANUAL,
    amountMmk: 20_000,
  },
  {
    account: CashLedgerAccount.BANK,
    direction: CashLedgerDirection.OUTFLOW,
    source: CashLedgerSource.MANUAL,
    amountMmk: 30_000,
  },
];

describe('cash ledger balance math (pure)', () => {
  it('nets inflows and outflows per account with floor 0', () => {
    const overdraft: Row[] = [
      {
        account: CashLedgerAccount.BANK,
        direction: CashLedgerDirection.INFLOW,
        source: CashLedgerSource.MANUAL,
        amountMmk: 100,
      },
      {
        account: CashLedgerAccount.BANK,
        direction: CashLedgerDirection.OUTFLOW,
        source: CashLedgerSource.MANUAL,
        amountMmk: 250,
      },
    ];
    const b = computeBalances(overdraft);
    expect(b.bankBalanceMmk).toBe(0);
    expect(b.totalOutflowsMmk).toBe(250);
    expect(b.totalInflowsMmk).toBe(100);
  });

  it('view isolation: BUSINESS excludes MANUAL', () => {
    const biz = filterByView(fixture, CashFlowView.BUSINESS);
    expect(biz.every((r) => r.source === CashLedgerSource.BUSINESS)).toBe(true);
    expect(biz).toHaveLength(3);
    const man = filterByView(fixture, CashFlowView.MANUAL);
    expect(man.every((r) => r.source === CashLedgerSource.MANUAL)).toBe(true);
    expect(man).toHaveLength(3);
  });

  it('TOTAL inflows/outflows = BUSINESS + MANUAL (identity)', () => {
    const b = computeBalances(filterByView(fixture, CashFlowView.BUSINESS));
    const m = computeBalances(filterByView(fixture, CashFlowView.MANUAL));
    const t = computeBalances(filterByView(fixture, CashFlowView.TOTAL));
    expect(t.totalInflowsMmk).toBe(b.totalInflowsMmk + m.totalInflowsMmk);
    expect(t.totalOutflowsMmk).toBe(b.totalOutflowsMmk + m.totalOutflowsMmk);
  });

  it('worksheet F hand check (do not sum view cashOnHand fields)', () => {
    const b = computeBalances(filterByView(fixture, CashFlowView.BUSINESS));
    const m = computeBalances(filterByView(fixture, CashFlowView.MANUAL));
    const t = computeBalances(filterByView(fixture, CashFlowView.TOTAL));
    expect(b.cashOnHandMmk).toBe(80_000);
    expect(b.bankBalanceMmk).toBe(70_000);
    expect(m.cashOnHandMmk).toBe(0);
    expect(m.bankBalanceMmk).toBe(970_000);
    // TOTAL recomputed from all rows
    expect(t.cashOnHandMmk).toBe(60_000); // 80k - 20k
    expect(t.bankBalanceMmk).toBe(1_040_000); // 120k+1M - 50k - 30k
    // Wrong approach: summing view cashOnHand would be 80k+0 = 80k ≠ 60k
    expect(b.cashOnHandMmk + m.cashOnHandMmk).not.toBe(t.cashOnHandMmk);
  });
});
