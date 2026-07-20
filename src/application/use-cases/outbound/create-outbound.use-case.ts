import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { OUTBOUND_REPOSITORY } from '../../../domain/repositories/outbound.repository.interface.js';
import type { IOutboundRepository } from '../../../domain/repositories/outbound.repository.interface.js';
import { SALES_REPOSITORY } from '../../../domain/repositories/sales.repository.interface.js';
import type { ISalesRepository } from '../../../domain/repositories/sales.repository.interface.js';
import { requirePermission } from '../_helpers/admin-authorization.helper.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';
import { SalesOrderStatus } from '../../../domain/enums/sales-order-status.enum.js';
import { CreateOutboundDto } from '../../dtos/outbound/create-outbound.dto.js';
import { OutboundResponseDto } from '../../dtos/outbound/outbound-response.dto.js';

@Injectable()
export class CreateOutboundUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(OUTBOUND_REPOSITORY) private readonly outbound: IOutboundRepository,
    @Inject(SALES_REPOSITORY) private readonly sales: ISalesRepository,
  ) {}

  async execute(
    actorId: string,
    data: CreateOutboundDto,
  ): Promise<OutboundResponseDto> {
    await requirePermission(this.users, actorId, PermissionCode.MANAGE_OUTBOUND);

    const order = await this.sales.getSalesOrder(data.salesOrderId);
    if (!order) throw new NotFoundException('Sales order not found');
    if (
      order.status !== SalesOrderStatus.CONFIRMED &&
      order.status !== SalesOrderStatus.PARTIALLY_FULFILLED
    ) {
      throw new BadRequestException('Order must be CONFIRMED before outbound');
    }

    const orderQtyBySkuUnit = new Map<string, number>();
    for (const line of order.lines) {
      const key = `${line.productSkuId}:${line.unitId}`;
      orderQtyBySkuUnit.set(
        key,
        (orderQtyBySkuUnit.get(key) ?? 0) + line.quantity,
      );
    }

    const outboundQtyBySkuUnit = new Map<string, number>();
    for (const line of data.lines) {
      const key = `${line.productSkuId}:${line.unitId}`;
      outboundQtyBySkuUnit.set(
        key,
        (outboundQtyBySkuUnit.get(key) ?? 0) + line.quantity,
      );
    }

    for (const [key, qty] of outboundQtyBySkuUnit) {
      const ordered = orderQtyBySkuUnit.get(key);
      if (ordered == null) {
        throw new BadRequestException(
          `Outbound line ${key} is not on the sales order`,
        );
      }
      if (qty > ordered + 1e-9) {
        throw new BadRequestException(
          `Outbound qty ${qty} exceeds order qty ${ordered} for ${key}`,
        );
      }
    }

    const entity = await this.outbound.createOutbound({
      factoryId: data.factoryId,
      salesOrderId: data.salesOrderId,
      scheduledDate: data.scheduledDate,
      deliveryChannel: data.deliveryChannel,
      driverUserId: data.driverUserId,
      vehicleAssetId: data.vehicleAssetId,
      yangonGateId: data.yangonGateId,
      destinationGateId: data.destinationGateId,
      customerReceiveMode: data.customerReceiveMode,
      lines: data.lines,
    });
    return OutboundResponseDto.fromEntity(entity);
  }
}
