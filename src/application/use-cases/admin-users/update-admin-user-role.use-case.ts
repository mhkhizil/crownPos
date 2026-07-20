import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { requireRoot } from '../_helpers/admin-authorization.helper.js';
import { UpdateAdminUserRoleDto } from '../../dtos/admin-users/update-admin-user-role.dto.js';
import { AdminUserListDto } from '../../dtos/admin-users/admin-user-list.dto.js';

@Injectable()
export class UpdateAdminUserRoleUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
  ) {}

  async execute(
    actorUserId: string,
    targetUserId: string,
    dto: UpdateAdminUserRoleDto,
  ): Promise<AdminUserListDto> {
    await requireRoot(this.users, actorUserId);
    const target = await this.users.findById(targetUserId);
    if (!target) throw new NotFoundException('User not found');
    await this.users.setUserRoles(targetUserId, dto.roleIds);
    const auth = await this.users.getAuthDataByUserId(targetUserId);
    return AdminUserListDto.fromAuth(auth!);
  }
}
