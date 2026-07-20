import type { Prisma } from '@prisma/client';
import {
  CityProductPriceEntity,
  CustomerProductPriceEntity,
  ResolvedPriceEntity,
  VolumePriceTierEntity,
} from '../../domain/entities/pricing.entity.js';

function num(v: { toNumber?: () => number } | number | null | undefined): number {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  return Number(v);
}


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
