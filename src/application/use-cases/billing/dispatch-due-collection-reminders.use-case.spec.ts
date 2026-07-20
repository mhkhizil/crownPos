import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import {
  CollectionReminderEntity,
  DueCollectionReminder,
  DueCollectionReminderAssignee,
} from '../../../domain/entities/billing.entity.js';
import { UserEntity } from '../../../domain/entities/user.entity.js';
import { CollectionReminderStatus } from '../../../domain/enums/collection-reminder-status.enum.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';
import { UserStatus } from '../../../domain/enums/user-status.enum.js';
import type { IBillingRepository } from '../../../domain/repositories/billing.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import type { IRealtimeNotifier } from '../../../domain/services/realtime-notifier.interface.js';
import type { IEmailSender } from '../../../domain/services/email-sender.interface.js';
import type { ISmsSender } from '../../../domain/services/sms-sender.interface.js';
import { DispatchDueCollectionRemindersUseCase } from './dispatch-due-collection-reminders.use-case.js';

function buildUser(overrides: Partial<UserEntity> = {}): UserEntity {
  return new UserEntity({
    id: 'user-1',
    companyId: null,
    email: 'bill@test.com',
    passwordHash: 'hash',
    nameEn: 'Bill',
    nameMm: null,
    phone: '+959111111111',
    isRoot: true,
    status: UserStatus.ACTIVE,
    lastLoginAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    deletedAt: null,
    ...overrides,
  });
}

function dueReminder(
  overrides: Partial<{
    assignedToUserId: string | null;
    assignee: DueCollectionReminderAssignee | null;
  }> = {},
): DueCollectionReminder {
  const assignedToUserId =
    overrides.assignedToUserId === undefined
      ? 'collector-1'
      : overrides.assignedToUserId;
  const reminder = new CollectionReminderEntity(
    'rem-1',
    'inv-1',
    new Date('2026-07-18T09:00:00.000Z'),
    CollectionReminderStatus.NOTIFIED,
    'Call shop for payment',
    null,
    'Please collect balance',
    null,
    assignedToUserId,
    'user-1',
    new Date('2026-07-19T09:00:00.000Z'),
    null,
    new Date(),
    new Date(),
    null,
  );
  const assignee =
    overrides.assignee === undefined
      ? new DueCollectionReminderAssignee(
          'collector-1',
          'Collector',
          'collector@test.com',
          '+959222222222',
        )
      : overrides.assignee;
  return new DueCollectionReminder(reminder, 'INV-100', assignee);
}

describe('DispatchDueCollectionRemindersUseCase', () => {
  const users: jest.Mocked<
    Pick<IUserRepository, 'findById' | 'getAuthDataByUserId'>
  > = {
    findById: jest.fn(),
    getAuthDataByUserId: jest.fn(),
  };
  const billing: jest.Mocked<Pick<IBillingRepository, 'claimDueReminders'>> = {
    claimDueReminders: jest.fn(),
  };
  const realtime: jest.Mocked<IRealtimeNotifier> = {
    trigger: jest.fn(),
  };
  const email: jest.Mocked<IEmailSender> = {
    send: jest.fn(),
  };
  const sms: jest.Mocked<ISmsSender> = {
    send: jest.fn(),
  };

  let useCase: DispatchDueCollectionRemindersUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    users.findById.mockResolvedValue(buildUser());
    users.getAuthDataByUserId.mockResolvedValue({
      user: buildUser({ isRoot: false }),
      roles: [],
      permissionCodes: [PermissionCode.MANAGE_BILLING],
    });
    realtime.trigger.mockResolvedValue(undefined);
    email.send.mockResolvedValue(undefined);
    sms.send.mockResolvedValue(undefined);
    useCase = new DispatchDueCollectionRemindersUseCase(
      users as unknown as IUserRepository,
      billing as unknown as IBillingRepository,
      realtime,
      email,
      sms,
    );
  });

  it('claims due reminders and fires Pusher + email + SMS', async () => {
    billing.claimDueReminders.mockResolvedValue([dueReminder()]);

    const result = await useCase.execute('user-1');

    expect(result.claimed).toBe(1);
    expect(result.reminderIds).toEqual(['rem-1']);
    expect(result.pushCount).toBe(1);
    expect(result.emailCount).toBe(1);
    expect(result.smsCount).toBe(1);
    expect(realtime.trigger).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: 'collection-reminders',
        event: 'collection-reminder.due',
      }),
    );
    expect(realtime.trigger).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: 'user-collector-1',
        event: 'collection-reminder.due',
      }),
    );
    expect(email.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'collector@test.com' }),
    );
    expect(sms.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: '+959222222222' }),
    );
  });

  it('executeSystem skips permission check', async () => {
    billing.claimDueReminders.mockResolvedValue([]);
    await useCase.executeSystem();
    expect(users.findById).not.toHaveBeenCalled();
    expect(billing.claimDueReminders).toHaveBeenCalled();
  });

  it('still counts push when email/sms ports are null', async () => {
    useCase = new DispatchDueCollectionRemindersUseCase(
      users as unknown as IUserRepository,
      billing as unknown as IBillingRepository,
      realtime,
      null,
      null,
    );
    billing.claimDueReminders.mockResolvedValue([dueReminder()]);
    const result = await useCase.executeSystem();
    expect(result.pushCount).toBe(1);
    expect(result.emailCount).toBe(0);
    expect(result.smsCount).toBe(0);
  });

  it('rejects actor without MANAGE_BILLING', async () => {
    users.findById.mockResolvedValue(buildUser({ isRoot: false }));
    users.getAuthDataByUserId.mockResolvedValue({
      user: buildUser({ isRoot: false }),
      roles: [],
      permissionCodes: [],
    });
    await expect(useCase.execute('user-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
