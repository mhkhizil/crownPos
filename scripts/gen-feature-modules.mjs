import fs from 'fs';
import path from 'path';

const root = process.cwd();
function w(rel, content) {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
  console.log('✓', rel);
}

function feature({
  folder,
  Prefix,
  permission,
  REPO_TOKEN,
  repoInterfaceFile,
  IRepo,
  RepoClass,
  extraImports = '',
  extraProviders = '',
  opsMethods,
  controllerRoutes,
}) {
  w(
    `src/application/use-cases/${folder}/${folder}-ops.use-case.ts`,
    `import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { ${REPO_TOKEN} } from '../../../domain/repositories/${repoInterfaceFile}.js';
import type { ${IRepo} } from '../../../domain/repositories/${repoInterfaceFile}.js';
import { requirePermission } from '../_helpers/admin-authorization.helper.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';
${extraImports}

@Injectable()
export class ${Prefix}OpsUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(${REPO_TOKEN}) private readonly repo: ${IRepo},
  ) {}

  private async guard(actorId: string) {
    await requirePermission(this.users, actorId, PermissionCode.${permission});
  }

${opsMethods}
}
`,
  );

  w(
    `src/presentation/modules/${folder}/${folder}.controller.ts`,
    `import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../../common/decorators/current-user.decorator.js';
import { ApiResponseDto } from '../../../application/dtos/common/api-response.dto.js';
import { ${Prefix}OpsUseCase } from '../../../application/use-cases/${folder}/${folder}-ops.use-case.js';
import { ROUTE_PREFIX } from '../../routing.paths.js';

@ApiTags('${Prefix}')
@Controller(\`\${ROUTE_PREFIX.adminDashboard}/${folder}\`)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ${Prefix}Controller {
  constructor(private readonly ops: ${Prefix}OpsUseCase) {}

${controllerRoutes}
}
`,
  );

  w(
    `src/presentation/modules/${folder}/${folder}.module.ts`,
    `import { Module } from '@nestjs/common';
import { ${Prefix}Controller } from './${folder}.controller.js';
import { ${Prefix}OpsUseCase } from '../../../application/use-cases/${folder}/${folder}-ops.use-case.js';
import { ${REPO_TOKEN} } from '../../../domain/repositories/${repoInterfaceFile}.js';
import { ${RepoClass} } from '../../../infrastructure/repositories/${folder === 'bd-analytics' ? 'bd-analytics' : folder}.repository.js';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import { UserRepository } from '../../../infrastructure/repositories/user.repository.js';
${extraProviders.includes('INVENTORY') ? `import { INVENTORY_REPOSITORY } from '../../../domain/repositories/inventory.repository.interface.js';\nimport { InventoryRepository } from '../../../infrastructure/repositories/inventory.repository.js';` : ''}

@Module({
  controllers: [${Prefix}Controller],
  providers: [
    ${Prefix}OpsUseCase,
    { provide: ${REPO_TOKEN}, useClass: ${RepoClass} },
    { provide: USER_REPOSITORY, useClass: UserRepository },
    ${extraProviders}
  ],
})
export class ${Prefix}Module {}
`,
  );
}

// PRODUCTION — also updates inventory balances in use-case
feature({
  folder: 'production',
  Prefix: 'Production',
  permission: 'MANAGE_PRODUCTION',
  REPO_TOKEN: 'PRODUCTION_REPOSITORY',
  repoInterfaceFile: 'production.repository.interface',
  IRepo: 'IProductionRepository',
  RepoClass: 'ProductionRepository',
  extraImports: `import { INVENTORY_REPOSITORY } from '../../../domain/repositories/inventory.repository.interface.js';
import type { IInventoryRepository } from '../../../domain/repositories/inventory.repository.interface.js';
import type { UpsertProductionDayInput } from '../../../domain/repositories/production.repository.interface.js';`,
  extraProviders: `{ provide: INVENTORY_REPOSITORY, useClass: InventoryRepository },`,
  opsMethods: `  async list(actorId: string, factoryId?: string) {
    await this.guard(actorId);
    return this.repo.listProductionDays(factoryId);
  }

  async upsert(actorId: string, data: UpsertProductionDayInput) {
    await this.guard(actorId);
    const result = await this.repo.upsertProductionDay(data);
    const asOf = new Date(\`\${data.productionDate}T00:00:00.000Z\`);
    for (const line of data.lines) {
      await this.inventory.adjustBalance({
        itemType: 'FINISHED_GOOD',
        productSkuId: line.productSkuId,
        unitId: line.unitId,
        delta: line.quantityProduced,
        asOfDate: asOf,
      });
    }
    for (const usage of data.rawUsages) {
      await this.inventory.adjustBalance({
        itemType: 'RAW_MATERIAL',
        rawMaterialId: usage.rawMaterialId,
        unitId: usage.unitId,
        delta: -usage.quantityUsed,
        asOfDate: asOf,
      });
    }
    return result;
  }`,
  controllerRoutes: `  @Get()
  @ApiOperation({ summary: 'List daily production records' })
  async list(@CurrentUser() u: JwtPayload, @Query('factoryId') factoryId?: string) {
    return ApiResponseDto.success(await this.ops.list(u.sub, factoryId));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upsert daily production (output + employees + free-form raw usage)' })
  async upsert(@CurrentUser() u: JwtPayload, @Body() body: never) {
    return ApiResponseDto.success(await this.ops.upsert(u.sub, body), 'Production saved');
  }`,
});

// Fix production use-case - need inventory injected. Rewrite production-ops after.

console.log('base features scaffolding started');
