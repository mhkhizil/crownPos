import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { PRODUCTION_REPOSITORY } from '../../../domain/repositories/production.repository.interface.js';
import type { IProductionRepository } from '../../../domain/repositories/production.repository.interface.js';
import { requirePermission } from '../_helpers/admin-authorization.helper.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';
import { ProductionDayResponseDto } from '../../dtos/production/production-day-response.dto.js';

@Injectable()
export class ListProductionDaysUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(PRODUCTION_REPOSITORY) private readonly repo: IProductionRepository,
  ) {}

  async execute(
    actorId: string,
    factoryId?: string,
  ): Promise<ProductionDayResponseDto[]> {
    await requirePermission(
      this.users,
      actorId,
      PermissionCode.MANAGE_PRODUCTION,
    );
    const rows = await this.repo.listProductionDays(factoryId);
    return rows.map((e) => ProductionDayResponseDto.fromEntity(e));
  }
}
