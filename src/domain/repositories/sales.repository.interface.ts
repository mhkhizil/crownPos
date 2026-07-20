import type { SalesOrderEntity } from '../entities/sales-order.entity.js';
import type { CustomerReceiveMode } from '../enums/customer-receive-mode.enum.js';
import type { DeliveryChannel } from '../enums/delivery-channel.enum.js';
import type { OrderSource } from '../enums/order-source.enum.js';
import type { SalesOrderStatus } from '../enums/sales-order-status.enum.js';

export const SALES_REPOSITORY = Symbol('SALES_REPOSITORY');

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

export interface ApplyStockCheckInput {
  hasSufficientStock: boolean;
  stockCheckNotes: string;
  status: SalesOrderStatus;
  stockCheckedAt: Date;
}

export interface ConfirmWithStockResult {
  entity: SalesOrderEntity;
  shortages: string[];
}

export interface UpdateOrderStatusStamps {
  goodsReceivedAt?: Date;
  saleOkAt?: Date;
}

export interface ISalesRepository {
  createSalesOrder(data: CreateSalesOrderInput): Promise<SalesOrderEntity>;
  applyStockCheck(
    orderId: string,
    data: ApplyStockCheckInput,
  ): Promise<SalesOrderEntity>;
  /**
   * Atomically check FG available minus other CONFIRMED orders, then set
   * CONFIRMED or HOLD. Serializes concurrent confirms via advisory locks.
   */
  confirmWithStockCheck(orderId: string): Promise<ConfirmWithStockResult>;
  listSalesOrders(): Promise<SalesOrderEntity[]>;
  getSalesOrder(orderId: string): Promise<SalesOrderEntity | null>;
  updateOrderStatus(
    orderId: string,
    status: SalesOrderStatus,
    stamps?: UpdateOrderStatusStamps,
  ): Promise<void>;
}
