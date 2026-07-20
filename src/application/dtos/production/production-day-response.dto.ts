import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ProductionDailyRecordEntity } from '../../../domain/entities/production-daily-record.entity.js';

export class ProductionDayResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() factoryId!: string;
  @ApiProperty() productionDate!: string;
  @ApiProperty() employeeCount!: number;
  @ApiPropertyOptional({ nullable: true }) notes!: string | null;
  @ApiProperty() lines!: Array<{
    id: string;
    productSkuId: string;
    unitId: string;
    quantityProduced: number;
    billOfMaterialId: string | null;
  }>;
  @ApiProperty() rawUsages!: Array<{
    id: string;
    rawMaterialId: string;
    unitId: string;
    quantityUsed: number;
    notes: string | null;
  }>;
  @ApiProperty() workers!: Array<{
    id: string;
    userId: string | null;
    workerNameEn: string | null;
    workerNameMm: string | null;
  }>;
  @ApiProperty() createdAt!: string;

  static fromEntity(e: ProductionDailyRecordEntity): ProductionDayResponseDto {
    const dto = new ProductionDayResponseDto();
    dto.id = e.id;
    dto.factoryId = e.factoryId;
    dto.productionDate = e.productionDate.toISOString().slice(0, 10);
    dto.employeeCount = e.employeeCount;
    dto.notes = e.notes;
    dto.lines = e.lines.map((l) => ({
      id: l.id,
      productSkuId: l.productSkuId,
      unitId: l.unitId,
      quantityProduced: l.quantityProduced,
      billOfMaterialId: l.billOfMaterialId,
    }));
    dto.rawUsages = e.rawUsages.map((u) => ({
      id: u.id,
      rawMaterialId: u.rawMaterialId,
      unitId: u.unitId,
      quantityUsed: u.quantityUsed,
      notes: u.notes,
    }));
    dto.workers = e.workers.map((w) => ({
      id: w.id,
      userId: w.userId,
      workerNameEn: w.workerNameEn,
      workerNameMm: w.workerNameMm,
    }));
    dto.createdAt = e.createdAt.toISOString();
    return dto;
  }
}
