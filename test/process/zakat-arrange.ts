import { CODES } from '../../prisma/seed/constants.js';
import type { ProcessPrisma } from './process-prisma.js';
import { ZAKAT_MANUAL } from './zakat-manual-worksheet.js';

function dateOnly(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/**
 * Isolate zakatable DB inputs to locked worksheet numbers.
 * Soft-clears other balances/AR impact for the duration of manual-verify tests.
 */
export async function arrangeZakatManualFixture(
  prisma: ProcessPrisma,
): Promise<{ invoiceId: string; restore: () => Promise<void> }> {
  const company = await prisma.company.findFirstOrThrow({
    where: { code: CODES.company, deletedAt: null },
  });
  const sku = await prisma.productSku.findFirstOrThrow({
    where: { code: CODES.sku, deletedAt: null },
  });
  const raw = await prisma.rawMaterial.findFirstOrThrow({
    where: { code: CODES.raw, deletedAt: null },
  });
  const unit = await prisma.unit.findFirstOrThrow({
    where: { code: CODES.unit, deletedAt: null },
  });
  const city = await prisma.city.findFirstOrThrow({
    where: { code: CODES.cityNear, deletedAt: null },
  });
  const loc = await prisma.stockLocation.findFirstOrThrow({
    where: { code: CODES.warehouse, deletedAt: null },
  });
  const customer = await prisma.customer.findFirstOrThrow({
    where: { code: CODES.customerNear, deletedAt: null },
  });

  await prisma.inventoryBalance.updateMany({
    where: { deletedAt: null },
    data: { quantityAvailable: 0 },
  });

  await prisma.inventoryBalance.create({
    data: {
      stockLocationId: loc.id,
      itemType: 'FINISHED_GOOD',
      productSkuId: sku.id,
      unitId: unit.id,
      quantityAvailable: ZAKAT_MANUAL.fgQty,
      asOfDate: dateOnly('2026-07-01'),
      notes: 'ZAKAT-M fixture FG',
    },
  });
  await prisma.inventoryBalance.create({
    data: {
      stockLocationId: loc.id,
      itemType: 'RAW_MATERIAL',
      rawMaterialId: raw.id,
      unitId: unit.id,
      quantityAvailable: ZAKAT_MANUAL.rawQty,
      asOfDate: dateOnly('2026-07-01'),
      notes: 'ZAKAT-M fixture RAW',
    },
  });

  await prisma.cityProductPrice.updateMany({
    where: { productSkuId: sku.id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  await prisma.cityProductPrice.create({
    data: {
      cityId: city.id,
      productSkuId: sku.id,
      unitId: unit.id,
      unitPriceMmk: ZAKAT_MANUAL.fgSellPriceMmk,
      effectiveFrom: dateOnly('2026-01-01'),
    },
  });

  await prisma.supplierRawMaterial.updateMany({
    where: { rawMaterialId: raw.id, deletedAt: null },
    data: { unitPriceMmk: ZAKAT_MANUAL.rawCostMmk },
  });

  await prisma.purchaseOrderLine.updateMany({
    where: { rawMaterialId: raw.id, deletedAt: null },
    data: { unitPriceMmk: ZAKAT_MANUAL.rawCostMmk },
  });

  await prisma.invoice.updateMany({
    where: {
      deletedAt: null,
      status: { notIn: ['DRAFT', 'CANCELLED', 'WRITTEN_OFF'] },
    },
    data: { balanceDueMmk: 0, status: 'PAID' },
  });

  const inv = await prisma.invoice.create({
    data: {
      invoiceNumber: `INV-ZAKAT-M-${Date.now()}`,
      customerId: customer.id,
      issueDate: dateOnly('2026-07-01'),
      status: 'ISSUED',
      subtotalMmk: ZAKAT_MANUAL.arMmk,
      totalMmk: ZAKAT_MANUAL.arMmk,
      amountPaidMmk: 0,
      balanceDueMmk: ZAKAT_MANUAL.arMmk,
      lines: {
        create: [
          {
            productSkuId: sku.id,
            unitId: unit.id,
            quantity: 5,
            unitPriceMmk: ZAKAT_MANUAL.fgSellPriceMmk,
            lineTotalMmk: 5 * ZAKAT_MANUAL.fgSellPriceMmk,
          },
        ],
      },
    },
  });

  await prisma.physicalAsset.updateMany({
    where: { companyId: company.id, deletedAt: null },
    data: { bookValueMmk: ZAKAT_MANUAL.excludedBookValueMmk },
  });

  return {
    invoiceId: inv.id,
    restore: async () => {
      // Caller should re-run db:seed after suite; no full restore here.
    },
  };
}
