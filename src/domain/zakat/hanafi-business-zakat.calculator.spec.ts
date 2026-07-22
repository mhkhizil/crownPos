import { describe, expect, it } from '@jest/globals';
import { ZakatNisabStyle } from '../enums/zakat-nisab-style.enum.js';
import {
  calculateHanafiBusinessZakat,
  ZakatValidationError,
  ZAKAT_GOLD_NISAB_GRAMS,
  ZAKAT_SILVER_NISAB_GRAMS,
  ZAKAT_RATE,
} from './hanafi-business-zakat.calculator.js';

describe('calculateHanafiBusinessZakat', () => {
  const goldPrice = 100_000; // nisab gold = 8_500_000
  const silverPrice = 1_000; // nisab silver = 595_000

  it('Z1: gold exactly at nisab → due 2.5%', () => {
    const nisab = ZAKAT_GOLD_NISAB_GRAMS * goldPrice;
    const r = calculateHanafiBusinessZakat({
      cashOnHandMmk: nisab,
      bankBalanceMmk: 0,
      receivablesMmk: 0,
      finishedGoodsValueMmk: 0,
      rawMaterialsValueMmk: 0,
      payablesMmk: 0,
      haulCompleted: true,
      nisabStyle: ZakatNisabStyle.GOLD,
      goldPricePerGramMmk: goldPrice,
    });
    expect(r.meetsNisab).toBe(true);
    expect(r.zakatDueMmk).toBe(Math.round(nisab * ZAKAT_RATE * 100) / 100);
  });

  it('Z2: gold one kyat below nisab → no zakat', () => {
    const nisab = ZAKAT_GOLD_NISAB_GRAMS * goldPrice;
    const r = calculateHanafiBusinessZakat({
      cashOnHandMmk: nisab - 1,
      bankBalanceMmk: 0,
      receivablesMmk: 0,
      finishedGoodsValueMmk: 0,
      rawMaterialsValueMmk: 0,
      payablesMmk: 0,
      haulCompleted: true,
      nisabStyle: ZakatNisabStyle.GOLD,
      goldPricePerGramMmk: goldPrice,
    });
    expect(r.meetsNisab).toBe(false);
    expect(r.zakatDueMmk).toBe(0);
    expect(r.notDueReason).toBe('BELOW_NISAB');
  });

  it('Z3: same modest wealth — silver due, gold not', () => {
    const wealth = 1_000_000; // > silver nisab 595k, < gold 8.5M
    const silver = calculateHanafiBusinessZakat({
      cashOnHandMmk: wealth,
      bankBalanceMmk: 0,
      receivablesMmk: 0,
      finishedGoodsValueMmk: 0,
      rawMaterialsValueMmk: 0,
      payablesMmk: 0,
      haulCompleted: true,
      nisabStyle: ZakatNisabStyle.SILVER,
      silverPricePerGramMmk: silverPrice,
    });
    const gold = calculateHanafiBusinessZakat({
      cashOnHandMmk: wealth,
      bankBalanceMmk: 0,
      receivablesMmk: 0,
      finishedGoodsValueMmk: 0,
      rawMaterialsValueMmk: 0,
      payablesMmk: 0,
      haulCompleted: true,
      nisabStyle: ZakatNisabStyle.GOLD,
      goldPricePerGramMmk: goldPrice,
    });
    expect(silver.zakatDueMmk).toBeGreaterThan(0);
    expect(gold.zakatDueMmk).toBe(0);
    expect(silver.nisabWeightGrams).toBe(ZAKAT_SILVER_NISAB_GRAMS);
  });

  it('Z4: haul false even above nisab → 0', () => {
    const r = calculateHanafiBusinessZakat({
      cashOnHandMmk: 10_000_000,
      bankBalanceMmk: 0,
      receivablesMmk: 0,
      finishedGoodsValueMmk: 0,
      rawMaterialsValueMmk: 0,
      payablesMmk: 0,
      haulCompleted: false,
      nisabStyle: ZakatNisabStyle.SILVER,
      silverPricePerGramMmk: silverPrice,
    });
    expect(r.zakatDueMmk).toBe(0);
    expect(r.notDueReason).toBe('HAUL_NOT_COMPLETED');
  });

  it('Z5: payables reduce net below nisab', () => {
    const r = calculateHanafiBusinessZakat({
      cashOnHandMmk: 1_000_000,
      bankBalanceMmk: 0,
      receivablesMmk: 0,
      finishedGoodsValueMmk: 0,
      rawMaterialsValueMmk: 0,
      payablesMmk: 500_000,
      haulCompleted: true,
      nisabStyle: ZakatNisabStyle.SILVER,
      silverPricePerGramMmk: silverPrice,
    });
    expect(r.netZakatableMmk).toBe(500_000);
    expect(r.zakatDueMmk).toBe(0);
  });

  it('Z6: payables > assets → net 0', () => {
    const r = calculateHanafiBusinessZakat({
      cashOnHandMmk: 100,
      bankBalanceMmk: 0,
      receivablesMmk: 0,
      finishedGoodsValueMmk: 0,
      rawMaterialsValueMmk: 0,
      payablesMmk: 999,
      haulCompleted: true,
      nisabStyle: ZakatNisabStyle.SILVER,
      silverPricePerGramMmk: silverPrice,
    });
    expect(r.netZakatableMmk).toBe(0);
    expect(r.notDueReason).toBe('ZERO_NET');
  });

  it('Z7: zero everything', () => {
    const r = calculateHanafiBusinessZakat({
      cashOnHandMmk: 0,
      bankBalanceMmk: 0,
      receivablesMmk: 0,
      finishedGoodsValueMmk: 0,
      rawMaterialsValueMmk: 0,
      payablesMmk: 0,
      haulCompleted: true,
      nisabStyle: ZakatNisabStyle.GOLD,
      goldPricePerGramMmk: goldPrice,
    });
    expect(r.zakatDueMmk).toBe(0);
  });

  it('Z8: rate 0.025 with 2dp rounding', () => {
    const r = calculateHanafiBusinessZakat({
      cashOnHandMmk: 1_000_033,
      bankBalanceMmk: 0,
      receivablesMmk: 0,
      finishedGoodsValueMmk: 0,
      rawMaterialsValueMmk: 0,
      payablesMmk: 0,
      haulCompleted: true,
      nisabStyle: ZakatNisabStyle.SILVER,
      silverPricePerGramMmk: silverPrice,
    });
    expect(r.zakatRate).toBe(0.025);
    expect(r.zakatDueMmk).toBe(Math.round(1_000_033 * 0.025 * 100) / 100);
  });

  it('Z9: missing metal price throws', () => {
    expect(() =>
      calculateHanafiBusinessZakat({
        cashOnHandMmk: 1,
        bankBalanceMmk: 0,
        receivablesMmk: 0,
        finishedGoodsValueMmk: 0,
        rawMaterialsValueMmk: 0,
        payablesMmk: 0,
        haulCompleted: true,
        nisabStyle: ZakatNisabStyle.GOLD,
        goldPricePerGramMmk: null,
      }),
    ).toThrow(ZakatValidationError);
  });
});
