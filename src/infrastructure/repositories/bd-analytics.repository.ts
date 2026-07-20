import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { toDateOnly, toDecimal } from './_prisma-helpers.js';
import { BdAnalyticsMapper } from '../mappers/bd-analytics.mapper.js';
import type {
  BrandAwarenessInput,
  CreateCampaignInput,
  CreateDigitalAssetInput,
  CreateMarketingPlanInput,
  CreatePhysicalAssetInput,
  IBdAnalyticsRepository,
  SalesAnalysisQuery,
  UpsertCustomerTargetInput,
} from '../../domain/repositories/bd-analytics.repository.interface.js';
import type {
  AnalyticsSummaryEntity,
  BrandAwarenessEntity,
  CampaignEntity,
  CustomerTargetEntity,
  DailySnapshotEntity,
  DigitalAssetEntity,
  MarketingPlanEntity,
  PhysicalAssetEntity,
  SalesAnalysisEntity,
} from '../../domain/entities/bd-analytics.entity.js';
import { SalesAnalysisPeriod } from '../../domain/enums/sales-analysis-period.enum.js';
import { SalesOrderStatus } from '../../domain/enums/sales-order-status.enum.js';
import { PaymentStatus } from '../../domain/enums/payment-status.enum.js';

@Injectable()
export class BdAnalyticsRepository implements IBdAnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsertCustomerTarget(
    data: UpsertCustomerTargetInput,
  ): Promise<CustomerTargetEntity> {
    const row = await this.prisma.customerTarget.upsert({
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
    return BdAnalyticsMapper.target(row);
  }

  async createDigitalAsset(
    data: CreateDigitalAssetInput,
  ): Promise<DigitalAssetEntity> {
    const row = await this.prisma.digitalAsset.create({
      data: {
        companyId: data.companyId,
        assetType: data.assetType,
        nameEn: data.nameEn,
        nameMm: data.nameMm ?? null,
        url: data.url ?? null,
      },
    });
    return BdAnalyticsMapper.digital(row);
  }

  async createPhysicalAsset(
    data: CreatePhysicalAssetInput,
  ): Promise<PhysicalAssetEntity> {
    const row = await this.prisma.physicalAsset.create({
      data: {
        companyId: data.companyId,
        assetType: data.assetType,
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
    return BdAnalyticsMapper.physical(row);
  }

  async listDigitalAssets(): Promise<DigitalAssetEntity[]> {
    const rows = await this.prisma.digitalAsset.findMany({
      where: { deletedAt: null },
    });
    return rows.map((r) => BdAnalyticsMapper.digital(r));
  }

  async listPhysicalAssets(): Promise<PhysicalAssetEntity[]> {
    const rows = await this.prisma.physicalAsset.findMany({
      where: { deletedAt: null },
    });
    return rows.map((r) => BdAnalyticsMapper.physical(r));
  }

  async createMarketingPlan(
    data: CreateMarketingPlanInput,
  ): Promise<MarketingPlanEntity> {
    const row = await this.prisma.marketingPlan.create({
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
    return BdAnalyticsMapper.plan(row);
  }

  async createCampaign(data: CreateCampaignInput): Promise<CampaignEntity> {
    const row = await this.prisma.marketingCampaign.create({
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
    return BdAnalyticsMapper.campaign(row);
  }

  async recordBrandAwareness(
    data: BrandAwarenessInput,
  ): Promise<BrandAwarenessEntity> {
    const row = await this.prisma.brandAwarenessRecord.create({
      data: {
        brandId: data.brandId,
        campaignId: data.campaignId ?? null,
        recordDate: toDateOnly(data.recordDate),
        metricKey: data.metricKey,
        metricValue: toDecimal(data.metricValue),
        source: data.source ?? null,
      },
    });
    return BdAnalyticsMapper.awareness(row);
  }

  async getAnalyticsSummary(): Promise<AnalyticsSummaryEntity> {
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

    return BdAnalyticsMapper.summary({
      totalCustomers,
      totalManufacturedQty: productionLines.reduce(
        (s, l) => s + Number(l.quantityProduced),
        0,
      ),
      salesByDay: salesByDay.map((r) => BdAnalyticsMapper.salesDailyPoint(r)),
      brandsOwned: brandsOwned.map((r) => BdAnalyticsMapper.brandOwned(r)),
      digitalAssets,
      physicalAssets,
    });
  }

  async getSalesAnalysis(
    query: SalesAnalysisQuery,
  ): Promise<SalesAnalysisEntity> {
    const fromDate = toDateOnly(query.from);
    const toExclusive = toDateOnly(query.to);
    toExclusive.setUTCDate(toExclusive.getUTCDate() + 1);

    const [orders, payments] = await Promise.all([
      this.prisma.salesOrder.findMany({
        where: {
          deletedAt: null,
          status: { not: SalesOrderStatus.CANCELLED },
          orderDate: { gte: fromDate, lt: toExclusive },
        },
        include: { lines: { where: { deletedAt: null } } },
      }),
      this.prisma.payment.findMany({
        where: {
          deletedAt: null,
          status: PaymentStatus.CONFIRMED,
          paymentDate: { gte: fromDate, lt: toExclusive },
        },
        select: { paymentDate: true, amountMmk: true },
      }),
    ]);

    type Acc = {
      totalOrders: number;
      customers: Set<string>;
      totalQtySold: number;
      totalSalesMmk: number;
      totalCollectedMmk: number;
      saleOkOrders: number;
      saleOkSalesMmk: number;
    };

    const empty = (): Acc => ({
      totalOrders: 0,
      customers: new Set(),
      totalQtySold: 0,
      totalSalesMmk: 0,
      totalCollectedMmk: 0,
      saleOkOrders: 0,
      saleOkSalesMmk: 0,
    });

    const buckets = new Map<string, Acc>();
    const ensure = (key: string): Acc => {
      let acc = buckets.get(key);
      if (!acc) {
        acc = empty();
        buckets.set(key, acc);
      }
      return acc;
    };

    const periodKeyFor = (d: Date): string => {
      const iso = d.toISOString().slice(0, 10);
      if (query.period === SalesAnalysisPeriod.YEARLY) return iso.slice(0, 4);
      if (query.period === SalesAnalysisPeriod.MONTHLY) return iso.slice(0, 7);
      return iso;
    };

    for (const order of orders) {
      const key = periodKeyFor(order.orderDate);
      const acc = ensure(key);
      const lineSales = order.lines.reduce(
        (s, l) => s + Number(l.lineTotalMmk),
        0,
      );
      const lineQty = order.lines.reduce((s, l) => s + Number(l.quantity), 0);
      acc.totalOrders += 1;
      acc.customers.add(order.customerId);
      acc.totalQtySold += lineQty;
      acc.totalSalesMmk += lineSales;
      if (order.status === SalesOrderStatus.SALE_OK) {
        acc.saleOkOrders += 1;
        acc.saleOkSalesMmk += lineSales;
      }
    }

    for (const payment of payments) {
      const key = periodKeyFor(payment.paymentDate);
      const acc = ensure(key);
      acc.totalCollectedMmk += Number(payment.amountMmk);
    }

    // Fill empty periods in range so charts are continuous.
    for (const key of enumeratePeriodKeys(query.period, fromDate, query.to)) {
      if (!buckets.has(key)) buckets.set(key, empty());
    }

    const sortedKeys = [...buckets.keys()].sort();
    const mapped = sortedKeys.map((periodKey) => {
      const acc = buckets.get(periodKey)!;
      return {
        periodKey,
        totalOrders: acc.totalOrders,
        totalCustomersSold: acc.customers.size,
        totalQtySold: round4(acc.totalQtySold),
        totalSalesMmk: round2(acc.totalSalesMmk),
        totalCollectedMmk: round2(acc.totalCollectedMmk),
        saleOkOrders: acc.saleOkOrders,
        saleOkSalesMmk: round2(acc.saleOkSalesMmk),
      };
    });

    const allCustomers = new Set<string>();
    for (const o of orders) allCustomers.add(o.customerId);

    const totals = {
      totalOrders: orders.length,
      totalCustomersSold: allCustomers.size,
      totalQtySold: round4(
        orders.reduce(
          (s, o) => s + o.lines.reduce((ls, l) => ls + Number(l.quantity), 0),
          0,
        ),
      ),
      totalSalesMmk: round2(
        orders.reduce(
          (s, o) =>
            s + o.lines.reduce((ls, l) => ls + Number(l.lineTotalMmk), 0),
          0,
        ),
      ),
      totalCollectedMmk: round2(
        payments.reduce((s, p) => s + Number(p.amountMmk), 0),
      ),
      saleOkOrders: orders.filter((o) => o.status === SalesOrderStatus.SALE_OK)
        .length,
      saleOkSalesMmk: round2(
        orders
          .filter((o) => o.status === SalesOrderStatus.SALE_OK)
          .reduce(
            (s, o) =>
              s + o.lines.reduce((ls, l) => ls + Number(l.lineTotalMmk), 0),
            0,
          ),
      ),
    };

    return BdAnalyticsMapper.salesAnalysis({
      period: query.period,
      from: query.from,
      to: query.to,
      totals,
      buckets: mapped,
    });
  }

  async refreshDailySnapshots(date: string): Promise<DailySnapshotEntity> {
    const snapshotDate = toDateOnly(date);
    const next = new Date(snapshotDate);
    next.setUTCDate(next.getUTCDate() + 1);

    const [orders, payments, prod] = await Promise.all([
      this.prisma.salesOrder.findMany({
        where: {
          deletedAt: null,
          status: { not: SalesOrderStatus.CANCELLED },
          orderDate: { gte: snapshotDate, lt: next },
        },
        include: { lines: { where: { deletedAt: null } } },
      }),
      this.prisma.payment.findMany({
        where: {
          deletedAt: null,
          status: PaymentStatus.CONFIRMED,
          paymentDate: { gte: snapshotDate, lt: next },
        },
        select: { amountMmk: true },
      }),
      this.prisma.productionDailyRecord.findMany({
        where: { deletedAt: null, productionDate: snapshotDate },
        include: { lines: { where: { deletedAt: null } } },
      }),
    ]);

    const totalSalesMmk = orders.reduce(
      (s, o) =>
        s + o.lines.reduce((ls, l) => ls + Number(l.lineTotalMmk), 0),
      0,
    );
    const totalQtySold = orders.reduce(
      (s, o) => s + o.lines.reduce((ls, l) => ls + Number(l.quantity), 0),
      0,
    );
    const totalCollectedMmk = payments.reduce(
      (s, p) => s + Number(p.amountMmk),
      0,
    );
    const totalCustomersSold = new Set(orders.map((o) => o.customerId)).size;
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
        totalCustomersSold,
        totalQtySold: toDecimal(totalQtySold),
        totalSalesMmk: toDecimal(totalSalesMmk),
        totalCollectedMmk: toDecimal(totalCollectedMmk),
      },
      update: {
        totalOrders: orders.length,
        totalCustomersSold,
        totalQtySold: toDecimal(totalQtySold),
        totalSalesMmk: toDecimal(totalSalesMmk),
        totalCollectedMmk: toDecimal(totalCollectedMmk),
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

    return BdAnalyticsMapper.snapshot({
      date,
      totalOrders: orders.length,
      totalCustomersSold,
      totalQtySold: round4(totalQtySold),
      totalSalesMmk: round2(totalSalesMmk),
      totalCollectedMmk: round2(totalCollectedMmk),
      totalQuantityProduced: round4(totalQuantityProduced),
    });
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round4(n: number): number {
  return Math.round(n * 10_000) / 10_000;
}

function enumeratePeriodKeys(
  period: SalesAnalysisPeriod,
  fromDate: Date,
  toInclusiveYmd: string,
): string[] {
  const keys: string[] = [];
  const cursor = new Date(fromDate);
  const end = toDateOnly(toInclusiveYmd);

  if (period === SalesAnalysisPeriod.DAILY) {
    while (cursor <= end) {
      keys.push(cursor.toISOString().slice(0, 10));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return keys;
  }

  if (period === SalesAnalysisPeriod.MONTHLY) {
    cursor.setUTCDate(1);
    const endMonth = new Date(
      Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1),
    );
    while (cursor <= endMonth) {
      keys.push(cursor.toISOString().slice(0, 7));
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
    return keys;
  }

  const startYear = fromDate.getUTCFullYear();
  const endYear = end.getUTCFullYear();
  for (let y = startYear; y <= endYear; y += 1) {
    keys.push(String(y));
  }
  return keys;
}
