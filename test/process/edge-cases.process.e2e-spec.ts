/**
 * Edge-case / bug regression suite (E1–E9).
 * Uses tagged process fixtures for mutations; seed codes where safe.
 * Prerequisite: DATABASE_URL + root admin (db:seed or integrity bootstrap).
 */
import 'dotenv/config';
import type { Server } from 'http';
import {
  apiGet,
  apiPatch,
  apiPost,
  createProcessApp,
  loginRootAdmin,
} from './process-http.js';
import {
  canConnectDatabase,
  createProcessPrisma,
  type ProcessPrisma,
} from './process-prisma.js';
import {
  seedProcessFixture,
  uniqueProcessDate,
  type ProcessFixture,
} from './process-seed.js';
import { CODES } from '../../prisma/seed/constants.js';

const BASE = '/api/v1/admin/dashboard';

type OrderDto = {
  id: string;
  status: string;
  goodsReceivedAt: string | null;
};

type OutboundDto = { id: string; status: string };
type InvoiceDto = { id: string; totalMmk: number; balanceDueMmk: number };
type BalanceDto = {
  productSkuId: string | null;
  rawMaterialId: string | null;
  quantityAvailable: number;
  itemType: string;
};

describe('Edge cases E1–E9', () => {
  let prisma: ProcessPrisma;
  let server: Server;
  let token: string;
  let close: () => Promise<void>;
  let fx: ProcessFixture;
  let dbOk = false;

  beforeAll(async () => {
    prisma = createProcessPrisma();
    dbOk = await canConnectDatabase(prisma);
    if (!dbOk) return;
    const app = await createProcessApp();
    server = app.server;
    close = app.close;
    token = await loginRootAdmin(server);
    fx = await seedProcessFixture(prisma, {
      tag: `edge-${Date.now().toString(36)}`,
      rawQty: 50_000,
    });
  });

  afterAll(async () => {
    await close?.();
    await prisma?.$disconnect();
  });

  function requireDb() {
    if (!dbOk) throw new Error('DATABASE_URL unreachable');
  }

  async function fgAvailable(): Promise<number> {
    const list = await apiGet<BalanceDto[]>(
      server,
      token,
      `${BASE}/inventory/balances`,
    );
    const row = list.body.data?.find(
      (b) => b.itemType === 'FINISHED_GOOD' && b.productSkuId === fx.skuId,
    );
    return row?.quantityAvailable ?? 0;
  }

  async function produce(date: string, fgQty: number, rawQty: number) {
    const res = await apiPost(server, token, `${BASE}/production`, {
      factoryId: fx.factoryId,
      productionDate: date,
      employeeCount: 1,
      lines: [
        {
          productSkuId: fx.skuId,
          unitId: fx.unitId,
          quantityProduced: fgQty,
        },
      ],
      rawUsages: [
        {
          rawMaterialId: fx.rawMaterialId,
          unitId: fx.unitId,
          quantityUsed: rawQty,
        },
      ],
    });
    expect(res.status).toBeLessThan(300);
  }

  async function createConfirmedOrder(qty: number): Promise<string> {
    const created = await apiPost<OrderDto>(
      server,
      token,
      `${BASE}/sales/orders`,
      {
        customerId: fx.nearbyCustomerId,
        orderDate: uniqueProcessDate(1),
        orderSource: 'SHOP_INBOUND_CALL',
        deliveryChannel: 'DIRECT_TO_SHOP',
        lines: [
          {
            productSkuId: fx.skuId,
            unitId: fx.unitId,
            quantity: qty,
            unitPriceMmk: 1000,
          },
        ],
      },
    );
    expect(created.status).toBe(201);
    const confirm = await apiPost<OrderDto>(
      server,
      token,
      `${BASE}/sales/orders/${created.body.data!.id}/confirm`,
      {},
    );
    expect(confirm.status).toBe(200);
    expect(confirm.body.data?.status).toBe('CONFIRMED');
    return created.body.data!.id;
  }

  it('E9: invoice on DRAFT seed order → 400', async () => {
    requireDb();
    const draft = await prisma.salesOrder.findFirst({
      where: { orderNumber: CODES.soDraft, deletedAt: null },
    });
    if (!draft) {
      throw new Error(`Missing ${CODES.soDraft} — run npm run db:seed`);
    }
    const res = await apiPost(
      server,
      token,
      `${BASE}/billing/invoices/from-order/${draft.id}`,
      {},
    );
    expect(res.status).toBe(400);
  });

  it('E6: duplicate invoice from-order → 409', async () => {
    requireDb();
    await produce(uniqueProcessDate(20), 30, 10);
    const orderId = await createConfirmedOrder(3);
    const first = await apiPost(
      server,
      token,
      `${BASE}/billing/invoices/from-order/${orderId}`,
      {},
    );
    expect(first.status).toBe(201);
    const second = await apiPost(
      server,
      token,
      `${BASE}/billing/invoices/from-order/${orderId}`,
      {},
    );
    expect(second.status).toBe(409);
  });

  it('E1: sibling unpaid invoice keeps AWAITING_PAYMENT after paying one', async () => {
    requireDb();
    await produce(uniqueProcessDate(21), 40, 12);
    const orderId = await createConfirmedOrder(4);
    const out = await apiPost<OutboundDto>(server, token, `${BASE}/outbound`, {
      factoryId: fx.factoryId,
      salesOrderId: orderId,
      scheduledDate: uniqueProcessDate(22),
      deliveryChannel: 'DIRECT_TO_SHOP',
      lines: [
        { productSkuId: fx.skuId, unitId: fx.unitId, quantity: 4 },
      ],
    });
    expect(out.status).toBe(201);
    const recv = await apiPatch(
      server,
      token,
      `${BASE}/outbound/${out.body.data!.id}/status`,
      { toStatus: 'RECEIVED_BY_CUSTOMER' },
    );
    expect(recv.status).toBe(200);

    const invA = await apiPost<InvoiceDto>(
      server,
      token,
      `${BASE}/billing/invoices/from-order/${orderId}`,
      {},
    );
    expect(invA.status).toBe(201);

    // Bypass API guard to simulate legacy/sibling invoice
    const order = await prisma.salesOrder.findUnique({
      where: { id: orderId },
      include: { lines: true },
    });
    const total = Number(order!.lines[0].lineTotalMmk);
    await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-SIB-${Date.now()}`,
        customerId: order!.customerId,
        salesOrderId: orderId,
        issueDate: new Date(),
        status: 'ISSUED',
        subtotalMmk: total,
        totalMmk: total,
        balanceDueMmk: total,
        lines: {
          create: [
            {
              productSkuId: fx.skuId,
              unitId: fx.unitId,
              quantity: 4,
              unitPriceMmk: 1000,
              lineTotalMmk: total,
            },
          ],
        },
      },
    });

    const pay = await apiPost(server, token, `${BASE}/billing/payments`, {
      paymentDate: uniqueProcessDate(23),
      method: 'CASH_ON_DELIVERY',
      amountMmk: invA.body.data!.totalMmk,
      allocations: [
        {
          invoiceId: invA.body.data!.id,
          amountMmk: invA.body.data!.totalMmk,
        },
      ],
    });
    expect(pay.status).toBeLessThan(300);

    const after = await apiGet<OrderDto>(
      server,
      token,
      `${BASE}/sales/orders/${orderId}`,
    );
    expect(after.body.data?.status).toBe('AWAITING_PAYMENT');
    expect(after.body.data?.status).not.toBe('SALE_OK');
  });

  it('E2: receive without primary location → 400; no status flip', async () => {
    requireDb();
    await produce(uniqueProcessDate(24), 20, 8);
    const orderId = await createConfirmedOrder(2);
    const out = await apiPost<OutboundDto>(server, token, `${BASE}/outbound`, {
      factoryId: fx.factoryId,
      salesOrderId: orderId,
      scheduledDate: uniqueProcessDate(25),
      deliveryChannel: 'DIRECT_TO_SHOP',
      lines: [
        { productSkuId: fx.skuId, unitId: fx.unitId, quantity: 2 },
      ],
    });
    expect(out.status).toBe(201);
    const outboundId = out.body.data!.id;

    const primaries = await prisma.stockLocation.findMany({
      where: { isPrimary: true, deletedAt: null },
    });
    await prisma.stockLocation.updateMany({
      where: { isPrimary: true, deletedAt: null },
      data: { isPrimary: false },
    });

    try {
      const beforeFg = await fgAvailable();
      const recv = await apiPatch(
        server,
        token,
        `${BASE}/outbound/${outboundId}/status`,
        { toStatus: 'RECEIVED_BY_CUSTOMER' },
      );
      expect(recv.status).toBe(400);
      const ob = await prisma.factoryOutbound.findUnique({
        where: { id: outboundId },
      });
      expect(ob?.status).toBe('READY_AT_FACTORY');
      expect(await fgAvailable()).toBe(beforeFg);
    } finally {
      // Always restore — never leave DB without a primary location.
      for (const p of primaries) {
        await prisma.stockLocation.update({
          where: { id: p.id },
          data: { isPrimary: true },
        });
      }
    }
  });

  it('E3: purchase receive aggregates duplicate line ids', async () => {
    requireDb();
    const supplier =
      (await prisma.supplier.findFirst({ where: { deletedAt: null } })) ??
      (await prisma.supplier.create({
        data: {
          code: `SUP-E3-${Date.now()}`,
          nameEn: 'E3 Supplier',
          isActive: true,
        },
      }));

    const po = await apiPost<{ id: string; status: string; lines: Array<{ id: string }> }>(
      server,
      token,
      `${BASE}/purchases`,
      {
        factoryId: fx.factoryId,
        supplierId: supplier.id,
        orderDate: uniqueProcessDate(30),
        lines: [
          {
            rawMaterialId: fx.rawMaterialId,
            unitId: fx.unitId,
            quantityOrdered: 100,
            unitPriceMmk: 10,
          },
        ],
      },
    );
    expect(po.status).toBe(201);
    const lineId = po.body.data!.lines[0].id;

    const before = await prisma.inventoryBalance.findFirst({
      where: {
        rawMaterialId: fx.rawMaterialId,
        deletedAt: null,
      },
    });
    const beforeQty = before ? Number(before.quantityAvailable) : 0;

    const recv = await apiPost(
      server,
      token,
      `${BASE}/purchases/${po.body.data!.id}/receive`,
      {
        lines: [
          { purchaseOrderLineId: lineId, quantityReceived: 60 },
          { purchaseOrderLineId: lineId, quantityReceived: 40 },
        ],
      },
    );
    expect(recv.status).toBeLessThan(300);

    const poAfter = await prisma.purchaseOrderLine.findUnique({
      where: { id: lineId },
    });
    expect(Number(poAfter!.quantityReceived)).toBe(100);

    const after = await prisma.inventoryBalance.findFirst({
      where: { rawMaterialId: fx.rawMaterialId, deletedAt: null },
    });
    expect(Number(after!.quantityAvailable) - beforeQty).toBe(100);
  });

  it('E4: confirm reservation — second order for last units → HOLD', async () => {
    requireDb();
    await produce(uniqueProcessDate(42), 50, 15);
    const physical = await fgAvailable();
    const committed = await prisma.salesOrderLine.aggregate({
      where: {
        deletedAt: null,
        productSkuId: fx.skuId,
        salesOrder: { deletedAt: null, status: 'CONFIRMED' },
      },
      _sum: { quantity: true },
    });
    const free = physical - Number(committed._sum.quantity ?? 0);
    expect(free).toBeGreaterThan(0);

    const orderA = await apiPost<OrderDto>(
      server,
      token,
      `${BASE}/sales/orders`,
      {
        customerId: fx.nearbyCustomerId,
        orderDate: uniqueProcessDate(40),
        orderSource: 'SHOP_INBOUND_CALL',
        deliveryChannel: 'DIRECT_TO_SHOP',
        lines: [
          {
            productSkuId: fx.skuId,
            unitId: fx.unitId,
            quantity: free,
            unitPriceMmk: 1000,
          },
        ],
      },
    );
    const orderB = await apiPost<OrderDto>(
      server,
      token,
      `${BASE}/sales/orders`,
      {
        customerId: fx.nearbyCustomerId,
        orderDate: uniqueProcessDate(41),
        orderSource: 'SHOP_INBOUND_CALL',
        deliveryChannel: 'DIRECT_TO_SHOP',
        lines: [
          {
            productSkuId: fx.skuId,
            unitId: fx.unitId,
            quantity: free,
            unitPriceMmk: 1000,
          },
        ],
      },
    );
    expect(orderA.status).toBe(201);
    expect(orderB.status).toBe(201);

    const confA = await apiPost<OrderDto>(
      server,
      token,
      `${BASE}/sales/orders/${orderA.body.data!.id}/confirm`,
      {},
    );
    expect(confA.status).toBe(200);
    expect(confA.body.data?.status).toBe('CONFIRMED');

    const confB = await apiPost(
      server,
      token,
      `${BASE}/sales/orders/${orderB.body.data!.id}/confirm`,
      {},
    );
    expect(confB.status).toBe(400);
    const held = await prisma.salesOrder.findUnique({
      where: { id: orderB.body.data!.id },
    });
    expect(held?.status).toBe('HOLD');
  });

  it('E5: concurrent outbound receive decrements FG once', async () => {
    requireDb();
    await produce(uniqueProcessDate(50), 25, 9);
    const orderId = await createConfirmedOrder(5);
    const out = await apiPost<OutboundDto>(server, token, `${BASE}/outbound`, {
      factoryId: fx.factoryId,
      salesOrderId: orderId,
      scheduledDate: uniqueProcessDate(51),
      deliveryChannel: 'DIRECT_TO_SHOP',
      lines: [
        { productSkuId: fx.skuId, unitId: fx.unitId, quantity: 5 },
      ],
    });
    expect(out.status).toBe(201);
    const outboundId = out.body.data!.id;
    const before = await fgAvailable();

    const [r1, r2] = await Promise.all([
      apiPatch(server, token, `${BASE}/outbound/${outboundId}/status`, {
        toStatus: 'RECEIVED_BY_CUSTOMER',
      }),
      apiPatch(server, token, `${BASE}/outbound/${outboundId}/status`, {
        toStatus: 'RECEIVED_BY_CUSTOMER',
      }),
    ]);
    expect(r1.status === 200 || r2.status === 200).toBe(true);
    const after = await fgAvailable();
    expect(before - after).toBe(5);
  });

  it('E7: payment allocation > balanceDue → 400', async () => {
    requireDb();
    const inv = await prisma.invoice.findFirst({
      where: {
        invoiceNumber: CODES.invGoodsRecv,
        deletedAt: null,
        status: 'ISSUED',
      },
    });
    if (!inv) {
      throw new Error(`Missing ${CODES.invGoodsRecv} — run npm run db:seed`);
    }
    const over = Number(inv.balanceDueMmk) + 1;
    const pay = await apiPost(server, token, `${BASE}/billing/payments`, {
      paymentDate: uniqueProcessDate(60),
      method: 'CASH_ON_DELIVERY',
      amountMmk: over,
      allocations: [{ invoiceId: inv.id, amountMmk: over }],
    });
    expect(pay.status).toBe(400);
  });

  it('E8: outbound qty > order qty → 400', async () => {
    requireDb();
    await produce(uniqueProcessDate(61), 15, 5);
    const orderId = await createConfirmedOrder(2);
    const out = await apiPost(server, token, `${BASE}/outbound`, {
      factoryId: fx.factoryId,
      salesOrderId: orderId,
      scheduledDate: uniqueProcessDate(62),
      deliveryChannel: 'DIRECT_TO_SHOP',
      lines: [
        { productSkuId: fx.skuId, unitId: fx.unitId, quantity: 99 },
      ],
    });
    expect(out.status).toBe(400);
  });
});
