import { ApiProperty } from '@nestjs/swagger';
import { AdminPermission } from '../../../domain/enums/admin-permission.enum.js';
import type {
  UserAdminRoleData,
  UserAuthData,
} from '../../../domain/repositories/user.repository.interface.js';

export enum ProfileVerificationTagType {
  PHONE = 'PHONE',
  EMAIL = 'EMAIL',
}

export enum ProfileVerificationTagStatus {
  VERIFIED = 'VERIFIED',
  UNVERIFIED = 'UNVERIFIED',
}

export enum ProfileVerificationTagAction {
  SEND_PHONE_OTP = 'SEND_PHONE_OTP',
  SEND_EMAIL_VERIFICATION = 'SEND_EMAIL_VERIFICATION',
}

export class AuthTokensDto {
  @ApiProperty()
  accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }
}

type ProfileVerificationTagInput = {
  type: ProfileVerificationTagType;
  label: string;
  value: string | null;
  status: ProfileVerificationTagStatus;
  isVerified: boolean;
  canVerifyFromProfile: boolean;
  action: ProfileVerificationTagAction | null;
  verifiedAt: Date | null;
};

export class ProfileVerificationTagDto {
  @ApiProperty({ enum: ProfileVerificationTagType })
  type: ProfileVerificationTagType;

  @ApiProperty()
  label: string;

  @ApiProperty({ nullable: true })
  value: string | null;

  @ApiProperty({ enum: ProfileVerificationTagStatus })
  status: ProfileVerificationTagStatus;

  @ApiProperty()
  isVerified: boolean;

  @ApiProperty()
  canVerifyFromProfile: boolean;

  @ApiProperty({ enum: ProfileVerificationTagAction, nullable: true })
  action: ProfileVerificationTagAction | null;

  @ApiProperty({ nullable: true })
  verifiedAt: Date | null;

  constructor(data: ProfileVerificationTagInput) {
    this.type = data.type;
    this.label = data.label;
    this.value = data.value;
    this.status = data.status;
    this.isVerified = data.isVerified;
    this.canVerifyFromProfile = data.canVerifyFromProfile;
    this.action = data.action;
    this.verifiedAt = data.verifiedAt;
  }
}

export class AdminAuthRoleDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  isSystem: boolean;

  @ApiProperty({ enum: AdminPermission, isArray: true })
  permissions: AdminPermission[];

  constructor(role: UserAdminRoleData) {
    this.id = role.id;
    this.name = role.name;
    this.isSystem = role.isSystem;
    this.permissions = role.permissions;
  }
}

export class UserProfileDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nickname: string;

  @ApiProperty({ nullable: true })
  email: string | null;

  @ApiProperty()
  phone: string;

  @ApiProperty({ nullable: true })
  avatar: string | null;

  @ApiProperty()
  isPhoneVerified: boolean;

  @ApiProperty()
  isEmailVerified: boolean;

  @ApiProperty({ nullable: true })
  phoneVerifiedAt: Date | null;

  @ApiProperty({ nullable: true })
  emailVerifiedAt: Date | null;

  @ApiProperty({ type: AdminAuthRoleDto, nullable: true })
  adminRole: AdminAuthRoleDto | null;

  @ApiProperty({ type: ProfileVerificationTagDto, isArray: true })
  verificationTags: ProfileVerificationTagDto[];

  constructor(authData: UserAuthData) {
    const { user, adminRole } = authData;
    this.id = user.id;
    this.nickname = user.nickname;
    this.email = user.email;
    this.phone = user.phone;
    this.avatar = user.avatar;
    this.isPhoneVerified = user.isPhoneVerified;
    this.isEmailVerified = user.isEmailVerified;
    this.phoneVerifiedAt = user.phoneVerifiedAt;
    this.emailVerifiedAt = user.emailVerifiedAt;
    this.adminRole = adminRole ? new AdminAuthRoleDto(adminRole) : null;
    this.verificationTags = [
      new ProfileVerificationTagDto({
        type: ProfileVerificationTagType.PHONE,
        label: 'Phone',
        value: user.phone,
        status: user.isPhoneVerified
          ? ProfileVerificationTagStatus.VERIFIED
          : ProfileVerificationTagStatus.UNVERIFIED,
        isVerified: user.isPhoneVerified,
        canVerifyFromProfile: !user.isPhoneVerified,
        action: user.isPhoneVerified
          ? null
          : ProfileVerificationTagAction.SEND_PHONE_OTP,
        verifiedAt: user.phoneVerifiedAt,
      }),
      new ProfileVerificationTagDto({
        type: ProfileVerificationTagType.EMAIL,
        label: 'Email',
        value: user.email,
        status: user.isEmailVerified
          ? ProfileVerificationTagStatus.VERIFIED
          : ProfileVerificationTagStatus.UNVERIFIED,
        isVerified: user.isEmailVerified,
        canVerifyFromProfile: !user.isEmailVerified && user.email !== null,
        action:
          user.isEmailVerified || user.email === null
            ? null
            : ProfileVerificationTagAction.SEND_EMAIL_VERIFICATION,
        verifiedAt: user.emailVerifiedAt,
      }),
    ];
  }
}

export class AuthResponseDto {
  @ApiProperty({ type: UserProfileDto })
  user: UserProfileDto;

  @ApiProperty({ type: AuthTokensDto })
  tokens: AuthTokensDto;

  constructor(user: UserProfileDto, tokens: AuthTokensDto) {
    this.user = user;
    this.tokens = tokens;
  }
}
