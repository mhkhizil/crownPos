import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { toDateOnly, toDecimal } from './_prisma-helpers.js';
import { PricingMapper } from '../mappers/pricing.mapper.js';
import type {
  IPricingRepository,
  ResolvePriceInput,
  UpsertCityPriceInput,
  UpsertCustomerPriceInput,
  UpsertVolumeTierInput,
} from '../../domain/repositories/pricing.repository.interface.js';
import type {
  CityProductPriceEntity,
  CustomerProductPriceEntity,
  ResolvedPriceEntity,
  VolumePriceTierEntity,
} from '../../domain/entities/pricing.entity.js';

@Injectable()
export class PricingRepository implements IPricingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsertCustomerPrice(
    data: UpsertCustomerPriceInput,
  ): Promise<CustomerProductPriceEntity> {
    const row = await this.prisma.customerProductPrice.create({
      data: {
        customerId: data.customerId,
        productSkuId: data.productSkuId,
        unitId: data.unitId,
        unitPriceMmk: toDecimal(data.unitPriceMmk),
        effectiveFrom: toDateOnly(data.effectiveFrom),
        effectiveTo: data.effectiveTo ? toDateOnly(data.effectiveTo) : null,
      },
    });
    return PricingMapper.customerToDomain(row);
  }

  async upsertVolumeTier(
    data: UpsertVolumeTierInput,
  ): Promise<VolumePriceTierEntity> {
    const row = await this.prisma.volumePriceTier.create({
      data: {
        productSkuId: data.productSkuId,
        customerId: data.customerId ?? null,
        unitId: data.unitId,
        minQuantity: toDecimal(data.minQuantity),
        maxQuantity:
          data.maxQuantity != null ? toDecimal(data.maxQuantity) : null,
        unitPriceMmk: toDecimal(data.unitPriceMmk),
        effectiveFrom: toDateOnly(data.effectiveFrom),
      },
    });
    return PricingMapper.volumeToDomain(row);
  }

  async upsertCityPrice(
    data: UpsertCityPriceInput,
  ): Promise<CityProductPriceEntity> {
    const row = await this.prisma.cityProductPrice.create({
      data: {
        cityId: data.cityId,
        productSkuId: data.productSkuId,
        unitId: data.unitId,
        unitPriceMmk: toDecimal(data.unitPriceMmk),
        effectiveFrom: toDateOnly(data.effectiveFrom),
      },
    });
    return PricingMapper.cityToDomain(row);
  }

  async resolvePrice(
    input: ResolvePriceInput,
  ): Promise<ResolvedPriceEntity | null> {
    const today = new Date();
    if (input.customerId) {
      const cp = await this.prisma.customerProductPrice.findFirst({
        where: {
          deletedAt: null,
          customerId: input.customerId,
          productSkuId: input.productSkuId,
          effectiveFrom: { lte: today },
          OR: [{ effectiveTo: null }, { effectiveTo: { gte: today } }],
        },
        orderBy: { effectiveFrom: 'desc' },
      });
      if (cp) {
        return PricingMapper.resolved(Number(cp.unitPriceMmk), 'CUSTOMER');
      }
    }

    const tier = await this.prisma.volumePriceTier.findFirst({
      where: {
        deletedAt: null,
        productSkuId: input.productSkuId,
        minQuantity: { lte: toDecimal(input.quantity) },
        effectiveFrom: { lte: today },
        AND: [
          {
            OR: [
              { customerId: null },
              ...(input.customerId ? [{ customerId: input.customerId }] : []),
            ],
          },
          {
            OR: [
              { maxQuantity: null },
              { maxQuantity: { gte: toDecimal(input.quantity) } },
            ],
          },
        ],
      },
      orderBy: { minQuantity: 'desc' },
    });
    if (tier) {
      return PricingMapper.resolved(Number(tier.unitPriceMmk), 'VOLUME');
    }

    if (input.cityId) {
      const cityPrice = await this.prisma.cityProductPrice.findFirst({
        where: {
          deletedAt: null,
          cityId: input.cityId,
          productSkuId: input.productSkuId,
          effectiveFrom: { lte: today },
        },
        orderBy: { effectiveFrom: 'desc' },
      });
      if (cityPrice) {
        return PricingMapper.resolved(Number(cityPrice.unitPriceMmk), 'CITY');
      }
    }
    return null;
  }
}
