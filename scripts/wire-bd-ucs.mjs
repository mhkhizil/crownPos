/**
 * Rewrite bd-analytics use-cases for DTOs
 * node scripts/wire-bd-ucs.mjs
 */
import fs from 'fs';
import path from 'path';

const root = process.cwd();
function w(rel, content) {
  fs.writeFileSync(path.join(root, rel), content.replace(/\r?\n/g, '\n'));
  console.log('✓', rel);
}

const specs = [
  [
    'upsert-customer-target',
    'UpsertCustomerTargetUseCase',
    'MANAGE_BD',
    'UpsertCustomerTargetDto',
    'CustomerTargetResponseDto',
    'upsertCustomerTarget',
    true,
  ],
  [
    'create-digital-asset',
    'CreateDigitalAssetUseCase',
    'MANAGE_BD',
    'CreateDigitalAssetDto',
    'DigitalAssetResponseDto',
    'createDigitalAsset',
    true,
  ],
  [
    'list-digital-assets',
    'ListDigitalAssetsUseCase',
    'MANAGE_BD',
    null,
    'DigitalAssetResponseDto',
    'listDigitalAssets',
    false,
  ],
  [
    'create-physical-asset',
    'CreatePhysicalAssetUseCase',
    'MANAGE_BD',
    'CreatePhysicalAssetDto',
    'PhysicalAssetResponseDto',
    'createPhysicalAsset',
    true,
  ],
  [
    'list-physical-assets',
    'ListPhysicalAssetsUseCase',
    'MANAGE_BD',
    null,
    'PhysicalAssetResponseDto',
    'listPhysicalAssets',
    false,
  ],
  [
    'create-marketing-plan',
    'CreateMarketingPlanUseCase',
    'MANAGE_BD',
    'CreateMarketingPlanDto',
    'MarketingPlanResponseDto',
    'createMarketingPlan',
    true,
  ],
  [
    'create-campaign',
    'CreateCampaignUseCase',
    'MANAGE_BD',
    'CreateCampaignDto',
    'CampaignResponseDto',
    'createCampaign',
    true,
  ],
  [
    'record-brand-awareness',
    'RecordBrandAwarenessUseCase',
    'MANAGE_BD',
    'BrandAwarenessDto',
    'BrandAwarenessResponseDto',
    'recordBrandAwareness',
    true,
  ],
  [
    'get-analytics-summary',
    'GetAnalyticsSummaryUseCase',
    'VIEW_ANALYTICS',
    null,
    'AnalyticsSummaryResponseDto',
    'getAnalyticsSummary',
    false,
  ],
];

for (const [
  file,
  className,
  perm,
  reqDto,
  resDto,
  method,
  hasData,
] of specs) {
  const isList = method.startsWith('list');
  const ret = isList ? `${resDto}[]` : resDto;
  const args = hasData
    ? `actorId: string, data: ${reqDto}`
    : 'actorId: string';
  const body = isList
    ? `return (await this.repo.${method}()).map((e) => ${resDto}.fromEntity(e));`
    : hasData
      ? `return ${resDto}.fromEntity(await this.repo.${method}(data as never));`
      : `return ${resDto}.fromEntity(await this.repo.${method}());`;
  const dtoImports = [
    reqDto
      ? `import { ${reqDto} } from '../../dtos/bd-analytics/bd-analytics.dto.js';`
      : '',
    `import { ${resDto} } from '../../dtos/bd-analytics/bd-analytics.dto.js';`,
  ]
    .filter(Boolean)
    .join('\n');

  w(
    `src/application/use-cases/bd-analytics/${file}.use-case.ts`,
    `import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { BD_ANALYTICS_REPOSITORY } from '../../../domain/repositories/bd-analytics.repository.interface.js';
import type { IBdAnalyticsRepository } from '../../../domain/repositories/bd-analytics.repository.interface.js';
${dtoImports}
import { requirePermission } from '../_helpers/admin-authorization.helper.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';

@Injectable()
export class ${className} {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(BD_ANALYTICS_REPOSITORY) private readonly repo: IBdAnalyticsRepository,
  ) {}

  async execute(${args}): Promise<${ret}> {
    await requirePermission(this.users, actorId, PermissionCode.${perm});
    ${body}
  }
}
`,
  );
}

w(
  'src/application/use-cases/bd-analytics/refresh-daily-snapshots.use-case.ts',
  `import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { BD_ANALYTICS_REPOSITORY } from '../../../domain/repositories/bd-analytics.repository.interface.js';
import type { IBdAnalyticsRepository } from '../../../domain/repositories/bd-analytics.repository.interface.js';
import { DailySnapshotResponseDto } from '../../dtos/bd-analytics/bd-analytics.dto.js';
import { requirePermission } from '../_helpers/admin-authorization.helper.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';

@Injectable()
export class RefreshDailySnapshotsUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(BD_ANALYTICS_REPOSITORY) private readonly repo: IBdAnalyticsRepository,
  ) {}

  async execute(actorId: string, date: string): Promise<DailySnapshotResponseDto> {
    await requirePermission(this.users, actorId, PermissionCode.VIEW_ANALYTICS);
    return DailySnapshotResponseDto.fromEntity(await this.repo.refreshDailySnapshots(date));
  }
}
`,
);

console.log('bd ucs done');
