import { jest } from '@jest/globals';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { UserEntity } from '../../../domain/entities/user.entity.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';
import { UserStatus } from '../../../domain/enums/user-status.enum.js';
import type { IRoleRepository } from '../../../domain/repositories/role.repository.interface.js';
import { RoleEntity } from '../../../domain/entities/role.entity.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { CreateAdminRoleUseCase } from './create-admin-role.use-case.js';
import { ListAdminRolesUseCase } from './list-admin-roles.use-case.js';
import { ListAdminPermissionsUseCase } from './list-admin-permissions.use-case.js';

function buildUser(overrides: Partial<UserEntity> = {}): UserEntity {
  return new UserEntity({
    id: 'user-1',
    companyId: null,
    email: 'root@test.com',
    passwordHash: 'hash',
    nameEn: 'Root',
    nameMm: null,
    phone: null,
    isRoot: true,
    status: UserStatus.ACTIVE,
    lastLoginAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    deletedAt: null,
    ...overrides,
  });
}

function buildRole(overrides: Partial<RoleEntity> = {}): RoleEntity {
  return new RoleEntity(
    overrides.id ?? 'role-1',
    overrides.code ?? 'SALES_MANAGER',
    overrides.nameEn ?? 'Sales Manager',
    overrides.nameMm ?? null,
    overrides.description ?? 'Manages sales',
    overrides.isSystem ?? false,
    overrides.permissionIds ?? ['permission-1'],
    overrides.permissionCodes ?? [PermissionCode.MANAGE_SALES],
  );
}

function buildUsersMock(): jest.Mocked<IUserRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    listStaff: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    getAuthDataByUserId: jest.fn(),
    setUserRoles: jest.fn(),
    addUserRole: jest.fn(),
    removeUserRole: jest.fn(),
  } as unknown as jest.Mocked<IUserRepository>;
}

function buildRolesMock(): jest.Mocked<IRoleRepository> {
  return {
    listPermissions: jest.fn(),
    listRoles: jest.fn(),
    findRoleById: jest.fn(),
    createRole: jest.fn(),
    ensurePermissions: jest.fn(),
  } as unknown as jest.Mocked<IRoleRepository>;
}

describe(CreateAdminRoleUseCase.name, () => {
  it('creates role for root admin', async () => {
    const users = buildUsersMock();
    const roles = buildRolesMock();
    users.findById.mockResolvedValue(buildUser({ isRoot: true }));
    roles.createRole.mockResolvedValue(buildRole());

    const useCase = new CreateAdminRoleUseCase(users, roles);
    const result = await useCase.execute('root-user', {
      code: 'SALES_MANAGER',
      nameEn: 'Sales Manager',
      description: 'Manages sales',
      permissionIds: ['permission-1'],
    });

    expect(result.code).toBe('SALES_MANAGER');
    expect(roles.createRole).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'SALES_MANAGER',
        permissionIds: ['permission-1'],
      }),
    );
  });

  it('rejects non-root user', async () => {
    const users = buildUsersMock();
    const roles = buildRolesMock();
    users.findById.mockResolvedValue(buildUser({ isRoot: false }));
    const useCase = new CreateAdminRoleUseCase(users, roles);

    await expect(
      useCase.execute('normal-admin', {
        code: 'OPS',
        nameEn: 'Operations',
        permissionIds: ['permission-1'],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects empty permission list', async () => {
    const users = buildUsersMock();
    const roles = buildRolesMock();
    users.findById.mockResolvedValue(buildUser({ isRoot: true }));
    const useCase = new CreateAdminRoleUseCase(users, roles);

    await expect(
      useCase.execute('root-user', {
        code: 'OPS',
        nameEn: 'Operations',
        permissionIds: [],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe(ListAdminRolesUseCase.name, () => {
  it('lists roles for authorized user', async () => {
    const users = buildUsersMock();
    const roles = buildRolesMock();
    users.findById.mockResolvedValue(buildUser({ isRoot: true }));
    roles.listRoles.mockResolvedValue([
      buildRole({
        code: 'ROOT_ADMIN',
        nameEn: 'Root Admin',
        isSystem: true,
      }),
      buildRole(),
    ]);

    const useCase = new ListAdminRolesUseCase(users, roles);
    const rows = await useCase.execute('root-user');

    expect(rows).toHaveLength(2);
    expect(rows[0]?.code).toBe('ROOT_ADMIN');
  });

  it('blocks user without MANAGE_ROLES', async () => {
    const users = buildUsersMock();
    const roles = buildRolesMock();
    users.findById.mockResolvedValue(buildUser({ isRoot: false }));
    users.getAuthDataByUserId.mockResolvedValue({
      user: buildUser({ isRoot: false }),
      roles: [],
      permissionCodes: [PermissionCode.MANAGE_SALES],
    });
    const useCase = new ListAdminRolesUseCase(users, roles);

    await expect(useCase.execute('normal-admin')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});

describe(ListAdminPermissionsUseCase.name, () => {
  it('returns permission rows for authorized user', async () => {
    const users = buildUsersMock();
    const roles = buildRolesMock();
    users.findById.mockResolvedValue(buildUser({ isRoot: true }));
    roles.listPermissions.mockResolvedValue([
      {
        id: 'permission-1',
        code: PermissionCode.MANAGE_USERS,
        module: 'users',
        nameEn: 'Manage Users',
        nameMm: null,
        description: null,
      },
    ]);
    const useCase = new ListAdminPermissionsUseCase(users, roles);

    const result = await useCase.execute('root-user');

    expect(result).toHaveLength(1);
    expect(result[0]?.code).toBe(PermissionCode.MANAGE_USERS);
  });
});
