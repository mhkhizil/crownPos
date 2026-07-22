import type { ZakatPaymentEntity, ZakatWealthSnapshot } from '../entities/zakat.entity.js';
import type { ZakatNisabStyle } from '../enums/zakat-nisab-style.enum.js';
import type { ZakatPeriodType } from '../enums/zakat-period-type.enum.js';

export const ZAKAT_REPOSITORY = Symbol('ZAKAT_REPOSITORY');

export interface CreateZakatPaymentInput {
  companyId?: string | null;
  periodType: ZakatPeriodType;
  periodStart: Date;
  periodEnd: Date;
  year?: number | null;
  month?: number | null;
  amountPaidMmk: number;
  paidAt: Date;
  nisabStyle?: ZakatNisabStyle | null;
  calculatedDueMmk?: number | null;
  notes?: string | null;
  createdByUserId?: string | null;
}

export interface ListZakatPaymentsFilter {
  from?: Date;
  to?: Date;
  year?: number;
  month?: number;
}

export interface IZakatRepository {
  /** Open trade receivables (excludes DRAFT / CANCELLED / WRITTEN_OFF). */
  sumOpenReceivablesMmk(): Promise<number>;
  /** Value FG at sell price + raw at last cost; sum physical asset book values as excluded. */
  getWealthSnapshot(): Promise<ZakatWealthSnapshot>;
  createPayment(data: CreateZakatPaymentInput): Promise<ZakatPaymentEntity>;
  listPayments(filter: ListZakatPaymentsFilter): Promise<ZakatPaymentEntity[]>;
  listPaymentsOverlapping(
    from: Date,
    to: Date,
  ): Promise<ZakatPaymentEntity[]>;
  softDeletePayment(id: string): Promise<ZakatPaymentEntity | null>;
}
