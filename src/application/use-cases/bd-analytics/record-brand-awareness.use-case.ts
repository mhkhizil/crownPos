import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { BD_ANALYTICS_REPOSITORY } from '../../../domain/repositories/bd-analytics.repository.interface.js';
import type { IBdAnalyticsRepository } from '../../../domain/repositories/bd-analytics.repository.interface.js';
import { BrandAwarenessDto } from '../../dtos/bd-analytics/bd-analytics.dto.js';
import { BrandAwarenessResponseDto } from '../../dtos/bd-analytics/bd-analytics.dto.js';
import { requirePermission } from '../_helpers/admin-authorization.helper.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';

@Injectable()
export class RecordBrandAwarenessUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(BD_ANALYTICS_REPOSITORY) private readonly repo: IBdAnalyticsRepository,
  ) {}

  async execute(actorId: string, data: BrandAwarenessDto): Promise<BrandAwarenessResponseDto> {
    await requirePermission(this.users, actorId, PermissionCode.MANAGE_BD);
    return BrandAwarenessResponseDto.fromEntity(
      await this.repo.recordBrandAwareness({
        brandId: data.brandId,
        campaignId: data.campaignId,
        recordDate: data.recordDate,
        metricKey: data.metricKey,
        metricValue: data.metricValue,
        source: data.source,
      }),
    );
  }
}
