import type { FactoryOutboundEntity } from '../entities/factory-outbound.entity.js';
import type { CustomerReceiveMode } from '../enums/customer-receive-mode.enum.js';
import type { DeliveryChannel } from '../enums/delivery-channel.enum.js';
import type { OutboundStatus } from '../enums/outbound-status.enum.js';

export const OUTBOUND_REPOSITORY = Symbol('OUTBOUND_REPOSITORY');

export interface OutboundLineInput {
  productSkuId: string;
  unitId: string;
  quantity: number;
}

export interface CreateOutboundInput {
  factoryId: string;
  salesOrderId: string;
  scheduledDate: string;
  deliveryChannel: DeliveryChannel;
  driverUserId?: string;
  vehicleAssetId?: string;
  yangonGateId?: string;
  destinationGateId?: string;
  customerReceiveMode?: CustomerReceiveMode;
  lines: OutboundLineInput[];
}

export interface TransitionOutboundResult {
  entity: FactoryOutboundEntity;
  /**
   * True when this call changed status.
   * False when already at target or lost a concurrent race (idempotent no-op).
   */
  applied: boolean;
}

export interface IOutboundRepository {
  createOutbound(data: CreateOutboundInput): Promise<FactoryOutboundEntity>;
  getOutbound(id: string): Promise<FactoryOutboundEntity | null>;
  transitionOutbound(
    outboundId: string,
    toStatus: OutboundStatus,
    notes?: string,
    /** When set, update only if current status still matches (concurrency-safe). */
    expectedFromStatus?: OutboundStatus,
  ): Promise<TransitionOutboundResult>;
  listOutbounds(): Promise<FactoryOutboundEntity[]>;
}
