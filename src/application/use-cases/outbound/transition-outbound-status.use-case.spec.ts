import { jest } from '@jest/globals';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  FactoryOutboundEntity,
  FactoryOutboundLineEntity,
} from '../../../domain/entities/factory-outbound.entity.js';
import { UserEntity } from '../../../domain/entities/user.entity.js';
import { DeliveryChannel } from '../../../domain/enums/delivery-channel.enum.js';
import { OutboundStatus } from '../../../domain/enums/outbound-status.enum.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';
import { SalesOrderStatus } from '../../../domain/enums/sales-order-status.enum.js';
import { UserStatus } from '../../../domain/enums/user-status.enum.js';
import type { IBillingRepository } from '../../../domain/repositories/billing.repository.interface.js';
import type { IInventoryRepository } from '../../../domain/repositories/inventory.repository.interface.js';
import type { IOutboundRepository } from '../../../domain/repositories/outbound.repository.interface.js';
import type { ISalesRepository } from '../../../domain/repositories/sales.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { TransitionOutboundStatusUseCase } from './transition-outbound-status.use-case.js';

function buildUser(overrides: Partial<UserEntity> = {}): UserEntity {
  return new UserEntity({
    id: 'user-1',
    companyId: null,
    email: 'out@test.com',
    passwordHash: 'hash',
    nameEn: 'Out',
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

function outbound(
  channel: DeliveryChannel,
  status: OutboundStatus,
): FactoryOutboundEntity {
  return new FactoryOutboundEntity(
    'ob-1',
    'OB-1',
    'factory-1',
    'order-1',
    new Date('2026-07-19'),
    channel,
    null,
    null,
    null,
    null,
    null,
    status,
    [new FactoryOutboundLineEntity('l1', 'sku-1', 'u1', 5)],
    [],
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

function outboundMock(): jest.Mocked<IOutboundRepository> {
  return {
    createOutbound: jest.fn(),
    getOutbound: jest.fn(),
    transitionOutbound: jest.fn(),
    listOutbounds: jest.fn(),
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

describe('TransitionOutboundStatusUseCase sequence guards', () => {
  it('allows DIRECT_TO_SHOP READY → RECEIVED and sets GOODS_RECEIVED when unpaid with no invoice', async () => {
    const users = usersMock();
    const outboundRepo = outboundMock();
    const sales = salesMock();
    const inventory = inventoryMock();
    const billing = billingMock();
    users.findById.mockResolvedValue(buildUser());
    outboundRepo.getOutbound.mockResolvedValue(
      outbound(DeliveryChannel.DIRECT_TO_SHOP, OutboundStatus.READY_AT_FACTORY),
    );
    outboundRepo.transitionOutbound.mockResolvedValue({
      entity: outbound(
        DeliveryChannel.DIRECT_TO_SHOP,
        OutboundStatus.RECEIVED_BY_CUSTOMER,
      ),
      applied: true,
    });
    inventory.findPrimaryStockLocationId.mockResolvedValue('loc-1');
    inventory.adjustBalance.mockResolvedValue({} as never);
    billing.isSalesOrderFullyPaid.mockResolvedValue(false);
    billing.hasActiveInvoiceForSalesOrder.mockResolvedValue(false);
    sales.updateOrderStatus.mockResolvedValue();

    const uc = new TransitionOutboundStatusUseCase(
      users,
      outboundRepo,
      sales,
      inventory,
      billing,
    );
    await uc.execute('user-1', 'ob-1', {
      toStatus: OutboundStatus.RECEIVED_BY_CUSTOMER,
    });
    expect(sales.updateOrderStatus).toHaveBeenCalledWith(
      'order-1',
      SalesOrderStatus.GOODS_RECEIVED,
      expect.objectContaining({ goodsReceivedAt: expect.any(Date) }),
    );
  });

  it('on receive unpaid with existing invoice sets AWAITING_PAYMENT', async () => {
    const users = usersMock();
    const outboundRepo = outboundMock();
    const sales = salesMock();
    const inventory = inventoryMock();
    const billing = billingMock();
    users.findById.mockResolvedValue(buildUser());
    outboundRepo.getOutbound.mockResolvedValue(
      outbound(DeliveryChannel.DIRECT_TO_SHOP, OutboundStatus.READY_AT_FACTORY),
    );
    outboundRepo.transitionOutbound.mockResolvedValue({
      entity: outbound(
        DeliveryChannel.DIRECT_TO_SHOP,
        OutboundStatus.RECEIVED_BY_CUSTOMER,
      ),
      applied: true,
    });
    inventory.findPrimaryStockLocationId.mockResolvedValue('loc-1');
    inventory.adjustBalance.mockResolvedValue({} as never);
    billing.isSalesOrderFullyPaid.mockResolvedValue(false);
    billing.hasActiveInvoiceForSalesOrder.mockResolvedValue(true);
    sales.updateOrderStatus.mockResolvedValue();

    const uc = new TransitionOutboundStatusUseCase(
      users,
      outboundRepo,
      sales,
      inventory,
      billing,
    );
    await uc.execute('user-1', 'ob-1', {
      toStatus: OutboundStatus.RECEIVED_BY_CUSTOMER,
    });
    expect(sales.updateOrderStatus).toHaveBeenCalledWith(
      'order-1',
      SalesOrderStatus.AWAITING_PAYMENT,
      expect.objectContaining({ goodsReceivedAt: expect.any(Date) }),
    );
  });

  it('rejects RECEIVED_BY_CUSTOMER when no primary stock location (no status/inventory side effects)', async () => {
    const users = usersMock();
    const outboundRepo = outboundMock();
    const sales = salesMock();
    const inventory = inventoryMock();
    const billing = billingMock();
    users.findById.mockResolvedValue(buildUser());
    outboundRepo.getOutbound.mockResolvedValue(
      outbound(DeliveryChannel.DIRECT_TO_SHOP, OutboundStatus.READY_AT_FACTORY),
    );
    inventory.findPrimaryStockLocationId.mockResolvedValue(null);

    const uc = new TransitionOutboundStatusUseCase(
      users,
      outboundRepo,
      sales,
      inventory,
      billing,
    );
    await expect(
      uc.execute('user-1', 'ob-1', {
        toStatus: OutboundStatus.RECEIVED_BY_CUSTOMER,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(outboundRepo.transitionOutbound).not.toHaveBeenCalled();
    expect(inventory.adjustBalance).not.toHaveBeenCalled();
    expect(sales.updateOrderStatus).not.toHaveBeenCalled();
  });

  it('on receive with early full payment sets SALE_OK', async () => {
    const users = usersMock();
    const outboundRepo = outboundMock();
    const sales = salesMock();
    const inventory = inventoryMock();
    const billing = billingMock();
    users.findById.mockResolvedValue(buildUser());
    outboundRepo.getOutbound.mockResolvedValue(
      outbound(DeliveryChannel.DIRECT_TO_SHOP, OutboundStatus.READY_AT_FACTORY),
    );
    outboundRepo.transitionOutbound.mockResolvedValue({
      entity: outbound(
        DeliveryChannel.DIRECT_TO_SHOP,
        OutboundStatus.RECEIVED_BY_CUSTOMER,
      ),
      applied: true,
    });
    inventory.findPrimaryStockLocationId.mockResolvedValue('loc-1');
    inventory.adjustBalance.mockResolvedValue({} as never);
    billing.isSalesOrderFullyPaid.mockResolvedValue(true);
    sales.updateOrderStatus.mockResolvedValue();

    const uc = new TransitionOutboundStatusUseCase(
      users,
      outboundRepo,
      sales,
      inventory,
      billing,
    );
    await uc.execute('user-1', 'ob-1', {
      toStatus: OutboundStatus.RECEIVED_BY_CUSTOMER,
    });
    expect(sales.updateOrderStatus).toHaveBeenCalledWith(
      'order-1',
      SalesOrderStatus.SALE_OK,
      expect.objectContaining({
        goodsReceivedAt: expect.any(Date),
        saleOkAt: expect.any(Date),
      }),
    );
  });

  it('skips inventory when concurrent receive loses the race (applied=false)', async () => {
    const users = usersMock();
    const outboundRepo = outboundMock();
    const sales = salesMock();
    const inventory = inventoryMock();
    const billing = billingMock();
    users.findById.mockResolvedValue(buildUser());
    outboundRepo.getOutbound.mockResolvedValue(
      outbound(DeliveryChannel.DIRECT_TO_SHOP, OutboundStatus.READY_AT_FACTORY),
    );
    outboundRepo.transitionOutbound.mockResolvedValue({
      entity: outbound(
        DeliveryChannel.DIRECT_TO_SHOP,
        OutboundStatus.RECEIVED_BY_CUSTOMER,
      ),
      applied: false,
    });
    inventory.findPrimaryStockLocationId.mockResolvedValue('loc-1');

    const uc = new TransitionOutboundStatusUseCase(
      users,
      outboundRepo,
      sales,
      inventory,
      billing,
    );
    await uc.execute('user-1', 'ob-1', {
      toStatus: OutboundStatus.RECEIVED_BY_CUSTOMER,
    });
    expect(inventory.adjustBalance).not.toHaveBeenCalled();
    expect(sales.updateOrderStatus).not.toHaveBeenCalled();
  });

  it('rejects DIRECT skip to Yangon gate', async () => {
    const users = usersMock();
    const outboundRepo = outboundMock();
    const sales = salesMock();
    const inventory = inventoryMock();
    const billing = billingMock();
    users.findById.mockResolvedValue(buildUser());
    outboundRepo.getOutbound.mockResolvedValue(
      outbound(DeliveryChannel.DIRECT_TO_SHOP, OutboundStatus.READY_AT_FACTORY),
    );

    const uc = new TransitionOutboundStatusUseCase(
      users,
      outboundRepo,
      sales,
      inventory,
      billing,
    );
    await expect(
      uc.execute('user-1', 'ob-1', {
        toStatus: OutboundStatus.SENT_TO_YANGON_GATE,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(outboundRepo.transitionOutbound).not.toHaveBeenCalled();
  });

  it('rejects VIA_GATE skip from READY to RECEIVED', async () => {
    const users = usersMock();
    const outboundRepo = outboundMock();
    const sales = salesMock();
    const inventory = inventoryMock();
    const billing = billingMock();
    users.findById.mockResolvedValue(buildUser());
    outboundRepo.getOutbound.mockResolvedValue(
      outbound(DeliveryChannel.VIA_GATE, OutboundStatus.READY_AT_FACTORY),
    );

    const uc = new TransitionOutboundStatusUseCase(
      users,
      outboundRepo,
      sales,
      inventory,
      billing,
    );
    await expect(
      uc.execute('user-1', 'ob-1', {
        toStatus: OutboundStatus.RECEIVED_BY_CUSTOMER,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('allows VIA_GATE READY → SENT_TO_YANGON_GATE', async () => {
    const users = usersMock();
    const outboundRepo = outboundMock();
    const sales = salesMock();
    const inventory = inventoryMock();
    const billing = billingMock();
    users.findById.mockResolvedValue(buildUser());
    outboundRepo.getOutbound.mockResolvedValue(
      outbound(DeliveryChannel.VIA_GATE, OutboundStatus.READY_AT_FACTORY),
    );
    outboundRepo.transitionOutbound.mockResolvedValue({
      entity: outbound(DeliveryChannel.VIA_GATE, OutboundStatus.SENT_TO_YANGON_GATE),
      applied: true,
    });

    const uc = new TransitionOutboundStatusUseCase(
      users,
      outboundRepo,
      sales,
      inventory,
      billing,
    );
    await uc.execute('user-1', 'ob-1', {
      toStatus: OutboundStatus.SENT_TO_YANGON_GATE,
    });
    expect(outboundRepo.transitionOutbound).toHaveBeenCalled();
  });

  it('idempotent when already at target status (no inventory side effects)', async () => {
    const users = usersMock();
    const outboundRepo = outboundMock();
    const sales = salesMock();
    const inventory = inventoryMock();
    const billing = billingMock();
    users.findById.mockResolvedValue(buildUser());
    outboundRepo.getOutbound.mockResolvedValue(
      outbound(
        DeliveryChannel.DIRECT_TO_SHOP,
        OutboundStatus.RECEIVED_BY_CUSTOMER,
      ),
    );

    const uc = new TransitionOutboundStatusUseCase(
      users,
      outboundRepo,
      sales,
      inventory,
      billing,
    );
    await uc.execute('user-1', 'ob-1', {
      toStatus: OutboundStatus.RECEIVED_BY_CUSTOMER,
    });
    expect(outboundRepo.transitionOutbound).not.toHaveBeenCalled();
    expect(inventory.adjustBalance).not.toHaveBeenCalled();
    expect(sales.updateOrderStatus).not.toHaveBeenCalled();
  });

  it('denies without MANAGE_OUTBOUND', async () => {
    const users = usersMock();
    const outboundRepo = outboundMock();
    const sales = salesMock();
    const inventory = inventoryMock();
    const billing = billingMock();
    users.findById.mockResolvedValue(buildUser({ isRoot: false }));
    users.getAuthDataByUserId.mockResolvedValue({
      user: buildUser({ isRoot: false }),
      roles: [],
      permissionCodes: [PermissionCode.MANAGE_SALES],
    });

    const uc = new TransitionOutboundStatusUseCase(
      users,
      outboundRepo,
      sales,
      inventory,
      billing,
    );
    await expect(
      uc.execute('user-1', 'ob-1', {
        toStatus: OutboundStatus.RECEIVED_BY_CUSTOMER,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
