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
import { CreatePurchaseOrderUseCase } from '../../../application/use-cases/purchases/create-purchase-order.use-case.js';
import { ReceivePurchaseOrderUseCase } from '../../../application/use-cases/purchases/receive-purchase-order.use-case.js';
import {
  CancelPurchaseOrderUseCase,
  GetPurchaseOrderUseCase,
  ListPurchaseOrdersUseCase,
} from '../../../application/use-cases/purchases/list-get-cancel-purchase.use-case.js';
import { ROUTE_PREFIX } from '../../routing.paths.js';
import {
  CreatePurchaseOrderDto,
  PurchaseOrderResponseDto,
  ReceivePurchaseOrderDto,
} from '../../../application/dtos/purchases/index.js';

@ApiTags('Purchases / Raw inbound')
@Controller(`${ROUTE_PREFIX.adminDashboard}/purchases`)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PurchasesController {
  constructor(
    private readonly createPurchase: CreatePurchaseOrderUseCase,
    private readonly listPurchases: ListPurchaseOrdersUseCase,
    private readonly getPurchase: GetPurchaseOrderUseCase,
    private readonly receivePurchase: ReceivePurchaseOrderUseCase,
    private readonly cancelPurchase: CancelPurchaseOrderUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List purchase orders' })
  @ApiArraySuccessResponse(PurchaseOrderResponseDto, {
    status: HttpStatus.OK,
    description: 'Purchase orders retrieved',
  })
  async list(
    @CurrentUser() u: JwtPayload,
  ): Promise<ApiResponseDto<PurchaseOrderResponseDto[]>> {
    return ApiResponseDto.success(await this.listPurchases.execute(u.sub));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get purchase order by id' })
  @ApiSuccessResponse(PurchaseOrderResponseDto, {
    status: HttpStatus.OK,
    description: 'Purchase order retrieved',
  })
  async getOne(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
  ): Promise<ApiResponseDto<PurchaseOrderResponseDto>> {
    return ApiResponseDto.success(await this.getPurchase.execute(u.sub, id));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create purchase order (raw inbound)',
    description:
      'Creates an ORDERED purchase. Set `receiveImmediately=true` to fully receive into warehouse stock in the same call (drop raw as needed).',
  })
  @ApiSuccessResponse(PurchaseOrderResponseDto, {
    status: HttpStatus.CREATED,
    description: 'Purchase order created',
  })
  async create(
    @CurrentUser() u: JwtPayload,
    @Body() body: CreatePurchaseOrderDto,
  ): Promise<ApiResponseDto<PurchaseOrderResponseDto>> {
    return ApiResponseDto.success(
      await this.createPurchase.execute(u.sub, body),
      body.receiveImmediately
        ? 'Purchase created and received into inventory'
        : 'Purchase order created',
    );
  }

  @Post(':id/receive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Receive raw materials against a purchase order',
    description:
      'Increments line quantityReceived and increases RAW_MATERIAL inventory balances. Supports partial receive.',
  })
  @ApiSuccessResponse(PurchaseOrderResponseDto, {
    status: HttpStatus.OK,
    description: 'Purchase receive applied',
  })
  async receive(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
    @Body() body: ReceivePurchaseOrderDto,
  ): Promise<ApiResponseDto<PurchaseOrderResponseDto>> {
    return ApiResponseDto.success(
      await this.receivePurchase.execute(u.sub, id, body),
      'Raw materials received into inventory',
    );
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel purchase order',
    description: 'Only allowed when nothing has been received yet.',
  })
  @ApiSuccessResponse(PurchaseOrderResponseDto, {
    status: HttpStatus.OK,
    description: 'Purchase order cancelled',
  })
  async cancel(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
  ): Promise<ApiResponseDto<PurchaseOrderResponseDto>> {
    return ApiResponseDto.success(
      await this.cancelPurchase.execute(u.sub, id),
      'Purchase order cancelled',
    );
  }
}
