import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserEntity } from '../../../domain/entities/user.entity.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';

export async function requireActiveStaff(
  users: IUserRepository,
  userId: string,
  notFoundMessage = 'Staff user not found',
): Promise<UserEntity> {
  const user = await users.findById(userId);
  if (!user) {
    throw new NotFoundException(notFoundMessage);
  }
  if (!user.isActiveUser()) {
    throw new UnauthorizedException('Account is deactivated or suspended');
  }
  return user;
}

/** @deprecated Use requireActiveStaff */
export const requireActiveAdmin = requireActiveStaff;

export async function requireRoot(
  users: IUserRepository,
  userId: string,
): Promise<UserEntity> {
  const user = await requireActiveStaff(users, userId);
  if (!user.isRoot) {
    throw new ForbiddenException('Only root can perform this action');
  }
  return user;
}

export async function assertRootAdmin(user: UserEntity): Promise<void> {
  if (!user.isRoot) {
    throw new ForbiddenException('Only root can perform this action');
  }
}

export async function requirePermission(
  users: IUserRepository,
  userId: string,
  permission: PermissionCode | string,
): Promise<UserEntity> {
  const user = await requireActiveStaff(users, userId);
  if (user.isRoot) {
    return user;
  }
  const auth = await users.getAuthDataByUserId(userId);
  if (!auth || !auth.permissionCodes.includes(permission)) {
    throw new ForbiddenException(`Missing permission: ${permission}`);
  }
  return user;
}

/** @deprecated Use requirePermission */
export const requireAdminPermission = requirePermission;
