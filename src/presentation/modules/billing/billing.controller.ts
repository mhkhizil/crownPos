import {
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
import {
  ApiArraySuccessResponse,
  ApiSuccessResponse,
} from '../../../common/decorators/api-response.decorator.js';
import { ApiResponseDto } from '../../../application/dtos/common/api-response.dto.js';
import { ListInvoicesUseCase } from '../../../application/use-cases/billing/list-invoices.use-case.js';
import { CreateInvoiceFromOrderUseCase } from '../../../application/use-cases/billing/create-invoice-from-order.use-case.js';
import { UpdateInvoiceRecoverabilityUseCase } from '../../../application/use-cases/billing/update-invoice-recoverability.use-case.js';
import { ListPaymentsUseCase } from '../../../application/use-cases/billing/list-payments.use-case.js';
import { RecordPaymentUseCase } from '../../../application/use-cases/billing/record-payment.use-case.js';
import { ListCollectionRemindersUseCase } from '../../../application/use-cases/billing/list-collection-reminders.use-case.js';
import { CreateCollectionReminderUseCase } from '../../../application/use-cases/billing/create-collection-reminder.use-case.js';
import { DispatchDueCollectionRemindersUseCase } from '../../../application/use-cases/billing/dispatch-due-collection-reminders.use-case.js';
import { ROUTE_PREFIX } from '../../routing.paths.js';
import {
  CollectionReminderResponseDto,
  CreateCollectionReminderDto,
  CreateInvoiceFromOrderDto,
  DispatchDueCollectionRemindersResultDto,
  InvoiceResponseDto,
  PaymentResponseDto,
  RecordPaymentDto,
  UpdateInvoiceRecoverabilityDto,
} from '../../../application/dtos/billing/index.js';

@ApiTags('Billing')
@Controller(`${ROUTE_PREFIX.adminDashboard}/billing`)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BillingController {
  constructor(
    private readonly listInvoices: ListInvoicesUseCase,
    private readonly createInvoice: CreateInvoiceFromOrderUseCase,
    private readonly updateRecoverability: UpdateInvoiceRecoverabilityUseCase,
    private readonly listPayments: ListPaymentsUseCase,
    private readonly recordPayment: RecordPaymentUseCase,
    private readonly listReminders: ListCollectionRemindersUseCase,
    private readonly createReminder: CreateCollectionReminderUseCase,
    private readonly dispatchDueReminders: DispatchDueCollectionRemindersUseCase,
  ) {}

  @Get('invoices')
  @ApiOperation({
    summary: 'List invoices',
    description:
      'Returns invoices including `recoverability` (LIKELY | DOUBTFUL | HOPELESS). ' +
      'Use PATCH .../invoices/:id/recoverability before annual zakat calculate so doubtful/hopeless AR is not counted as zakatable wealth.',
  })
  @ApiArraySuccessResponse(InvoiceResponseDto, {
    status: HttpStatus.OK,
    description: 'Invoices retrieved',
  })
  async invoices(
    @CurrentUser() u: JwtPayload,
  ): Promise<ApiResponseDto<InvoiceResponseDto[]>> {
    return ApiResponseDto.success(await this.listInvoices.execute(u.sub));
  }

  @Post('invoices/from-order/:salesOrderId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create invoice from sales order',
    description:
      'Creates an ISSUED invoice with recoverability=LIKELY (default). New AR is included in zakat until staff reclassifies it.',
  })
  @ApiSuccessResponse(InvoiceResponseDto, {
    status: HttpStatus.CREATED,
    description: 'Invoice created',
  })
  async createInvoiceFromOrder(
    @CurrentUser() u: JwtPayload,
    @Param('salesOrderId') salesOrderId: string,
    @Body() body: CreateInvoiceFromOrderDto,
  ): Promise<ApiResponseDto<InvoiceResponseDto>> {
    return ApiResponseDto.success(
      await this.createInvoice.execute(u.sub, salesOrderId, body?.dueDate),
      'Invoice created',
    );
  }

  @Patch('invoices/:id/recoverability')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Set invoice recoverability (zakat AR filter)',
    description:
      'Marks whether an open receivable should count toward Hanafi business zakat.\n\n' +
      '**Why this exists:** Payment status (ISSUED / PARTIALLY_PAID / OVERDUE) is not the same as recoverability. ' +
      'A shop overdue 2 years may still be expected to pay (LIKELY), or may be bankrupt/denied (HOPELESS). ' +
      'Without this flag, all open AR inflated zakatable wealth equally.\n\n' +
      '**Values**\n' +
      '- `LIKELY` (default): include `balanceDueMmk` in zakat `receivablesMmk`.\n' +
      '- `DOUBTFUL`: exclude from zakat net; amount still shown as `excludedDoubtfulReceivablesMmk` on calculate. ' +
      'If cash later arrives, treat it as cash/bank that year (manual cash field) — typically zakat that recovery year, not backfilled years.\n' +
      '- `HOPELESS`: exclude from zakat like irrecoverable debt for the estimate; collection can continue. Prefer this over WRITTEN_OFF when you only want a zakat exclusion without accounting write-off.\n\n' +
      '**Still always excluded from AR regardless of flag:** DRAFT, CANCELLED, WRITTEN_OFF.\n\n' +
      '**Permission:** `MANAGE_BILLING`. Affects next `POST .../bd-analytics/zakat/hanafi/calculate` snapshot.',
  })
  @ApiSuccessResponse(InvoiceResponseDto, {
    status: HttpStatus.OK,
    description: 'Invoice recoverability updated',
  })
  async patchRecoverability(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
    @Body() body: UpdateInvoiceRecoverabilityDto,
  ): Promise<ApiResponseDto<InvoiceResponseDto>> {
    return ApiResponseDto.success(
      await this.updateRecoverability.execute(u.sub, id, body),
      'Invoice recoverability updated',
    );
  }

  @Get('payments')
  @ApiOperation({ summary: 'List payments' })
  @ApiArraySuccessResponse(PaymentResponseDto, {
    status: HttpStatus.OK,
    description: 'Payments retrieved',
  })
  async payments(
    @CurrentUser() u: JwtPayload,
  ): Promise<ApiResponseDto<PaymentResponseDto[]>> {
    return ApiResponseDto.success(await this.listPayments.execute(u.sub));
  }

  @Post('payments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record payment (partial / multi-invoice OK)' })
  @ApiSuccessResponse(PaymentResponseDto, {
    status: HttpStatus.CREATED,
    description: 'Payment recorded',
  })
  async pay(
    @CurrentUser() u: JwtPayload,
    @Body() body: RecordPaymentDto,
  ): Promise<ApiResponseDto<PaymentResponseDto>> {
    return ApiResponseDto.success(
      await this.recordPayment.execute(u.sub, body),
      'Payment recorded',
    );
  }

  @Get('collection-reminders')
  @ApiOperation({ summary: 'List collection reminders' })
  @ApiArraySuccessResponse(CollectionReminderResponseDto, {
    status: HttpStatus.OK,
    description: 'Collection reminders retrieved',
  })
  async reminders(
    @CurrentUser() u: JwtPayload,
  ): Promise<ApiResponseDto<CollectionReminderResponseDto[]>> {
    return ApiResponseDto.success(await this.listReminders.execute(u.sub));
  }

  @Post('collection-reminders')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Schedule collection reminder' })
  @ApiSuccessResponse(CollectionReminderResponseDto, {
    status: HttpStatus.CREATED,
    description: 'Reminder scheduled',
  })
  async scheduleReminder(
    @CurrentUser() u: JwtPayload,
    @Body() body: CreateCollectionReminderDto,
  ): Promise<ApiResponseDto<CollectionReminderResponseDto>> {
    return ApiResponseDto.success(
      await this.createReminder.execute(u.sub, body),
      'Reminder scheduled',
    );
  }

  @Post('collection-reminders/dispatch-due')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Dispatch due collection reminders now (Pusher alarm + optional email/SMS)',
  })
  @ApiSuccessResponse(DispatchDueCollectionRemindersResultDto, {
    status: HttpStatus.OK,
    description: 'Due reminders dispatched',
  })
  async dispatchReminders(
    @CurrentUser() u: JwtPayload,
  ): Promise<ApiResponseDto<DispatchDueCollectionRemindersResultDto>> {
    return ApiResponseDto.success(
      await this.dispatchDueReminders.execute(u.sub),
      'Due reminders dispatched',
    );
  }
}
