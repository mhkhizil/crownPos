import type { CollectionReminderStatus } from '../enums/collection-reminder-status.enum.js';
import type { InvoiceStatus } from '../enums/invoice-status.enum.js';
import type { PaymentMethod } from '../enums/payment-method.enum.js';
import type { PaymentStatus } from '../enums/payment-status.enum.js';

export class InvoiceLineEntity {
  constructor(
    public readonly id: string,
    public readonly productSkuId: string,
    public readonly unitId: string,
    public readonly quantity: number,
    public readonly unitPriceMmk: number,
    public readonly lineTotalMmk: number,
  ) {}
}

export class InvoiceEntity {
  constructor(
    public readonly id: string,
    public readonly invoiceNumber: string,
    public readonly customerId: string,
    public readonly salesOrderId: string | null,
    public readonly issueDate: Date,
    public readonly dueDate: Date | null,
    public readonly status: InvoiceStatus,
    public readonly subtotalMmk: number,
    public readonly totalMmk: number,
    public readonly amountPaidMmk: number,
    public readonly balanceDueMmk: number,
    public readonly lines: InvoiceLineEntity[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}

export class PaymentAllocationEntity {
  constructor(
    public readonly id: string,
    public readonly invoiceId: string,
    public readonly amountMmk: number,
  ) {}
}

export class PaymentEntity {
  constructor(
    public readonly id: string,
    public readonly paymentNumber: string,
    public readonly paymentDate: Date,
    public readonly method: PaymentMethod,
    public readonly status: PaymentStatus,
    public readonly amountMmk: number,
    public readonly bankName: string | null,
    public readonly bankReference: string | null,
    public readonly allocations: PaymentAllocationEntity[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}

export class CollectionReminderEntity {
  constructor(
    public readonly id: string,
    public readonly invoiceId: string,
    public readonly scheduledFor: Date,
    public readonly status: CollectionReminderStatus,
    public readonly titleEn: string,
    public readonly titleMm: string | null,
    public readonly messageEn: string | null,
    public readonly messageMm: string | null,
    public readonly assignedToUserId: string | null,
    public readonly createdByUserId: string | null,
    public readonly notifiedAt: Date | null,
    public readonly completedAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}

export class DueCollectionReminderAssignee {
  constructor(
    public readonly userId: string,
    public readonly nameEn: string,
    public readonly email: string,
    public readonly phone: string | null,
  ) {}
}

/** Reminder claimed for dispatch, with invoice + assignee contact for channels. */
export class DueCollectionReminder {
  constructor(
    public readonly reminder: CollectionReminderEntity,
    public readonly invoiceNumber: string,
    public readonly assignee: DueCollectionReminderAssignee | null,
  ) {}
}
