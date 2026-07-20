import type { Prisma } from '@prisma/client';
import {
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
} from '../../domain/entities/master-data.entity.js';
import { CustomerType } from '../../domain/enums/customer-type.enum.js';
import { GateType } from '../../domain/enums/gate-type.enum.js';
import { ShopType } from '../../domain/enums/shop-type.enum.js';

function num(v: { toNumber?: () => number } | number | null | undefined): number {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  return Number(v);
}


export class MasterDataMapper {
  static namedCode(
    row: {
      id: string;
      code: string;
      nameEn: string;
      nameMm: string | null;
      createdAt: Date;
      updatedAt: Date;
      deletedAt: Date | null;
      symbol?: string | null;
      description?: string | null;
    },
  ): NamedCodeEntity {
    return new NamedCodeEntity(
      row.id,
      row.code,
      row.nameEn,
      row.nameMm,
      row.createdAt,
      row.updatedAt,
      row.deletedAt,
      {
        symbol: row.symbol ?? null,
        description: row.description ?? null,
      },
    );
  }

  static product(row: Prisma.ProductGetPayload<object>): ProductEntity {
    return new ProductEntity(
      row.id,
      row.brandId,
      row.code,
      row.nameEn,
      row.nameMm,
      row.description,
      row.createdAt,
      row.updatedAt,
      row.deletedAt,
    );
  }

  static sku(row: Prisma.ProductSkuGetPayload<object>): ProductSkuEntity {
    return new ProductSkuEntity(
      row.id,
      row.productId,
      row.unitId,
      row.code,
      row.nameEn,
      row.nameMm,
      row.packSize == null ? null : num(row.packSize),
      row.createdAt,
      row.updatedAt,
      row.deletedAt,
    );
  }

  static city(row: Prisma.CityGetPayload<object>): CityEntity {
    return new CityEntity(
      row.id,
      row.regionId,
      row.code,
      row.nameEn,
      row.nameMm,
      row.createdAt,
      row.updatedAt,
      row.deletedAt,
    );
  }

  static gate(
    row: Prisma.GateGetPayload<object> & {
      cityCoverages?: Array<{ cityId: string; deletedAt: Date | null }>;
    },
  ): GateEntity {
    return new GateEntity(
      row.id,
      row.cityId,
      row.parentGateId,
      row.code,
      row.nameEn,
      row.nameMm,
      row.gateType as GateType,
      row.phone,
      row.addressEn,
      (row.cityCoverages ?? [])
        .filter((c) => !c.deletedAt)
        .map((c) => c.cityId),
      row.createdAt,
      row.updatedAt,
      row.deletedAt,
    );
  }

  static customer(row: Prisma.CustomerGetPayload<object>): CustomerEntity {
    return new CustomerEntity(
      row.id,
      row.code,
      row.customerType as CustomerType,
      row.shopType as ShopType | null,
      row.nameEn,
      row.nameMm,
      row.phone,
      row.cityId,
      row.preferredGateId,
      row.addressEn,
      row.createdAt,
      row.updatedAt,
      row.deletedAt,
    );
  }

  static supplier(row: Prisma.SupplierGetPayload<object>): SupplierEntity {
    return new SupplierEntity(
      row.id,
      row.code,
      row.nameEn,
      row.nameMm,
      row.phone,
      row.addressEn,
      row.createdAt,
      row.updatedAt,
      row.deletedAt,
    );
  }

  static rawMaterial(row: Prisma.RawMaterialGetPayload<object>): RawMaterialEntity {
    return new RawMaterialEntity(
      row.id,
      row.code,
      row.nameEn,
      row.nameMm,
      row.unitId,
      row.description,
      row.createdAt,
      row.updatedAt,
      row.deletedAt,
    );
  }

  static supplierRaw(
    row: Prisma.SupplierRawMaterialGetPayload<object>,
  ): SupplierRawMaterialEntity {
    return new SupplierRawMaterialEntity(
      row.id,
      row.supplierId,
      row.rawMaterialId,
      row.unitPriceMmk == null ? null : num(row.unitPriceMmk),
      row.isPreferred,
    );
  }

  static companyContext(
    company: Prisma.CompanyGetPayload<{
      include: { factories: true; stockLocations: true };
    }> | null,
  ): CompanyContextEntity {
    if (!company) return new CompanyContextEntity([]);
    return new CompanyContextEntity([
      {
        id: company.id,
        code: company.code,
        nameEn: company.nameEn,
        nameMm: company.nameMm,
        factories: (company.factories ?? [])
          .filter((f) => !f.deletedAt)
          .map((f) => ({ id: f.id, code: f.code, nameEn: f.nameEn })),
        stockLocations: (company.stockLocations ?? [])
          .filter((s) => !s.deletedAt)
          .map((s) => ({
            id: s.id,
            code: s.code,
            nameEn: s.nameEn,
            isPrimary: s.isPrimary,
          })),
      },
    ]);
  }
}
