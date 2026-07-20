import { CODES, PERMISSIONS, dateOnly } from './constants.js';
import type { SeedCtx, SeedPrisma } from './types.js';

/** Company, Region, Unit, Brand, Role, Permission, Supplier, snapshots, orphan Payment */
export async function phaseA(prisma: SeedPrisma): Promise<Partial<SeedCtx>> {
  const permissionIds: string[] = [];
  for (const p of PERMISSIONS) {
    const row = await prisma.permission.create({ data: { ...p } });
    permissionIds.push(row.id);
  }

  const role = await prisma.role.create({
    data: {
      code: CODES.roleOps,
      nameEn: 'Operations Staff',
      nameMm: null,
      isSystem: false,
    },
  });

  const company = await prisma.company.create({
    data: {
      code: CODES.company,
      nameEn: 'Main Manufacturing Company',
      nameMm: 'အဓိက ကုမ္ပဏီ',
    },
  });

  const region = await prisma.region.create({
    data: { code: CODES.region, nameEn: 'Yangon Region', nameMm: null },
  });

  const unit = await prisma.unit.create({
    data: { code: CODES.unit, nameEn: 'Bag', nameMm: null, symbol: 'bag' },
  });

  const brand = await prisma.brand.create({
    data: {
      code: CODES.brand,
      nameEn: 'Flex Brand',
      nameMm: null,
      isActive: true,
    },
  });

  const supplier = await prisma.supplier.create({
    data: {
      code: CODES.supplier,
      nameEn: 'Yangon Raw Supplier',
      nameMm: null,
      isActive: true,
    },
  });

  await prisma.salesDailySnapshot.create({
    data: {
      snapshotDate: dateOnly('2026-06-15'),
      totalOrders: 1,
      totalCustomersSold: 1,
      totalQtySold: 8,
      totalSalesMmk: 80_000,
      totalCollectedMmk: 80_000,
    },
  });

  await prisma.productionDailySnapshot.create({
    data: {
      snapshotDate: dateOnly('2026-06-01'),
      totalSkuLines: 1,
      totalQuantityProduced: 200,
    },
  });

  // Standalone payment (no allocation yet) so Payment table is covered early.
  const orphanPayment = await prisma.payment.create({
    data: {
      paymentNumber: CODES.payOrphan,
      paymentDate: dateOnly('2026-05-01'),
      method: 'CASH_ON_DELIVERY',
      status: 'CONFIRMED',
      amountMmk: 0,
    },
  });

  console.log('[seed] phase A: roots');
  return {
    companyId: company.id,
    regionId: region.id,
    unitId: unit.id,
    brandId: brand.id,
    roleId: role.id,
    permissionIds,
    supplierId: supplier.id,
    orphanPaymentId: orphanPayment.id,
  };
}
