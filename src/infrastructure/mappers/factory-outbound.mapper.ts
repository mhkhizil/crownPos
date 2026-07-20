import type { Prisma } from '@prisma/client';
import {
  FactoryOutboundEntity,
  FactoryOutboundLineEntity,
  OutboundStatusLogEntity,
} from '../../domain/entities/factory-outbound.entity.js';
import { CustomerReceiveMode } from '../../domain/enums/customer-receive-mode.enum.js';
import { DeliveryChannel } from '../../domain/enums/delivery-channel.enum.js';
import { OutboundStatus } from '../../domain/enums/outbound-status.enum.js';

function num(v: { toNumber?: () => number } | number | null | undefined): number {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  return Number(v);
}

type Row = Prisma.FactoryOutboundGetPayload<{
  include: { lines: true; statusLogs: true };
}>;

export class FactoryOutboundMapper {
  static toDomain(row: Row): FactoryOutboundEntity {
    return new FactoryOutboundEntity(
      row.id,
      row.outboundNumber,
      row.factoryId,
      row.salesOrderId,
      row.scheduledDate,
      row.deliveryChannel as DeliveryChannel,
      row.driverUserId,
      row.vehicleAssetId,
      row.yangonGateId,
      row.destinationGateId,
      row.customerReceiveMode as CustomerReceiveMode | null,
      row.status as OutboundStatus,
      (row.lines ?? [])
        .filter((l) => !l.deletedAt)
        .map(
          (l) =>
            new FactoryOutboundLineEntity(
              l.id,
              l.productSkuId,
              l.unitId,
              num(l.quantity),
            ),
        ),
      (row.statusLogs ?? [])
        .filter((s) => !s.deletedAt)
        .map(
          (s) =>
            new OutboundStatusLogEntity(
              s.id,
              s.fromStatus as OutboundStatus | null,
              s.toStatus as OutboundStatus,
              s.notes,
              s.changedAt,
            ),
        ),
      row.createdAt,
      row.updatedAt,
      row.deletedAt,
    );
  }
}
