import type { Prisma } from '@prisma/client';
import {
  ProductionDailyLineEntity,
  ProductionDailyRawUsageEntity,
  ProductionDailyRecordEntity,
  ProductionDailyWorkerEntity,
} from '../../domain/entities/production-daily-record.entity.js';

function num(v: { toNumber?: () => number } | number | null | undefined): number {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  return Number(v);
}

type Row = Prisma.ProductionDailyRecordGetPayload<{
  include: { lines: true; rawUsages: true; workers: true };
}>;

export class ProductionDailyRecordMapper {
  static toDomain(row: Row): ProductionDailyRecordEntity {
    return new ProductionDailyRecordEntity(
      row.id,
      row.factoryId,
      row.productionDate,
      row.employeeCount,
      row.notes,
      (row.lines ?? [])
        .filter((l) => !l.deletedAt)
        .map(
          (l) =>
            new ProductionDailyLineEntity(
              l.id,
              l.productSkuId,
              l.unitId,
              num(l.quantityProduced),
              l.billOfMaterialId,
            ),
        ),
      (row.rawUsages ?? [])
        .filter((u) => !u.deletedAt)
        .map(
          (u) =>
            new ProductionDailyRawUsageEntity(
              u.id,
              u.rawMaterialId,
              u.unitId,
              num(u.quantityUsed),
              u.notes,
            ),
        ),
      (row.workers ?? [])
        .filter((w) => !w.deletedAt)
        .map(
          (w) =>
            new ProductionDailyWorkerEntity(
              w.id,
              w.userId,
              w.workerNameEn,
              w.workerNameMm,
            ),
        ),
      row.createdAt,
      row.updatedAt,
      row.deletedAt,
    );
  }
}
