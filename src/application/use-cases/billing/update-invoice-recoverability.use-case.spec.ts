import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { UserEntity } from '../../../domain/entities/user.entity.js';
import {
  InvoiceEntity,
  InvoiceLineEntity,
} from '../../../domain/entities/billing.entity.js';
import { InvoiceRecoverability } from '../../../domain/enums/invoice-recoverability.enum.js';
import { InvoiceStatus } from '../../../domain/enums/invoice-status.enum.js';
import { UserStatus } from '../../../domain/enums/user-status.enum.js';
import type { IBillingRepository } from '../../../domain/repositories/billing.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { UpdateInvoiceRecoverabilityUseCase } from './update-invoice-recoverability.use-case.js';

function buildUser(): UserEntity {
  return new UserEntity({
    id: 'user-1',
    companyId: null,
    email: 'b@test.com',
    passwordHash: 'hash',
    nameEn: 'B',
    nameMm: null,
    phone: null,
    isRoot: true,
    status: UserStatus.ACTIVE,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  });
}

function invoice(
  recoverability: InvoiceRecoverability = InvoiceRecoverability.LIKELY,
): InvoiceEntity {
  return new InvoiceEntity(
    'inv-1',
    'INV-1',
    'cust-1',
    'order-1',
    new Date('2026-07-19'),
    null,
    InvoiceStatus.ISSUED,
    recoverability,
    1000,
    1000,
    0,
    1000,
    [] as InvoiceLineEntity[],
    new Date(),
    new Date(),
    null,
  );
}

describe('UpdateInvoiceRecoverabilityUseCase', () => {
  const users = {
    findById: jest.fn(),
    getAuthDataByUserId: jest.fn(),
  };
  const billing = {
    findInvoiceById: jest.fn(),
    updateInvoiceRecoverability: jest.fn(),
  };

  let useCase: UpdateInvoiceRecoverabilityUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    users.findById.mockResolvedValue(buildUser());
    useCase = new UpdateInvoiceRecoverabilityUseCase(
      users as unknown as IUserRepository,
      billing as unknown as IBillingRepository,
    );
  });

  it('updates recoverability for zakat AR filtering', async () => {
    billing.findInvoiceById.mockResolvedValue(invoice());
    billing.updateInvoiceRecoverability.mockResolvedValue(
      invoice(InvoiceRecoverability.DOUBTFUL),
    );

    const r = await useCase.execute('user-1', 'inv-1', {
      recoverability: InvoiceRecoverability.DOUBTFUL,
    });

    expect(billing.updateInvoiceRecoverability).toHaveBeenCalledWith(
      'inv-1',
      InvoiceRecoverability.DOUBTFUL,
    );
    expect(r.recoverability).toBe(InvoiceRecoverability.DOUBTFUL);
  });

  it('404 when invoice missing', async () => {
    billing.findInvoiceById.mockResolvedValue(null);
    await expect(
      useCase.execute('user-1', 'missing', {
        recoverability: InvoiceRecoverability.HOPELESS,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
