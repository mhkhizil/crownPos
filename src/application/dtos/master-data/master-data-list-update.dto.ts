import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../common/pagination.dto.js';
import {
  CreateCityDto,
  CreateCustomerDto,
  CreateGateDto,
  CreateNamedCodeDto,
  CreateProductDto,
  CreateProductSkuDto,
  CreateRawMaterialDto,
  CreateSupplierDto,
  LinkSupplierRawMaterialDto,
} from './master-data-request.dto.js';

export class MasterDataListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search code / nameEn / nameMm' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class CityListQueryDto extends MasterDataListQueryDto {
  @ApiPropertyOptional({ description: 'Filter by region id' })
  @IsOptional()
  @IsString()
  regionId?: string;
}

export class UpdateNamedCodeDto extends PartialType(CreateNamedCodeDto) {}
export class UpdateProductDto extends PartialType(CreateProductDto) {}
export class UpdateProductSkuDto extends PartialType(CreateProductSkuDto) {}
export class UpdateCityDto extends PartialType(CreateCityDto) {}
export class UpdateGateDto extends PartialType(CreateGateDto) {}
export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {}
export class UpdateSupplierDto extends PartialType(CreateSupplierDto) {}
export class UpdateRawMaterialDto extends PartialType(CreateRawMaterialDto) {}
export class UpdateSupplierRawMaterialDto extends PartialType(
  LinkSupplierRawMaterialDto,
) {}
