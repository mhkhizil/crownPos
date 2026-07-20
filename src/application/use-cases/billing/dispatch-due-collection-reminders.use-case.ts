import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { BILLING_REPOSITORY } from '../../../domain/repositories/billing.repository.interface.js';
import type { IBillingRepository } from '../../../domain/repositories/billing.repository.interface.js';
import { REALTIME_NOTIFIER } from '../../../domain/services/realtime-notifier.interface.js';
import type { IRealtimeNotifier } from '../../../domain/services/realtime-notifier.interface.js';
import { EMAIL_SENDER } from '../../../domain/services/email-sender.interface.js';
import type { IEmailSender } from '../../../domain/services/email-sender.interface.js';
import { SMS_SENDER } from '../../../domain/services/sms-sender.interface.js';
import type { ISmsSender } from '../../../domain/services/sms-sender.interface.js';
import { requirePermission } from '../_helpers/admin-authorization.helper.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';
import type { DueCollectionReminder } from '../../../domain/entities/billing.entity.js';
import { DispatchDueCollectionRemindersResultDto } from '../../dtos/billing/billing-response.dto.js';

const PUSHER_CHANNEL = 'collection-reminders';
const PUSHER_EVENT = 'collection-reminder.due';

@Injectable()
export class DispatchDueCollectionRemindersUseCase {
  private readonly logger = new Logger(DispatchDueCollectionRemindersUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(BILLING_REPOSITORY) private readonly billing: IBillingRepository,
    @Inject(REALTIME_NOTIFIER) private readonly realtime: IRealtimeNotifier,
    @Optional() @Inject(EMAIL_SENDER) private readonly email: IEmailSender | null,
    @Optional() @Inject(SMS_SENDER) private readonly sms: ISmsSender | null,
  ) {}

  /** Cron / system path — no actor permission check. */
  async executeSystem(now: Date = new Date()): Promise<DispatchDueCollectionRemindersResultDto> {
    return this.dispatch(now);
  }

  /** Manual HTTP path — requires MANAGE_BILLING. */
  async execute(
    actorId: string,
    now: Date = new Date(),
  ): Promise<DispatchDueCollectionRemindersResultDto> {
    await requirePermission(this.users, actorId, PermissionCode.MANAGE_BILLING);
    return this.dispatch(now);
  }

  private async dispatch(
    now: Date,
  ): Promise<DispatchDueCollectionRemindersResultDto> {
    const claimed = await this.billing.claimDueReminders(now);
    const reminderIds: string[] = [];
    let pushCount = 0;
    let emailCount = 0;
    let smsCount = 0;

    for (const due of claimed) {
      reminderIds.push(due.reminder.id);
      const channels = await this.notify(due);
      pushCount += channels.push ? 1 : 0;
      emailCount += channels.email ? 1 : 0;
      smsCount += channels.sms ? 1 : 0;
    }

    return DispatchDueCollectionRemindersResultDto.create({
      claimed: claimed.length,
      reminderIds,
      pushCount,
      emailCount,
      smsCount,
    });
  }

  private async notify(
    due: DueCollectionReminder,
  ): Promise<{ push: boolean; email: boolean; sms: boolean }> {
    const result = { push: false, email: false, sms: false };
    const r = due.reminder;
    const body =
      r.messageEn?.trim() ||
      `Collection reminder: ${r.titleEn} (invoice ${due.invoiceNumber})`;
    const payload: Record<string, unknown> = {
      id: r.id,
      invoiceId: r.invoiceId,
      invoiceNumber: due.invoiceNumber,
      scheduledFor: r.scheduledFor.toISOString(),
      status: r.status,
      titleEn: r.titleEn,
      titleMm: r.titleMm,
      messageEn: r.messageEn,
      messageMm: r.messageMm,
      assignedToUserId: r.assignedToUserId,
      notifiedAt: r.notifiedAt?.toISOString() ?? null,
      alarm: true,
    };

    try {
      await this.realtime.trigger({
        channel: PUSHER_CHANNEL,
        event: PUSHER_EVENT,
        data: payload,
      });
      if (r.assignedToUserId) {
        await this.realtime.trigger({
          channel: `user-${r.assignedToUserId}`,
          event: PUSHER_EVENT,
          data: payload,
        });
      }
      result.push = true;
    } catch (err: unknown) {
      this.logger.error(
        `Pusher failed for reminder ${r.id}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    const assignee = due.assignee;
    if (assignee && this.email) {
      try {
        await this.email.send({
          to: assignee.email,
          subject: `[Collection] ${r.titleEn} — ${due.invoiceNumber}`,
          text: body,
          html: `<p>${escapeHtml(body)}</p><p>Invoice: <strong>${escapeHtml(due.invoiceNumber)}</strong></p>`,
        });
        result.email = true;
      } catch (err: unknown) {
        this.logger.error(
          `Email failed for reminder ${r.id}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    if (assignee?.phone && this.sms) {
      try {
        await this.sms.send({
          to: assignee.phone,
          message: body.slice(0, 160),
          clientReference: r.id,
        });
        result.sms = true;
      } catch (err: unknown) {
        this.logger.error(
          `SMS failed for reminder ${r.id}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    return result;
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
