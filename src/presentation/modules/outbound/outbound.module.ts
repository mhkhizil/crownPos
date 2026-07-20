import { Module } from '@nestjs/common';
import { OutboundController } from './outbound.controller.js';
import { ListOutboundsUseCase } from '../../../application/use-cases/outbound/list-outbounds.use-case.js';
import { CreateOutboundUseCase } from '../../../application/use-cases/outbound/create-outbound.use-case.js';
import { TransitionOutboundStatusUseCase } from '../../../application/use-cases/outbound/transition-outbound-status.use-case.js';
import { OUTBOUND_REPOSITORY } from '../../../domain/repositories/outbound.repository.interface.js';
import { OutboundRepository } from '../../../infrastructure/repositories/outbound.repository.js';
import { SALES_REPOSITORY } from '../../../domain/repositories/sales.repository.interface.js';
import { SalesRepository } from '../../../infrastructure/repositories/sales.repository.js';
import { INVENTORY_REPOSITORY } from '../../../domain/repositories/inventory.repository.interface.js';
import { InventoryRepository } from '../../../infrastructure/repositories/inventory.repository.js';
import { BILLING_REPOSITORY } from '../../../domain/repositories/billing.repository.interface.js';
import { BillingRepository } from '../../../infrastructure/repositories/billing.repository.js';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import { UserRepository } from '../../../infrastructure/repositories/user.repository.js';

@Module({
  controllers: [OutboundController],
  providers: [
    ListOutboundsUseCase,
    CreateOutboundUseCase,
    TransitionOutboundStatusUseCase,
    { provide: OUTBOUND_REPOSITORY, useClass: OutboundRepository },
    { provide: SALES_REPOSITORY, useClass: SalesRepository },
    { provide: INVENTORY_REPOSITORY, useClass: InventoryRepository },
    { provide: BILLING_REPOSITORY, useClass: BillingRepository },
    { provide: USER_REPOSITORY, useClass: UserRepository },
  ],
})
export class OutboundModule {}
