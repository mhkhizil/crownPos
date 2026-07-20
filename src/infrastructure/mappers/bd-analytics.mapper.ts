import {
  AnalyticsSummaryEntity,
  BrandAwarenessEntity,
  BrandOwnedEntity,
  CampaignEntity,
  CustomerTargetEntity,
  DailySnapshotEntity,
  DigitalAssetEntity,
  MarketingPlanEntity,
  PhysicalAssetEntity,
  SalesAnalysisBucketEntity,
  SalesAnalysisEntity,
  SalesAnalysisTotalsEntity,
  SalesDailyPointEntity,
} from '../../domain/entities/bd-analytics.entity.js';
import { DigitalAssetType } from '../../domain/enums/digital-asset-type.enum.js';
import { PhysicalAssetType } from '../../domain/enums/physical-asset-type.enum.js';
import { PotentialVolumeBand } from '../../domain/enums/potential-volume-band.enum.js';
import { SalesAnalysisPeriod } from '../../domain/enums/sales-analysis-period.enum.js';
import { TargetPriority } from '../../domain/enums/target-priority.enum.js';

function num(
  v: { toNumber?: () => number } | number | null | undefined,
): number {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  return Number(v);
}

export class BdAnalyticsMapper {
  static target(row: {
    id: string;
    customerId: string;
    isTarget: boolean;
    priority: string;
    potentialVolume: string | null;
    salespersonUserId: string | null;
    notes: string | null;
  }): CustomerTargetEntity {
    return new CustomerTargetEntity(
      row.id,
      row.customerId,
      row.isTarget,
      row.priority as TargetPriority,
      row.potentialVolume as PotentialVolumeBand | null,
      row.salespersonUserId,
      row.notes,
    );
  }

  static digital(row: {
    id: string;
    companyId: string;
    assetType: string;
    nameEn: string;
    nameMm: string | null;
    url: string | null;
  }): DigitalAssetEntity {
    return new DigitalAssetEntity(
      row.id,
      row.companyId,
      row.assetType as DigitalAssetType,
      row.nameEn,
      row.nameMm,
      row.url,
    );
  }

  static physical(row: {
    id: string;
    companyId: string;
    assetType: string;
    code: string;
    nameEn: string;
    nameMm: string | null;
    plateNumber: string | null;
    purchasePriceMmk: { toNumber?: () => number } | number | null;
    bookValueMmk: { toNumber?: () => number } | number | null;
  }): PhysicalAssetEntity {
    return new PhysicalAssetEntity(
      row.id,
      row.companyId,
      row.assetType as PhysicalAssetType,
      row.code,
      row.nameEn,
      row.nameMm,
      row.plateNumber,
      row.purchasePriceMmk == null ? null : num(row.purchasePriceMmk),
      row.bookValueMmk == null ? null : num(row.bookValueMmk),
    );
  }

  static plan(row: {
    id: string;
    companyId: string;
    code: string;
    nameEn: string;
    startDate: Date;
    endDate: Date | null;
    budgetMmk: { toNumber?: () => number } | number | null;
  }): MarketingPlanEntity {
    return new MarketingPlanEntity(
      row.id,
      row.companyId,
      row.code,
      row.nameEn,
      row.startDate,
      row.endDate,
      row.budgetMmk == null ? null : num(row.budgetMmk),
    );
  }

  static campaign(row: {
    id: string;
    code: string;
    nameEn: string;
    startDate: Date;
    channel: string | null;
    spendMmk: { toNumber?: () => number } | number | null;
  }): CampaignEntity {
    return new CampaignEntity(
      row.id,
      row.code,
      row.nameEn,
      row.startDate,
      row.channel,
      row.spendMmk == null ? null : num(row.spendMmk),
    );
  }

  static awareness(row: {
    id: string;
    brandId: string;
    recordDate: Date;
    metricKey: string;
    metricValue: { toNumber?: () => number } | number;
    source: string | null;
  }): BrandAwarenessEntity {
    return new BrandAwarenessEntity(
      row.id,
      row.brandId,
      row.recordDate,
      row.metricKey,
      num(row.metricValue),
      row.source,
    );
  }

  static summary(s: {
    totalCustomers: number;
    totalManufacturedQty: number;
    salesByDay: SalesDailyPointEntity[];
    brandsOwned: BrandOwnedEntity[];
    digitalAssets: number;
    physicalAssets: number;
  }): AnalyticsSummaryEntity {
    return new AnalyticsSummaryEntity(
      s.totalCustomers,
      s.totalManufacturedQty,
      s.salesByDay,
      s.brandsOwned,
      s.digitalAssets,
      s.physicalAssets,
    );
  }

  static salesDailyPoint(row: {
    snapshotDate: Date;
    totalOrders: number;
    totalCustomersSold: number;
    totalQtySold: { toNumber?: () => number } | number;
    totalSalesMmk: { toNumber?: () => number } | number;
    totalCollectedMmk: { toNumber?: () => number } | number;
  }): SalesDailyPointEntity {
    return new SalesDailyPointEntity(
      row.snapshotDate.toISOString().slice(0, 10),
      row.totalOrders,
      row.totalCustomersSold,
      num(row.totalQtySold),
      num(row.totalSalesMmk),
      num(row.totalCollectedMmk),
    );
  }

  static brandOwned(row: {
    id: string;
    code: string;
    nameEn: string;
    nameMm: string | null;
  }): BrandOwnedEntity {
    return new BrandOwnedEntity(row.id, row.code, row.nameEn, row.nameMm);
  }

  static snapshot(data: {
    date: string;
    totalOrders: number;
    totalCustomersSold: number;
    totalQtySold: number;
    totalSalesMmk: number;
    totalCollectedMmk: number;
    totalQuantityProduced: number;
  }): DailySnapshotEntity {
    return new DailySnapshotEntity(
      data.date,
      true,
      data.totalOrders,
      data.totalCustomersSold,
      data.totalQtySold,
      data.totalSalesMmk,
      data.totalCollectedMmk,
      data.totalQuantityProduced,
    );
  }

  static salesAnalysis(data: {
    period: SalesAnalysisPeriod;
    from: string;
    to: string;
    totals: {
      totalOrders: number;
      totalCustomersSold: number;
      totalQtySold: number;
      totalSalesMmk: number;
      totalCollectedMmk: number;
      saleOkOrders: number;
      saleOkSalesMmk: number;
    };
    buckets: Array<{
      periodKey: string;
      totalOrders: number;
      totalCustomersSold: number;
      totalQtySold: number;
      totalSalesMmk: number;
      totalCollectedMmk: number;
      saleOkOrders: number;
      saleOkSalesMmk: number;
    }>;
  }): SalesAnalysisEntity {
    return new SalesAnalysisEntity(
      data.period,
      data.from,
      data.to,
      new SalesAnalysisTotalsEntity(
        data.totals.totalOrders,
        data.totals.totalCustomersSold,
        data.totals.totalQtySold,
        data.totals.totalSalesMmk,
        data.totals.totalCollectedMmk,
        data.totals.saleOkOrders,
        data.totals.saleOkSalesMmk,
      ),
      data.buckets.map(
        (b) =>
          new SalesAnalysisBucketEntity(
            b.periodKey,
            b.totalOrders,
            b.totalCustomersSold,
            b.totalQtySold,
            b.totalSalesMmk,
            b.totalCollectedMmk,
            b.saleOkOrders,
            b.saleOkSalesMmk,
          ),
      ),
    );
  }
}
