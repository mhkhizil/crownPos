import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DispatchDueCollectionRemindersUseCase } from '../../application/use-cases/billing/dispatch-due-collection-reminders.use-case.js';

/**
 * Wakes every minute, claims due SCHEDULED collection reminders, and fires
 * Pusher (+ optional Brevo/SMSPoh) alarms via the dispatch use-case.
 */
@Injectable()
export class CollectionReminderDispatchScheduler {
  private readonly logger = new Logger(CollectionReminderDispatchScheduler.name);
  private running = false;

  constructor(
    private readonly config: ConfigService,
    private readonly dispatch: DispatchDueCollectionRemindersUseCase,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron(): Promise<void> {
    if (!this.isEnabled()) return;
    if (this.running) {
      this.logger.debug('Skip collection-reminder cron — previous tick still running');
      return;
    }

    this.running = true;
    try {
      const result = await this.dispatch.executeSystem();
      if (result.claimed > 0) {
        this.logger.log(
          `Dispatched ${result.claimed} collection reminder(s) (push=${result.pushCount}, email=${result.emailCount}, sms=${result.smsCount})`,
        );
      }
    } catch (err: unknown) {
      this.logger.error(
        `Collection reminder cron failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      this.running = false;
    }
  }

  private isEnabled(): boolean {
    if (this.config.get<string>('NODE_ENV') === 'test') return false;
    const flag = this.config.get<string>(
      'COLLECTION_REMINDER_DISPATCH_ENABLED',
      'true',
    );
    return flag !== 'false' && flag !== '0';
  }
}
