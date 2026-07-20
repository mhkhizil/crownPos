import type { CustomerType } from '../enums/customer-type.enum.js';
import type { GateType } from '../enums/gate-type.enum.js';
import type { ShopType } from '../enums/shop-type.enum.js';

export class NamedCodeEntity {
  constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly nameEn: string,
    public readonly nameMm: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
    public readonly extra: Record<string, string | number | null> = {},
  ) {}
}

export class ProductEntity {
  constructor(
    public readonly id: string,
    public readonly brandId: string,
    public readonly code: string,
    public readonly nameEn: string,
    public readonly nameMm: string | null,
    public readonly description: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}

export class ProductSkuEntity {
  constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly unitId: string,
    public readonly code: string,
    public readonly nameEn: string,
    public readonly nameMm: string | null,
    public readonly packSize: number | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}

export class CityEntity {
  constructor(
    public readonly id: string,
    public readonly regionId: string,
    public readonly code: string,
    public readonly nameEn: string,
    public readonly nameMm: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}

export class GateEntity {
  constructor(
    public readonly id: string,
    public readonly cityId: string,
    public readonly parentGateId: string | null,
    public readonly code: string,
    public readonly nameEn: string,
    public readonly nameMm: string | null,
    public readonly gateType: GateType,
    public readonly phone: string | null,
    public readonly addressEn: string | null,
    public readonly coveredCityIds: string[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}

export class CustomerEntity {
  constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly customerType: CustomerType,
    public readonly shopType: ShopType | null,
    public readonly nameEn: string,
    public readonly nameMm: string | null,
    public readonly phone: string | null,
    public readonly cityId: string,
    public readonly preferredGateId: string | null,
    public readonly addressEn: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}

export class SupplierEntity {
  constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly nameEn: string,
    public readonly nameMm: string | null,
    public readonly phone: string | null,
    public readonly addressEn: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}

export class RawMaterialEntity {
  constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly nameEn: string,
    public readonly nameMm: string | null,
    public readonly unitId: string,
    public readonly description: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}

export class SupplierRawMaterialEntity {
  constructor(
    public readonly id: string,
    public readonly supplierId: string,
    public readonly rawMaterialId: string,
    public readonly unitPriceMmk: number | null,
    public readonly isPreferred: boolean,
  ) {}
}

export class CompanyContextEntity {
  constructor(
    public readonly companies: Array<{
      id: string;
      code: string;
      nameEn: string;
      nameMm: string | null;
      factories: Array<{ id: string; code: string; nameEn: string }>;
      stockLocations: Array<{ id: string; code: string; nameEn: string; isPrimary: boolean }>;
    }>,
  ) {}
}
