import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { requireRoot } from '../_helpers/admin-authorization.helper.js';
import { AdminUserListDto } from '../../dtos/admin-users/admin-user-list.dto.js';

@Injectable()
export class ListAdminUsersUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
  ) {}

  async execute(actorUserId: string): Promise<AdminUserListDto[]> {
    await requireRoot(this.users, actorUserId);
    const staff = await this.users.listStaff();
    const result: AdminUserListDto[] = [];
    for (const u of staff) {
      const auth = await this.users.getAuthDataByUserId(u.id);
      if (auth) result.push(AdminUserListDto.fromAuth(auth));
    }
    return result;
  }
}
