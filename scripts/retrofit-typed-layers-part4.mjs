/**
 * Part 4: master-data + bd-analytics
 * Run: node scripts/retrofit-typed-layers-part4.mjs
 */
import fs from 'fs';
import path from 'path';

const root = process.cwd();
function w(rel, content) {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content.replace(/\r?\n/g, '\n'));
  console.log('✓', rel);
}
function numHelper() {
  return `function num(v: { toNumber?: () => number } | number | null | undefined): number {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  return Number(v);
}
`;
}

w(
  'src/domain/entities/master-data.entity.ts',
  `export class NamedCodeEntity {
  constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly nameEn: string,
    public readonly nameMm: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
    public readonly extra: Record<string, string | number | null> = {},
  ) {}
}

export class ProductEntity {
  constructor(
    public readonly id: string,
    public readonly brandId: string,
    public readonly code: string,
    public readonly nameEn: string,
    public readonly nameMm: string | null,
    public readonly description: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}

export class ProductSkuEntity {
  constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly unitId: string,
    public readonly code: string,
    public readonly nameEn: string,
    public readonly nameMm: string | null,
    public readonly packSize: number | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}

export class CityEntity {
  constructor(
    public readonly id: string,
    public readonly regionId: string,
    public readonly code: string,
    public readonly nameEn: string,
    public readonly nameMm: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}

export class GateEntity {
  constructor(
    public readonly id: string,
    public readonly cityId: string,
    public readonly parentGateId: string | null,
    public readonly code: string,
    public readonly nameEn: string,
    public readonly nameMm: string | null,
    public readonly gateType: string,
    public readonly phone: string | null,
    public readonly addressEn: string | null,
    public readonly coveredCityIds: string[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}

export class CustomerEntity {
  constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly customerType: string,
    public readonly shopType: string | null,
    public readonly nameEn: string,
    public readonly nameMm: string | null,
    public readonly phone: string | null,
    public readonly cityId: string,
    public readonly preferredGateId: string | null,
    public readonly addressEn: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}

export class SupplierEntity {
  constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly nameEn: string,
    public readonly nameMm: string | null,
    public readonly phone: string | null,
    public readonly addressEn: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}

export class RawMaterialEntity {
  constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly nameEn: string,
    public readonly nameMm: string | null,
    public readonly unitId: string,
    public readonly description: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}

export class SupplierRawMaterialEntity {
  constructor(
    public readonly id: string,
    public readonly supplierId: string,
    public readonly rawMaterialId: string,
    public readonly unitPriceMmk: number | null,
    public readonly isPreferred: boolean,
  ) {}
}

export class CompanyContextEntity {
  constructor(
    public readonly companies: Array<{
      id: string;
      code: string;
      nameEn: string;
      nameMm: string | null;
      factories: Array<{ id: string; code: string; nameEn: string }>;
      stockLocations: Array<{ id: string; code: string; nameEn: string; isPrimary: boolean }>;
    }>,
  ) {}
}
`,
);

w(
  'src/infrastructure/mappers/master-data.mapper.ts',
  `import type { Prisma } from '@prisma/client';
import {
  CityEntity,
  CompanyContextEntity,
  CustomerEntity,
  GateEntity,
  NamedCodeEntity,
  ProductEntity,
  ProductSkuEntity,
  RawMaterialEntity,
  SupplierEntity,
  SupplierRawMaterialEntity,
} from '../../domain/entities/master-data.entity.js';

${numHelper()}

export class MasterDataMapper {
  static namedCode(
    row: {
      id: string;
      code: string;
      nameEn: string;
      nameMm: string | null;
      createdAt: Date;
      updatedAt: Date;
      deletedAt: Date | null;
      symbol?: string | null;
      description?: string | null;
    },
  ): NamedCodeEntity {
    return new NamedCodeEntity(
      row.id,
      row.code,
      row.nameEn,
      row.nameMm,
      row.createdAt,
      row.updatedAt,
      row.deletedAt,
      {
        symbol: row.symbol ?? null,
        description: row.description ?? null,
      },
    );
  }

  static product(row: Prisma.ProductGetPayload<object>): ProductEntity {
    return new ProductEntity(
      row.id,
      row.brandId,
      row.code,
      row.nameEn,
      row.nameMm,
      row.description,
      row.createdAt,
      row.updatedAt,
      row.deletedAt,
    );
  }

  static sku(row: Prisma.ProductSkuGetPayload<object>): ProductSkuEntity {
    return new ProductSkuEntity(
      row.id,
      row.productId,
      row.unitId,
      row.code,
      row.nameEn,
      row.nameMm,
      row.packSize == null ? null : num(row.packSize),
      row.createdAt,
      row.updatedAt,
      row.deletedAt,
    );
  }

  static city(row: Prisma.CityGetPayload<object>): CityEntity {
    return new CityEntity(
      row.id,
      row.regionId,
      row.code,
      row.nameEn,
      row.nameMm,
      row.createdAt,
      row.updatedAt,
      row.deletedAt,
    );
  }

  static gate(
    row: Prisma.GateGetPayload<{
      include: { cityCoverages: true };
    }>,
  ): GateEntity {
    return new GateEntity(
      row.id,
      row.cityId,
      row.parentGateId,
      row.code,
      row.nameEn,
      row.nameMm,
      row.gateType,
      row.phone,
      row.addressEn,
      (row.cityCoverages ?? [])
        .filter((c) => !c.deletedAt)
        .map((c) => c.cityId),
      row.createdAt,
      row.updatedAt,
      row.deletedAt,
    );
  }

  static customer(row: Prisma.CustomerGetPayload<object>): CustomerEntity {
    return new CustomerEntity(
      row.id,
      row.code,
      row.customerType,
      row.shopType,
      row.nameEn,
      row.nameMm,
      row.phone,
      row.cityId,
      row.preferredGateId,
      row.addressEn,
      row.createdAt,
      row.updatedAt,
      row.deletedAt,
    );
  }

  static supplier(row: Prisma.SupplierGetPayload<object>): SupplierEntity {
    return new SupplierEntity(
      row.id,
      row.code,
      row.nameEn,
      row.nameMm,
      row.phone,
      row.addressEn,
      row.createdAt,
      row.updatedAt,
      row.deletedAt,
    );
  }

  static rawMaterial(row: Prisma.RawMaterialGetPayload<object>): RawMaterialEntity {
    return new RawMaterialEntity(
      row.id,
      row.code,
      row.nameEn,
      row.nameMm,
      row.unitId,
      row.description,
      row.createdAt,
      row.updatedAt,
      row.deletedAt,
    );
  }

  static supplierRaw(
    row: Prisma.SupplierRawMaterialGetPayload<object>,
  ): SupplierRawMaterialEntity {
    return new SupplierRawMaterialEntity(
      row.id,
      row.supplierId,
      row.rawMaterialId,
      row.unitPriceMmk == null ? null : num(row.unitPriceMmk),
      row.isPreferred,
    );
  }

  static companyContext(
    companies: Prisma.CompanyGetPayload<{
      include: { factories: true; stockLocations: true };
    }>[],
  ): CompanyContextEntity {
    return new CompanyContextEntity(
      companies.map((c) => ({
        id: c.id,
        code: c.code,
        nameEn: c.nameEn,
        nameMm: c.nameMm,
        factories: (c.factories ?? [])
          .filter((f) => !f.deletedAt)
          .map((f) => ({ id: f.id, code: f.code, nameEn: f.nameEn })),
        stockLocations: (c.stockLocations ?? [])
          .filter((s) => !s.deletedAt)
          .map((s) => ({
            id: s.id,
            code: s.code,
            nameEn: s.nameEn,
            isPrimary: s.isPrimary,
          })),
      })),
    );
  }
}
`,
);

w(
  'src/application/dtos/master-data/master-data-request.dto.ts',
  `import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateNamedCodeDto {
  @ApiProperty() @IsString() @IsNotEmpty() code!: string;
  @ApiProperty() @IsString() @IsNotEmpty() nameEn!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nameMm?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() symbol?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}

export class CreateProductDto {
  @ApiProperty() @IsString() @IsNotEmpty() brandId!: string;
  @ApiProperty() @IsString() @IsNotEmpty() code!: string;
  @ApiProperty() @IsString() @IsNotEmpty() nameEn!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nameMm?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}

export class CreateProductSkuDto {
  @ApiProperty() @IsString() @IsNotEmpty() productId!: string;
  @ApiProperty() @IsString() @IsNotEmpty() unitId!: string;
  @ApiProperty() @IsString() @IsNotEmpty() code!: string;
  @ApiProperty() @IsString() @IsNotEmpty() nameEn!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nameMm?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) packSize?: number;
}

export class CreateCityDto {
  @ApiProperty() @IsString() @IsNotEmpty() regionId!: string;
  @ApiProperty() @IsString() @IsNotEmpty() code!: string;
  @ApiProperty() @IsString() @IsNotEmpty() nameEn!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nameMm?: string;
}

export enum GateTypeDto {
  MAIN = 'MAIN',
  BRANCH = 'BRANCH',
}

export class CreateGateDto {
  @ApiProperty() @IsString() @IsNotEmpty() cityId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() parentGateId?: string;
  @ApiProperty() @IsString() @IsNotEmpty() code!: string;
  @ApiProperty() @IsString() @IsNotEmpty() nameEn!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nameMm?: string;
  @ApiPropertyOptional({ enum: GateTypeDto }) @IsOptional() @IsEnum(GateTypeDto) gateType?: GateTypeDto;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() addressEn?: string;
}

export class SetGateCoverageDto {
  @ApiProperty({ type: [String] }) @IsArray() @IsString({ each: true }) cityIds!: string[];
}

export enum CustomerTypeDto {
  SHOP = 'SHOP',
  DISTRIBUTOR = 'DISTRIBUTOR',
  END_CUSTOMER = 'END_CUSTOMER',
}

export class CreateCustomerDto {
  @ApiProperty() @IsString() @IsNotEmpty() code!: string;
  @ApiPropertyOptional({ enum: CustomerTypeDto }) @IsOptional() @IsEnum(CustomerTypeDto) customerType?: CustomerTypeDto;
  @ApiPropertyOptional() @IsOptional() @IsString() shopType?: string;
  @ApiProperty() @IsString() @IsNotEmpty() nameEn!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nameMm?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiProperty() @IsString() @IsNotEmpty() cityId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() preferredGateId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() addressEn?: string;
}

export class CreateSupplierDto {
  @ApiProperty() @IsString() @IsNotEmpty() code!: string;
  @ApiProperty() @IsString() @IsNotEmpty() nameEn!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nameMm?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() addressEn?: string;
}

export class CreateRawMaterialDto {
  @ApiProperty() @IsString() @IsNotEmpty() code!: string;
  @ApiProperty() @IsString() @IsNotEmpty() nameEn!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nameMm?: string;
  @ApiProperty() @IsString() @IsNotEmpty() unitId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}

export class LinkSupplierRawMaterialDto {
  @ApiProperty() @IsString() @IsNotEmpty() supplierId!: string;
  @ApiProperty() @IsString() @IsNotEmpty() rawMaterialId!: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() unitPriceMmk?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPreferred?: boolean;
}
`,
);

w(
  'src/application/dtos/master-data/master-data-response.dto.ts',
  `import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  CityEntity,
  CompanyContextEntity,
  CustomerEntity,
  GateEntity,
  NamedCodeEntity,
  ProductEntity,
  ProductSkuEntity,
  RawMaterialEntity,
  SupplierEntity,
  SupplierRawMaterialEntity,
} from '../../../domain/entities/master-data.entity.js';

export class NamedCodeResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() code!: string;
  @ApiProperty() nameEn!: string;
  @ApiPropertyOptional({ nullable: true }) nameMm!: string | null;
  @ApiPropertyOptional() symbol?: string | null;
  @ApiPropertyOptional() description?: string | null;

  static fromEntity(e: NamedCodeEntity): NamedCodeResponseDto {
    const d = new NamedCodeResponseDto();
    d.id = e.id;
    d.code = e.code;
    d.nameEn = e.nameEn;
    d.nameMm = e.nameMm;
    d.symbol = (e.extra.symbol as string | null) ?? null;
    d.description = (e.extra.description as string | null) ?? null;
    return d;
  }
}

export class ProductResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() brandId!: string;
  @ApiProperty() code!: string;
  @ApiProperty() nameEn!: string;
  @ApiPropertyOptional({ nullable: true }) nameMm!: string | null;
  static fromEntity(e: ProductEntity): ProductResponseDto {
    const d = new ProductResponseDto();
    Object.assign(d, {
      id: e.id,
      brandId: e.brandId,
      code: e.code,
      nameEn: e.nameEn,
      nameMm: e.nameMm,
    });
    return d;
  }
}

export class ProductSkuResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() productId!: string;
  @ApiProperty() unitId!: string;
  @ApiProperty() code!: string;
  @ApiProperty() nameEn!: string;
  @ApiPropertyOptional({ nullable: true }) nameMm!: string | null;
  @ApiPropertyOptional({ nullable: true }) packSize!: number | null;
  static fromEntity(e: ProductSkuEntity): ProductSkuResponseDto {
    const d = new ProductSkuResponseDto();
    Object.assign(d, {
      id: e.id,
      productId: e.productId,
      unitId: e.unitId,
      code: e.code,
      nameEn: e.nameEn,
      nameMm: e.nameMm,
      packSize: e.packSize,
    });
    return d;
  }
}

export class CityResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() regionId!: string;
  @ApiProperty() code!: string;
  @ApiProperty() nameEn!: string;
  @ApiPropertyOptional({ nullable: true }) nameMm!: string | null;
  static fromEntity(e: CityEntity): CityResponseDto {
    const d = new CityResponseDto();
    Object.assign(d, {
      id: e.id,
      regionId: e.regionId,
      code: e.code,
      nameEn: e.nameEn,
      nameMm: e.nameMm,
    });
    return d;
  }
}

export class GateResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() cityId!: string;
  @ApiProperty() code!: string;
  @ApiProperty() nameEn!: string;
  @ApiProperty() gateType!: string;
  @ApiProperty({ type: [String] }) coveredCityIds!: string[];
  static fromEntity(e: GateEntity): GateResponseDto {
    const d = new GateResponseDto();
    Object.assign(d, {
      id: e.id,
      cityId: e.cityId,
      code: e.code,
      nameEn: e.nameEn,
      gateType: e.gateType,
      coveredCityIds: e.coveredCityIds,
    });
    return d;
  }
}

export class CustomerResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() code!: string;
  @ApiProperty() customerType!: string;
  @ApiProperty() nameEn!: string;
  @ApiProperty() cityId!: string;
  static fromEntity(e: CustomerEntity): CustomerResponseDto {
    const d = new CustomerResponseDto();
    Object.assign(d, {
      id: e.id,
      code: e.code,
      customerType: e.customerType,
      nameEn: e.nameEn,
      cityId: e.cityId,
    });
    return d;
  }
}

export class SupplierResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() code!: string;
  @ApiProperty() nameEn!: string;
  static fromEntity(e: SupplierEntity): SupplierResponseDto {
    const d = new SupplierResponseDto();
    Object.assign(d, { id: e.id, code: e.code, nameEn: e.nameEn });
    return d;
  }
}

export class RawMaterialResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() code!: string;
  @ApiProperty() nameEn!: string;
  @ApiProperty() unitId!: string;
  static fromEntity(e: RawMaterialEntity): RawMaterialResponseDto {
    const d = new RawMaterialResponseDto();
    Object.assign(d, {
      id: e.id,
      code: e.code,
      nameEn: e.nameEn,
      unitId: e.unitId,
    });
    return d;
  }
}

export class SupplierRawMaterialResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() supplierId!: string;
  @ApiProperty() rawMaterialId!: string;
  @ApiPropertyOptional({ nullable: true }) unitPriceMmk!: number | null;
  @ApiProperty() isPreferred!: boolean;
  static fromEntity(e: SupplierRawMaterialEntity): SupplierRawMaterialResponseDto {
    const d = new SupplierRawMaterialResponseDto();
    Object.assign(d, {
      id: e.id,
      supplierId: e.supplierId,
      rawMaterialId: e.rawMaterialId,
      unitPriceMmk: e.unitPriceMmk,
      isPreferred: e.isPreferred,
    });
    return d;
  }
}

export class CompanyContextResponseDto {
  @ApiProperty() companies!: CompanyContextEntity['companies'];
  static fromEntity(e: CompanyContextEntity): CompanyContextResponseDto {
    const d = new CompanyContextResponseDto();
    d.companies = e.companies;
    return d;
  }
}
`,
);

w(
  'src/application/dtos/master-data/index.ts',
  `export * from './master-data-request.dto.js';
export * from './master-data-response.dto.js';
`,
);

// BD
w(
  'src/domain/entities/bd-analytics.entity.ts',
  `export class CustomerTargetEntity {
  constructor(
    public readonly id: string,
    public readonly customerId: string,
    public readonly isTarget: boolean,
    public readonly priority: string,
    public readonly potentialVolume: string | null,
    public readonly salespersonUserId: string | null,
    public readonly notes: string | null,
  ) {}
}

export class DigitalAssetEntity {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly assetType: string,
    public readonly nameEn: string,
    public readonly nameMm: string | null,
    public readonly url: string | null,
  ) {}
}

export class PhysicalAssetEntity {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly assetType: string,
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

export class AnalyticsSummaryEntity {
  constructor(
    public readonly totalCustomers: number,
    public readonly totalManufacturedQty: number,
    public readonly salesByDay: Array<Record<string, string | number>>,
    public readonly brandsOwned: Array<Record<string, string | number>>,
    public readonly digitalAssets: number,
    public readonly physicalAssets: number,
  ) {}
}

export class DailySnapshotEntity {
  constructor(
    public readonly date: string,
    public readonly refreshed: boolean,
    public readonly details: Record<string, string | number | boolean | null>,
  ) {}
}
`,
);

w(
  'src/infrastructure/mappers/bd-analytics.mapper.ts',
  `import type { Prisma } from '@prisma/client';
import {
  AnalyticsSummaryEntity,
  BrandAwarenessEntity,
  CampaignEntity,
  CustomerTargetEntity,
  DailySnapshotEntity,
  DigitalAssetEntity,
  MarketingPlanEntity,
  PhysicalAssetEntity,
} from '../../domain/entities/bd-analytics.entity.js';
import type { AnalyticsSummary } from '../../domain/repositories/bd-analytics.repository.interface.js';

${numHelper()}

export class BdAnalyticsMapper {
  static target(row: Prisma.CustomerTargetGetPayload<object>): CustomerTargetEntity {
    return new CustomerTargetEntity(
      row.id,
      row.customerId,
      row.isTarget,
      row.priority,
      row.potentialVolume,
      row.salespersonUserId,
      row.notes,
    );
  }

  static digital(row: Prisma.DigitalAssetGetPayload<object>): DigitalAssetEntity {
    return new DigitalAssetEntity(
      row.id,
      row.companyId,
      row.assetType,
      row.nameEn,
      row.nameMm,
      row.url,
    );
  }

  static physical(row: Prisma.PhysicalAssetGetPayload<object>): PhysicalAssetEntity {
    return new PhysicalAssetEntity(
      row.id,
      row.companyId,
      row.assetType,
      row.code,
      row.nameEn,
      row.nameMm,
      row.plateNumber,
      row.purchasePriceMmk == null ? null : num(row.purchasePriceMmk),
      row.bookValueMmk == null ? null : num(row.bookValueMmk),
    );
  }

  static plan(row: Prisma.MarketingPlanGetPayload<object>): MarketingPlanEntity {
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

  static campaign(row: Prisma.CampaignGetPayload<object>): CampaignEntity {
    return new CampaignEntity(
      row.id,
      row.code,
      row.nameEn,
      row.startDate,
      row.channel,
      row.spendMmk == null ? null : num(row.spendMmk),
    );
  }

  static awareness(row: Prisma.BrandAwarenessRecordGetPayload<object>): BrandAwarenessEntity {
    return new BrandAwarenessEntity(
      row.id,
      row.brandId,
      row.recordDate,
      row.metricKey,
      num(row.metricValue),
      row.source,
    );
  }

  static summary(s: AnalyticsSummary): AnalyticsSummaryEntity {
    return new AnalyticsSummaryEntity(
      s.totalCustomers,
      s.totalManufacturedQty,
      (s.salesByDay as Array<Record<string, string | number>>) ?? [],
      (s.brandsOwned as Array<Record<string, string | number>>) ?? [],
      s.digitalAssets,
      s.physicalAssets,
    );
  }

  static snapshot(date: string, details: Record<string, string | number | boolean | null>) {
    return new DailySnapshotEntity(date, true, details);
  }
}
`,
);

w(
  'src/application/dtos/bd-analytics/bd-analytics.dto.ts',
  `import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  CampaignEntity,
  CustomerTargetEntity,
  DailySnapshotEntity,
  DigitalAssetEntity,
  MarketingPlanEntity,
  PhysicalAssetEntity,
} from '../../../domain/entities/bd-analytics.entity.js';

export class UpsertCustomerTargetDto {
  @ApiProperty() @IsString() @IsNotEmpty() customerId!: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isTarget?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() priority?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() potentialVolume?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() salespersonUserId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class CreateDigitalAssetDto {
  @ApiProperty() @IsString() @IsNotEmpty() companyId!: string;
  @ApiProperty() @IsString() @IsNotEmpty() assetType!: string;
  @ApiProperty() @IsString() @IsNotEmpty() nameEn!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nameMm?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() url?: string;
}

export class CreatePhysicalAssetDto {
  @ApiProperty() @IsString() @IsNotEmpty() companyId!: string;
  @ApiProperty() @IsString() @IsNotEmpty() assetType!: string;
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

function copy<T extends object>(Ctor: new () => T, data: Partial<T>): T {
  const d = new Ctor();
  Object.assign(d, data);
  return d;
}

export class CustomerTargetResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() customerId!: string;
  @ApiProperty() isTarget!: boolean;
  @ApiProperty() priority!: string;
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
  @ApiProperty() assetType!: string;
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

export class AnalyticsSummaryResponseDto {
  @ApiProperty() totalCustomers!: number;
  @ApiProperty() totalManufacturedQty!: number;
  @ApiProperty() digitalAssets!: number;
  @ApiProperty() physicalAssets!: number;
  static fromEntity(e: AnalyticsSummaryEntity) {
    return copy(AnalyticsSummaryResponseDto, {
      totalCustomers: e.totalCustomers,
      totalManufacturedQty: e.totalManufacturedQty,
      digitalAssets: e.digitalAssets,
      physicalAssets: e.physicalAssets,
    });
  }
}

export class DailySnapshotResponseDto {
  @ApiProperty() date!: string;
  @ApiProperty() refreshed!: boolean;
  static fromEntity(e: DailySnapshotEntity) {
    return copy(DailySnapshotResponseDto, {
      date: e.date,
      refreshed: e.refreshed,
    });
  }
}
`,
);

w(
  'src/application/dtos/bd-analytics/index.ts',
  `export * from './bd-analytics.dto.js';
`,
);

console.log('part4 master-data + bd done');
