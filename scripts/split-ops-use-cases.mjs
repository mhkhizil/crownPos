/**
 * Splits *-ops.use-case.ts facades into one use-case file per action.
 * Run: node scripts/split-ops-use-cases.mjs
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

function writeUseCase({
  folder,
  file,
  className,
  permission,
  repoToken,
  repoInterfacePath,
  iRepo,
  executeArgs,
  executeBody,
  extraImports = '',
  extraInject = '',
}) {
  w(
    `src/application/use-cases/${folder}/${file}.ts`,
    `import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { ${repoToken} } from '../../../domain/repositories/${repoInterfacePath}.js';
import type { ${iRepo}${extraImports.includes('type') ? '' : ''} } from '../../../domain/repositories/${repoInterfacePath}.js';
import { requirePermission } from '../_helpers/admin-authorization.helper.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';
${extraImports}

@Injectable()
export class ${className} {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(${repoToken}) private readonly repo: ${iRepo},
    ${extraInject}
  ) {}

  async execute(${executeArgs}): Promise<unknown> {
    await requirePermission(this.users, actorId, PermissionCode.${permission});
    ${executeBody}
  }
}
`,
  );
  return className;
}

// ── SALES ──
const sales = [
  writeUseCase({
    folder: 'sales',
    file: 'list-sales-orders.use-case',
    className: 'ListSalesOrdersUseCase',
    permission: 'MANAGE_SALES',
    repoToken: 'SALES_REPOSITORY',
    repoInterfacePath: 'sales.repository.interface',
    iRepo: 'ISalesRepository',
    executeArgs: 'actorId: string',
    executeBody: 'return this.repo.listSalesOrders();',
  }),
  writeUseCase({
    folder: 'sales',
    file: 'get-sales-order.use-case',
    className: 'GetSalesOrderUseCase',
    permission: 'MANAGE_SALES',
    repoToken: 'SALES_REPOSITORY',
    repoInterfacePath: 'sales.repository.interface',
    iRepo: 'ISalesRepository',
    executeArgs: 'actorId: string, orderId: string',
    executeBody: 'return this.repo.getSalesOrder(orderId);',
  }),
  writeUseCase({
    folder: 'sales',
    file: 'create-sales-order.use-case',
    className: 'CreateSalesOrderUseCase',
    permission: 'MANAGE_SALES',
    repoToken: 'SALES_REPOSITORY',
    repoInterfacePath: 'sales.repository.interface',
    iRepo: 'ISalesRepository',
    extraImports:
      "import type { CreateSalesOrderInput } from '../../../domain/repositories/sales.repository.interface.js';",
    executeArgs: 'actorId: string, data: CreateSalesOrderInput',
    executeBody: `return this.repo.createSalesOrder({
      ...data,
      takenByUserId: data.takenByUserId ?? actorId,
    });`,
  }),
  writeUseCase({
    folder: 'sales',
    file: 'confirm-sales-order.use-case',
    className: 'ConfirmSalesOrderUseCase',
    permission: 'MANAGE_SALES',
    repoToken: 'SALES_REPOSITORY',
    repoInterfacePath: 'sales.repository.interface',
    iRepo: 'ISalesRepository',
    executeArgs: 'actorId: string, orderId: string',
    executeBody: 'return this.repo.confirmSalesOrder(orderId);',
  }),
];

w(
  'src/application/use-cases/sales/index.ts',
  sales.map((c) => `export * from './${c.replace(/([A-Z])/g, (m, i) => /* noop */ '')}';`).join('\n'),
);

// Fix sales index properly
w(
  'src/application/use-cases/sales/index.ts',
  `export * from './list-sales-orders.use-case.js';
export * from './get-sales-order.use-case.js';
export * from './create-sales-order.use-case.js';
export * from './confirm-sales-order.use-case.js';
`,
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
  @ApiOperation({ summary: 'Confirm order after stock check (blocks if no stock)' })
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

console.log('sales split done');
