export class CustomerProductPriceEntity {
  constructor(
    public readonly id: string,
    public readonly customerId: string,
    public readonly productSkuId: string,
    public readonly unitId: string,
    public readonly unitPriceMmk: number,
    public readonly effectiveFrom: Date,
    public readonly effectiveTo: Date | null,
  ) {}
}

export class VolumePriceTierEntity {
  constructor(
    public readonly id: string,
    public readonly productSkuId: string,
    public readonly customerId: string | null,
    public readonly unitId: string,
    public readonly minQuantity: number,
    public readonly maxQuantity: number | null,
    public readonly unitPriceMmk: number,
    public readonly effectiveFrom: Date,
  ) {}
}

export class CityProductPriceEntity {
  constructor(
    public readonly id: string,
    public readonly cityId: string,
    public readonly productSkuId: string,
    public readonly unitId: string,
    public readonly unitPriceMmk: number,
    public readonly effectiveFrom: Date,
  ) {}
}

export class ResolvedPriceEntity {
  constructor(
    public readonly unitPriceMmk: number,
    public readonly source: 'CUSTOMER' | 'VOLUME' | 'CITY',
  ) {}
}
