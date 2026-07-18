export interface UserEntityProps {
  id: string;
  phone: string;
  email: string | null;
  password: string;
  nickname: string;
  avatar: string | null;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  emailVerifiedAt: Date | null;
  phoneVerifiedAt: Date | null;
  isActive: boolean;
  isBanned: boolean;
  adminRoleId: string | null;
  authTokenVersion?: number;
  createdAt: Date;
  updatedAt: Date;
}

export class UserEntity {
  readonly id: string;
  readonly phone: string;
  readonly email: string | null;
  readonly password: string;
  readonly nickname: string;
  readonly avatar: string | null;
  readonly isEmailVerified: boolean;
  readonly isPhoneVerified: boolean;
  readonly emailVerifiedAt: Date | null;
  readonly phoneVerifiedAt: Date | null;
  readonly isActive: boolean;
  readonly isBanned: boolean;
  readonly adminRoleId: string | null;
  readonly authTokenVersion: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: UserEntityProps) {
    this.id = props.id;
    this.phone = props.phone;
    this.email = props.email;
    this.password = props.password;
    this.nickname = props.nickname;
    this.avatar = props.avatar;
    this.isEmailVerified = props.isEmailVerified;
    this.isPhoneVerified = props.isPhoneVerified;
    this.emailVerifiedAt = props.emailVerifiedAt;
    this.phoneVerifiedAt = props.phoneVerifiedAt;
    this.isActive = props.isActive;
    this.isBanned = props.isBanned;
    this.adminRoleId = props.adminRoleId;
    this.authTokenVersion = props.authTokenVersion ?? 0;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  isActiveUser(): boolean {
    return this.isActive && !this.isBanned;
  }

  isVerified(): boolean {
    return this.isPhoneVerified && this.isEmailVerified;
  }

  isAdmin(): boolean {
    return this.adminRoleId !== null;
  }
}
