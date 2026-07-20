/** Auto-shaped typed layer — keep Prisma mapping in infrastructure mappers only. */
import type { Prisma } from '@prisma/client';
import {
  SalesOrderEntity,
  SalesOrderLineEntity,
} from '../../domain/entities/sales-order.entity.js';
import { CustomerReceiveMode } from '../../domain/enums/customer-receive-mode.enum.js';
import { DeliveryChannel } from '../../domain/enums/delivery-channel.enum.js';
import { OrderSource } from '../../domain/enums/order-source.enum.js';
import { SalesOrderStatus } from '../../domain/enums/sales-order-status.enum.js';

type SalesOrderRow = Prisma.SalesOrderGetPayload<{
  include: { lines: true };
}>;

function num(v: { toNumber?: () => number } | number | null | undefined): number {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  return Number(v);
}

export class SalesOrderMapper {
  static toDomain(row: SalesOrderRow): SalesOrderEntity {
    return new SalesOrderEntity({
      id: row.id,
      orderNumber: row.orderNumber,
      customerId: row.customerId,
      orderDate: row.orderDate,
      orderSource: row.orderSource as OrderSource,
      takenByUserId: row.takenByUserId,
      deliveryChannel: row.deliveryChannel as DeliveryChannel,
      customerReceiveMode: row.customerReceiveMode as CustomerReceiveMode | null,
      status: row.status as SalesOrderStatus,
      hasSufficientStock: row.hasSufficientStock,
      stockCheckNotes: row.stockCheckNotes,
      stockCheckedAt: row.stockCheckedAt,
      goodsReceivedAt: row.goodsReceivedAt,
      saleOkAt: row.saleOkAt,
      notes: row.notes,
      lines: (row.lines ?? [])
        .filter((l) => l.deletedAt == null)
        .map(
          (l) =>
            new SalesOrderLineEntity({
              id: l.id,
              salesOrderId: l.salesOrderId,
              productSkuId: l.productSkuId,
              unitId: l.unitId,
              quantity: num(l.quantity),
              unitPriceMmk: num(l.unitPriceMmk),
              lineTotalMmk: num(l.lineTotalMmk),
              createdAt: l.createdAt,
              updatedAt: l.updatedAt,
              deletedAt: l.deletedAt,
            }),
        ),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    });
  }
}
