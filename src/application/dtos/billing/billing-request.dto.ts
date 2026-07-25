import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { InvoiceRecoverability } from '../../../domain/enums/invoice-recoverability.enum.js';
import { PaymentMethod } from '../../../domain/enums/payment-method.enum.js';

export class CreateInvoiceFromOrderDto {
  @ApiPropertyOptional({ example: '2026-08-01' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class PaymentAllocationDto {
  @ApiProperty() @IsString() @IsNotEmpty() invoiceId!: string;
  @ApiProperty() @IsNumber() @Min(0.01) amountMmk!: number;
}

export class RecordPaymentDto {
  @ApiProperty({ example: '2026-07-19' }) @IsDateString() paymentDate!: string;
  @ApiProperty({ enum: PaymentMethod }) @IsEnum(PaymentMethod) method!: PaymentMethod;
  @ApiProperty() @IsNumber() @Min(0.01) amountMmk!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() bankName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() bankReference?: string;
  @ApiProperty({ type: [PaymentAllocationDto] })
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => PaymentAllocationDto)
  allocations!: PaymentAllocationDto[];
}

export class UpdateInvoiceRecoverabilityDto {
  @ApiProperty({
    enum: InvoiceRecoverability,
    example: InvoiceRecoverability.DOUBTFUL,
    description:
      'Staff judgment of whether this open receivable is still zakatable wealth. ' +
      'Independent of InvoiceStatus (OVERDUE does not auto-mean DOUBTFUL/HOPELESS). ' +
      'LIKELY (default): balanceDue is included in Hanafi zakat receivables. ' +
      'DOUBTFUL: excluded from zakat net until reclassified LIKELY or paid (then treat as cash that year). ' +
      'HOPELESS: excluded from zakat like bad debt for estimate purposes; collection may continue. ' +
      'WRITTEN_OFF status is a separate accounting close and is always excluded from AR.',
  })
  @IsEnum(InvoiceRecoverability)
  recoverability!: InvoiceRecoverability;
}

export class CreateCollectionReminderDto {
  @ApiProperty() @IsString() @IsNotEmpty() invoiceId!: string;
  @ApiProperty() @IsDateString() scheduledFor!: string;
  @ApiProperty() @IsString() @IsNotEmpty() titleEn!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() titleMm?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() messageEn?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() assignedToUserId?: string;
}
