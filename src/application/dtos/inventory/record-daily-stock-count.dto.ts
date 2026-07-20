import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
import { InventoryItemType } from '../../../domain/enums/inventory-item-type.enum.js';

export class StockCountLineDto {
  @ApiProperty({ enum: InventoryItemType })
  @IsEnum(InventoryItemType)
  itemType!: InventoryItemType;
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
