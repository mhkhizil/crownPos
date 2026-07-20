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
import { ListSalesOrdersUseCase } from '../../../application/use-cases/sales/list-sales-orders.use-case.js';
import { GetSalesOrderUseCase } from '../../../application/use-cases/sales/get-sales-order.use-case.js';
import { CreateSalesOrderUseCase } from '../../../application/use-cases/sales/create-sales-order.use-case.js';
import { ConfirmSalesOrderUseCase } from '../../../application/use-cases/sales/confirm-sales-order.use-case.js';
import { ROUTE_PREFIX } from '../../routing.paths.js';
import {
  CreateSalesOrderDto,
  SalesOrderResponseDto,
} from '../../../application/dtos/sales/index.js';

@ApiTags('Sales')
@Controller(`${ROUTE_PREFIX.adminDashboard}/sales`)
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
  @ApiArraySuccessResponse(SalesOrderResponseDto, {
    status: HttpStatus.OK,
    description: 'Sales orders retrieved',
  })
  async list(
    @CurrentUser() u: JwtPayload,
  ): Promise<ApiResponseDto<SalesOrderResponseDto[]>> {
    return ApiResponseDto.success(await this.listSalesOrders.execute(u.sub));
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get sales order by id' })
  @ApiSuccessResponse(SalesOrderResponseDto, {
    status: HttpStatus.OK,
    description: 'Sales order retrieved',
  })
  async get(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
  ): Promise<ApiResponseDto<SalesOrderResponseDto>> {
    return ApiResponseDto.success(await this.getSalesOrder.execute(u.sub, id));
  }

  @Post('orders')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create sales order (shop call or sales call)' })
  @ApiSuccessResponse(SalesOrderResponseDto, {
    status: HttpStatus.CREATED,
    description: 'Order created',
  })
  async create(
    @CurrentUser() u: JwtPayload,
    @Body() body: CreateSalesOrderDto,
  ): Promise<ApiResponseDto<SalesOrderResponseDto>> {
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
  @ApiSuccessResponse(SalesOrderResponseDto, {
    status: HttpStatus.OK,
    description: 'Order confirmed',
  })
  async confirm(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
  ): Promise<ApiResponseDto<SalesOrderResponseDto>> {
    return ApiResponseDto.success(
      await this.confirmSalesOrder.execute(u.sub, id),
      'Order confirmed',
    );
  }
}
