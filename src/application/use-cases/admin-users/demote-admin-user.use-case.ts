import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { requireRoot } from '../_helpers/admin-authorization.helper.js';
import { AdminUserListDto } from '../../dtos/admin-users/admin-user-list.dto.js';

@Injectable()
export class DemoteAdminUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
  ) {}

  async execute(
    actorUserId: string,
    targetUserId: string,
  ): Promise<AdminUserListDto> {
    await requireRoot(this.users, actorUserId);
    const target = await this.users.findById(targetUserId);
    if (!target) throw new NotFoundException('User not found');
    if (target.isRoot) {
      throw new ForbiddenException('Cannot demote root user');
    }
    await this.users.setUserRoles(targetUserId, []);
    const auth = await this.users.getAuthDataByUserId(targetUserId);
    return AdminUserListDto.fromAuth(auth!);
  }
}
