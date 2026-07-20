import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { BD_ANALYTICS_REPOSITORY } from '../../../domain/repositories/bd-analytics.repository.interface.js';
import type { IBdAnalyticsRepository } from '../../../domain/repositories/bd-analytics.repository.interface.js';
import { CreateDigitalAssetDto } from '../../dtos/bd-analytics/bd-analytics.dto.js';
import { DigitalAssetResponseDto } from '../../dtos/bd-analytics/bd-analytics.dto.js';
import { requirePermission } from '../_helpers/admin-authorization.helper.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';

@Injectable()
export class CreateDigitalAssetUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(BD_ANALYTICS_REPOSITORY) private readonly repo: IBdAnalyticsRepository,
  ) {}

  async execute(actorId: string, data: CreateDigitalAssetDto): Promise<DigitalAssetResponseDto> {
    await requirePermission(this.users, actorId, PermissionCode.MANAGE_BD);
    return DigitalAssetResponseDto.fromEntity(
      await this.repo.createDigitalAsset({
        companyId: data.companyId,
        assetType: data.assetType,
        nameEn: data.nameEn,
        nameMm: data.nameMm,
        url: data.url,
      }),
    );
  }
}
