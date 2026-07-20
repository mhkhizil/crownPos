/**
 * Split all *-ops.use-case.ts into one use-case file per action.
 * Run: node scripts/split-all-ops.mjs
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
  ctorExtra = '',
  fieldExtra = '',
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
    ${ctorExtra}
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
  return { className, file };
}

// ========== SALES ==========
const salesUcs = [
  uc({
    folder: 'sales',
    file: 'list-sales-orders.use-case',
    className: 'ListSalesOrdersUseCase',
    permission: 'MANAGE_SALES',
    repoToken: 'SALES_REPOSITORY',
    repoFile: 'sales.repository.interface',
    iRepo: 'ISalesRepository',
    args: 'actorId: string',
    body: 'return this.repo.listSalesOrders();',
  }),
  uc({
    folder: 'sales',
    file: 'get-sales-order.use-case',
    className: 'GetSalesOrderUseCase',
    permission: 'MANAGE_SALES',
    repoToken: 'SALES_REPOSITORY',
    repoFile: 'sales.repository.interface',
    iRepo: 'ISalesRepository',
    args: 'actorId: string, orderId: string',
    body: 'return this.repo.getSalesOrder(orderId);',
  }),
  uc({
    folder: 'sales',
    file: 'create-sales-order.use-case',
    className: 'CreateSalesOrderUseCase',
    permission: 'MANAGE_SALES',
    repoToken: 'SALES_REPOSITORY',
    repoFile: 'sales.repository.interface',
    iRepo: 'ISalesRepository',
    typeImports:
      "import type { CreateSalesOrderInput } from '../../../domain/repositories/sales.repository.interface.js';\n",
    args: 'actorId: string, data: CreateSalesOrderInput',
    body: `return this.repo.createSalesOrder({
      ...data,
      takenByUserId: data.takenByUserId ?? actorId,
    });`,
  }),
  uc({
    folder: 'sales',
    file: 'confirm-sales-order.use-case',
    className: 'ConfirmSalesOrderUseCase',
    permission: 'MANAGE_SALES',
    repoToken: 'SALES_REPOSITORY',
    repoFile: 'sales.repository.interface',
    iRepo: 'ISalesRepository',
    args: 'actorId: string, orderId: string',
    body: 'return this.repo.confirmSalesOrder(orderId);',
  }),
];
w(
  'src/application/use-cases/sales/index.ts',
  salesUcs.map((u) => `export * from './${u.file}.js';`).join('\n') + '\n',
);

w(
  'src/presentation/modules/sales/sales.controller.ts',
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
import { ListSalesOrdersUseCase } from '../../../application/use-cases/sales/list-sales-orders.use-case.js';
import { GetSalesOrderUseCase } from '../../../application/use-cases/sales/get-sales-order.use-case.js';
import { CreateSalesOrderUseCase } from '../../../application/use-cases/sales/create-sales-order.use-case.js';
import { ConfirmSalesOrderUseCase } from '../../../application/use-cases/sales/confirm-sales-order.use-case.js';
import { ROUTE_PREFIX } from '../../routing.paths.js';
import type { CreateSalesOrderInput } from '../../../domain/repositories/sales.repository.interface.js';

@ApiTags('Sales')
@Controller(\`\${ROUTE_PREFIX.adminDashboard}/sales\`)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SalesController {
  constructor(
    private readonly listSalesOrders: ListSalesOrdersUseCase,
    private readonly getSalesOrder: GetSalesOrderUseCase,
    private readonly createSalesOrder: CreateSalesOrderUseCase,
    private readonly confirmSalesOrder: ConfirmSalesOrderUseCase,
  ) {}

  @Get('orders')
  @ApiOperation({ summary: 'List sales orders' })
  async list(@CurrentUser() u: JwtPayload) {
    return ApiResponseDto.success(await this.listSalesOrders.execute(u.sub));
  }

  @Get('orders/:id')
  async get(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    return ApiResponseDto.success(await this.getSalesOrder.execute(u.sub, id));
  }

  @Post('orders')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create sales order (shop call or sales call)' })
  async create(
    @CurrentUser() u: JwtPayload,
    @Body() body: CreateSalesOrderInput,
  ) {
    return ApiResponseDto.success(
      await this.createSalesOrder.execute(u.sub, body),
      'Order created',
    );
  }

  @Post('orders/:id/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirm order after stock check (blocks if no stock)',
  })
  async confirm(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    return ApiResponseDto.success(
      await this.confirmSalesOrder.execute(u.sub, id),
      'Order confirmed',
    );
  }
}
`,
);

w(
  'src/presentation/modules/sales/sales.module.ts',
  `import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller.js';
import { ListSalesOrdersUseCase } from '../../../application/use-cases/sales/list-sales-orders.use-case.js';
import { GetSalesOrderUseCase } from '../../../application/use-cases/sales/get-sales-order.use-case.js';
import { CreateSalesOrderUseCase } from '../../../application/use-cases/sales/create-sales-order.use-case.js';
import { ConfirmSalesOrderUseCase } from '../../../application/use-cases/sales/confirm-sales-order.use-case.js';
import { SALES_REPOSITORY } from '../../../domain/repositories/sales.repository.interface.js';
import { SalesRepository } from '../../../infrastructure/repositories/sales.repository.js';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import { UserRepository } from '../../../infrastructure/repositories/user.repository.js';

@Module({
  controllers: [SalesController],
  providers: [
    ListSalesOrdersUseCase,
    GetSalesOrderUseCase,
    CreateSalesOrderUseCase,
    ConfirmSalesOrderUseCase,
    { provide: SALES_REPOSITORY, useClass: SalesRepository },
    { provide: USER_REPOSITORY, useClass: UserRepository },
  ],
})
export class SalesModule {}
`,
);

// ========== PRODUCTION ==========
uc({
  folder: 'production',
  file: 'list-production-days.use-case',
  className: 'ListProductionDaysUseCase',
  permission: 'MANAGE_PRODUCTION',
  repoToken: 'PRODUCTION_REPOSITORY',
  repoFile: 'production.repository.interface',
  iRepo: 'IProductionRepository',
  args: 'actorId: string, factoryId?: string',
  body: 'return this.repo.listProductionDays(factoryId);',
});

uc({
  folder: 'production',
  file: 'upsert-production-day.use-case',
  className: 'UpsertProductionDayUseCase',
  permission: 'MANAGE_PRODUCTION',
  repoToken: 'PRODUCTION_REPOSITORY',
  repoFile: 'production.repository.interface',
  iRepo: 'IProductionRepository',
  typeImports: `import type { UpsertProductionDayInput } from '../../../domain/repositories/production.repository.interface.js';
import { INVENTORY_REPOSITORY } from '../../../domain/repositories/inventory.repository.interface.js';
import type { IInventoryRepository } from '../../../domain/repositories/inventory.repository.interface.js';
`,
  ctorExtra:
    '@Inject(INVENTORY_REPOSITORY) private readonly inventory: IInventoryRepository,',
  args: 'actorId: string, data: UpsertProductionDayInput',
  body: `const result = await this.repo.upsertProductionDay(data);
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
    return result;`,
});

w(
  'src/application/use-cases/production/index.ts',
  `export * from './list-production-days.use-case.js';
export * from './upsert-production-day.use-case.js';
`,
);

w(
  'src/presentation/modules/production/production.controller.ts',
  `import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../../common/decorators/current-user.decorator.js';
import { ApiResponseDto } from '../../../application/dtos/common/api-response.dto.js';
import { ListProductionDaysUseCase } from '../../../application/use-cases/production/list-production-days.use-case.js';
import { UpsertProductionDayUseCase } from '../../../application/use-cases/production/upsert-production-day.use-case.js';
import { ROUTE_PREFIX } from '../../routing.paths.js';
import type { UpsertProductionDayInput } from '../../../domain/repositories/production.repository.interface.js';

@ApiTags('Production')
@Controller(\`\${ROUTE_PREFIX.adminDashboard}/production\`)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProductionController {
  constructor(
    private readonly listProductionDays: ListProductionDaysUseCase,
    private readonly upsertProductionDay: UpsertProductionDayUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List daily production records' })
  async list(
    @CurrentUser() u: JwtPayload,
    @Query('factoryId') factoryId?: string,
  ) {
    return ApiResponseDto.success(
      await this.listProductionDays.execute(u.sub, factoryId),
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Upsert daily production (output + employees + free-form raw usage)',
  })
  async upsert(
    @CurrentUser() u: JwtPayload,
    @Body() body: UpsertProductionDayInput,
  ) {
    return ApiResponseDto.success(
      await this.upsertProductionDay.execute(u.sub, body),
      'Production saved',
    );
  }
}
`,
);

w(
  'src/presentation/modules/production/production.module.ts',
  `import { Module } from '@nestjs/common';
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
`,
);

// ========== INVENTORY ==========
uc({
  folder: 'inventory',
  file: 'list-inventory-balances.use-case',
  className: 'ListInventoryBalancesUseCase',
  permission: 'MANAGE_INVENTORY',
  repoToken: 'INVENTORY_REPOSITORY',
  repoFile: 'inventory.repository.interface',
  iRepo: 'IInventoryRepository',
  args: 'actorId: string, stockLocationId?: string',
  body: 'return this.repo.listInventoryBalances(stockLocationId);',
});
uc({
  folder: 'inventory',
  file: 'record-daily-stock-count.use-case',
  className: 'RecordDailyStockCountUseCase',
  permission: 'MANAGE_INVENTORY',
  repoToken: 'INVENTORY_REPOSITORY',
  repoFile: 'inventory.repository.interface',
  iRepo: 'IInventoryRepository',
  typeImports:
    "import type { RecordDailyStockCountInput } from '../../../domain/repositories/inventory.repository.interface.js';\n",
  args: 'actorId: string, data: RecordDailyStockCountInput',
  body: 'return this.repo.recordDailyStockCount(data);',
});
w(
  'src/application/use-cases/inventory/index.ts',
  `export * from './list-inventory-balances.use-case.js';
export * from './record-daily-stock-count.use-case.js';
`,
);
w(
  'src/presentation/modules/inventory/inventory.controller.ts',
  `import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../../common/decorators/current-user.decorator.js';
import { ApiResponseDto } from '../../../application/dtos/common/api-response.dto.js';
import { ListInventoryBalancesUseCase } from '../../../application/use-cases/inventory/list-inventory-balances.use-case.js';
import { RecordDailyStockCountUseCase } from '../../../application/use-cases/inventory/record-daily-stock-count.use-case.js';
import { ROUTE_PREFIX } from '../../routing.paths.js';
import type { RecordDailyStockCountInput } from '../../../domain/repositories/inventory.repository.interface.js';

@ApiTags('Inventory')
@Controller(\`\${ROUTE_PREFIX.adminDashboard}/inventory\`)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(
    private readonly listBalances: ListInventoryBalancesUseCase,
    private readonly recordStockCount: RecordDailyStockCountUseCase,
  ) {}

  @Get('balances')
  @ApiOperation({ summary: 'List inventory balances for stock checks' })
  async balances(
    @CurrentUser() u: JwtPayload,
    @Query('stockLocationId') stockLocationId?: string,
  ) {
    return ApiResponseDto.success(
      await this.listBalances.execute(u.sub, stockLocationId),
    );
  }

  @Post('stock-counts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record end-of-day stock count' })
  async stockCount(
    @CurrentUser() u: JwtPayload,
    @Body() body: RecordDailyStockCountInput,
  ) {
    return ApiResponseDto.success(
      await this.recordStockCount.execute(u.sub, body),
      'Stock count saved',
    );
  }
}
`,
);
w(
  'src/presentation/modules/inventory/inventory.module.ts',
  `import { Module } from '@nestjs/common';
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
`,
);

console.log('sales/production/inventory done');
