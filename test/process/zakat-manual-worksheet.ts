/**
 * Locked M1–M5 worksheet constants for system-vs-manual zakat verifies.
 * Arrange zeros other stock/AR so only these numbers feed calculate.
 */
export const ZAKAT_MANUAL = {
  fgQty: 100,
  fgSellPriceMmk: 1_000,
  rawQty: 50,
  rawCostMmk: 200,
  arMmk: 50_000,
  excludedBookValueMmk: 5_000_000,
  /** silver nisab = 595 * 1_000 = 595_000 */
  silverPricePerGramMmk: 1_000,
  /** gold nisab = 85 * 100_000 = 8_500_000 */
  goldPricePerGramMmk: 100_000,
} as const;

export function stockFgValue(): number {
  return ZAKAT_MANUAL.fgQty * ZAKAT_MANUAL.fgSellPriceMmk;
}

export function stockRawValue(): number {
  return ZAKAT_MANUAL.rawQty * ZAKAT_MANUAL.rawCostMmk;
}

/** Base trade wealth before cash/bank/payables: FG + raw + AR */
export function baseTradeWealthMmk(): number {
  return stockFgValue() + stockRawValue() + ZAKAT_MANUAL.arMmk;
}

export function handZakatDue(opts: {
  cash: number;
  bank: number;
  payables: number;
  haulCompleted: boolean;
  style: 'GOLD' | 'SILVER';
}): {
  nisabMmk: number;
  netZakatableMmk: number;
  meetsNisab: boolean;
  zakatDueMmk: number;
} {
  const price =
    opts.style === 'GOLD'
      ? ZAKAT_MANUAL.goldPricePerGramMmk
      : ZAKAT_MANUAL.silverPricePerGramMmk;
  const weight = opts.style === 'GOLD' ? 85 : 595;
  const nisabMmk = Math.round(weight * price * 100) / 100;
  const gross =
    opts.cash +
    opts.bank +
    baseTradeWealthMmk();
  const netZakatableMmk = Math.round(Math.max(0, gross - opts.payables) * 100) / 100;
  const meetsNisab = netZakatableMmk >= nisabMmk;
  let zakatDueMmk = 0;
  if (opts.haulCompleted && meetsNisab && netZakatableMmk > 0) {
    zakatDueMmk = Math.round(netZakatableMmk * 0.025 * 100) / 100;
  }
  return { nisabMmk, netZakatableMmk, meetsNisab, zakatDueMmk };
}

/** M1–M5 scenario bodies (cash/bank/payables/haul/style). */
export const M_SCENARIOS = [
  {
    id: 'M1',
    intent: 'Above silver nisab, below gold',
    nisabStyle: 'SILVER' as const,
    cashOnHandMmk: 500_000,
    bankBalanceMmk: 0,
    payablesMmk: 0,
    haulCompleted: true,
  },
  {
    id: 'M2',
    intent: 'Same wealth as M1, GOLD style → below nisab',
    nisabStyle: 'GOLD' as const,
    cashOnHandMmk: 500_000,
    bankBalanceMmk: 0,
    payablesMmk: 0,
    haulCompleted: true,
  },
  {
    id: 'M3',
    intent: 'Large cash + stock + AR, haul true',
    nisabStyle: 'GOLD' as const,
    cashOnHandMmk: 10_000_000,
    bankBalanceMmk: 2_000_000,
    payablesMmk: 100_000,
    haulCompleted: true,
  },
  {
    id: 'M4',
    intent: 'Haul false despite large net',
    nisabStyle: 'SILVER' as const,
    cashOnHandMmk: 10_000_000,
    bankBalanceMmk: 0,
    payablesMmk: 0,
    haulCompleted: false,
  },
  {
    id: 'M5',
    intent: 'Payables push net under silver nisab',
    nisabStyle: 'SILVER' as const,
    cashOnHandMmk: 400_000,
    bankBalanceMmk: 0,
    payablesMmk: 200_000,
    haulCompleted: true,
  },
] as const;
