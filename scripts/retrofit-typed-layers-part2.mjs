/**
 * Part 2: production, inventory, outbound, billing, pricing entities/mappers/DTOs
 * Run: node scripts/retrofit-typed-layers-part2.mjs
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
const H = '';

function numHelper() {
  return `function num(v: { toNumber?: () => number } | number | null | undefined): number {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  return Number(v);
}
`;
}

// ── PRODUCTION ─────────────────────────────────────────────────────
w(
  'src/domain/entities/production-daily-record.entity.ts',
  `export class ProductionDailyLineEntity {
  constructor(
    public readonly id: string,
    public readonly productSkuId: string,
    public readonly unitId: string,
    public readonly quantityProduced: number,
    public readonly billOfMaterialId: string | null,
  ) {}
}

export class ProductionDailyRawUsageEntity {
  constructor(
    public readonly id: string,
    public readonly rawMaterialId: string,
    public readonly unitId: string,
    public readonly quantityUsed: number,
    public readonly notes: string | null,
  ) {}
}

export class ProductionDailyWorkerEntity {
  constructor(
    public readonly id: string,
    public readonly userId: string | null,
    public readonly workerNameEn: string | null,
    public readonly workerNameMm: string | null,
  ) {}
}

export class ProductionDailyRecordEntity {
  constructor(
    public readonly id: string,
    public readonly factoryId: string,
    public readonly productionDate: Date,
    public readonly employeeCount: number,
    public readonly notes: string | null,
    public readonly lines: ProductionDailyLineEntity[],
    public readonly rawUsages: ProductionDailyRawUsageEntity[],
    public readonly workers: ProductionDailyWorkerEntity[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}
`,
);

w(
  'src/infrastructure/mappers/production-daily-record.mapper.ts',
  `import type { Prisma } from '@prisma/client';
import {
  ProductionDailyLineEntity,
  ProductionDailyRawUsageEntity,
  ProductionDailyRecordEntity,
  ProductionDailyWorkerEntity,
} from '../../domain/entities/production-daily-record.entity.js';

${numHelper()}
type Row = Prisma.ProductionDailyRecordGetPayload<{
  include: { lines: true; rawUsages: true; workers: true };
}>;

export class ProductionDailyRecordMapper {
  static toDomain(row: Row): ProductionDailyRecordEntity {
    return new ProductionDailyRecordEntity(
      row.id,
      row.factoryId,
      row.productionDate,
      row.employeeCount,
      row.notes,
      (row.lines ?? [])
        .filter((l) => !l.deletedAt)
        .map(
          (l) =>
            new ProductionDailyLineEntity(
              l.id,
              l.productSkuId,
              l.unitId,
              num(l.quantityProduced),
              l.billOfMaterialId,
            ),
        ),
      (row.rawUsages ?? [])
        .filter((u) => !u.deletedAt)
        .map(
          (u) =>
            new ProductionDailyRawUsageEntity(
              u.id,
              u.rawMaterialId,
              u.unitId,
              num(u.quantityUsed),
              u.notes,
            ),
        ),
      (row.workers ?? [])
        .filter((w) => !w.deletedAt)
        .map(
          (w) =>
            new ProductionDailyWorkerEntity(
              w.id,
              w.userId,
              w.workerNameEn,
              w.workerNameMm,
            ),
        ),
      row.createdAt,
      row.updatedAt,
      row.deletedAt,
    );
  }
}
`,
);

w(
  'src/application/dtos/production/upsert-production-day.dto.ts',
  `import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class ProductionLineDto {
  @ApiProperty() @IsString() @IsNotEmpty() productSkuId!: string;
  @ApiProperty() @IsString() @IsNotEmpty() unitId!: string;
  @ApiProperty() @IsNumber() @Min(0) quantityProduced!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() billOfMaterialId?: string;
}

export class ProductionRawUsageDto {
  @ApiProperty() @IsString() @IsNotEmpty() rawMaterialId!: string;
  @ApiProperty() @IsString() @IsNotEmpty() unitId!: string;
  @ApiProperty() @IsNumber() @Min(0) quantityUsed!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class ProductionWorkerDto {
  @ApiPropertyOptional() @IsOptional() @IsString() userId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() workerNameEn?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() workerNameMm?: string;
}

export class UpsertProductionDayDto {
  @ApiProperty() @IsString() @IsNotEmpty() factoryId!: string;
  @ApiProperty({ example: '2026-07-19' }) @IsDateString() productionDate!: string;
  @ApiProperty() @IsInt() @Min(0) employeeCount!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional({ type: [ProductionWorkerDto] })
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => ProductionWorkerDto)
  workers?: ProductionWorkerDto[];
  @ApiProperty({ type: [ProductionLineDto] })
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => ProductionLineDto)
  lines!: ProductionLineDto[];
  @ApiProperty({ type: [ProductionRawUsageDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => ProductionRawUsageDto)
  rawUsages!: ProductionRawUsageDto[];
}
`,
);

w(
  'src/application/dtos/production/production-day-response.dto.ts',
  `import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ProductionDailyRecordEntity } from '../../../domain/entities/production-daily-record.entity.js';

export class ProductionDayResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() factoryId!: string;
  @ApiProperty() productionDate!: string;
  @ApiProperty() employeeCount!: number;
  @ApiPropertyOptional({ nullable: true }) notes!: string | null;
  @ApiProperty() lines!: Array<{
    id: string;
    productSkuId: string;
    unitId: string;
    quantityProduced: number;
    billOfMaterialId: string | null;
  }>;
  @ApiProperty() rawUsages!: Array<{
    id: string;
    rawMaterialId: string;
    unitId: string;
    quantityUsed: number;
    notes: string | null;
  }>;
  @ApiProperty() workers!: Array<{
    id: string;
    userId: string | null;
    workerNameEn: string | null;
    workerNameMm: string | null;
  }>;
  @ApiProperty() createdAt!: string;

  static fromEntity(e: ProductionDailyRecordEntity): ProductionDayResponseDto {
    const dto = new ProductionDayResponseDto();
    dto.id = e.id;
    dto.factoryId = e.factoryId;
    dto.productionDate = e.productionDate.toISOString().slice(0, 10);
    dto.employeeCount = e.employeeCount;
    dto.notes = e.notes;
    dto.lines = e.lines.map((l) => ({
      id: l.id,
      productSkuId: l.productSkuId,
      unitId: l.unitId,
      quantityProduced: l.quantityProduced,
      billOfMaterialId: l.billOfMaterialId,
    }));
    dto.rawUsages = e.rawUsages.map((u) => ({
      id: u.id,
      rawMaterialId: u.rawMaterialId,
      unitId: u.unitId,
      quantityUsed: u.quantityUsed,
      notes: u.notes,
    }));
    dto.workers = e.workers.map((w) => ({
      id: w.id,
      userId: w.userId,
      workerNameEn: w.workerNameEn,
      workerNameMm: w.workerNameMm,
    }));
    dto.createdAt = e.createdAt.toISOString();
    return dto;
  }
}
`,
);

w(
  'src/application/dtos/production/index.ts',
  `export * from './upsert-production-day.dto.js';
export * from './production-day-response.dto.js';
`,
);

// ── INVENTORY ──────────────────────────────────────────────────────
w(
  'src/domain/entities/inventory-balance.entity.ts',
  `export class InventoryBalanceEntity {
  constructor(
    public readonly id: string,
    public readonly stockLocationId: string,
    public readonly itemType: string,
    public readonly rawMaterialId: string | null,
    public readonly productSkuId: string | null,
    public readonly unitId: string,
    public readonly quantityAvailable: number,
    public readonly asOfDate: Date,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}

export class DailyStockCountLineEntity {
  constructor(
    public readonly id: string,
    public readonly itemType: string,
    public readonly rawMaterialId: string | null,
    public readonly productSkuId: string | null,
    public readonly unitId: string,
    public readonly quantityOnHand: number,
  ) {}
}

export class DailyStockCountEntity {
  constructor(
    public readonly id: string,
    public readonly stockLocationId: string,
    public readonly countDate: Date,
    public readonly notes: string | null,
    public readonly lines: DailyStockCountLineEntity[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}
`,
);

w(
  'src/infrastructure/mappers/inventory.mapper.ts',
  `import type { Prisma } from '@prisma/client';
import {
  DailyStockCountEntity,
  DailyStockCountLineEntity,
  InventoryBalanceEntity,
} from '../../domain/entities/inventory-balance.entity.js';

${numHelper()}
type Bal = Prisma.InventoryBalanceGetPayload<object>;
type Count = Prisma.DailyStockCountGetPayload<{ include: { lines: true } }>;

export class InventoryMapper {
  static balanceToDomain(row: Bal): InventoryBalanceEntity {
    return new InventoryBalanceEntity(
      row.id,
      row.stockLocationId,
      row.itemType,
      row.rawMaterialId,
      row.productSkuId,
      row.unitId,
      num(row.quantityAvailable),
      row.asOfDate,
      row.createdAt,
      row.updatedAt,
      row.deletedAt,
    );
  }

  static stockCountToDomain(row: Count): DailyStockCountEntity {
    return new DailyStockCountEntity(
      row.id,
      row.stockLocationId,
      row.countDate,
      row.notes,
      (row.lines ?? [])
        .filter((l) => !l.deletedAt)
        .map(
          (l) =>
            new DailyStockCountLineEntity(
              l.id,
              l.itemType,
              l.rawMaterialId,
              l.productSkuId,
              l.unitId,
              num(l.quantityOnHand),
            ),
        ),
      row.createdAt,
      row.updatedAt,
      row.deletedAt,
    );
  }
}
`,
);

w(
  'src/application/dtos/inventory/record-daily-stock-count.dto.ts',
  `import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export enum InventoryItemTypeDto {
  RAW_MATERIAL = 'RAW_MATERIAL',
  FINISHED_GOOD = 'FINISHED_GOOD',
}

export class StockCountLineDto {
  @ApiProperty({ enum: InventoryItemTypeDto }) @IsEnum(InventoryItemTypeDto) itemType!: InventoryItemTypeDto;
  @ApiPropertyOptional() @IsOptional() @IsString() rawMaterialId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() productSkuId?: string;
  @ApiProperty() @IsString() @IsNotEmpty() unitId!: string;
  @ApiProperty() @IsNumber() @Min(0) quantityOnHand!: number;
}

export class RecordDailyStockCountDto {
  @ApiProperty() @IsString() @IsNotEmpty() stockLocationId!: string;
  @ApiProperty({ example: '2026-07-19' }) @IsDateString() countDate!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiProperty({ type: [StockCountLineDto] })
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => StockCountLineDto)
  lines!: StockCountLineDto[];
}
`,
);

w(
  'src/application/dtos/inventory/inventory-response.dto.ts',
  `import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  DailyStockCountEntity,
  InventoryBalanceEntity,
} from '../../../domain/entities/inventory-balance.entity.js';

export class InventoryBalanceResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() stockLocationId!: string;
  @ApiProperty() itemType!: string;
  @ApiPropertyOptional({ nullable: true }) rawMaterialId!: string | null;
  @ApiPropertyOptional({ nullable: true }) productSkuId!: string | null;
  @ApiProperty() unitId!: string;
  @ApiProperty() quantityAvailable!: number;
  @ApiProperty() asOfDate!: string;

  static fromEntity(e: InventoryBalanceEntity): InventoryBalanceResponseDto {
    const dto = new InventoryBalanceResponseDto();
    dto.id = e.id;
    dto.stockLocationId = e.stockLocationId;
    dto.itemType = e.itemType;
    dto.rawMaterialId = e.rawMaterialId;
    dto.productSkuId = e.productSkuId;
    dto.unitId = e.unitId;
    dto.quantityAvailable = e.quantityAvailable;
    dto.asOfDate = e.asOfDate.toISOString();
    return dto;
  }
}

export class DailyStockCountResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() stockLocationId!: string;
  @ApiProperty() countDate!: string;
  @ApiPropertyOptional({ nullable: true }) notes!: string | null;
  @ApiProperty() lines!: Array<{
    id: string;
    itemType: string;
    rawMaterialId: string | null;
    productSkuId: string | null;
    unitId: string;
    quantityOnHand: number;
  }>;

  static fromEntity(e: DailyStockCountEntity): DailyStockCountResponseDto {
    const dto = new DailyStockCountResponseDto();
    dto.id = e.id;
    dto.stockLocationId = e.stockLocationId;
    dto.countDate = e.countDate.toISOString().slice(0, 10);
    dto.notes = e.notes;
    dto.lines = e.lines.map((l) => ({
      id: l.id,
      itemType: l.itemType,
      rawMaterialId: l.rawMaterialId,
      productSkuId: l.productSkuId,
      unitId: l.unitId,
      quantityOnHand: l.quantityOnHand,
    }));
    return dto;
  }
}
`,
);

w(
  'src/application/dtos/inventory/index.ts',
  `export * from './record-daily-stock-count.dto.js';
export * from './inventory-response.dto.js';
`,
);

console.log('part2 production+inventory done');
