/**
 * Part 2: outbound, billing, pricing, bd-analytics, master-data
 * Run: node scripts/split-all-ops-part2.mjs
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
}

// OUTBOUND
uc({
  folder: 'outbound',
  file: 'list-outbounds.use-case',
  className: 'ListOutboundsUseCase',
  permission: 'MANAGE_OUTBOUND',
  repoToken: 'OUTBOUND_REPOSITORY',
  repoFile: 'outbound.repository.interface',
  iRepo: 'IOutboundRepository',
  args: 'actorId: string',
  body: 'return this.repo.listOutbounds();',
});
uc({
  folder: 'outbound',
  file: 'create-outbound.use-case',
  className: 'CreateOutboundUseCase',
  permission: 'MANAGE_OUTBOUND',
  repoToken: 'OUTBOUND_REPOSITORY',
  repoFile: 'outbound.repository.interface',
  iRepo: 'IOutboundRepository',
  typeImports:
    "import type { CreateOutboundInput } from '../../../domain/repositories/outbound.repository.interface.js';\n",
  args: 'actorId: string, data: CreateOutboundInput',
  body: 'return this.repo.createOutbound(data);',
});
uc({
  folder: 'outbound',
  file: 'transition-outbound-status.use-case',
  className: 'TransitionOutboundStatusUseCase',
  permission: 'MANAGE_OUTBOUND',
  repoToken: 'OUTBOUND_REPOSITORY',
  repoFile: 'outbound.repository.interface',
  iRepo: 'IOutboundRepository',
  typeImports:
    "import type { OutboundStatus } from '../../../domain/repositories/outbound.repository.interface.js';\n",
  args: 'actorId: string, outboundId: string, toStatus: OutboundStatus, notes?: string',
  body: 'return this.repo.transitionOutbound(outboundId, toStatus, notes);',
});
w(
  'src/application/use-cases/outbound/index.ts',
  `export * from './list-outbounds.use-case.js';
export * from './create-outbound.use-case.js';
export * from './transition-outbound-status.use-case.js';
`,
);
w(
  'src/presentation/modules/outbound/outbound.controller.ts',
  `import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../../common/decorators/current-user.decorator.js';
import { ApiResponseDto } from '../../../application/dtos/common/api-response.dto.js';
import { ListOutboundsUseCase } from '../../../application/use-cases/outbound/list-outbounds.use-case.js';
import { CreateOutboundUseCase } from '../../../application/use-cases/outbound/create-outbound.use-case.js';
import { TransitionOutboundStatusUseCase } from '../../../application/use-cases/outbound/transition-outbound-status.use-case.js';
import { ROUTE_PREFIX } from '../../routing.paths.js';
import type {
  CreateOutboundInput,
  OutboundStatus,
} from '../../../domain/repositories/outbound.repository.interface.js';

@ApiTags('Outbound')
@Controller(\`\${ROUTE_PREFIX.adminDashboard}/outbound\`)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OutboundController {
  constructor(
    private readonly listOutbounds: ListOutboundsUseCase,
    private readonly createOutbound: CreateOutboundUseCase,
    private readonly transitionOutbound: TransitionOutboundStatusUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List factory outbounds' })
  async list(@CurrentUser() u: JwtPayload) {
    return ApiResponseDto.success(await this.listOutbounds.execute(u.sub));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Schedule outbound (direct shop or via gate)' })
  async create(
    @CurrentUser() u: JwtPayload,
    @Body() body: CreateOutboundInput,
  ) {
    return ApiResponseDto.success(
      await this.createOutbound.execute(u.sub, body),
      'Outbound created',
    );
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Transition outbound status through to RECEIVED' })
  async transition(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
    @Body() body: { toStatus: OutboundStatus; notes?: string },
  ) {
    return ApiResponseDto.success(
      await this.transitionOutbound.execute(
        u.sub,
        id,
        body.toStatus,
        body.notes,
      ),
      'Outbound status updated',
    );
  }
}
`,
);
w(
  'src/presentation/modules/outbound/outbound.module.ts',
  `import { Module } from '@nestjs/common';
import { OutboundController } from './outbound.controller.js';
import { ListOutboundsUseCase } from '../../../application/use-cases/outbound/list-outbounds.use-case.js';
import { CreateOutboundUseCase } from '../../../application/use-cases/outbound/create-outbound.use-case.js';
import { TransitionOutboundStatusUseCase } from '../../../application/use-cases/outbound/transition-outbound-status.use-case.js';
import { OUTBOUND_REPOSITORY } from '../../../domain/repositories/outbound.repository.interface.js';
import { OutboundRepository } from '../../../infrastructure/repositories/outbound.repository.js';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import { UserRepository } from '../../../infrastructure/repositories/user.repository.js';

@Module({
  controllers: [OutboundController],
  providers: [
    ListOutboundsUseCase,
    CreateOutboundUseCase,
    TransitionOutboundStatusUseCase,
    { provide: OUTBOUND_REPOSITORY, useClass: OutboundRepository },
    { provide: USER_REPOSITORY, useClass: UserRepository },
  ],
})
export class OutboundModule {}
`,
);

// BILLING
uc({
  folder: 'billing',
  file: 'list-invoices.use-case',
  className: 'ListInvoicesUseCase',
  permission: 'MANAGE_BILLING',
  repoToken: 'BILLING_REPOSITORY',
  repoFile: 'billing.repository.interface',
  iRepo: 'IBillingRepository',
  args: 'actorId: string',
  body: 'return this.repo.listInvoices();',
});
uc({
  folder: 'billing',
  file: 'create-invoice-from-order.use-case',
  className: 'CreateInvoiceFromOrderUseCase',
  permission: 'MANAGE_BILLING',
  repoToken: 'BILLING_REPOSITORY',
  repoFile: 'billing.repository.interface',
  iRepo: 'IBillingRepository',
  args: 'actorId: string, salesOrderId: string, dueDate?: string',
  body: 'return this.repo.createInvoiceFromOrder(salesOrderId, dueDate);',
});
uc({
  folder: 'billing',
  file: 'list-payments.use-case',
  className: 'ListPaymentsUseCase',
  permission: 'MANAGE_BILLING',
  repoToken: 'BILLING_REPOSITORY',
  repoFile: 'billing.repository.interface',
  iRepo: 'IBillingRepository',
  args: 'actorId: string',
  body: 'return this.repo.listPayments();',
});
uc({
  folder: 'billing',
  file: 'record-payment.use-case',
  className: 'RecordPaymentUseCase',
  permission: 'MANAGE_BILLING',
  repoToken: 'BILLING_REPOSITORY',
  repoFile: 'billing.repository.interface',
  iRepo: 'IBillingRepository',
  typeImports:
    "import type { RecordPaymentInput } from '../../../domain/repositories/billing.repository.interface.js';\n",
  args: 'actorId: string, data: RecordPaymentInput',
  body: 'return this.repo.recordPayment(data);',
});
uc({
  folder: 'billing',
  file: 'list-collection-reminders.use-case',
  className: 'ListCollectionRemindersUseCase',
  permission: 'MANAGE_BILLING',
  repoToken: 'BILLING_REPOSITORY',
  repoFile: 'billing.repository.interface',
  iRepo: 'IBillingRepository',
  args: 'actorId: string',
  body: 'return this.repo.listReminders();',
});
uc({
  folder: 'billing',
  file: 'create-collection-reminder.use-case',
  className: 'CreateCollectionReminderUseCase',
  permission: 'MANAGE_BILLING',
  repoToken: 'BILLING_REPOSITORY',
  repoFile: 'billing.repository.interface',
  iRepo: 'IBillingRepository',
  typeImports:
    "import type { CreateCollectionReminderInput } from '../../../domain/repositories/billing.repository.interface.js';\n",
  args:
    "actorId: string, data: Omit<CreateCollectionReminderInput, 'createdByUserId'>",
  body: `return this.repo.createCollectionReminder({
      ...data,
      createdByUserId: actorId,
    });`,
});
w(
  'src/application/use-cases/billing/index.ts',
  `export * from './list-invoices.use-case.js';
export * from './create-invoice-from-order.use-case.js';
export * from './list-payments.use-case.js';
export * from './record-payment.use-case.js';
export * from './list-collection-reminders.use-case.js';
export * from './create-collection-reminder.use-case.js';
`,
);
w(
  'src/presentation/modules/billing/billing.controller.ts',
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
import { ListInvoicesUseCase } from '../../../application/use-cases/billing/list-invoices.use-case.js';
import { CreateInvoiceFromOrderUseCase } from '../../../application/use-cases/billing/create-invoice-from-order.use-case.js';
import { ListPaymentsUseCase } from '../../../application/use-cases/billing/list-payments.use-case.js';
import { RecordPaymentUseCase } from '../../../application/use-cases/billing/record-payment.use-case.js';
import { ListCollectionRemindersUseCase } from '../../../application/use-cases/billing/list-collection-reminders.use-case.js';
import { CreateCollectionReminderUseCase } from '../../../application/use-cases/billing/create-collection-reminder.use-case.js';
import { ROUTE_PREFIX } from '../../routing.paths.js';
import type {
  CreateCollectionReminderInput,
  RecordPaymentInput,
} from '../../../domain/repositories/billing.repository.interface.js';

@ApiTags('Billing')
@Controller(\`\${ROUTE_PREFIX.adminDashboard}/billing\`)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BillingController {
  constructor(
    private readonly listInvoices: ListInvoicesUseCase,
    private readonly createInvoice: CreateInvoiceFromOrderUseCase,
    private readonly listPayments: ListPaymentsUseCase,
    private readonly recordPayment: RecordPaymentUseCase,
    private readonly listReminders: ListCollectionRemindersUseCase,
    private readonly createReminder: CreateCollectionReminderUseCase,
  ) {}

  @Get('invoices')
  async invoices(@CurrentUser() u: JwtPayload) {
    return ApiResponseDto.success(await this.listInvoices.execute(u.sub));
  }

  @Post('invoices/from-order/:salesOrderId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create invoice from sales order' })
  async createInvoiceFromOrder(
    @CurrentUser() u: JwtPayload,
    @Param('salesOrderId') salesOrderId: string,
    @Body() body: { dueDate?: string },
  ) {
    return ApiResponseDto.success(
      await this.createInvoice.execute(u.sub, salesOrderId, body?.dueDate),
      'Invoice created',
    );
  }

  @Get('payments')
  async payments(@CurrentUser() u: JwtPayload) {
    return ApiResponseDto.success(await this.listPayments.execute(u.sub));
  }

  @Post('payments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record payment (partial / multi-invoice OK)' })
  async pay(
    @CurrentUser() u: JwtPayload,
    @Body() body: RecordPaymentInput,
  ) {
    return ApiResponseDto.success(
      await this.recordPayment.execute(u.sub, body),
      'Payment recorded',
    );
  }

  @Get('collection-reminders')
  async reminders(@CurrentUser() u: JwtPayload) {
    return ApiResponseDto.success(await this.listReminders.execute(u.sub));
  }

  @Post('collection-reminders')
  @HttpCode(HttpStatus.CREATED)
  async scheduleReminder(
    @CurrentUser() u: JwtPayload,
    @Body() body: Omit<CreateCollectionReminderInput, 'createdByUserId'>,
  ) {
    return ApiResponseDto.success(
      await this.createReminder.execute(u.sub, body),
      'Reminder scheduled',
    );
  }
}
`,
);
w(
  'src/presentation/modules/billing/billing.module.ts',
  `import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller.js';
import { ListInvoicesUseCase } from '../../../application/use-cases/billing/list-invoices.use-case.js';
import { CreateInvoiceFromOrderUseCase } from '../../../application/use-cases/billing/create-invoice-from-order.use-case.js';
import { ListPaymentsUseCase } from '../../../application/use-cases/billing/list-payments.use-case.js';
import { RecordPaymentUseCase } from '../../../application/use-cases/billing/record-payment.use-case.js';
import { ListCollectionRemindersUseCase } from '../../../application/use-cases/billing/list-collection-reminders.use-case.js';
import { CreateCollectionReminderUseCase } from '../../../application/use-cases/billing/create-collection-reminder.use-case.js';
import { BILLING_REPOSITORY } from '../../../domain/repositories/billing.repository.interface.js';
import { BillingRepository } from '../../../infrastructure/repositories/billing.repository.js';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import { UserRepository } from '../../../infrastructure/repositories/user.repository.js';

@Module({
  controllers: [BillingController],
  providers: [
    ListInvoicesUseCase,
    CreateInvoiceFromOrderUseCase,
    ListPaymentsUseCase,
    RecordPaymentUseCase,
    ListCollectionRemindersUseCase,
    CreateCollectionReminderUseCase,
    { provide: BILLING_REPOSITORY, useClass: BillingRepository },
    { provide: USER_REPOSITORY, useClass: UserRepository },
  ],
})
export class BillingModule {}
`,
);

console.log('outbound + billing done');
