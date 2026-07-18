import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'CoolUser' })
  @IsString()
  @IsNotEmpty()
  nickname: string;

  @ApiProperty({ example: '+959123456789' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'secureP@ss123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    example: 'secureP@ss123',
    minLength: 8,
    description: 'Must match password',
  })
  @IsString()
  @MinLength(8)
  confirmPassword: string;
}
