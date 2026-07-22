import { ZakatNisabStyle } from '../enums/zakat-nisab-style.enum.js';

/** Classical Hanafi weights (grams). */
export const ZAKAT_GOLD_NISAB_GRAMS = 85;
export const ZAKAT_SILVER_NISAB_GRAMS = 595;
export const ZAKAT_RATE = 0.025;

export type ZakatNotDueReason =
  | 'HAUL_NOT_COMPLETED'
  | 'BELOW_NISAB'
  | 'ZERO_NET'
  | null;

export interface HanafiZakatWealthInput {
  cashOnHandMmk: number;
  bankBalanceMmk: number;
  receivablesMmk: number;
  finishedGoodsValueMmk: number;
  rawMaterialsValueMmk: number;
  payablesMmk: number;
  haulCompleted: boolean;
  nisabStyle: ZakatNisabStyle;
  goldPricePerGramMmk?: number | null;
  silverPricePerGramMmk?: number | null;
}

export interface HanafiZakatCalculationResult {
  nisabStyle: ZakatNisabStyle;
  nisabWeightGrams: number;
  pricePerGramMmk: number;
  nisabMmk: number;
  cashOnHandMmk: number;
  bankBalanceMmk: number;
  receivablesMmk: number;
  finishedGoodsValueMmk: number;
  rawMaterialsValueMmk: number;
  payablesMmk: number;
  netZakatableMmk: number;
  meetsNisab: boolean;
  haulCompleted: boolean;
  zakatRate: number;
  zakatDueMmk: number;
  notDueReason: ZakatNotDueReason;
}

export class ZakatValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ZakatValidationError';
  }
}

export function roundMmk2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Pure Hanafi business-zakat math (no IO).
 * Net = cash + bank + AR + FG + raw − payables (floored at 0).
 */
export function calculateHanafiBusinessZakat(
  input: HanafiZakatWealthInput,
): HanafiZakatCalculationResult {
  const nisabWeightGrams =
    input.nisabStyle === ZakatNisabStyle.GOLD
      ? ZAKAT_GOLD_NISAB_GRAMS
      : ZAKAT_SILVER_NISAB_GRAMS;

  const pricePerGramMmk =
    input.nisabStyle === ZakatNisabStyle.GOLD
      ? input.goldPricePerGramMmk
      : input.silverPricePerGramMmk;

  if (pricePerGramMmk == null || !(pricePerGramMmk > 0)) {
    throw new ZakatValidationError(
      `Missing or invalid ${input.nisabStyle === ZakatNisabStyle.GOLD ? 'gold' : 'silver'}PricePerGramMmk`,
    );
  }

  const cashOnHandMmk = Math.max(0, input.cashOnHandMmk);
  const bankBalanceMmk = Math.max(0, input.bankBalanceMmk);
  const receivablesMmk = Math.max(0, input.receivablesMmk);
  const finishedGoodsValueMmk = Math.max(0, input.finishedGoodsValueMmk);
  const rawMaterialsValueMmk = Math.max(0, input.rawMaterialsValueMmk);
  const payablesMmk = Math.max(0, input.payablesMmk);

  const gross =
    cashOnHandMmk +
    bankBalanceMmk +
    receivablesMmk +
    finishedGoodsValueMmk +
    rawMaterialsValueMmk;
  const netZakatableMmk = roundMmk2(Math.max(0, gross - payablesMmk));
  const nisabMmk = roundMmk2(nisabWeightGrams * pricePerGramMmk);
  const meetsNisab = netZakatableMmk >= nisabMmk;

  let zakatDueMmk = 0;
  let notDueReason: ZakatNotDueReason = null;

  if (!input.haulCompleted) {
    notDueReason = 'HAUL_NOT_COMPLETED';
  } else if (netZakatableMmk <= 0) {
    notDueReason = 'ZERO_NET';
  } else if (!meetsNisab) {
    notDueReason = 'BELOW_NISAB';
  } else {
    zakatDueMmk = roundMmk2(netZakatableMmk * ZAKAT_RATE);
  }

  return {
    nisabStyle: input.nisabStyle,
    nisabWeightGrams,
    pricePerGramMmk,
    nisabMmk,
    cashOnHandMmk,
    bankBalanceMmk,
    receivablesMmk,
    finishedGoodsValueMmk,
    rawMaterialsValueMmk,
    payablesMmk,
    netZakatableMmk,
    meetsNisab,
    haulCompleted: input.haulCompleted,
    zakatRate: ZAKAT_RATE,
    zakatDueMmk,
    notDueReason,
  };
}
