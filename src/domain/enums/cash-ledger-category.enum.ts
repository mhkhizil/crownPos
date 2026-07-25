/**
 * Purpose of a cash/bank movement.
 */
export enum CashLedgerCategory {
  /** Starting or injected business capital (manual) */
  CAPITAL = 'CAPITAL',
  /** Owner withdrew money for personal use (manual) */
  PERSONAL_DRAW = 'PERSONAL_DRAW',
  /** Bought home/family items from business money (manual) */
  HOME_PURCHASE = 'HOME_PURCHASE',
  /** Business spend not on a PO — rent, wages, misc (manual) */
  BUSINESS_EXPENSE = 'BUSINESS_EXPENSE',
  /** Auto: customer invoice payment received */
  BUSINESS_COLLECTION = 'BUSINESS_COLLECTION',
  /** Auto: supplier PO payment recorded */
  BUSINESS_SUPPLIER_PAYMENT = 'BUSINESS_SUPPLIER_PAYMENT',
  OTHER = 'OTHER',
}
