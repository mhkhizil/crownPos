import type { ProcessPrisma } from './process-prisma.js';

export type ProcessFixture = {
  tag: string;
  companyId: string;
  factoryId: string;
  stockLocationId: string;
  unitId: string;
  brandId: string;
  productId: string;
  skuId: string;
  rawMaterialId: string;
  nearbyCustomerId: string;
  farCustomerId: string;
  yangonGateId: string;
  destinationGateId: string;
  nearbyCityId: string;
  farCityId: string;
};

/**
 * Ensures seed-level company / factory / primary warehouse exist.
 * Does not truncate — safe to run against a shared DB.
 */
export async function ensureCompanyFactoryStock(
  prisma: ProcessPrisma,
): Promise<{
  companyId: string;
  factoryId: string;
  stockLocationId: string;
}> {
  let company = await prisma.company.findFirst({
    where: { deletedAt: null },
    orderBy: { createdAt: 'asc' },
  });
  if (!company) {
    company = await prisma.company.create({
      data: {
        code: 'MAIN',
        nameEn: 'Main Manufacturing Company',
        nameMm: 'အဓိက ကုမ္ပဏီ',
      },
    });
  }

  let factory = await prisma.factory.findFirst({
    where: { companyId: company.id, deletedAt: null },
    orderBy: { createdAt: 'asc' },
  });
  if (!factory) {
    factory = await prisma.factory.create({
      data: {
        companyId: company.id,
        code: 'YG-1',
        nameEn: 'Yangon Factory',
        isPrimary: true,
      },
    });
  }

  let stockLocation = await prisma.stockLocation.findFirst({
    where: { companyId: company.id, deletedAt: null, isPrimary: true },
  });
  if (!stockLocation) {
    stockLocation = await prisma.stockLocation.findFirst({
      where: { companyId: company.id, deletedAt: null },
    });
  }
  if (!stockLocation) {
    stockLocation = await prisma.stockLocation.create({
      data: {
        companyId: company.id,
        factoryId: factory.id,
        code: 'MAIN-WH',
        nameEn: 'Main Warehouse',
        isPrimary: true,
      },
    });
  }

  return {
    companyId: company.id,
    factoryId: factory.id,
    stockLocationId: stockLocation.id,
  };
}

/**
 * Minimal catalog for sales + manufacture process tests:
 * unit, brand, product, SKU, region/cities/gates, nearby + far customers, raw material.
 * Optionally seeds raw inventory (workaround when purchase APIs are missing).
 */
export async function seedProcessFixture(
  prisma: ProcessPrisma,
  options: { rawOnHand?: number } = {},
): Promise<ProcessFixture> {
  const rawOnHand = options.rawOnHand ?? 10_000;
  const tag = `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const { companyId, factoryId, stockLocationId } =
    await ensureCompanyFactoryStock(prisma);

  const unit = await prisma.unit.create({
    data: {
      code: `U-${tag}`,
      nameEn: `Unit ${tag}`,
      nameMm: `ယူနစ် ${tag}`,
      symbol: 'u',
    },
  });

  const brand = await prisma.brand.create({
    data: {
      code: `B-${tag}`,
      nameEn: `Brand ${tag}`,
      nameMm: `အမှတ်တံဆိပ် ${tag}`,
    },
  });

  const product = await prisma.product.create({
    data: {
      brandId: brand.id,
      code: `P-${tag}`,
      nameEn: `Product ${tag}`,
      nameMm: `ထုတ်ကုန် ${tag}`,
    },
  });

  const sku = await prisma.productSku.create({
    data: {
      productId: product.id,
      unitId: unit.id,
      code: `SKU-${tag}`,
      nameEn: `SKU ${tag}`,
      packSize: 1,
    },
  });

  const raw = await prisma.rawMaterial.create({
    data: {
      code: `RAW-${tag}`,
      nameEn: `Calcium ${tag}`,
      nameMm: `ကယ်လ်စီယမ် ${tag}`,
      unitId: unit.id,
    },
  });

  const region = await prisma.region.create({
    data: {
      code: `R-${tag}`,
      nameEn: `Region ${tag}`,
    },
  });

  const nearbyCity = await prisma.city.create({
    data: {
      regionId: region.id,
      code: `CN-${tag}`,
      nameEn: `Nearby City ${tag}`,
    },
  });

  const farCity = await prisma.city.create({
    data: {
      regionId: region.id,
      code: `CF-${tag}`,
      nameEn: `Far City ${tag}`,
    },
  });

  const yangonGate = await prisma.gate.create({
    data: {
      cityId: nearbyCity.id,
      code: `GY-${tag}`,
      nameEn: `Yangon Gate ${tag}`,
      gateType: 'MAIN',
    },
  });

  const destGate = await prisma.gate.create({
    data: {
      cityId: farCity.id,
      code: `GD-${tag}`,
      nameEn: `Dest Gate ${tag}`,
      gateType: 'BRANCH',
      parentGateId: yangonGate.id,
    },
  });

  await prisma.gateCityCoverage.create({
    data: { gateId: destGate.id, cityId: farCity.id },
  });

  const nearbyCustomer = await prisma.customer.create({
    data: {
      code: `CUS-N-${tag}`,
      nameEn: `Nearby Shop ${tag}`,
      customerType: 'SHOP',
      shopType: 'HARDWARE',
      cityId: nearbyCity.id,
      preferredGateId: yangonGate.id,
    },
  });

  const farCustomer = await prisma.customer.create({
    data: {
      code: `CUS-F-${tag}`,
      nameEn: `Far Shop ${tag}`,
      customerType: 'SHOP',
      shopType: 'HARDWARE',
      cityId: farCity.id,
      preferredGateId: destGate.id,
    },
  });

  // Gap workaround: no purchase/receive API — seed raw via inventory balance.
  if (rawOnHand > 0) {
    await prisma.inventoryBalance.create({
      data: {
        stockLocationId,
        itemType: 'RAW_MATERIAL',
        rawMaterialId: raw.id,
        unitId: unit.id,
        quantityAvailable: rawOnHand,
        asOfDate: new Date(),
      },
    });
  }

  return {
    tag,
    companyId,
    factoryId,
    stockLocationId,
    unitId: unit.id,
    brandId: brand.id,
    productId: product.id,
    skuId: sku.id,
    rawMaterialId: raw.id,
    nearbyCustomerId: nearbyCustomer.id,
    farCustomerId: farCustomer.id,
    yangonGateId: yangonGate.id,
    destinationGateId: destGate.id,
    nearbyCityId: nearbyCity.id,
    farCityId: farCity.id,
  };
}

/** Unique YYYY-MM-DD for production days (avoids factory+date upsert collisions). */
export function uniqueProcessDate(offsetDays = 0): string {
  const base = Date.UTC(2090, 0, 1) + Date.now() % 86_400_000;
  const d = new Date(base + offsetDays * 86_400_000);
  return d.toISOString().slice(0, 10);
}
