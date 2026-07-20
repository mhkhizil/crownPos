import type { User } from '@prisma/client';
import { UserEntity } from '../../domain/entities/user.entity.js';
import { UserStatus } from '../../domain/enums/user-status.enum.js';

export class UserMapper {
  static toDomain(user: User): UserEntity {
    return new UserEntity({
      id: user.id,
      companyId: user.companyId,
      email: user.email,
      passwordHash: user.passwordHash,
      nameEn: user.nameEn,
      nameMm: user.nameMm,
      phone: user.phone,
      isRoot: user.isRoot,
      status: user.status as UserStatus,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
    });
  }
}
