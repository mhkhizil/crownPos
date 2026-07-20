import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateAdminUserDto {
  @ApiProperty({ example: 'staff@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'ChangeMe123!' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Sales Staff' })
  @IsString()
  @IsNotEmpty()
  nameEn: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nameMm?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ type: [String], description: 'Role IDs to assign' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleIds?: string[];
}
