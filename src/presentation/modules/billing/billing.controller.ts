import {
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
import {
  ApiArraySuccessResponse,
  ApiSuccessResponse,
} from '../../../common/decorators/api-response.decorator.js';
import { ApiResponseDto } from '../../../application/dtos/common/api-response.dto.js';
import { ListInvoicesUseCase } from '../../../application/use-cases/billing/list-invoices.use-case.js';
import { CreateInvoiceFromOrderUseCase } from '../../../application/use-cases/billing/create-invoice-from-order.use-case.js';
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
} from '../../../application/dtos/billing/index.js';

@ApiTags('Billing')
@Controller(`${ROUTE_PREFIX.adminDashboard}/billing`)
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
    private readonly dispatchDueReminders: DispatchDueCollectionRemindersUseCase,
  ) {}

  @Get('invoices')
  @ApiOperation({ summary: 'List invoices' })
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
  @ApiOperation({ summary: 'Create invoice from sales order' })
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
