import type { PrismaClient } from '@prisma/client';

export type SeedPrisma = InstanceType<typeof PrismaClient>;

export type SeedCtx = {
  prisma: SeedPrisma;
  // Phase A
  companyId: string;
  regionId: string;
  unitId: string;
  brandId: string;
  roleId: string;
  permissionIds: string[];
  supplierId: string;
  orphanPaymentId: string;
  // Phase B
  rootUserId: string;
  staffUserId: string;
  cityNearId: string;
  cityFarId: string;
  productId: string;
  rawMaterialId: string;
  marketingPlanId: string;
  digitalAssetId: string;
  physicalAssetId: string;
  // Phase C
  yangonGateId: string;
  destGateId: string;
  factoryId: string;
  stockLocationId: string;
  skuId: string;
  retiredSkuId: string;
  campaignId: string;
  // Phase D
  customerNearId: string;
  customerFarId: string;
  bomId: string;
  // Phase E–F populated as needed
  productionDate: Date;
};
