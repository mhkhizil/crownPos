import { Module } from '@nestjs/common';
import { PricingController } from './pricing.controller.js';
import { UpsertCustomerPriceUseCase } from '../../../application/use-cases/pricing/upsert-customer-price.use-case.js';
import { UpsertVolumeTierUseCase } from '../../../application/use-cases/pricing/upsert-volume-tier.use-case.js';
import { UpsertCityPriceUseCase } from '../../../application/use-cases/pricing/upsert-city-price.use-case.js';
import { ResolvePriceUseCase } from '../../../application/use-cases/pricing/resolve-price.use-case.js';
import { PRICING_REPOSITORY } from '../../../domain/repositories/pricing.repository.interface.js';
import { PricingRepository } from '../../../infrastructure/repositories/pricing.repository.js';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import { UserRepository } from '../../../infrastructure/repositories/user.repository.js';

@Module({
  controllers: [PricingController],
  providers: [
    UpsertCustomerPriceUseCase,
    UpsertVolumeTierUseCase,
    UpsertCityPriceUseCase,
    ResolvePriceUseCase,
    { provide: PRICING_REPOSITORY, useClass: PricingRepository },
    { provide: USER_REPOSITORY, useClass: UserRepository },
  ],
})
export class PricingModule {}
