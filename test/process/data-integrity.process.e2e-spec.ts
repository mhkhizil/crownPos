/**
 * Data integrity suite against the full Prisma seed.
 * Prerequisite: `npm run db:seed` (stable codes in prisma/seed/constants.ts).
 * Do not run in parallel with another truncate.
 */
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
  canConnectDatabase,
  createProcessPrisma,
  type ProcessPrisma,
} from './process-prisma.js';
import {
  CODES,
  EXPECTED_FG_AVAILABLE,
  EXPECTED_RAW_AVAILABLE,
  PERMISSIONS,
  QTY,
} from '../../prisma/seed/constants.js';

const MODEL_DELEGATES = [
  'company',
  'factory',
  'user',
  'role',
  'permission',
  'rolePermission',
  'userRole',
  'unit',
  'brand',
  'product',
  'productSku',
  'rawMaterial',
  'supplier',
  'supplierRawMaterial',
  'purchaseOrder',
  'purchaseOrderLine',
  'billOfMaterial',
  'billOfMaterialLine',
  'productionDailyRecord',
  'productionDailyWorker',
  'productionDailyLine',
  'productionDailyRawUsage',
  'stockLocation',
  'inventoryBalance',
  'dailyStockCount',
  'dailyStockCountLine',
  'region',
  'city',
  'gate',
  'gateCityCoverage',
  'customer',
  'customerTarget',
  'customerProductPrice',
  'volumePriceTier',
  'cityProductPrice',
  'salesOrder',
  'salesOrderLine',
  'factoryOutbound',
  'factoryOutboundLine',
  'outboundStatusLog',
  'invoice',
  'invoiceLine',
  'invoiceInstallment',
  'payment',
  'paymentAllocation',
  'collectionReminder',
  'marketingPlan',
  'marketingCampaign',
  'brandAwarenessRecord',
  'salesDailySnapshot',
  'productionDailySnapshot',
  'digitalAsset',
  'physicalAsset',
  'assetDepreciationLog',
  'zakatPayment',
] as const;

describe('Data integrity (full seed)', () => {
  let prisma: ProcessPrisma;
  let dbOk = false;

  beforeAll(async () => {
    prisma = createProcessPrisma();
    dbOk = await canConnectDatabase(prisma);
    if (!dbOk) return;

    const company = await prisma.company.findFirst({
      where: { code: CODES.company, deletedAt: null },
    });
    if (!company) {
      throw new Error(
        `Seed missing company ${CODES.company}. Run: npm run db:seed`,
      );
    }
  });

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  function requireDb() {
    if (!dbOk) {
      throw new Error('DATABASE_URL unreachable — skip integrity suite');
    }
  }

  it('every model has at least one row (productSku includes soft-deleted retired)', async () => {
    requireDb();
    const missing: string[] = [];
    for (const m of MODEL_DELEGATES) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const count = await (prisma as any)[m].count();
      if (count < 1) missing.push(m);
    }
    expect(missing).toEqual([]);
  });

  it('auth graph: 11 permissions, root isRoot, staff role linked', async () => {
    requireDb();
    const perms = await prisma.permission.findMany({
      where: { deletedAt: null },
    });
    expect(perms).toHaveLength(PERMISSIONS.length);
    expect(perms.map((p) => p.code).sort()).toEqual(
      [...PERMISSIONS.map((p) => p.code)].sort(),
    );

    const rootEmail = (
      process.env.ROOT_ADMIN_EMAIL || 'mhkhizilthurainzaw@gmail.com'
    )
      .trim()
      .toLowerCase();
    const root = await prisma.user.findUnique({ where: { email: rootEmail } });
    expect(root?.isRoot).toBe(true);
    expect(root?.deletedAt).toBeNull();

    const staff = await prisma.user.findUnique({
      where: { email: 'ops.staff@seed.local' },
    });
    expect(staff?.isRoot).toBe(false);
    const ur = await prisma.userRole.count({
      where: { userId: staff!.id, deletedAt: null },
    });
    expect(ur).toBeGreaterThanOrEqual(1);
    const rp = await prisma.rolePermission.count({
      where: { deletedAt: null },
    });
    expect(rp).toBe(PERMISSIONS.length);
  });

  it('FK reachability for core chains', async () => {
    requireDb();
    const factory = await prisma.factory.findFirst({
      where: { code: CODES.factory, deletedAt: null },
    });
    expect(factory).toBeTruthy();
    const company = await prisma.company.findUnique({
      where: { id: factory!.companyId },
    });
    expect(company?.deletedAt).toBeNull();

    const sku = await prisma.productSku.findFirst({
      where: { code: CODES.sku, deletedAt: null },
    });
    expect(sku).toBeTruthy();
    const product = await prisma.product.findUnique({
      where: { id: sku!.productId },
    });
    expect(product?.deletedAt).toBeNull();

    const customer = await prisma.customer.findFirst({
      where: { code: CODES.customerNear, deletedAt: null },
    });
    expect(customer).toBeTruthy();
    const city = await prisma.city.findUnique({
      where: { id: customer!.cityId },
    });
    expect(city?.deletedAt).toBeNull();
  });

  it('inventory XOR and non-negative balances match seed math', async () => {
    requireDb();
    const bals = await prisma.inventoryBalance.findMany({
      where: { deletedAt: null },
    });
    expect(bals.length).toBeGreaterThanOrEqual(2);
    for (const b of bals) {
      const hasRaw = b.rawMaterialId != null;
      const hasSku = b.productSkuId != null;
      expect(hasRaw !== hasSku).toBe(true);
      if (b.itemType === 'RAW_MATERIAL') {
        expect(hasRaw).toBe(true);
        expect(hasSku).toBe(false);
      } else {
        expect(hasSku).toBe(true);
        expect(hasRaw).toBe(false);
      }
      expect(Number(b.quantityAvailable)).toBeGreaterThanOrEqual(0);
    }

    const sku = await prisma.productSku.findFirst({
      where: { code: CODES.sku, deletedAt: null },
    });
    const fg = bals.find(
      (b) =>
        b.itemType === 'FINISHED_GOOD' && b.productSkuId === sku!.id,
    );
    expect(Number(fg!.quantityAvailable)).toBe(EXPECTED_FG_AVAILABLE);

    const raw = await prisma.rawMaterial.findFirst({
      where: { code: CODES.raw, deletedAt: null },
    });
    const rawBal = bals.find(
      (b) => b.itemType === 'RAW_MATERIAL' && b.rawMaterialId === raw!.id,
    );
    expect(Number(rawBal!.quantityAvailable)).toBe(EXPECTED_RAW_AVAILABLE);
  });

  it('soft-deleted retired SKU is not referenced by active order lines', async () => {
    requireDb();
    const retired = await prisma.productSku.findFirst({
      where: { code: CODES.skuRetired },
    });
    expect(retired?.deletedAt).toBeTruthy();
    const activeLines = await prisma.salesOrderLine.count({
      where: { productSkuId: retired!.id, deletedAt: null },
    });
    expect(activeLines).toBe(0);
  });

  it('CONFIRMED reservation ≤ physical FG', async () => {
    requireDb();
    const sku = await prisma.productSku.findFirst({
      where: { code: CODES.sku, deletedAt: null },
    });
    const fg = await prisma.inventoryBalance.findFirst({
      where: {
        deletedAt: null,
        itemType: 'FINISHED_GOOD',
        productSkuId: sku!.id,
      },
    });
    const committed = await prisma.salesOrderLine.aggregate({
      where: {
        deletedAt: null,
        productSkuId: sku!.id,
        salesOrder: { deletedAt: null, status: 'CONFIRMED' },
      },
      _sum: { quantity: true },
    });
    const reserved = Number(committed._sum.quantity ?? 0);
    expect(reserved).toBe(QTY.soConfirmed);
    expect(reserved).toBeLessThanOrEqual(Number(fg!.quantityAvailable));
  });

  it('SO-SALE-OK is fully paid with matching allocations', async () => {
    requireDb();
    const order = await prisma.salesOrder.findFirst({
      where: { orderNumber: CODES.soSaleOk, deletedAt: null },
    });
    expect(order?.status).toBe('SALE_OK');
    expect(order?.saleOkAt).toBeTruthy();
    expect(order?.goodsReceivedAt).toBeTruthy();

    const invoices = await prisma.invoice.findMany({
      where: {
        salesOrderId: order!.id,
        deletedAt: null,
        status: { not: 'CANCELLED' },
      },
    });
    expect(invoices.length).toBeGreaterThanOrEqual(1);
    expect(invoices.every((i) => i.status === 'PAID')).toBe(true);

    for (const inv of invoices) {
      const allocs = await prisma.paymentAllocation.findMany({
        where: { invoiceId: inv.id, deletedAt: null },
      });
      const paid = allocs.reduce((s, a) => s + Number(a.amountMmk), 0);
      expect(paid).toBe(Number(inv.totalMmk));
    }
  });

  it('every outbound has ≥1 status log', async () => {
    requireDb();
    const outs = await prisma.factoryOutbound.findMany({
      where: { deletedAt: null },
    });
    for (const o of outs) {
      const logs = await prisma.outboundStatusLog.count({
        where: { factoryOutboundId: o.id, deletedAt: null },
      });
      expect(logs).toBeGreaterThanOrEqual(1);
    }
  });

  it('stable unique codes resolve to single rows', async () => {
    requireDb();
    expect(
      await prisma.company.count({ where: { code: CODES.company } }),
    ).toBe(1);
    expect(
      await prisma.productSku.count({
        where: { code: CODES.sku, deletedAt: null },
      }),
    ).toBe(1);
    expect(
      await prisma.salesOrder.count({
        where: { orderNumber: CODES.soConfirmed },
      }),
    ).toBe(1);
  });
});
