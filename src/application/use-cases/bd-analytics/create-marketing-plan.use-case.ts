import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { BD_ANALYTICS_REPOSITORY } from '../../../domain/repositories/bd-analytics.repository.interface.js';
import type { IBdAnalyticsRepository } from '../../../domain/repositories/bd-analytics.repository.interface.js';
import { CreateMarketingPlanDto } from '../../dtos/bd-analytics/bd-analytics.dto.js';
import { MarketingPlanResponseDto } from '../../dtos/bd-analytics/bd-analytics.dto.js';
import { requirePermission } from '../_helpers/admin-authorization.helper.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';

@Injectable()
export class CreateMarketingPlanUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(BD_ANALYTICS_REPOSITORY) private readonly repo: IBdAnalyticsRepository,
  ) {}

  async execute(actorId: string, data: CreateMarketingPlanDto): Promise<MarketingPlanResponseDto> {
    await requirePermission(this.users, actorId, PermissionCode.MANAGE_BD);
    return MarketingPlanResponseDto.fromEntity(
      await this.repo.createMarketingPlan({
        companyId: data.companyId,
        code: data.code,
        nameEn: data.nameEn,
        nameMm: data.nameMm,
        startDate: data.startDate,
        endDate: data.endDate,
        budgetMmk: data.budgetMmk,
        objectivesEn: data.objectivesEn,
      }),
    );
  }
}
