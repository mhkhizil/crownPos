/**
 * Wire ports + repos + use-cases + controllers to entities/DTOs.
 * Run AFTER retrofit-typed-layers*.mjs
 * node scripts/wire-typed-layers.mjs
 */
import fs from 'fs';
import path from 'path';

const root = process.cwd();
function w(rel, content) {
  fs.writeFileSync(path.join(root, rel), content.replace(/\r?\n/g, '\n'));
  console.log('✓', rel);
}

// ── barrels ────────────────────────────────────────────────────────
w(
  'src/domain/entities/index.ts',
  `export * from './user.entity.js';
export * from './sales-order.entity.js';
export * from './production-daily-record.entity.js';
export * from './inventory-balance.entity.js';
export * from './factory-outbound.entity.js';
export * from './billing.entity.js';
export * from './pricing.entity.js';
export * from './master-data.entity.js';
export * from './bd-analytics.entity.js';
`,
);

w(
  'src/infrastructure/mappers/index.ts',
  `export * from './user.mapper.js';
export * from './sales-order.mapper.js';
export * from './production-daily-record.mapper.js';
export * from './inventory.mapper.js';
export * from './factory-outbound.mapper.js';
export * from './billing.mapper.js';
export * from './pricing.mapper.js';
export * from './master-data.mapper.js';
export * from './bd-analytics.mapper.js';
`,
);

w(
  'src/application/dtos/index.ts',
  `export * from './common/index.js';
export * from './auth/index.js';
export * from './admin-roles/index.js';
export * from './admin-users/index.js';
export * from './sales/index.js';
export * from './production/index.js';
export * from './inventory/index.js';
export * from './outbound/index.js';
export * from './billing/index.js';
export * from './pricing/index.js';
export * from './master-data/index.js';
export * from './bd-analytics/index.js';
`,
);

// ── SALES PORT ─────────────────────────────────────────────────────
w(
  'src/domain/repositories/sales.repository.interface.ts',
  `import type { SalesOrderEntity } from '../entities/sales-order.entity.js';

export const SALES_REPOSITORY = Symbol('SALES_REPOSITORY');

export type OrderSource = 'SALES_OUTBOUND_CALL' | 'SHOP_INBOUND_CALL' | 'OTHER';
export type DeliveryChannel = 'DIRECT_TO_SHOP' | 'VIA_GATE';
export type CustomerReceiveMode =
  | 'CUSTOMER_PICKUP_AT_GATE'
  | 'GATE_DELIVERS_TO_CUSTOMER';

export interface SalesOrderLineInput {
  productSkuId: string;
  unitId: string;
  quantity: number;
  unitPriceMmk: number;
}

export interface CreateSalesOrderInput {
  customerId: string;
  orderDate: string;
  orderSource: OrderSource;
  takenByUserId?: string;
  deliveryChannel: DeliveryChannel;
  customerReceiveMode?: CustomerReceiveMode;
  notes?: string;
  lines: SalesOrderLineInput[];
}

export interface ISalesRepository {
  createSalesOrder(data: CreateSalesOrderInput): Promise<SalesOrderEntity>;
  confirmSalesOrder(orderId: string): Promise<SalesOrderEntity>;
  listSalesOrders(): Promise<SalesOrderEntity[]>;
  getSalesOrder(orderId: string): Promise<SalesOrderEntity | null>;
  markAwaitingPayment(orderId: string, receivedAt: Date): Promise<void>;
  markSaleOk(orderId: string, saleOkAt: Date): Promise<void>;
}
`,
);

console.log('barrels + sales port written');
