import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import {
  PurchaseOrderEntity,
  PurchaseOrderLineEntity,
} from '../../../domain/entities/purchase-order.entity.js';
import { UserEntity } from '../../../domain/entities/user.entity.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';
import { PurchaseStatus } from '../../../domain/enums/purchase-status.enum.js';
import { UserStatus } from '../../../domain/enums/user-status.enum.js';
import type { IInventoryRepository } from '../../../domain/repositories/inventory.repository.interface.js';
import type { IPurchaseRepository } from '../../../domain/repositories/purchase.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { ReceivePurchaseOrderUseCase } from './receive-purchase-order.use-case.js';
import { CreatePurchaseOrderUseCase } from './create-purchase-order.use-case.js';

function buildUser(overrides: Partial<UserEntity> = {}): UserEntity {
  return new UserEntity({
    id: 'user-1',
    companyId: null,
    email: 'inv@test.com',
    passwordHash: 'hash',
    nameEn: 'Inv',
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

function purchaseEntity(
  status: PurchaseStatus = PurchaseStatus.ORDERED,
  received = 0,
): PurchaseOrderEntity {
  return new PurchaseOrderEntity(
    'po-1',
    'factory-1',
    'supplier-1',
    'PO-1',
    new Date('2026-07-19'),
    status,
    50_000,
    0,
    null,
    [
      new PurchaseOrderLineEntity(
        'line-1',
        'po-1',
        'raw-1',
        'unit-1',
        100,
        received,
        500,
        50_000,
      ),
    ],
    new Date(),
    new Date(),
    null,
  );
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

function purchasesMock(): jest.Mocked<IPurchaseRepository> {
  return {
    createPurchaseOrder: jest.fn(),
    listPurchaseOrders: jest.fn(),
    getPurchaseOrder: jest.fn(),
    receivePurchaseOrder: jest.fn(),
    cancelPurchaseOrder: jest.fn(),
    recordPurchasePayment: jest.fn(),
    getSupplierPayables: jest.fn(),
    sumOpenSupplierPayablesMmk: jest.fn(),
  };
}

function inventoryMock(): jest.Mocked<IInventoryRepository> {
  return {
    recordDailyStockCount: jest.fn(),
    listInventoryBalances: jest.fn(),
    adjustBalance: jest.fn(),
    getAvailableQuantity: jest.fn(),
    primaryStockLocationId: jest.fn(),
    findPrimaryStockLocationId: jest.fn(),
  };
}

describe('ReceivePurchaseOrderUseCase', () => {
  it('receives qty and increases raw inventory atomically via receivePurchaseOrder', async () => {
    const users = usersMock();
    const purchases = purchasesMock();
    const inventory = inventoryMock();
    users.findById.mockResolvedValue(buildUser());
    purchases.getPurchaseOrder.mockResolvedValue(purchaseEntity());
    purchases.receivePurchaseOrder.mockResolvedValue(
      purchaseEntity(PurchaseStatus.PARTIALLY_RECEIVED, 40),
    );
    inventory.findPrimaryStockLocationId.mockResolvedValue('loc-1');

    const uc = new ReceivePurchaseOrderUseCase(users, purchases, inventory);
    const result = await uc.execute('user-1', 'po-1', {
      lines: [{ purchaseOrderLineId: 'line-1', quantityReceived: 40 }],
    });

    expect(result.status).toBe(PurchaseStatus.PARTIALLY_RECEIVED);
    expect(purchases.receivePurchaseOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        purchaseOrderId: 'po-1',
        lines: [{ purchaseOrderLineId: 'line-1', quantityReceived: 40 }],
        inventoryBumps: [
          expect.objectContaining({
            rawMaterialId: 'raw-1',
            delta: 40,
            stockLocationId: 'loc-1',
          }),
        ],
      }),
    );
    expect(inventory.adjustBalance).not.toHaveBeenCalled();
  });

  it('aggregates duplicate line ids before receive', async () => {
    const users = usersMock();
    const purchases = purchasesMock();
    const inventory = inventoryMock();
    users.findById.mockResolvedValue(buildUser());
    purchases.getPurchaseOrder.mockResolvedValue(purchaseEntity());
    purchases.receivePurchaseOrder.mockResolvedValue(
      purchaseEntity(PurchaseStatus.PARTIALLY_RECEIVED, 100),
    );
    inventory.findPrimaryStockLocationId.mockResolvedValue('loc-1');

    const uc = new ReceivePurchaseOrderUseCase(users, purchases, inventory);
    await uc.execute('user-1', 'po-1', {
      lines: [
        { purchaseOrderLineId: 'line-1', quantityReceived: 60 },
        { purchaseOrderLineId: 'line-1', quantityReceived: 40 },
      ],
    });

    expect(purchases.receivePurchaseOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        lines: [{ purchaseOrderLineId: 'line-1', quantityReceived: 100 }],
        inventoryBumps: [
          expect.objectContaining({ delta: 100, rawMaterialId: 'raw-1' }),
        ],
      }),
    );
  });

  it('idempotent when purchase already RECEIVED', async () => {
    const users = usersMock();
    const purchases = purchasesMock();
    const inventory = inventoryMock();
    users.findById.mockResolvedValue(buildUser());
    purchases.getPurchaseOrder.mockResolvedValue(
      purchaseEntity(PurchaseStatus.RECEIVED, 100),
    );

    const uc = new ReceivePurchaseOrderUseCase(users, purchases, inventory);
    const result = await uc.execute('user-1', 'po-1', {
      lines: [{ purchaseOrderLineId: 'line-1', quantityReceived: 100 }],
    });

    expect(result.status).toBe(PurchaseStatus.RECEIVED);
    expect(purchases.receivePurchaseOrder).not.toHaveBeenCalled();
    expect(inventory.adjustBalance).not.toHaveBeenCalled();
  });

  it('denies without MANAGE_INVENTORY', async () => {
    const users = usersMock();
    const purchases = purchasesMock();
    const inventory = inventoryMock();
    users.findById.mockResolvedValue(buildUser({ isRoot: false }));
    users.getAuthDataByUserId.mockResolvedValue({
      user: buildUser({ isRoot: false }),
      roles: [],
      permissionCodes: [PermissionCode.MANAGE_SALES],
    });

    const uc = new ReceivePurchaseOrderUseCase(users, purchases, inventory);
    await expect(
      uc.execute('user-1', 'po-1', {
        lines: [{ purchaseOrderLineId: 'line-1', quantityReceived: 1 }],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('CreatePurchaseOrderUseCase', () => {
  it('receiveImmediately creates then fully receives into inventory', async () => {
    const users = usersMock();
    const purchases = purchasesMock();
    const inventory = inventoryMock();
    users.findById.mockResolvedValue(buildUser());
    purchases.createPurchaseOrder.mockResolvedValue(purchaseEntity());
    purchases.getPurchaseOrder.mockResolvedValue(purchaseEntity());
    purchases.receivePurchaseOrder.mockResolvedValue(
      purchaseEntity(PurchaseStatus.RECEIVED, 100),
    );
    inventory.findPrimaryStockLocationId.mockResolvedValue('loc-1');

    const receiveUc = new ReceivePurchaseOrderUseCase(
      users,
      purchases,
      inventory,
    );
    const createUc = new CreatePurchaseOrderUseCase(
      users,
      purchases,
      receiveUc,
    );

    const result = await createUc.execute('user-1', {
      factoryId: 'factory-1',
      supplierId: 'supplier-1',
      orderDate: '2026-07-19',
      receiveImmediately: true,
      lines: [
        {
          rawMaterialId: 'raw-1',
          unitId: 'unit-1',
          quantityOrdered: 100,
          unitPriceMmk: 500,
        },
      ],
    });

    expect(result.status).toBe(PurchaseStatus.RECEIVED);
    expect(purchases.receivePurchaseOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        inventoryBumps: [
          expect.objectContaining({ delta: 100, rawMaterialId: 'raw-1' }),
        ],
      }),
    );
    expect(inventory.adjustBalance).not.toHaveBeenCalled();
  });

  it('without receiveImmediately does not touch inventory', async () => {
    const users = usersMock();
    const purchases = purchasesMock();
    const inventory = inventoryMock();
    users.findById.mockResolvedValue(buildUser());
    purchases.createPurchaseOrder.mockResolvedValue(purchaseEntity());

    const receiveUc = new ReceivePurchaseOrderUseCase(
      users,
      purchases,
      inventory,
    );
    const createUc = new CreatePurchaseOrderUseCase(
      users,
      purchases,
      receiveUc,
    );

    const result = await createUc.execute('user-1', {
      factoryId: 'factory-1',
      supplierId: 'supplier-1',
      orderDate: '2026-07-19',
      lines: [
        {
          rawMaterialId: 'raw-1',
          unitId: 'unit-1',
          quantityOrdered: 100,
          unitPriceMmk: 500,
        },
      ],
    });

    expect(result.status).toBe(PurchaseStatus.ORDERED);
    expect(inventory.adjustBalance).not.toHaveBeenCalled();
  });
});
