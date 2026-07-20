import 'dotenv/config';
import PrismaPkg from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { readFileSync } from 'fs';
import { wipePublicApplicationData } from './seed/wipe.js';
import { phaseA } from './seed/phase-a-roots.js';
import { phaseB } from './seed/phase-b-auth-catalog.js';
import { phaseC } from './seed/phase-c-geo-factory.js';
import { phaseD } from './seed/phase-d-pricing-customers.js';
import { phaseE } from './seed/phase-e-ops-inventory.js';
import { phaseF } from './seed/phase-f-sales-billing.js';
import type { SeedCtx } from './seed/types.js';
import { CODES, EXPECTED_FG_AVAILABLE, EXPECTED_RAW_AVAILABLE } from './seed/constants.js';

const { PrismaClient } = PrismaPkg;

function getEnvFromFile() {
  try {
    const envContent = readFileSync('.env', 'utf-8');
    for (const line of envContent.split('\n')) {
      if (line.trim() && !line.trim().startsWith('#')) {
        const eqIdx = line.indexOf('=');
        if (eqIdx > 0) {
          const key = line.substring(0, eqIdx).trim();
          let value = line.substring(eqIdx + 1).trim();
          value = value.replace(/^["'](.*)["']$/, '$1');
          process.env[key] = value;
        }
      }
    }
  } catch (e) {
    console.error('Error: Could not read .env file');
    throw e;
  }
}

getEnvFromFile();

async function logModelCounts(prisma: InstanceType<typeof PrismaClient>) {
  const models = [
    'company',
    'factory',
    'user',
    'role',
    'permission',
    'rolePermission',
    'userRole',
    'unit',
    'brand',
    'product',
    'productSku',
    'rawMaterial',
    'supplier',
    'supplierRawMaterial',
    'purchaseOrder',
    'purchaseOrderLine',
    'billOfMaterial',
    'billOfMaterialLine',
    'productionDailyRecord',
    'productionDailyWorker',
    'productionDailyLine',
    'productionDailyRawUsage',
    'stockLocation',
    'inventoryBalance',
    'dailyStockCount',
    'dailyStockCountLine',
    'region',
    'city',
    'gate',
    'gateCityCoverage',
    'customer',
    'customerTarget',
    'customerProductPrice',
    'volumePriceTier',
    'cityProductPrice',
    'salesOrder',
    'salesOrderLine',
    'factoryOutbound',
    'factoryOutboundLine',
    'outboundStatusLog',
    'invoice',
    'invoiceLine',
    'invoiceInstallment',
    'payment',
    'paymentAllocation',
    'collectionReminder',
    'marketingPlan',
    'marketingCampaign',
    'brandAwarenessRecord',
    'salesDailySnapshot',
    'productionDailySnapshot',
    'digitalAsset',
    'physicalAsset',
    'assetDepreciationLog',
  ] as const;

  const missing: string[] = [];
  for (const m of models) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const count = await (prisma as any)[m].count({
      where: m === 'productSku' ? undefined : { deletedAt: null },
    });
    // productSku: allow retired soft-deleted; still count all for coverage
    const activeCount =
      m === 'productSku'
        ? await prisma.productSku.count()
        : count;
    if (activeCount < 1) missing.push(m);
    else console.log(`[seed] ${m}: ${activeCount}`);
  }
  if (missing.length) {
    throw new Error(`[seed] models with zero rows: ${missing.join(', ')}`);
  }
}

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL is required');

  const adapter = new PrismaPg({ connectionString: dbUrl });
  const prisma = new PrismaClient({ adapter });

  try {
    await wipePublicApplicationData(prisma);

    const a = await phaseA(prisma);
    const ctx = { prisma, ...a } as SeedCtx;
    Object.assign(ctx, await phaseB(prisma, ctx));
    Object.assign(ctx, await phaseC(prisma, ctx));
    Object.assign(ctx, await phaseD(prisma, ctx));
    Object.assign(ctx, await phaseE(prisma, ctx));
    await phaseF(prisma, ctx);

    await logModelCounts(prisma);

    console.log(
      `[seed] done. FG available=${EXPECTED_FG_AVAILABLE} raw=${EXPECTED_RAW_AVAILABLE}`,
    );
    console.log(
      `[seed] lookup codes: ${CODES.soSaleOk}, ${CODES.sku}, ${CODES.warehouse}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
