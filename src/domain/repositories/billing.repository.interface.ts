import type {
  CollectionReminderEntity,
  DueCollectionReminder,
  InvoiceEntity,
  PaymentEntity,
} from '../entities/billing.entity.js';
import type { InvoiceStatus } from '../enums/invoice-status.enum.js';
import type { PaymentMethod } from '../enums/payment-method.enum.js';

export const BILLING_REPOSITORY = Symbol('BILLING_REPOSITORY');

export interface PaymentAllocationInput {
  invoiceId: string;
  amountMmk: number;
}

export interface RecordPaymentInput {
  paymentDate: string;
  method: PaymentMethod;
  amountMmk: number;
  bankName?: string;
  bankReference?: string;
  allocations: PaymentAllocationInput[];
}

export interface PaymentInvoiceEffect {
  invoiceId: string;
  salesOrderId: string | null;
  status: InvoiceStatus;
}

export interface RecordPaymentResult {
  payment: PaymentEntity;
  invoiceEffects: PaymentInvoiceEffect[];
}

export interface CreateCollectionReminderInput {
  invoiceId: string;
  scheduledFor: string;
  titleEn: string;
  titleMm?: string;
  messageEn?: string;
  assignedToUserId?: string;
  createdByUserId?: string;
}

export interface IBillingRepository {
  createInvoiceFromOrder(
    salesOrderId: string,
    dueDate?: string,
  ): Promise<InvoiceEntity>;
  recordPayment(data: RecordPaymentInput): Promise<RecordPaymentResult>;
  createCollectionReminder(
    data: CreateCollectionReminderInput,
  ): Promise<CollectionReminderEntity>;
  /** True when the order has ≥1 invoice and every non-cancelled invoice is PAID. */
  isSalesOrderFullyPaid(salesOrderId: string): Promise<boolean>;
  /** True when the order has at least one non-cancelled invoice. */
  hasActiveInvoiceForSalesOrder(salesOrderId: string): Promise<boolean>;
  listInvoices(): Promise<InvoiceEntity[]>;
  listPayments(): Promise<PaymentEntity[]>;
  listReminders(): Promise<CollectionReminderEntity[]>;
  /**
   * Atomically claim due SCHEDULED reminders (→ NOTIFIED) so concurrent cron
   * workers do not double-fire SMS/email/push.
   */
  claimDueReminders(
    now: Date,
    limit?: number,
  ): Promise<DueCollectionReminder[]>;
}
