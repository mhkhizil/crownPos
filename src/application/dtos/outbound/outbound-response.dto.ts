import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { FactoryOutboundEntity } from '../../../domain/entities/factory-outbound.entity.js';

export class OutboundResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() outboundNumber!: string;
  @ApiProperty() factoryId!: string;
  @ApiPropertyOptional({ nullable: true }) salesOrderId!: string | null;
  @ApiProperty() scheduledDate!: string;
  @ApiProperty() deliveryChannel!: string;
  @ApiProperty() status!: string;
  @ApiPropertyOptional({ nullable: true }) driverUserId!: string | null;
  @ApiProperty() lines!: Array<{ id: string; productSkuId: string; unitId: string; quantity: number }>;
  @ApiProperty() statusLogs!: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    notes: string | null;
    changedAt: string;
  }>;
  @ApiProperty() createdAt!: string;

  static fromEntity(e: FactoryOutboundEntity): OutboundResponseDto {
    const dto = new OutboundResponseDto();
    dto.id = e.id;
    dto.outboundNumber = e.outboundNumber;
    dto.factoryId = e.factoryId;
    dto.salesOrderId = e.salesOrderId;
    dto.scheduledDate = e.scheduledDate.toISOString().slice(0, 10);
    dto.deliveryChannel = e.deliveryChannel;
    dto.status = e.status;
    dto.driverUserId = e.driverUserId;
    dto.lines = e.lines.map((l) => ({
      id: l.id,
      productSkuId: l.productSkuId,
      unitId: l.unitId,
      quantity: l.quantity,
    }));
    dto.statusLogs = e.statusLogs.map((s) => ({
      id: s.id,
      fromStatus: s.fromStatus,
      toStatus: s.toStatus,
      notes: s.notes,
      changedAt: s.changedAt.toISOString(),
    }));
    dto.createdAt = e.createdAt.toISOString();
    return dto;
  }
}
