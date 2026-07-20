import { ApiProperty } from '@nestjs/swagger';
import type { PermissionEntity } from '../../../domain/entities/role.entity.js';

export class AdminPermissionListDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  module: string;

  @ApiProperty()
  nameEn: string;

  @ApiProperty({ nullable: true })
  nameMm: string | null;

  constructor(p: PermissionEntity) {
    this.id = p.id;
    this.code = p.code;
    this.module = p.module;
    this.nameEn = p.nameEn;
    this.nameMm = p.nameMm;
  }

  static fromEntity(p: PermissionEntity): AdminPermissionListDto {
    return new AdminPermissionListDto(p);
  }
}
