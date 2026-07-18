import type { User as PrismaUser } from '@prisma/client';
import { UserEntity } from '../../domain/entities/user.entity.js';

export class UserMapper {
  static toDomain(prismaUser: PrismaUser): UserEntity {
    return new UserEntity({
      id: prismaUser.id,
      phone: prismaUser.phone,
      email: prismaUser.email,
      password: prismaUser.password,
      nickname: prismaUser.nickname,
      avatar: prismaUser.avatar,
      isEmailVerified: prismaUser.isEmailVerified,
      isPhoneVerified: prismaUser.isPhoneVerified,
      emailVerifiedAt: prismaUser.emailVerifiedAt,
      phoneVerifiedAt: prismaUser.phoneVerifiedAt,
      isActive: prismaUser.isActive,
      isBanned: prismaUser.isBanned,
      adminRoleId: prismaUser.adminRoleId,
      authTokenVersion: prismaUser.authTokenVersion,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    });
  }

  static toPersistence(entity: Partial<UserEntity>): Partial<PrismaUser> {
    const data: Partial<PrismaUser> = {};
    if (entity.email !== undefined) data.email = entity.email;
    if (entity.password !== undefined) data.password = entity.password;
    if (entity.nickname !== undefined) data.nickname = entity.nickname;
    if (entity.phone !== undefined) data.phone = entity.phone;
    if (entity.avatar !== undefined) data.avatar = entity.avatar;
    if (entity.isActive !== undefined) data.isActive = entity.isActive;
    if (entity.phoneVerifiedAt !== undefined)
      data.phoneVerifiedAt = entity.phoneVerifiedAt;
    if (entity.emailVerifiedAt !== undefined)
      data.emailVerifiedAt = entity.emailVerifiedAt;
    if (entity.authTokenVersion !== undefined)
      data.authTokenVersion = entity.authTokenVersion;
    return data;
  }
}
