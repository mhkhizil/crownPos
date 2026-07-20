import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { UpsertCustomerTargetUseCase } from '../../../application/use-cases/bd-analytics/upsert-customer-target.use-case.js';
import { CreateDigitalAssetUseCase } from '../../../application/use-cases/bd-analytics/create-digital-asset.use-case.js';
import { ListDigitalAssetsUseCase } from '../../../application/use-cases/bd-analytics/list-digital-assets.use-case.js';
import { CreatePhysicalAssetUseCase } from '../../../application/use-cases/bd-analytics/create-physical-asset.use-case.js';
import { ListPhysicalAssetsUseCase } from '../../../application/use-cases/bd-analytics/list-physical-assets.use-case.js';
import { CreateMarketingPlanUseCase } from '../../../application/use-cases/bd-analytics/create-marketing-plan.use-case.js';
import { CreateCampaignUseCase } from '../../../application/use-cases/bd-analytics/create-campaign.use-case.js';
import { RecordBrandAwarenessUseCase } from '../../../application/use-cases/bd-analytics/record-brand-awareness.use-case.js';
import { GetAnalyticsSummaryUseCase } from '../../../application/use-cases/bd-analytics/get-analytics-summary.use-case.js';
import { GetSalesAnalysisUseCase } from '../../../application/use-cases/bd-analytics/get-sales-analysis.use-case.js';
import { RefreshDailySnapshotsUseCase } from '../../../application/use-cases/bd-analytics/refresh-daily-snapshots.use-case.js';
import { ROUTE_PREFIX } from '../../routing.paths.js';
import {
  AnalyticsSummaryResponseDto,
  BrandAwarenessDto,
  BrandAwarenessResponseDto,
  CampaignResponseDto,
  CreateCampaignDto,
  CreateDigitalAssetDto,
  CreateMarketingPlanDto,
  CreatePhysicalAssetDto,
  CustomerTargetResponseDto,
  DailySnapshotResponseDto,
  DigitalAssetResponseDto,
  MarketingPlanResponseDto,
  PhysicalAssetResponseDto,
  SalesAnalysisQueryDto,
  SalesAnalysisResponseDto,
  UpsertCustomerTargetDto,
} from '../../../application/dtos/bd-analytics/index.js';

@ApiTags('BD / Analytics')
@Controller(`${ROUTE_PREFIX.adminDashboard}/bd-analytics`)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BdAnalyticsController {
  constructor(
    private readonly upsertTarget: UpsertCustomerTargetUseCase,
    private readonly createDigital: CreateDigitalAssetUseCase,
    private readonly listDigital: ListDigitalAssetsUseCase,
    private readonly createPhysical: CreatePhysicalAssetUseCase,
    private readonly listPhysical: ListPhysicalAssetsUseCase,
    private readonly createMarketingPlan: CreateMarketingPlanUseCase,
    private readonly createCampaign: CreateCampaignUseCase,
    private readonly recordBrandAwareness: RecordBrandAwarenessUseCase,
    private readonly getAnalyticsSummary: GetAnalyticsSummaryUseCase,
    private readonly getSalesAnalysis: GetSalesAnalysisUseCase,
    private readonly refreshSnapshots: RefreshDailySnapshotsUseCase,
  ) {}

  @Post('targets')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upsert customer sales target' })
  @ApiSuccessResponse(CustomerTargetResponseDto, {
    status: HttpStatus.OK,
    description: 'Customer target saved',
  })
  async targets(
    @CurrentUser() u: JwtPayload,
    @Body() body: UpsertCustomerTargetDto,
  ): Promise<ApiResponseDto<CustomerTargetResponseDto>> {
    return ApiResponseDto.success(await this.upsertTarget.execute(u.sub, body));
  }

  @Get('digital-assets')
  @ApiOperation({ summary: 'List digital assets' })
  @ApiArraySuccessResponse(DigitalAssetResponseDto, {
    status: HttpStatus.OK,
    description: 'Digital assets retrieved',
  })
  async digitalList(
    @CurrentUser() u: JwtPayload,
  ): Promise<ApiResponseDto<DigitalAssetResponseDto[]>> {
    return ApiResponseDto.success(await this.listDigital.execute(u.sub));
  }

  @Post('digital-assets')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create digital asset' })
  @ApiSuccessResponse(DigitalAssetResponseDto, {
    status: HttpStatus.CREATED,
    description: 'Digital asset created',
  })
  async digitalCreate(
    @CurrentUser() u: JwtPayload,
    @Body() body: CreateDigitalAssetDto,
  ): Promise<ApiResponseDto<DigitalAssetResponseDto>> {
    return ApiResponseDto.success(
      await this.createDigital.execute(u.sub, body),
    );
  }

  @Get('physical-assets')
  @ApiOperation({ summary: 'List physical assets' })
  @ApiArraySuccessResponse(PhysicalAssetResponseDto, {
    status: HttpStatus.OK,
    description: 'Physical assets retrieved',
  })
  async physicalList(
    @CurrentUser() u: JwtPayload,
  ): Promise<ApiResponseDto<PhysicalAssetResponseDto[]>> {
    return ApiResponseDto.success(await this.listPhysical.execute(u.sub));
  }

  @Post('physical-assets')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create physical asset' })
  @ApiSuccessResponse(PhysicalAssetResponseDto, {
    status: HttpStatus.CREATED,
    description: 'Physical asset created',
  })
  async physicalCreate(
    @CurrentUser() u: JwtPayload,
    @Body() body: CreatePhysicalAssetDto,
  ): Promise<ApiResponseDto<PhysicalAssetResponseDto>> {
    return ApiResponseDto.success(
      await this.createPhysical.execute(u.sub, body),
    );
  }

  @Post('marketing-plans')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create marketing plan' })
  @ApiSuccessResponse(MarketingPlanResponseDto, {
    status: HttpStatus.CREATED,
    description: 'Marketing plan created',
  })
  async marketing(
    @CurrentUser() u: JwtPayload,
    @Body() body: CreateMarketingPlanDto,
  ): Promise<ApiResponseDto<MarketingPlanResponseDto>> {
    return ApiResponseDto.success(
      await this.createMarketingPlan.execute(u.sub, body),
    );
  }

  @Post('campaigns')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create campaign' })
  @ApiSuccessResponse(CampaignResponseDto, {
    status: HttpStatus.CREATED,
    description: 'Campaign created',
  })
  async campaigns(
    @CurrentUser() u: JwtPayload,
    @Body() body: CreateCampaignDto,
  ): Promise<ApiResponseDto<CampaignResponseDto>> {
    return ApiResponseDto.success(
      await this.createCampaign.execute(u.sub, body),
    );
  }

  @Post('brand-awareness')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record brand awareness metric' })
  @ApiSuccessResponse(BrandAwarenessResponseDto, {
    status: HttpStatus.CREATED,
    description: 'Brand awareness recorded',
  })
  async awareness(
    @CurrentUser() u: JwtPayload,
    @Body() body: BrandAwarenessDto,
  ): Promise<ApiResponseDto<BrandAwarenessResponseDto>> {
    return ApiResponseDto.success(
      await this.recordBrandAwareness.execute(u.sub, body),
    );
  }

  @Get('analytics/summary')
  @ApiOperation({
    summary: 'BD dashboard summary (includes last ~90 daily sales points)',
  })
  @ApiSuccessResponse(AnalyticsSummaryResponseDto, {
    status: HttpStatus.OK,
    description: 'Analytics summary retrieved',
  })
  async summary(
    @CurrentUser() u: JwtPayload,
  ): Promise<ApiResponseDto<AnalyticsSummaryResponseDto>> {
    return ApiResponseDto.success(
      await this.getAnalyticsSummary.execute(u.sub),
    );
  }

  @Get('analytics/sales')
  @ApiOperation({
    summary: 'Daily / monthly / yearly sales analysis',
    description:
      'Live aggregation from sales orders + confirmed payments. ' +
      '`period=DAILY|MONTHLY|YEARLY`. Optional `from`/`to` (YYYY-MM-DD). ' +
      'Returns continuous buckets plus range totals (orders, qty, sales MMK, collected MMK, SALE_OK).',
  })
  @ApiSuccessResponse(SalesAnalysisResponseDto, {
    status: HttpStatus.OK,
    description: 'Sales analysis retrieved',
  })
  async salesAnalysis(
    @CurrentUser() u: JwtPayload,
    @Query() query: SalesAnalysisQueryDto,
  ): Promise<ApiResponseDto<SalesAnalysisResponseDto>> {
    return ApiResponseDto.success(
      await this.getSalesAnalysis.execute(u.sub, query),
    );
  }

  @Post('analytics/snapshots/:date')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh daily analytics snapshots' })
  @ApiSuccessResponse(DailySnapshotResponseDto, {
    status: HttpStatus.OK,
    description: 'Daily snapshots refreshed',
  })
  async snapshots(
    @CurrentUser() u: JwtPayload,
    @Param('date') date: string,
  ): Promise<ApiResponseDto<DailySnapshotResponseDto>> {
    return ApiResponseDto.success(
      await this.refreshSnapshots.execute(u.sub, date),
    );
  }
}
