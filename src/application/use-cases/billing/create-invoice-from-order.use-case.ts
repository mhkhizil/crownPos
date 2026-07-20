import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { BILLING_REPOSITORY } from '../../../domain/repositories/billing.repository.interface.js';
import type { IBillingRepository } from '../../../domain/repositories/billing.repository.interface.js';
import { SALES_REPOSITORY } from '../../../domain/repositories/sales.repository.interface.js';
import type { ISalesRepository } from '../../../domain/repositories/sales.repository.interface.js';
import { requirePermission } from '../_helpers/admin-authorization.helper.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';
import { SalesOrderStatus } from '../../../domain/enums/sales-order-status.enum.js';
import { InvoiceResponseDto } from '../../dtos/billing/billing-response.dto.js';

const INVOICEABLE_STATUSES = new Set<SalesOrderStatus>([
  SalesOrderStatus.CONFIRMED,
  SalesOrderStatus.GOODS_RECEIVED,
  SalesOrderStatus.AWAITING_PAYMENT,
]);

@Injectable()
export class CreateInvoiceFromOrderUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(BILLING_REPOSITORY) private readonly repo: IBillingRepository,
    @Inject(SALES_REPOSITORY) private readonly sales: ISalesRepository,
  ) {}

  async execute(
    actorId: string,
    salesOrderId: string,
    dueDate?: string,
  ): Promise<InvoiceResponseDto> {
    await requirePermission(this.users, actorId, PermissionCode.MANAGE_BILLING);

    const order = await this.sales.getSalesOrder(salesOrderId);
    if (!order) throw new NotFoundException('Sales order not found');

    if (!INVOICEABLE_STATUSES.has(order.status)) {
      throw new BadRequestException(
        `Cannot create invoice for order in status ${order.status}`,
      );
    }

    const hasInvoice =
      await this.repo.hasActiveInvoiceForSalesOrder(salesOrderId);
    if (hasInvoice) {
      throw new ConflictException(
        'Sales order already has an active invoice',
      );
    }

    const invoice = await this.repo.createInvoiceFromOrder(
      salesOrderId,
      dueDate,
    );

    // Issuing an invoice starts collection: GOODS_RECEIVED → AWAITING_PAYMENT.
    if (order.status === SalesOrderStatus.GOODS_RECEIVED) {
      await this.sales.updateOrderStatus(
        salesOrderId,
        SalesOrderStatus.AWAITING_PAYMENT,
      );
    }

    return InvoiceResponseDto.fromEntity(invoice);
  }
}
