import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller.js';
import { ListInventoryBalancesUseCase } from '../../../application/use-cases/inventory/list-inventory-balances.use-case.js';
import { RecordDailyStockCountUseCase } from '../../../application/use-cases/inventory/record-daily-stock-count.use-case.js';
import { INVENTORY_REPOSITORY } from '../../../domain/repositories/inventory.repository.interface.js';
import { InventoryRepository } from '../../../infrastructure/repositories/inventory.repository.js';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import { UserRepository } from '../../../infrastructure/repositories/user.repository.js';

@Module({
  controllers: [InventoryController],
  providers: [
    ListInventoryBalancesUseCase,
    RecordDailyStockCountUseCase,
    { provide: INVENTORY_REPOSITORY, useClass: InventoryRepository },
    { provide: USER_REPOSITORY, useClass: UserRepository },
  ],
})
export class InventoryModule {}
