import fs from 'fs';
import path from 'path';

const root = process.cwd();
function w(rel, content) {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content.replace(/\r?\n/g, '\n'));
  console.log('wrote', rel);
}

// ── Production port + repo ──
w(
  'src/domain/repositories/production.repository.interface.ts',
  `export const PRODUCTION_REPOSITORY = Symbol('PRODUCTION_REPOSITORY');

export interface ProductionWorkerInput {
  userId?: string;
  workerNameEn?: string;
  workerNameMm?: string;
}

export interface ProductionLineInput {
  productSkuId: string;
  unitId: string;
  quantityProduced: number;
  billOfMaterialId?: string;
}

export interface ProductionRawUsageInput {
  rawMaterialId: string;
  unitId: string;
  quantityUsed: number;
  notes?: string;
}

export interface UpsertProductionDayInput {
  factoryId: string;
  productionDate: string;
  employeeCount: number;
  notes?: string;
  workers?: ProductionWorkerInput[];
  lines: ProductionLineInput[];
  rawUsages: ProductionRawUsageInput[];
}

export interface IProductionRepository {
  upsertProductionDay(data: UpsertProductionDayInput): Promise<unknown>;
  listProductionDays(factoryId?: string): Promise<unknown[]>;
}
`,
);

w(
  'src/infrastructure/repositories/production.repository.ts',
  `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { toDateOnly, toDecimal } from './_prisma-helpers.js';
import type {
  IProductionRepository,
  UpsertProductionDayInput,
} from '../../domain/repositories/production.repository.interface.js';
import type { IInventoryRepository } from '../../domain/repositories/inventory.repository.interface.js';
import { INVENTORY_REPOSITORY } from '../../domain/repositories/inventory.repository.interface.js';
import { Inject } from '@nestjs/common';

@Injectable()
export class ProductionRepository implements IProductionRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventory: IInventoryRepository,
  ) {}

  async upsertProductionDay(data: UpsertProductionDayInput) {
    const productionDate = toDateOnly(data.productionDate);
    const existing = await this.prisma.productionDailyRecord.findFirst({
      where: { factoryId: data.factoryId, productionDate, deletedAt: null },
    });

    if (existing) {
      await this.prisma.productionDailyLine.updateMany({
        where: { productionDailyRecordId: existing.id, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      await this.prisma.productionDailyRawUsage.updateMany({
        where: { productionDailyRecordId: existing.id, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      await this.prisma.productionDailyWorker.updateMany({
        where: { productionDailyRecordId: existing.id, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      await this.prisma.productionDailyRecord.update({
        where: { id: existing.id },
        data: {
          employeeCount: data.employeeCount,
          notes: data.notes ?? null,
        },
      });
    }

    const record =
      existing ??
      (await this.prisma.productionDailyRecord.create({
        data: {
          factoryId: data.factoryId,
          productionDate,
          employeeCount: data.employeeCount,
          notes: data.notes ?? null,
        },
      }));

    for (const line of data.lines) {
      await this.prisma.productionDailyLine.create({
        data: {
          productionDailyRecordId: record.id,
          productSkuId: line.productSkuId,
          unitId: line.unitId,
          quantityProduced: toDecimal(line.quantityProduced),
          billOfMaterialId: line.billOfMaterialId ?? null,
        },
      });
      await this.inventory.adjustBalance({
        itemType: 'FINISHED_GOOD',
        productSkuId: line.productSkuId,
        unitId: line.unitId,
        delta: line.quantityProduced,
        asOfDate: productionDate,
      });
    }

    for (const usage of data.rawUsages) {
      await this.prisma.productionDailyRawUsage.create({
        data: {
          productionDailyRecordId: record.id,
          rawMaterialId: usage.rawMaterialId,
          unitId: usage.unitId,
          quantityUsed: toDecimal(usage.quantityUsed),
          notes: usage.notes ?? null,
        },
      });
      await this.inventory.adjustBalance({
        itemType: 'RAW_MATERIAL',
        rawMaterialId: usage.rawMaterialId,
        unitId: usage.unitId,
        delta: -usage.quantityUsed,
        asOfDate: productionDate,
      });
    }

    for (const worker of data.workers ?? []) {
      await this.prisma.productionDailyWorker.create({
        data: {
          productionDailyRecordId: record.id,
          userId: worker.userId ?? null,
          workerNameEn: worker.workerNameEn ?? null,
          workerNameMm: worker.workerNameMm ?? null,
        },
      });
    }

    return this.prisma.productionDailyRecord.findFirst({
      where: { id: record.id },
      include: {
        lines: { where: { deletedAt: null } },
        rawUsages: { where: { deletedAt: null } },
        workers: { where: { deletedAt: null } },
      },
    });
  }

  listProductionDays(factoryId?: string) {
    return this.prisma.productionDailyRecord.findMany({
      where: { deletedAt: null, ...(factoryId ? { factoryId } : {}) },
      include: {
        lines: { where: { deletedAt: null } },
        rawUsages: { where: { deletedAt: null } },
        workers: { where: { deletedAt: null } },
      },
      orderBy: { productionDate: 'desc' },
    });
  }
}
`,
);

console.log('done production');
