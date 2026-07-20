/** Stable codes / numbers for integrity + edge tests to look up. */
export const CODES = {
  company: 'MAIN',
  factory: 'YG-1',
  warehouse: 'MAIN-WH',
  unit: 'BAG',
  brand: 'FLEX',
  product: 'PROD-FLEX-01',
  sku: 'SKU-FG-01',
  skuRetired: 'SKU-FG-RETIRED',
  raw: 'RAW-CEMENT',
  supplier: 'SUP-YG',
  region: 'YG',
  cityNear: 'YG-NEAR',
  cityFar: 'MDY',
  gateYangon: 'GATE-YG-MAIN',
  gateDest: 'GATE-MDY-BR',
  customerNear: 'CUST-NEAR',
  customerFar: 'CUST-FAR',
  roleOps: 'OPS_STAFF',
  bom: 'BOM-FG-01',
  marketingPlan: 'MP-2026',
  campaign: 'CAMP-AWARE',
  digitalAsset: 'DA-FB-PAGE',
  physicalAsset: 'TRUCK-01',
  poReceived: 'PO-SEED-RECV',
  productionDate: '2026-06-01',
  soDraft: 'SO-DRAFT',
  soHold: 'SO-HOLD',
  soConfirmed: 'SO-CONFIRMED',
  soGoodsRecv: 'SO-GOODS-RECV',
  soSaleOk: 'SO-SALE-OK',
  obConfirmed: 'OB-CONFIRMED',
  obGoodsRecv: 'OB-GOODS-RECV',
  obSaleOk: 'OB-SALE-OK',
  invGoodsRecv: 'INV-GOODS-RECV',
  invSaleOk: 'INV-SALE-OK',
  paySaleOk: 'PAY-SALE-OK',
  payOrphan: 'PAY-ORPHAN',
} as const;

/** Inventory / qty story (documented for integrity arithmetic). */
export const QTY = {
  /** Raw received via PO */
  rawReceived: 5000,
  /** Raw used in production day */
  rawUsedInProduction: 50,
  /** FG produced */
  fgProduced: 200,
  /** SO-CONFIRMED line (still reserved, not received) */
  soConfirmed: 10,
  /** SO-GOODS-RECV line (received; FG depleted) */
  soGoodsRecv: 5,
  /** SO-SALE-OK line (received+paid; FG depleted) */
  soSaleOk: 8,
  /** SO-DRAFT line (no reservation) */
  soDraft: 5,
  /** SO-HOLD line (intentionally too large) */
  soHold: 1000,
  unitPriceMmk: 10_000,
} as const;

/** Expected FG after seed: produced − goodsRecv − saleOk (confirmed not depleted yet). */
export const EXPECTED_FG_AVAILABLE =
  QTY.fgProduced - QTY.soGoodsRecv - QTY.soSaleOk;

/** Expected raw after seed. */
export const EXPECTED_RAW_AVAILABLE =
  QTY.rawReceived - QTY.rawUsedInProduction;

export const PERMISSIONS = [
  { code: 'MANAGE_USERS', module: 'users', nameEn: 'Manage users' },
  { code: 'MANAGE_ROLES', module: 'roles', nameEn: 'Manage roles' },
  { code: 'MANAGE_MASTER_DATA', module: 'master', nameEn: 'Manage master data' },
  { code: 'MANAGE_PRODUCTION', module: 'production', nameEn: 'Manage production' },
  { code: 'MANAGE_INVENTORY', module: 'inventory', nameEn: 'Manage inventory' },
  { code: 'MANAGE_SALES', module: 'sales', nameEn: 'Manage sales' },
  { code: 'MANAGE_OUTBOUND', module: 'outbound', nameEn: 'Manage outbound' },
  { code: 'MANAGE_BILLING', module: 'billing', nameEn: 'Manage billing' },
  { code: 'MANAGE_PRICING', module: 'pricing', nameEn: 'Manage pricing' },
  { code: 'MANAGE_BD', module: 'bd', nameEn: 'Manage business development' },
  { code: 'VIEW_ANALYTICS', module: 'analytics', nameEn: 'View analytics' },
] as const;

export function dateOnly(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}
