import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { BILLING_REPOSITORY } from '../../../domain/repositories/billing.repository.interface.js';
import type { IBillingRepository } from '../../../domain/repositories/billing.repository.interface.js';
import { SALES_REPOSITORY } from '../../../domain/repositories/sales.repository.interface.js';
import type { ISalesRepository } from '../../../domain/repositories/sales.repository.interface.js';
import { requirePermission } from '../_helpers/admin-authorization.helper.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';
import { SalesOrderStatus } from '../../../domain/enums/sales-order-status.enum.js';
import type { SalesOrderEntity } from '../../../domain/entities/sales-order.entity.js';
import { RecordPaymentDto } from '../../dtos/billing/billing-request.dto.js';
import { PaymentResponseDto } from '../../dtos/billing/billing-response.dto.js';

/** SALE_OK / payment status updates only after goods are received. */
function goodsHaveBeenReceived(order: SalesOrderEntity): boolean {
  return (
    order.goodsReceivedAt != null ||
    order.status === SalesOrderStatus.AWAITING_PAYMENT ||
    order.status === SalesOrderStatus.GOODS_RECEIVED
  );
}

@Injectable()
export class RecordPaymentUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(BILLING_REPOSITORY) private readonly billing: IBillingRepository,
    @Inject(SALES_REPOSITORY) private readonly sales: ISalesRepository,
  ) {}

  async execute(
    actorId: string,
    data: RecordPaymentDto,
  ): Promise<PaymentResponseDto> {
    await requirePermission(this.users, actorId, PermissionCode.MANAGE_BILLING);

    const { payment, invoiceEffects } = await this.billing.recordPayment({
      paymentDate: data.paymentDate,
      method: data.method,
      amountMmk: data.amountMmk,
      bankName: data.bankName,
      bankReference: data.bankReference,
      allocations: data.allocations,
    });

    const now = new Date();
    const touchedOrderIds = new Set<string>();
    for (const effect of invoiceEffects) {
      if (!effect.salesOrderId) continue;
      if (touchedOrderIds.has(effect.salesOrderId)) continue;
      touchedOrderIds.add(effect.salesOrderId);

      const order = await this.sales.getSalesOrder(effect.salesOrderId);
      if (!order || !goodsHaveBeenReceived(order)) {
        // Payment may be recorded early; do not close (or advance) sale until receive.
        continue;
      }
      // Never regress a closed sale (e.g. partial pay on a sibling invoice).
      if (order.status === SalesOrderStatus.SALE_OK) continue;

      // Close only when every active invoice for the order is PAID (not just this one).
      const fullyPaid = await this.billing.isSalesOrderFullyPaid(
        effect.salesOrderId,
      );
      if (fullyPaid) {
        await this.sales.updateOrderStatus(
          effect.salesOrderId,
          SalesOrderStatus.SALE_OK,
          { saleOkAt: now },
        );
      } else {
        await this.sales.updateOrderStatus(
          effect.salesOrderId,
          SalesOrderStatus.AWAITING_PAYMENT,
        );
      }
    }

    return PaymentResponseDto.fromEntity(payment);
  }
}
