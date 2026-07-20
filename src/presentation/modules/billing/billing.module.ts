import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BillingController } from './billing.controller.js';
import { ListInvoicesUseCase } from '../../../application/use-cases/billing/list-invoices.use-case.js';
import { CreateInvoiceFromOrderUseCase } from '../../../application/use-cases/billing/create-invoice-from-order.use-case.js';
import { ListPaymentsUseCase } from '../../../application/use-cases/billing/list-payments.use-case.js';
import { RecordPaymentUseCase } from '../../../application/use-cases/billing/record-payment.use-case.js';
import { ListCollectionRemindersUseCase } from '../../../application/use-cases/billing/list-collection-reminders.use-case.js';
import { CreateCollectionReminderUseCase } from '../../../application/use-cases/billing/create-collection-reminder.use-case.js';
import { DispatchDueCollectionRemindersUseCase } from '../../../application/use-cases/billing/dispatch-due-collection-reminders.use-case.js';
import { BILLING_REPOSITORY } from '../../../domain/repositories/billing.repository.interface.js';
import { BillingRepository } from '../../../infrastructure/repositories/billing.repository.js';
import { SALES_REPOSITORY } from '../../../domain/repositories/sales.repository.interface.js';
import { SalesRepository } from '../../../infrastructure/repositories/sales.repository.js';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import { UserRepository } from '../../../infrastructure/repositories/user.repository.js';
import { REALTIME_NOTIFIER } from '../../../domain/services/realtime-notifier.interface.js';
import { PusherRealtimeNotifier } from '../../../infrastructure/realtime/pusher-realtime.notifier.js';
import { EMAIL_SENDER } from '../../../domain/services/email-sender.interface.js';
import type { IEmailSender } from '../../../domain/services/email-sender.interface.js';
import { BrevoSmtpEmailSender } from '../../../infrastructure/email/brevo-smtp-email.sender.js';
import { NoopEmailSender } from '../../../infrastructure/email/noop-email.sender.js';
import { SMS_SENDER } from '../../../domain/services/sms-sender.interface.js';
import type { ISmsSender } from '../../../domain/services/sms-sender.interface.js';
import { SMSPohRestSmsSender } from '../../../infrastructure/sms/smspoh-rest-sms.sender.js';
import { NoopSmsSender } from '../../../infrastructure/sms/noop-sms.sender.js';
import { CollectionReminderDispatchScheduler } from '../../../infrastructure/jobs/collection-reminder-dispatch.scheduler.js';

function hasBrevoConfig(config: ConfigService): boolean {
  return Boolean(
    config.get<string>('BREVO_SMTP_HOST')?.trim() &&
      config.get<string>('BREVO_SMTP_USER')?.trim() &&
      config.get<string>('BREVO_SMTP_PASS')?.trim() &&
      config.get<string>('BREVO_FROM_EMAIL')?.trim(),
  );
}

function hasSmspohConfig(config: ConfigService): boolean {
  return Boolean(
    config.get<string>('SMSPOH_API_KEY')?.trim() &&
      config.get<string>('SMSPOH_API_SECRET')?.trim() &&
      config.get<string>('SMSPOH_SENDER_ID')?.trim(),
  );
}

@Module({
  controllers: [BillingController],
  providers: [
    ListInvoicesUseCase,
    CreateInvoiceFromOrderUseCase,
    ListPaymentsUseCase,
    RecordPaymentUseCase,
    ListCollectionRemindersUseCase,
    CreateCollectionReminderUseCase,
    DispatchDueCollectionRemindersUseCase,
    CollectionReminderDispatchScheduler,
    NoopEmailSender,
    NoopSmsSender,
    { provide: BILLING_REPOSITORY, useClass: BillingRepository },
    { provide: SALES_REPOSITORY, useClass: SalesRepository },
    { provide: USER_REPOSITORY, useClass: UserRepository },
    { provide: REALTIME_NOTIFIER, useClass: PusherRealtimeNotifier },
    {
      provide: EMAIL_SENDER,
      inject: [ConfigService, NoopEmailSender],
      useFactory: (
        config: ConfigService,
        noop: NoopEmailSender,
      ): IEmailSender =>
        hasBrevoConfig(config) ? new BrevoSmtpEmailSender(config) : noop,
    },
    {
      provide: SMS_SENDER,
      inject: [ConfigService, NoopSmsSender],
      useFactory: (config: ConfigService, noop: NoopSmsSender): ISmsSender =>
        hasSmspohConfig(config) ? new SMSPohRestSmsSender(config) : noop,
    },
  ],
})
export class BillingModule {}
