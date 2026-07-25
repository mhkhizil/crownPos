import type { CashLedgerAccount } from '../enums/cash-ledger-account.enum.js';
import type { CashLedgerCategory } from '../enums/cash-ledger-category.enum.js';
import type { CashLedgerDirection } from '../enums/cash-ledger-direction.enum.js';
import type { CashLedgerSource } from '../enums/cash-ledger-source.enum.js';
import type { CashFlowView } from '../enums/cash-flow-view.enum.js';

export class CashLedgerEntryEntity {
  constructor(
    public readonly id: string,
    public readonly companyId: string | null,
    public readonly entryDate: Date,
    public readonly direction: CashLedgerDirection,
    public readonly account: CashLedgerAccount,
    public readonly category: CashLedgerCategory,
    public readonly source: CashLedgerSource,
    public readonly sourceRef: string | null,
    public readonly amountMmk: number,
    public readonly notes: string | null,
    public readonly createdByUserId: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}

export interface CashLedgerBalances {
  view: CashFlowView;
  /** Net CASH account: inflows − outflows (floor 0). */
  cashOnHandMmk: number;
  /** Net BANK account: inflows − outflows (floor 0). */
  bankBalanceMmk: number;
  totalInflowsMmk: number;
  totalOutflowsMmk: number;
  asOfDate: string | null;
}
