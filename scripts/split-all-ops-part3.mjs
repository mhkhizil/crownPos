/**
 * Part 3: pricing, bd-analytics, master-data
 * Run: node scripts/split-all-ops-part3.mjs
 */
import fs from 'fs';
import path from 'path';

const root = process.cwd();
function w(rel, content) {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
  console.log('✓', rel);
}

function uc({
  folder,
  file,
  className,
  permission,
  repoToken,
  repoFile,
  iRepo,
  typeImports = '',
  args,
  body,
}) {
  w(
    `src/application/use-cases/${folder}/${file}.ts`,
    `import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { ${repoToken} } from '../../../domain/repositories/${repoFile}.js';
import type { ${iRepo} } from '../../../domain/repositories/${repoFile}.js';
${typeImports}import { requirePermission } from '../_helpers/admin-authorization.helper.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';

@Injectable()
export class ${className} {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(${repoToken}) private readonly repo: ${iRepo},
  ) {}

  async execute(${args}): Promise<unknown> {
    await requirePermission(
      this.users,
      actorId,
      PermissionCode.${permission},
    );
    ${body}
  }
}
`,
  );
}

// PRICING
uc({
  folder: 'pricing',
  file: 'upsert-customer-price.use-case',
  className: 'UpsertCustomerPriceUseCase',
  permission: 'MANAGE_PRICING',
  repoToken: 'PRICING_REPOSITORY',
  repoFile: 'pricing.repository.interface',
  iRepo: 'IPricingRepository',
  typeImports:
    "import type { UpsertCustomerPriceInput } from '../../../domain/repositories/pricing.repository.interface.js';\n",
  args: 'actorId: string, data: UpsertCustomerPriceInput',
  body: 'return this.repo.upsertCustomerPrice(data);',
});
uc({
  folder: 'pricing',
  file: 'upsert-volume-tier.use-case',
  className: 'UpsertVolumeTierUseCase',
  permission: 'MANAGE_PRICING',
  repoToken: 'PRICING_REPOSITORY',
  repoFile: 'pricing.repository.interface',
  iRepo: 'IPricingRepository',
  typeImports:
    "import type { UpsertVolumeTierInput } from '../../../domain/repositories/pricing.repository.interface.js';\n",
  args: 'actorId: string, data: UpsertVolumeTierInput',
  body: 'return this.repo.upsertVolumeTier(data);',
});
uc({
  folder: 'pricing',
  file: 'upsert-city-price.use-case',
  className: 'UpsertCityPriceUseCase',
  permission: 'MANAGE_PRICING',
  repoToken: 'PRICING_REPOSITORY',
  repoFile: 'pricing.repository.interface',
  iRepo: 'IPricingRepository',
  typeImports:
    "import type { UpsertCityPriceInput } from '../../../domain/repositories/pricing.repository.interface.js';\n",
  args: 'actorId: string, data: UpsertCityPriceInput',
  body: 'return this.repo.upsertCityPrice(data);',
});
uc({
  folder: 'pricing',
  file: 'resolve-price.use-case',
  className: 'ResolvePriceUseCase',
  permission: 'MANAGE_PRICING',
  repoToken: 'PRICING_REPOSITORY',
  repoFile: 'pricing.repository.interface',
  iRepo: 'IPricingRepository',
  typeImports:
    "import type { ResolvePriceInput } from '../../../domain/repositories/pricing.repository.interface.js';\n",
  args: 'actorId: string, input: ResolvePriceInput',
  body: 'return this.repo.resolvePrice(input);',
});
w(
  'src/application/use-cases/pricing/index.ts',
  `export * from './upsert-customer-price.use-case.js';
export * from './upsert-volume-tier.use-case.js';
export * from './upsert-city-price.use-case.js';
export * from './resolve-price.use-case.js';
`,
);
w(
  'src/presentation/modules/pricing/pricing.controller.ts',
  `import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../../common/decorators/current-user.decorator.js';
import { ApiResponseDto } from '../../../application/dtos/common/api-response.dto.js';
import { UpsertCustomerPriceUseCase } from '../../../application/use-cases/pricing/upsert-customer-price.use-case.js';
import { UpsertVolumeTierUseCase } from '../../../application/use-cases/pricing/upsert-volume-tier.use-case.js';
import { UpsertCityPriceUseCase } from '../../../application/use-cases/pricing/upsert-city-price.use-case.js';
import { ResolvePriceUseCase } from '../../../application/use-cases/pricing/resolve-price.use-case.js';
import { ROUTE_PREFIX } from '../../routing.paths.js';
import type {
  ResolvePriceInput,
  UpsertCityPriceInput,
  UpsertCustomerPriceInput,
  UpsertVolumeTierInput,
} from '../../../domain/repositories/pricing.repository.interface.js';

@ApiTags('Pricing')
@Controller(\`\${ROUTE_PREFIX.adminDashboard}/pricing\`)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PricingController {
  constructor(
    private readonly upsertCustomerPrice: UpsertCustomerPriceUseCase,
    private readonly upsertVolumeTier: UpsertVolumeTierUseCase,
    private readonly upsertCityPrice: UpsertCityPriceUseCase,
    private readonly resolvePrice: ResolvePriceUseCase,
  ) {}

  @Post('customer')
  @HttpCode(HttpStatus.CREATED)
  async customer(
    @CurrentUser() u: JwtPayload,
    @Body() body: UpsertCustomerPriceInput,
  ) {
    return ApiResponseDto.success(
      await this.upsertCustomerPrice.execute(u.sub, body),
    );
  }

  @Post('volume')
  @HttpCode(HttpStatus.CREATED)
  async volume(
    @CurrentUser() u: JwtPayload,
    @Body() body: UpsertVolumeTierInput,
  ) {
    return ApiResponseDto.success(
      await this.upsertVolumeTier.execute(u.sub, body),
    );
  }

  @Post('city')
  @HttpCode(HttpStatus.CREATED)
  async city(
    @CurrentUser() u: JwtPayload,
    @Body() body: UpsertCityPriceInput,
  ) {
    return ApiResponseDto.success(
      await this.upsertCityPrice.execute(u.sub, body),
    );
  }

  @Post('resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve price: customer → volume → city' })
  async resolve(
    @CurrentUser() u: JwtPayload,
    @Body() body: ResolvePriceInput,
  ) {
    return ApiResponseDto.success(await this.resolvePrice.execute(u.sub, body));
  }
}
`,
);
w(
  'src/presentation/modules/pricing/pricing.module.ts',
  `import { Module } from '@nestjs/common';
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
`,
);

// BD ANALYTICS
const bdActions = [
  ['upsert-customer-target', 'UpsertCustomerTargetUseCase', 'MANAGE_BD', 'UpsertCustomerTargetInput', 'upsertCustomerTarget'],
  ['create-digital-asset', 'CreateDigitalAssetUseCase', 'MANAGE_BD', 'CreateDigitalAssetInput', 'createDigitalAsset'],
  ['list-digital-assets', 'ListDigitalAssetsUseCase', 'MANAGE_BD', null, 'listDigitalAssets'],
  ['create-physical-asset', 'CreatePhysicalAssetUseCase', 'MANAGE_BD', 'CreatePhysicalAssetInput', 'createPhysicalAsset'],
  ['list-physical-assets', 'ListPhysicalAssetsUseCase', 'MANAGE_BD', null, 'listPhysicalAssets'],
  ['create-marketing-plan', 'CreateMarketingPlanUseCase', 'MANAGE_BD', 'CreateMarketingPlanInput', 'createMarketingPlan'],
  ['create-campaign', 'CreateCampaignUseCase', 'MANAGE_BD', 'CreateCampaignInput', 'createCampaign'],
  ['record-brand-awareness', 'RecordBrandAwarenessUseCase', 'MANAGE_BD', 'BrandAwarenessInput', 'recordBrandAwareness'],
  ['get-analytics-summary', 'GetAnalyticsSummaryUseCase', 'VIEW_ANALYTICS', null, 'getAnalyticsSummary'],
  ['refresh-daily-snapshots', 'RefreshDailySnapshotsUseCase', 'VIEW_ANALYTICS', null, 'refreshDailySnapshots'],
];

for (const [file, className, permission, inputType, method] of bdActions) {
  const needsData = inputType != null;
  const isRefresh = method === 'refreshDailySnapshots';
  uc({
    folder: 'bd-analytics',
    file: `${file}.use-case`,
    className,
    permission,
    repoToken: 'BD_ANALYTICS_REPOSITORY',
    repoFile: 'bd-analytics.repository.interface',
    iRepo: 'IBdAnalyticsRepository',
    typeImports: inputType
      ? `import type { ${inputType} } from '../../../domain/repositories/bd-analytics.repository.interface.js';\n`
      : '',
    args: isRefresh
      ? 'actorId: string, date: string'
      : needsData
        ? `actorId: string, data: ${inputType}`
        : 'actorId: string',
    body: isRefresh
      ? 'return this.repo.refreshDailySnapshots(date);'
      : needsData
        ? `return this.repo.${method}(data);`
        : `return this.repo.${method}();`,
  });
}

w(
  'src/application/use-cases/bd-analytics/index.ts',
  bdActions
    .map(([file]) => `export * from './${file}.use-case.js';`)
    .join('\n') + '\n',
);

w(
  'src/presentation/modules/bd-analytics/bd-analytics.controller.ts',
  `import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../../common/decorators/current-user.decorator.js';
import { ApiResponseDto } from '../../../application/dtos/common/api-response.dto.js';
import { UpsertCustomerTargetUseCase } from '../../../application/use-cases/bd-analytics/upsert-customer-target.use-case.js';
import { CreateDigitalAssetUseCase } from '../../../application/use-cases/bd-analytics/create-digital-asset.use-case.js';
import { ListDigitalAssetsUseCase } from '../../../application/use-cases/bd-analytics/list-digital-assets.use-case.js';
import { CreatePhysicalAssetUseCase } from '../../../application/use-cases/bd-analytics/create-physical-asset.use-case.js';
import { ListPhysicalAssetsUseCase } from '../../../application/use-cases/bd-analytics/list-physical-assets.use-case.js';
import { CreateMarketingPlanUseCase } from '../../../application/use-cases/bd-analytics/create-marketing-plan.use-case.js';
import { CreateCampaignUseCase } from '../../../application/use-cases/bd-analytics/create-campaign.use-case.js';
import { RecordBrandAwarenessUseCase } from '../../../application/use-cases/bd-analytics/record-brand-awareness.use-case.js';
import { GetAnalyticsSummaryUseCase } from '../../../application/use-cases/bd-analytics/get-analytics-summary.use-case.js';
import { RefreshDailySnapshotsUseCase } from '../../../application/use-cases/bd-analytics/refresh-daily-snapshots.use-case.js';
import { ROUTE_PREFIX } from '../../routing.paths.js';
import type {
  BrandAwarenessInput,
  CreateCampaignInput,
  CreateDigitalAssetInput,
  CreateMarketingPlanInput,
  CreatePhysicalAssetInput,
  UpsertCustomerTargetInput,
} from '../../../domain/repositories/bd-analytics.repository.interface.js';

@ApiTags('BD / Analytics')
@Controller(\`\${ROUTE_PREFIX.adminDashboard}/bd-analytics\`)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BdAnalyticsController {
  constructor(
    private readonly upsertTarget: UpsertCustomerTargetUseCase,
    private readonly createDigital: CreateDigitalAssetUseCase,
    private readonly listDigital: ListDigitalAssetsUseCase,
    private readonly createPhysical: CreatePhysicalAssetUseCase,
    private readonly listPhysical: ListPhysicalAssetsUseCase,
    private readonly createMarketingPlan: CreateMarketingPlanUseCase,
    private readonly createCampaign: CreateCampaignUseCase,
    private readonly recordBrandAwareness: RecordBrandAwarenessUseCase,
    private readonly getAnalyticsSummary: GetAnalyticsSummaryUseCase,
    private readonly refreshSnapshots: RefreshDailySnapshotsUseCase,
  ) {}

  @Post('targets')
  async targets(
    @CurrentUser() u: JwtPayload,
    @Body() body: UpsertCustomerTargetInput,
  ) {
    return ApiResponseDto.success(await this.upsertTarget.execute(u.sub, body));
  }

  @Get('digital-assets')
  async digitalList(@CurrentUser() u: JwtPayload) {
    return ApiResponseDto.success(await this.listDigital.execute(u.sub));
  }
  @Post('digital-assets')
  @HttpCode(HttpStatus.CREATED)
  async digitalCreate(
    @CurrentUser() u: JwtPayload,
    @Body() body: CreateDigitalAssetInput,
  ) {
    return ApiResponseDto.success(
      await this.createDigital.execute(u.sub, body),
    );
  }

  @Get('physical-assets')
  async physicalList(@CurrentUser() u: JwtPayload) {
    return ApiResponseDto.success(await this.listPhysical.execute(u.sub));
  }
  @Post('physical-assets')
  @HttpCode(HttpStatus.CREATED)
  async physicalCreate(
    @CurrentUser() u: JwtPayload,
    @Body() body: CreatePhysicalAssetInput,
  ) {
    return ApiResponseDto.success(
      await this.createPhysical.execute(u.sub, body),
    );
  }

  @Post('marketing-plans')
  @HttpCode(HttpStatus.CREATED)
  async marketing(
    @CurrentUser() u: JwtPayload,
    @Body() body: CreateMarketingPlanInput,
  ) {
    return ApiResponseDto.success(
      await this.createMarketingPlan.execute(u.sub, body),
    );
  }

  @Post('campaigns')
  @HttpCode(HttpStatus.CREATED)
  async campaigns(
    @CurrentUser() u: JwtPayload,
    @Body() body: CreateCampaignInput,
  ) {
    return ApiResponseDto.success(
      await this.createCampaign.execute(u.sub, body),
    );
  }

  @Post('brand-awareness')
  @HttpCode(HttpStatus.CREATED)
  async awareness(
    @CurrentUser() u: JwtPayload,
    @Body() body: BrandAwarenessInput,
  ) {
    return ApiResponseDto.success(
      await this.recordBrandAwareness.execute(u.sub, body),
    );
  }

  @Get('analytics/summary')
  @ApiOperation({ summary: 'BD dashboard summary' })
  async summary(@CurrentUser() u: JwtPayload) {
    return ApiResponseDto.success(
      await this.getAnalyticsSummary.execute(u.sub),
    );
  }

  @Post('analytics/snapshots/:date')
  async snapshots(
    @CurrentUser() u: JwtPayload,
    @Param('date') date: string,
  ) {
    return ApiResponseDto.success(
      await this.refreshSnapshots.execute(u.sub, date),
    );
  }
}
`,
);

w(
  'src/presentation/modules/bd-analytics/bd-analytics.module.ts',
  `import { Module } from '@nestjs/common';
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
import { RefreshDailySnapshotsUseCase } from '../../../application/use-cases/bd-analytics/refresh-daily-snapshots.use-case.js';
import { BD_ANALYTICS_REPOSITORY } from '../../../domain/repositories/bd-analytics.repository.interface.js';
import { BdAnalyticsRepository } from '../../../infrastructure/repositories/bd-analytics.repository.js';
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
    RefreshDailySnapshotsUseCase,
    { provide: BD_ANALYTICS_REPOSITORY, useClass: BdAnalyticsRepository },
    { provide: USER_REPOSITORY, useClass: UserRepository },
  ],
})
export class BdAnalyticsModule {}
`,
);

console.log('pricing + bd done');
