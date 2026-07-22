import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { PURCHASE_REPOSITORY } from '../../../domain/repositories/purchase.repository.interface.js';
import type { IPurchaseRepository } from '../../../domain/repositories/purchase.repository.interface.js';
import { requirePermission } from '../_helpers/admin-authorization.helper.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';
import {
  PurchaseOrderResponseDto,
  RecordPurchasePaymentDto,
  SupplierPayablesResponseDto,
} from '../../dtos/purchases/purchase-order.dto.js';

@Injectable()
export class RecordPurchasePaymentUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(PURCHASE_REPOSITORY) private readonly purchases: IPurchaseRepository,
  ) {}

  async execute(
    actorId: string,
    purchaseOrderId: string,
    body: RecordPurchasePaymentDto,
  ): Promise<PurchaseOrderResponseDto> {
    await requirePermission(this.users, actorId, PermissionCode.MANAGE_INVENTORY);
    const row = await this.purchases.recordPurchasePayment({
      purchaseOrderId,
      amountMmk: body.amountMmk,
    });
    return PurchaseOrderResponseDto.fromEntity(row);
  }
}

@Injectable()
export class GetSupplierPayablesUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(PURCHASE_REPOSITORY) private readonly purchases: IPurchaseRepository,
  ) {}

  async execute(
    actorId: string,
    supplierId: string,
  ): Promise<SupplierPayablesResponseDto> {
    await requirePermission(this.users, actorId, PermissionCode.MANAGE_INVENTORY);
    const summary = await this.purchases.getSupplierPayables(supplierId);
    return SupplierPayablesResponseDto.fromSummary(summary);
  }
}
