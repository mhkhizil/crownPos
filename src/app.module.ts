import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import {
  authBodyIdentifierTracker,
  authIpTracker,
} from './common/throttler/auth-throttle.helpers.js';

// Infrastructure
import { DatabaseModule } from './infrastructure/database/database.module.js';
import { SupabaseModule } from './infrastructure/supabase/supabase.module.js';

// Presentation (feature modules)
import { AuthModule } from './presentation/modules/auth/auth.module.js';
import { AdminRolesModule } from './presentation/modules/admin-roles/admin-roles.module.js';
import { AdminUsersModule } from './presentation/modules/admin-users/admin-users.module.js';
import { RootAdminIntegrityService } from './infrastructure/bootstrap/root-admin-integrity.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),

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
    // ─── Add feature modules here (POS, inventory, etc.) ───
  ],
  controllers: [AppController],
  providers: [AppService, RootAdminIntegrityService],
})
export class AppModule {}
