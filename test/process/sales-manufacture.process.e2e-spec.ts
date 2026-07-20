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

const BASE = '/api/v1/admin/dashboard';

type OrderDto = {
  id: string;
  status: string;
  hasSufficientStock: boolean | null;
  saleOkAt: string | null;
  goodsReceivedAt: string | null;
  lines: Array<{ quantity: number; unitPriceMmk: number; lineTotalMmk: number }>;
};

type OutboundDto = {
  id: string;
  status: string;
  statusLogs: Array<{ toStatus: string }>;
};

type InvoiceDto = {
  id: string;
  status: string;
  totalMmk: number;
  balanceDueMmk: number;
};

type BalanceDto = {
  itemType: string;
  productSkuId: string | null;
  rawMaterialId: string | null;
  quantityAvailable: number;
};

describe('L3 process: sales + manufacture', () => {
  let prisma: ProcessPrisma;
  let server: Server;
  let close: () => Promise<void>;
  let token: string;
  let fx: ProcessFixture;
  let dbOk = false;

  beforeAll(async () => {
    prisma = createProcessPrisma();
    dbOk = await canConnectDatabase(prisma);
    if (!dbOk) {
      console.warn('[process e2e] DATABASE_URL unreachable — skipping L3');
      return;
    }

    const boot = await createProcessApp();
    server = boot.server;
    close = boot.close;
    token = await loginRootAdmin(server);
    fx = await seedProcessFixture(prisma, { rawOnHand: 50_000 });
  });

  afterAll(async () => {
    if (close) await close();
    if (prisma) await prisma.$disconnect();
  });

  function requireDb(): void {
    if (!dbOk) {
      pending('Postgres unavailable — L3 process tests require DATABASE_URL');
    }
  }

  async function produce(
    date: string,
    qtyFg: number,
    qtyRaw: number,
  ): Promise<void> {
    const res = await apiPost(server, token, `${BASE}/production`, {
      factoryId: fx.factoryId,
      productionDate: date,
      employeeCount: 5,
      workers: [{ workerNameEn: 'Worker A' }],
      lines: [
        {
          productSkuId: fx.skuId,
          unitId: fx.unitId,
          quantityProduced: qtyFg,
        },
      ],
      rawUsages: [
        {
          rawMaterialId: fx.rawMaterialId,
          unitId: fx.unitId,
          quantityUsed: qtyRaw,
        },
      ],
    });
    expect(res.status).toBeLessThan(300);
  }

  async function fgAvailable(): Promise<number> {
    const res = await apiGet<BalanceDto[]>(
      server,
      token,
      `${BASE}/inventory/balances`,
    );
    expect(res.status).toBe(200);
    const row = (res.body.data ?? []).find(
      (b) => b.itemType === 'FINISHED_GOOD' && b.productSkuId === fx.skuId,
    );
    return row?.quantityAvailable ?? 0;
  }

  async function rawAvailable(): Promise<number> {
    const res = await apiGet<BalanceDto[]>(
      server,
      token,
      `${BASE}/inventory/balances`,
    );
    const row = (res.body.data ?? []).find(
      (b) => b.itemType === 'RAW_MATERIAL' && b.rawMaterialId === fx.rawMaterialId,
    );
    return row?.quantityAvailable ?? 0;
  }

  async function createOrder(opts: {
    customerId: string;
    channel: 'DIRECT_TO_SHOP' | 'VIA_GATE';
    qty: number;
    source?: 'SHOP_INBOUND_CALL' | 'SALES_OUTBOUND_CALL';
    unitPrice?: number;
  }): Promise<OrderDto> {
    const res = await apiPost<OrderDto>(server, token, `${BASE}/sales/orders`, {
      customerId: opts.customerId,
      orderDate: uniqueProcessDate(0),
      orderSource: opts.source ?? 'SHOP_INBOUND_CALL',
      deliveryChannel: opts.channel,
      lines: [
        {
          productSkuId: fx.skuId,
          unitId: fx.unitId,
          quantity: opts.qty,
          unitPriceMmk: opts.unitPrice ?? 1000,
        },
      ],
    });
    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();
    return res.body.data!;
  }

  async function confirmOrder(orderId: string) {
    return apiPost<OrderDto>(
      server,
      token,
      `${BASE}/sales/orders/${orderId}/confirm`,
      {},
    );
  }

  async function getOrder(orderId: string): Promise<OrderDto> {
    const res = await apiGet<OrderDto>(
      server,
      token,
      `${BASE}/sales/orders/${orderId}`,
    );
    expect(res.status).toBe(200);
    return res.body.data!;
  }

  describe('P1 — manufacture then sell nearby (cash later)', () => {
    it('produce → confirm → direct receive → partial/full pay → SALE_OK', async () => {
      requireDb();
      const day = uniqueProcessDate(1);
      const rawBefore = await rawAvailable();

      await produce(day, 100, 40);
      const fg = await fgAvailable();
      expect(fg).toBeGreaterThanOrEqual(100);
      expect(await rawAvailable()).toBe(rawBefore - 40);

      const order = await createOrder({
        customerId: fx.nearbyCustomerId,
        channel: 'DIRECT_TO_SHOP',
        qty: 10,
        source: 'SHOP_INBOUND_CALL',
      });
      expect(order.status).toBe('DRAFT');

      const confirmed = await confirmOrder(order.id);
      expect(confirmed.status).toBeLessThan(300);
      expect(confirmed.body.data?.status).toBe('CONFIRMED');
      expect(confirmed.body.data?.hasSufficientStock).toBe(true);

      const out = await apiPost<OutboundDto>(server, token, `${BASE}/outbound`, {
        factoryId: fx.factoryId,
        salesOrderId: order.id,
        scheduledDate: uniqueProcessDate(2),
        deliveryChannel: 'DIRECT_TO_SHOP',
        driverUserId: undefined,
        lines: [
          { productSkuId: fx.skuId, unitId: fx.unitId, quantity: 10 },
        ],
      });
      expect(out.status).toBe(201);
      expect(out.body.data?.status).toBe('READY_AT_FACTORY');

      const recv = await apiPatch<OutboundDto>(
        server,
        token,
        `${BASE}/outbound/${out.body.data!.id}/status`,
        { toStatus: 'RECEIVED_BY_CUSTOMER', notes: 'Direct drop' },
      );
      expect(recv.status).toBe(200);

      const afterRecv = await getOrder(order.id);
      expect(afterRecv.status).toBe('GOODS_RECEIVED');
      expect(afterRecv.status).not.toBe('SALE_OK');
      expect(afterRecv.goodsReceivedAt).toBeTruthy();

      const inv = await apiPost<InvoiceDto>(
        server,
        token,
        `${BASE}/billing/invoices/from-order/${order.id}`,
        {},
      );
      expect(inv.status).toBe(201);
      expect((await getOrder(order.id)).status).toBe('AWAITING_PAYMENT');
      const total = inv.body.data!.totalMmk;
      const invoiceId = inv.body.data!.id;

      const partialAmt = Math.max(1, Math.floor(total / 2));
      const partial = await apiPost(server, token, `${BASE}/billing/payments`, {
        paymentDate: uniqueProcessDate(3),
        method: 'CASH_ON_DELIVERY',
        amountMmk: partialAmt,
        allocations: [{ invoiceId, amountMmk: partialAmt }],
      });
      expect(partial.status).toBeLessThan(300);
      expect((await getOrder(order.id)).status).toBe('AWAITING_PAYMENT');

      const rem = await apiPost(
        server,
        token,
        `${BASE}/billing/collection-reminders`,
        {
          invoiceId,
          scheduledFor: new Date().toISOString(),
          titleEn: 'Please pay remainder',
        },
      );
      expect(rem.status).toBeLessThan(300);
      expect((await getOrder(order.id)).status).not.toBe('SALE_OK');

      const rest = total - partialAmt;
      const full = await apiPost(server, token, `${BASE}/billing/payments`, {
        paymentDate: uniqueProcessDate(4),
        method: 'BANK_TRANSFER',
        amountMmk: rest,
        allocations: [{ invoiceId, amountMmk: rest }],
      });
      expect(full.status).toBeLessThan(300);

      const sold = await getOrder(order.id);
      expect(sold.status).toBe('SALE_OK');
      expect(sold.saleOkAt).toBeTruthy();
    });
  });

  describe('P2 — far gate path', () => {
    it('VIA_GATE steps; only RECEIVED flips order to GOODS_RECEIVED', async () => {
      requireDb();
      await produce(uniqueProcessDate(10), 50, 20);

      const order = await createOrder({
        customerId: fx.farCustomerId,
        channel: 'VIA_GATE',
        qty: 5,
        source: 'SALES_OUTBOUND_CALL',
      });
      const confirmed = await confirmOrder(order.id);
      expect(confirmed.body.data?.status).toBe('CONFIRMED');

      const out = await apiPost<OutboundDto>(server, token, `${BASE}/outbound`, {
        factoryId: fx.factoryId,
        salesOrderId: order.id,
        scheduledDate: uniqueProcessDate(11),
        deliveryChannel: 'VIA_GATE',
        yangonGateId: fx.yangonGateId,
        destinationGateId: fx.destinationGateId,
        lines: [{ productSkuId: fx.skuId, unitId: fx.unitId, quantity: 5 }],
      });
      expect(out.status).toBe(201);
      const outboundId = out.body.data!.id;

      const midStatuses = [
        'SENT_TO_YANGON_GATE',
        'IN_TRANSIT',
        'AT_DESTINATION_GATE',
      ] as const;

      for (const toStatus of midStatuses) {
        const step = await apiPatch<OutboundDto>(
          server,
          token,
          `${BASE}/outbound/${outboundId}/status`,
          { toStatus },
        );
        expect(step.status).toBe(200);
        const midOrder = await getOrder(order.id);
        expect(midOrder.status).not.toBe('SALE_OK');
        expect(midOrder.status).not.toBe('AWAITING_PAYMENT');
        expect(midOrder.status).not.toBe('GOODS_RECEIVED');
      }

      const recv = await apiPatch<OutboundDto>(
        server,
        token,
        `${BASE}/outbound/${outboundId}/status`,
        { toStatus: 'RECEIVED_BY_CUSTOMER' },
      );
      expect(recv.status).toBe(200);
      expect(recv.body.data?.statusLogs?.length).toBeGreaterThanOrEqual(4);

      const finalOrder = await getOrder(order.id);
      expect(finalOrder.status).toBe('GOODS_RECEIVED');
      expect(finalOrder.goodsReceivedAt).toBeTruthy();
      expect(finalOrder.status).not.toBe('SALE_OK');
    });
  });

  describe('P3 — insufficient stock', () => {
    it('confirm places HOLD; outbound create fails', async () => {
      requireDb();
      const available = await fgAvailable();
      const order = await createOrder({
        customerId: fx.nearbyCustomerId,
        channel: 'DIRECT_TO_SHOP',
        qty: available + 500,
      });

      const confirmed = await confirmOrder(order.id);
      expect(confirmed.status).toBe(400);
      expect((await getOrder(order.id)).status).toBe('HOLD');

      const out = await apiPost(server, token, `${BASE}/outbound`, {
        factoryId: fx.factoryId,
        salesOrderId: order.id,
        scheduledDate: uniqueProcessDate(20),
        deliveryChannel: 'DIRECT_TO_SHOP',
        lines: [
          {
            productSkuId: fx.skuId,
            unitId: fx.unitId,
            quantity: available + 500,
          },
        ],
      });
      expect(out.status).toBe(400);
    });
  });

  describe('M-var — variable raw for same FG output', () => {
    it('two days same FG, different raw qty both succeed', async () => {
      requireDb();
      const dayA = uniqueProcessDate(30);
      const dayB = uniqueProcessDate(31);
      const rawBefore = await rawAvailable();

      await produce(dayA, 25, 10);
      await produce(dayB, 25, 18);

      const rawAfter = await rawAvailable();
      expect(rawAfter).toBe(rawBefore - 28);
    });
  });

  describe('Neg — SALE_OK sequencing', () => {
    it('full pay on CONFIRMED before receive does not set SALE_OK; receive then closes', async () => {
      requireDb();
      await produce(uniqueProcessDate(40), 30, 12);

      const order = await createOrder({
        customerId: fx.nearbyCustomerId,
        channel: 'DIRECT_TO_SHOP',
        qty: 3,
        unitPrice: 2000,
      });
      await confirmOrder(order.id);
      expect((await getOrder(order.id)).status).toBe('CONFIRMED');

      const inv = await apiPost<InvoiceDto>(
        server,
        token,
        `${BASE}/billing/invoices/from-order/${order.id}`,
        {},
      );
      expect(inv.status).toBe(201);
      const total = inv.body.data!.totalMmk;

      await apiPost(server, token, `${BASE}/billing/payments`, {
        paymentDate: uniqueProcessDate(41),
        method: 'CASH_ON_DELIVERY',
        amountMmk: total,
        allocations: [{ invoiceId: inv.body.data!.id, amountMmk: total }],
      });

      const paidEarly = await getOrder(order.id);
      expect(paidEarly.status).toBe('CONFIRMED');
      expect(paidEarly.saleOkAt).toBeNull();
      expect(paidEarly.goodsReceivedAt).toBeNull();

      const out = await apiPost<OutboundDto>(server, token, `${BASE}/outbound`, {
        factoryId: fx.factoryId,
        salesOrderId: order.id,
        scheduledDate: uniqueProcessDate(42),
        deliveryChannel: 'DIRECT_TO_SHOP',
        lines: [{ productSkuId: fx.skuId, unitId: fx.unitId, quantity: 3 }],
      });
      expect(out.status).toBe(201);

      await apiPatch(
        server,
        token,
        `${BASE}/outbound/${out.body.data!.id}/status`,
        { toStatus: 'RECEIVED_BY_CUSTOMER' },
      );

      const afterRecv = await getOrder(order.id);
      expect(afterRecv.status).toBe('SALE_OK');
      expect(afterRecv.goodsReceivedAt).toBeTruthy();
      expect(afterRecv.saleOkAt).toBeTruthy();
    });
  });
});
