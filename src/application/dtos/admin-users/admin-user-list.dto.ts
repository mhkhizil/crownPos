import { ApiProperty } from '@nestjs/swagger';
import type { UserAuthData } from '../../../domain/repositories/user.repository.interface.js';

export class AdminUserListDto {
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

  @ApiProperty()
  status: string;

  @ApiProperty({ type: [String] })
  roleCodes: string[];

  @ApiProperty({ type: [String] })
  permissionCodes: string[];

  static fromAuth(auth: UserAuthData): AdminUserListDto {
    const dto = new AdminUserListDto();
    dto.id = auth.user.id;
    dto.email = auth.user.email;
    dto.nameEn = auth.user.nameEn;
    dto.nameMm = auth.user.nameMm;
    dto.phone = auth.user.phone;
    dto.isRoot = auth.user.isRoot;
    dto.status = auth.user.status;
    dto.roleCodes = auth.roles.map((r) => r.code);
    dto.permissionCodes = auth.permissionCodes;
    return dto;
  }
}
