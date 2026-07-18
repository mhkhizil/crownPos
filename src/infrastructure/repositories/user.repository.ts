import { Injectable } from '@nestjs/common';
import PrismaPkg from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service.js';
import { UserMapper } from '../mappers/user.mapper.js';
import { UserEntity } from '../../domain/entities/user.entity.js';
import type {
  CreateUserData,
  EmailVerificationData,
  IUserRepository,
  OtpVerificationData,
  UpdateUserData,
  UserAdminRoleData,
  UserAuthData,
} from '../../domain/repositories/user.repository.interface.js';
import { OtpPurpose } from '../../domain/enums/otp-purpose.enum.js';
import { VerificationStatus } from '../../domain/enums/verification-status.enum.js';
import { AdminPermission } from '../../domain/enums/admin-permission.enum.js';
import { normalizeEmail } from '../../common/utils/normalize-email.js';

const {
  OtpPurpose: PrismaOtpPurpose,
  VerificationStatus: PrismaVerificationStatus,
} = PrismaPkg;

type UserWithAuthIncludes = Prisma.UserGetPayload<{
  include: {
    adminRole: { include: { permissions: true } };
  };
}>;

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserData): Promise<UserEntity> {
    const user = await this.prisma.user.create({
      data: {
        phone: data.phone,
        email: normalizeEmail(data.email),
        password: data.password,
        nickname: data.nickname,
      },
    });

    return UserMapper.toDomain(user);
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? UserMapper.toDomain(user) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: normalizeEmail(email) },
    });
    return user ? UserMapper.toDomain(user) : null;
  }

  async findByPhone(phone: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    return user ? UserMapper.toDomain(user) : null;
  }

  async findAll(): Promise<UserEntity[]> {
    const users = await this.prisma.user.findMany({
      where: { isActive: true },
    });
    return users.map((u) => UserMapper.toDomain(u));
  }

  async update(id: string, data: UpdateUserData): Promise<UserEntity> {
    const payload: UpdateUserData = { ...data };
    if (typeof payload.email === 'string') {
      payload.email = normalizeEmail(payload.email);
    }

    const user = await this.prisma.user.update({ where: { id }, data: payload });
    return UserMapper.toDomain(user);
  }

  async setUserBanned(
    userId: string,
    banned: boolean,
    banReason?: string | null,
  ): Promise<UserEntity> {
    const current = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { authTokenVersion: true },
    });
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: banned
        ? {
            isBanned: true,
            banReason: banReason ?? null,
            bannedAt: new Date(),
            authTokenVersion: (current?.authTokenVersion ?? 0) + 1,
          }
        : {
            isBanned: false,
            banReason: null,
            bannedAt: null,
            authTokenVersion: (current?.authTokenVersion ?? 0) + 1,
          },
    });
    return UserMapper.toDomain(user);
  }

  async delete(id: string): Promise<boolean> {
    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
    return true;
  }

  async getProfileAvatarUrl(userId: string): Promise<string | null> {
    const row = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });
    return row?.avatar ?? null;
  }

  async setProfileAvatar(
    userId: string,
    avatarUrl: string | null,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
    });
  }

  async createPhoneOtp(
    phone: string,
    code: string,
    expiresAt: Date,
    purpose: OtpPurpose = OtpPurpose.PHONE_VERIFICATION,
  ): Promise<void> {
    const prismaPurpose =
      purpose === OtpPurpose.PASSWORD_RESET
        ? PrismaOtpPurpose.PASSWORD_RESET
        : PrismaOtpPurpose.PHONE_VERIFICATION;

    await this.prisma.otpVerification.updateMany({
      where: {
        phone,
        purpose: prismaPurpose,
        status: PrismaVerificationStatus.PENDING,
      },
      data: { status: PrismaVerificationStatus.EXPIRED },
    });

    await this.prisma.otpVerification.create({
      data: {
        phone,
        code,
        purpose: prismaPurpose,
        status: PrismaVerificationStatus.PENDING,
        expiresAt,
      },
    });
  }

  async findLatestActivePhoneOtp(
    phone: string,
    purpose: OtpPurpose = OtpPurpose.PHONE_VERIFICATION,
  ): Promise<OtpVerificationData | null> {
    const prismaPurpose =
      purpose === OtpPurpose.PASSWORD_RESET
        ? PrismaOtpPurpose.PASSWORD_RESET
        : PrismaOtpPurpose.PHONE_VERIFICATION;

    const row = await this.prisma.otpVerification.findFirst({
      where: {
        phone,
        purpose: prismaPurpose,
        status: PrismaVerificationStatus.PENDING,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!row) return null;

    return {
      id: row.id,
      phone: row.phone,
      code: row.code,
      purpose:
        row.purpose === PrismaOtpPurpose.PASSWORD_RESET
          ? OtpPurpose.PASSWORD_RESET
          : OtpPurpose.PHONE_VERIFICATION,
      status: row.status as VerificationStatus,
      expiresAt: row.expiresAt,
      attempts: row.attempts,
      maxAttempts: row.maxAttempts,
    };
  }

  async incrementPhoneOtpAttempt(id: string): Promise<void> {
    await this.prisma.otpVerification.update({
      where: { id },
      data: { attempts: { increment: 1 } },
    });
  }

  async markPhoneOtpFailed(id: string): Promise<void> {
    await this.prisma.otpVerification.update({
      where: { id },
      data: { status: PrismaVerificationStatus.FAILED },
    });
  }

  async markPhoneOtpVerified(id: string): Promise<void> {
    await this.prisma.otpVerification.update({
      where: { id },
      data: {
        status: PrismaVerificationStatus.VERIFIED,
        verifiedAt: new Date(),
      },
    });
  }

  async markUserPhoneVerified(phone: string): Promise<void> {
    await this.prisma.user.update({
      where: { phone },
      data: {
        isPhoneVerified: true,
        phoneVerifiedAt: new Date(),
      },
    });
  }

  async createEmailVerification(
    email: string,
    token: string,
    expiresAt: Date,
  ): Promise<void> {
    const normalized = normalizeEmail(email);
    await this.prisma.emailVerification.updateMany({
      where: {
        email: normalized,
        status: PrismaVerificationStatus.PENDING,
      },
      data: { status: PrismaVerificationStatus.EXPIRED },
    });

    await this.prisma.emailVerification.create({
      data: {
        email: normalized,
        token,
        status: PrismaVerificationStatus.PENDING,
        expiresAt,
      },
    });
  }

  async findActiveEmailVerification(
    email: string,
    token: string,
  ): Promise<EmailVerificationData | null> {
    const row = await this.prisma.emailVerification.findFirst({
      where: {
        email: normalizeEmail(email),
        token,
        status: PrismaVerificationStatus.PENDING,
      },
    });

    if (!row) return null;

    return {
      id: row.id,
      email: row.email,
      token: row.token,
      status: row.status as VerificationStatus,
      expiresAt: row.expiresAt,
    };
  }

  async markEmailVerificationExpired(id: string): Promise<void> {
    await this.prisma.emailVerification.update({
      where: { id },
      data: { status: PrismaVerificationStatus.EXPIRED },
    });
  }

  async markEmailVerificationVerified(id: string): Promise<void> {
    await this.prisma.emailVerification.update({
      where: { id },
      data: {
        status: PrismaVerificationStatus.VERIFIED,
        verifiedAt: new Date(),
      },
    });
  }

  async markUserEmailVerified(email: string): Promise<void> {
    await this.prisma.user.update({
      where: { email: normalizeEmail(email) },
      data: {
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });
  }

  async findAdminUserIds(): Promise<string[]> {
    const rows = await this.prisma.user.findMany({
      where: { adminRoleId: { not: null }, isActive: true },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }

  async listAdminUsers(): Promise<UserEntity[]> {
    const users = await this.prisma.user.findMany({
      where: { adminRoleId: { not: null } },
      orderBy: { createdAt: 'asc' },
    });
    return users.map((u) => UserMapper.toDomain(u));
  }

  async getAuthDataByUserId(userId: string): Promise<UserAuthData | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        adminRole: { include: { permissions: true } },
      },
    });

    if (!user) return null;
    return this.toAuthData(user);
  }

  async getAdminRoleByUserId(
    userId: string,
  ): Promise<UserAdminRoleData | null> {
    const auth = await this.getAuthDataByUserId(userId);
    return auth?.adminRole ?? null;
  }

  private toAuthData(user: UserWithAuthIncludes): UserAuthData {
    return {
      user: UserMapper.toDomain(user),
      adminRole: user.adminRole
        ? {
            id: user.adminRole.id,
            name: user.adminRole.name,
            isSystem: user.adminRole.isSystem,
            permissions: user.adminRole.permissions.map(
              (p) => p.permission as AdminPermission,
            ),
          }
        : null,
    };
  }
}
