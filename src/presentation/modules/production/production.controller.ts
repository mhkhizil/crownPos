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
import { ListProductionDaysUseCase } from '../../../application/use-cases/production/list-production-days.use-case.js';
import { UpsertProductionDayUseCase } from '../../../application/use-cases/production/upsert-production-day.use-case.js';
import { ROUTE_PREFIX } from '../../routing.paths.js';
import {
  ProductionDayResponseDto,
  UpsertProductionDayDto,
} from '../../../application/dtos/production/index.js';

@ApiTags('Production')
@Controller(`${ROUTE_PREFIX.adminDashboard}/production`)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProductionController {
  constructor(
    private readonly listProductionDays: ListProductionDaysUseCase,
    private readonly upsertProductionDay: UpsertProductionDayUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List daily production records' })
  @ApiArraySuccessResponse(ProductionDayResponseDto, {
    status: HttpStatus.OK,
    description: 'Production days retrieved',
  })
  async list(
    @CurrentUser() u: JwtPayload,
    @Query('factoryId') factoryId?: string,
  ): Promise<ApiResponseDto<ProductionDayResponseDto[]>> {
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
  @ApiSuccessResponse(ProductionDayResponseDto, {
    status: HttpStatus.CREATED,
    description: 'Production saved',
  })
  async upsert(
    @CurrentUser() u: JwtPayload,
    @Body() body: UpsertProductionDayDto,
  ): Promise<ApiResponseDto<ProductionDayResponseDto>> {
    return ApiResponseDto.success(
      await this.upsertProductionDay.execute(u.sub, body),
      'Production saved',
    );
  }
}
