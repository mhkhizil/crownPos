import type {
  CityProductPriceEntity,
  CustomerProductPriceEntity,
  ResolvedPriceEntity,
  VolumePriceTierEntity,
} from '../entities/pricing.entity.js';

export const PRICING_REPOSITORY = Symbol('PRICING_REPOSITORY');

export interface UpsertCustomerPriceInput {
  customerId: string;
  productSkuId: string;
  unitId: string;
  unitPriceMmk: number;
  effectiveFrom: string;
  effectiveTo?: string;
}

export interface UpsertVolumeTierInput {
  productSkuId: string;
  customerId?: string;
  unitId: string;
  minQuantity: number;
  maxQuantity?: number;
  unitPriceMmk: number;
  effectiveFrom: string;
}

export interface UpsertCityPriceInput {
  cityId: string;
  productSkuId: string;
  unitId: string;
  unitPriceMmk: number;
  effectiveFrom: string;
}

export interface ResolvePriceInput {
  productSkuId: string;
  customerId?: string;
  cityId?: string;
  quantity: number;
}

export interface IPricingRepository {
  upsertCustomerPrice(
    data: UpsertCustomerPriceInput,
  ): Promise<CustomerProductPriceEntity>;
  upsertVolumeTier(data: UpsertVolumeTierInput): Promise<VolumePriceTierEntity>;
  upsertCityPrice(data: UpsertCityPriceInput): Promise<CityProductPriceEntity>;
  resolvePrice(input: ResolvePriceInput): Promise<ResolvedPriceEntity | null>;
}
