import type { Prisma } from '@prisma/client';
import {
  CollectionReminderEntity,
  DueCollectionReminder,
  DueCollectionReminderAssignee,
  InvoiceEntity,
  InvoiceLineEntity,
  PaymentAllocationEntity,
  PaymentEntity,
} from '../../domain/entities/billing.entity.js';
import { CollectionReminderStatus } from '../../domain/enums/collection-reminder-status.enum.js';
import { InvoiceStatus } from '../../domain/enums/invoice-status.enum.js';
import { PaymentMethod } from '../../domain/enums/payment-method.enum.js';
import { PaymentStatus } from '../../domain/enums/payment-status.enum.js';

function num(v: { toNumber?: () => number } | number | null | undefined): number {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  return Number(v);
}

type Inv = Prisma.InvoiceGetPayload<{ include: { lines: true } }>;
type Pay = Prisma.PaymentGetPayload<{ include: { allocations: true } }>;
type Rem = Prisma.CollectionReminderGetPayload<object>;
type RemDue = Prisma.CollectionReminderGetPayload<{
  include: { invoice: true; assignedTo: true };
}>;

export class BillingMapper {
  static invoiceToDomain(row: Inv): InvoiceEntity {
    return new InvoiceEntity(
      row.id,
      row.invoiceNumber,
      row.customerId,
      row.salesOrderId,
      row.issueDate,
      row.dueDate,
      row.status as InvoiceStatus,
      num(row.subtotalMmk),
      num(row.totalMmk),
      num(row.amountPaidMmk),
      num(row.balanceDueMmk),
      (row.lines ?? [])
        .filter((l) => !l.deletedAt)
        .map(
          (l) =>
            new InvoiceLineEntity(
              l.id,
              l.productSkuId,
              l.unitId,
              num(l.quantity),
              num(l.unitPriceMmk),
              num(l.lineTotalMmk),
            ),
        ),
      row.createdAt,
      row.updatedAt,
      row.deletedAt,
    );
  }

  static paymentToDomain(row: Pay): PaymentEntity {
    return new PaymentEntity(
      row.id,
      row.paymentNumber,
      row.paymentDate,
      row.method as PaymentMethod,
      row.status as PaymentStatus,
      num(row.amountMmk),
      row.bankName,
      row.bankReference,
      (row.allocations ?? [])
        .filter((a) => !a.deletedAt)
        .map(
          (a) => new PaymentAllocationEntity(a.id, a.invoiceId, num(a.amountMmk)),
        ),
      row.createdAt,
      row.updatedAt,
      row.deletedAt,
    );
  }

  static reminderToDomain(row: Rem): CollectionReminderEntity {
    return new CollectionReminderEntity(
      row.id,
      row.invoiceId,
      row.scheduledFor,
      row.status as CollectionReminderStatus,
      row.titleEn,
      row.titleMm,
      row.messageEn,
      row.messageMm,
      row.assignedToUserId,
      row.createdByUserId,
      row.notifiedAt,
      row.completedAt,
      row.createdAt,
      row.updatedAt,
      row.deletedAt,
    );
  }

  static dueReminderToDomain(row: RemDue): DueCollectionReminder {
    const assignee =
      row.assignedTo && !row.assignedTo.deletedAt
        ? new DueCollectionReminderAssignee(
            row.assignedTo.id,
            row.assignedTo.nameEn,
            row.assignedTo.email,
            row.assignedTo.phone,
          )
        : null;
    return new DueCollectionReminder(
      BillingMapper.reminderToDomain(row),
      row.invoice.invoiceNumber,
      assignee,
    );
  }
}
