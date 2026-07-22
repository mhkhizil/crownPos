import type { ZakatNisabStyle } from '../enums/zakat-nisab-style.enum.js';
import type { ZakatPeriodType } from '../enums/zakat-period-type.enum.js';

export class ZakatPaymentEntity {
  constructor(
    public readonly id: string,
    public readonly companyId: string | null,
    public readonly periodType: ZakatPeriodType,
    public readonly periodStart: Date,
    public readonly periodEnd: Date,
    public readonly year: number | null,
    public readonly month: number | null,
    public readonly amountPaidMmk: number,
    public readonly paidAt: Date,
    public readonly nisabStyle: ZakatNisabStyle | null,
    public readonly calculatedDueMmk: number | null,
    public readonly notes: string | null,
    public readonly createdByUserId: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}

export interface InventoryQtyLine {
  itemType: 'FINISHED_GOOD' | 'RAW_MATERIAL';
  productSkuId: string | null;
  rawMaterialId: string | null;
  quantityAvailable: number;
}

export interface StockValuationLine {
  itemType: 'FINISHED_GOOD' | 'RAW_MATERIAL';
  productSkuId: string | null;
  rawMaterialId: string | null;
  quantity: number;
  unitPriceMmk: number;
  lineValueMmk: number;
  priceSource: string;
  warning: string | null;
}

export interface ZakatWealthSnapshot {
  receivablesMmk: number;
  finishedGoodsValueMmk: number;
  rawMaterialsValueMmk: number;
  excludedPhysicalAssetsMmk: number;
  stockLines: StockValuationLine[];
  warnings: string[];
}
