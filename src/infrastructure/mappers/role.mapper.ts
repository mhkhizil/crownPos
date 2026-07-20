import type { Prisma } from '@prisma/client';
import {
  PermissionEntity,
  RoleEntity,
} from '../../domain/entities/role.entity.js';

type PermissionRow = Prisma.PermissionGetPayload<object>;
type RoleWithPermissions = Prisma.RoleGetPayload<{
  include: {
    rolePermissions: {
      include: { permission: true };
    };
  };
}>;

export class RoleMapper {
  static permissionToDomain(row: PermissionRow): PermissionEntity {
    return new PermissionEntity(
      row.id,
      row.code,
      row.module,
      row.nameEn,
      row.nameMm,
      row.description,
    );
  }

  static roleToDomain(row: RoleWithPermissions): RoleEntity {
    const active = (row.rolePermissions ?? []).filter(
      (rp) => rp.deletedAt == null && rp.permission.deletedAt == null,
    );
    return new RoleEntity(
      row.id,
      row.code,
      row.nameEn,
      row.nameMm,
      row.description,
      row.isSystem,
      active.map((rp) => rp.permissionId),
      active.map((rp) => rp.permission.code),
    );
  }
}
