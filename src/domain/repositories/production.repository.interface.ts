import type { ProductionDailyRecordEntity } from '../entities/production-daily-record.entity.js';

export const PRODUCTION_REPOSITORY = Symbol('PRODUCTION_REPOSITORY');

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
  findProductionDay(
    factoryId: string,
    productionDate: string,
  ): Promise<ProductionDailyRecordEntity | null>;
  upsertProductionDay(
    data: UpsertProductionDayInput,
  ): Promise<ProductionDailyRecordEntity>;
  listProductionDays(
    factoryId?: string,
  ): Promise<ProductionDailyRecordEntity[]>;
}
