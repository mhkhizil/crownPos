import { describe, expect, it } from '@jest/globals';
import { ZAKAT_CONSIDERATION_CODES } from './zakat-consideration-codes.js';

describe('ZAKAT_CONSIDERATION_CODES', () => {
  it('exports the locked completeness codes', () => {
    expect([...ZAKAT_CONSIDERATION_CODES]).toEqual([
      'MANUAL_CASH',
      'MANUAL_OTHER_LIABILITIES',
      'NO_DOUBTFUL_DEBT_FILTER',
      'GREGORIAN_TRACKER_NOT_LUNAR_HAUL',
      'SUPPLIER_AP_AUTO',
      'NO_WIP_VALUATION',
      'NO_CONSIGNMENT_FLAG',
      'BUSINESS_ONLY_NOT_PERSONAL',
    ]);
  });
});
