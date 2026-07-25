/**
 * Staff judgment of whether an open receivable is still zakatable wealth.
 * Independent of InvoiceStatus (OVERDUE ≠ hopeless).
 */
export enum InvoiceRecoverability {
  /** Expected to be paid — included in zakat receivables. */
  LIKELY = 'LIKELY',
  /** Uncertain recovery — excluded from zakat net until reclassified or paid. */
  DOUBTFUL = 'DOUBTFUL',
  /** No realistic hope — excluded from zakat (ops may still collect). */
  HOPELESS = 'HOPELESS',
}
