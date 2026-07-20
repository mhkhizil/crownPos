import { CODES, dateOnly } from './constants.js';
import type { SeedCtx, SeedPrisma } from './types.js';

export async function phaseC(
  prisma: SeedPrisma,
  ctx: SeedCtx,
): Promise<Partial<SeedCtx>> {
  const yangonGate = await prisma.gate.create({
    data: {
      cityId: ctx.cityNearId,
      code: CODES.gateYangon,
      nameEn: 'Yangon Main Gate',
      gateType: 'MAIN',
      parentGateId: null,
      isActive: true,
    },
  });

  const destGate = await prisma.gate.create({
    data: {
      cityId: ctx.cityFarId,
      code: CODES.gateDest,
      nameEn: 'Mandalay Branch Gate',
      gateType: 'BRANCH',
      parentGateId: yangonGate.id,
      isActive: true,
    },
  });

  await prisma.gateCityCoverage.create({
    data: { gateId: yangonGate.id, cityId: ctx.cityNearId },
  });
  await prisma.gateCityCoverage.create({
    data: { gateId: destGate.id, cityId: ctx.cityFarId },
  });

  const factory = await prisma.factory.create({
    data: {
      companyId: ctx.companyId,
      cityId: ctx.cityNearId,
      code: CODES.factory,
      nameEn: 'Yangon Factory',
      isPrimary: true,
    },
  });

  const stock = await prisma.stockLocation.create({
    data: {
      companyId: ctx.companyId,
      factoryId: factory.id,
      code: CODES.warehouse,
      nameEn: 'Main Warehouse',
      isPrimary: true,
    },
  });

  const sku = await prisma.productSku.create({
    data: {
      productId: ctx.productId,
      unitId: ctx.unitId,
      code: CODES.sku,
      nameEn: 'Flex FG Bag',
      packSize: 1,
      isActive: true,
    },
  });

  const retiredSku = await prisma.productSku.create({
    data: {
      productId: ctx.productId,
      unitId: ctx.unitId,
      code: CODES.skuRetired,
      nameEn: 'Retired SKU (soft-deleted)',
      packSize: 1,
      isActive: false,
      deletedAt: new Date(),
    },
  });

  await prisma.supplierRawMaterial.create({
    data: {
      supplierId: ctx.supplierId,
      rawMaterialId: ctx.rawMaterialId,
      unitPriceMmk: 500,
      isPreferred: true,
    },
  });

  const campaign = await prisma.marketingCampaign.create({
    data: {
      marketingPlanId: ctx.marketingPlanId,
      brandId: ctx.brandId,
      code: CODES.campaign,
      nameEn: 'Brand Awareness Push',
      channel: 'SOCIAL',
      startDate: dateOnly('2026-03-01'),
      endDate: dateOnly('2026-03-31'),
      status: 'COMPLETED',
    },
  });

  await prisma.brandAwarenessRecord.create({
    data: {
      brandId: ctx.brandId,
      campaignId: campaign.id,
      recordDate: dateOnly('2026-03-15'),
      metricKey: 'reach',
      metricValue: 12000,
      source: 'seed',
    },
  });

  await prisma.assetDepreciationLog.create({
    data: {
      physicalAssetId: ctx.physicalAssetId,
      periodDate: dateOnly('2026-06-01'),
      depreciationMmk: 50_000,
      bookValueAfterMmk: 950_000,
    },
  });

  console.log('[seed] phase C: geo + factory');
  return {
    yangonGateId: yangonGate.id,
    destGateId: destGate.id,
    factoryId: factory.id,
    stockLocationId: stock.id,
    skuId: sku.id,
    retiredSkuId: retiredSku.id,
    campaignId: campaign.id,
  };
}
