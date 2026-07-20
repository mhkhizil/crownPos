import { Module } from '@nestjs/common';
import { AdminRolesController } from './admin-roles.controller.js';
import { CreateAdminRoleUseCase } from '../../../application/use-cases/admin-roles/create-admin-role.use-case.js';
import { ListAdminRolesUseCase } from '../../../application/use-cases/admin-roles/list-admin-roles.use-case.js';
import { ListAdminPermissionsUseCase } from '../../../application/use-cases/admin-roles/list-admin-permissions.use-case.js';
import { ROLE_REPOSITORY } from '../../../domain/repositories/role.repository.interface.js';
import { RoleRepository } from '../../../infrastructure/repositories/role.repository.js';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import { UserRepository } from '../../../infrastructure/repositories/user.repository.js';

@Module({
  controllers: [AdminRolesController],
  providers: [
    CreateAdminRoleUseCase,
    ListAdminRolesUseCase,
    ListAdminPermissionsUseCase,
    { provide: ROLE_REPOSITORY, useClass: RoleRepository },
    { provide: USER_REPOSITORY, useClass: UserRepository },
  ],
})
export class AdminRolesModule {}
