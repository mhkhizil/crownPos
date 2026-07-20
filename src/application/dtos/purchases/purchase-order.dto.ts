import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import type { PurchaseOrderEntity } from '../../../domain/entities/purchase-order.entity.js';
import { PurchaseStatus } from '../../../domain/enums/purchase-status.enum.js';

export class PurchaseOrderLineDto {
  @ApiProperty() @IsString() @IsNotEmpty() rawMaterialId!: string;
  @ApiProperty() @IsString() @IsNotEmpty() unitId!: string;
  @ApiProperty() @IsNumber() @Min(0.0001) quantityOrdered!: number;
  @ApiProperty() @IsNumber() @Min(0) unitPriceMmk!: number;
}

export class CreatePurchaseOrderDto {
  @ApiProperty() @IsString() @IsNotEmpty() factoryId!: string;
  @ApiProperty() @IsString() @IsNotEmpty() supplierId!: string;
  @ApiProperty({ example: '2026-07-19' }) @IsDateString() orderDate!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiProperty({ type: [PurchaseOrderLineDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderLineDto)
  lines!: PurchaseOrderLineDto[];
  /**
   * When true, creates the PO as ORDERED and immediately receives full
   * ordered qty into primary (or given) stock location — “drop raw” inbound.
   */
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  receiveImmediately?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  stockLocationId?: string;
}

export class ReceivePurchaseLineDto {
  @ApiProperty() @IsString() @IsNotEmpty() purchaseOrderLineId!: string;
  @ApiProperty() @IsNumber() @Min(0.0001) quantityReceived!: number;
}

export class ReceivePurchaseOrderDto {
  @ApiProperty({ type: [ReceivePurchaseLineDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReceivePurchaseLineDto)
  lines!: ReceivePurchaseLineDto[];
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  stockLocationId?: string;
}

function copy<T extends object>(Ctor: new () => T, data: Partial<T>): T {
  const d = new Ctor();
  Object.assign(d, data);
  return d;
}

export class PurchaseOrderLineResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() rawMaterialId!: string;
  @ApiProperty() unitId!: string;
  @ApiProperty() quantityOrdered!: number;
  @ApiProperty() quantityReceived!: number;
  @ApiProperty() unitPriceMmk!: number;
  @ApiProperty() lineTotalMmk!: number;
}

export class PurchaseOrderResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() factoryId!: string;
  @ApiProperty() supplierId!: string;
  @ApiProperty() orderNumber!: string;
  @ApiProperty() orderDate!: string;
  @ApiProperty({ enum: PurchaseStatus }) status!: PurchaseStatus;
  @ApiProperty() totalAmountMmk!: number;
  @ApiPropertyOptional({ nullable: true }) notes!: string | null;
  @ApiProperty({ type: [PurchaseOrderLineResponseDto] })
  lines!: PurchaseOrderLineResponseDto[];
  @ApiProperty() createdAt!: string;

  static fromEntity(e: PurchaseOrderEntity): PurchaseOrderResponseDto {
    return copy(PurchaseOrderResponseDto, {
      id: e.id,
      factoryId: e.factoryId,
      supplierId: e.supplierId,
      orderNumber: e.orderNumber,
      orderDate: e.orderDate.toISOString().slice(0, 10),
      status: e.status,
      totalAmountMmk: e.totalAmountMmk,
      notes: e.notes,
      lines: e.lines.map((l) =>
        copy(PurchaseOrderLineResponseDto, {
          id: l.id,
          rawMaterialId: l.rawMaterialId,
          unitId: l.unitId,
          quantityOrdered: l.quantityOrdered,
          quantityReceived: l.quantityReceived,
          unitPriceMmk: l.unitPriceMmk,
          lineTotalMmk: l.lineTotalMmk,
        }),
      ),
      createdAt: e.createdAt.toISOString(),
    });
  }
}
