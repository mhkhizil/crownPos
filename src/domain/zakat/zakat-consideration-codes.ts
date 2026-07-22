/**
 * Known Hanafi business-zakat gaps for this app (v1).
 * Returned on every calculate response so nothing is silent.
 * Retiring a code later requires updating this list intentionally.
 */
export const ZAKAT_CONSIDERATION_CODES = [
  'MANUAL_CASH',
  'MANUAL_PAYABLES',
  'NO_DOUBTFUL_DEBT_FILTER',
  'GREGORIAN_TRACKER_NOT_LUNAR_HAUL',
  'NO_AP_LEDGER',
  'NO_WIP_VALUATION',
  'NO_CONSIGNMENT_FLAG',
  'BUSINESS_ONLY_NOT_PERSONAL',
] as const;

export type ZakatConsiderationCode =
  (typeof ZAKAT_CONSIDERATION_CODES)[number];
