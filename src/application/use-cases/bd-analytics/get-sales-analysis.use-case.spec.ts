import { jest } from '@jest/globals';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  SalesAnalysisBucketEntity,
  SalesAnalysisEntity,
  SalesAnalysisTotalsEntity,
} from '../../../domain/entities/bd-analytics.entity.js';
import { UserEntity } from '../../../domain/entities/user.entity.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';
import { SalesAnalysisPeriod } from '../../../domain/enums/sales-analysis-period.enum.js';
import { UserStatus } from '../../../domain/enums/user-status.enum.js';
import type { IBdAnalyticsRepository } from '../../../domain/repositories/bd-analytics.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { GetSalesAnalysisUseCase } from './get-sales-analysis.use-case.js';

function buildUser(overrides: Partial<UserEntity> = {}): UserEntity {
  return new UserEntity({
    id: 'user-1',
    companyId: null,
    email: 'root@test.com',
    passwordHash: 'hash',
    nameEn: 'Root',
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

function bdMock(): jest.Mocked<IBdAnalyticsRepository> {
  return {
    upsertCustomerTarget: jest.fn(),
    createDigitalAsset: jest.fn(),
    createPhysicalAsset: jest.fn(),
    listDigitalAssets: jest.fn(),
    listPhysicalAssets: jest.fn(),
    createMarketingPlan: jest.fn(),
    createCampaign: jest.fn(),
    recordBrandAwareness: jest.fn(),
    getAnalyticsSummary: jest.fn(),
    getSalesAnalysis: jest.fn(),
    refreshDailySnapshots: jest.fn(),
  };
}

describe('GetSalesAnalysisUseCase', () => {
  it('returns daily analysis for explicit range', async () => {
    const users = usersMock();
    const bd = bdMock();
    users.findById.mockResolvedValue(buildUser());
    bd.getSalesAnalysis.mockResolvedValue(
      new SalesAnalysisEntity(
        SalesAnalysisPeriod.DAILY,
        '2026-07-01',
        '2026-07-03',
        new SalesAnalysisTotalsEntity(2, 1, 15, 15000, 5000, 1, 10000),
        [
          new SalesAnalysisBucketEntity(
            '2026-07-01',
            1,
            1,
            10,
            10000,
            0,
            1,
            10000,
          ),
          new SalesAnalysisBucketEntity('2026-07-02', 0, 0, 0, 0, 0, 0, 0),
          new SalesAnalysisBucketEntity(
            '2026-07-03',
            1,
            1,
            5,
            5000,
            5000,
            0,
            0,
          ),
        ],
      ),
    );

    const uc = new GetSalesAnalysisUseCase(users, bd);
    const result = await uc.execute('user-1', {
      period: SalesAnalysisPeriod.DAILY,
      from: '2026-07-01',
      to: '2026-07-03',
    });

    expect(result.period).toBe(SalesAnalysisPeriod.DAILY);
    expect(result.buckets).toHaveLength(3);
    expect(result.totals.totalSalesMmk).toBe(15000);
    expect(bd.getSalesAnalysis).toHaveBeenCalledWith({
      period: SalesAnalysisPeriod.DAILY,
      from: '2026-07-01',
      to: '2026-07-03',
    });
  });

  it('rejects inverted date range', async () => {
    const users = usersMock();
    const bd = bdMock();
    users.findById.mockResolvedValue(buildUser());

    const uc = new GetSalesAnalysisUseCase(users, bd);
    await expect(
      uc.execute('user-1', {
        period: SalesAnalysisPeriod.MONTHLY,
        from: '2026-12-01',
        to: '2026-01-01',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('denies actor without VIEW_ANALYTICS', async () => {
    const users = usersMock();
    const bd = bdMock();
    users.findById.mockResolvedValue(buildUser({ isRoot: false }));
    users.getAuthDataByUserId.mockResolvedValue({
      user: buildUser({ isRoot: false }),
      roles: [],
      permissionCodes: [PermissionCode.MANAGE_SALES],
    });

    const uc = new GetSalesAnalysisUseCase(users, bd);
    await expect(
      uc.execute('user-1', { period: SalesAnalysisPeriod.YEARLY }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(bd.getSalesAnalysis).not.toHaveBeenCalled();
  });
});
