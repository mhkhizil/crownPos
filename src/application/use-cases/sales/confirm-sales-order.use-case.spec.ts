import { jest } from '@jest/globals';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { UserEntity } from '../../../domain/entities/user.entity.js';
import {
  SalesOrderEntity,
  SalesOrderLineEntity,
} from '../../../domain/entities/sales-order.entity.js';
import { DeliveryChannel } from '../../../domain/enums/delivery-channel.enum.js';
import { OrderSource } from '../../../domain/enums/order-source.enum.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';
import { SalesOrderStatus } from '../../../domain/enums/sales-order-status.enum.js';
import { UserStatus } from '../../../domain/enums/user-status.enum.js';
import type { ISalesRepository } from '../../../domain/repositories/sales.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { ConfirmSalesOrderUseCase } from './confirm-sales-order.use-case.js';
import { CreateSalesOrderUseCase } from './create-sales-order.use-case.js';

function buildUser(overrides: Partial<UserEntity> = {}): UserEntity {
  return new UserEntity({
    id: 'user-1',
    companyId: null,
    email: 'staff@test.com',
    passwordHash: 'hash',
    nameEn: 'Staff',
    nameMm: null,
    phone: null,
    isRoot: false,
    status: UserStatus.ACTIVE,
    lastLoginAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    deletedAt: null,
    ...overrides,
  });
}

function buildDraftOrder(
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
    status: SalesOrderStatus.DRAFT,
    hasSufficientStock: null,
    stockCheckNotes: null,
    stockCheckedAt: null,
    goodsReceivedAt: null,
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

describe('ConfirmSalesOrderUseCase (L2)', () => {
  it('confirms when stock is sufficient', async () => {
    const users = usersMock();
    const sales = salesMock();
    users.findById.mockResolvedValue(buildUser({ isRoot: true }));
    sales.getSalesOrder.mockResolvedValue(buildDraftOrder());
    const confirmed = buildDraftOrder({
      status: SalesOrderStatus.CONFIRMED,
      hasSufficientStock: true,
    });
    sales.confirmWithStockCheck.mockResolvedValue({
      entity: confirmed,
      shortages: [],
    });

    const uc = new ConfirmSalesOrderUseCase(users, sales);
    const result = await uc.execute('user-1', 'order-1');

    expect(result.status).toBe(SalesOrderStatus.CONFIRMED);
    expect(sales.confirmWithStockCheck).toHaveBeenCalledWith('order-1');
  });

  it('places order on HOLD and throws when stock is insufficient', async () => {
    const users = usersMock();
    const sales = salesMock();
    users.findById.mockResolvedValue(buildUser({ isRoot: true }));
    sales.getSalesOrder.mockResolvedValue(buildDraftOrder());
    const held = buildDraftOrder({
      status: SalesOrderStatus.HOLD,
      hasSufficientStock: false,
      stockCheckNotes: 'Insufficient',
    });
    sales.confirmWithStockCheck.mockResolvedValue({
      entity: held,
      shortages: ['sku-1: need 10, have 2 (physical 2, reserved 0)'],
    });

    const uc = new ConfirmSalesOrderUseCase(users, sales);
    await expect(uc.execute('user-1', 'order-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(sales.confirmWithStockCheck).toHaveBeenCalledWith('order-1');
  });

  it('can confirm from HOLD when stock becomes available', async () => {
    const users = usersMock();
    const sales = salesMock();
    users.findById.mockResolvedValue(buildUser({ isRoot: true }));
    sales.getSalesOrder.mockResolvedValue(
      buildDraftOrder({ status: SalesOrderStatus.HOLD }),
    );
    sales.confirmWithStockCheck.mockResolvedValue({
      entity: buildDraftOrder({
        status: SalesOrderStatus.CONFIRMED,
        hasSufficientStock: true,
      }),
      shortages: [],
    });

    const uc = new ConfirmSalesOrderUseCase(users, sales);
    const result = await uc.execute('user-1', 'order-1');
    expect(result.status).toBe(SalesOrderStatus.CONFIRMED);
  });

  it('denies actor without MANAGE_SALES', async () => {
    const users = usersMock();
    const sales = salesMock();
    users.findById.mockResolvedValue(buildUser({ isRoot: false }));
    users.getAuthDataByUserId.mockResolvedValue({
      user: buildUser(),
      roles: [],
      permissionCodes: [PermissionCode.MANAGE_PRODUCTION],
    });

    const uc = new ConfirmSalesOrderUseCase(users, sales);
    await expect(uc.execute('user-1', 'order-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(sales.getSalesOrder).not.toHaveBeenCalled();
  });
});

describe('CreateSalesOrderUseCase permissions (L2)', () => {
  it('denies actor without MANAGE_SALES', async () => {
    const users = usersMock();
    const sales = salesMock();
    users.findById.mockResolvedValue(buildUser({ isRoot: false }));
    users.getAuthDataByUserId.mockResolvedValue({
      user: buildUser(),
      roles: [],
      permissionCodes: [],
    });

    const uc = new CreateSalesOrderUseCase(users, sales);
    await expect(
      uc.execute('user-1', {
        customerId: 'c1',
        orderDate: '2026-07-01',
        orderSource: OrderSource.SHOP_INBOUND_CALL,
        deliveryChannel: DeliveryChannel.DIRECT_TO_SHOP,
        lines: [
          {
            productSkuId: 'sku-1',
            unitId: 'u1',
            quantity: 1,
            unitPriceMmk: 100,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(sales.createSalesOrder).not.toHaveBeenCalled();
  });
});
