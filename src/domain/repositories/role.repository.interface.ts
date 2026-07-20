import type { PermissionEntity, RoleEntity } from '../entities/role.entity.js';

export const ROLE_REPOSITORY = Symbol('ROLE_REPOSITORY');

export interface CreateRoleData {
  code: string;
  nameEn: string;
  nameMm?: string | null;
  description?: string | null;
  isSystem?: boolean;
  permissionIds: string[];
}

export interface IRoleRepository {
  listPermissions(): Promise<PermissionEntity[]>;
  listRoles(): Promise<RoleEntity[]>;
  findRoleById(id: string): Promise<RoleEntity | null>;
  createRole(data: CreateRoleData): Promise<RoleEntity>;
  ensurePermissions(
    permissions: Array<{
      code: string;
      module: string;
      nameEn: string;
      nameMm?: string | null;
      description?: string | null;
    }>,
  ): Promise<void>;
}
