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
import { ListOutboundsUseCase } from '../../../application/use-cases/outbound/list-outbounds.use-case.js';
import { CreateOutboundUseCase } from '../../../application/use-cases/outbound/create-outbound.use-case.js';
import { TransitionOutboundStatusUseCase } from '../../../application/use-cases/outbound/transition-outbound-status.use-case.js';
import { ROUTE_PREFIX } from '../../routing.paths.js';
import {
  CreateOutboundDto,
  OutboundResponseDto,
  TransitionOutboundStatusDto,
} from '../../../application/dtos/outbound/index.js';

@ApiTags('Outbound')
@Controller(`${ROUTE_PREFIX.adminDashboard}/outbound`)
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
  @ApiArraySuccessResponse(OutboundResponseDto, {
    status: HttpStatus.OK,
    description: 'Outbounds retrieved',
  })
  async list(
    @CurrentUser() u: JwtPayload,
  ): Promise<ApiResponseDto<OutboundResponseDto[]>> {
    return ApiResponseDto.success(await this.listOutbounds.execute(u.sub));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Schedule outbound (direct shop or via gate)' })
  @ApiSuccessResponse(OutboundResponseDto, {
    status: HttpStatus.CREATED,
    description: 'Outbound created',
  })
  async create(
    @CurrentUser() u: JwtPayload,
    @Body() body: CreateOutboundDto,
  ): Promise<ApiResponseDto<OutboundResponseDto>> {
    return ApiResponseDto.success(
      await this.createOutbound.execute(u.sub, body),
      'Outbound created',
    );
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Transition outbound status through to RECEIVED' })
  @ApiSuccessResponse(OutboundResponseDto, {
    status: HttpStatus.OK,
    description: 'Outbound status updated',
  })
  async transition(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
    @Body() body: TransitionOutboundStatusDto,
  ): Promise<ApiResponseDto<OutboundResponseDto>> {
    return ApiResponseDto.success(
      await this.transitionOutbound.execute(u.sub, id, body),
      'Outbound status updated',
    );
  }
}
