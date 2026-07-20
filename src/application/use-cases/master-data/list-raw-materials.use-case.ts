import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { MASTER_DATA_REPOSITORY } from '../../../domain/repositories/master-data.repository.interface.js';
import type { IMasterDataRepository } from '../../../domain/repositories/master-data.repository.interface.js';
import { requirePermission } from '../_helpers/admin-authorization.helper.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';
import { PaginatedResponseDto } from '../../dtos/common/pagination.dto.js';
import { MasterDataListQueryDto } from '../../dtos/master-data/master-data-list-update.dto.js';
import { RawMaterialResponseDto } from '../../dtos/master-data/master-data-response.dto.js';

@Injectable()
export class ListRawMaterialsUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(MASTER_DATA_REPOSITORY) private readonly repo: IMasterDataRepository,
  ) {}

  async execute(
    actorId: string,
    query: MasterDataListQueryDto,
  ): Promise<PaginatedResponseDto<RawMaterialResponseDto>> {
    await requirePermission(this.users, actorId, PermissionCode.MANAGE_MASTER_DATA);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const result = await this.repo.listRawMaterials({
      page,
      limit,
      search: query.search,
    });
    return new PaginatedResponseDto(
      result.items.map((e) => RawMaterialResponseDto.fromEntity(e)),
      result.total,
      result.page,
      result.limit,
    );
  }
}
