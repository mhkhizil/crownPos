import type { PurchaseStatus } from '../enums/purchase-status.enum.js';

export class PurchaseOrderLineEntity {
  constructor(
    public readonly id: string,
    public readonly purchaseOrderId: string,
    public readonly rawMaterialId: string,
    public readonly unitId: string,
    public readonly quantityOrdered: number,
    public readonly quantityReceived: number,
    public readonly unitPriceMmk: number,
    public readonly lineTotalMmk: number,
  ) {}
}

export class PurchaseOrderEntity {
  constructor(
    public readonly id: string,
    public readonly factoryId: string,
    public readonly supplierId: string,
    public readonly orderNumber: string,
    public readonly orderDate: Date,
    public readonly status: PurchaseStatus,
    public readonly totalAmountMmk: number,
    public readonly notes: string | null,
    public readonly lines: PurchaseOrderLineEntity[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}
