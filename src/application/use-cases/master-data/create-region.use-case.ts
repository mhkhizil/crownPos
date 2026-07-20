import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { MASTER_DATA_REPOSITORY } from '../../../domain/repositories/master-data.repository.interface.js';
import type { IMasterDataRepository } from '../../../domain/repositories/master-data.repository.interface.js';
import { requirePermission } from '../_helpers/admin-authorization.helper.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';
import { CreateNamedCodeDto } from '../../dtos/master-data/master-data-request.dto.js';
import { NamedCodeResponseDto } from '../../dtos/master-data/master-data-response.dto.js';

@Injectable()
export class CreateRegionUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(MASTER_DATA_REPOSITORY) private readonly repo: IMasterDataRepository,
  ) {}

  async execute(actorId: string, data: CreateNamedCodeDto): Promise<NamedCodeResponseDto> {
    await requirePermission(this.users, actorId, PermissionCode.MANAGE_MASTER_DATA);
    return NamedCodeResponseDto.fromEntity(await this.repo.createRegion(data));
  }
}
