import { hash } from 'bcrypt';
import { CODES, dateOnly } from './constants.js';
import type { SeedCtx, SeedPrisma } from './types.js';

export async function phaseB(
  prisma: SeedPrisma,
  ctx: SeedCtx,
): Promise<Partial<SeedCtx>> {
  for (const permissionId of ctx.permissionIds) {
    await prisma.rolePermission.create({
      data: { roleId: ctx.roleId, permissionId },
    });
  }

  const rootEmail = (
    process.env.ROOT_ADMIN_EMAIL || 'mhkhizilthurainzaw@gmail.com'
  )
    .trim()
    .toLowerCase();
  const rootPassword = process.env.ROOT_ADMIN_PASSWORD || 'root123';
  const rootName =
    process.env.ROOT_ADMIN_NAME ||
    process.env.ROOT_ADMIN_NICKNAME ||
    'Root Admin';

  const root = await prisma.user.create({
    data: {
      companyId: ctx.companyId,
      email: rootEmail,
      passwordHash: await hash(rootPassword, 10),
      nameEn: rootName,
      isRoot: true,
      status: 'ACTIVE',
    },
  });

  const staff = await prisma.user.create({
    data: {
      companyId: ctx.companyId,
      email: 'ops.staff@seed.local',
      passwordHash: await hash('staff123', 10),
      nameEn: 'Ops Staff',
      isRoot: false,
      status: 'ACTIVE',
    },
  });

  await prisma.userRole.create({
    data: { userId: staff.id, roleId: ctx.roleId },
  });

  const cityNear = await prisma.city.create({
    data: {
      regionId: ctx.regionId,
      code: CODES.cityNear,
      nameEn: 'Near Yangon',
      nameMm: null,
    },
  });

  const cityFar = await prisma.city.create({
    data: {
      regionId: ctx.regionId,
      code: CODES.cityFar,
      nameEn: 'Mandalay',
      nameMm: null,
    },
  });

  const product = await prisma.product.create({
    data: {
      brandId: ctx.brandId,
      code: CODES.product,
      nameEn: 'Flex Cement Bag',
      nameMm: null,
      isActive: true,
    },
  });

  const raw = await prisma.rawMaterial.create({
    data: {
      unitId: ctx.unitId,
      code: CODES.raw,
      nameEn: 'Raw Cement Mix',
      nameMm: null,
      isActive: true,
    },
  });

  const plan = await prisma.marketingPlan.create({
    data: {
      companyId: ctx.companyId,
      code: CODES.marketingPlan,
      nameEn: '2026 Awareness',
      nameMm: null,
      startDate: dateOnly('2026-01-01'),
      endDate: dateOnly('2026-12-31'),
      budgetMmk: 1_000_000,
      status: 'ACTIVE',
    },
  });

  const digital = await prisma.digitalAsset.create({
    data: {
      companyId: ctx.companyId,
      nameEn: 'Company Facebook Page',
      assetType: 'FACEBOOK_PAGE',
      url: 'https://facebook.com/flex-seed',
      isActive: true,
    },
  });

  const physical = await prisma.physicalAsset.create({
    data: {
      companyId: ctx.companyId,
      code: CODES.physicalAsset,
      nameEn: 'Delivery Truck 01',
      assetType: 'VEHICLE',
      condition: 'GOOD',
      isActive: true,
    },
  });

  console.log('[seed] phase B: auth + catalog');
  return {
    rootUserId: root.id,
    staffUserId: staff.id,
    cityNearId: cityNear.id,
    cityFarId: cityFar.id,
    productId: product.id,
    rawMaterialId: raw.id,
    marketingPlanId: plan.id,
    digitalAssetId: digital.id,
    physicalAssetId: physical.id,
  };
}
