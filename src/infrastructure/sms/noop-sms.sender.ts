import { Injectable, Logger } from '@nestjs/common';
import type {
  ISmsSender,
  SendSmsOptions,
} from '../../domain/services/sms-sender.interface.js';

/** Used when SMSPoh env is incomplete so the app can still boot. */
@Injectable()
export class NoopSmsSender implements ISmsSender {
  private readonly logger = new Logger(NoopSmsSender.name);

  async send(options: SendSmsOptions): Promise<void> {
    this.logger.warn(
      `SMS skipped (SMSPoh not configured): to=${options.to}`,
    );
  }
}
