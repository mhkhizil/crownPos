import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
