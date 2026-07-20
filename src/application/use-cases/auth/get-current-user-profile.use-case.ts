import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { UserProfileDto } from '../../dtos/auth/auth-response.dto.js';

@Injectable()
export class GetCurrentUserProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string): Promise<UserProfileDto> {
    const authData = await this.userRepository.getAuthDataByUserId(userId);
    if (!authData || !authData.user.isActiveUser()) {
      throw new UnauthorizedException('User not found or inactive');
    }
    return new UserProfileDto(authData);
  }
}
