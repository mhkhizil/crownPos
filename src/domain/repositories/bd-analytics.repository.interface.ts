import type {
  AnalyticsSummaryEntity,
  BrandAwarenessEntity,
  CampaignEntity,
  CustomerTargetEntity,
  DailySnapshotEntity,
  DigitalAssetEntity,
  MarketingPlanEntity,
  PhysicalAssetEntity,
  SalesAnalysisEntity,
} from '../entities/bd-analytics.entity.js';
import type { DigitalAssetType } from '../enums/digital-asset-type.enum.js';
import type { PhysicalAssetType } from '../enums/physical-asset-type.enum.js';
import type { PotentialVolumeBand } from '../enums/potential-volume-band.enum.js';
import type { SalesAnalysisPeriod } from '../enums/sales-analysis-period.enum.js';
import type { TargetPriority } from '../enums/target-priority.enum.js';

export const BD_ANALYTICS_REPOSITORY = Symbol('BD_ANALYTICS_REPOSITORY');

export interface UpsertCustomerTargetInput {
  customerId: string;
  isTarget?: boolean;
  priority?: TargetPriority;
  potentialVolume?: PotentialVolumeBand | null;
  salespersonUserId?: string | null;
  notes?: string | null;
}

export interface CreateDigitalAssetInput {
  companyId: string;
  assetType: DigitalAssetType;
  nameEn: string;
  nameMm?: string | null;
  url?: string | null;
}

export interface CreatePhysicalAssetInput {
  companyId: string;
  assetType: PhysicalAssetType;
  code: string;
  nameEn: string;
  nameMm?: string | null;
  plateNumber?: string | null;
  purchaseDate?: string | null;
  purchasePriceMmk?: number | null;
  bookValueMmk?: number | null;
}

export interface CreateMarketingPlanInput {
  companyId: string;
  code: string;
  nameEn: string;
  nameMm?: string | null;
  startDate: string;
  endDate?: string;
  budgetMmk?: number | null;
  objectivesEn?: string | null;
}

export interface CreateCampaignInput {
  marketingPlanId?: string | null;
  brandId?: string | null;
  code: string;
  nameEn: string;
  startDate: string;
  channel?: string | null;
  spendMmk?: number | null;
}

export interface BrandAwarenessInput {
  brandId: string;
  campaignId?: string | null;
  recordDate: string;
  metricKey: string;
  metricValue: number;
  source?: string | null;
}

export interface SalesAnalysisQuery {
  period: SalesAnalysisPeriod;
  from: string;
  to: string;
}

export interface IBdAnalyticsRepository {
  upsertCustomerTarget(
    data: UpsertCustomerTargetInput,
  ): Promise<CustomerTargetEntity>;
  createDigitalAsset(data: CreateDigitalAssetInput): Promise<DigitalAssetEntity>;
  createPhysicalAsset(
    data: CreatePhysicalAssetInput,
  ): Promise<PhysicalAssetEntity>;
  listDigitalAssets(): Promise<DigitalAssetEntity[]>;
  listPhysicalAssets(): Promise<PhysicalAssetEntity[]>;
  createMarketingPlan(
    data: CreateMarketingPlanInput,
  ): Promise<MarketingPlanEntity>;
  createCampaign(data: CreateCampaignInput): Promise<CampaignEntity>;
  recordBrandAwareness(
    data: BrandAwarenessInput,
  ): Promise<BrandAwarenessEntity>;
  getAnalyticsSummary(): Promise<AnalyticsSummaryEntity>;
  getSalesAnalysis(query: SalesAnalysisQuery): Promise<SalesAnalysisEntity>;
  refreshDailySnapshots(date: string): Promise<DailySnapshotEntity>;
}
