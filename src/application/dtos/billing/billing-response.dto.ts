import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  CollectionReminderEntity,
  InvoiceEntity,
  PaymentEntity,
} from '../../../domain/entities/billing.entity.js';

export class InvoiceResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() invoiceNumber!: string;
  @ApiProperty() customerId!: string;
  @ApiPropertyOptional({ nullable: true }) salesOrderId!: string | null;
  @ApiProperty() status!: string;
  @ApiProperty() totalMmk!: number;
  @ApiProperty() amountPaidMmk!: number;
  @ApiProperty() balanceDueMmk!: number;
  @ApiProperty() lines!: Array<{
    id: string;
    productSkuId: string;
    unitId: string;
    quantity: number;
    unitPriceMmk: number;
    lineTotalMmk: number;
  }>;
  @ApiProperty() createdAt!: string;

  static fromEntity(e: InvoiceEntity): InvoiceResponseDto {
    const dto = new InvoiceResponseDto();
    dto.id = e.id;
    dto.invoiceNumber = e.invoiceNumber;
    dto.customerId = e.customerId;
    dto.salesOrderId = e.salesOrderId;
    dto.status = e.status;
    dto.totalMmk = e.totalMmk;
    dto.amountPaidMmk = e.amountPaidMmk;
    dto.balanceDueMmk = e.balanceDueMmk;
    dto.lines = e.lines.map((l) => ({
      id: l.id,
      productSkuId: l.productSkuId,
      unitId: l.unitId,
      quantity: l.quantity,
      unitPriceMmk: l.unitPriceMmk,
      lineTotalMmk: l.lineTotalMmk,
    }));
    dto.createdAt = e.createdAt.toISOString();
    return dto;
  }
}

export class PaymentResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() paymentNumber!: string;
  @ApiProperty() paymentDate!: string;
  @ApiProperty() method!: string;
  @ApiProperty() status!: string;
  @ApiProperty() amountMmk!: number;
  @ApiProperty() allocations!: Array<{ id: string; invoiceId: string; amountMmk: number }>;

  static fromEntity(e: PaymentEntity): PaymentResponseDto {
    const dto = new PaymentResponseDto();
    dto.id = e.id;
    dto.paymentNumber = e.paymentNumber;
    dto.paymentDate = e.paymentDate.toISOString().slice(0, 10);
    dto.method = e.method;
    dto.status = e.status;
    dto.amountMmk = e.amountMmk;
    dto.allocations = e.allocations.map((a) => ({
      id: a.id,
      invoiceId: a.invoiceId,
      amountMmk: a.amountMmk,
    }));
    return dto;
  }
}

export class CollectionReminderResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() invoiceId!: string;
  @ApiProperty() scheduledFor!: string;
  @ApiProperty() status!: string;
  @ApiProperty() titleEn!: string;
  @ApiPropertyOptional({ nullable: true }) titleMm!: string | null;
  @ApiPropertyOptional({ nullable: true }) messageEn!: string | null;
  @ApiPropertyOptional({ nullable: true }) assignedToUserId!: string | null;
  @ApiPropertyOptional({ nullable: true }) notifiedAt!: string | null;
  @ApiPropertyOptional({ nullable: true }) completedAt!: string | null;

  static fromEntity(e: CollectionReminderEntity): CollectionReminderResponseDto {
    const dto = new CollectionReminderResponseDto();
    dto.id = e.id;
    dto.invoiceId = e.invoiceId;
    dto.scheduledFor = e.scheduledFor.toISOString();
    dto.status = e.status;
    dto.titleEn = e.titleEn;
    dto.titleMm = e.titleMm;
    dto.messageEn = e.messageEn;
    dto.assignedToUserId = e.assignedToUserId;
    dto.notifiedAt = e.notifiedAt?.toISOString() ?? null;
    dto.completedAt = e.completedAt?.toISOString() ?? null;
    return dto;
  }
}

export class DispatchDueCollectionRemindersResultDto {
  @ApiProperty() claimed!: number;
  @ApiProperty({ type: [String] }) reminderIds!: string[];
  @ApiProperty() pushCount!: number;
  @ApiProperty() emailCount!: number;
  @ApiProperty() smsCount!: number;

  static create(props: {
    claimed: number;
    reminderIds: string[];
    pushCount: number;
    emailCount: number;
    smsCount: number;
  }): DispatchDueCollectionRemindersResultDto {
    const dto = new DispatchDueCollectionRemindersResultDto();
    dto.claimed = props.claimed;
    dto.reminderIds = props.reminderIds;
    dto.pushCount = props.pushCount;
    dto.emailCount = props.emailCount;
    dto.smsCount = props.smsCount;
    return dto;
  }
}
