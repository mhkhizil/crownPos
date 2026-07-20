import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
import { CustomerType } from '../../../domain/enums/customer-type.enum.js';
import { GateType } from '../../../domain/enums/gate-type.enum.js';
import { ShopType } from '../../../domain/enums/shop-type.enum.js';

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


export class CreateGateDto {
  @ApiProperty() @IsString() @IsNotEmpty() cityId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() parentGateId?: string;
  @ApiProperty() @IsString() @IsNotEmpty() code!: string;
  @ApiProperty() @IsString() @IsNotEmpty() nameEn!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nameMm?: string;
  @ApiPropertyOptional({ enum: GateType }) @IsOptional() @IsEnum(GateType) gateType?: GateType;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() addressEn?: string;
}

export class SetGateCoverageDto {
  @ApiProperty({ type: [String] }) @IsArray() @IsString({ each: true }) cityIds!: string[];
}

export class CreateCustomerDto {
  @ApiProperty() @IsString() @IsNotEmpty() code!: string;
  @ApiPropertyOptional({ enum: CustomerType }) @IsOptional() @IsEnum(CustomerType) customerType?: CustomerType;
  @ApiPropertyOptional({ enum: ShopType }) @IsOptional() @IsEnum(ShopType) shopType?: ShopType;
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
