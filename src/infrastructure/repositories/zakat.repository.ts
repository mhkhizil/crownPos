import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service.js';
import { InvoiceStatus } from '../../domain/enums/invoice-status.enum.js';
import { ZakatNisabStyle } from '../../domain/enums/zakat-nisab-style.enum.js';
import { ZakatPeriodType } from '../../domain/enums/zakat-period-type.enum.js';
import type {
  CreateZakatPaymentInput,
  IZakatRepository,
  ListZakatPaymentsFilter,
} from '../../domain/repositories/zakat.repository.interface.js';
import type {
  StockValuationLine,
  ZakatWealthSnapshot,
} from '../../domain/entities/zakat.entity.js';
import { ZakatPaymentEntity } from '../../domain/entities/zakat.entity.js';
import { toDecimal } from './_prisma-helpers.js';

function num(v: { toNumber?: () => number } | number | null | undefined): number {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  return Number(v);
}

type ZakatRow = Prisma.ZakatPaymentGetPayload<object>;

function toEntity(row: ZakatRow): ZakatPaymentEntity {
  return new ZakatPaymentEntity(
    row.id,
    row.companyId,
    row.periodType as ZakatPeriodType,
    row.periodStart,
    row.periodEnd,
    row.year,
    row.month,
    num(row.amountPaidMmk),
    row.paidAt,
    row.nisabStyle as ZakatNisabStyle | null,
    row.calculatedDueMmk == null ? null : num(row.calculatedDueMmk),
    row.notes,
    row.createdByUserId,
    row.createdAt,
    row.updatedAt,
    row.deletedAt,
  );
}

@Injectable()
export class ZakatRepository implements IZakatRepository {
  constructor(private readonly prisma: PrismaService) {}

  async sumOpenReceivablesMmk(): Promise<number> {
    const agg = await this.prisma.invoice.aggregate({
      where: {
        deletedAt: null,
        status: {
          notIn: [
            InvoiceStatus.DRAFT,
            InvoiceStatus.CANCELLED,
            InvoiceStatus.WRITTEN_OFF,
          ],
        },
      },
      _sum: { balanceDueMmk: true },
    });
    return num(agg._sum.balanceDueMmk);
  }

  async getWealthSnapshot(): Promise<ZakatWealthSnapshot> {
    const balances = await this.prisma.inventoryBalance.findMany({
      where: { deletedAt: null },
    });

    const stockLines: StockValuationLine[] = [];
    const warnings: string[] = [];
    let finishedGoodsValueMmk = 0;
    let rawMaterialsValueMmk = 0;

    for (const bal of balances) {
      const qty = num(bal.quantityAvailable);
      if (qty <= 0) continue;

      if (bal.itemType === 'FINISHED_GOOD' && bal.productSkuId) {
        const priced = await this.resolveFgUnitPrice(bal.productSkuId);
        const lineValueMmk = Math.round(qty * priced.unitPriceMmk * 100) / 100;
        finishedGoodsValueMmk += lineValueMmk;
        if (priced.warning) warnings.push(priced.warning);
        stockLines.push({
          itemType: 'FINISHED_GOOD',
          productSkuId: bal.productSkuId,
          rawMaterialId: null,
          quantity: qty,
          unitPriceMmk: priced.unitPriceMmk,
          lineValueMmk,
          priceSource: priced.source,
          warning: priced.warning,
        });
      } else if (bal.itemType === 'RAW_MATERIAL' && bal.rawMaterialId) {
        const priced = await this.resolveRawUnitCost(bal.rawMaterialId);
        const lineValueMmk = Math.round(qty * priced.unitPriceMmk * 100) / 100;
        rawMaterialsValueMmk += lineValueMmk;
        if (priced.warning) warnings.push(priced.warning);
        stockLines.push({
          itemType: 'RAW_MATERIAL',
          productSkuId: null,
          rawMaterialId: bal.rawMaterialId,
          quantity: qty,
          unitPriceMmk: priced.unitPriceMmk,
          lineValueMmk,
          priceSource: priced.source,
          warning: priced.warning,
        });
      }
    }

    const assets = await this.prisma.physicalAsset.aggregate({
      where: { deletedAt: null, isActive: true },
      _sum: { bookValueMmk: true },
    });

    const poRows = await this.prisma.purchaseOrder.findMany({
      where: {
        deletedAt: null,
        status: { notIn: ['DRAFT', 'CANCELLED'] },
      },
      select: { totalAmountMmk: true, amountPaidMmk: true },
    });
    let supplierPayablesMmk = 0;
    for (const r of poRows) {
      supplierPayablesMmk += Math.max(
        0,
        Number(r.totalAmountMmk) - Number(r.amountPaidMmk),
      );
    }
    supplierPayablesMmk = Math.round(supplierPayablesMmk * 100) / 100;

    return {
      receivablesMmk: await this.sumOpenReceivablesMmk(),
      finishedGoodsValueMmk:
        Math.round(finishedGoodsValueMmk * 100) / 100,
      rawMaterialsValueMmk: Math.round(rawMaterialsValueMmk * 100) / 100,
      excludedPhysicalAssetsMmk: num(assets._sum.bookValueMmk),
      supplierPayablesMmk,
      stockLines,
      warnings,
    };
  }

  async createPayment(
    data: CreateZakatPaymentInput,
  ): Promise<ZakatPaymentEntity> {
    const row = await this.prisma.zakatPayment.create({
      data: {
        companyId: data.companyId ?? null,
        periodType: data.periodType,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        year: data.year ?? null,
        month: data.month ?? null,
        amountPaidMmk: toDecimal(data.amountPaidMmk),
        paidAt: data.paidAt,
        nisabStyle: data.nisabStyle ?? null,
        calculatedDueMmk:
          data.calculatedDueMmk == null
            ? null
            : toDecimal(data.calculatedDueMmk),
        notes: data.notes ?? null,
        createdByUserId: data.createdByUserId ?? null,
      },
    });
    return toEntity(row);
  }

  async listPayments(
    filter: ListZakatPaymentsFilter,
  ): Promise<ZakatPaymentEntity[]> {
    if (filter.from && filter.to) {
      return this.listPaymentsOverlapping(filter.from, filter.to);
    }
    const where: Prisma.ZakatPaymentWhereInput = { deletedAt: null };
    if (filter.year != null) where.year = filter.year;
    if (filter.month != null) where.month = filter.month;
    const rows = await this.prisma.zakatPayment.findMany({
      where,
      orderBy: [{ periodStart: 'asc' }, { paidAt: 'asc' }],
    });
    return rows.map(toEntity);
  }

  async listPaymentsOverlapping(
    from: Date,
    to: Date,
  ): Promise<ZakatPaymentEntity[]> {
    const rows = await this.prisma.zakatPayment.findMany({
      where: {
        deletedAt: null,
        periodStart: { lte: to },
        periodEnd: { gte: from },
      },
      orderBy: [{ periodStart: 'asc' }, { paidAt: 'asc' }],
    });
    return rows.map(toEntity);
  }

  async softDeletePayment(id: string): Promise<ZakatPaymentEntity | null> {
    const existing = await this.prisma.zakatPayment.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) return null;
    const row = await this.prisma.zakatPayment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return toEntity(row);
  }

  private async resolveFgUnitPrice(
    productSkuId: string,
  ): Promise<{ unitPriceMmk: number; source: string; warning: string | null }> {
    const cityPrice = await this.prisma.cityProductPrice.findFirst({
      where: { productSkuId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
    });
    if (cityPrice) {
      return {
        unitPriceMmk: num(cityPrice.unitPriceMmk),
        source: 'CITY_PRODUCT_PRICE',
        warning: null,
      };
    }

    const line = await this.prisma.invoiceLine.findFirst({
      where: { productSkuId, deletedAt: null, invoice: { deletedAt: null } },
      orderBy: { createdAt: 'desc' },
    });
    if (line) {
      return {
        unitPriceMmk: num(line.unitPriceMmk),
        source: 'LATEST_INVOICE_LINE',
        warning: null,
      };
    }

    return {
      unitPriceMmk: 0,
      source: 'NONE',
      warning: `No sell price for FG SKU ${productSkuId}`,
    };
  }

  private async resolveRawUnitCost(
    rawMaterialId: string,
  ): Promise<{ unitPriceMmk: number; source: string; warning: string | null }> {
    const poLine = await this.prisma.purchaseOrderLine.findFirst({
      where: {
        rawMaterialId,
        deletedAt: null,
        purchaseOrder: {
          deletedAt: null,
          status: { in: ['PARTIALLY_RECEIVED', 'RECEIVED'] },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    if (poLine) {
      return {
        unitPriceMmk: num(poLine.unitPriceMmk),
        source: 'LAST_PO_LINE',
        warning: null,
      };
    }

    const supplier = await this.prisma.supplierRawMaterial.findFirst({
      where: { rawMaterialId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
    });
    if (supplier?.unitPriceMmk != null) {
      return {
        unitPriceMmk: num(supplier.unitPriceMmk),
        source: 'SUPPLIER_RAW_MATERIAL',
        warning: null,
      };
    }

    return {
      unitPriceMmk: 0,
      source: 'NONE',
      warning: `No cost for raw material ${rawMaterialId}`,
    };
  }
}
