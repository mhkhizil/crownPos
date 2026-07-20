import fs from 'fs';
import path from 'path';

const root = process.cwd();
function w(rel, content) {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
  console.log('✓', rel);
}

w('src/infrastructure/repositories/bd-analytics.repository.ts', `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { toDateOnly, toDecimal } from './_prisma-helpers.js';
import type {
  AnalyticsSummary,
  BrandAwarenessInput,
  CreateCampaignInput,
  CreateDigitalAssetInput,
  CreateMarketingPlanInput,
  CreatePhysicalAssetInput,
  IBdAnalyticsRepository,
  UpsertCustomerTargetInput,
} from '../../domain/repositories/bd-analytics.repository.interface.js';

@Injectable()
export class BdAnalyticsRepository implements IBdAnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  upsertCustomerTarget(data: UpsertCustomerTargetInput) {
    return this.prisma.customerTarget.upsert({
      where: { customerId: data.customerId },
      create: {
        customerId: data.customerId,
        isTarget: data.isTarget ?? true,
        priority: data.priority ?? 'MEDIUM',
        potentialVolume: data.potentialVolume ?? null,
        salespersonUserId: data.salespersonUserId ?? null,
        notes: data.notes ?? null,
      },
      update: {
        isTarget: data.isTarget ?? true,
        priority: data.priority ?? 'MEDIUM',
        potentialVolume: data.potentialVolume ?? null,
        salespersonUserId: data.salespersonUserId ?? null,
        notes: data.notes ?? null,
        deletedAt: null,
      },
    });
  }

  createDigitalAsset(data: CreateDigitalAssetInput) {
    return this.prisma.digitalAsset.create({
      data: {
        companyId: data.companyId,
        assetType: data.assetType,
        nameEn: data.nameEn,
        nameMm: data.nameMm ?? null,
        url: data.url ?? null,
      },
    });
  }

  createPhysicalAsset(data: CreatePhysicalAssetInput) {
    return this.prisma.physicalAsset.create({
      data: {
        companyId: data.companyId,
        assetType: data.assetType as never,
        code: data.code,
        nameEn: data.nameEn,
        nameMm: data.nameMm ?? null,
        plateNumber: data.plateNumber ?? null,
        purchaseDate: data.purchaseDate ? toDateOnly(data.purchaseDate) : null,
        purchasePriceMmk:
          data.purchasePriceMmk != null
            ? toDecimal(data.purchasePriceMmk)
            : null,
        bookValueMmk:
          data.bookValueMmk != null ? toDecimal(data.bookValueMmk) : null,
      },
    });
  }

  listDigitalAssets() {
    return this.prisma.digitalAsset.findMany({ where: { deletedAt: null } });
  }

  listPhysicalAssets() {
    return this.prisma.physicalAsset.findMany({ where: { deletedAt: null } });
  }

  createMarketingPlan(data: CreateMarketingPlanInput) {
    return this.prisma.marketingPlan.create({
      data: {
        companyId: data.companyId,
        code: data.code,
        nameEn: data.nameEn,
        nameMm: data.nameMm ?? null,
        startDate: toDateOnly(data.startDate),
        endDate: data.endDate ? toDateOnly(data.endDate) : null,
        budgetMmk: data.budgetMmk != null ? toDecimal(data.budgetMmk) : null,
        objectivesEn: data.objectivesEn ?? null,
      },
    });
  }

  createCampaign(data: CreateCampaignInput) {
    return this.prisma.marketingCampaign.create({
      data: {
        marketingPlanId: data.marketingPlanId ?? null,
        brandId: data.brandId ?? null,
        code: data.code,
        nameEn: data.nameEn,
        startDate: toDateOnly(data.startDate),
        channel: data.channel ?? null,
        spendMmk: data.spendMmk != null ? toDecimal(data.spendMmk) : null,
      },
    });
  }

  recordBrandAwareness(data: BrandAwarenessInput) {
    return this.prisma.brandAwarenessRecord.create({
      data: {
        brandId: data.brandId,
        campaignId: data.campaignId ?? null,
        recordDate: toDateOnly(data.recordDate),
        metricKey: data.metricKey,
        metricValue: toDecimal(data.metricValue),
        source: data.source ?? null,
      },
    });
  }

  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    const [
      totalCustomers,
      productionLines,
      salesByDay,
      brandsOwned,
      digitalAssets,
      physicalAssets,
    ] = await Promise.all([
      this.prisma.customer.count({ where: { deletedAt: null } }),
      this.prisma.productionDailyLine.findMany({
        where: { deletedAt: null },
        select: { quantityProduced: true },
      }),
      this.prisma.salesDailySnapshot.findMany({
        where: { deletedAt: null },
        orderBy: { snapshotDate: 'desc' },
        take: 90,
      }),
      this.prisma.brand.findMany({
        where: { deletedAt: null, isActive: true },
        select: { id: true, code: true, nameEn: true, nameMm: true },
      }),
      this.prisma.digitalAsset.count({ where: { deletedAt: null } }),
      this.prisma.physicalAsset.count({ where: { deletedAt: null } }),
    ]);

    return {
      totalCustomers,
      totalManufacturedQty: productionLines.reduce(
        (s, l) => s + Number(l.quantityProduced),
        0,
      ),
      salesByDay,
      brandsOwned,
      digitalAssets,
      physicalAssets,
    };
  }

  async refreshDailySnapshots(date: string) {
    const snapshotDate = toDateOnly(date);
    const next = new Date(snapshotDate);
    next.setUTCDate(next.getUTCDate() + 1);

    const orders = await this.prisma.salesOrder.findMany({
      where: {
        deletedAt: null,
        orderDate: { gte: snapshotDate, lt: next },
      },
      include: { lines: { where: { deletedAt: null } } },
    });
    const totalSalesMmk = orders.reduce(
      (s, o) =>
        s + o.lines.reduce((ls, l) => ls + Number(l.lineTotalMmk), 0),
      0,
    );
    const totalQtySold = orders.reduce(
      (s, o) => s + o.lines.reduce((ls, l) => ls + Number(l.quantity), 0),
      0,
    );

    const prod = await this.prisma.productionDailyRecord.findMany({
      where: { deletedAt: null, productionDate: snapshotDate },
      include: { lines: { where: { deletedAt: null } } },
    });
    const totalQuantityProduced = prod.reduce(
      (s, r) =>
        s + r.lines.reduce((ls, l) => ls + Number(l.quantityProduced), 0),
      0,
    );

    await this.prisma.salesDailySnapshot.upsert({
      where: { snapshotDate },
      create: {
        snapshotDate,
        totalOrders: orders.length,
        totalCustomersSold: new Set(orders.map((o) => o.customerId)).size,
        totalQtySold: toDecimal(totalQtySold),
        totalSalesMmk: toDecimal(totalSalesMmk),
      },
      update: {
        totalOrders: orders.length,
        totalCustomersSold: new Set(orders.map((o) => o.customerId)).size,
        totalQtySold: toDecimal(totalQtySold),
        totalSalesMmk: toDecimal(totalSalesMmk),
        deletedAt: null,
      },
    });

    await this.prisma.productionDailySnapshot.upsert({
      where: { snapshotDate },
      create: {
        snapshotDate,
        totalSkuLines: prod.reduce((s, r) => s + r.lines.length, 0),
        totalQuantityProduced: toDecimal(totalQuantityProduced),
      },
      update: {
        totalSkuLines: prod.reduce((s, r) => s + r.lines.length, 0),
        totalQuantityProduced: toDecimal(totalQuantityProduced),
        deletedAt: null,
      },
    });

    return { snapshotDate: date, totalSalesMmk, totalQuantityProduced };
  }
}
`);

/** Build a feature module with a scoped ops use-case (one file per feature, NOT god business). */
function makeFeature({
  folder,
  prefix,
  permission,
  repoToken,
  repoInterface,
  repoClass,
  extraProviders = '',
  methods,
}) {
  const useCaseClass = \`\${prefix}OpsUseCase\`;
  const methodBodies = methods
    .map(
      (m) => \`  async \${m.name}(actorId: string, ...args: never[]): Promise<unknown> {
    await requirePermission(this.users, actorId, PermissionCode.\${permission});
    return this.repo.\${m.repoMethod}(...(args as never[]));
  }\`,
    )
    .join('\\n\\n');

  w(
    \`src/application/use-cases/\${folder}/\${folder}-ops.use-case.ts\`,
    \`import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { \${repoToken} } from '../../../domain/repositories/\${repoInterface}.js';
import type { \${repoToken.replace('_REPOSITORY', '').split('_').map(s=>s[0]+s.slice(1).toLowerCase()).join('') } } from '../../../domain/repositories/\${repoInterface}.js';
import { requirePermission } from '../_helpers/admin-authorization.helper.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';

@Injectable()
export class \${useCaseClass} {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(\${repoToken}) private readonly repo: never,
  ) {}

\${methods
  .map(
    (m) => \`  async \${m.name}(actorId: string, ...args: Parameters<never>): Promise<unknown> {
    await requirePermission(this.users, actorId, PermissionCode.\${permission});
    // @ts-expect-error dynamic delegate to feature repository
    return this.repo.\${m.repoMethod}(...args);
  }\`,
  )
  .join('\\n\\n')}
}
\`,
  );
}

console.log('bd repo written');
