import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { UserMapper } from '../mappers/user.mapper.js';
import { UserEntity } from '../../domain/entities/user.entity.js';
import type {
  CreateStaffUserData,
  IUserRepository,
  UpdateStaffUserData,
  UserAuthData,
} from '../../domain/repositories/user.repository.interface.js';
import { UserStatus } from '../../domain/enums/user-status.enum.js';
import { normalizeEmail } from '../../common/utils/normalize-email.js';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateStaffUserData): Promise<UserEntity> {
    const user = await this.prisma.user.create({
      data: {
        email: normalizeEmail(data.email),
        passwordHash: data.passwordHash,
        nameEn: data.nameEn,
        nameMm: data.nameMm ?? null,
        phone: data.phone ?? null,
        companyId: data.companyId ?? null,
        isRoot: data.isRoot ?? false,
        status: data.status ?? UserStatus.ACTIVE,
      },
    });
    return UserMapper.toDomain(user);
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    return user ? UserMapper.toDomain(user) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findFirst({
      where: { email: normalizeEmail(email), deletedAt: null },
    });
    return user ? UserMapper.toDomain(user) : null;
  }

  async listStaff(): Promise<UserEntity[]> {
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
    return users.map((u) => UserMapper.toDomain(u));
  }

  async update(id: string, data: UpdateStaffUserData): Promise<UserEntity> {
    const payload: UpdateStaffUserData = { ...data };
    if (typeof payload.email === 'string') {
      payload.email = normalizeEmail(payload.email);
    }
    const user = await this.prisma.user.update({
      where: { id },
      data: payload,
    });
    return UserMapper.toDomain(user);
  }

  async softDelete(id: string): Promise<UserEntity> {
    const user = await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), status: UserStatus.INACTIVE },
    });
    return UserMapper.toDomain(user);
  }

  async getAuthDataByUserId(userId: string): Promise<UserAuthData | null> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        userRoles: {
          where: { deletedAt: null },
          include: {
            role: {
              include: {
                rolePermissions: {
                  where: { deletedAt: null },
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });
    if (!user) return null;

    const roles = user.userRoles
      .filter((ur) => ur.role.deletedAt === null)
      .map((ur) => {
        const permissionCodes = ur.role.rolePermissions
          .filter((rp) => rp.permission.deletedAt === null)
          .map((rp) => rp.permission.code);
        return {
          id: ur.role.id,
          code: ur.role.code,
          nameEn: ur.role.nameEn,
          isSystem: ur.role.isSystem,
          permissions: permissionCodes,
        };
      });

    const permissionCodes = [...new Set(roles.flatMap((r) => r.permissions))];

    return {
      user: UserMapper.toDomain(user),
      roles,
      permissionCodes,
    };
  }

  async setUserRoles(userId: string, roleIds: string[]): Promise<void> {
    const existing = await this.prisma.userRole.findMany({
      where: { userId, deletedAt: null },
    });
    const existingIds = new Set(existing.map((e) => e.roleId));
    const desired = new Set(roleIds);

    for (const row of existing) {
      if (!desired.has(row.roleId)) {
        await this.prisma.userRole.update({
          where: { id: row.id },
          data: { deletedAt: new Date() },
        });
      }
    }

    for (const roleId of roleIds) {
      if (existingIds.has(roleId)) continue;
      const softDeleted = await this.prisma.userRole.findFirst({
        where: { userId, roleId },
      });
      if (softDeleted) {
        await this.prisma.userRole.update({
          where: { id: softDeleted.id },
          data: { deletedAt: null },
        });
      } else {
        await this.prisma.userRole.create({ data: { userId, roleId } });
      }
    }
  }

  async addUserRole(userId: string, roleId: string): Promise<void> {
    const auth = await this.getAuthDataByUserId(userId);
    const current = auth?.roles.map((r) => r.id) ?? [];
    if (!current.includes(roleId)) {
      await this.setUserRoles(userId, [...current, roleId]);
    }
  }

  async removeUserRole(userId: string, roleId: string): Promise<void> {
    const auth = await this.getAuthDataByUserId(userId);
    const next = (auth?.roles.map((r) => r.id) ?? []).filter(
      (id) => id !== roleId,
    );
    await this.setUserRoles(userId, next);
  }
}
