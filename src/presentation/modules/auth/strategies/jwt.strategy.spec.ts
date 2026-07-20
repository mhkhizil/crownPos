import { jest } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy.js';
import type { IUserRepository } from '../../../../domain/repositories/user.repository.interface.js';

function buildConfigService(): jest.Mocked<ConfigService> {
  return {
    getOrThrow: jest.fn().mockReturnValue('secret'),
  } as unknown as jest.Mocked<ConfigService>;
}

function buildUserRepository(): jest.Mocked<IUserRepository> {
  return {
    findById: jest.fn(),
  } as unknown as jest.Mocked<IUserRepository>;
}

describe(JwtStrategy.name, () => {
  it('accepts active staff users', async () => {
    const config = buildConfigService();
    const userRepository = buildUserRepository();
    userRepository.findById.mockResolvedValue({
      email: 'staff@example.com',
      phone: null,
      isActiveUser: () => true,
    } as never);

    const strategy = new JwtStrategy(config, userRepository);

    await expect(
      strategy.validate({ sub: 'user-1', email: 'staff@example.com' }),
    ).resolves.toEqual({
      sub: 'user-1',
      email: 'staff@example.com',
      phone: '',
    });
  });

  it('rejects missing users', async () => {
    const config = buildConfigService();
    const userRepository = buildUserRepository();
    userRepository.findById.mockResolvedValue(null);

    const strategy = new JwtStrategy(config, userRepository);

    await expect(
      strategy.validate({ sub: 'user-1', email: 'staff@example.com' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects inactive users', async () => {
    const config = buildConfigService();
    const userRepository = buildUserRepository();
    userRepository.findById.mockResolvedValue({
      email: 'staff@example.com',
      phone: null,
      isActiveUser: () => false,
    } as never);

    const strategy = new JwtStrategy(config, userRepository);

    await expect(
      strategy.validate({ sub: 'user-1', email: 'staff@example.com' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
