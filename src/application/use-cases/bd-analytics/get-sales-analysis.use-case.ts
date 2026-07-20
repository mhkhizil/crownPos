import {
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { BD_ANALYTICS_REPOSITORY } from '../../../domain/repositories/bd-analytics.repository.interface.js';
import type { IBdAnalyticsRepository } from '../../../domain/repositories/bd-analytics.repository.interface.js';
import { SalesAnalysisPeriod } from '../../../domain/enums/sales-analysis-period.enum.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';
import {
  SalesAnalysisQueryDto,
  SalesAnalysisResponseDto,
} from '../../dtos/bd-analytics/bd-analytics.dto.js';
import { requirePermission } from '../_helpers/admin-authorization.helper.js';

const MS_DAY = 86_400_000;

@Injectable()
export class GetSalesAnalysisUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(BD_ANALYTICS_REPOSITORY)
    private readonly repo: IBdAnalyticsRepository,
  ) {}

  async execute(
    actorId: string,
    query: SalesAnalysisQueryDto,
  ): Promise<SalesAnalysisResponseDto> {
    await requirePermission(this.users, actorId, PermissionCode.VIEW_ANALYTICS);

    const { from, to } = resolveRange(query.period, query.from, query.to);
    if (from > to) {
      throw new BadRequestException("`from` must be on or before `to`");
    }
    assertRangeLimit(query.period, from, to);

    const entity = await this.repo.getSalesAnalysis({
      period: query.period,
      from,
      to,
    });
    return SalesAnalysisResponseDto.fromEntity(entity);
  }
}

function utcTodayYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

function addUtcDays(ymd: string, days: number): string {
  const d = new Date(`${ymd}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function addUtcMonths(ymd: string, months: number): string {
  const d = new Date(`${ymd}T00:00:00.000Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

function resolveRange(
  period: SalesAnalysisPeriod,
  from?: string,
  to?: string,
): { from: string; to: string } {
  const end = to ?? utcTodayYmd();
  if (from) return { from, to: end };

  if (period === SalesAnalysisPeriod.DAILY) {
    return { from: addUtcDays(end, -29), to: end };
  }
  if (period === SalesAnalysisPeriod.MONTHLY) {
    return { from: addUtcMonths(end, -11).slice(0, 8) + '01', to: end };
  }
  const year = Number(end.slice(0, 4));
  return { from: `${year - 4}-01-01`, to: end };
}

function assertRangeLimit(
  period: SalesAnalysisPeriod,
  from: string,
  to: string,
): void {
  const fromMs = Date.parse(`${from}T00:00:00.000Z`);
  const toMs = Date.parse(`${to}T00:00:00.000Z`);
  const days = Math.floor((toMs - fromMs) / MS_DAY) + 1;

  if (period === SalesAnalysisPeriod.DAILY && days > 366) {
    throw new BadRequestException(
      'DAILY analysis range cannot exceed 366 days',
    );
  }
  if (period === SalesAnalysisPeriod.MONTHLY && days > 366 * 5) {
    throw new BadRequestException(
      'MONTHLY analysis range cannot exceed 5 years',
    );
  }
  if (period === SalesAnalysisPeriod.YEARLY && days > 366 * 25) {
    throw new BadRequestException(
      'YEARLY analysis range cannot exceed 25 years',
    );
  }
}
