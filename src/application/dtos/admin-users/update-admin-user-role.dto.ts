import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsString } from 'class-validator';

export class UpdateAdminUserRoleDto {
  @ApiProperty({ type: [String], description: 'Replace user roles with these role IDs' })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  roleIds: string[];
}
