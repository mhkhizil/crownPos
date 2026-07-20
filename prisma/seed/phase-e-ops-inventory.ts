import { CODES, QTY, dateOnly } from './constants.js';
import type { SeedCtx, SeedPrisma } from './types.js';

export async function phaseE(
  prisma: SeedPrisma,
  ctx: SeedCtx,
): Promise<Partial<SeedCtx>> {
  const productionDate = dateOnly(CODES.productionDate);

  const po = await prisma.purchaseOrder.create({
    data: {
      factoryId: ctx.factoryId,
      supplierId: ctx.supplierId,
      orderNumber: CODES.poReceived,
      orderDate: dateOnly('2026-05-20'),
      status: 'RECEIVED',
      totalAmountMmk: QTY.rawReceived * 500,
      lines: {
        create: [
          {
            rawMaterialId: ctx.rawMaterialId,
            unitId: ctx.unitId,
            quantityOrdered: QTY.rawReceived,
            quantityReceived: QTY.rawReceived,
            unitPriceMmk: 500,
            lineTotalMmk: QTY.rawReceived * 500,
          },
        ],
      },
    },
  });
  void po;

  const prod = await prisma.productionDailyRecord.create({
    data: {
      factoryId: ctx.factoryId,
      productionDate,
      employeeCount: 2,
      notes: 'Seed production day',
      workers: {
        create: [
          {
            workerNameEn: 'Worker A',
            userId: ctx.staffUserId,
          },
        ],
      },
      lines: {
        create: [
          {
            productSkuId: ctx.skuId,
            unitId: ctx.unitId,
            quantityProduced: QTY.fgProduced,
            billOfMaterialId: ctx.bomId,
          },
        ],
      },
      rawUsages: {
        create: [
          {
            rawMaterialId: ctx.rawMaterialId,
            unitId: ctx.unitId,
            quantityUsed: QTY.rawUsedInProduction,
          },
        ],
      },
    },
  });
  void prod;

  // Final balances after PO receive + production (FG not yet depleted by sales receive).
  // Sales receive depletion applied in phase F after creating received outbounds.
  await prisma.inventoryBalance.create({
    data: {
      stockLocationId: ctx.stockLocationId,
      itemType: 'RAW_MATERIAL',
      rawMaterialId: ctx.rawMaterialId,
      productSkuId: null,
      unitId: ctx.unitId,
      quantityAvailable: QTY.rawReceived - QTY.rawUsedInProduction,
      asOfDate: productionDate,
    },
  });

  await prisma.inventoryBalance.create({
    data: {
      stockLocationId: ctx.stockLocationId,
      itemType: 'FINISHED_GOOD',
      productSkuId: ctx.skuId,
      rawMaterialId: null,
      unitId: ctx.unitId,
      quantityAvailable: QTY.fgProduced,
      asOfDate: productionDate,
    },
  });

  const count = await prisma.dailyStockCount.create({
    data: {
      stockLocationId: ctx.stockLocationId,
      countDate: dateOnly('2026-06-02'),
      notes: 'Seed stock count',
      lines: {
        create: [
          {
            itemType: 'FINISHED_GOOD',
            productSkuId: ctx.skuId,
            unitId: ctx.unitId,
            quantityOnHand: QTY.fgProduced,
          },
          {
            itemType: 'RAW_MATERIAL',
            rawMaterialId: ctx.rawMaterialId,
            unitId: ctx.unitId,
            quantityOnHand: QTY.rawReceived - QTY.rawUsedInProduction,
          },
        ],
      },
    },
  });
  void count;

  console.log('[seed] phase E: ops + inventory');
  return { productionDate };
}
