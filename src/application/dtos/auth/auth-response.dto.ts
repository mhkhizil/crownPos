import { ApiProperty } from '@nestjs/swagger';
import type { UserAuthData } from '../../../domain/repositories/user.repository.interface.js';

export class AuthTokensDto {
  @ApiProperty()
  accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }
}

export class StaffRoleDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  nameEn: string;

  @ApiProperty()
  isSystem: boolean;

  @ApiProperty({ type: [String] })
  permissions: string[];
}

export class UserProfileDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  nameEn: string;

  @ApiProperty({ nullable: true })
  nameMm: string | null;

  @ApiProperty({ nullable: true })
  phone: string | null;

  @ApiProperty()
  isRoot: boolean;

  @ApiProperty({ type: [StaffRoleDto] })
  roles: StaffRoleDto[];

  @ApiProperty({ type: [String] })
  permissionCodes: string[];

  constructor(authData: UserAuthData) {
    const { user, roles, permissionCodes } = authData;
    this.id = user.id;
    this.email = user.email;
    this.nameEn = user.nameEn;
    this.nameMm = user.nameMm;
    this.phone = user.phone;
    this.isRoot = user.isRoot;
    this.roles = roles.map((r) => ({
      id: r.id,
      code: r.code,
      nameEn: r.nameEn,
      isSystem: r.isSystem,
      permissions: r.permissions,
    }));
    this.permissionCodes = user.isRoot
      ? [...new Set([...permissionCodes, '*'])]
      : permissionCodes;
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
