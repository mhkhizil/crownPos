import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { RoleMapper } from '../mappers/role.mapper.js';
import type {
  CreateRoleData,
  IRoleRepository,
} from '../../domain/repositories/role.repository.interface.js';
import type {
  PermissionEntity,
  RoleEntity,
} from '../../domain/entities/role.entity.js';

@Injectable()
export class RoleRepository implements IRoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listPermissions(): Promise<PermissionEntity[]> {
    const rows = await this.prisma.permission.findMany({
      where: { deletedAt: null },
      orderBy: [{ module: 'asc' }, { code: 'asc' }],
    });
    return rows.map((p) => RoleMapper.permissionToDomain(p));
  }

  async listRoles(): Promise<RoleEntity[]> {
    const rows = await this.prisma.role.findMany({
      where: { deletedAt: null },
      include: {
        rolePermissions: {
          where: { deletedAt: null },
          include: { permission: true },
        },
      },
      orderBy: { code: 'asc' },
    });
    return rows.map((r) => RoleMapper.roleToDomain(r));
  }

  async findRoleById(id: string): Promise<RoleEntity | null> {
    const row = await this.prisma.role.findFirst({
      where: { id, deletedAt: null },
      include: {
        rolePermissions: {
          where: { deletedAt: null },
          include: { permission: true },
        },
      },
    });
    return row ? RoleMapper.roleToDomain(row) : null;
  }

  async createRole(data: CreateRoleData): Promise<RoleEntity> {
    const row = await this.prisma.role.create({
      data: {
        code: data.code,
        nameEn: data.nameEn,
        nameMm: data.nameMm ?? null,
        description: data.description ?? null,
        isSystem: data.isSystem ?? false,
        rolePermissions: {
          create: data.permissionIds.map((permissionId) => ({ permissionId })),
        },
      },
      include: {
        rolePermissions: {
          where: { deletedAt: null },
          include: { permission: true },
        },
      },
    });
    return RoleMapper.roleToDomain(row);
  }

  async ensurePermissions(
    permissions: Array<{
      code: string;
      module: string;
      nameEn: string;
      nameMm?: string | null;
      description?: string | null;
    }>,
  ): Promise<void> {
    for (const p of permissions) {
      const existing = await this.prisma.permission.findFirst({
        where: { code: p.code },
      });
      if (existing) {
        await this.prisma.permission.update({
          where: { id: existing.id },
          data: {
            module: p.module,
            nameEn: p.nameEn,
            nameMm: p.nameMm ?? null,
            description: p.description ?? null,
            deletedAt: null,
          },
        });
      } else {
        await this.prisma.permission.create({
          data: {
            code: p.code,
            module: p.module,
            nameEn: p.nameEn,
            nameMm: p.nameMm ?? null,
            description: p.description ?? null,
          },
        });
      }
    }
  }
}
