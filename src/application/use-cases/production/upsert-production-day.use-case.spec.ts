import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import {
  ProductionDailyLineEntity,
  ProductionDailyRawUsageEntity,
  ProductionDailyRecordEntity,
} from '../../../domain/entities/production-daily-record.entity.js';
import { UserEntity } from '../../../domain/entities/user.entity.js';
import { InventoryItemType } from '../../../domain/enums/inventory-item-type.enum.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';
import { UserStatus } from '../../../domain/enums/user-status.enum.js';
import type { IInventoryRepository } from '../../../domain/repositories/inventory.repository.interface.js';
import type { IProductionRepository } from '../../../domain/repositories/production.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { UpsertProductionDayUseCase } from './upsert-production-day.use-case.js';

function buildUser(overrides: Partial<UserEntity> = {}): UserEntity {
  return new UserEntity({
    id: 'user-1',
    companyId: null,
    email: 'prod@test.com',
    passwordHash: 'hash',
    nameEn: 'Prod',
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

function productionMock(): jest.Mocked<IProductionRepository> {
  return {
    findProductionDay: jest.fn(),
    upsertProductionDay: jest.fn(),
    listProductionDays: jest.fn(),
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

function dayEntity(
  fgQty = 100,
  rawQty = 40,
): ProductionDailyRecordEntity {
  return new ProductionDailyRecordEntity(
    'day-1',
    'factory-1',
    new Date('2026-07-19'),
    5,
    null,
    [
      new ProductionDailyLineEntity('l1', 'sku-1', 'unit-1', fgQty, null),
    ],
    [
      new ProductionDailyRawUsageEntity('r1', 'raw-1', 'unit-1', rawQty, null),
    ],
    [],
    new Date(),
    new Date(),
    null,
  );
}

const payload = {
  factoryId: 'factory-1',
  productionDate: '2026-07-19',
  employeeCount: 5,
  lines: [
    { productSkuId: 'sku-1', unitId: 'unit-1', quantityProduced: 100 },
  ],
  rawUsages: [
    { rawMaterialId: 'raw-1', unitId: 'unit-1', quantityUsed: 40 },
  ],
};

describe('UpsertProductionDayUseCase (L2)', () => {
  it('adjusts FG up and raw down on create', async () => {
    const users = usersMock();
    const production = productionMock();
    const inventory = inventoryMock();
    users.findById.mockResolvedValue(buildUser());
    production.findProductionDay.mockResolvedValue(null);
    production.upsertProductionDay.mockResolvedValue(dayEntity());
    inventory.adjustBalance.mockResolvedValue({} as never);

    const uc = new UpsertProductionDayUseCase(users, production, inventory);
    await uc.execute('user-1', payload);

    expect(inventory.adjustBalance).toHaveBeenCalledWith(
      expect.objectContaining({
        itemType: InventoryItemType.FINISHED_GOOD,
        productSkuId: 'sku-1',
        delta: 100,
      }),
    );
    expect(inventory.adjustBalance).toHaveBeenCalledWith(
      expect.objectContaining({
        itemType: InventoryItemType.RAW_MATERIAL,
        rawMaterialId: 'raw-1',
        delta: -40,
      }),
    );
  });

  it('identical re-upsert is idempotent (no inventory adjust)', async () => {
    const users = usersMock();
    const production = productionMock();
    const inventory = inventoryMock();
    users.findById.mockResolvedValue(buildUser());
    production.findProductionDay.mockResolvedValue(dayEntity());
    production.upsertProductionDay.mockResolvedValue(dayEntity());
    inventory.adjustBalance.mockResolvedValue({} as never);

    const uc = new UpsertProductionDayUseCase(users, production, inventory);
    await uc.execute('user-1', payload);

    expect(inventory.adjustBalance).not.toHaveBeenCalled();
  });

  it('re-upsert with changed qty reverses prior then applies new', async () => {
    const users = usersMock();
    const production = productionMock();
    const inventory = inventoryMock();
    users.findById.mockResolvedValue(buildUser());
    production.findProductionDay.mockResolvedValue(dayEntity(100, 40));
    production.upsertProductionDay.mockResolvedValue(dayEntity(120, 50));
    inventory.adjustBalance.mockResolvedValue({} as never);

    const uc = new UpsertProductionDayUseCase(users, production, inventory);
    await uc.execute('user-1', {
      ...payload,
      lines: [
        { productSkuId: 'sku-1', unitId: 'unit-1', quantityProduced: 120 },
      ],
      rawUsages: [
        { rawMaterialId: 'raw-1', unitId: 'unit-1', quantityUsed: 50 },
      ],
    });

    const fgDeltas = inventory.adjustBalance.mock.calls
      .map((c) => c[0])
      .filter((a) => a.itemType === InventoryItemType.FINISHED_GOOD)
      .map((a) => a.delta);
    const rawDeltas = inventory.adjustBalance.mock.calls
      .map((c) => c[0])
      .filter((a) => a.itemType === InventoryItemType.RAW_MATERIAL)
      .map((a) => a.delta);

    expect(fgDeltas).toEqual([-100, 120]);
    expect(rawDeltas).toEqual([40, -50]);
  });

  it('denies actor without MANAGE_PRODUCTION', async () => {
    const users = usersMock();
    const production = productionMock();
    const inventory = inventoryMock();
    users.findById.mockResolvedValue(buildUser({ isRoot: false }));
    users.getAuthDataByUserId.mockResolvedValue({
      user: buildUser({ isRoot: false }),
      roles: [],
      permissionCodes: [PermissionCode.MANAGE_SALES],
    });

    const uc = new UpsertProductionDayUseCase(users, production, inventory);
    await expect(uc.execute('user-1', payload)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(production.upsertProductionDay).not.toHaveBeenCalled();
  });
});
