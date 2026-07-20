import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { SalesOrderEntity } from '../../../domain/entities/sales-order.entity.js';

export class SalesOrderLineResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() productSkuId!: string;
  @ApiProperty() unitId!: string;
  @ApiProperty() quantity!: number;
  @ApiProperty() unitPriceMmk!: number;
  @ApiProperty() lineTotalMmk!: number;
}

export class SalesOrderResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() orderNumber!: string;
  @ApiProperty() customerId!: string;
  @ApiProperty() orderDate!: string;
  @ApiProperty() orderSource!: string;
  @ApiPropertyOptional({ nullable: true }) takenByUserId!: string | null;
  @ApiProperty() deliveryChannel!: string;
  @ApiPropertyOptional({ nullable: true }) customerReceiveMode!: string | null;
  @ApiProperty() status!: string;
  @ApiPropertyOptional({ nullable: true }) hasSufficientStock!: boolean | null;
  @ApiPropertyOptional({ nullable: true }) stockCheckNotes!: string | null;
  @ApiPropertyOptional({ nullable: true }) goodsReceivedAt!: string | null;
  @ApiPropertyOptional({ nullable: true }) saleOkAt!: string | null;
  @ApiPropertyOptional({ nullable: true }) notes!: string | null;
  @ApiProperty({ type: [SalesOrderLineResponseDto] }) lines!: SalesOrderLineResponseDto[];
  @ApiProperty() createdAt!: string;

  static fromEntity(e: SalesOrderEntity): SalesOrderResponseDto {
    const dto = new SalesOrderResponseDto();
    dto.id = e.id;
    dto.orderNumber = e.orderNumber;
    dto.customerId = e.customerId;
    dto.orderDate = e.orderDate.toISOString().slice(0, 10);
    dto.orderSource = e.orderSource;
    dto.takenByUserId = e.takenByUserId;
    dto.deliveryChannel = e.deliveryChannel;
    dto.customerReceiveMode = e.customerReceiveMode;
    dto.status = e.status;
    dto.hasSufficientStock = e.hasSufficientStock;
    dto.stockCheckNotes = e.stockCheckNotes;
    dto.goodsReceivedAt = e.goodsReceivedAt?.toISOString() ?? null;
    dto.saleOkAt = e.saleOkAt?.toISOString() ?? null;
    dto.notes = e.notes;
    dto.lines = e.lines.map((l) => {
      const line = new SalesOrderLineResponseDto();
      line.id = l.id;
      line.productSkuId = l.productSkuId;
      line.unitId = l.unitId;
      line.quantity = l.quantity;
      line.unitPriceMmk = l.unitPriceMmk;
      line.lineTotalMmk = l.lineTotalMmk;
      return line;
    });
    dto.createdAt = e.createdAt.toISOString();
    return dto;
  }
}
