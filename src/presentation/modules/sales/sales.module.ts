import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller.js';
import { ListSalesOrdersUseCase } from '../../../application/use-cases/sales/list-sales-orders.use-case.js';
import { GetSalesOrderUseCase } from '../../../application/use-cases/sales/get-sales-order.use-case.js';
import { CreateSalesOrderUseCase } from '../../../application/use-cases/sales/create-sales-order.use-case.js';
import { ConfirmSalesOrderUseCase } from '../../../application/use-cases/sales/confirm-sales-order.use-case.js';
import { SALES_REPOSITORY } from '../../../domain/repositories/sales.repository.interface.js';
import { SalesRepository } from '../../../infrastructure/repositories/sales.repository.js';
import { INVENTORY_REPOSITORY } from '../../../domain/repositories/inventory.repository.interface.js';
import { InventoryRepository } from '../../../infrastructure/repositories/inventory.repository.js';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import { UserRepository } from '../../../infrastructure/repositories/user.repository.js';

@Module({
  controllers: [SalesController],
  providers: [
    ListSalesOrdersUseCase,
    GetSalesOrderUseCase,
    CreateSalesOrderUseCase,
    ConfirmSalesOrderUseCase,
    { provide: SALES_REPOSITORY, useClass: SalesRepository },
    { provide: INVENTORY_REPOSITORY, useClass: InventoryRepository },
    { provide: USER_REPOSITORY, useClass: UserRepository },
  ],
})
export class SalesModule {}
