import { describe, expect, it } from '@jest/globals';
import { ZakatPeriodType } from '../enums/zakat-period-type.enum.js';
import {
  resolveZakatPeriod,
  ZakatPeriodValidationError,
} from './resolve-zakat-period.js';

describe('resolveZakatPeriod', () => {
  it('P1: MONTH 2026-02', () => {
    const r = resolveZakatPeriod({
      periodType: ZakatPeriodType.MONTH,
      year: 2026,
      month: 2,
    });
    expect(r.periodStart.toISOString().slice(0, 10)).toBe('2026-02-01');
    expect(r.periodEnd.toISOString().slice(0, 10)).toBe('2026-02-28');
  });

  it('P2: leap Feb 2024', () => {
    const r = resolveZakatPeriod({
      periodType: ZakatPeriodType.MONTH,
      year: 2024,
      month: 2,
    });
    expect(r.periodEnd.toISOString().slice(0, 10)).toBe('2024-02-29');
  });

  it('P3: YEAR 2026', () => {
    const r = resolveZakatPeriod({
      periodType: ZakatPeriodType.YEAR,
      year: 2026,
    });
    expect(r.periodStart.toISOString().slice(0, 10)).toBe('2026-01-01');
    expect(r.periodEnd.toISOString().slice(0, 10)).toBe('2026-12-31');
  });

  it('P4: CUSTOM end < start', () => {
    expect(() =>
      resolveZakatPeriod({
        periodType: ZakatPeriodType.CUSTOM,
        periodStart: '2026-04-01',
        periodEnd: '2026-01-01',
      }),
    ).toThrow(ZakatPeriodValidationError);
  });

  it('P5: MONTH missing fields', () => {
    expect(() =>
      resolveZakatPeriod({ periodType: ZakatPeriodType.MONTH, year: 2026 }),
    ).toThrow(ZakatPeriodValidationError);
  });

  it('P6: YEAR with month → 400-class error', () => {
    expect(() =>
      resolveZakatPeriod({
        periodType: ZakatPeriodType.YEAR,
        year: 2026,
        month: 7,
      }),
    ).toThrow(ZakatPeriodValidationError);
  });
});
