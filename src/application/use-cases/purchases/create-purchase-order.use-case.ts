import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { PURCHASE_REPOSITORY } from '../../../domain/repositories/purchase.repository.interface.js';
import type { IPurchaseRepository } from '../../../domain/repositories/purchase.repository.interface.js';
import { requirePermission } from '../_helpers/admin-authorization.helper.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';
import { PurchaseStatus } from '../../../domain/enums/purchase-status.enum.js';
import {
  CreatePurchaseOrderDto,
  PurchaseOrderResponseDto,
} from '../../dtos/purchases/purchase-order.dto.js';
import { ReceivePurchaseOrderUseCase } from './receive-purchase-order.use-case.js';

@Injectable()
export class CreatePurchaseOrderUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(PURCHASE_REPOSITORY) private readonly purchases: IPurchaseRepository,
    private readonly receivePurchase: ReceivePurchaseOrderUseCase,
  ) {}

  async execute(
    actorId: string,
    data: CreatePurchaseOrderDto,
  ): Promise<PurchaseOrderResponseDto> {
    await requirePermission(
      this.users,
      actorId,
      PermissionCode.MANAGE_INVENTORY,
    );

    const created = await this.purchases.createPurchaseOrder({
      factoryId: data.factoryId,
      supplierId: data.supplierId,
      orderDate: data.orderDate,
      notes: data.notes,
      status: PurchaseStatus.ORDERED,
      lines: data.lines.map((l) => ({
        rawMaterialId: l.rawMaterialId,
        unitId: l.unitId,
        quantityOrdered: l.quantityOrdered,
        unitPriceMmk: l.unitPriceMmk,
      })),
    });

    if (!data.receiveImmediately) {
      return PurchaseOrderResponseDto.fromEntity(created);
    }

    return this.receivePurchase.execute(actorId, created.id, {
      stockLocationId: data.stockLocationId,
      lines: created.lines.map((l) => ({
        purchaseOrderLineId: l.id,
        quantityReceived: l.quantityOrdered,
      })),
    });
  }
}
