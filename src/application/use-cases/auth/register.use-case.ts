import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { randomBytes, randomInt } from 'crypto';
import { hash } from 'bcrypt';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { EMAIL_SENDER } from '../../../domain/services/email-sender.interface.js';
import type { IEmailSender } from '../../../domain/services/email-sender.interface.js';
import { SMS_SENDER } from '../../../domain/services/sms-sender.interface.js';
import type { ISmsSender } from '../../../domain/services/sms-sender.interface.js';
import { RegisterDto } from '../../dtos/auth/register.dto.js';
import { normalizeEmail } from '../../../common/utils/normalize-email.js';
import { VerificationActionResultDto } from '../../dtos/auth/verification-action-result.dto.js';

@Injectable()
export class RegisterUseCase {
  private readonly logger = new Logger(RegisterUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(EMAIL_SENDER)
    private readonly emailSender: IEmailSender,
    @Inject(SMS_SENDER)
    private readonly smsSender: ISmsSender,
  ) {}

  async execute(dto: RegisterDto): Promise<VerificationActionResultDto> {
    const email = normalizeEmail(dto.email);
    this.logger.log(`Registering user: ${dto.phone}`);

    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Password and confirmPassword must match');
    }

    const [existingPhone, existingEmail] = await Promise.all([
      this.userRepository.findByPhone(dto.phone),
      this.userRepository.findByEmail(email),
    ]);

    if (existingPhone) {
      throw new ConflictException(
        'A user with this phone number already exists',
      );
    }

    if (existingEmail) {
      throw new ConflictException('A user with this email already exists');
    }

    const hashedPassword = await hash(dto.password, 12);

    await this.userRepository.create({
      phone: dto.phone,
      email,
      password: hashedPassword,
      nickname: dto.nickname,
    });

    const otpCode = this.generateOtpCode();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await this.userRepository.createPhoneOtp(dto.phone, otpCode, otpExpiresAt);

    try {
      await this.smsSender.send({
        to: dto.phone,
        message: `Your verification code is ${otpCode}. It expires in 5 minutes. Do not share this code.`,
        clientReference: `register:${dto.phone}`,
      });
    } catch (err) {
      this.logger.warn(
        `OTP SMS failed for ${this.maskPhone(dto.phone)}: ${String(err)}`,
      );
    }

    const emailToken = randomBytes(16).toString('hex');
    const emailExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.userRepository.createEmailVerification(
      email,
      emailToken,
      emailExpiresAt,
    );

    try {
      await this.emailSender.send({
        to: email,
        subject: 'Verify your email',
        text: `Your email verification token is: ${emailToken}`,
        html: `<p>Your email verification token is:</p><p><b>${emailToken}</b></p>`,
      });
    } catch (err) {
      this.logger.warn(
        `Email verification send failed for ${email}: ${String(err)}`,
      );
    }

    return new VerificationActionResultDto('REGISTRATION_PENDING_VERIFICATION');
  }

  private generateOtpCode(): string {
    return randomInt(100000, 1000000).toString();
  }

  private maskPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 4) {
      return '***';
    }
    return `***${digits.slice(-4)}`;
  }
}
