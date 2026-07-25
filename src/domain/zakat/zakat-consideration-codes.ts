/**
 * Known Hanafi business-zakat gaps for this app (v1).
 * Returned on every calculate response so nothing is silent.
 * Retiring a code later requires updating this list intentionally.
 */
export const ZAKAT_CONSIDERATION_CODES = [
  'MANUAL_CASH',
  'CASH_LEDGER_CUSTOM_ONLY',
  'MANUAL_OTHER_LIABILITIES',
  'RECEIVABLES_RECOVERABILITY_FLAG',
  'GREGORIAN_TRACKER_NOT_LUNAR_HAUL',
  'SUPPLIER_AP_AUTO',
  'NO_WIP_VALUATION',
  'NO_CONSIGNMENT_FLAG',
  'BUSINESS_ONLY_NOT_PERSONAL',
] as const;

export type ZakatConsiderationCode =
  (typeof ZAKAT_CONSIDERATION_CODES)[number];
