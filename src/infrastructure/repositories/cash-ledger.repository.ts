import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service.js';
import { CashFlowView } from '../../domain/enums/cash-flow-view.enum.js';
import { CashLedgerAccount } from '../../domain/enums/cash-ledger-account.enum.js';
import { CashLedgerCategory } from '../../domain/enums/cash-ledger-category.enum.js';
import { CashLedgerDirection } from '../../domain/enums/cash-ledger-direction.enum.js';
import { CashLedgerSource } from '../../domain/enums/cash-ledger-source.enum.js';
import type {
  CreateCashLedgerEntryInput,
  ICashLedgerRepository,
  ListCashLedgerFilter,
} from '../../domain/repositories/cash-ledger.repository.interface.js';
import type { CashLedgerBalances } from '../../domain/entities/cash-ledger.entity.js';
import { CashLedgerEntryEntity } from '../../domain/entities/cash-ledger.entity.js';
import { toDecimal } from './_prisma-helpers.js';

function num(v: { toNumber?: () => number } | number | null | undefined): number {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  return Number(v);
}

type Row = Prisma.CashLedgerEntryGetPayload<object>;

function toEntity(row: Row): CashLedgerEntryEntity {
  return new CashLedgerEntryEntity(
    row.id,
    row.companyId,
    row.entryDate,
    row.direction as CashLedgerDirection,
    row.account as CashLedgerAccount,
    row.category as CashLedgerCategory,
    row.source as CashLedgerSource,
    row.sourceRef,
    num(row.amountMmk),
    row.notes,
    row.createdByUserId,
    row.createdAt,
    row.updatedAt,
    row.deletedAt,
  );
}

function sourceWhere(
  view: CashFlowView | undefined,
): Prisma.CashLedgerEntryWhereInput {
  if (view === CashFlowView.BUSINESS) {
    return { source: CashLedgerSource.BUSINESS };
  }
  if (view === CashFlowView.MANUAL) {
    return { source: CashLedgerSource.MANUAL };
  }
  return {};
}

@Injectable()
export class CashLedgerRepository implements ICashLedgerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateCashLedgerEntryInput): Promise<CashLedgerEntryEntity> {
    const row = await this.prisma.cashLedgerEntry.create({
      data: {
        companyId: data.companyId ?? null,
        entryDate: data.entryDate,
        direction: data.direction,
        account: data.account,
        category: data.category,
        source: data.source ?? CashLedgerSource.MANUAL,
        sourceRef: data.sourceRef ?? null,
        amountMmk: toDecimal(data.amountMmk),
        notes: data.notes ?? null,
        createdByUserId: data.createdByUserId ?? null,
      },
    });
    return toEntity(row);
  }

  async createIfAbsent(
    data: CreateCashLedgerEntryInput & { sourceRef: string },
  ): Promise<CashLedgerEntryEntity> {
    const existing = await this.prisma.cashLedgerEntry.findFirst({
      where: { sourceRef: data.sourceRef, deletedAt: null },
    });
    if (existing) return toEntity(existing);
    return this.create(data);
  }

  async list(filter: ListCashLedgerFilter): Promise<CashLedgerEntryEntity[]> {
    const where: Prisma.CashLedgerEntryWhereInput = {
      deletedAt: null,
      ...sourceWhere(filter.view),
    };
    if (filter.date) {
      where.entryDate = filter.date;
    } else if (filter.from || filter.to) {
      where.entryDate = {};
      if (filter.from) where.entryDate.gte = filter.from;
      if (filter.to) where.entryDate.lte = filter.to;
    }
    if (filter.account) where.account = filter.account;
    if (filter.direction) where.direction = filter.direction;
    if (filter.category) where.category = filter.category;

    const rows = await this.prisma.cashLedgerEntry.findMany({
      where,
      orderBy: [{ entryDate: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map(toEntity);
  }

  async softDelete(id: string): Promise<CashLedgerEntryEntity | null> {
    const existing = await this.prisma.cashLedgerEntry.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) return null;
    const row = await this.prisma.cashLedgerEntry.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return toEntity(row);
  }

  async getBalances(
    asOf?: Date,
    view: CashFlowView = CashFlowView.TOTAL,
  ): Promise<CashLedgerBalances> {
    const where: Prisma.CashLedgerEntryWhereInput = {
      deletedAt: null,
      ...sourceWhere(view),
    };
    if (asOf) where.entryDate = { lte: asOf };

    const rows = await this.prisma.cashLedgerEntry.findMany({
      where,
      select: {
        account: true,
        direction: true,
        amountMmk: true,
      },
    });

    let cashIn = 0;
    let cashOut = 0;
    let bankIn = 0;
    let bankOut = 0;
    let totalInflowsMmk = 0;
    let totalOutflowsMmk = 0;

    for (const r of rows) {
      const amt = num(r.amountMmk);
      if (r.direction === CashLedgerDirection.INFLOW) {
        totalInflowsMmk += amt;
        if (r.account === CashLedgerAccount.CASH) cashIn += amt;
        else bankIn += amt;
      } else {
        totalOutflowsMmk += amt;
        if (r.account === CashLedgerAccount.CASH) cashOut += amt;
        else bankOut += amt;
      }
    }

    const round2 = (n: number) => Math.round(n * 100) / 100;
    return {
      view,
      cashOnHandMmk: round2(Math.max(0, cashIn - cashOut)),
      bankBalanceMmk: round2(Math.max(0, bankIn - bankOut)),
      totalInflowsMmk: round2(totalInflowsMmk),
      totalOutflowsMmk: round2(totalOutflowsMmk),
      asOfDate: asOf ? asOf.toISOString().slice(0, 10) : null,
    };
  }
}
