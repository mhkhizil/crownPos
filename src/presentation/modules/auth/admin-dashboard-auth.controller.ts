import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { LoginUseCase } from '../../../application/use-cases/auth/login.use-case.js';
import { AdminLoginDto } from '../../../application/dtos/auth/login.dto.js';
import { ApiResponseDto } from '../../../application/dtos/common/api-response.dto.js';
import { AuthResponseDto } from '../../../application/dtos/auth/auth-response.dto.js';
import { Public } from '../../../common/decorators/public.decorator.js';
import {
  ApiErrorResponse,
  ApiSuccessResponse,
} from '../../../common/decorators/api-response.decorator.js';
import { ROUTE_PREFIX } from '../../routing.paths.js';
import { AUTH_SYSTEM_OVERVIEW } from './auth-system.swagger.js';

@ApiTags('Admin Dashboard Auth')
@Controller(`${ROUTE_PREFIX.adminDashboard}/auth`)
export class AdminDashboardAuthController {
  constructor(private readonly loginUseCase: LoginUseCase) {}

  @Public()
  @Throttle({
    'auth-ip': { limit: 20, ttl: 60_000 },
    'auth-id': { limit: 12, ttl: 60_000 },
  })
  @UseGuards(ThrottlerGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Admin dashboard login (email + password)',
    description: `## Admin dashboard login\n\n${AUTH_SYSTEM_OVERVIEW}\n\n### This endpoint: \`POST /admin/dashboard/auth/login\`\nRoot and staff admins sign in with email and password. Client accounts must use client login with phone or email.`,
  })
  @ApiSuccessResponse(AuthResponseDto, {
    status: HttpStatus.OK,
    description: 'Login successful',
  })
  @ApiErrorResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Not an admin account',
  })
  @ApiErrorResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials or inactive account',
  })
  @ApiErrorResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Rate limit exceeded for this IP or email',
  })
  async login(
    @Body() dto: AdminLoginDto,
  ): Promise<ApiResponseDto<AuthResponseDto>> {
    const result = await this.loginUseCase.loginAdmin(dto);
    return ApiResponseDto.success(result, 'Login successful');
  }
}
