import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import {
  authBodyIdentifierTracker,
  authIpTracker,
} from './common/throttler/auth-throttle.helpers.js';

import { DatabaseModule } from './infrastructure/database/database.module.js';
import { SupabaseModule } from './infrastructure/supabase/supabase.module.js';

import { AuthModule } from './presentation/modules/auth/auth.module.js';
import { AdminRolesModule } from './presentation/modules/admin-roles/admin-roles.module.js';
import { AdminUsersModule } from './presentation/modules/admin-users/admin-users.module.js';
import { MasterDataModule } from './presentation/modules/master-data/master-data.module.js';
import { ProductionModule } from './presentation/modules/production/production.module.js';
import { InventoryModule } from './presentation/modules/inventory/inventory.module.js';
import { PurchasesModule } from './presentation/modules/purchases/purchases.module.js';
import { SalesModule } from './presentation/modules/sales/sales.module.js';
import { OutboundModule } from './presentation/modules/outbound/outbound.module.js';
import { BillingModule } from './presentation/modules/billing/billing.module.js';
import { PricingModule } from './presentation/modules/pricing/pricing.module.js';
import { BdAnalyticsModule } from './presentation/modules/bd-analytics/bd-analytics.module.js';
import { RootAdminIntegrityService } from './infrastructure/bootstrap/root-admin-integrity.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'auth-ip',
          ttl: 60_000,
          limit: 30,
          getTracker: authIpTracker,
        },
        {
          name: 'auth-id',
          ttl: 60_000,
          limit: 10,
          getTracker: authBodyIdentifierTracker,
        },
      ],
    }),
    DatabaseModule,
    SupabaseModule,
    AuthModule,
    AdminRolesModule,
    AdminUsersModule,
    MasterDataModule,
    ProductionModule,
    InventoryModule,
    PurchasesModule,
    SalesModule,
    OutboundModule,
    BillingModule,
    PricingModule,
    BdAnalyticsModule,
  ],
  controllers: [AppController],
  providers: [AppService, RootAdminIntegrityService],
})
export class AppModule {}
