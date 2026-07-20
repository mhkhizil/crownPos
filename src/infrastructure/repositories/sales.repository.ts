import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { newOrderNumber, toDateOnly, toDecimal } from './_prisma-helpers.js';
import { SalesOrderMapper } from '../mappers/sales-order.mapper.js';
import { InventoryItemType } from '../../domain/enums/inventory-item-type.enum.js';
import { SalesOrderStatus } from '../../domain/enums/sales-order-status.enum.js';
import type {
  ApplyStockCheckInput,
  ConfirmWithStockResult,
  CreateSalesOrderInput,
  ISalesRepository,
  UpdateOrderStatusStamps,
} from '../../domain/repositories/sales.repository.interface.js';
import type { SalesOrderEntity } from '../../domain/entities/sales-order.entity.js';

@Injectable()
export class SalesRepository implements ISalesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createSalesOrder(data: CreateSalesOrderInput): Promise<SalesOrderEntity> {
    const row = await this.prisma.salesOrder.create({
      data: {
        orderNumber: newOrderNumber(),
        customerId: data.customerId,
        orderDate: toDateOnly(data.orderDate),
        orderSource: data.orderSource,
        takenByUserId: data.takenByUserId ?? null,
        deliveryChannel: data.deliveryChannel,
        customerReceiveMode: data.customerReceiveMode ?? null,
        notes: data.notes ?? null,
        status: SalesOrderStatus.DRAFT,
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
      include: { lines: true },
    });
    return SalesOrderMapper.toDomain(row);
  }

  async applyStockCheck(
    orderId: string,
    data: ApplyStockCheckInput,
  ): Promise<SalesOrderEntity> {
    const updated = await this.prisma.salesOrder.update({
      where: { id: orderId },
      data: {
        stockCheckedAt: data.stockCheckedAt,
        hasSufficientStock: data.hasSufficientStock,
        stockCheckNotes: data.stockCheckNotes,
        status: data.status,
      },
      include: { lines: { where: { deletedAt: null } } },
    });
    return SalesOrderMapper.toDomain(updated);
  }

  async confirmWithStockCheck(orderId: string): Promise<ConfirmWithStockResult> {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.salesOrder.findFirst({
        where: { id: orderId, deletedAt: null },
        include: { lines: { where: { deletedAt: null } } },
      });
      if (!order) throw new NotFoundException('Sales order not found');
      if (
        order.status !== SalesOrderStatus.DRAFT &&
        order.status !== SalesOrderStatus.HOLD
      ) {
        throw new BadRequestException(
          'Only DRAFT or HOLD orders can be confirmed',
        );
      }

      const shortages: string[] = [];

      for (const line of order.lines) {
        const lockKey = `fg:${line.productSkuId}:${line.unitId}`;
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

        const primaryLoc = await tx.stockLocation.findFirst({
          where: { deletedAt: null, isPrimary: true },
          select: { id: true },
        });

        const bal = primaryLoc
          ? await tx.inventoryBalance.findFirst({
              where: {
                deletedAt: null,
                stockLocationId: primaryLoc.id,
                itemType: InventoryItemType.FINISHED_GOOD,
                productSkuId: line.productSkuId,
                unitId: line.unitId,
              },
            })
          : await tx.inventoryBalance.findFirst({
              where: {
                deletedAt: null,
                itemType: InventoryItemType.FINISHED_GOOD,
                productSkuId: line.productSkuId,
                unitId: line.unitId,
              },
            });

        if (bal) {
          await tx.$executeRaw`
            SELECT id FROM "InventoryBalance" WHERE id = ${bal.id} FOR UPDATE
          `;
        }

        const committed = await tx.salesOrderLine.aggregate({
          where: {
            deletedAt: null,
            productSkuId: line.productSkuId,
            unitId: line.unitId,
            salesOrder: {
              deletedAt: null,
              status: SalesOrderStatus.CONFIRMED,
              id: { not: orderId },
            },
          },
          _sum: { quantity: true },
        });

        const physical = bal ? Number(bal.quantityAvailable) : 0;
        const reserved = Number(committed._sum.quantity ?? 0);
        const available = physical - reserved;
        const need = Number(line.quantity);
        if (available + 1e-9 < need) {
          shortages.push(
            `${line.productSkuId}: need ${need}, have ${available} (physical ${physical}, reserved ${reserved})`,
          );
        }
      }

      const hasSufficientStock = shortages.length === 0;
      const now = new Date();
      const updated = await tx.salesOrder.updateMany({
        where: {
          id: orderId,
          status: { in: [SalesOrderStatus.DRAFT, SalesOrderStatus.HOLD] },
        },
        data: {
          stockCheckedAt: now,
          hasSufficientStock,
          stockCheckNotes: hasSufficientStock
            ? 'Stock OK'
            : `Insufficient: ${shortages.join('; ')}`,
          status: hasSufficientStock
            ? SalesOrderStatus.CONFIRMED
            : SalesOrderStatus.HOLD,
        },
      });

      if (updated.count === 0) {
        throw new BadRequestException(
          'Only DRAFT or HOLD orders can be confirmed',
        );
      }

      const refreshed = await tx.salesOrder.findFirst({
        where: { id: orderId, deletedAt: null },
        include: { lines: { where: { deletedAt: null } } },
      });
      if (!refreshed) throw new NotFoundException('Sales order not found');

      return {
        entity: SalesOrderMapper.toDomain(refreshed),
        shortages,
      };
    });
  }

  async listSalesOrders(): Promise<SalesOrderEntity[]> {
    const rows = await this.prisma.salesOrder.findMany({
      where: { deletedAt: null },
      include: { lines: { where: { deletedAt: null } } },
      orderBy: { orderDate: 'desc' },
    });
    return rows.map((r) => SalesOrderMapper.toDomain(r));
  }

  async getSalesOrder(orderId: string): Promise<SalesOrderEntity | null> {
    const row = await this.prisma.salesOrder.findFirst({
      where: { id: orderId, deletedAt: null },
      include: { lines: { where: { deletedAt: null } } },
    });
    return row ? SalesOrderMapper.toDomain(row) : null;
  }

  async updateOrderStatus(
    orderId: string,
    status: SalesOrderStatus,
    stamps?: UpdateOrderStatusStamps,
  ): Promise<void> {
    await this.prisma.salesOrder.update({
      where: { id: orderId },
      data: {
        status,
        ...(stamps?.goodsReceivedAt
          ? { goodsReceivedAt: stamps.goodsReceivedAt }
          : {}),
        ...(stamps?.saleOkAt ? { saleOkAt: stamps.saleOkAt } : {}),
      },
    });
  }
}
