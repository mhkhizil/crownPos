export class ProductionDailyLineEntity {
  constructor(
    public readonly id: string,
    public readonly productSkuId: string,
    public readonly unitId: string,
    public readonly quantityProduced: number,
    public readonly billOfMaterialId: string | null,
  ) {}
}

export class ProductionDailyRawUsageEntity {
  constructor(
    public readonly id: string,
    public readonly rawMaterialId: string,
    public readonly unitId: string,
    public readonly quantityUsed: number,
    public readonly notes: string | null,
  ) {}
}

export class ProductionDailyWorkerEntity {
  constructor(
    public readonly id: string,
    public readonly userId: string | null,
    public readonly workerNameEn: string | null,
    public readonly workerNameMm: string | null,
  ) {}
}

export class ProductionDailyRecordEntity {
  constructor(
    public readonly id: string,
    public readonly factoryId: string,
    public readonly productionDate: Date,
    public readonly employeeCount: number,
    public readonly notes: string | null,
    public readonly lines: ProductionDailyLineEntity[],
    public readonly rawUsages: ProductionDailyRawUsageEntity[],
    public readonly workers: ProductionDailyWorkerEntity[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}
