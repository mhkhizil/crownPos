import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import type { CashLedgerEntryEntity } from '../../../domain/entities/cash-ledger.entity.js';
import type { CashLedgerBalances } from '../../../domain/entities/cash-ledger.entity.js';
import { CashFlowView } from '../../../domain/enums/cash-flow-view.enum.js';
import { CashLedgerAccount } from '../../../domain/enums/cash-ledger-account.enum.js';
import { CashLedgerCategory } from '../../../domain/enums/cash-ledger-category.enum.js';
import { CashLedgerDirection } from '../../../domain/enums/cash-ledger-direction.enum.js';
import { CashLedgerSource } from '../../../domain/enums/cash-ledger-source.enum.js';

/** Categories allowed on manual POST (auto BUSINESS_* come from payments/PO). */
export const MANUAL_CASH_LEDGER_CATEGORIES = [
  CashLedgerCategory.CAPITAL,
  CashLedgerCategory.PERSONAL_DRAW,
  CashLedgerCategory.HOME_PURCHASE,
  CashLedgerCategory.BUSINESS_EXPENSE,
  CashLedgerCategory.OTHER,
] as const;

export class CreateCashLedgerEntryDto {
  @ApiProperty({
    example: '2026-07-26',
    description: 'Calendar day of the movement (daily cash book).',
  })
  @IsDateString()
  entryDate!: string;

  @ApiProperty({
    enum: CashLedgerDirection,
    description:
      'INFLOW = money into cash/bank (e.g. new capital). OUTFLOW = money leaving (personal draw, home purchase, misc).',
  })
  @IsEnum(CashLedgerDirection)
  direction!: CashLedgerDirection;

  @ApiProperty({
    enum: CashLedgerAccount,
    description: 'Which pocket: physical cash drawer vs bank account.',
  })
  @IsEnum(CashLedgerAccount)
  account!: CashLedgerAccount;

  @ApiProperty({
    enum: MANUAL_CASH_LEDGER_CATEGORIES,
    description:
      'Manual categories only. BUSINESS_COLLECTION / BUSINESS_SUPPLIER_PAYMENT are created automatically when you record invoice payments or PO payments — do not post those here.',
  })
  @IsIn(MANUAL_CASH_LEDGER_CATEGORIES)
  category!: (typeof MANUAL_CASH_LEDGER_CATEGORIES)[number];

  @ApiProperty({ example: 500_000 })
  @IsNumber()
  @Min(0.01)
  amountMmk!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  companyId?: string;
}

export class ListCashLedgerQueryDto {
  @ApiPropertyOptional({
    enum: CashFlowView,
    default: CashFlowView.TOTAL,
    description:
      '**BUSINESS** = only auto sales collections + supplier PO payments.\n' +
      '**MANUAL** = only staff custom (capital, personal, home, misc).\n' +
      '**TOTAL** = BUSINESS + MANUAL (full daily cash picture).',
  })
  @IsOptional()
  @IsEnum(CashFlowView)
  view?: CashFlowView;

  @ApiPropertyOptional({
    description: 'Single day filter (YYYY-MM-DD). Prefer this for a daily cash book view.',
    example: '2026-07-26',
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ description: 'Range start (ignored if `date` set)' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'Range end (ignored if `date` set)' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ enum: CashLedgerAccount })
  @IsOptional()
  @IsEnum(CashLedgerAccount)
  account?: CashLedgerAccount;

  @ApiPropertyOptional({ enum: CashLedgerDirection })
  @IsOptional()
  @IsEnum(CashLedgerDirection)
  direction?: CashLedgerDirection;

  @ApiPropertyOptional({ enum: CashLedgerCategory })
  @IsOptional()
  @IsEnum(CashLedgerCategory)
  category?: CashLedgerCategory;
}

export class CashLedgerBalancesQueryDto {
  @ApiPropertyOptional({
    enum: CashFlowView,
    default: CashFlowView.TOTAL,
    description:
      '**BUSINESS** = nets from sales collections + PO payments only.\n' +
      '**MANUAL** = nets from custom entries only.\n' +
      '**TOTAL** = both (use for zakat `useCashLedgerBalances` when the book is complete).',
  })
  @IsOptional()
  @IsEnum(CashFlowView)
  view?: CashFlowView;

  @ApiPropertyOptional({
    description:
      'Include entries on or before this date (YYYY-MM-DD). Omit for all-time net.',
  })
  @IsOptional()
  @IsDateString()
  asOf?: string;
}

export class CashLedgerEntryResponseDto {
  @ApiProperty() id!: string;
  @ApiPropertyOptional({ nullable: true }) companyId!: string | null;
  @ApiProperty() entryDate!: string;
  @ApiProperty({ enum: CashLedgerDirection }) direction!: CashLedgerDirection;
  @ApiProperty({ enum: CashLedgerAccount }) account!: CashLedgerAccount;
  @ApiProperty({ enum: CashLedgerCategory }) category!: CashLedgerCategory;
  @ApiProperty({
    enum: CashLedgerSource,
    description: 'MANUAL = staff entry; BUSINESS = auto from invoice/PO payment',
  })
  source!: CashLedgerSource;
  @ApiPropertyOptional({ nullable: true }) sourceRef!: string | null;
  @ApiProperty() amountMmk!: number;
  @ApiPropertyOptional({ nullable: true }) notes!: string | null;
  @ApiPropertyOptional({ nullable: true }) createdByUserId!: string | null;
  @ApiProperty() createdAt!: string;

  static fromEntity(e: CashLedgerEntryEntity): CashLedgerEntryResponseDto {
    const dto = new CashLedgerEntryResponseDto();
    dto.id = e.id;
    dto.companyId = e.companyId;
    dto.entryDate = e.entryDate.toISOString().slice(0, 10);
    dto.direction = e.direction;
    dto.account = e.account;
    dto.category = e.category;
    dto.source = e.source;
    dto.sourceRef = e.sourceRef;
    dto.amountMmk = e.amountMmk;
    dto.notes = e.notes;
    dto.createdByUserId = e.createdByUserId;
    dto.createdAt = e.createdAt.toISOString();
    return dto;
  }
}

export class CashLedgerBalancesResponseDto {
  @ApiProperty({ enum: CashFlowView })
  view!: CashFlowView;

  @ApiProperty({
    description: 'Net CASH pocket for this view (in − out, floored at 0).',
  })
  cashOnHandMmk!: number;

  @ApiProperty({
    description: 'Net BANK pocket for this view (in − out, floored at 0).',
  })
  bankBalanceMmk!: number;

  @ApiProperty() totalInflowsMmk!: number;
  @ApiProperty() totalOutflowsMmk!: number;
  @ApiPropertyOptional({ nullable: true }) asOfDate!: string | null;

  @ApiProperty()
  completenessNote!: string;

  static fromBalances(b: CashLedgerBalances): CashLedgerBalancesResponseDto {
    const dto = new CashLedgerBalancesResponseDto();
    dto.view = b.view;
    dto.cashOnHandMmk = b.cashOnHandMmk;
    dto.bankBalanceMmk = b.bankBalanceMmk;
    dto.totalInflowsMmk = b.totalInflowsMmk;
    dto.totalOutflowsMmk = b.totalOutflowsMmk;
    dto.asOfDate = b.asOfDate;
    if (b.view === CashFlowView.BUSINESS) {
      dto.completenessNote =
        'Business-process only: customer invoice payments (INFLOW) + supplier PO payments (OUTFLOW). Does not include capital/personal/home manual rows.';
    } else if (b.view === CashFlowView.MANUAL) {
      dto.completenessNote =
        'Manual only: capital, personal draw, home purchase, misc business expense. Does not include invoice collections or PO payments.';
    } else {
      dto.completenessNote =
        'TOTAL = BUSINESS + MANUAL. Complete when all personal/home/capital moves are entered and new invoice/PO payments auto-post (entries before auto-post go-live are not backfilled).';
    }
    return dto;
  }
}
