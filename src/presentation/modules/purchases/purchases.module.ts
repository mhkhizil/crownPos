import { Module } from '@nestjs/common';
import { PurchasesController } from './purchases.controller.js';
import { CreatePurchaseOrderUseCase } from '../../../application/use-cases/purchases/create-purchase-order.use-case.js';
import { ReceivePurchaseOrderUseCase } from '../../../application/use-cases/purchases/receive-purchase-order.use-case.js';
import {
  CancelPurchaseOrderUseCase,
  GetPurchaseOrderUseCase,
  ListPurchaseOrdersUseCase,
} from '../../../application/use-cases/purchases/list-get-cancel-purchase.use-case.js';
import { PURCHASE_REPOSITORY } from '../../../domain/repositories/purchase.repository.interface.js';
import { PurchaseRepository } from '../../../infrastructure/repositories/purchase.repository.js';
import { INVENTORY_REPOSITORY } from '../../../domain/repositories/inventory.repository.interface.js';
import { InventoryRepository } from '../../../infrastructure/repositories/inventory.repository.js';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import { UserRepository } from '../../../infrastructure/repositories/user.repository.js';

@Module({
  controllers: [PurchasesController],
  providers: [
    CreatePurchaseOrderUseCase,
    ReceivePurchaseOrderUseCase,
    ListPurchaseOrdersUseCase,
    GetPurchaseOrderUseCase,
    CancelPurchaseOrderUseCase,
    { provide: PURCHASE_REPOSITORY, useClass: PurchaseRepository },
    { provide: INVENTORY_REPOSITORY, useClass: InventoryRepository },
    { provide: USER_REPOSITORY, useClass: UserRepository },
  ],
})
export class PurchasesModule {}
