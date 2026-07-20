import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { hash } from 'bcrypt';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { requireRoot } from '../_helpers/admin-authorization.helper.js';
import { CreateAdminUserDto } from '../../dtos/admin-users/create-admin-user.dto.js';
import { AdminUserListDto } from '../../dtos/admin-users/admin-user-list.dto.js';
import { normalizeEmail } from '../../../common/utils/normalize-email.js';

@Injectable()
export class CreateAdminUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
  ) {}

  async execute(
    actorUserId: string,
    dto: CreateAdminUserDto,
  ): Promise<AdminUserListDto> {
    await requireRoot(this.users, actorUserId);
    const email = normalizeEmail(dto.email);
    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new ConflictException('Email already in use');
    }
    const passwordHash = await hash(dto.password, 10);
    const user = await this.users.create({
      email,
      passwordHash,
      nameEn: dto.nameEn,
      nameMm: dto.nameMm,
      phone: dto.phone,
    });
    if (dto.roleIds?.length) {
      await this.users.setUserRoles(user.id, dto.roleIds);
    }
    const auth = await this.users.getAuthDataByUserId(user.id);
    return AdminUserListDto.fromAuth(auth!);
  }
}
