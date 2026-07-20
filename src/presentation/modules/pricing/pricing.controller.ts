import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../../common/decorators/current-user.decorator.js';
import { ApiSuccessResponse } from '../../../common/decorators/api-response.decorator.js';
import { ApiResponseDto } from '../../../application/dtos/common/api-response.dto.js';
import { UpsertCustomerPriceUseCase } from '../../../application/use-cases/pricing/upsert-customer-price.use-case.js';
import { UpsertVolumeTierUseCase } from '../../../application/use-cases/pricing/upsert-volume-tier.use-case.js';
import { UpsertCityPriceUseCase } from '../../../application/use-cases/pricing/upsert-city-price.use-case.js';
import { ResolvePriceUseCase } from '../../../application/use-cases/pricing/resolve-price.use-case.js';
import { ROUTE_PREFIX } from '../../routing.paths.js';
import {
  CityPriceResponseDto,
  CustomerPriceResponseDto,
  ResolvePriceDto,
  ResolvePriceResponseDto,
  UpsertCityPriceDto,
  UpsertCustomerPriceDto,
  UpsertVolumeTierDto,
  VolumeTierResponseDto,
} from '../../../application/dtos/pricing/index.js';

@ApiTags('Pricing')
@Controller(`${ROUTE_PREFIX.adminDashboard}/pricing`)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PricingController {
  constructor(
    private readonly upsertCustomerPrice: UpsertCustomerPriceUseCase,
    private readonly upsertVolumeTier: UpsertVolumeTierUseCase,
    private readonly upsertCityPrice: UpsertCityPriceUseCase,
    private readonly resolvePrice: ResolvePriceUseCase,
  ) {}

  @Post('customer')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upsert customer-specific price' })
  @ApiSuccessResponse(CustomerPriceResponseDto, {
    status: HttpStatus.CREATED,
    description: 'Customer price saved',
  })
  async customer(
    @CurrentUser() u: JwtPayload,
    @Body() body: UpsertCustomerPriceDto,
  ): Promise<ApiResponseDto<CustomerPriceResponseDto>> {
    return ApiResponseDto.success(
      await this.upsertCustomerPrice.execute(u.sub, body),
    );
  }

  @Post('volume')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upsert volume price tier' })
  @ApiSuccessResponse(VolumeTierResponseDto, {
    status: HttpStatus.CREATED,
    description: 'Volume tier saved',
  })
  async volume(
    @CurrentUser() u: JwtPayload,
    @Body() body: UpsertVolumeTierDto,
  ): Promise<ApiResponseDto<VolumeTierResponseDto>> {
    return ApiResponseDto.success(
      await this.upsertVolumeTier.execute(u.sub, body),
    );
  }

  @Post('city')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upsert city price' })
  @ApiSuccessResponse(CityPriceResponseDto, {
    status: HttpStatus.CREATED,
    description: 'City price saved',
  })
  async city(
    @CurrentUser() u: JwtPayload,
    @Body() body: UpsertCityPriceDto,
  ): Promise<ApiResponseDto<CityPriceResponseDto>> {
    return ApiResponseDto.success(
      await this.upsertCityPrice.execute(u.sub, body),
    );
  }

  @Post('resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve price: customer → volume → city' })
  @ApiSuccessResponse(ResolvePriceResponseDto, {
    status: HttpStatus.OK,
    description: 'Price resolved',
  })
  async resolve(
    @CurrentUser() u: JwtPayload,
    @Body() body: ResolvePriceDto,
  ): Promise<ApiResponseDto<ResolvePriceResponseDto>> {
    return ApiResponseDto.success(await this.resolvePrice.execute(u.sub, body));
  }
}
