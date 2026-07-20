import { Prisma } from '@prisma/client';

export function toDecimal(n: number): Prisma.Decimal {
  return new Prisma.Decimal(n);
}

export function toDateOnly(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

export function newOrderNumber(): string {
  return `SO-${Date.now()}`;
}

export function newOutboundNumber(): string {
  return `OB-${Date.now()}`;
}

export function newInvoiceNumber(): string {
  return `INV-${Date.now()}`;
}

export function newPaymentNumber(): string {
  return `PAY-${Date.now()}`;
}

export function newPurchaseNumber(): string {
  return `PO-${Date.now()}`;
}
