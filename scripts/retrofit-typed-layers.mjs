/**
 * Generate domain entities, mappers, request/response DTOs for all business features.
 * Run: node scripts/retrofit-typed-layers.mjs
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

// ─── shared helper comment ─────────────────────────────────────────
const HEADER = `/** Auto-shaped typed layer — keep Prisma mapping in infrastructure mappers only. */\n`;

// ═══════════════════════════════════════════════════════════════════
// SALES
// ═══════════════════════════════════════════════════════════════════
w(
  'src/domain/entities/sales-order.entity.ts',
  `${HEADER}export interface SalesOrderLineEntityProps {
  id: string;
  salesOrderId: string;
  productSkuId: string;
  unitId: string;
  quantity: number;
  unitPriceMmk: number;
  lineTotalMmk: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class SalesOrderLineEntity {
  readonly id: string;
  readonly salesOrderId: string;
  readonly productSkuId: string;
  readonly unitId: string;
  readonly quantity: number;
  readonly unitPriceMmk: number;
  readonly lineTotalMmk: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;

  constructor(props: SalesOrderLineEntityProps) {
    Object.assign(this, props);
  }
}

export interface SalesOrderEntityProps {
  id: string;
  orderNumber: string;
  customerId: string;
  orderDate: Date;
  orderSource: string;
  takenByUserId: string | null;
  deliveryChannel: string;
  customerReceiveMode: string | null;
  status: string;
  hasSufficientStock: boolean | null;
  stockCheckNotes: string | null;
  stockCheckedAt: Date | null;
  goodsReceivedAt: Date | null;
  saleOkAt: Date | null;
  notes: string | null;
  lines: SalesOrderLineEntity[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class SalesOrderEntity {
  readonly id: string;
  readonly orderNumber: string;
  readonly customerId: string;
  readonly orderDate: Date;
  readonly orderSource: string;
  readonly takenByUserId: string | null;
  readonly deliveryChannel: string;
  readonly customerReceiveMode: string | null;
  readonly status: string;
  readonly hasSufficientStock: boolean | null;
  readonly stockCheckNotes: string | null;
  readonly stockCheckedAt: Date | null;
  readonly goodsReceivedAt: Date | null;
  readonly saleOkAt: Date | null;
  readonly notes: string | null;
  readonly lines: SalesOrderLineEntity[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;

  constructor(props: SalesOrderEntityProps) {
    Object.assign(this, props);
  }
}
`,
);

w(
  'src/infrastructure/mappers/sales-order.mapper.ts',
  `${HEADER}import type { Prisma } from '@prisma/client';
import {
  SalesOrderEntity,
  SalesOrderLineEntity,
} from '../../domain/entities/sales-order.entity.js';

type SalesOrderRow = Prisma.SalesOrderGetPayload<{
  include: { lines: true };
}>;

function num(v: { toNumber?: () => number } | number | null | undefined): number {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  return Number(v);
}

export class SalesOrderMapper {
  static toDomain(row: SalesOrderRow): SalesOrderEntity {
    return new SalesOrderEntity({
      id: row.id,
      orderNumber: row.orderNumber,
      customerId: row.customerId,
      orderDate: row.orderDate,
      orderSource: row.orderSource,
      takenByUserId: row.takenByUserId,
      deliveryChannel: row.deliveryChannel,
      customerReceiveMode: row.customerReceiveMode,
      status: row.status,
      hasSufficientStock: row.hasSufficientStock,
      stockCheckNotes: row.stockCheckNotes,
      stockCheckedAt: row.stockCheckedAt,
      goodsReceivedAt: row.goodsReceivedAt,
      saleOkAt: row.saleOkAt,
      notes: row.notes,
      lines: (row.lines ?? [])
        .filter((l) => l.deletedAt == null)
        .map(
          (l) =>
            new SalesOrderLineEntity({
              id: l.id,
              salesOrderId: l.salesOrderId,
              productSkuId: l.productSkuId,
              unitId: l.unitId,
              quantity: num(l.quantity),
              unitPriceMmk: num(l.unitPriceMmk),
              lineTotalMmk: num(l.lineTotalMmk),
              createdAt: l.createdAt,
              updatedAt: l.updatedAt,
              deletedAt: l.deletedAt,
            }),
        ),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    });
  }
}
`,
);

w(
  'src/application/dtos/sales/create-sales-order.dto.ts',
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

export enum OrderSourceDto {
  SALES_OUTBOUND_CALL = 'SALES_OUTBOUND_CALL',
  SHOP_INBOUND_CALL = 'SHOP_INBOUND_CALL',
  OTHER = 'OTHER',
}

export enum DeliveryChannelDto {
  DIRECT_TO_SHOP = 'DIRECT_TO_SHOP',
  VIA_GATE = 'VIA_GATE',
}

export enum CustomerReceiveModeDto {
  CUSTOMER_PICKUP_AT_GATE = 'CUSTOMER_PICKUP_AT_GATE',
  GATE_DELIVERS_TO_CUSTOMER = 'GATE_DELIVERS_TO_CUSTOMER',
}

export class SalesOrderLineDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  productSkuId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  unitId!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.0001)
  quantity!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  unitPriceMmk!: number;
}

export class CreateSalesOrderDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @ApiProperty({ example: '2026-07-19' })
  @IsDateString()
  orderDate!: string;

  @ApiProperty({ enum: OrderSourceDto })
  @IsEnum(OrderSourceDto)
  orderSource!: OrderSourceDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  takenByUserId?: string;

  @ApiProperty({ enum: DeliveryChannelDto })
  @IsEnum(DeliveryChannelDto)
  deliveryChannel!: DeliveryChannelDto;

  @ApiPropertyOptional({ enum: CustomerReceiveModeDto })
  @IsOptional()
  @IsEnum(CustomerReceiveModeDto)
  customerReceiveMode?: CustomerReceiveModeDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [SalesOrderLineDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SalesOrderLineDto)
  lines!: SalesOrderLineDto[];
}
`,
);

w(
  'src/application/dtos/sales/sales-order-response.dto.ts',
  `import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { SalesOrderEntity } from '../../../domain/entities/sales-order.entity.js';

export class SalesOrderLineResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() productSkuId!: string;
  @ApiProperty() unitId!: string;
  @ApiProperty() quantity!: number;
  @ApiProperty() unitPriceMmk!: number;
  @ApiProperty() lineTotalMmk!: number;
}

export class SalesOrderResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() orderNumber!: string;
  @ApiProperty() customerId!: string;
  @ApiProperty() orderDate!: string;
  @ApiProperty() orderSource!: string;
  @ApiPropertyOptional({ nullable: true }) takenByUserId!: string | null;
  @ApiProperty() deliveryChannel!: string;
  @ApiPropertyOptional({ nullable: true }) customerReceiveMode!: string | null;
  @ApiProperty() status!: string;
  @ApiPropertyOptional({ nullable: true }) hasSufficientStock!: boolean | null;
  @ApiPropertyOptional({ nullable: true }) stockCheckNotes!: string | null;
  @ApiPropertyOptional({ nullable: true }) goodsReceivedAt!: string | null;
  @ApiPropertyOptional({ nullable: true }) saleOkAt!: string | null;
  @ApiPropertyOptional({ nullable: true }) notes!: string | null;
  @ApiProperty({ type: [SalesOrderLineResponseDto] }) lines!: SalesOrderLineResponseDto[];
  @ApiProperty() createdAt!: string;

  static fromEntity(e: SalesOrderEntity): SalesOrderResponseDto {
    const dto = new SalesOrderResponseDto();
    dto.id = e.id;
    dto.orderNumber = e.orderNumber;
    dto.customerId = e.customerId;
    dto.orderDate = e.orderDate.toISOString().slice(0, 10);
    dto.orderSource = e.orderSource;
    dto.takenByUserId = e.takenByUserId;
    dto.deliveryChannel = e.deliveryChannel;
    dto.customerReceiveMode = e.customerReceiveMode;
    dto.status = e.status;
    dto.hasSufficientStock = e.hasSufficientStock;
    dto.stockCheckNotes = e.stockCheckNotes;
    dto.goodsReceivedAt = e.goodsReceivedAt?.toISOString() ?? null;
    dto.saleOkAt = e.saleOkAt?.toISOString() ?? null;
    dto.notes = e.notes;
    dto.lines = e.lines.map((l) => {
      const line = new SalesOrderLineResponseDto();
      line.id = l.id;
      line.productSkuId = l.productSkuId;
      line.unitId = l.unitId;
      line.quantity = l.quantity;
      line.unitPriceMmk = l.unitPriceMmk;
      line.lineTotalMmk = l.lineTotalMmk;
      return line;
    });
    dto.createdAt = e.createdAt.toISOString();
    return dto;
  }
}
`,
);

w(
  'src/application/dtos/sales/index.ts',
  `export * from './create-sales-order.dto.js';
export * from './sales-order-response.dto.js';
`,
);

console.log('sales DTOs/entities/mappers written — continuing other features in part 2...');
