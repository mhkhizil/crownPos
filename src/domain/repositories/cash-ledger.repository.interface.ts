import type {
  CashLedgerBalances,
  CashLedgerEntryEntity,
} from '../entities/cash-ledger.entity.js';
import type { CashFlowView } from '../enums/cash-flow-view.enum.js';
import type { CashLedgerAccount } from '../enums/cash-ledger-account.enum.js';
import type { CashLedgerCategory } from '../enums/cash-ledger-category.enum.js';
import type { CashLedgerDirection } from '../enums/cash-ledger-direction.enum.js';
import type { CashLedgerSource } from '../enums/cash-ledger-source.enum.js';

export const CASH_LEDGER_REPOSITORY = Symbol('CASH_LEDGER_REPOSITORY');

export interface CreateCashLedgerEntryInput {
  companyId?: string | null;
  entryDate: Date;
  direction: CashLedgerDirection;
  account: CashLedgerAccount;
  category: CashLedgerCategory;
  source?: CashLedgerSource;
  sourceRef?: string | null;
  amountMmk: number;
  notes?: string | null;
  createdByUserId?: string | null;
}

export interface ListCashLedgerFilter {
  /** BUSINESS | MANUAL | TOTAL (default TOTAL for list = all) */
  view?: CashFlowView;
  date?: Date;
  from?: Date;
  to?: Date;
  account?: CashLedgerAccount;
  direction?: CashLedgerDirection;
  category?: CashLedgerCategory;
}

export interface ICashLedgerRepository {
  create(data: CreateCashLedgerEntryInput): Promise<CashLedgerEntryEntity>;
  /** Idempotent create when sourceRef already exists — returns existing. */
  createIfAbsent(
    data: CreateCashLedgerEntryInput & { sourceRef: string },
  ): Promise<CashLedgerEntryEntity>;
  list(filter: ListCashLedgerFilter): Promise<CashLedgerEntryEntity[]>;
  softDelete(id: string): Promise<CashLedgerEntryEntity | null>;
  getBalances(asOf?: Date, view?: CashFlowView): Promise<CashLedgerBalances>;
}
