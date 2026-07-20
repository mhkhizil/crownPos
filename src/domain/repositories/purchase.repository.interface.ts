import type { PurchaseOrderEntity } from '../entities/purchase-order.entity.js';
import type { PurchaseStatus } from '../enums/purchase-status.enum.js';

export const PURCHASE_REPOSITORY = Symbol('PURCHASE_REPOSITORY');

export interface PurchaseOrderLineInput {
  rawMaterialId: string;
  unitId: string;
  quantityOrdered: number;
  unitPriceMmk: number;
}

export interface CreatePurchaseOrderInput {
  factoryId: string;
  supplierId: string;
  orderDate: string;
  notes?: string | null;
  /** Defaults to ORDERED (ready to receive). */
  status?: PurchaseStatus;
  lines: PurchaseOrderLineInput[];
}

export interface ReceivePurchaseLineInput {
  purchaseOrderLineId: string;
  quantityReceived: number;
}

/** Applied in the same DB transaction as PO line updates (atomic receive). */
export interface ReceivePurchaseInventoryBump {
  rawMaterialId: string;
  unitId: string;
  delta: number;
  stockLocationId: string;
  asOfDate: Date;
}

export interface ReceivePurchaseOrderInput {
  purchaseOrderId: string;
  lines: ReceivePurchaseLineInput[];
  /** When set, inventory bumps commit with the PO receive or roll back together. */
  inventoryBumps?: ReceivePurchaseInventoryBump[];
}

export interface IPurchaseRepository {
  createPurchaseOrder(
    data: CreatePurchaseOrderInput,
  ): Promise<PurchaseOrderEntity>;
  listPurchaseOrders(): Promise<PurchaseOrderEntity[]>;
  getPurchaseOrder(id: string): Promise<PurchaseOrderEntity | null>;
  receivePurchaseOrder(
    data: ReceivePurchaseOrderInput,
  ): Promise<PurchaseOrderEntity>;
  cancelPurchaseOrder(id: string): Promise<PurchaseOrderEntity>;
}
