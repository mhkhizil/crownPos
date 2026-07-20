import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { toDateOnly, toDecimal } from './_prisma-helpers.js';
import { ProductionDailyRecordMapper } from '../mappers/production-daily-record.mapper.js';
import type {
  IProductionRepository,
  UpsertProductionDayInput,
} from '../../domain/repositories/production.repository.interface.js';
import type { ProductionDailyRecordEntity } from '../../domain/entities/production-daily-record.entity.js';

@Injectable()
export class ProductionRepository implements IProductionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findProductionDay(
    factoryId: string,
    productionDate: string,
  ): Promise<ProductionDailyRecordEntity | null> {
    const row = await this.prisma.productionDailyRecord.findFirst({
      where: {
        factoryId,
        productionDate: toDateOnly(productionDate),
        deletedAt: null,
      },
      include: {
        lines: { where: { deletedAt: null } },
        rawUsages: { where: { deletedAt: null } },
        workers: { where: { deletedAt: null } },
      },
    });
    return row ? ProductionDailyRecordMapper.toDomain(row) : null;
  }

  async upsertProductionDay(
    data: UpsertProductionDayInput,
  ): Promise<ProductionDailyRecordEntity> {
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

    const row = await this.prisma.productionDailyRecord.findFirst({
      where: { id: record.id },
      include: {
        lines: { where: { deletedAt: null } },
        rawUsages: { where: { deletedAt: null } },
        workers: { where: { deletedAt: null } },
      },
    });
    if (!row) throw new NotFoundException('Production day not found');
    return ProductionDailyRecordMapper.toDomain(row);
  }

  async listProductionDays(
    factoryId?: string,
  ): Promise<ProductionDailyRecordEntity[]> {
    const rows = await this.prisma.productionDailyRecord.findMany({
      where: { deletedAt: null, ...(factoryId ? { factoryId } : {}) },
      include: {
        lines: { where: { deletedAt: null } },
        rawUsages: { where: { deletedAt: null } },
        workers: { where: { deletedAt: null } },
      },
      orderBy: { productionDate: 'desc' },
    });
    return rows.map((r) => ProductionDailyRecordMapper.toDomain(r));
  }
}
