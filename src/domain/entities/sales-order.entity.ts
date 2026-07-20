/** Auto-shaped typed layer — keep Prisma mapping in infrastructure mappers only. */
import type { CustomerReceiveMode } from '../enums/customer-receive-mode.enum.js';
import type { DeliveryChannel } from '../enums/delivery-channel.enum.js';
import type { OrderSource } from '../enums/order-source.enum.js';
import type { SalesOrderStatus } from '../enums/sales-order-status.enum.js';

export interface SalesOrderLineEntityProps {
  id: string;
  salesOrderId: string;
  productSkuId: string;
  unitId: string;
  quantity: number;
  unitPriceMmk: number;
  lineTotalMmk: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class SalesOrderLineEntity {
  readonly id: string;
  readonly salesOrderId: string;
  readonly productSkuId: string;
  readonly unitId: string;
  readonly quantity: number;
  readonly unitPriceMmk: number;
  readonly lineTotalMmk: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;

  constructor(props: SalesOrderLineEntityProps) {
    Object.assign(this, props);
  }
}

export interface SalesOrderEntityProps {
  id: string;
  orderNumber: string;
  customerId: string;
  orderDate: Date;
  orderSource: OrderSource;
  takenByUserId: string | null;
  deliveryChannel: DeliveryChannel;
  customerReceiveMode: CustomerReceiveMode | null;
  status: SalesOrderStatus;
  hasSufficientStock: boolean | null;
  stockCheckNotes: string | null;
  stockCheckedAt: Date | null;
  goodsReceivedAt: Date | null;
  saleOkAt: Date | null;
  notes: string | null;
  lines: SalesOrderLineEntity[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class SalesOrderEntity {
  readonly id: string;
  readonly orderNumber: string;
  readonly customerId: string;
  readonly orderDate: Date;
  readonly orderSource: OrderSource;
  readonly takenByUserId: string | null;
  readonly deliveryChannel: DeliveryChannel;
  readonly customerReceiveMode: CustomerReceiveMode | null;
  readonly status: SalesOrderStatus;
  readonly hasSufficientStock: boolean | null;
  readonly stockCheckNotes: string | null;
  readonly stockCheckedAt: Date | null;
  readonly goodsReceivedAt: Date | null;
  readonly saleOkAt: Date | null;
  readonly notes: string | null;
  readonly lines: SalesOrderLineEntity[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;

  constructor(props: SalesOrderEntityProps) {
    Object.assign(this, props);
  }
}
