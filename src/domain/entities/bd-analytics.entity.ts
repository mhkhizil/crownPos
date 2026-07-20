import type { DigitalAssetType } from '../enums/digital-asset-type.enum.js';
import type { PhysicalAssetType } from '../enums/physical-asset-type.enum.js';
import type { PotentialVolumeBand } from '../enums/potential-volume-band.enum.js';
import type { SalesAnalysisPeriod } from '../enums/sales-analysis-period.enum.js';
import type { TargetPriority } from '../enums/target-priority.enum.js';

export class CustomerTargetEntity {
  constructor(
    public readonly id: string,
    public readonly customerId: string,
    public readonly isTarget: boolean,
    public readonly priority: TargetPriority,
    public readonly potentialVolume: PotentialVolumeBand | null,
    public readonly salespersonUserId: string | null,
    public readonly notes: string | null,
  ) {}
}

export class DigitalAssetEntity {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly assetType: DigitalAssetType,
    public readonly nameEn: string,
    public readonly nameMm: string | null,
    public readonly url: string | null,
  ) {}
}

export class PhysicalAssetEntity {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly assetType: PhysicalAssetType,
    public readonly code: string,
    public readonly nameEn: string,
    public readonly nameMm: string | null,
    public readonly plateNumber: string | null,
    public readonly purchasePriceMmk: number | null,
    public readonly bookValueMmk: number | null,
  ) {}
}

export class MarketingPlanEntity {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly code: string,
    public readonly nameEn: string,
    public readonly startDate: Date,
    public readonly endDate: Date | null,
    public readonly budgetMmk: number | null,
  ) {}
}

export class CampaignEntity {
  constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly nameEn: string,
    public readonly startDate: Date,
    public readonly channel: string | null,
    public readonly spendMmk: number | null,
  ) {}
}

export class BrandAwarenessEntity {
  constructor(
    public readonly id: string,
    public readonly brandId: string,
    public readonly recordDate: Date,
    public readonly metricKey: string,
    public readonly metricValue: number,
    public readonly source: string | null,
  ) {}
}

export class BrandOwnedEntity {
  constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly nameEn: string,
    public readonly nameMm: string | null,
  ) {}
}

export class SalesDailyPointEntity {
  constructor(
    public readonly snapshotDate: string,
    public readonly totalOrders: number,
    public readonly totalCustomersSold: number,
    public readonly totalQtySold: number,
    public readonly totalSalesMmk: number,
    public readonly totalCollectedMmk: number,
  ) {}
}

export class AnalyticsSummaryEntity {
  constructor(
    public readonly totalCustomers: number,
    public readonly totalManufacturedQty: number,
    public readonly salesByDay: SalesDailyPointEntity[],
    public readonly brandsOwned: BrandOwnedEntity[],
    public readonly digitalAssets: number,
    public readonly physicalAssets: number,
  ) {}
}

export class DailySnapshotEntity {
  constructor(
    public readonly date: string,
    public readonly refreshed: boolean,
    public readonly totalOrders: number,
    public readonly totalCustomersSold: number,
    public readonly totalQtySold: number,
    public readonly totalSalesMmk: number,
    public readonly totalCollectedMmk: number,
    public readonly totalQuantityProduced: number,
  ) {}
}

/** One day / month / year bucket in a sales analysis report. */
export class SalesAnalysisBucketEntity {
  constructor(
    public readonly periodKey: string,
    public readonly totalOrders: number,
    public readonly totalCustomersSold: number,
    public readonly totalQtySold: number,
    public readonly totalSalesMmk: number,
    public readonly totalCollectedMmk: number,
    public readonly saleOkOrders: number,
    public readonly saleOkSalesMmk: number,
  ) {}
}

export class SalesAnalysisTotalsEntity {
  constructor(
    public readonly totalOrders: number,
    public readonly totalCustomersSold: number,
    public readonly totalQtySold: number,
    public readonly totalSalesMmk: number,
    public readonly totalCollectedMmk: number,
    public readonly saleOkOrders: number,
    public readonly saleOkSalesMmk: number,
  ) {}
}

export class SalesAnalysisEntity {
  constructor(
    public readonly period: SalesAnalysisPeriod,
    public readonly from: string,
    public readonly to: string,
    public readonly totals: SalesAnalysisTotalsEntity,
    public readonly buckets: SalesAnalysisBucketEntity[],
  ) {}
}
