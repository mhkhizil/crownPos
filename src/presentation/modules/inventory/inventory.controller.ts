import {
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
import {
  ApiArraySuccessResponse,
  ApiSuccessResponse,
} from '../../../common/decorators/api-response.decorator.js';
import { ApiResponseDto } from '../../../application/dtos/common/api-response.dto.js';
import { ListInventoryBalancesUseCase } from '../../../application/use-cases/inventory/list-inventory-balances.use-case.js';
import { RecordDailyStockCountUseCase } from '../../../application/use-cases/inventory/record-daily-stock-count.use-case.js';
import { ROUTE_PREFIX } from '../../routing.paths.js';
import {
  DailyStockCountResponseDto,
  InventoryBalanceResponseDto,
  RecordDailyStockCountDto,
} from '../../../application/dtos/inventory/index.js';

@ApiTags('Inventory')
@Controller(`${ROUTE_PREFIX.adminDashboard}/inventory`)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(
    private readonly listBalances: ListInventoryBalancesUseCase,
    private readonly recordStockCount: RecordDailyStockCountUseCase,
  ) {}

  @Get('balances')
  @ApiOperation({ summary: 'List inventory balances for stock checks' })
  @ApiArraySuccessResponse(InventoryBalanceResponseDto, {
    status: HttpStatus.OK,
    description: 'Inventory balances retrieved',
  })
  async balances(
    @CurrentUser() u: JwtPayload,
    @Query('stockLocationId') stockLocationId?: string,
  ): Promise<ApiResponseDto<InventoryBalanceResponseDto[]>> {
    return ApiResponseDto.success(
      await this.listBalances.execute(u.sub, stockLocationId),
    );
  }

  @Post('stock-counts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record end-of-day stock count' })
  @ApiSuccessResponse(DailyStockCountResponseDto, {
    status: HttpStatus.CREATED,
    description: 'Stock count saved',
  })
  async stockCount(
    @CurrentUser() u: JwtPayload,
    @Body() body: RecordDailyStockCountDto,
  ): Promise<ApiResponseDto<DailyStockCountResponseDto>> {
    return ApiResponseDto.success(
      await this.recordStockCount.execute(u.sub, body),
      'Stock count saved',
    );
  }
}
