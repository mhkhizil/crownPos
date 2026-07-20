import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  DailyStockCountEntity,
  InventoryBalanceEntity,
} from '../../../domain/entities/inventory-balance.entity.js';

export class InventoryBalanceResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() stockLocationId!: string;
  @ApiProperty() itemType!: string;
  @ApiPropertyOptional({ nullable: true }) rawMaterialId!: string | null;
  @ApiPropertyOptional({ nullable: true }) productSkuId!: string | null;
  @ApiProperty() unitId!: string;
  @ApiProperty() quantityAvailable!: number;
  @ApiProperty() asOfDate!: string;

  static fromEntity(e: InventoryBalanceEntity): InventoryBalanceResponseDto {
    const dto = new InventoryBalanceResponseDto();
    dto.id = e.id;
    dto.stockLocationId = e.stockLocationId;
    dto.itemType = e.itemType;
    dto.rawMaterialId = e.rawMaterialId;
    dto.productSkuId = e.productSkuId;
    dto.unitId = e.unitId;
    dto.quantityAvailable = e.quantityAvailable;
    dto.asOfDate = e.asOfDate.toISOString();
    return dto;
  }
}

export class DailyStockCountResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() stockLocationId!: string;
  @ApiProperty() countDate!: string;
  @ApiPropertyOptional({ nullable: true }) notes!: string | null;
  @ApiProperty() lines!: Array<{
    id: string;
    itemType: string;
    rawMaterialId: string | null;
    productSkuId: string | null;
    unitId: string;
    quantityOnHand: number;
  }>;

  static fromEntity(e: DailyStockCountEntity): DailyStockCountResponseDto {
    const dto = new DailyStockCountResponseDto();
    dto.id = e.id;
    dto.stockLocationId = e.stockLocationId;
    dto.countDate = e.countDate.toISOString().slice(0, 10);
    dto.notes = e.notes;
    dto.lines = e.lines.map((l) => ({
      id: l.id,
      itemType: l.itemType,
      rawMaterialId: l.rawMaterialId,
      productSkuId: l.productSkuId,
      unitId: l.unitId,
      quantityOnHand: l.quantityOnHand,
    }));
    return dto;
  }
}
