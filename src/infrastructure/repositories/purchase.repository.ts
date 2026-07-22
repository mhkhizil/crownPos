import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import {
  newPurchaseNumber,
  toDateOnly,
  toDecimal,
} from './_prisma-helpers.js';
import { PurchaseOrderMapper } from '../mappers/purchase-order.mapper.js';
import { PurchaseStatus } from '../../domain/enums/purchase-status.enum.js';
import type { PurchaseOrderEntity } from '../../domain/entities/purchase-order.entity.js';
import {
  SupplierPayableOrderLine,
  SupplierPayablesSummary,
} from '../../domain/entities/purchase-order.entity.js';
import type {
  CreatePurchaseOrderInput,
  IPurchaseRepository,
  ReceivePurchaseOrderInput,
  RecordPurchasePaymentInput,
} from '../../domain/repositories/purchase.repository.interface.js';

@Injectable()
export class PurchaseRepository implements IPurchaseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createPurchaseOrder(
    data: CreatePurchaseOrderInput,
  ): Promise<PurchaseOrderEntity> {
    if (!data.lines.length) {
      throw new BadRequestException('Purchase order requires at least one line');
    }

    const total = data.lines.reduce(
      (s, l) => s + l.quantityOrdered * l.unitPriceMmk,
      0,
    );
    const status = data.status ?? PurchaseStatus.ORDERED;

    const row = await this.prisma.purchaseOrder.create({
      data: {
        factoryId: data.factoryId,
        supplierId: data.supplierId,
        orderNumber: newPurchaseNumber(),
        orderDate: toDateOnly(data.orderDate),
        status,
        totalAmountMmk: toDecimal(total),
        notes: data.notes ?? null,
        lines: {
          create: data.lines.map((l) => ({
            rawMaterialId: l.rawMaterialId,
            unitId: l.unitId,
            quantityOrdered: toDecimal(l.quantityOrdered),
            quantityReceived: toDecimal(0),
            unitPriceMmk: toDecimal(l.unitPriceMmk),
            lineTotalMmk: toDecimal(l.quantityOrdered * l.unitPriceMmk),
          })),
        },
      },
      include: { lines: { where: { deletedAt: null } } },
    });
    return PurchaseOrderMapper.toDomain(row);
  }

  async listPurchaseOrders(): Promise<PurchaseOrderEntity[]> {
    const rows = await this.prisma.purchaseOrder.findMany({
      where: { deletedAt: null },
      include: { lines: { where: { deletedAt: null } } },
      orderBy: { orderDate: 'desc' },
    });
    return rows.map((r) => PurchaseOrderMapper.toDomain(r));
  }

  async getPurchaseOrder(id: string): Promise<PurchaseOrderEntity | null> {
    const row = await this.prisma.purchaseOrder.findFirst({
      where: { id, deletedAt: null },
      include: { lines: { where: { deletedAt: null } } },
    });
    return row ? PurchaseOrderMapper.toDomain(row) : null;
  }

  async receivePurchaseOrder(
    data: ReceivePurchaseOrderInput,
  ): Promise<PurchaseOrderEntity> {
    const existing = await this.prisma.purchaseOrder.findFirst({
      where: { id: data.purchaseOrderId, deletedAt: null },
      include: { lines: { where: { deletedAt: null } } },
    });
    if (!existing) throw new NotFoundException('Purchase order not found');

    if (
      existing.status !== PurchaseStatus.ORDERED &&
      existing.status !== PurchaseStatus.PARTIALLY_RECEIVED
    ) {
      throw new BadRequestException(
        `Cannot receive against purchase in status ${existing.status}`,
      );
    }

    if (!data.lines.length) {
      throw new BadRequestException('Receive requires at least one line');
    }

    // Aggregate duplicate line ids (defense in depth; use-case also aggregates).
    const aggregated = new Map<string, number>();
    for (const recv of data.lines) {
      aggregated.set(
        recv.purchaseOrderLineId,
        (aggregated.get(recv.purchaseOrderLineId) ?? 0) + recv.quantityReceived,
      );
    }
    const lines = [...aggregated.entries()].map(
      ([purchaseOrderLineId, quantityReceived]) => ({
        purchaseOrderLineId,
        quantityReceived,
      }),
    );

    const lineById = new Map(existing.lines.map((l) => [l.id, l]));

    for (const recv of lines) {
      const line = lineById.get(recv.purchaseOrderLineId);
      if (!line) {
        throw new BadRequestException(
          `Line ${recv.purchaseOrderLineId} not on this purchase order`,
        );
      }
      if (recv.quantityReceived <= 0) {
        throw new BadRequestException('quantityReceived must be > 0');
      }
      const already = Number(line.quantityReceived);
      const ordered = Number(line.quantityOrdered);
      if (already + recv.quantityReceived > ordered + 1e-9) {
        throw new BadRequestException(
          `Cannot receive ${recv.quantityReceived} for line ${line.id}: ordered ${ordered}, already received ${already}`,
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      // Lock PO row so concurrent partial receives cannot over-receive.
      await tx.$executeRaw`
        SELECT id FROM "PurchaseOrder" WHERE id = ${existing.id} FOR UPDATE
      `;

      const lockedLines = await tx.purchaseOrderLine.findMany({
        where: { purchaseOrderId: existing.id, deletedAt: null },
      });
      const lockedById = new Map(lockedLines.map((l) => [l.id, l]));

      for (const recv of lines) {
        const line = lockedById.get(recv.purchaseOrderLineId);
        if (!line) {
          throw new BadRequestException(
            `Line ${recv.purchaseOrderLineId} not on this purchase order`,
          );
        }
        const already = Number(line.quantityReceived);
        const ordered = Number(line.quantityOrdered);
        if (already + recv.quantityReceived > ordered + 1e-9) {
          throw new BadRequestException(
            `Cannot receive ${recv.quantityReceived} for line ${line.id}: ordered ${ordered}, already received ${already}`,
          );
        }
        await tx.purchaseOrderLine.update({
          where: { id: line.id },
          data: {
            quantityReceived: toDecimal(already + recv.quantityReceived),
          },
        });
      }

      const refreshed = await tx.purchaseOrderLine.findMany({
        where: { purchaseOrderId: existing.id, deletedAt: null },
      });
      const allReceived = refreshed.every(
        (l) => Number(l.quantityReceived) >= Number(l.quantityOrdered) - 1e-9,
      );
      const anyReceived = refreshed.some((l) => Number(l.quantityReceived) > 0);

      await tx.purchaseOrder.update({
        where: { id: existing.id },
        data: {
          status: allReceived
            ? PurchaseStatus.RECEIVED
            : anyReceived
              ? PurchaseStatus.PARTIALLY_RECEIVED
              : existing.status,
        },
      });

      for (const bump of data.inventoryBumps ?? []) {
        const existingBal = await tx.inventoryBalance.findFirst({
          where: {
            stockLocationId: bump.stockLocationId,
            itemType: 'RAW_MATERIAL',
            rawMaterialId: bump.rawMaterialId,
            productSkuId: null,
            unitId: bump.unitId,
            deletedAt: null,
          },
        });
        if (existingBal) {
          await tx.inventoryBalance.update({
            where: { id: existingBal.id },
            data: {
              quantityAvailable: existingBal.quantityAvailable.add(
                toDecimal(bump.delta),
              ),
              asOfDate: bump.asOfDate,
            },
          });
        } else {
          await tx.inventoryBalance.create({
            data: {
              stockLocationId: bump.stockLocationId,
              itemType: 'RAW_MATERIAL',
              rawMaterialId: bump.rawMaterialId,
              productSkuId: null,
              unitId: bump.unitId,
              quantityAvailable: toDecimal(bump.delta),
              asOfDate: bump.asOfDate,
            },
          });
        }
      }
    });

    const updated = await this.getPurchaseOrder(data.purchaseOrderId);
    if (!updated) throw new NotFoundException('Purchase order not found');
    return updated;
  }

  async cancelPurchaseOrder(id: string): Promise<PurchaseOrderEntity> {
    const existing = await this.getPurchaseOrder(id);
    if (!existing) throw new NotFoundException('Purchase order not found');

    if (
      existing.status === PurchaseStatus.RECEIVED ||
      existing.status === PurchaseStatus.PARTIALLY_RECEIVED
    ) {
      throw new BadRequestException(
        'Cannot cancel a purchase that already has received quantity',
      );
    }
    if (existing.status === PurchaseStatus.CANCELLED) {
      throw new BadRequestException('Purchase order already cancelled');
    }

    const row = await this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: PurchaseStatus.CANCELLED },
      include: { lines: { where: { deletedAt: null } } },
    });
    return PurchaseOrderMapper.toDomain(row);
  }

  async recordPurchasePayment(
    data: RecordPurchasePaymentInput,
  ): Promise<PurchaseOrderEntity> {
    if (!(data.amountMmk > 0)) {
      throw new BadRequestException('Payment amount must be positive');
    }

    const existing = await this.prisma.purchaseOrder.findFirst({
      where: { id: data.purchaseOrderId, deletedAt: null },
      include: { lines: { where: { deletedAt: null } } },
    });
    if (!existing) throw new NotFoundException('Purchase order not found');
    if (existing.status === PurchaseStatus.DRAFT) {
      throw new BadRequestException('Cannot pay a DRAFT purchase order');
    }
    if (existing.status === PurchaseStatus.CANCELLED) {
      throw new BadRequestException('Cannot pay a CANCELLED purchase order');
    }

    const total = Number(existing.totalAmountMmk);
    const paid = Number(existing.amountPaidMmk);
    const balance = Math.max(0, total - paid);
    if (data.amountMmk > balance + 1e-9) {
      throw new BadRequestException(
        `Payment ${data.amountMmk} exceeds balance due ${balance}`,
      );
    }

    const row = await this.prisma.purchaseOrder.update({
      where: { id: existing.id },
      data: {
        amountPaidMmk: toDecimal(paid + data.amountMmk),
      },
      include: { lines: { where: { deletedAt: null } } },
    });
    return PurchaseOrderMapper.toDomain(row);
  }

  async getSupplierPayables(
    supplierId: string,
  ): Promise<SupplierPayablesSummary> {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, deletedAt: null },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');

    const rows = await this.prisma.purchaseOrder.findMany({
      where: {
        supplierId,
        deletedAt: null,
        status: { notIn: [PurchaseStatus.DRAFT, PurchaseStatus.CANCELLED] },
      },
      include: { lines: { where: { deletedAt: null } } },
      orderBy: { orderDate: 'desc' },
    });

    const orders = rows.map((r) => {
      const e = PurchaseOrderMapper.toDomain(r);
      return new SupplierPayableOrderLine(
        e.id,
        e.orderNumber,
        e.orderDate,
        e.status,
        e.totalAmountMmk,
        e.amountPaidMmk,
        e.balanceDueMmk(),
        e.paymentStatus(),
      );
    });

    const totalOrderedMmk = round2(
      orders.reduce((s, o) => s + o.totalAmountMmk, 0),
    );
    const totalPaidMmk = round2(
      orders.reduce((s, o) => s + o.amountPaidMmk, 0),
    );
    const amountLeftMmk = round2(
      orders.reduce((s, o) => s + o.balanceDueMmk, 0),
    );

    return new SupplierPayablesSummary(
      supplierId,
      totalOrderedMmk,
      totalPaidMmk,
      amountLeftMmk,
      amountLeftMmk <= 0,
      orders,
    );
  }

  async sumOpenSupplierPayablesMmk(): Promise<number> {
    const rows = await this.prisma.purchaseOrder.findMany({
      where: {
        deletedAt: null,
        status: { notIn: [PurchaseStatus.DRAFT, PurchaseStatus.CANCELLED] },
      },
      select: { totalAmountMmk: true, amountPaidMmk: true },
    });
    let sum = 0;
    for (const r of rows) {
      sum += Math.max(0, Number(r.totalAmountMmk) - Number(r.amountPaidMmk));
    }
    return round2(sum);
  }
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
