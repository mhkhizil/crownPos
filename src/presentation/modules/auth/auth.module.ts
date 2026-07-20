import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminDashboardAuthController } from './admin-dashboard-auth.controller.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { LoginUseCase } from '../../../application/use-cases/auth/login.use-case.js';
import { GetCurrentUserProfileUseCase } from '../../../application/use-cases/auth/get-current-user-profile.use-case.js';
import { UserRepository } from '../../../infrastructure/repositories/user.repository.js';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_EXPIRATION', '2h') },
      }),
    }),
  ],
  controllers: [AdminDashboardAuthController],
  providers: [
    LoginUseCase,
    GetCurrentUserProfileUseCase,
    JwtStrategy,
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
  ],
  exports: [JwtModule, JwtStrategy, USER_REPOSITORY],
})
export class AuthModule {}
