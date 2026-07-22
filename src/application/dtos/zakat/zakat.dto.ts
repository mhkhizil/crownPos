import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ZakatNisabStyle } from '../../../domain/enums/zakat-nisab-style.enum.js';
import { ZakatPeriodType } from '../../../domain/enums/zakat-period-type.enum.js';
import type { ZakatPaymentEntity } from '../../../domain/entities/zakat.entity.js';
import type { HanafiZakatCalculationResult } from '../../../domain/zakat/hanafi-business-zakat.calculator.js';
import { ZAKAT_CONSIDERATION_CODES } from '../../../domain/zakat/zakat-consideration-codes.js';

export class CalculateHanafiZakatDto {
  @ApiProperty({ enum: ZakatNisabStyle })
  @IsEnum(ZakatNisabStyle)
  nisabStyle!: ZakatNisabStyle;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  goldPricePerGramMmk?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  silverPricePerGramMmk?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cashOnHandMmk?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bankBalanceMmk?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  payablesMmk?: number;

  @ApiProperty()
  @IsBoolean()
  haulCompleted!: boolean;

  @ApiPropertyOptional({ description: 'Label only; snapshot uses live DB' })
  @IsOptional()
  @IsDateString()
  asOfDate?: string;
}

export class RecordZakatPaymentDto {
  @ApiProperty({ enum: ZakatPeriodType })
  @IsEnum(ZakatPeriodType)
  periodType!: ZakatPeriodType;

  @ApiPropertyOptional()
  @ValidateIf(
    (o: RecordZakatPaymentDto) =>
      o.periodType === ZakatPeriodType.MONTH ||
      o.periodType === ZakatPeriodType.YEAR,
  )
  @IsInt()
  year?: number;

  @ApiPropertyOptional()
  @ValidateIf((o: RecordZakatPaymentDto) => o.periodType === ZakatPeriodType.MONTH)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @ApiPropertyOptional()
  @ValidateIf((o: RecordZakatPaymentDto) => o.periodType === ZakatPeriodType.CUSTOM)
  @IsDateString()
  periodStart?: string;

  @ApiPropertyOptional()
  @ValidateIf((o: RecordZakatPaymentDto) => o.periodType === ZakatPeriodType.CUSTOM)
  @IsDateString()
  periodEnd?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  amountPaidMmk!: number;

  @ApiProperty()
  @IsDateString()
  paidAt!: string;

  @ApiPropertyOptional({ enum: ZakatNisabStyle })
  @IsOptional()
  @IsEnum(ZakatNisabStyle)
  nisabStyle?: ZakatNisabStyle;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  calculatedDueMmk?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  companyId?: string;
}

export class ZakatCoverageQueryDto {
  @ApiProperty({ enum: ZakatPeriodType })
  @IsEnum(ZakatPeriodType)
  periodType!: ZakatPeriodType;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  periodStart?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  periodEnd?: string;
}

export class ListZakatPaymentsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;
}

export class ZakatPaymentResponseDto {
  @ApiProperty() id!: string;
  @ApiPropertyOptional({ nullable: true }) companyId!: string | null;
  @ApiProperty() periodType!: string;
  @ApiProperty() periodStart!: string;
  @ApiProperty() periodEnd!: string;
  @ApiPropertyOptional({ nullable: true }) year!: number | null;
  @ApiPropertyOptional({ nullable: true }) month!: number | null;
  @ApiProperty() amountPaidMmk!: number;
  @ApiProperty() paidAt!: string;
  @ApiPropertyOptional({ nullable: true }) nisabStyle!: string | null;
  @ApiPropertyOptional({ nullable: true }) calculatedDueMmk!: number | null;
  @ApiPropertyOptional({ nullable: true }) notes!: string | null;

  static fromEntity(e: ZakatPaymentEntity): ZakatPaymentResponseDto {
    const dto = new ZakatPaymentResponseDto();
    dto.id = e.id;
    dto.companyId = e.companyId;
    dto.periodType = e.periodType;
    dto.periodStart = e.periodStart.toISOString().slice(0, 10);
    dto.periodEnd = e.periodEnd.toISOString().slice(0, 10);
    dto.year = e.year;
    dto.month = e.month;
    dto.amountPaidMmk = e.amountPaidMmk;
    dto.paidAt = e.paidAt.toISOString().slice(0, 10);
    dto.nisabStyle = e.nisabStyle;
    dto.calculatedDueMmk = e.calculatedDueMmk;
    dto.notes = e.notes;
    return dto;
  }
}

export class ZakatCoverageResponseDto {
  @ApiProperty() periodStart!: string;
  @ApiProperty() periodEnd!: string;
  @ApiProperty() totalPaidMmk!: number;
  @ApiProperty({ type: [ZakatPaymentResponseDto] })
  payments!: ZakatPaymentResponseDto[];
}

export class HanafiZakatCalculateResponseDto {
  @ApiProperty() nisabStyle!: string;
  @ApiProperty() nisabWeightGrams!: number;
  @ApiProperty() pricePerGramMmk!: number;
  @ApiProperty() nisabMmk!: number;
  @ApiProperty() cashOnHandMmk!: number;
  @ApiProperty() bankBalanceMmk!: number;
  @ApiProperty() receivablesMmk!: number;
  @ApiProperty() finishedGoodsValueMmk!: number;
  @ApiProperty() rawMaterialsValueMmk!: number;
  @ApiProperty() payablesMmk!: number;
  @ApiProperty() excludedPhysicalAssetsMmk!: number;
  @ApiProperty() netZakatableMmk!: number;
  @ApiProperty() meetsNisab!: boolean;
  @ApiProperty() haulCompleted!: boolean;
  @ApiProperty() zakatRate!: number;
  @ApiProperty() zakatDueMmk!: number;
  @ApiPropertyOptional({ nullable: true }) notDueReason!: string | null;
  @ApiProperty({ type: [String] }) warnings!: string[];
  @ApiProperty({ type: [String] }) considerations!: string[];
  @ApiProperty({ type: [ZakatPaymentResponseDto] })
  overlappingPayments!: ZakatPaymentResponseDto[];

  static fromCalc(
    calc: HanafiZakatCalculationResult,
    extras: {
      excludedPhysicalAssetsMmk: number;
      warnings: string[];
      overlappingPayments: ZakatPaymentEntity[];
    },
  ): HanafiZakatCalculateResponseDto {
    const dto = new HanafiZakatCalculateResponseDto();
    dto.nisabStyle = calc.nisabStyle;
    dto.nisabWeightGrams = calc.nisabWeightGrams;
    dto.pricePerGramMmk = calc.pricePerGramMmk;
    dto.nisabMmk = calc.nisabMmk;
    dto.cashOnHandMmk = calc.cashOnHandMmk;
    dto.bankBalanceMmk = calc.bankBalanceMmk;
    dto.receivablesMmk = calc.receivablesMmk;
    dto.finishedGoodsValueMmk = calc.finishedGoodsValueMmk;
    dto.rawMaterialsValueMmk = calc.rawMaterialsValueMmk;
    dto.payablesMmk = calc.payablesMmk;
    dto.excludedPhysicalAssetsMmk = extras.excludedPhysicalAssetsMmk;
    dto.netZakatableMmk = calc.netZakatableMmk;
    dto.meetsNisab = calc.meetsNisab;
    dto.haulCompleted = calc.haulCompleted;
    dto.zakatRate = calc.zakatRate;
    dto.zakatDueMmk = calc.zakatDueMmk;
    dto.notDueReason = calc.notDueReason;
    dto.warnings = extras.warnings;
    dto.considerations = [...ZAKAT_CONSIDERATION_CODES];
    dto.overlappingPayments = extras.overlappingPayments.map((p) =>
      ZakatPaymentResponseDto.fromEntity(p),
    );
    return dto;
  }
}
