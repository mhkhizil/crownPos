import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import type {
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
} from '../../../domain/entities/bd-analytics.entity.js';
import { DigitalAssetType } from '../../../domain/enums/digital-asset-type.enum.js';
import { PhysicalAssetType } from '../../../domain/enums/physical-asset-type.enum.js';
import { PotentialVolumeBand } from '../../../domain/enums/potential-volume-band.enum.js';
import { SalesAnalysisPeriod } from '../../../domain/enums/sales-analysis-period.enum.js';
import { TargetPriority } from '../../../domain/enums/target-priority.enum.js';

export class UpsertCustomerTargetDto {
  @ApiProperty() @IsString() @IsNotEmpty() customerId!: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isTarget?: boolean;
  @ApiPropertyOptional({ enum: TargetPriority })
  @IsOptional()
  @IsEnum(TargetPriority)
  priority?: TargetPriority;
  @ApiPropertyOptional({ enum: PotentialVolumeBand, nullable: true })
  @IsOptional()
  @IsEnum(PotentialVolumeBand)
  potentialVolume?: PotentialVolumeBand | null;
  @ApiPropertyOptional() @IsOptional() @IsString() salespersonUserId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class CreateDigitalAssetDto {
  @ApiProperty() @IsString() @IsNotEmpty() companyId!: string;
  @ApiProperty({ enum: DigitalAssetType })
  @IsEnum(DigitalAssetType)
  assetType!: DigitalAssetType;
  @ApiProperty() @IsString() @IsNotEmpty() nameEn!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nameMm?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() url?: string;
}

export class CreatePhysicalAssetDto {
  @ApiProperty() @IsString() @IsNotEmpty() companyId!: string;
  @ApiProperty({ enum: PhysicalAssetType })
  @IsEnum(PhysicalAssetType)
  assetType!: PhysicalAssetType;
  @ApiProperty() @IsString() @IsNotEmpty() code!: string;
  @ApiProperty() @IsString() @IsNotEmpty() nameEn!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nameMm?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() plateNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() purchaseDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() purchasePriceMmk?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() bookValueMmk?: number;
}

export class CreateMarketingPlanDto {
  @ApiProperty() @IsString() @IsNotEmpty() companyId!: string;
  @ApiProperty() @IsString() @IsNotEmpty() code!: string;
  @ApiProperty() @IsString() @IsNotEmpty() nameEn!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nameMm?: string;
  @ApiProperty() @IsDateString() startDate!: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() endDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) budgetMmk?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() objectivesEn?: string;
}

export class CreateCampaignDto {
  @ApiPropertyOptional() @IsOptional() @IsString() marketingPlanId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() brandId?: string;
  @ApiProperty() @IsString() @IsNotEmpty() code!: string;
  @ApiProperty() @IsString() @IsNotEmpty() nameEn!: string;
  @ApiProperty() @IsDateString() startDate!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() channel?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() spendMmk?: number;
}

export class BrandAwarenessDto {
  @ApiProperty() @IsString() @IsNotEmpty() brandId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() campaignId?: string;
  @ApiProperty() @IsDateString() recordDate!: string;
  @ApiProperty() @IsString() @IsNotEmpty() metricKey!: string;
  @ApiProperty() @IsNumber() metricValue!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() source?: string;
}

export class SalesAnalysisQueryDto {
  @ApiProperty({
    enum: SalesAnalysisPeriod,
    description: 'Bucket granularity: DAILY | MONTHLY | YEARLY',
  })
  @IsEnum(SalesAnalysisPeriod)
  period!: SalesAnalysisPeriod;

  @ApiPropertyOptional({
    example: '2026-01-01',
    description:
      'Inclusive start date (YYYY-MM-DD). Defaults by period: DAILY last 30d, MONTHLY last 12m, YEARLY last 5y.',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    example: '2026-07-19',
    description: 'Inclusive end date (YYYY-MM-DD). Defaults to today (UTC).',
  })
  @IsOptional()
  @IsDateString()
  to?: string;
}

function copy<T extends object>(Ctor: new () => T, data: Partial<T>): T {
  const d = new Ctor();
  Object.assign(d, data);
  return d;
}

export class CustomerTargetResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() customerId!: string;
  @ApiProperty() isTarget!: boolean;
  @ApiProperty({ enum: TargetPriority }) priority!: TargetPriority;
  static fromEntity(e: CustomerTargetEntity) {
    return copy(CustomerTargetResponseDto, {
      id: e.id,
      customerId: e.customerId,
      isTarget: e.isTarget,
      priority: e.priority,
    });
  }
}

export class DigitalAssetResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() nameEn!: string;
  @ApiProperty({ enum: DigitalAssetType }) assetType!: DigitalAssetType;
  static fromEntity(e: DigitalAssetEntity) {
    return copy(DigitalAssetResponseDto, {
      id: e.id,
      nameEn: e.nameEn,
      assetType: e.assetType,
    });
  }
}

export class PhysicalAssetResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() code!: string;
  @ApiProperty() nameEn!: string;
  static fromEntity(e: PhysicalAssetEntity) {
    return copy(PhysicalAssetResponseDto, {
      id: e.id,
      code: e.code,
      nameEn: e.nameEn,
    });
  }
}

export class MarketingPlanResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() code!: string;
  @ApiProperty() nameEn!: string;
  static fromEntity(e: MarketingPlanEntity) {
    return copy(MarketingPlanResponseDto, {
      id: e.id,
      code: e.code,
      nameEn: e.nameEn,
    });
  }
}

export class CampaignResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() code!: string;
  @ApiProperty() nameEn!: string;
  static fromEntity(e: CampaignEntity) {
    return copy(CampaignResponseDto, {
      id: e.id,
      code: e.code,
      nameEn: e.nameEn,
    });
  }
}

export class BrandAwarenessResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() brandId!: string;
  @ApiProperty() metricKey!: string;
  @ApiProperty() metricValue!: number;
  static fromEntity(e: BrandAwarenessEntity) {
    return copy(BrandAwarenessResponseDto, {
      id: e.id,
      brandId: e.brandId,
      metricKey: e.metricKey,
      metricValue: e.metricValue,
    });
  }
}

export class SalesDailyPointResponseDto {
  @ApiProperty({ example: '2026-07-19' }) snapshotDate!: string;
  @ApiProperty() totalOrders!: number;
  @ApiProperty() totalCustomersSold!: number;
  @ApiProperty() totalQtySold!: number;
  @ApiProperty() totalSalesMmk!: number;
  @ApiProperty() totalCollectedMmk!: number;

  static fromEntity(e: SalesDailyPointEntity): SalesDailyPointResponseDto {
    return copy(SalesDailyPointResponseDto, {
      snapshotDate: e.snapshotDate,
      totalOrders: e.totalOrders,
      totalCustomersSold: e.totalCustomersSold,
      totalQtySold: e.totalQtySold,
      totalSalesMmk: e.totalSalesMmk,
      totalCollectedMmk: e.totalCollectedMmk,
    });
  }
}

export class BrandOwnedResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() code!: string;
  @ApiProperty() nameEn!: string;
  @ApiPropertyOptional({ nullable: true }) nameMm!: string | null;

  static fromEntity(e: BrandOwnedEntity): BrandOwnedResponseDto {
    return copy(BrandOwnedResponseDto, {
      id: e.id,
      code: e.code,
      nameEn: e.nameEn,
      nameMm: e.nameMm,
    });
  }
}

export class AnalyticsSummaryResponseDto {
  @ApiProperty() totalCustomers!: number;
  @ApiProperty() totalManufacturedQty!: number;
  @ApiProperty({ type: [SalesDailyPointResponseDto] })
  salesByDay!: SalesDailyPointResponseDto[];
  @ApiProperty({ type: [BrandOwnedResponseDto] })
  brandsOwned!: BrandOwnedResponseDto[];
  @ApiProperty() digitalAssets!: number;
  @ApiProperty() physicalAssets!: number;

  static fromEntity(e: AnalyticsSummaryEntity): AnalyticsSummaryResponseDto {
    return copy(AnalyticsSummaryResponseDto, {
      totalCustomers: e.totalCustomers,
      totalManufacturedQty: e.totalManufacturedQty,
      salesByDay: e.salesByDay.map(SalesDailyPointResponseDto.fromEntity),
      brandsOwned: e.brandsOwned.map(BrandOwnedResponseDto.fromEntity),
      digitalAssets: e.digitalAssets,
      physicalAssets: e.physicalAssets,
    });
  }
}

export class DailySnapshotResponseDto {
  @ApiProperty() date!: string;
  @ApiProperty() refreshed!: boolean;
  @ApiProperty() totalOrders!: number;
  @ApiProperty() totalCustomersSold!: number;
  @ApiProperty() totalQtySold!: number;
  @ApiProperty() totalSalesMmk!: number;
  @ApiProperty() totalCollectedMmk!: number;
  @ApiProperty() totalQuantityProduced!: number;

  static fromEntity(e: DailySnapshotEntity): DailySnapshotResponseDto {
    return copy(DailySnapshotResponseDto, {
      date: e.date,
      refreshed: e.refreshed,
      totalOrders: e.totalOrders,
      totalCustomersSold: e.totalCustomersSold,
      totalQtySold: e.totalQtySold,
      totalSalesMmk: e.totalSalesMmk,
      totalCollectedMmk: e.totalCollectedMmk,
      totalQuantityProduced: e.totalQuantityProduced,
    });
  }
}

export class SalesAnalysisTotalsResponseDto {
  @ApiProperty() totalOrders!: number;
  @ApiProperty() totalCustomersSold!: number;
  @ApiProperty() totalQtySold!: number;
  @ApiProperty() totalSalesMmk!: number;
  @ApiProperty() totalCollectedMmk!: number;
  @ApiProperty() saleOkOrders!: number;
  @ApiProperty() saleOkSalesMmk!: number;

  static fromEntity(
    e: SalesAnalysisTotalsEntity,
  ): SalesAnalysisTotalsResponseDto {
    return copy(SalesAnalysisTotalsResponseDto, {
      totalOrders: e.totalOrders,
      totalCustomersSold: e.totalCustomersSold,
      totalQtySold: e.totalQtySold,
      totalSalesMmk: e.totalSalesMmk,
      totalCollectedMmk: e.totalCollectedMmk,
      saleOkOrders: e.saleOkOrders,
      saleOkSalesMmk: e.saleOkSalesMmk,
    });
  }
}

export class SalesAnalysisBucketResponseDto {
  @ApiProperty({
    description: 'DAILY=YYYY-MM-DD, MONTHLY=YYYY-MM, YEARLY=YYYY',
    example: '2026-07',
  })
  periodKey!: string;
  @ApiProperty() totalOrders!: number;
  @ApiProperty() totalCustomersSold!: number;
  @ApiProperty() totalQtySold!: number;
  @ApiProperty() totalSalesMmk!: number;
  @ApiProperty() totalCollectedMmk!: number;
  @ApiProperty() saleOkOrders!: number;
  @ApiProperty() saleOkSalesMmk!: number;

  static fromEntity(
    e: SalesAnalysisBucketEntity,
  ): SalesAnalysisBucketResponseDto {
    return copy(SalesAnalysisBucketResponseDto, {
      periodKey: e.periodKey,
      totalOrders: e.totalOrders,
      totalCustomersSold: e.totalCustomersSold,
      totalQtySold: e.totalQtySold,
      totalSalesMmk: e.totalSalesMmk,
      totalCollectedMmk: e.totalCollectedMmk,
      saleOkOrders: e.saleOkOrders,
      saleOkSalesMmk: e.saleOkSalesMmk,
    });
  }
}

export class SalesAnalysisResponseDto {
  @ApiProperty({ enum: SalesAnalysisPeriod }) period!: SalesAnalysisPeriod;
  @ApiProperty() from!: string;
  @ApiProperty() to!: string;
  @ApiProperty({ type: SalesAnalysisTotalsResponseDto })
  totals!: SalesAnalysisTotalsResponseDto;
  @ApiProperty({ type: [SalesAnalysisBucketResponseDto] })
  buckets!: SalesAnalysisBucketResponseDto[];

  static fromEntity(e: SalesAnalysisEntity): SalesAnalysisResponseDto {
    return copy(SalesAnalysisResponseDto, {
      period: e.period,
      from: e.from,
      to: e.to,
      totals: SalesAnalysisTotalsResponseDto.fromEntity(e.totals),
      buckets: e.buckets.map(SalesAnalysisBucketResponseDto.fromEntity),
    });
  }
}
