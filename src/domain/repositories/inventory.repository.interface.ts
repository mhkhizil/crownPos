import type {
  DailyStockCountEntity,
  InventoryBalanceEntity,
} from '../entities/inventory-balance.entity.js';
import type { InventoryItemType } from '../enums/inventory-item-type.enum.js';

export const INVENTORY_REPOSITORY = Symbol('INVENTORY_REPOSITORY');

export interface StockCountLineInput {
  itemType: InventoryItemType;
  rawMaterialId?: string;
  productSkuId?: string;
  unitId: string;
  quantityOnHand: number;
}

export interface RecordDailyStockCountInput {
  stockLocationId: string;
  countDate: string;
  notes?: string;
  lines: StockCountLineInput[];
}

export interface AdjustBalanceInput {
  itemType: InventoryItemType;
  rawMaterialId?: string;
  productSkuId?: string;
  unitId: string;
  delta: number;
  asOfDate: Date;
  stockLocationId?: string;
}

export interface AvailableQuantityQuery {
  itemType: InventoryItemType;
  rawMaterialId?: string;
  productSkuId?: string;
  unitId: string;
  stockLocationId?: string;
}

export interface IInventoryRepository {
  recordDailyStockCount(
    data: RecordDailyStockCountInput,
  ): Promise<DailyStockCountEntity>;
  listInventoryBalances(
    stockLocationId?: string,
  ): Promise<InventoryBalanceEntity[]>;
  adjustBalance(input: AdjustBalanceInput): Promise<InventoryBalanceEntity>;
  getAvailableQuantity(query: AvailableQuantityQuery): Promise<number>;
  primaryStockLocationId(): Promise<string>;
  findPrimaryStockLocationId(): Promise<string | null>;
}
