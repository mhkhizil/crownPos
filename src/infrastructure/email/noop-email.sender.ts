import { Injectable, Logger } from '@nestjs/common';
import type {
  IEmailSender,
  SendEmailOptions,
} from '../../domain/services/email-sender.interface.js';

/** Used when Brevo SMTP env is incomplete so the app can still boot. */
@Injectable()
export class NoopEmailSender implements IEmailSender {
  private readonly logger = new Logger(NoopEmailSender.name);

  async send(options: SendEmailOptions): Promise<void> {
    this.logger.warn(
      `Email skipped (Brevo not configured): to=${options.to} subject=${options.subject}`,
    );
  }
}
