import { CODES, QTY, dateOnly, EXPECTED_FG_AVAILABLE } from './constants.js';
import type { SeedCtx, SeedPrisma } from './types.js';

async function createOrderWithLine(
  prisma: SeedPrisma,
  opts: {
    orderNumber: string;
    customerId: string;
    takenByUserId: string;
    skuId: string;
    unitId: string;
    qty: number;
    status: string;
    channel: 'DIRECT_TO_SHOP' | 'VIA_GATE';
    orderSource?: 'SHOP_INBOUND_CALL' | 'SALES_OUTBOUND_CALL';
    goodsReceivedAt?: Date | null;
    saleOkAt?: Date | null;
    hasSufficientStock?: boolean | null;
    stockCheckNotes?: string | null;
  },
) {
  const lineTotal = opts.qty * QTY.unitPriceMmk;
  return prisma.salesOrder.create({
    data: {
      orderNumber: opts.orderNumber,
      customerId: opts.customerId,
      orderDate: dateOnly('2026-06-10'),
      orderSource: opts.orderSource ?? 'SHOP_INBOUND_CALL',
      takenByUserId: opts.takenByUserId,
      status: opts.status as never,
      deliveryChannel: opts.channel,
      goodsReceivedAt: opts.goodsReceivedAt ?? null,
      saleOkAt: opts.saleOkAt ?? null,
      stockCheckedAt: opts.status === 'DRAFT' ? null : dateOnly('2026-06-10'),
      hasSufficientStock: opts.hasSufficientStock ?? null,
      stockCheckNotes: opts.stockCheckNotes ?? null,
      lines: {
        create: [
          {
            productSkuId: opts.skuId,
            unitId: opts.unitId,
            quantity: opts.qty,
            unitPriceMmk: QTY.unitPriceMmk,
            lineTotalMmk: lineTotal,
          },
        ],
      },
    },
    include: { lines: true },
  });
}

export async function phaseF(prisma: SeedPrisma, ctx: SeedCtx): Promise<void> {
  // DRAFT
  await createOrderWithLine(prisma, {
    orderNumber: CODES.soDraft,
    customerId: ctx.customerNearId,
    takenByUserId: ctx.staffUserId,
    skuId: ctx.skuId,
    unitId: ctx.unitId,
    qty: QTY.soDraft,
    status: 'DRAFT',
    channel: 'DIRECT_TO_SHOP',
  });

  // HOLD
  await createOrderWithLine(prisma, {
    orderNumber: CODES.soHold,
    customerId: ctx.customerNearId,
    takenByUserId: ctx.staffUserId,
    skuId: ctx.skuId,
    unitId: ctx.unitId,
    qty: QTY.soHold,
    status: 'HOLD',
    channel: 'DIRECT_TO_SHOP',
    hasSufficientStock: false,
    stockCheckNotes: 'Insufficient: seed intentional HOLD',
  });

  // CONFIRMED + READY outbound (reservation only)
  const soConfirmed = await createOrderWithLine(prisma, {
    orderNumber: CODES.soConfirmed,
    customerId: ctx.customerNearId,
    takenByUserId: ctx.staffUserId,
    skuId: ctx.skuId,
    unitId: ctx.unitId,
    qty: QTY.soConfirmed,
    status: 'CONFIRMED',
    channel: 'DIRECT_TO_SHOP',
    hasSufficientStock: true,
    stockCheckNotes: 'Stock OK',
  });

  await prisma.factoryOutbound.create({
    data: {
      outboundNumber: CODES.obConfirmed,
      factoryId: ctx.factoryId,
      salesOrderId: soConfirmed.id,
      scheduledDate: dateOnly('2026-06-12'),
      outboundDate: dateOnly('2026-06-12'),
      deliveryChannel: 'DIRECT_TO_SHOP',
      status: 'READY_AT_FACTORY',
      driverUserId: ctx.staffUserId,
      vehicleAssetId: ctx.physicalAssetId,
      lines: {
        create: [
          {
            productSkuId: ctx.skuId,
            unitId: ctx.unitId,
            quantity: QTY.soConfirmed,
          },
        ],
      },
      statusLogs: {
        create: [
          {
            toStatus: 'READY_AT_FACTORY',
            notes: 'Seed outbound created',
          },
        ],
      },
    },
  });

  // GOODS_RECEIVED + unpaid invoice
  const recvAt = dateOnly('2026-06-14');
  const soGoods = await createOrderWithLine(prisma, {
    orderNumber: CODES.soGoodsRecv,
    customerId: ctx.customerNearId,
    takenByUserId: ctx.staffUserId,
    skuId: ctx.skuId,
    unitId: ctx.unitId,
    qty: QTY.soGoodsRecv,
    status: 'AWAITING_PAYMENT',
    channel: 'DIRECT_TO_SHOP',
    hasSufficientStock: true,
    stockCheckNotes: 'Stock OK',
    goodsReceivedAt: recvAt,
  });

  await prisma.factoryOutbound.create({
    data: {
      outboundNumber: CODES.obGoodsRecv,
      factoryId: ctx.factoryId,
      salesOrderId: soGoods.id,
      scheduledDate: dateOnly('2026-06-13'),
      outboundDate: dateOnly('2026-06-13'),
      deliveryChannel: 'DIRECT_TO_SHOP',
      status: 'RECEIVED_BY_CUSTOMER',
      receivedByCustomerAt: recvAt,
      departedFactoryAt: recvAt,
      lines: {
        create: [
          {
            productSkuId: ctx.skuId,
            unitId: ctx.unitId,
            quantity: QTY.soGoodsRecv,
          },
        ],
      },
      statusLogs: {
        create: [
          {
            fromStatus: 'READY_AT_FACTORY',
            toStatus: 'RECEIVED_BY_CUSTOMER',
            notes: 'Seed receive',
          },
        ],
      },
    },
  });

  const goodsTotal = QTY.soGoodsRecv * QTY.unitPriceMmk;
  const invGoods = await prisma.invoice.create({
    data: {
      invoiceNumber: CODES.invGoodsRecv,
      customerId: ctx.customerNearId,
      salesOrderId: soGoods.id,
      issueDate: dateOnly('2026-06-14'),
      dueDate: dateOnly('2026-07-14'),
      status: 'ISSUED',
      subtotalMmk: goodsTotal,
      totalMmk: goodsTotal,
      amountPaidMmk: 0,
      balanceDueMmk: goodsTotal,
      lines: {
        create: [
          {
            productSkuId: ctx.skuId,
            unitId: ctx.unitId,
            quantity: QTY.soGoodsRecv,
            unitPriceMmk: QTY.unitPriceMmk,
            lineTotalMmk: goodsTotal,
          },
        ],
      },
      installments: {
        create: [
          {
            sequenceNo: 1,
            dueDate: dateOnly('2026-07-14'),
            amountDueMmk: goodsTotal,
            amountPaidMmk: 0,
            isPaid: false,
          },
        ],
      },
    },
  });

  await prisma.collectionReminder.create({
    data: {
      invoiceId: invGoods.id,
      scheduledFor: new Date('2026-06-20T10:00:00.000Z'),
      titleEn: 'Please pay seed invoice',
      status: 'SCHEDULED',
      assignedToUserId: ctx.staffUserId,
      createdByUserId: ctx.rootUserId,
    },
  });

  // SALE_OK + paid invoice + payment
  const saleOkAt = dateOnly('2026-06-16');
  const soOk = await createOrderWithLine(prisma, {
    orderNumber: CODES.soSaleOk,
    customerId: ctx.customerFarId,
    takenByUserId: ctx.staffUserId,
    skuId: ctx.skuId,
    unitId: ctx.unitId,
    qty: QTY.soSaleOk,
    status: 'SALE_OK',
    channel: 'VIA_GATE',
    orderSource: 'SALES_OUTBOUND_CALL',
    hasSufficientStock: true,
    stockCheckNotes: 'Stock OK',
    goodsReceivedAt: dateOnly('2026-06-15'),
    saleOkAt,
  });

  await prisma.factoryOutbound.create({
    data: {
      outboundNumber: CODES.obSaleOk,
      factoryId: ctx.factoryId,
      salesOrderId: soOk.id,
      scheduledDate: dateOnly('2026-06-14'),
      outboundDate: dateOnly('2026-06-14'),
      deliveryChannel: 'VIA_GATE',
      status: 'RECEIVED_BY_CUSTOMER',
      yangonGateId: ctx.yangonGateId,
      destinationGateId: ctx.destGateId,
      receivedByCustomerAt: dateOnly('2026-06-15'),
      departedFactoryAt: dateOnly('2026-06-14'),
      arrivedYangonGateAt: dateOnly('2026-06-14'),
      inTransitAt: dateOnly('2026-06-14'),
      arrivedDestinationAt: dateOnly('2026-06-15'),
      lines: {
        create: [
          {
            productSkuId: ctx.skuId,
            unitId: ctx.unitId,
            quantity: QTY.soSaleOk,
          },
        ],
      },
      statusLogs: {
        create: [
          { toStatus: 'READY_AT_FACTORY', notes: 'created' },
          {
            fromStatus: 'READY_AT_FACTORY',
            toStatus: 'SENT_TO_YANGON_GATE',
            notes: 'to yangon',
          },
          {
            fromStatus: 'SENT_TO_YANGON_GATE',
            toStatus: 'IN_TRANSIT',
            notes: 'transit',
          },
          {
            fromStatus: 'IN_TRANSIT',
            toStatus: 'AT_DESTINATION_GATE',
            notes: 'arrived',
          },
          {
            fromStatus: 'AT_DESTINATION_GATE',
            toStatus: 'RECEIVED_BY_CUSTOMER',
            notes: 'received',
          },
        ],
      },
    },
  });

  const okTotal = QTY.soSaleOk * QTY.unitPriceMmk;
  const invOk = await prisma.invoice.create({
    data: {
      invoiceNumber: CODES.invSaleOk,
      customerId: ctx.customerFarId,
      salesOrderId: soOk.id,
      issueDate: dateOnly('2026-06-15'),
      status: 'PAID',
      subtotalMmk: okTotal,
      totalMmk: okTotal,
      amountPaidMmk: okTotal,
      balanceDueMmk: 0,
      lines: {
        create: [
          {
            productSkuId: ctx.skuId,
            unitId: ctx.unitId,
            quantity: QTY.soSaleOk,
            unitPriceMmk: QTY.unitPriceMmk,
            lineTotalMmk: okTotal,
          },
        ],
      },
      installments: {
        create: [
          {
            sequenceNo: 1,
            dueDate: dateOnly('2026-06-15'),
            amountDueMmk: okTotal,
            amountPaidMmk: okTotal,
            isPaid: true,
            paidAt: saleOkAt,
          },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      paymentNumber: CODES.paySaleOk,
      paymentDate: dateOnly('2026-06-16'),
      method: 'BANK_TRANSFER',
      status: 'CONFIRMED',
      amountMmk: okTotal,
      bankName: 'KBZ',
      bankReference: 'SEED-REF-1',
      allocations: {
        create: [{ invoiceId: invOk.id, amountMmk: okTotal }],
      },
    },
  });

  // Deplete FG for received sales (goods recv + sale ok)
  await prisma.inventoryBalance.updateMany({
    where: {
      stockLocationId: ctx.stockLocationId,
      itemType: 'FINISHED_GOOD',
      productSkuId: ctx.skuId,
      deletedAt: null,
    },
    data: {
      quantityAvailable: EXPECTED_FG_AVAILABLE,
      asOfDate: dateOnly('2026-06-16'),
    },
  });

  console.log('[seed] phase F: sales + billing');
}
