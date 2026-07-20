import { UserEntity } from '../entities/user.entity.js';
import { UserStatus } from '../enums/user-status.enum.js';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface CreateStaffUserData {
  email: string;
  passwordHash: string;
  nameEn: string;
  nameMm?: string | null;
  phone?: string | null;
  companyId?: string | null;
  isRoot?: boolean;
  status?: UserStatus;
}

export interface UpdateStaffUserData {
  email?: string;
  passwordHash?: string;
  nameEn?: string;
  nameMm?: string | null;
  phone?: string | null;
  companyId?: string | null;
  status?: UserStatus;
  lastLoginAt?: Date | null;
  deletedAt?: Date | null;
}

export interface UserRoleAuthData {
  id: string;
  code: string;
  nameEn: string;
  isSystem: boolean;
  permissions: string[];
}

export interface UserAuthData {
  user: UserEntity;
  roles: UserRoleAuthData[];
  permissionCodes: string[];
}

export interface IUserRepository {
  create(data: CreateStaffUserData): Promise<UserEntity>;
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  listStaff(): Promise<UserEntity[]>;
  update(id: string, data: UpdateStaffUserData): Promise<UserEntity>;
  softDelete(id: string): Promise<UserEntity>;
  getAuthDataByUserId(userId: string): Promise<UserAuthData | null>;
  setUserRoles(userId: string, roleIds: string[]): Promise<void>;
  addUserRole(userId: string, roleId: string): Promise<void>;
  removeUserRole(userId: string, roleId: string): Promise<void>;
}
