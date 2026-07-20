import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { BD_ANALYTICS_REPOSITORY } from '../../../domain/repositories/bd-analytics.repository.interface.js';
import type { IBdAnalyticsRepository } from '../../../domain/repositories/bd-analytics.repository.interface.js';
import { CreateCampaignDto } from '../../dtos/bd-analytics/bd-analytics.dto.js';
import { CampaignResponseDto } from '../../dtos/bd-analytics/bd-analytics.dto.js';
import { requirePermission } from '../_helpers/admin-authorization.helper.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';

@Injectable()
export class CreateCampaignUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(BD_ANALYTICS_REPOSITORY) private readonly repo: IBdAnalyticsRepository,
  ) {}

  async execute(actorId: string, data: CreateCampaignDto): Promise<CampaignResponseDto> {
    await requirePermission(this.users, actorId, PermissionCode.MANAGE_BD);
    return CampaignResponseDto.fromEntity(
      await this.repo.createCampaign({
        marketingPlanId: data.marketingPlanId,
        brandId: data.brandId,
        code: data.code,
        nameEn: data.nameEn,
        startDate: data.startDate,
        channel: data.channel,
        spendMmk: data.spendMmk,
      }),
    );
  }
}
