import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { INVENTORY_REPOSITORY } from '../../../domain/repositories/inventory.repository.interface.js';
import type { IInventoryRepository } from '../../../domain/repositories/inventory.repository.interface.js';
import { requirePermission } from '../_helpers/admin-authorization.helper.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';
import { InventoryBalanceResponseDto } from '../../dtos/inventory/inventory-response.dto.js';

@Injectable()
export class ListInventoryBalancesUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(INVENTORY_REPOSITORY) private readonly repo: IInventoryRepository,
  ) {}

  async execute(
    actorId: string,
    stockLocationId?: string,
  ): Promise<InventoryBalanceResponseDto[]> {
    await requirePermission(
      this.users,
      actorId,
      PermissionCode.MANAGE_INVENTORY,
    );
    const rows = await this.repo.listInventoryBalances(stockLocationId);
    return rows.map((e) => InventoryBalanceResponseDto.fromEntity(e));
  }
}
