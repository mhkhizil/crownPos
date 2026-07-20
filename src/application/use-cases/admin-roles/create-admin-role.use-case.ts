import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { ROLE_REPOSITORY } from '../../../domain/repositories/role.repository.interface.js';
import type { IRoleRepository } from '../../../domain/repositories/role.repository.interface.js';
import { requireRoot } from '../_helpers/admin-authorization.helper.js';
import { CreateAdminRoleDto } from '../../dtos/admin-roles/create-admin-role.dto.js';

@Injectable()
export class CreateAdminRoleUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(ROLE_REPOSITORY) private readonly roles: IRoleRepository,
  ) {}

  async execute(actorUserId: string, dto: CreateAdminRoleDto) {
    await requireRoot(this.users, actorUserId);
    if (!dto.permissionIds?.length) {
      throw new BadRequestException('At least one permission is required');
    }
    return this.roles.createRole({
      code: dto.code,
      nameEn: dto.nameEn,
      nameMm: dto.nameMm,
      description: dto.description,
      permissionIds: dto.permissionIds,
    });
  }
}
