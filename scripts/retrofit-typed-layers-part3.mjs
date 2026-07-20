/**
 * Part 3: outbound, billing, pricing
 * Run: node scripts/retrofit-typed-layers-part3.mjs
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

// OUTBOUND
w(
  'src/domain/entities/factory-outbound.entity.ts',
  `export class FactoryOutboundLineEntity {
  constructor(
    public readonly id: string,
    public readonly productSkuId: string,
    public readonly unitId: string,
    public readonly quantity: number,
  ) {}
}

export class OutboundStatusLogEntity {
  constructor(
    public readonly id: string,
    public readonly fromStatus: string | null,
    public readonly toStatus: string,
    public readonly notes: string | null,
    public readonly changedAt: Date,
  ) {}
}

export class FactoryOutboundEntity {
  constructor(
    public readonly id: string,
    public readonly outboundNumber: string,
    public readonly factoryId: string,
    public readonly salesOrderId: string | null,
    public readonly scheduledDate: Date,
    public readonly deliveryChannel: string,
    public readonly driverUserId: string | null,
    public readonly vehicleAssetId: string | null,
    public readonly yangonGateId: string | null,
    public readonly destinationGateId: string | null,
    public readonly customerReceiveMode: string | null,
    public readonly status: string,
    public readonly lines: FactoryOutboundLineEntity[],
    public readonly statusLogs: OutboundStatusLogEntity[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}
`,
);

w(
  'src/infrastructure/mappers/factory-outbound.mapper.ts',
  `import type { Prisma } from '@prisma/client';
import {
  FactoryOutboundEntity,
  FactoryOutboundLineEntity,
  OutboundStatusLogEntity,
} from '../../domain/entities/factory-outbound.entity.js';

${numHelper()}
type Row = Prisma.FactoryOutboundGetPayload<{
  include: { lines: true; statusLogs: true };
}>;

export class FactoryOutboundMapper {
  static toDomain(row: Row): FactoryOutboundEntity {
    return new FactoryOutboundEntity(
      row.id,
      row.outboundNumber,
      row.factoryId,
      row.salesOrderId,
      row.scheduledDate,
      row.deliveryChannel,
      row.driverUserId,
      row.vehicleAssetId,
      row.yangonGateId,
      row.destinationGateId,
      row.customerReceiveMode,
      row.status,
      (row.lines ?? [])
        .filter((l) => !l.deletedAt)
        .map(
          (l) =>
            new FactoryOutboundLineEntity(
              l.id,
              l.productSkuId,
              l.unitId,
              num(l.quantity),
            ),
        ),
      (row.statusLogs ?? [])
        .filter((s) => !s.deletedAt)
        .map(
          (s) =>
            new OutboundStatusLogEntity(
              s.id,
              s.fromStatus,
              s.toStatus,
              s.notes,
              s.changedAt,
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
  'src/application/dtos/outbound/create-outbound.dto.ts',
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

export enum OutboundDeliveryChannelDto {
  DIRECT_TO_SHOP = 'DIRECT_TO_SHOP',
  VIA_GATE = 'VIA_GATE',
}

export enum OutboundStatusDto {
  READY_AT_FACTORY = 'READY_AT_FACTORY',
  SENT_TO_YANGON_GATE = 'SENT_TO_YANGON_GATE',
  IN_TRANSIT = 'IN_TRANSIT',
  AT_DESTINATION_GATE = 'AT_DESTINATION_GATE',
  RECEIVED_BY_CUSTOMER = 'RECEIVED_BY_CUSTOMER',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED',
}

export class OutboundLineDto {
  @ApiProperty() @IsString() @IsNotEmpty() productSkuId!: string;
  @ApiProperty() @IsString() @IsNotEmpty() unitId!: string;
  @ApiProperty() @IsNumber() @Min(0.0001) quantity!: number;
}

export class CreateOutboundDto {
  @ApiProperty() @IsString() @IsNotEmpty() factoryId!: string;
  @ApiProperty() @IsString() @IsNotEmpty() salesOrderId!: string;
  @ApiProperty({ example: '2026-07-19' }) @IsDateString() scheduledDate!: string;
  @ApiProperty({ enum: OutboundDeliveryChannelDto }) @IsEnum(OutboundDeliveryChannelDto)
  deliveryChannel!: OutboundDeliveryChannelDto;
  @ApiPropertyOptional() @IsOptional() @IsString() driverUserId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() vehicleAssetId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() yangonGateId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() destinationGateId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() customerReceiveMode?: string;
  @ApiProperty({ type: [OutboundLineDto] })
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => OutboundLineDto)
  lines!: OutboundLineDto[];
}

export class TransitionOutboundStatusDto {
  @ApiProperty({ enum: OutboundStatusDto }) @IsEnum(OutboundStatusDto) toStatus!: OutboundStatusDto;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
`,
);

w(
  'src/application/dtos/outbound/outbound-response.dto.ts',
  `import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { FactoryOutboundEntity } from '../../../domain/entities/factory-outbound.entity.js';

export class OutboundResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() outboundNumber!: string;
  @ApiProperty() factoryId!: string;
  @ApiPropertyOptional({ nullable: true }) salesOrderId!: string | null;
  @ApiProperty() scheduledDate!: string;
  @ApiProperty() deliveryChannel!: string;
  @ApiProperty() status!: string;
  @ApiPropertyOptional({ nullable: true }) driverUserId!: string | null;
  @ApiProperty() lines!: Array<{ id: string; productSkuId: string; unitId: string; quantity: number }>;
  @ApiProperty() statusLogs!: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    notes: string | null;
    changedAt: string;
  }>;
  @ApiProperty() createdAt!: string;

  static fromEntity(e: FactoryOutboundEntity): OutboundResponseDto {
    const dto = new OutboundResponseDto();
    dto.id = e.id;
    dto.outboundNumber = e.outboundNumber;
    dto.factoryId = e.factoryId;
    dto.salesOrderId = e.salesOrderId;
    dto.scheduledDate = e.scheduledDate.toISOString().slice(0, 10);
    dto.deliveryChannel = e.deliveryChannel;
    dto.status = e.status;
    dto.driverUserId = e.driverUserId;
    dto.lines = e.lines.map((l) => ({
      id: l.id,
      productSkuId: l.productSkuId,
      unitId: l.unitId,
      quantity: l.quantity,
    }));
    dto.statusLogs = e.statusLogs.map((s) => ({
      id: s.id,
      fromStatus: s.fromStatus,
      toStatus: s.toStatus,
      notes: s.notes,
      changedAt: s.changedAt.toISOString(),
    }));
    dto.createdAt = e.createdAt.toISOString();
    return dto;
  }
}
`,
);

w(
  'src/application/dtos/outbound/index.ts',
  `export * from './create-outbound.dto.js';
export * from './outbound-response.dto.js';
`,
);

// BILLING
w(
  'src/domain/entities/billing.entity.ts',
  `export class InvoiceLineEntity {
  constructor(
    public readonly id: string,
    public readonly productSkuId: string,
    public readonly unitId: string,
    public readonly quantity: number,
    public readonly unitPriceMmk: number,
    public readonly lineTotalMmk: number,
  ) {}
}

export class InvoiceEntity {
  constructor(
    public readonly id: string,
    public readonly invoiceNumber: string,
    public readonly customerId: string,
    public readonly salesOrderId: string | null,
    public readonly issueDate: Date,
    public readonly dueDate: Date | null,
    public readonly status: string,
    public readonly subtotalMmk: number,
    public readonly totalMmk: number,
    public readonly amountPaidMmk: number,
    public readonly balanceDueMmk: number,
    public readonly lines: InvoiceLineEntity[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}

export class PaymentAllocationEntity {
  constructor(
    public readonly id: string,
    public readonly invoiceId: string,
    public readonly amountMmk: number,
  ) {}
}

export class PaymentEntity {
  constructor(
    public readonly id: string,
    public readonly paymentNumber: string,
    public readonly paymentDate: Date,
    public readonly method: string,
    public readonly status: string,
    public readonly amountMmk: number,
    public readonly bankName: string | null,
    public readonly bankReference: string | null,
    public readonly allocations: PaymentAllocationEntity[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}

export class CollectionReminderEntity {
  constructor(
    public readonly id: string,
    public readonly invoiceId: string,
    public readonly scheduledFor: Date,
    public readonly titleEn: string,
    public readonly titleMm: string | null,
    public readonly messageEn: string | null,
    public readonly assignedToUserId: string | null,
    public readonly createdByUserId: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}
`,
);

w(
  'src/infrastructure/mappers/billing.mapper.ts',
  `import type { Prisma } from '@prisma/client';
import {
  CollectionReminderEntity,
  InvoiceEntity,
  InvoiceLineEntity,
  PaymentAllocationEntity,
  PaymentEntity,
} from '../../domain/entities/billing.entity.js';

${numHelper()}
type Inv = Prisma.InvoiceGetPayload<{ include: { lines: true } }>;
type Pay = Prisma.PaymentGetPayload<{ include: { allocations: true } }>;
type Rem = Prisma.CollectionReminderGetPayload<object>;

export class BillingMapper {
  static invoiceToDomain(row: Inv): InvoiceEntity {
    return new InvoiceEntity(
      row.id,
      row.invoiceNumber,
      row.customerId,
      row.salesOrderId,
      row.issueDate,
      row.dueDate,
      row.status,
      num(row.subtotalMmk),
      num(row.totalMmk),
      num(row.amountPaidMmk),
      num(row.balanceDueMmk),
      (row.lines ?? [])
        .filter((l) => !l.deletedAt)
        .map(
          (l) =>
            new InvoiceLineEntity(
              l.id,
              l.productSkuId,
              l.unitId,
              num(l.quantity),
              num(l.unitPriceMmk),
              num(l.lineTotalMmk),
            ),
        ),
      row.createdAt,
      row.updatedAt,
      row.deletedAt,
    );
  }

  static paymentToDomain(row: Pay): PaymentEntity {
    return new PaymentEntity(
      row.id,
      row.paymentNumber,
      row.paymentDate,
      row.method,
      row.status,
      num(row.amountMmk),
      row.bankName,
      row.bankReference,
      (row.allocations ?? [])
        .filter((a) => !a.deletedAt)
        .map(
          (a) => new PaymentAllocationEntity(a.id, a.invoiceId, num(a.amountMmk)),
        ),
      row.createdAt,
      row.updatedAt,
      row.deletedAt,
    );
  }

  static reminderToDomain(row: Rem): CollectionReminderEntity {
    return new CollectionReminderEntity(
      row.id,
      row.invoiceId,
      row.scheduledFor,
      row.titleEn,
      row.titleMm,
      row.messageEn,
      row.assignedToUserId,
      row.createdByUserId,
      row.createdAt,
      row.updatedAt,
      row.deletedAt,
    );
  }
}
`,
);

w(
  'src/application/dtos/billing/billing-request.dto.ts',
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

export enum PaymentMethodDto {
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY',
  BANK_TRANSFER = 'BANK_TRANSFER',
  OTHER = 'OTHER',
}

export class CreateInvoiceFromOrderDto {
  @ApiPropertyOptional({ example: '2026-08-01' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class PaymentAllocationDto {
  @ApiProperty() @IsString() @IsNotEmpty() invoiceId!: string;
  @ApiProperty() @IsNumber() @Min(0.01) amountMmk!: number;
}

export class RecordPaymentDto {
  @ApiProperty({ example: '2026-07-19' }) @IsDateString() paymentDate!: string;
  @ApiProperty({ enum: PaymentMethodDto }) @IsEnum(PaymentMethodDto) method!: PaymentMethodDto;
  @ApiProperty() @IsNumber() @Min(0.01) amountMmk!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() bankName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() bankReference?: string;
  @ApiProperty({ type: [PaymentAllocationDto] })
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => PaymentAllocationDto)
  allocations!: PaymentAllocationDto[];
}

export class CreateCollectionReminderDto {
  @ApiProperty() @IsString() @IsNotEmpty() invoiceId!: string;
  @ApiProperty() @IsDateString() scheduledFor!: string;
  @ApiProperty() @IsString() @IsNotEmpty() titleEn!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() titleMm?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() messageEn?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() assignedToUserId?: string;
}
`,
);

w(
  'src/application/dtos/billing/billing-response.dto.ts',
  `import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  CollectionReminderEntity,
  InvoiceEntity,
  PaymentEntity,
} from '../../../domain/entities/billing.entity.js';

export class InvoiceResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() invoiceNumber!: string;
  @ApiProperty() customerId!: string;
  @ApiPropertyOptional({ nullable: true }) salesOrderId!: string | null;
  @ApiProperty() status!: string;
  @ApiProperty() totalMmk!: number;
  @ApiProperty() amountPaidMmk!: number;
  @ApiProperty() balanceDueMmk!: number;
  @ApiProperty() lines!: Array<{
    id: string;
    productSkuId: string;
    unitId: string;
    quantity: number;
    unitPriceMmk: number;
    lineTotalMmk: number;
  }>;
  @ApiProperty() createdAt!: string;

  static fromEntity(e: InvoiceEntity): InvoiceResponseDto {
    const dto = new InvoiceResponseDto();
    dto.id = e.id;
    dto.invoiceNumber = e.invoiceNumber;
    dto.customerId = e.customerId;
    dto.salesOrderId = e.salesOrderId;
    dto.status = e.status;
    dto.totalMmk = e.totalMmk;
    dto.amountPaidMmk = e.amountPaidMmk;
    dto.balanceDueMmk = e.balanceDueMmk;
    dto.lines = e.lines.map((l) => ({
      id: l.id,
      productSkuId: l.productSkuId,
      unitId: l.unitId,
      quantity: l.quantity,
      unitPriceMmk: l.unitPriceMmk,
      lineTotalMmk: l.lineTotalMmk,
    }));
    dto.createdAt = e.createdAt.toISOString();
    return dto;
  }
}

export class PaymentResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() paymentNumber!: string;
  @ApiProperty() paymentDate!: string;
  @ApiProperty() method!: string;
  @ApiProperty() status!: string;
  @ApiProperty() amountMmk!: number;
  @ApiProperty() allocations!: Array<{ id: string; invoiceId: string; amountMmk: number }>;

  static fromEntity(e: PaymentEntity): PaymentResponseDto {
    const dto = new PaymentResponseDto();
    dto.id = e.id;
    dto.paymentNumber = e.paymentNumber;
    dto.paymentDate = e.paymentDate.toISOString().slice(0, 10);
    dto.method = e.method;
    dto.status = e.status;
    dto.amountMmk = e.amountMmk;
    dto.allocations = e.allocations.map((a) => ({
      id: a.id,
      invoiceId: a.invoiceId,
      amountMmk: a.amountMmk,
    }));
    return dto;
  }
}

export class CollectionReminderResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() invoiceId!: string;
  @ApiProperty() scheduledFor!: string;
  @ApiProperty() titleEn!: string;
  @ApiPropertyOptional({ nullable: true }) titleMm!: string | null;

  static fromEntity(e: CollectionReminderEntity): CollectionReminderResponseDto {
    const dto = new CollectionReminderResponseDto();
    dto.id = e.id;
    dto.invoiceId = e.invoiceId;
    dto.scheduledFor = e.scheduledFor.toISOString();
    dto.titleEn = e.titleEn;
    dto.titleMm = e.titleMm;
    return dto;
  }
}
`,
);

w(
  'src/application/dtos/billing/index.ts',
  `export * from './billing-request.dto.js';
export * from './billing-response.dto.js';
`,
);

// PRICING
w(
  'src/domain/entities/pricing.entity.ts',
  `export class CustomerProductPriceEntity {
  constructor(
    public readonly id: string,
    public readonly customerId: string,
    public readonly productSkuId: string,
    public readonly unitId: string,
    public readonly unitPriceMmk: number,
    public readonly effectiveFrom: Date,
    public readonly effectiveTo: Date | null,
  ) {}
}

export class VolumePriceTierEntity {
  constructor(
    public readonly id: string,
    public readonly productSkuId: string,
    public readonly customerId: string | null,
    public readonly unitId: string,
    public readonly minQuantity: number,
    public readonly maxQuantity: number | null,
    public readonly unitPriceMmk: number,
    public readonly effectiveFrom: Date,
  ) {}
}

export class CityProductPriceEntity {
  constructor(
    public readonly id: string,
    public readonly cityId: string,
    public readonly productSkuId: string,
    public readonly unitId: string,
    public readonly unitPriceMmk: number,
    public readonly effectiveFrom: Date,
  ) {}
}

export class ResolvedPriceEntity {
  constructor(
    public readonly unitPriceMmk: number,
    public readonly source: 'CUSTOMER' | 'VOLUME' | 'CITY',
  ) {}
}
`,
);

w(
  'src/infrastructure/mappers/pricing.mapper.ts',
  `import type { Prisma } from '@prisma/client';
import {
  CityProductPriceEntity,
  CustomerProductPriceEntity,
  ResolvedPriceEntity,
  VolumePriceTierEntity,
} from '../../domain/entities/pricing.entity.js';

${numHelper()}

export class PricingMapper {
  static customerToDomain(
    row: Prisma.CustomerProductPriceGetPayload<object>,
  ): CustomerProductPriceEntity {
    return new CustomerProductPriceEntity(
      row.id,
      row.customerId,
      row.productSkuId,
      row.unitId,
      num(row.unitPriceMmk),
      row.effectiveFrom,
      row.effectiveTo,
    );
  }

  static volumeToDomain(
    row: Prisma.VolumePriceTierGetPayload<object>,
  ): VolumePriceTierEntity {
    return new VolumePriceTierEntity(
      row.id,
      row.productSkuId,
      row.customerId,
      row.unitId,
      num(row.minQuantity),
      row.maxQuantity == null ? null : num(row.maxQuantity),
      num(row.unitPriceMmk),
      row.effectiveFrom,
    );
  }

  static cityToDomain(
    row: Prisma.CityProductPriceGetPayload<object>,
  ): CityProductPriceEntity {
    return new CityProductPriceEntity(
      row.id,
      row.cityId,
      row.productSkuId,
      row.unitId,
      num(row.unitPriceMmk),
      row.effectiveFrom,
    );
  }

  static resolved(unitPriceMmk: number, source: 'CUSTOMER' | 'VOLUME' | 'CITY') {
    return new ResolvedPriceEntity(unitPriceMmk, source);
  }
}
`,
);

w(
  'src/application/dtos/pricing/pricing.dto.ts',
  `import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import type { ResolvedPriceEntity } from '../../../domain/entities/pricing.entity.js';
import type {
  CityProductPriceEntity,
  CustomerProductPriceEntity,
  VolumePriceTierEntity,
} from '../../../domain/entities/pricing.entity.js';

export class UpsertCustomerPriceDto {
  @ApiProperty() @IsString() @IsNotEmpty() customerId!: string;
  @ApiProperty() @IsString() @IsNotEmpty() productSkuId!: string;
  @ApiProperty() @IsString() @IsNotEmpty() unitId!: string;
  @ApiProperty() @IsNumber() @Min(0) unitPriceMmk!: number;
  @ApiProperty() @IsDateString() effectiveFrom!: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() effectiveTo?: string;
}

export class UpsertVolumeTierDto {
  @ApiProperty() @IsString() @IsNotEmpty() productSkuId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() customerId?: string;
  @ApiProperty() @IsString() @IsNotEmpty() unitId!: string;
  @ApiProperty() @IsNumber() @Min(0) minQuantity!: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() maxQuantity?: number;
  @ApiProperty() @IsNumber() @Min(0) unitPriceMmk!: number;
  @ApiProperty() @IsDateString() effectiveFrom!: string;
}

export class UpsertCityPriceDto {
  @ApiProperty() @IsString() @IsNotEmpty() cityId!: string;
  @ApiProperty() @IsString() @IsNotEmpty() productSkuId!: string;
  @ApiProperty() @IsString() @IsNotEmpty() unitId!: string;
  @ApiProperty() @IsNumber() @Min(0) unitPriceMmk!: number;
  @ApiProperty() @IsDateString() effectiveFrom!: string;
}

export class ResolvePriceDto {
  @ApiProperty() @IsString() @IsNotEmpty() productSkuId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() customerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() cityId?: string;
  @ApiProperty() @IsNumber() @Min(0) quantity!: number;
}

export class CustomerPriceResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() customerId!: string;
  @ApiProperty() productSkuId!: string;
  @ApiProperty() unitId!: string;
  @ApiProperty() unitPriceMmk!: number;
  static fromEntity(e: CustomerProductPriceEntity): CustomerPriceResponseDto {
    const d = new CustomerPriceResponseDto();
    d.id = e.id;
    d.customerId = e.customerId;
    d.productSkuId = e.productSkuId;
    d.unitId = e.unitId;
    d.unitPriceMmk = e.unitPriceMmk;
    return d;
  }
}

export class VolumeTierResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() productSkuId!: string;
  @ApiProperty() unitPriceMmk!: number;
  @ApiProperty() minQuantity!: number;
  static fromEntity(e: VolumePriceTierEntity): VolumeTierResponseDto {
    const d = new VolumeTierResponseDto();
    d.id = e.id;
    d.productSkuId = e.productSkuId;
    d.unitPriceMmk = e.unitPriceMmk;
    d.minQuantity = e.minQuantity;
    return d;
  }
}

export class CityPriceResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() cityId!: string;
  @ApiProperty() productSkuId!: string;
  @ApiProperty() unitPriceMmk!: number;
  static fromEntity(e: CityProductPriceEntity): CityPriceResponseDto {
    const d = new CityPriceResponseDto();
    d.id = e.id;
    d.cityId = e.cityId;
    d.productSkuId = e.productSkuId;
    d.unitPriceMmk = e.unitPriceMmk;
    return d;
  }
}

export class ResolvePriceResponseDto {
  @ApiProperty() unitPriceMmk!: number;
  @ApiProperty() source!: string;
  static fromEntity(e: ResolvedPriceEntity): ResolvePriceResponseDto {
    const d = new ResolvePriceResponseDto();
    d.unitPriceMmk = e.unitPriceMmk;
    d.source = e.source;
    return d;
  }
}
`,
);

w(
  'src/application/dtos/pricing/index.ts',
  `export * from './pricing.dto.js';
`,
);

console.log('part3 outbound+billing+pricing done');
