import type { InventoryItemType } from '../enums/inventory-item-type.enum.js';

export class InventoryBalanceEntity {
  constructor(
    public readonly id: string,
    public readonly stockLocationId: string,
    public readonly itemType: InventoryItemType,
    public readonly rawMaterialId: string | null,
    public readonly productSkuId: string | null,
    public readonly unitId: string,
    public readonly quantityAvailable: number,
    public readonly asOfDate: Date,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}

export class DailyStockCountLineEntity {
  constructor(
    public readonly id: string,
    public readonly itemType: InventoryItemType,
    public readonly rawMaterialId: string | null,
    public readonly productSkuId: string | null,
    public readonly unitId: string,
    public readonly quantityOnHand: number,
  ) {}
}

export class DailyStockCountEntity {
  constructor(
    public readonly id: string,
    public readonly stockLocationId: string,
    public readonly countDate: Date,
    public readonly notes: string | null,
    public readonly lines: DailyStockCountLineEntity[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}
