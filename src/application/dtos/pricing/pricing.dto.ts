import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
