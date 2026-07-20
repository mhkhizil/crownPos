import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
import { CustomerType } from '../../../domain/enums/customer-type.enum.js';
import { GateType } from '../../../domain/enums/gate-type.enum.js';
import { ShopType } from '../../../domain/enums/shop-type.enum.js';

function iso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

export class NamedCodeResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() code!: string;
  @ApiProperty() nameEn!: string;
  @ApiPropertyOptional({ nullable: true }) nameMm!: string | null;
  @ApiPropertyOptional({ nullable: true }) symbol?: string | null;
  @ApiPropertyOptional({ nullable: true }) description?: string | null;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
  @ApiPropertyOptional({ nullable: true }) deletedAt!: string | null;

  static fromEntity(e: NamedCodeEntity): NamedCodeResponseDto {
    const d = new NamedCodeResponseDto();
    d.id = e.id;
    d.code = e.code;
    d.nameEn = e.nameEn;
    d.nameMm = e.nameMm;
    d.symbol = (e.extra.symbol as string | null) ?? null;
    d.description = (e.extra.description as string | null) ?? null;
    d.createdAt = e.createdAt.toISOString();
    d.updatedAt = e.updatedAt.toISOString();
    d.deletedAt = iso(e.deletedAt);
    return d;
  }
}

export class ProductResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() brandId!: string;
  @ApiProperty() code!: string;
  @ApiProperty() nameEn!: string;
  @ApiPropertyOptional({ nullable: true }) nameMm!: string | null;
  @ApiPropertyOptional({ nullable: true }) description!: string | null;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
  @ApiPropertyOptional({ nullable: true }) deletedAt!: string | null;

  static fromEntity(e: ProductEntity): ProductResponseDto {
    const d = new ProductResponseDto();
    d.id = e.id;
    d.brandId = e.brandId;
    d.code = e.code;
    d.nameEn = e.nameEn;
    d.nameMm = e.nameMm;
    d.description = e.description;
    d.createdAt = e.createdAt.toISOString();
    d.updatedAt = e.updatedAt.toISOString();
    d.deletedAt = iso(e.deletedAt);
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
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
  @ApiPropertyOptional({ nullable: true }) deletedAt!: string | null;

  static fromEntity(e: ProductSkuEntity): ProductSkuResponseDto {
    const d = new ProductSkuResponseDto();
    d.id = e.id;
    d.productId = e.productId;
    d.unitId = e.unitId;
    d.code = e.code;
    d.nameEn = e.nameEn;
    d.nameMm = e.nameMm;
    d.packSize = e.packSize;
    d.createdAt = e.createdAt.toISOString();
    d.updatedAt = e.updatedAt.toISOString();
    d.deletedAt = iso(e.deletedAt);
    return d;
  }
}

export class CityResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() regionId!: string;
  @ApiProperty() code!: string;
  @ApiProperty() nameEn!: string;
  @ApiPropertyOptional({ nullable: true }) nameMm!: string | null;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
  @ApiPropertyOptional({ nullable: true }) deletedAt!: string | null;

  static fromEntity(e: CityEntity): CityResponseDto {
    const d = new CityResponseDto();
    d.id = e.id;
    d.regionId = e.regionId;
    d.code = e.code;
    d.nameEn = e.nameEn;
    d.nameMm = e.nameMm;
    d.createdAt = e.createdAt.toISOString();
    d.updatedAt = e.updatedAt.toISOString();
    d.deletedAt = iso(e.deletedAt);
    return d;
  }
}

export class GateResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() cityId!: string;
  @ApiPropertyOptional({ nullable: true }) parentGateId!: string | null;
  @ApiProperty() code!: string;
  @ApiProperty() nameEn!: string;
  @ApiPropertyOptional({ nullable: true }) nameMm!: string | null;
  @ApiProperty({ enum: GateType }) gateType!: GateType;
  @ApiPropertyOptional({ nullable: true }) phone!: string | null;
  @ApiPropertyOptional({ nullable: true }) addressEn!: string | null;
  @ApiProperty({ type: [String] }) coveredCityIds!: string[];
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
  @ApiPropertyOptional({ nullable: true }) deletedAt!: string | null;

  static fromEntity(e: GateEntity): GateResponseDto {
    const d = new GateResponseDto();
    d.id = e.id;
    d.cityId = e.cityId;
    d.parentGateId = e.parentGateId;
    d.code = e.code;
    d.nameEn = e.nameEn;
    d.nameMm = e.nameMm;
    d.gateType = e.gateType;
    d.phone = e.phone;
    d.addressEn = e.addressEn;
    d.coveredCityIds = e.coveredCityIds;
    d.createdAt = e.createdAt.toISOString();
    d.updatedAt = e.updatedAt.toISOString();
    d.deletedAt = iso(e.deletedAt);
    return d;
  }
}

export class CustomerResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() code!: string;
  @ApiProperty({ enum: CustomerType }) customerType!: CustomerType;
  @ApiPropertyOptional({ enum: ShopType, nullable: true }) shopType!: ShopType | null;
  @ApiProperty() nameEn!: string;
  @ApiPropertyOptional({ nullable: true }) nameMm!: string | null;
  @ApiPropertyOptional({ nullable: true }) phone!: string | null;
  @ApiProperty() cityId!: string;
  @ApiPropertyOptional({ nullable: true }) preferredGateId!: string | null;
  @ApiPropertyOptional({ nullable: true }) addressEn!: string | null;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
  @ApiPropertyOptional({ nullable: true }) deletedAt!: string | null;

  static fromEntity(e: CustomerEntity): CustomerResponseDto {
    const d = new CustomerResponseDto();
    d.id = e.id;
    d.code = e.code;
    d.customerType = e.customerType;
    d.shopType = e.shopType;
    d.nameEn = e.nameEn;
    d.nameMm = e.nameMm;
    d.phone = e.phone;
    d.cityId = e.cityId;
    d.preferredGateId = e.preferredGateId;
    d.addressEn = e.addressEn;
    d.createdAt = e.createdAt.toISOString();
    d.updatedAt = e.updatedAt.toISOString();
    d.deletedAt = iso(e.deletedAt);
    return d;
  }
}

export class SupplierResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() code!: string;
  @ApiProperty() nameEn!: string;
  @ApiPropertyOptional({ nullable: true }) nameMm!: string | null;
  @ApiPropertyOptional({ nullable: true }) phone!: string | null;
  @ApiPropertyOptional({ nullable: true }) addressEn!: string | null;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
  @ApiPropertyOptional({ nullable: true }) deletedAt!: string | null;

  static fromEntity(e: SupplierEntity): SupplierResponseDto {
    const d = new SupplierResponseDto();
    d.id = e.id;
    d.code = e.code;
    d.nameEn = e.nameEn;
    d.nameMm = e.nameMm;
    d.phone = e.phone;
    d.addressEn = e.addressEn;
    d.createdAt = e.createdAt.toISOString();
    d.updatedAt = e.updatedAt.toISOString();
    d.deletedAt = iso(e.deletedAt);
    return d;
  }
}

export class RawMaterialResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() code!: string;
  @ApiProperty() nameEn!: string;
  @ApiPropertyOptional({ nullable: true }) nameMm!: string | null;
  @ApiProperty() unitId!: string;
  @ApiPropertyOptional({ nullable: true }) description!: string | null;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
  @ApiPropertyOptional({ nullable: true }) deletedAt!: string | null;

  static fromEntity(e: RawMaterialEntity): RawMaterialResponseDto {
    const d = new RawMaterialResponseDto();
    d.id = e.id;
    d.code = e.code;
    d.nameEn = e.nameEn;
    d.nameMm = e.nameMm;
    d.unitId = e.unitId;
    d.description = e.description;
    d.createdAt = e.createdAt.toISOString();
    d.updatedAt = e.updatedAt.toISOString();
    d.deletedAt = iso(e.deletedAt);
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
    d.id = e.id;
    d.supplierId = e.supplierId;
    d.rawMaterialId = e.rawMaterialId;
    d.unitPriceMmk = e.unitPriceMmk;
    d.isPreferred = e.isPreferred;
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
