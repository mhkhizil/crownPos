import { CODES } from '../../prisma/seed/constants.js';
import type { ProcessPrisma } from './process-prisma.js';

function dateOnly(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

const TAG = 'CL-TEST';

/** Disposable calendar day used by cash-ledger process suite. */
export const CL_DAY = '2099-06-15';
export const CL_DAY2 = '2099-06-16';

/**
 * Creates an ISSUED invoice with unpaid balance for payment → BUSINESS INFLOW tests.
 */
export async function arrangeUnpaidInvoice(
  prisma: ProcessPrisma,
  opts: { totalMmk: number; suffix: string },
): Promise<{ invoiceId: string }> {
  const customer = await prisma.customer.findFirstOrThrow({
    where: { code: CODES.customerNear, deletedAt: null },
  });
  const sku = await prisma.productSku.findFirstOrThrow({
    where: { code: CODES.sku, deletedAt: null },
  });
  const unit = await prisma.unit.findFirstOrThrow({
    where: { code: CODES.unit, deletedAt: null },
  });

  const inv = await prisma.invoice.create({
    data: {
      invoiceNumber: `${TAG}-INV-${opts.suffix}`,
      customerId: customer.id,
      issueDate: dateOnly(CL_DAY),
      status: 'ISSUED',
      recoverability: 'LIKELY',
      subtotalMmk: opts.totalMmk,
      totalMmk: opts.totalMmk,
      amountPaidMmk: 0,
      balanceDueMmk: opts.totalMmk,
      notes: TAG,
      lines: {
        create: [
          {
            productSkuId: sku.id,
            unitId: unit.id,
            quantity: 1,
            unitPriceMmk: opts.totalMmk,
            lineTotalMmk: opts.totalMmk,
          },
        ],
      },
    },
  });
  return { invoiceId: inv.id };
}

/**
 * Creates a RECEIVED PO with unpaid supplier balance for payment → BUSINESS OUTFLOW.
 */
export async function arrangeUnpaidPo(
  prisma: ProcessPrisma,
  opts: { totalMmk: number; suffix: string },
): Promise<{ poId: string }> {
  const factory = await prisma.factory.findFirstOrThrow({
    where: { code: CODES.factory, deletedAt: null },
  });
  const supplier = await prisma.supplier.findFirstOrThrow({
    where: { code: CODES.supplier, deletedAt: null },
  });
  const raw = await prisma.rawMaterial.findFirstOrThrow({
    where: { code: CODES.raw, deletedAt: null },
  });
  const unit = await prisma.unit.findFirstOrThrow({
    where: { code: CODES.unit, deletedAt: null },
  });

  const po = await prisma.purchaseOrder.create({
    data: {
      factoryId: factory.id,
      supplierId: supplier.id,
      orderNumber: `${TAG}-PO-${opts.suffix}`,
      orderDate: dateOnly(CL_DAY),
      status: 'RECEIVED',
      totalAmountMmk: opts.totalMmk,
      amountPaidMmk: 0,
      notes: TAG,
      lines: {
        create: [
          {
            rawMaterialId: raw.id,
            unitId: unit.id,
            quantityOrdered: 1,
            quantityReceived: 1,
            unitPriceMmk: opts.totalMmk,
            lineTotalMmk: opts.totalMmk,
          },
        ],
      },
    },
  });
  return { poId: po.id };
}

/** Soft-delete CL-TEST ledger rows (2099 dates) and marked invoices/POs. */
export async function cleanupCashLedgerProcessFixtures(
  prisma: ProcessPrisma,
): Promise<void> {
  const now = new Date();
  await prisma.cashLedgerEntry.updateMany({
    where: {
      deletedAt: null,
      entryDate: {
        gte: dateOnly('2099-01-01'),
        lte: dateOnly('2099-12-31'),
      },
    },
    data: { deletedAt: now },
  });
  await prisma.invoice.updateMany({
    where: { invoiceNumber: { startsWith: `${TAG}-INV-` }, deletedAt: null },
    data: { deletedAt: now },
  });
  await prisma.purchaseOrder.updateMany({
    where: { orderNumber: { startsWith: `${TAG}-PO-` }, deletedAt: null },
    data: { deletedAt: now },
  });
}
