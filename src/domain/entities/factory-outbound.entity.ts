import type { CustomerReceiveMode } from '../enums/customer-receive-mode.enum.js';
import type { DeliveryChannel } from '../enums/delivery-channel.enum.js';
import type { OutboundStatus } from '../enums/outbound-status.enum.js';

export class FactoryOutboundLineEntity {
  constructor(
    public readonly id: string,
    public readonly productSkuId: string,
    public readonly unitId: string,
    public readonly quantity: number,
  ) {}
}

export class OutboundStatusLogEntity {
  constructor(
    public readonly id: string,
    public readonly fromStatus: OutboundStatus | null,
    public readonly toStatus: OutboundStatus,
    public readonly notes: string | null,
    public readonly changedAt: Date,
  ) {}
}

export class FactoryOutboundEntity {
  constructor(
    public readonly id: string,
    public readonly outboundNumber: string,
    public readonly factoryId: string,
    public readonly salesOrderId: string | null,
    public readonly scheduledDate: Date,
    public readonly deliveryChannel: DeliveryChannel,
    public readonly driverUserId: string | null,
    public readonly vehicleAssetId: string | null,
    public readonly yangonGateId: string | null,
    public readonly destinationGateId: string | null,
    public readonly customerReceiveMode: CustomerReceiveMode | null,
    public readonly status: OutboundStatus,
    public readonly lines: FactoryOutboundLineEntity[],
    public readonly statusLogs: OutboundStatusLogEntity[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}
