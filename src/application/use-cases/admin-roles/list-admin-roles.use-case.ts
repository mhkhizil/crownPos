import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { ROLE_REPOSITORY } from '../../../domain/repositories/role.repository.interface.js';
import type { IRoleRepository } from '../../../domain/repositories/role.repository.interface.js';
import { requirePermission } from '../_helpers/admin-authorization.helper.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';

@Injectable()
export class ListAdminRolesUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(ROLE_REPOSITORY) private readonly roles: IRoleRepository,
  ) {}

  async execute(actorUserId: string) {
    await requirePermission(this.users, actorUserId, PermissionCode.MANAGE_ROLES);
    return this.roles.listRoles();
  }
}
