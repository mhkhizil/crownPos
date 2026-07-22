import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { UserEntity } from '../../../domain/entities/user.entity.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';
import { UserStatus } from '../../../domain/enums/user-status.enum.js';
import { ZakatNisabStyle } from '../../../domain/enums/zakat-nisab-style.enum.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import type { IZakatRepository } from '../../../domain/repositories/zakat.repository.interface.js';
import { CalculateHanafiZakatUseCase } from './calculate-hanafi-zakat.use-case.js';

function buildUser(overrides: Partial<UserEntity> = {}): UserEntity {
  return new UserEntity({
    id: 'user-1',
    companyId: null,
    email: 'z@test.com',
    passwordHash: 'hash',
    nameEn: 'Z',
    nameMm: null,
    phone: null,
    isRoot: true,
    status: UserStatus.ACTIVE,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  });
}

describe('CalculateHanafiZakatUseCase', () => {
  const users = {
    findById: jest.fn(),
    getAuthDataByUserId: jest.fn(),
  };
  const zakat = {
    getWealthSnapshot: jest.fn(),
    listPaymentsOverlapping: jest.fn(),
    sumOpenReceivablesMmk: jest.fn(),
    createPayment: jest.fn(),
    listPayments: jest.fn(),
    softDeletePayment: jest.fn(),
  };

  let useCase: CalculateHanafiZakatUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    users.findById.mockResolvedValue(buildUser());
    zakat.getWealthSnapshot.mockResolvedValue({
      receivablesMmk: 50_000,
      finishedGoodsValueMmk: 100_000,
      rawMaterialsValueMmk: 10_000,
      excludedPhysicalAssetsMmk: 5_000_000,
      supplierPayablesMmk: 40_000,
      stockLines: [],
      warnings: [],
    });
    zakat.listPaymentsOverlapping.mockResolvedValue([]);
    useCase = new CalculateHanafiZakatUseCase(
      users as unknown as IUserRepository,
      zakat as unknown as IZakatRepository,
    );
  });

  it('V1/V6/V7: includes AR+stock, excludes physical from net', async () => {
    const r = await useCase.execute('user-1', {
      nisabStyle: ZakatNisabStyle.SILVER,
      silverPricePerGramMmk: 1000,
      cashOnHandMmk: 500_000,
      bankBalanceMmk: 0,
      payablesMmk: 10_000,
      haulCompleted: true,
    });
    expect(r.receivablesMmk).toBe(50_000);
    expect(r.finishedGoodsValueMmk).toBe(100_000);
    expect(r.excludedPhysicalAssetsMmk).toBe(5_000_000);
    expect(r.supplierPayablesMmk).toBe(40_000);
    expect(r.otherPayablesMmk).toBe(10_000);
    expect(r.payablesMmk).toBe(50_000);
    expect(r.netZakatableMmk).toBe(610_000);
    expect(r.zakatDueMmk).toBe(15_250);
    expect(r.considerations).toContain('MANUAL_CASH');
    expect(r.considerations).toContain('SUPPLIER_AP_AUTO');
  });

  it('rejects without MANAGE_BD', async () => {
    users.findById.mockResolvedValue(buildUser({ isRoot: false }));
    users.getAuthDataByUserId.mockResolvedValue({
      user: buildUser({ isRoot: false }),
      roles: [],
      permissionCodes: [],
    });
    await expect(
      useCase.execute('user-1', {
        nisabStyle: ZakatNisabStyle.GOLD,
        goldPricePerGramMmk: 1,
        haulCompleted: true,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
