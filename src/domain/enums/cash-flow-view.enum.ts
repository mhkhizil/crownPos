/**
 * Which slice of the cash book to show.
 * BUSINESS = sales collections + supplier payments only
 * MANUAL = custom capital/personal/home/misc only
 * TOTAL = BUSINESS + MANUAL (full picture)
 */
export enum CashFlowView {
  BUSINESS = 'BUSINESS',
  MANUAL = 'MANUAL',
  TOTAL = 'TOTAL',
}
