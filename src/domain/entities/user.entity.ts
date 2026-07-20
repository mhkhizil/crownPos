import { UserStatus } from '../enums/user-status.enum.js';

export interface UserEntityProps {
  id: string;
  companyId: string | null;
  email: string;
  passwordHash: string;
  nameEn: string;
  nameMm: string | null;
  phone: string | null;
  isRoot: boolean;
  status: UserStatus;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class UserEntity {
  readonly id: string;
  readonly companyId: string | null;
  readonly email: string;
  readonly passwordHash: string;
  readonly nameEn: string;
  readonly nameMm: string | null;
  readonly phone: string | null;
  readonly isRoot: boolean;
  readonly status: UserStatus;
  readonly lastLoginAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;

  constructor(props: UserEntityProps) {
    this.id = props.id;
    this.companyId = props.companyId;
    this.email = props.email;
    this.passwordHash = props.passwordHash;
    this.nameEn = props.nameEn;
    this.nameMm = props.nameMm;
    this.phone = props.phone;
    this.isRoot = props.isRoot;
    this.status = props.status;
    this.lastLoginAt = props.lastLoginAt;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.deletedAt = props.deletedAt;
  }

  isActiveUser(): boolean {
    return this.status === UserStatus.ACTIVE && this.deletedAt === null;
  }

  isStaff(): boolean {
    return this.isActiveUser();
  }
}
