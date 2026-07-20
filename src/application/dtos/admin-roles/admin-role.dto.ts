import { ApiProperty } from '@nestjs/swagger';
import type { RoleEntity } from '../../../domain/entities/role.entity.js';

export class AdminRoleDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  nameEn: string;

  @ApiProperty({ nullable: true })
  nameMm: string | null;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty()
  isSystem: boolean;

  @ApiProperty({ type: [String] })
  permissionIds: string[];

  @ApiProperty({ type: [String] })
  permissionCodes: string[];

  constructor(role: RoleEntity) {
    this.id = role.id;
    this.code = role.code;
    this.nameEn = role.nameEn;
    this.nameMm = role.nameMm;
    this.description = role.description;
    this.isSystem = role.isSystem;
    this.permissionIds = role.permissionIds;
    this.permissionCodes = role.permissionCodes;
  }

  static fromEntity(role: RoleEntity): AdminRoleDto {
    return new AdminRoleDto(role);
  }
}
