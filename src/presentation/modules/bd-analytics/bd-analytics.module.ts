import { Module } from '@nestjs/common';
import { BdAnalyticsController } from './bd-analytics.controller.js';
import { UpsertCustomerTargetUseCase } from '../../../application/use-cases/bd-analytics/upsert-customer-target.use-case.js';
import { CreateDigitalAssetUseCase } from '../../../application/use-cases/bd-analytics/create-digital-asset.use-case.js';
import { ListDigitalAssetsUseCase } from '../../../application/use-cases/bd-analytics/list-digital-assets.use-case.js';
import { CreatePhysicalAssetUseCase } from '../../../application/use-cases/bd-analytics/create-physical-asset.use-case.js';
import { ListPhysicalAssetsUseCase } from '../../../application/use-cases/bd-analytics/list-physical-assets.use-case.js';
import { CreateMarketingPlanUseCase } from '../../../application/use-cases/bd-analytics/create-marketing-plan.use-case.js';
import { CreateCampaignUseCase } from '../../../application/use-cases/bd-analytics/create-campaign.use-case.js';
import { RecordBrandAwarenessUseCase } from '../../../application/use-cases/bd-analytics/record-brand-awareness.use-case.js';
import { GetAnalyticsSummaryUseCase } from '../../../application/use-cases/bd-analytics/get-analytics-summary.use-case.js';
import { GetSalesAnalysisUseCase } from '../../../application/use-cases/bd-analytics/get-sales-analysis.use-case.js';
import { RefreshDailySnapshotsUseCase } from '../../../application/use-cases/bd-analytics/refresh-daily-snapshots.use-case.js';
import { CalculateHanafiZakatUseCase } from '../../../application/use-cases/zakat/calculate-hanafi-zakat.use-case.js';
import { RecordZakatPaymentUseCase } from '../../../application/use-cases/zakat/record-zakat-payment.use-case.js';
import { ListZakatPaymentsUseCase } from '../../../application/use-cases/zakat/list-zakat-payments.use-case.js';
import { GetZakatPaymentCoverageUseCase } from '../../../application/use-cases/zakat/get-zakat-payment-coverage.use-case.js';
import { DeleteZakatPaymentUseCase } from '../../../application/use-cases/zakat/delete-zakat-payment.use-case.js';
import { BD_ANALYTICS_REPOSITORY } from '../../../domain/repositories/bd-analytics.repository.interface.js';
import { BdAnalyticsRepository } from '../../../infrastructure/repositories/bd-analytics.repository.js';
import { ZAKAT_REPOSITORY } from '../../../domain/repositories/zakat.repository.interface.js';
import { ZakatRepository } from '../../../infrastructure/repositories/zakat.repository.js';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import { UserRepository } from '../../../infrastructure/repositories/user.repository.js';

@Module({
  controllers: [BdAnalyticsController],
  providers: [
    UpsertCustomerTargetUseCase,
    CreateDigitalAssetUseCase,
    ListDigitalAssetsUseCase,
    CreatePhysicalAssetUseCase,
    ListPhysicalAssetsUseCase,
    CreateMarketingPlanUseCase,
    CreateCampaignUseCase,
    RecordBrandAwarenessUseCase,
    GetAnalyticsSummaryUseCase,
    GetSalesAnalysisUseCase,
    RefreshDailySnapshotsUseCase,
    CalculateHanafiZakatUseCase,
    RecordZakatPaymentUseCase,
    ListZakatPaymentsUseCase,
    GetZakatPaymentCoverageUseCase,
    DeleteZakatPaymentUseCase,
    { provide: BD_ANALYTICS_REPOSITORY, useClass: BdAnalyticsRepository },
    { provide: ZAKAT_REPOSITORY, useClass: ZakatRepository },
    { provide: USER_REPOSITORY, useClass: UserRepository },
  ],
})
export class BdAnalyticsModule {}
