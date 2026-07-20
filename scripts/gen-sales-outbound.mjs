import fs from 'fs';
import path from 'path';

const root = process.cwd();
function w(rel, content) {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
  console.log('✓', rel);
}

// ========== SALES ==========
w('src/domain/repositories/sales.repository.interface.ts', `export const SALES_REPOSITORY = Symbol('SALES_REPOSITORY');

export type OrderSource = 'SALES_OUTBOUND_CALL' | 'SHOP_INBOUND_CALL' | 'OTHER';
export type DeliveryChannel = 'DIRECT_TO_SHOP' | 'VIA_GATE';
export type CustomerReceiveMode = 'CUSTOMER_PICKUP_AT_GATE' | 'GATE_DELIVERS_TO_CUSTOMER';

export interface SalesOrderLineInput {
  productSkuId: string;
  unitId: string;
  quantity: number;
  unitPriceMmk: number;
}

export interface CreateSalesOrderInput {
  customerId: string;
  orderDate: string;
  orderSource: OrderSource;
  takenByUserId?: string;
  deliveryChannel: DeliveryChannel;
  customerReceiveMode?: CustomerReceiveMode;
  notes?: string;
  lines: SalesOrderLineInput[];
}

export interface ISalesRepository {
  createSalesOrder(data: CreateSalesOrderInput): Promise<unknown>;
  confirmSalesOrder(orderId: string): Promise<unknown>;
  listSalesOrders(): Promise<unknown[]>;
  getSalesOrder(orderId: string): Promise<unknown | null>;
  markAwaitingPayment(orderId: string, receivedAt: Date): Promise<void>;
  markSaleOk(orderId: string, saleOkAt: Date): Promise<void>;
}
`);

w('src/infrastructure/repositories/sales.repository.ts', `import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { newOrderNumber, toDateOnly, toDecimal } from './_prisma-helpers.js';
import type {
  CreateSalesOrderInput,
  ISalesRepository,
} from '../../domain/repositories/sales.repository.interface.js';

@Injectable()
export class SalesRepository implements ISalesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createSalesOrder(data: CreateSalesOrderInput) {
    if (!data.lines.length) {
      throw new BadRequestException('Order must have lines');
    }
    return this.prisma.salesOrder.create({
      data: {
        orderNumber: newOrderNumber(),
        customerId: data.customerId,
        orderDate: toDateOnly(data.orderDate),
        orderSource: data.orderSource,
        takenByUserId: data.takenByUserId ?? null,
        deliveryChannel: data.deliveryChannel,
        customerReceiveMode: data.customerReceiveMode ?? null,
        notes: data.notes ?? null,
        status: 'DRAFT',
        lines: {
          create: data.lines.map((l) => ({
            productSkuId: l.productSkuId,
            unitId: l.unitId,
            quantity: toDecimal(l.quantity),
            unitPriceMmk: toDecimal(l.unitPriceMmk),
            lineTotalMmk: toDecimal(l.quantity * l.unitPriceMmk),
          })),
        },
      },
      include: { lines: true, customer: true },
    });
  }

  async confirmSalesOrder(orderId: string) {
    const order = await this.prisma.salesOrder.findFirst({
      where: { id: orderId, deletedAt: null },
      include: { lines: { where: { deletedAt: null } } },
    });
    if (!order) throw new NotFoundException('Sales order not found');
    if (order.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT orders can be confirmed');
    }

    const shortages: string[] = [];
    for (const line of order.lines) {
      const bal = await this.prisma.inventoryBalance.findFirst({
        where: {
          deletedAt: null,
          itemType: 'FINISHED_GOOD',
          productSkuId: line.productSkuId,
          unitId: line.unitId,
        },
      });
      const available = bal ? Number(bal.quantityAvailable) : 0;
      if (available < Number(line.quantity)) {
        shortages.push(
          \`\${line.productSkuId}: need \${line.quantity}, have \${available}\`,
        );
      }
    }

    const hasSufficientStock = shortages.length === 0;
    const updated = await this.prisma.salesOrder.update({
      where: { id: orderId },
      data: {
        stockCheckedAt: new Date(),
        hasSufficientStock,
        stockCheckNotes: hasSufficientStock
          ? 'Stock OK'
          : \`Insufficient: \${shortages.join('; ')}\`,
        status: hasSufficientStock ? 'CONFIRMED' : 'DRAFT',
      },
      include: { lines: { where: { deletedAt: null } }, customer: true },
    });

    if (!hasSufficientStock) {
      throw new BadRequestException({
        message: 'Insufficient stock — order not confirmed',
        shortages,
        order: updated,
      });
    }
    return updated;
  }

  listSalesOrders() {
    return this.prisma.salesOrder.findMany({
      where: { deletedAt: null },
      include: { customer: true, lines: { where: { deletedAt: null } } },
      orderBy: { orderDate: 'desc' },
    });
  }

  getSalesOrder(orderId: string) {
    return this.prisma.salesOrder.findFirst({
      where: { id: orderId, deletedAt: null },
      include: {
        customer: true,
        lines: { where: { deletedAt: null } },
        factoryOutbounds: { where: { deletedAt: null } },
        invoices: { where: { deletedAt: null } },
      },
    });
  }

  async markAwaitingPayment(orderId: string, receivedAt: Date) {
    await this.prisma.salesOrder.update({
      where: { id: orderId },
      data: { status: 'AWAITING_PAYMENT', goodsReceivedAt: receivedAt },
    });
  }

  async markSaleOk(orderId: string, saleOkAt: Date) {
    await this.prisma.salesOrder.update({
      where: { id: orderId },
      data: { status: 'SALE_OK', saleOkAt },
    });
  }
}
`);

// ========== OUTBOUND ==========
w('src/domain/repositories/outbound.repository.interface.ts', `export const OUTBOUND_REPOSITORY = Symbol('OUTBOUND_REPOSITORY');

export type OutboundStatus =
  | 'READY_AT_FACTORY'
  | 'SENT_TO_YANGON_GATE'
  | 'IN_TRANSIT'
  | 'AT_DESTINATION_GATE'
  | 'RECEIVED_BY_CUSTOMER'
  | 'CANCELLED'
  | 'RETURNED';

export interface OutboundLineInput {
  productSkuId: string;
  unitId: string;
  quantity: number;
}

export interface CreateOutboundInput {
  factoryId: string;
  salesOrderId: string;
  scheduledDate: string;
  deliveryChannel: 'DIRECT_TO_SHOP' | 'VIA_GATE';
  driverUserId?: string;
  vehicleAssetId?: string;
  yangonGateId?: string;
  destinationGateId?: string;
  customerReceiveMode?: 'CUSTOMER_PICKUP_AT_GATE' | 'GATE_DELIVERS_TO_CUSTOMER';
  lines: OutboundLineInput[];
}

export interface IOutboundRepository {
  createOutbound(data: CreateOutboundInput): Promise<unknown>;
  transitionOutbound(
    outboundId: string,
    toStatus: OutboundStatus,
    notes?: string,
  ): Promise<unknown>;
  listOutbounds(): Promise<unknown[]>;
}
`);

w('src/infrastructure/repositories/outbound.repository.ts', `import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import {
  newOutboundNumber,
  toDateOnly,
  toDecimal,
} from './_prisma-helpers.js';
import type {
  CreateOutboundInput,
  IOutboundRepository,
  OutboundStatus,
} from '../../domain/repositories/outbound.repository.interface.js';

@Injectable()
export class OutboundRepository implements IOutboundRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createOutbound(data: CreateOutboundInput) {
    const order = await this.prisma.salesOrder.findFirst({
      where: { id: data.salesOrderId, deletedAt: null },
    });
    if (!order) throw new NotFoundException('Sales order not found');
    if (order.status !== 'CONFIRMED' && order.status !== 'PARTIALLY_FULFILLED') {
      throw new BadRequestException('Order must be CONFIRMED before outbound');
    }

    return this.prisma.factoryOutbound.create({
      data: {
        outboundNumber: newOutboundNumber(),
        factoryId: data.factoryId,
        salesOrderId: data.salesOrderId,
        scheduledDate: toDateOnly(data.scheduledDate),
        outboundDate: toDateOnly(data.scheduledDate),
        deliveryChannel: data.deliveryChannel,
        driverUserId: data.driverUserId ?? null,
        vehicleAssetId: data.vehicleAssetId ?? null,
        yangonGateId: data.yangonGateId ?? null,
        destinationGateId: data.destinationGateId ?? null,
        customerReceiveMode: data.customerReceiveMode ?? null,
        status: 'READY_AT_FACTORY',
        lines: {
          create: data.lines.map((l) => ({
            productSkuId: l.productSkuId,
            unitId: l.unitId,
            quantity: toDecimal(l.quantity),
          })),
        },
        statusLogs: {
          create: { toStatus: 'READY_AT_FACTORY', notes: 'Outbound created' },
        },
      },
      include: { lines: true, statusLogs: true },
    });
  }

  async transitionOutbound(
    outboundId: string,
    toStatus: OutboundStatus,
    notes?: string,
  ) {
    const outbound = await this.prisma.factoryOutbound.findFirst({
      where: { id: outboundId, deletedAt: null },
      include: { lines: { where: { deletedAt: null } } },
    });
    if (!outbound) throw new NotFoundException('Outbound not found');

    const now = new Date();
    const stamp: Record<string, Date> = {};
    if (toStatus === 'SENT_TO_YANGON_GATE') stamp.arrivedYangonGateAt = now;
    if (toStatus === 'IN_TRANSIT') stamp.inTransitAt = now;
    if (toStatus === 'AT_DESTINATION_GATE') stamp.arrivedDestinationAt = now;
    if (toStatus === 'RECEIVED_BY_CUSTOMER') {
      stamp.receivedByCustomerAt = now;
    }
    if (
      toStatus === 'SENT_TO_YANGON_GATE' ||
      toStatus === 'RECEIVED_BY_CUSTOMER'
    ) {
      stamp.departedFactoryAt = outbound.departedFactoryAt ?? now;
    }

    const updated = await this.prisma.factoryOutbound.update({
      where: { id: outboundId },
      data: {
        status: toStatus,
        ...stamp,
        statusLogs: {
          create: {
            fromStatus: outbound.status,
            toStatus,
            notes: notes ?? null,
          },
        },
      },
      include: { lines: true, statusLogs: true, salesOrder: true },
    });

    if (toStatus === 'RECEIVED_BY_CUSTOMER' && outbound.salesOrderId) {
      const stockLocation = await this.prisma.stockLocation.findFirst({
        where: { deletedAt: null, isPrimary: true },
      });
      for (const line of outbound.lines) {
        if (!stockLocation) break;
        const bal = await this.prisma.inventoryBalance.findFirst({
          where: {
            stockLocationId: stockLocation.id,
            itemType: 'FINISHED_GOOD',
            productSkuId: line.productSkuId,
            unitId: line.unitId,
            deletedAt: null,
          },
        });
        if (bal) {
          await this.prisma.inventoryBalance.update({
            where: { id: bal.id },
            data: {
              quantityAvailable: bal.quantityAvailable.minus(line.quantity),
              asOfDate: now,
            },
          });
        }
      }
      await this.prisma.salesOrder.update({
        where: { id: outbound.salesOrderId },
        data: { status: 'AWAITING_PAYMENT', goodsReceivedAt: now },
      });
    }

    return updated;
  }

  listOutbounds() {
    return this.prisma.factoryOutbound.findMany({
      where: { deletedAt: null },
      include: {
        lines: { where: { deletedAt: null } },
        statusLogs: {
          where: { deletedAt: null },
          orderBy: { changedAt: 'asc' },
        },
        salesOrder: true,
      },
      orderBy: { scheduledDate: 'desc' },
    });
  }
}
`);

console.log('Sales + outbound done');
