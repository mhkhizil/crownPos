import type { Prisma } from '@prisma/client';
import {
  DailyStockCountEntity,
  DailyStockCountLineEntity,
  InventoryBalanceEntity,
} from '../../domain/entities/inventory-balance.entity.js';
import { InventoryItemType } from '../../domain/enums/inventory-item-type.enum.js';

function num(v: { toNumber?: () => number } | number | null | undefined): number {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  return Number(v);
}

type Bal = Prisma.InventoryBalanceGetPayload<object>;
type Count = Prisma.DailyStockCountGetPayload<{ include: { lines: true } }>;

export class InventoryMapper {
  static balanceToDomain(row: Bal): InventoryBalanceEntity {
    return new InventoryBalanceEntity(
      row.id,
      row.stockLocationId,
      row.itemType as InventoryItemType,
      row.rawMaterialId,
      row.productSkuId,
      row.unitId,
      num(row.quantityAvailable),
      row.asOfDate,
      row.createdAt,
      row.updatedAt,
      row.deletedAt,
    );
  }

  static stockCountToDomain(row: Count): DailyStockCountEntity {
    return new DailyStockCountEntity(
      row.id,
      row.stockLocationId,
      row.countDate,
      row.notes,
      (row.lines ?? [])
        .filter((l) => !l.deletedAt)
        .map(
          (l) =>
            new DailyStockCountLineEntity(
              l.id,
              l.itemType as InventoryItemType,
              l.rawMaterialId,
              l.productSkuId,
              l.unitId,
              num(l.quantityOnHand),
            ),
        ),
      row.createdAt,
      row.updatedAt,
      row.deletedAt,
    );
  }
}
