import { CODES, QTY, dateOnly } from './constants.js';
import type { SeedCtx, SeedPrisma } from './types.js';

export async function phaseD(
  prisma: SeedPrisma,
  ctx: SeedCtx,
): Promise<Partial<SeedCtx>> {
  const customerNear = await prisma.customer.create({
    data: {
      cityId: ctx.cityNearId,
      preferredGateId: ctx.yangonGateId,
      code: CODES.customerNear,
      nameEn: 'Nearby Shop',
      customerType: 'SHOP',
      shopType: 'HARDWARE',
      isActive: true,
    },
  });

  const customerFar = await prisma.customer.create({
    data: {
      cityId: ctx.cityFarId,
      preferredGateId: ctx.destGateId,
      code: CODES.customerFar,
      nameEn: 'Far Hardware',
      customerType: 'SHOP',
      shopType: 'HARDWARE',
      isActive: true,
    },
  });

  await prisma.customerTarget.create({
    data: {
      customerId: customerNear.id,
      salespersonUserId: ctx.staffUserId,
      isTarget: true,
      priority: 'HIGH',
      potentialVolume: 'HIGH',
    },
  });

  await prisma.customerProductPrice.create({
    data: {
      customerId: customerNear.id,
      productSkuId: ctx.skuId,
      unitId: ctx.unitId,
      unitPriceMmk: QTY.unitPriceMmk,
      effectiveFrom: dateOnly('2026-01-01'),
    },
  });

  await prisma.volumePriceTier.create({
    data: {
      productSkuId: ctx.skuId,
      unitId: ctx.unitId,
      customerId: null,
      minQuantity: 50,
      maxQuantity: 9999,
      unitPriceMmk: QTY.unitPriceMmk - 500,
      effectiveFrom: dateOnly('2026-01-01'),
    },
  });

  await prisma.cityProductPrice.create({
    data: {
      cityId: ctx.cityNearId,
      productSkuId: ctx.skuId,
      unitId: ctx.unitId,
      unitPriceMmk: QTY.unitPriceMmk,
      effectiveFrom: dateOnly('2026-01-01'),
    },
  });

  const bom = await prisma.billOfMaterial.create({
    data: {
      productSkuId: ctx.skuId,
      outputUnitId: ctx.unitId,
      code: CODES.bom,
      nameEn: 'FG BOM estimate',
      outputQuantity: 1,
      isActive: true,
    },
  });

  await prisma.billOfMaterialLine.create({
    data: {
      billOfMaterialId: bom.id,
      rawMaterialId: ctx.rawMaterialId,
      unitId: ctx.unitId,
      quantity: 0.25,
      sortOrder: 1,
    },
  });

  console.log('[seed] phase D: customers + pricing + BOM');
  return {
    customerNearId: customerNear.id,
    customerFarId: customerFar.id,
    bomId: bom.id,
  };
}
