import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import {
  SalesOrderEntity,
  SalesOrderLineEntity,
} from '../../../domain/entities/sales-order.entity.js';
import { UserEntity } from '../../../domain/entities/user.entity.js';
import { DeliveryChannel } from '../../../domain/enums/delivery-channel.enum.js';
import { InvoiceStatus } from '../../../domain/enums/invoice-status.enum.js';
import { OrderSource } from '../../../domain/enums/order-source.enum.js';
import { PaymentMethod } from '../../../domain/enums/payment-method.enum.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';
import { SalesOrderStatus } from '../../../domain/enums/sales-order-status.enum.js';
import { UserStatus } from '../../../domain/enums/user-status.enum.js';
import type { IBillingRepository } from '../../../domain/repositories/billing.repository.interface.js';
import type { ISalesRepository } from '../../../domain/repositories/sales.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { PaymentEntity } from '../../../domain/entities/billing.entity.js';
import { PaymentStatus } from '../../../domain/enums/payment-status.enum.js';
import { RecordPaymentUseCase } from './record-payment.use-case.js';

function buildUser(overrides: Partial<UserEntity> = {}): UserEntity {
  return new UserEntity({
    id: 'user-1',
    companyId: null,
    email: 'billing@test.com',
    passwordHash: 'hash',
    nameEn: 'Billing',
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

function buildOrder(
  overrides: Partial<SalesOrderEntity> = {},
): SalesOrderEntity {
  const line = new SalesOrderLineEntity({
    id: 'line-1',
    salesOrderId: 'order-1',
    productSkuId: 'sku-1',
    unitId: 'unit-1',
    quantity: 10,
    unitPriceMmk: 1000,
    lineTotalMmk: 10_000,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  });
  return new SalesOrderEntity({
    id: 'order-1',
    orderNumber: 'SO-1',
    customerId: 'cust-1',
    orderDate: new Date('2026-07-01'),
    orderSource: OrderSource.SHOP_INBOUND_CALL,
    takenByUserId: 'user-1',
    deliveryChannel: DeliveryChannel.DIRECT_TO_SHOP,
    customerReceiveMode: null,
    status: SalesOrderStatus.AWAITING_PAYMENT,
    hasSufficientStock: true,
    stockCheckNotes: 'OK',
    stockCheckedAt: new Date(),
    goodsReceivedAt: new Date('2026-07-10'),
    saleOkAt: null,
    notes: null,
    lines: [line],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  });
}

function usersMock(): jest.Mocked<IUserRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    listStaff: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    getAuthDataByUserId: jest.fn(),
    setUserRoles: jest.fn(),
    addUserRole: jest.fn(),
    removeUserRole: jest.fn(),
  };
}

function salesMock(): jest.Mocked<ISalesRepository> {
  return {
    createSalesOrder: jest.fn(),
    applyStockCheck: jest.fn(),
    confirmWithStockCheck: jest.fn(),
    listSalesOrders: jest.fn(),
    getSalesOrder: jest.fn(),
    updateOrderStatus: jest.fn(),
  };
}

function billingMock(): jest.Mocked<IBillingRepository> {
  return {
    createInvoiceFromOrder: jest.fn(),
    recordPayment: jest.fn(),
    createCollectionReminder: jest.fn(),
    isSalesOrderFullyPaid: jest.fn(),
    hasActiveInvoiceForSalesOrder: jest.fn(),
    listInvoices: jest.fn(),
    listPayments: jest.fn(),
    listReminders: jest.fn(),
    claimDueReminders: jest.fn(),
  };
}

function paymentEntity(): PaymentEntity {
  return new PaymentEntity(
    'pay-1',
    'PAY-1',
    new Date('2026-07-19'),
    PaymentMethod.CASH_ON_DELIVERY,
    PaymentStatus.CONFIRMED,
    5000,
    null,
    null,
    [],
    new Date(),
    new Date(),
    null,
  );
}

describe('RecordPaymentUseCase (L2)', () => {
  it('partial payment after receive keeps order AWAITING_PAYMENT', async () => {
    const users = usersMock();
    const billing = billingMock();
    const sales = salesMock();
    users.findById.mockResolvedValue(buildUser());
    sales.getSalesOrder.mockResolvedValue(buildOrder());
    billing.isSalesOrderFullyPaid.mockResolvedValue(false);
    billing.recordPayment.mockResolvedValue({
      payment: paymentEntity(),
      invoiceEffects: [
        {
          invoiceId: 'inv-1',
          salesOrderId: 'order-1',
          status: InvoiceStatus.PARTIALLY_PAID,
        },
      ],
    });

    const uc = new RecordPaymentUseCase(users, billing, sales);
    await uc.execute('user-1', {
      paymentDate: '2026-07-19',
      method: PaymentMethod.CASH_ON_DELIVERY,
      amountMmk: 5000,
      allocations: [{ invoiceId: 'inv-1', amountMmk: 5000 }],
    });

    expect(sales.updateOrderStatus).toHaveBeenCalledWith(
      'order-1',
      SalesOrderStatus.AWAITING_PAYMENT,
    );
  });

  it('full payment after receive sets SALE_OK with saleOkAt', async () => {
    const users = usersMock();
    const billing = billingMock();
    const sales = salesMock();
    users.findById.mockResolvedValue(buildUser());
    sales.getSalesOrder.mockResolvedValue(buildOrder());
    billing.isSalesOrderFullyPaid.mockResolvedValue(true);
    billing.recordPayment.mockResolvedValue({
      payment: paymentEntity(),
      invoiceEffects: [
        {
          invoiceId: 'inv-1',
          salesOrderId: 'order-1',
          status: InvoiceStatus.PAID,
        },
      ],
    });

    const uc = new RecordPaymentUseCase(users, billing, sales);
    await uc.execute('user-1', {
      paymentDate: '2026-07-19',
      method: PaymentMethod.BANK_TRANSFER,
      amountMmk: 10_000,
      allocations: [{ invoiceId: 'inv-1', amountMmk: 10_000 }],
    });

    expect(billing.isSalesOrderFullyPaid).toHaveBeenCalledWith('order-1');
    expect(sales.updateOrderStatus).toHaveBeenCalledWith(
      'order-1',
      SalesOrderStatus.SALE_OK,
      expect.objectContaining({ saleOkAt: expect.any(Date) }),
    );
  });

  it('paying one invoice keeps AWAITING_PAYMENT when sibling invoices remain unpaid', async () => {
    const users = usersMock();
    const billing = billingMock();
    const sales = salesMock();
    users.findById.mockResolvedValue(buildUser());
    sales.getSalesOrder.mockResolvedValue(buildOrder());
    billing.isSalesOrderFullyPaid.mockResolvedValue(false);
    billing.recordPayment.mockResolvedValue({
      payment: paymentEntity(),
      invoiceEffects: [
        {
          invoiceId: 'inv-a',
          salesOrderId: 'order-1',
          status: InvoiceStatus.PAID,
        },
      ],
    });

    const uc = new RecordPaymentUseCase(users, billing, sales);
    await uc.execute('user-1', {
      paymentDate: '2026-07-19',
      method: PaymentMethod.BANK_TRANSFER,
      amountMmk: 10_000,
      allocations: [{ invoiceId: 'inv-a', amountMmk: 10_000 }],
    });

    expect(sales.updateOrderStatus).toHaveBeenCalledWith(
      'order-1',
      SalesOrderStatus.AWAITING_PAYMENT,
    );
    expect(sales.updateOrderStatus).not.toHaveBeenCalledWith(
      'order-1',
      SalesOrderStatus.SALE_OK,
      expect.anything(),
    );
  });

  it('does not regress SALE_OK when a later partial payment lands', async () => {
    const users = usersMock();
    const billing = billingMock();
    const sales = salesMock();
    users.findById.mockResolvedValue(buildUser());
    sales.getSalesOrder.mockResolvedValue(
      buildOrder({
        status: SalesOrderStatus.SALE_OK,
        saleOkAt: new Date('2026-07-18'),
      }),
    );
    billing.recordPayment.mockResolvedValue({
      payment: paymentEntity(),
      invoiceEffects: [
        {
          invoiceId: 'inv-b',
          salesOrderId: 'order-1',
          status: InvoiceStatus.PARTIALLY_PAID,
        },
      ],
    });

    const uc = new RecordPaymentUseCase(users, billing, sales);
    await uc.execute('user-1', {
      paymentDate: '2026-07-19',
      method: PaymentMethod.CASH_ON_DELIVERY,
      amountMmk: 100,
      allocations: [{ invoiceId: 'inv-b', amountMmk: 100 }],
    });

    expect(billing.isSalesOrderFullyPaid).not.toHaveBeenCalled();
    expect(sales.updateOrderStatus).not.toHaveBeenCalled();
  });

  it('full payment before receive does not set SALE_OK', async () => {
    const users = usersMock();
    const billing = billingMock();
    const sales = salesMock();
    users.findById.mockResolvedValue(buildUser());
    sales.getSalesOrder.mockResolvedValue(
      buildOrder({
        status: SalesOrderStatus.CONFIRMED,
        goodsReceivedAt: null,
      }),
    );
    billing.recordPayment.mockResolvedValue({
      payment: paymentEntity(),
      invoiceEffects: [
        {
          invoiceId: 'inv-1',
          salesOrderId: 'order-1',
          status: InvoiceStatus.PAID,
        },
      ],
    });

    const uc = new RecordPaymentUseCase(users, billing, sales);
    await uc.execute('user-1', {
      paymentDate: '2026-07-19',
      method: PaymentMethod.CASH_ON_DELIVERY,
      amountMmk: 10_000,
      allocations: [{ invoiceId: 'inv-1', amountMmk: 10_000 }],
    });

    expect(sales.updateOrderStatus).not.toHaveBeenCalled();
  });

  it('denies actor without MANAGE_BILLING', async () => {
    const users = usersMock();
    const billing = billingMock();
    const sales = salesMock();
    users.findById.mockResolvedValue(buildUser({ isRoot: false }));
    users.getAuthDataByUserId.mockResolvedValue({
      user: buildUser({ isRoot: false }),
      roles: [],
      permissionCodes: [PermissionCode.MANAGE_SALES],
    });

    const uc = new RecordPaymentUseCase(users, billing, sales);
    await expect(
      uc.execute('user-1', {
        paymentDate: '2026-07-19',
        method: PaymentMethod.CASH_ON_DELIVERY,
        amountMmk: 100,
        allocations: [{ invoiceId: 'inv-1', amountMmk: 100 }],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(billing.recordPayment).not.toHaveBeenCalled();
  });
});
