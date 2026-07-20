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
import { INVENTORY_REPOSITORY } from '../../../domain/repositories/inventory.repository.interface.js';
import type { IInventoryRepository } from '../../../domain/repositories/inventory.repository.interface.js';
import { BILLING_REPOSITORY } from '../../../domain/repositories/billing.repository.interface.js';
import type { IBillingRepository } from '../../../domain/repositories/billing.repository.interface.js';
import { requirePermission } from '../_helpers/admin-authorization.helper.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';
import { InventoryItemType } from '../../../domain/enums/inventory-item-type.enum.js';
import {
  allowedOutboundTransitions,
  isOutboundTransitionAllowed,
} from '../../../domain/enums/outbound-status-transitions.js';
import { OutboundStatus } from '../../../domain/enums/outbound-status.enum.js';
import { SalesOrderStatus } from '../../../domain/enums/sales-order-status.enum.js';
import { TransitionOutboundStatusDto } from '../../dtos/outbound/create-outbound.dto.js';
import { OutboundResponseDto } from '../../dtos/outbound/outbound-response.dto.js';

@Injectable()
export class TransitionOutboundStatusUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(OUTBOUND_REPOSITORY) private readonly outbound: IOutboundRepository,
    @Inject(SALES_REPOSITORY) private readonly sales: ISalesRepository,
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventory: IInventoryRepository,
    @Inject(BILLING_REPOSITORY) private readonly billing: IBillingRepository,
  ) {}

  async execute(
    actorId: string,
    outboundId: string,
    body: TransitionOutboundStatusDto,
  ): Promise<OutboundResponseDto> {
    await requirePermission(this.users, actorId, PermissionCode.MANAGE_OUTBOUND);

    const current = await this.outbound.getOutbound(outboundId);
    if (!current) throw new NotFoundException('Outbound not found');

    // Idempotent: replaying the current status is a no-op (no inventory side effects).
    if (current.status === body.toStatus) {
      return OutboundResponseDto.fromEntity(current);
    }

    if (
      !isOutboundTransitionAllowed(
        current.deliveryChannel,
        current.status,
        body.toStatus,
      )
    ) {
      const allowed = allowedOutboundTransitions(
        current.deliveryChannel,
        current.status,
      );
      throw new BadRequestException(
        `Invalid outbound transition for ${current.deliveryChannel}: ` +
          `${current.status} → ${body.toStatus}. ` +
          `Allowed: ${allowed.length ? allowed.join(', ') : '(terminal)'}`,
      );
    }

    // Fail closed before mutating outbound: receive must deplete FG at primary location.
    let stockLocationId: string | null = null;
    if (body.toStatus === OutboundStatus.RECEIVED_BY_CUSTOMER) {
      stockLocationId = await this.inventory.findPrimaryStockLocationId();
      if (!stockLocationId) {
        throw new BadRequestException(
          'No primary stock location configured — cannot receive outbound',
        );
      }
    }

    const fromStatus = current.status;
    const { entity, applied } = await this.outbound.transitionOutbound(
      outboundId,
      body.toStatus,
      body.notes,
      fromStatus,
    );

    // Lost race or already applied by peer — do not double-decrement inventory.
    if (!applied) {
      return OutboundResponseDto.fromEntity(entity);
    }

    if (
      body.toStatus === OutboundStatus.RECEIVED_BY_CUSTOMER &&
      entity.salesOrderId &&
      stockLocationId
    ) {
      const now = new Date();
      for (const line of entity.lines) {
        await this.inventory.adjustBalance({
          itemType: InventoryItemType.FINISHED_GOOD,
          productSkuId: line.productSkuId,
          unitId: line.unitId,
          delta: -line.quantity,
          asOfDate: now,
          stockLocationId,
        });
      }

      const alreadyPaid = await this.billing.isSalesOrderFullyPaid(
        entity.salesOrderId,
      );
      if (alreadyPaid) {
        await this.sales.updateOrderStatus(
          entity.salesOrderId,
          SalesOrderStatus.SALE_OK,
          { goodsReceivedAt: now, saleOkAt: now },
        );
      } else {
        const hasInvoice = await this.billing.hasActiveInvoiceForSalesOrder(
          entity.salesOrderId,
        );
        await this.sales.updateOrderStatus(
          entity.salesOrderId,
          hasInvoice
            ? SalesOrderStatus.AWAITING_PAYMENT
            : SalesOrderStatus.GOODS_RECEIVED,
          { goodsReceivedAt: now },
        );
      }
    }

    return OutboundResponseDto.fromEntity(entity);
  }
}
