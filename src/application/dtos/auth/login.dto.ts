import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/** Admin dashboard: email + password only (any user with an admin role). */
export class AdminLoginDto {
  @ApiProperty({
    example: 'admin@example.com',
    description: 'Admin account email',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'secureP@ss123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
