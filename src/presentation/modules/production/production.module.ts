import { Module } from '@nestjs/common';
import { ProductionController } from './production.controller.js';
import { ListProductionDaysUseCase } from '../../../application/use-cases/production/list-production-days.use-case.js';
import { UpsertProductionDayUseCase } from '../../../application/use-cases/production/upsert-production-day.use-case.js';
import { PRODUCTION_REPOSITORY } from '../../../domain/repositories/production.repository.interface.js';
import { ProductionRepository } from '../../../infrastructure/repositories/production.repository.js';
import { INVENTORY_REPOSITORY } from '../../../domain/repositories/inventory.repository.interface.js';
import { InventoryRepository } from '../../../infrastructure/repositories/inventory.repository.js';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import { UserRepository } from '../../../infrastructure/repositories/user.repository.js';

@Module({
  controllers: [ProductionController],
  providers: [
    ListProductionDaysUseCase,
    UpsertProductionDayUseCase,
    { provide: PRODUCTION_REPOSITORY, useClass: ProductionRepository },
    { provide: INVENTORY_REPOSITORY, useClass: InventoryRepository },
    { provide: USER_REPOSITORY, useClass: UserRepository },
  ],
})
export class ProductionModule {}
