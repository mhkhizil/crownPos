import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import {
  newOutboundNumber,
  toDateOnly,
  toDecimal,
} from './_prisma-helpers.js';
import { FactoryOutboundMapper } from '../mappers/factory-outbound.mapper.js';
import { OutboundStatus } from '../../domain/enums/outbound-status.enum.js';
import type {
  CreateOutboundInput,
  IOutboundRepository,
  TransitionOutboundResult,
} from '../../domain/repositories/outbound.repository.interface.js';
import type { FactoryOutboundEntity } from '../../domain/entities/factory-outbound.entity.js';

@Injectable()
export class OutboundRepository implements IOutboundRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createOutbound(
    data: CreateOutboundInput,
  ): Promise<FactoryOutboundEntity> {
    const row = await this.prisma.factoryOutbound.create({
      data: {
        outboundNumber: newOutboundNumber(),
        factoryId: data.factoryId,
        salesOrderId: data.salesOrderId,
        scheduledDate: toDateOnly(data.scheduledDate),
        outboundDate: toDateOnly(data.scheduledDate),
        deliveryChannel: data.deliveryChannel,
        driverUserId: data.driverUserId ?? null,
        vehicleAssetId: data.vehicleAssetId ?? null,
        yangonGateId: data.yangonGateId ?? null,
        destinationGateId: data.destinationGateId ?? null,
        customerReceiveMode: data.customerReceiveMode ?? null,
        status: OutboundStatus.READY_AT_FACTORY,
        lines: {
          create: data.lines.map((l) => ({
            productSkuId: l.productSkuId,
            unitId: l.unitId,
            quantity: toDecimal(l.quantity),
          })),
        },
        statusLogs: {
          create: {
            toStatus: OutboundStatus.READY_AT_FACTORY,
            notes: 'Outbound created',
          },
        },
      },
      include: { lines: true, statusLogs: true },
    });
    return FactoryOutboundMapper.toDomain(row);
  }

  async getOutbound(id: string): Promise<FactoryOutboundEntity | null> {
    const row = await this.prisma.factoryOutbound.findFirst({
      where: { id, deletedAt: null },
      include: {
        lines: { where: { deletedAt: null } },
        statusLogs: {
          where: { deletedAt: null },
          orderBy: { changedAt: 'asc' },
        },
      },
    });
    return row ? FactoryOutboundMapper.toDomain(row) : null;
  }

  async transitionOutbound(
    outboundId: string,
    toStatus: OutboundStatus,
    notes?: string,
    expectedFromStatus?: OutboundStatus,
  ): Promise<TransitionOutboundResult> {
    const outbound = await this.prisma.factoryOutbound.findFirst({
      where: { id: outboundId, deletedAt: null },
      include: {
        lines: { where: { deletedAt: null } },
        statusLogs: {
          where: { deletedAt: null },
          orderBy: { changedAt: 'asc' },
        },
      },
    });
    if (!outbound) throw new NotFoundException('Outbound not found');

    if (outbound.status === toStatus) {
      return {
        entity: FactoryOutboundMapper.toDomain(outbound),
        applied: false,
      };
    }

    if (
      expectedFromStatus != null &&
      outbound.status !== expectedFromStatus
    ) {
      const refreshed = await this.getOutbound(outboundId);
      if (refreshed?.status === toStatus) {
        return { entity: refreshed, applied: false };
      }
      throw new BadRequestException('Outbound status changed concurrently');
    }

    const now = new Date();
    const stamp: Record<string, Date> = {};
    if (toStatus === OutboundStatus.SENT_TO_YANGON_GATE) {
      stamp.arrivedYangonGateAt = now;
    }
    if (toStatus === OutboundStatus.IN_TRANSIT) stamp.inTransitAt = now;
    if (toStatus === OutboundStatus.AT_DESTINATION_GATE) {
      stamp.arrivedDestinationAt = now;
    }
    if (toStatus === OutboundStatus.RECEIVED_BY_CUSTOMER) {
      stamp.receivedByCustomerAt = now;
    }
    if (
      toStatus === OutboundStatus.SENT_TO_YANGON_GATE ||
      toStatus === OutboundStatus.RECEIVED_BY_CUSTOMER
    ) {
      stamp.departedFactoryAt = outbound.departedFactoryAt ?? now;
    }

    const fromStatus = outbound.status;

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.factoryOutbound.updateMany({
        where: {
          id: outboundId,
          status: fromStatus,
          deletedAt: null,
        },
        data: {
          status: toStatus,
          ...stamp,
        },
      });

      if (updated.count === 0) {
        return null;
      }

      await tx.outboundStatusLog.create({
        data: {
          factoryOutboundId: outboundId,
          fromStatus,
          toStatus,
          notes: notes ?? null,
        },
      });

      return tx.factoryOutbound.findFirst({
        where: { id: outboundId, deletedAt: null },
        include: {
          lines: { where: { deletedAt: null } },
          statusLogs: {
            where: { deletedAt: null },
            orderBy: { changedAt: 'asc' },
          },
        },
      });
    });

    if (!result) {
      const again = await this.getOutbound(outboundId);
      if (again?.status === toStatus) {
        return { entity: again, applied: false };
      }
      throw new BadRequestException('Outbound status changed concurrently');
    }

    return {
      entity: FactoryOutboundMapper.toDomain(result),
      applied: true,
    };
  }

  async listOutbounds(): Promise<FactoryOutboundEntity[]> {
    const rows = await this.prisma.factoryOutbound.findMany({
      where: { deletedAt: null },
      include: {
        lines: { where: { deletedAt: null } },
        statusLogs: {
          where: { deletedAt: null },
          orderBy: { changedAt: 'asc' },
        },
      },
      orderBy: { scheduledDate: 'desc' },
    });
    return rows.map((r) => FactoryOutboundMapper.toDomain(r));
  }
}
