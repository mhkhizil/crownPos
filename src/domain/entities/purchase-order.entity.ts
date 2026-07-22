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

export type SupplierPaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';

export class PurchaseOrderEntity {
  constructor(
    public readonly id: string,
    public readonly factoryId: string,
    public readonly supplierId: string,
    public readonly orderNumber: string,
    public readonly orderDate: Date,
    public readonly status: PurchaseStatus,
    public readonly totalAmountMmk: number,
    public readonly amountPaidMmk: number,
    public readonly notes: string | null,
    public readonly lines: PurchaseOrderLineEntity[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}

  balanceDueMmk(): number {
    return Math.max(
      0,
      Math.round((this.totalAmountMmk - this.amountPaidMmk) * 100) / 100,
    );
  }

  paymentStatus(): SupplierPaymentStatus {
    if (this.amountPaidMmk <= 0) return 'UNPAID';
    if (this.balanceDueMmk() <= 0) return 'PAID';
    return 'PARTIALLY_PAID';
  }
}

export class SupplierPayableOrderLine {
  constructor(
    public readonly purchaseOrderId: string,
    public readonly orderNumber: string,
    public readonly orderDate: Date,
    public readonly status: PurchaseStatus,
    public readonly totalAmountMmk: number,
    public readonly amountPaidMmk: number,
    public readonly balanceDueMmk: number,
    public readonly paymentStatus: SupplierPaymentStatus,
  ) {}
}

export class SupplierPayablesSummary {
  constructor(
    public readonly supplierId: string,
    public readonly totalOrderedMmk: number,
    public readonly totalPaidMmk: number,
    public readonly amountLeftMmk: number,
    public readonly isFullyPaid: boolean,
    public readonly orders: SupplierPayableOrderLine[],
  ) {}
}
