import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { INVENTORY_REPOSITORY } from '../../../domain/repositories/inventory.repository.interface.js';
import type { IInventoryRepository } from '../../../domain/repositories/inventory.repository.interface.js';
import { requirePermission } from '../_helpers/admin-authorization.helper.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';
import { RecordDailyStockCountDto } from '../../dtos/inventory/record-daily-stock-count.dto.js';
import { DailyStockCountResponseDto } from '../../dtos/inventory/inventory-response.dto.js';

@Injectable()
export class RecordDailyStockCountUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(INVENTORY_REPOSITORY) private readonly repo: IInventoryRepository,
  ) {}

  async execute(
    actorId: string,
    data: RecordDailyStockCountDto,
  ): Promise<DailyStockCountResponseDto> {
    await requirePermission(
      this.users,
      actorId,
      PermissionCode.MANAGE_INVENTORY,
    );
    const entity = await this.repo.recordDailyStockCount(data);
    return DailyStockCountResponseDto.fromEntity(entity);
  }
}
