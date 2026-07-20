import {
  Injectable,
  Logger,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { AdminLoginDto } from '../../dtos/auth/login.dto.js';
import {
  AuthResponseDto,
  AuthTokensDto,
  UserProfileDto,
} from '../../dtos/auth/auth-response.dto.js';
import { normalizeEmail } from '../../../common/utils/normalize-email.js';

@Injectable()
export class LoginUseCase {
  private readonly logger = new Logger(LoginUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async loginAdmin(dto: AdminLoginDto): Promise<AuthResponseDto> {
    const email = normalizeEmail(dto.email);
    this.logger.log(`Staff login attempt: email=${email}`);
    const user = await this.userRepository.findByEmail(email);
    if (!user || !user.isActiveUser()) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.userRepository.update(user.id, { lastLoginAt: new Date() });

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    const authData = await this.userRepository.getAuthDataByUserId(user.id);
    if (!authData) {
      throw new UnauthorizedException('User profile not found');
    }

    return new AuthResponseDto(
      new UserProfileDto(authData),
      new AuthTokensDto(accessToken),
    );
  }

  /** Client login disabled — staff/admin only API. */
  async loginClient(): Promise<never> {
    throw new UnauthorizedException(
      'Client login is not available. Use admin dashboard login.',
    );
  }
}
