export enum SalesOrderStatus {
  DRAFT = 'DRAFT',
  /** Insufficient stock — waiting for inventory (internal hold). */
  HOLD = 'HOLD',
  CONFIRMED = 'CONFIRMED',
  PARTIALLY_FULFILLED = 'PARTIALLY_FULFILLED',
  GOODS_RECEIVED = 'GOODS_RECEIVED',
  AWAITING_PAYMENT = 'AWAITING_PAYMENT',
  SALE_OK = 'SALE_OK',
  CANCELLED = 'CANCELLED',
}
