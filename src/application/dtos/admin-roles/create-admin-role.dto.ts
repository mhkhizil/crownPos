import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateAdminRoleDto {
  @ApiProperty({ example: 'SALES_MANAGER' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  code: string;

  @ApiProperty({ example: 'Sales Manager' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  nameEn: string;

  @ApiPropertyOptional({ example: 'အရောင်းမန်နေဂျာ' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  nameMm?: string;

  @ApiPropertyOptional({ example: 'Manages sales workflows' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiProperty({ example: ['permission-id-1', 'permission-id-2'] })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({ each: true })
  permissionIds: string[];
}
