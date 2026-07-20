import { jest } from '@jest/globals';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InvoiceEntity } from '../../../domain/entities/billing.entity.js';
import { SalesOrderEntity } from '../../../domain/entities/sales-order.entity.js';
import { UserEntity } from '../../../domain/entities/user.entity.js';
import { DeliveryChannel } from '../../../domain/enums/delivery-channel.enum.js';
import { InvoiceStatus } from '../../../domain/enums/invoice-status.enum.js';
import { OrderSource } from '../../../domain/enums/order-source.enum.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';
import { SalesOrderStatus } from '../../../domain/enums/sales-order-status.enum.js';
import { UserStatus } from '../../../domain/enums/user-status.enum.js';
import type { IBillingRepository } from '../../../domain/repositories/billing.repository.interface.js';
import type { ISalesRepository } from '../../../domain/repositories/sales.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { CreateInvoiceFromOrderUseCase } from './create-invoice-from-order.use-case.js';

function buildUser(overrides: Partial<UserEntity> = {}): UserEntity {
  return new UserEntity({
    id: 'user-1',
    companyId: null,
    email: 'bill@test.com',
    passwordHash: 'hash',
    nameEn: 'Bill',
    nameMm: null,
    phone: null,
    isRoot: true,
    status: UserStatus.ACTIVE,
    lastLoginAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    deletedAt: null,
    ...overrides,
  });
}

function order(status: SalesOrderStatus): SalesOrderEntity {
  return new SalesOrderEntity({
    id: 'order-1',
    orderNumber: 'SO-1',
    customerId: 'cust-1',
    orderDate: new Date('2026-07-19'),
    orderSource: OrderSource.SHOP_INBOUND_CALL,
    takenByUserId: 'user-1',
    deliveryChannel: DeliveryChannel.DIRECT_TO_SHOP,
    customerReceiveMode: null,
    status,
    hasSufficientStock: true,
    stockCheckNotes: null,
    stockCheckedAt: null,
    goodsReceivedAt:
      status === SalesOrderStatus.GOODS_RECEIVED ? new Date() : null,
    saleOkAt: null,
    notes: null,
    lines: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  });
}

function invoice(): InvoiceEntity {
  return new InvoiceEntity(
    'inv-1',
    'INV-1',
    'cust-1',
    'order-1',
    new Date('2026-07-19'),
    null,
    InvoiceStatus.ISSUED,
    1000,
    1000,
    0,
    1000,
    [],
    new Date(),
    new Date(),
    null,
  );
}

describe('CreateInvoiceFromOrderUseCase', () => {
  it('advances GOODS_RECEIVED → AWAITING_PAYMENT after creating invoice', async () => {
    const users = {
      findById: jest.fn().mockResolvedValue(buildUser()),
      getAuthDataByUserId: jest.fn(),
    } as unknown as jest.Mocked<IUserRepository>;
    const billing = {
      createInvoiceFromOrder: jest.fn().mockResolvedValue(invoice()),
      hasActiveInvoiceForSalesOrder: jest.fn().mockResolvedValue(false),
    } as unknown as jest.Mocked<IBillingRepository>;
    const sales = {
      getSalesOrder: jest
        .fn()
        .mockResolvedValue(order(SalesOrderStatus.GOODS_RECEIVED)),
      updateOrderStatus: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<ISalesRepository>;

    const uc = new CreateInvoiceFromOrderUseCase(users, billing, sales);
    await uc.execute('user-1', 'order-1');

    expect(billing.createInvoiceFromOrder).toHaveBeenCalledWith(
      'order-1',
      undefined,
    );
    expect(sales.updateOrderStatus).toHaveBeenCalledWith(
      'order-1',
      SalesOrderStatus.AWAITING_PAYMENT,
    );
  });

  it('does not change status when order is still CONFIRMED', async () => {
    const users = {
      findById: jest.fn().mockResolvedValue(buildUser()),
    } as unknown as jest.Mocked<IUserRepository>;
    const billing = {
      createInvoiceFromOrder: jest.fn().mockResolvedValue(invoice()),
      hasActiveInvoiceForSalesOrder: jest.fn().mockResolvedValue(false),
    } as unknown as jest.Mocked<IBillingRepository>;
    const sales = {
      getSalesOrder: jest
        .fn()
        .mockResolvedValue(order(SalesOrderStatus.CONFIRMED)),
      updateOrderStatus: jest.fn(),
    } as unknown as jest.Mocked<ISalesRepository>;

    const uc = new CreateInvoiceFromOrderUseCase(users, billing, sales);
    await uc.execute('user-1', 'order-1');
    expect(sales.updateOrderStatus).not.toHaveBeenCalled();
  });

  it('rejects DRAFT / HOLD orders', async () => {
    const users = {
      findById: jest.fn().mockResolvedValue(buildUser()),
    } as unknown as jest.Mocked<IUserRepository>;
    const billing = {
      createInvoiceFromOrder: jest.fn(),
      hasActiveInvoiceForSalesOrder: jest.fn(),
    } as unknown as jest.Mocked<IBillingRepository>;
    const sales = {
      getSalesOrder: jest.fn().mockResolvedValue(order(SalesOrderStatus.DRAFT)),
      updateOrderStatus: jest.fn(),
    } as unknown as jest.Mocked<ISalesRepository>;

    const uc = new CreateInvoiceFromOrderUseCase(users, billing, sales);
    await expect(uc.execute('user-1', 'order-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(billing.createInvoiceFromOrder).not.toHaveBeenCalled();
  });

  it('rejects when an active invoice already exists', async () => {
    const users = {
      findById: jest.fn().mockResolvedValue(buildUser()),
    } as unknown as jest.Mocked<IUserRepository>;
    const billing = {
      createInvoiceFromOrder: jest.fn(),
      hasActiveInvoiceForSalesOrder: jest.fn().mockResolvedValue(true),
    } as unknown as jest.Mocked<IBillingRepository>;
    const sales = {
      getSalesOrder: jest
        .fn()
        .mockResolvedValue(order(SalesOrderStatus.GOODS_RECEIVED)),
      updateOrderStatus: jest.fn(),
    } as unknown as jest.Mocked<ISalesRepository>;

    const uc = new CreateInvoiceFromOrderUseCase(users, billing, sales);
    await expect(uc.execute('user-1', 'order-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('404 when order missing', async () => {
    const users = {
      findById: jest.fn().mockResolvedValue(buildUser()),
    } as unknown as jest.Mocked<IUserRepository>;
    const billing = {
      createInvoiceFromOrder: jest.fn(),
      hasActiveInvoiceForSalesOrder: jest.fn(),
    } as unknown as jest.Mocked<IBillingRepository>;
    const sales = {
      getSalesOrder: jest.fn().mockResolvedValue(null),
      updateOrderStatus: jest.fn(),
    } as unknown as jest.Mocked<ISalesRepository>;

    const uc = new CreateInvoiceFromOrderUseCase(users, billing, sales);
    await expect(uc.execute('user-1', 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('denies without MANAGE_BILLING', async () => {
    const users = {
      findById: jest.fn().mockResolvedValue(buildUser({ isRoot: false })),
      getAuthDataByUserId: jest.fn().mockResolvedValue({
        user: buildUser({ isRoot: false }),
        roles: [],
        permissionCodes: [PermissionCode.MANAGE_SALES],
      }),
    } as unknown as jest.Mocked<IUserRepository>;
    const billing = {} as jest.Mocked<IBillingRepository>;
    const sales = {} as jest.Mocked<ISalesRepository>;

    const uc = new CreateInvoiceFromOrderUseCase(users, billing, sales);
    await expect(uc.execute('user-1', 'order-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
