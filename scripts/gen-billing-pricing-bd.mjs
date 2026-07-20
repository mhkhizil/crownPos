import fs from 'fs';
import path from 'path';

const root = process.cwd();
function w(rel, content) {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
  console.log('✓', rel);
}

w('src/domain/repositories/billing.repository.interface.ts', `export const BILLING_REPOSITORY = Symbol('BILLING_REPOSITORY');

export type PaymentMethod = 'CASH_ON_DELIVERY' | 'BANK_TRANSFER' | 'OTHER';

export interface PaymentAllocationInput {
  invoiceId: string;
  amountMmk: number;
}

export interface RecordPaymentInput {
  paymentDate: string;
  method: PaymentMethod;
  amountMmk: number;
  bankName?: string;
  bankReference?: string;
  allocations: PaymentAllocationInput[];
}

export interface CreateCollectionReminderInput {
  invoiceId: string;
  scheduledFor: string;
  titleEn: string;
  titleMm?: string;
  messageEn?: string;
  assignedToUserId?: string;
  createdByUserId?: string;
}

export interface IBillingRepository {
  createInvoiceFromOrder(salesOrderId: string, dueDate?: string): Promise<unknown>;
  recordPayment(data: RecordPaymentInput): Promise<unknown>;
  createCollectionReminder(data: CreateCollectionReminderInput): Promise<unknown>;
  listInvoices(): Promise<unknown[]>;
  listPayments(): Promise<unknown[]>;
  listReminders(): Promise<unknown[]>;
}
`);

w('src/infrastructure/repositories/billing.repository.ts', fs.readFileSync(
  path.join(root, 'src/infrastructure/repositories/business.repository.ts'),
  'utf8',
).includes('createInvoiceFromOrder')
  ? `import {
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
import type {
  CreateCollectionReminderInput,
  IBillingRepository,
  RecordPaymentInput,
} from '../../domain/repositories/billing.repository.interface.js';

@Injectable()
export class BillingRepository implements IBillingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createInvoiceFromOrder(salesOrderId: string, dueDate?: string) {
    const order = await this.prisma.salesOrder.findFirst({
      where: { id: salesOrderId, deletedAt: null },
      include: { lines: { where: { deletedAt: null } } },
    });
    if (!order) throw new NotFoundException('Sales order not found');

    const total = order.lines.reduce(
      (sum, l) => sum + Number(l.lineTotalMmk),
      0,
    );

    return this.prisma.invoice.create({
      data: {
        invoiceNumber: newInvoiceNumber(),
        customerId: order.customerId,
        salesOrderId: order.id,
        issueDate: new Date(),
        dueDate: dueDate ? toDateOnly(dueDate) : null,
        status: 'ISSUED',
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
  }

  async recordPayment(data: RecordPaymentInput) {
    const allocSum = data.allocations.reduce((s, a) => s + a.amountMmk, 0);
    if (Math.abs(allocSum - data.amountMmk) > 0.001) {
      throw new BadRequestException('Allocation total must equal payment amount');
    }

    const payment = await this.prisma.payment.create({
      data: {
        paymentNumber: newPaymentNumber(),
        paymentDate: toDateOnly(data.paymentDate),
        method: data.method,
        status: 'CONFIRMED',
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

    for (const a of data.allocations) {
      const invoice = await this.prisma.invoice.findFirst({
        where: { id: a.invoiceId, deletedAt: null },
      });
      if (!invoice) continue;
      const amountPaid = Number(invoice.amountPaidMmk) + a.amountMmk;
      const balance = Number(invoice.totalMmk) - amountPaid;
      const status =
        balance <= 0 ? 'PAID' : amountPaid > 0 ? 'PARTIALLY_PAID' : invoice.status;

      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          amountPaidMmk: toDecimal(amountPaid),
          balanceDueMmk: toDecimal(Math.max(balance, 0)),
          status,
        },
      });

      if (status === 'PAID' && invoice.salesOrderId) {
        await this.prisma.salesOrder.update({
          where: { id: invoice.salesOrderId },
          data: { status: 'SALE_OK', saleOkAt: new Date() },
        });
      } else if (invoice.salesOrderId) {
        await this.prisma.salesOrder.update({
          where: { id: invoice.salesOrderId },
          data: { status: 'AWAITING_PAYMENT' },
        });
      }
    }

    return payment;
  }

  createCollectionReminder(data: CreateCollectionReminderInput) {
    return this.prisma.collectionReminder.create({
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
  }

  listInvoices() {
    return this.prisma.invoice.findMany({
      where: { deletedAt: null },
      include: {
        lines: { where: { deletedAt: null } },
        customer: true,
        paymentAllocations: { where: { deletedAt: null } },
      },
      orderBy: { issueDate: 'desc' },
    });
  }

  listPayments() {
    return this.prisma.payment.findMany({
      where: { deletedAt: null },
      include: { allocations: { where: { deletedAt: null } } },
      orderBy: { paymentDate: 'desc' },
    });
  }

  listReminders() {
    return this.prisma.collectionReminder.findMany({
      where: { deletedAt: null },
      include: { invoice: true },
      orderBy: { scheduledFor: 'asc' },
    });
  }
}
` : 'ERROR');

w('src/domain/repositories/pricing.repository.interface.ts', `export const PRICING_REPOSITORY = Symbol('PRICING_REPOSITORY');

export interface UpsertCustomerPriceInput {
  customerId: string;
  productSkuId: string;
  unitId: string;
  unitPriceMmk: number;
  effectiveFrom: string;
  effectiveTo?: string;
}

export interface UpsertVolumeTierInput {
  productSkuId: string;
  customerId?: string;
  unitId: string;
  minQuantity: number;
  maxQuantity?: number;
  unitPriceMmk: number;
  effectiveFrom: string;
}

export interface UpsertCityPriceInput {
  cityId: string;
  productSkuId: string;
  unitId: string;
  unitPriceMmk: number;
  effectiveFrom: string;
}

export interface ResolvePriceInput {
  productSkuId: string;
  customerId?: string;
  cityId?: string;
  quantity: number;
}

export interface ResolvedPrice {
  unitPriceMmk: number;
  source: 'CUSTOMER' | 'VOLUME' | 'CITY';
}

export interface IPricingRepository {
  upsertCustomerPrice(data: UpsertCustomerPriceInput): Promise<unknown>;
  upsertVolumeTier(data: UpsertVolumeTierInput): Promise<unknown>;
  upsertCityPrice(data: UpsertCityPriceInput): Promise<unknown>;
  resolvePrice(input: ResolvePriceInput): Promise<ResolvedPrice | null>;
}
`);

w('src/infrastructure/repositories/pricing.repository.ts', `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { toDateOnly, toDecimal } from './_prisma-helpers.js';
import type {
  IPricingRepository,
  ResolvePriceInput,
  ResolvedPrice,
  UpsertCityPriceInput,
  UpsertCustomerPriceInput,
  UpsertVolumeTierInput,
} from '../../domain/repositories/pricing.repository.interface.js';

@Injectable()
export class PricingRepository implements IPricingRepository {
  constructor(private readonly prisma: PrismaService) {}

  upsertCustomerPrice(data: UpsertCustomerPriceInput) {
    return this.prisma.customerProductPrice.create({
      data: {
        customerId: data.customerId,
        productSkuId: data.productSkuId,
        unitId: data.unitId,
        unitPriceMmk: toDecimal(data.unitPriceMmk),
        effectiveFrom: toDateOnly(data.effectiveFrom),
        effectiveTo: data.effectiveTo ? toDateOnly(data.effectiveTo) : null,
      },
    });
  }

  upsertVolumeTier(data: UpsertVolumeTierInput) {
    return this.prisma.volumePriceTier.create({
      data: {
        productSkuId: data.productSkuId,
        customerId: data.customerId ?? null,
        unitId: data.unitId,
        minQuantity: toDecimal(data.minQuantity),
        maxQuantity:
          data.maxQuantity != null ? toDecimal(data.maxQuantity) : null,
        unitPriceMmk: toDecimal(data.unitPriceMmk),
        effectiveFrom: toDateOnly(data.effectiveFrom),
      },
    });
  }

  upsertCityPrice(data: UpsertCityPriceInput) {
    return this.prisma.cityProductPrice.create({
      data: {
        cityId: data.cityId,
        productSkuId: data.productSkuId,
        unitId: data.unitId,
        unitPriceMmk: toDecimal(data.unitPriceMmk),
        effectiveFrom: toDateOnly(data.effectiveFrom),
      },
    });
  }

  async resolvePrice(input: ResolvePriceInput): Promise<ResolvedPrice | null> {
    const today = new Date();
    if (input.customerId) {
      const cp = await this.prisma.customerProductPrice.findFirst({
        where: {
          deletedAt: null,
          customerId: input.customerId,
          productSkuId: input.productSkuId,
          effectiveFrom: { lte: today },
          OR: [{ effectiveTo: null }, { effectiveTo: { gte: today } }],
        },
        orderBy: { effectiveFrom: 'desc' },
      });
      if (cp) {
        return { unitPriceMmk: Number(cp.unitPriceMmk), source: 'CUSTOMER' };
      }
    }

    const tier = await this.prisma.volumePriceTier.findFirst({
      where: {
        deletedAt: null,
        productSkuId: input.productSkuId,
        minQuantity: { lte: toDecimal(input.quantity) },
        effectiveFrom: { lte: today },
        AND: [
          {
            OR: [
              { customerId: null },
              ...(input.customerId ? [{ customerId: input.customerId }] : []),
            ],
          },
          {
            OR: [
              { maxQuantity: null },
              { maxQuantity: { gte: toDecimal(input.quantity) } },
            ],
          },
        ],
      },
      orderBy: { minQuantity: 'desc' },
    });
    if (tier) {
      return { unitPriceMmk: Number(tier.unitPriceMmk), source: 'VOLUME' };
    }

    if (input.cityId) {
      const cityPrice = await this.prisma.cityProductPrice.findFirst({
        where: {
          deletedAt: null,
          cityId: input.cityId,
          productSkuId: input.productSkuId,
          effectiveFrom: { lte: today },
        },
        orderBy: { effectiveFrom: 'desc' },
      });
      if (cityPrice) {
        return {
          unitPriceMmk: Number(cityPrice.unitPriceMmk),
          source: 'CITY',
        };
      }
    }
    return null;
  }
}
`);

w('src/domain/repositories/bd-analytics.repository.interface.ts', `export const BD_ANALYTICS_REPOSITORY = Symbol('BD_ANALYTICS_REPOSITORY');

export interface UpsertCustomerTargetInput {
  customerId: string;
  isTarget?: boolean;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  potentialVolume?: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' | null;
  salespersonUserId?: string | null;
  notes?: string | null;
}

export interface CreateDigitalAssetInput {
  companyId: string;
  assetType: 'FACEBOOK_PAGE' | 'WEBSITE' | 'DOMAIN' | 'OTHER';
  nameEn: string;
  nameMm?: string | null;
  url?: string | null;
}

export interface CreatePhysicalAssetInput {
  companyId: string;
  assetType: string;
  code: string;
  nameEn: string;
  nameMm?: string | null;
  plateNumber?: string | null;
  purchaseDate?: string | null;
  purchasePriceMmk?: number | null;
  bookValueMmk?: number | null;
}

export interface CreateMarketingPlanInput {
  companyId: string;
  code: string;
  nameEn: string;
  nameMm?: string | null;
  startDate: string;
  endDate?: string;
  budgetMmk?: number | null;
  objectivesEn?: string | null;
}

export interface CreateCampaignInput {
  marketingPlanId?: string | null;
  brandId?: string | null;
  code: string;
  nameEn: string;
  startDate: string;
  channel?: string | null;
  spendMmk?: number | null;
}

export interface BrandAwarenessInput {
  brandId: string;
  campaignId?: string | null;
  recordDate: string;
  metricKey: string;
  metricValue: number;
  source?: string | null;
}

export interface AnalyticsSummary {
  totalCustomers: number;
  totalManufacturedQty: number;
  salesByDay: unknown[];
  brandsOwned: unknown[];
  digitalAssets: number;
  physicalAssets: number;
}

export interface IBdAnalyticsRepository {
  upsertCustomerTarget(data: UpsertCustomerTargetInput): Promise<unknown>;
  createDigitalAsset(data: CreateDigitalAssetInput): Promise<unknown>;
  createPhysicalAsset(data: CreatePhysicalAssetInput): Promise<unknown>;
  listDigitalAssets(): Promise<unknown[]>;
  listPhysicalAssets(): Promise<unknown[]>;
  createMarketingPlan(data: CreateMarketingPlanInput): Promise<unknown>;
  createCampaign(data: CreateCampaignInput): Promise<unknown>;
  recordBrandAwareness(data: BrandAwarenessInput): Promise<unknown>;
  getAnalyticsSummary(): Promise<AnalyticsSummary>;
  refreshDailySnapshots(date: string): Promise<unknown>;
}
`);

console.log('billing/pricing/bd ports written');
