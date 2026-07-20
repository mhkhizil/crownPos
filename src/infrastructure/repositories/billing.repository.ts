import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import {
  newInvoiceNumber,
  newPaymentNumber,
  toDateOnly,
  toDecimal,
} from './_prisma-helpers.js';
import { BillingMapper } from '../mappers/billing.mapper.js';
import { InvoiceStatus } from '../../domain/enums/invoice-status.enum.js';
import { PaymentStatus } from '../../domain/enums/payment-status.enum.js';
import type {
  CreateCollectionReminderInput,
  IBillingRepository,
  PaymentInvoiceEffect,
  RecordPaymentInput,
  RecordPaymentResult,
} from '../../domain/repositories/billing.repository.interface.js';
import type {
  CollectionReminderEntity,
  DueCollectionReminder,
  InvoiceEntity,
  PaymentEntity,
} from '../../domain/entities/billing.entity.js';
import { CollectionReminderStatus } from '../../domain/enums/collection-reminder-status.enum.js';

@Injectable()
export class BillingRepository implements IBillingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createInvoiceFromOrder(
    salesOrderId: string,
    dueDate?: string,
  ): Promise<InvoiceEntity> {
    const order = await this.prisma.salesOrder.findFirst({
      where: { id: salesOrderId, deletedAt: null },
      include: { lines: { where: { deletedAt: null } } },
    });
    if (!order) throw new NotFoundException('Sales order not found');

    const total = order.lines.reduce(
      (sum, l) => sum + Number(l.lineTotalMmk),
      0,
    );

    const row = await this.prisma.invoice.create({
      data: {
        invoiceNumber: newInvoiceNumber(),
        customerId: order.customerId,
        salesOrderId: order.id,
        issueDate: new Date(),
        dueDate: dueDate ? toDateOnly(dueDate) : null,
        status: InvoiceStatus.ISSUED,
        subtotalMmk: toDecimal(total),
        totalMmk: toDecimal(total),
        balanceDueMmk: toDecimal(total),
        lines: {
          create: order.lines.map((l) => ({
            productSkuId: l.productSkuId,
            unitId: l.unitId,
            quantity: l.quantity,
            unitPriceMmk: l.unitPriceMmk,
            lineTotalMmk: l.lineTotalMmk,
          })),
        },
      },
      include: { lines: true },
    });
    return BillingMapper.invoiceToDomain(row);
  }

  async recordPayment(data: RecordPaymentInput): Promise<RecordPaymentResult> {
    const allocSum = data.allocations.reduce((s, a) => s + a.amountMmk, 0);
    if (Math.abs(allocSum - data.amountMmk) > 0.001) {
      throw new BadRequestException('Allocation total must equal payment amount');
    }

    for (const a of data.allocations) {
      const invoice = await this.prisma.invoice.findFirst({
        where: { id: a.invoiceId, deletedAt: null },
      });
      if (!invoice) {
        throw new BadRequestException(`Invoice ${a.invoiceId} not found`);
      }
      if (a.amountMmk > Number(invoice.balanceDueMmk) + 1e-9) {
        throw new BadRequestException(
          `Allocation ${a.amountMmk} exceeds balance due ${Number(invoice.balanceDueMmk)} for invoice ${invoice.invoiceNumber}`,
        );
      }
    }

    const payment = await this.prisma.payment.create({
      data: {
        paymentNumber: newPaymentNumber(),
        paymentDate: toDateOnly(data.paymentDate),
        method: data.method,
        status: PaymentStatus.CONFIRMED,
        amountMmk: toDecimal(data.amountMmk),
        bankName: data.bankName ?? null,
        bankReference: data.bankReference ?? null,
        allocations: {
          create: data.allocations.map((a) => ({
            invoiceId: a.invoiceId,
            amountMmk: toDecimal(a.amountMmk),
          })),
        },
      },
      include: { allocations: true },
    });

    const invoiceEffects: PaymentInvoiceEffect[] = [];

    for (const a of data.allocations) {
      const invoice = await this.prisma.invoice.findFirst({
        where: { id: a.invoiceId, deletedAt: null },
      });
      if (!invoice) continue;
      const amountPaid = Number(invoice.amountPaidMmk) + a.amountMmk;
      const balance = Number(invoice.totalMmk) - amountPaid;
      const status =
        balance <= 0
          ? InvoiceStatus.PAID
          : amountPaid > 0
            ? InvoiceStatus.PARTIALLY_PAID
            : (invoice.status as InvoiceStatus);

      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          amountPaidMmk: toDecimal(amountPaid),
          balanceDueMmk: toDecimal(Math.max(balance, 0)),
          status,
        },
      });

      invoiceEffects.push({
        invoiceId: invoice.id,
        salesOrderId: invoice.salesOrderId,
        status,
      });
    }

    return {
      payment: BillingMapper.paymentToDomain(payment),
      invoiceEffects,
    };
  }

  async createCollectionReminder(
    data: CreateCollectionReminderInput,
  ): Promise<CollectionReminderEntity> {
    const row = await this.prisma.collectionReminder.create({
      data: {
        invoiceId: data.invoiceId,
        scheduledFor: new Date(data.scheduledFor),
        titleEn: data.titleEn,
        titleMm: data.titleMm ?? null,
        messageEn: data.messageEn ?? null,
        assignedToUserId: data.assignedToUserId ?? null,
        createdByUserId: data.createdByUserId ?? null,
      },
    });
    return BillingMapper.reminderToDomain(row);
  }

  async isSalesOrderFullyPaid(salesOrderId: string): Promise<boolean> {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        salesOrderId,
        deletedAt: null,
        status: { not: InvoiceStatus.CANCELLED },
      },
      select: { status: true },
    });
    if (invoices.length === 0) return false;
    return invoices.every((i) => i.status === InvoiceStatus.PAID);
  }

  async hasActiveInvoiceForSalesOrder(salesOrderId: string): Promise<boolean> {
    const count = await this.prisma.invoice.count({
      where: {
        salesOrderId,
        deletedAt: null,
        status: { not: InvoiceStatus.CANCELLED },
      },
    });
    return count > 0;
  }

  async listInvoices(): Promise<InvoiceEntity[]> {
    const rows = await this.prisma.invoice.findMany({
      where: { deletedAt: null },
      include: { lines: { where: { deletedAt: null } } },
      orderBy: { issueDate: 'desc' },
    });
    return rows.map((r) => BillingMapper.invoiceToDomain(r));
  }

  async listPayments(): Promise<PaymentEntity[]> {
    const rows = await this.prisma.payment.findMany({
      where: { deletedAt: null },
      include: { allocations: { where: { deletedAt: null } } },
      orderBy: { paymentDate: 'desc' },
    });
    return rows.map((r) => BillingMapper.paymentToDomain(r));
  }

  async listReminders(): Promise<CollectionReminderEntity[]> {
    const rows = await this.prisma.collectionReminder.findMany({
      where: { deletedAt: null },
      orderBy: { scheduledFor: 'asc' },
    });
    return rows.map((r) => BillingMapper.reminderToDomain(r));
  }

  async claimDueReminders(
    now: Date,
    limit = 50,
  ): Promise<DueCollectionReminder[]> {
    const due = await this.prisma.collectionReminder.findMany({
      where: {
        deletedAt: null,
        status: CollectionReminderStatus.SCHEDULED,
        scheduledFor: { lte: now },
      },
      orderBy: { scheduledFor: 'asc' },
      take: limit,
      include: {
        invoice: true,
        assignedTo: true,
      },
    });

    const claimed: DueCollectionReminder[] = [];
    for (const row of due) {
      const result = await this.prisma.collectionReminder.updateMany({
        where: {
          id: row.id,
          deletedAt: null,
          status: CollectionReminderStatus.SCHEDULED,
        },
        data: {
          status: CollectionReminderStatus.NOTIFIED,
          notifiedAt: now,
        },
      });
      if (result.count !== 1) continue;

      claimed.push(
        BillingMapper.dueReminderToDomain({
          ...row,
          status: CollectionReminderStatus.NOTIFIED,
          notifiedAt: now,
        }),
      );
    }
    return claimed;
  }
}
