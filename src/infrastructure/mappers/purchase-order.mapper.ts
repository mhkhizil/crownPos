import {
  PurchaseOrderEntity,
  PurchaseOrderLineEntity,
} from '../../domain/entities/purchase-order.entity.js';
import { PurchaseStatus } from '../../domain/enums/purchase-status.enum.js';

function num(
  v: { toNumber?: () => number } | number | null | undefined,
): number {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  return Number(v);
}

export class PurchaseOrderMapper {
  static toDomain(row: {
    id: string;
    factoryId: string;
    supplierId: string;
    orderNumber: string;
    orderDate: Date;
    status: string;
    totalAmountMmk: { toNumber?: () => number } | number;
    amountPaidMmk?: { toNumber?: () => number } | number | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    lines: Array<{
      id: string;
      purchaseOrderId: string;
      rawMaterialId: string;
      unitId: string;
      quantityOrdered: { toNumber?: () => number } | number;
      quantityReceived: { toNumber?: () => number } | number;
      unitPriceMmk: { toNumber?: () => number } | number;
      lineTotalMmk: { toNumber?: () => number } | number;
      deletedAt?: Date | null;
    }>;
  }): PurchaseOrderEntity {
    const lines = row.lines
      .filter((l) => !l.deletedAt)
      .map(
        (l) =>
          new PurchaseOrderLineEntity(
            l.id,
            l.purchaseOrderId,
            l.rawMaterialId,
            l.unitId,
            num(l.quantityOrdered),
            num(l.quantityReceived),
            num(l.unitPriceMmk),
            num(l.lineTotalMmk),
          ),
      );
    return new PurchaseOrderEntity(
      row.id,
      row.factoryId,
      row.supplierId,
      row.orderNumber,
      row.orderDate,
      row.status as PurchaseStatus,
      num(row.totalAmountMmk),
      num(row.amountPaidMmk),
      row.notes,
      lines,
      row.createdAt,
      row.updatedAt,
      row.deletedAt,
    );
  }
}
