import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { PURCHASE_REPOSITORY } from '../../../domain/repositories/purchase.repository.interface.js';
import type { IPurchaseRepository } from '../../../domain/repositories/purchase.repository.interface.js';
import { requirePermission } from '../_helpers/admin-authorization.helper.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';
import { PurchaseOrderResponseDto } from '../../dtos/purchases/purchase-order.dto.js';

@Injectable()
export class ListPurchaseOrdersUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(PURCHASE_REPOSITORY) private readonly purchases: IPurchaseRepository,
  ) {}

  async execute(actorId: string): Promise<PurchaseOrderResponseDto[]> {
    await requirePermission(
      this.users,
      actorId,
      PermissionCode.MANAGE_INVENTORY,
    );
    const rows = await this.purchases.listPurchaseOrders();
    return rows.map(PurchaseOrderResponseDto.fromEntity);
  }
}

@Injectable()
export class GetPurchaseOrderUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(PURCHASE_REPOSITORY) private readonly purchases: IPurchaseRepository,
  ) {}

  async execute(
    actorId: string,
    id: string,
  ): Promise<PurchaseOrderResponseDto> {
    await requirePermission(
      this.users,
      actorId,
      PermissionCode.MANAGE_INVENTORY,
    );
    const row = await this.purchases.getPurchaseOrder(id);
    if (!row) throw new NotFoundException('Purchase order not found');
    return PurchaseOrderResponseDto.fromEntity(row);
  }
}

@Injectable()
export class CancelPurchaseOrderUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(PURCHASE_REPOSITORY) private readonly purchases: IPurchaseRepository,
  ) {}

  async execute(
    actorId: string,
    id: string,
  ): Promise<PurchaseOrderResponseDto> {
    await requirePermission(
      this.users,
      actorId,
      PermissionCode.MANAGE_INVENTORY,
    );
    const row = await this.purchases.cancelPurchaseOrder(id);
    return PurchaseOrderResponseDto.fromEntity(row);
  }
}
