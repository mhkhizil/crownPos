import { ZakatPeriodType } from '../enums/zakat-period-type.enum.js';

export class ZakatPeriodValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ZakatPeriodValidationError';
  }
}

export interface ResolveZakatPeriodInput {
  periodType: ZakatPeriodType;
  year?: number | null;
  month?: number | null;
  periodStart?: string | Date | null;
  periodEnd?: string | Date | null;
}

export interface ResolvedZakatPeriod {
  periodType: ZakatPeriodType;
  periodStart: Date;
  periodEnd: Date;
  year: number | null;
  month: number | null;
}

function dateOnlyUtc(year: number, monthIndex0: number, day: number): Date {
  return new Date(Date.UTC(year, monthIndex0, day));
}

function parseDateOnly(value: string | Date): Date {
  if (value instanceof Date) {
    return dateOnlyUtc(
      value.getUTCFullYear(),
      value.getUTCMonth(),
      value.getUTCDate(),
    );
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!m) {
    throw new ZakatPeriodValidationError(
      `Invalid date (expected YYYY-MM-DD): ${value}`,
    );
  }
  return dateOnlyUtc(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function lastDayOfMonth(year: number, month1to12: number): number {
  return new Date(Date.UTC(year, month1to12, 0)).getUTCDate();
}

/**
 * Resolve MONTH / YEAR / CUSTOM into inclusive Gregorian date bounds.
 * YEAR with month set → validation error (locked).
 */
export function resolveZakatPeriod(
  input: ResolveZakatPeriodInput,
): ResolvedZakatPeriod {
  if (input.periodType === ZakatPeriodType.MONTH) {
    if (input.year == null || input.month == null) {
      throw new ZakatPeriodValidationError(
        'MONTH period requires year and month',
      );
    }
    if (input.month < 1 || input.month > 12) {
      throw new ZakatPeriodValidationError('month must be 1–12');
    }
    const start = dateOnlyUtc(input.year, input.month - 1, 1);
    const end = dateOnlyUtc(
      input.year,
      input.month - 1,
      lastDayOfMonth(input.year, input.month),
    );
    return {
      periodType: ZakatPeriodType.MONTH,
      periodStart: start,
      periodEnd: end,
      year: input.year,
      month: input.month,
    };
  }

  if (input.periodType === ZakatPeriodType.YEAR) {
    if (input.year == null) {
      throw new ZakatPeriodValidationError('YEAR period requires year');
    }
    if (input.month != null) {
      throw new ZakatPeriodValidationError(
        'YEAR period must not include month',
      );
    }
    return {
      periodType: ZakatPeriodType.YEAR,
      periodStart: dateOnlyUtc(input.year, 0, 1),
      periodEnd: dateOnlyUtc(input.year, 11, 31),
      year: input.year,
      month: null,
    };
  }

  if (input.periodStart == null || input.periodEnd == null) {
    throw new ZakatPeriodValidationError(
      'CUSTOM period requires periodStart and periodEnd',
    );
  }
  const start = parseDateOnly(input.periodStart);
  const end = parseDateOnly(input.periodEnd);
  if (end.getTime() < start.getTime()) {
    throw new ZakatPeriodValidationError(
      'periodEnd must be on or after periodStart',
    );
  }
  return {
    periodType: ZakatPeriodType.CUSTOM,
    periodStart: start,
    periodEnd: end,
    year: null,
    month: null,
  };
}
