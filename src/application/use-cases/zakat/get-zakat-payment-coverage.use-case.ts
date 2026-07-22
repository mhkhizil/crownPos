import {
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { ZAKAT_REPOSITORY } from '../../../domain/repositories/zakat.repository.interface.js';
import type { IZakatRepository } from '../../../domain/repositories/zakat.repository.interface.js';
import { requirePermission } from '../_helpers/admin-authorization.helper.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';
import {
  resolveZakatPeriod,
  ZakatPeriodValidationError,
} from '../../../domain/zakat/resolve-zakat-period.js';
import {
  ZakatCoverageQueryDto,
  ZakatCoverageResponseDto,
  ZakatPaymentResponseDto,
} from '../../dtos/zakat/zakat.dto.js';

@Injectable()
export class GetZakatPaymentCoverageUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(ZAKAT_REPOSITORY) private readonly zakat: IZakatRepository,
  ) {}

  async execute(
    actorId: string,
    query: ZakatCoverageQueryDto,
  ): Promise<ZakatCoverageResponseDto> {
    await requirePermission(this.users, actorId, PermissionCode.MANAGE_BD);

    let period;
    try {
      period = resolveZakatPeriod({
        periodType: query.periodType,
        year: query.year,
        month: query.month,
        periodStart: query.periodStart,
        periodEnd: query.periodEnd,
      });
    } catch (err: unknown) {
      if (err instanceof ZakatPeriodValidationError) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }

    const payments = await this.zakat.listPaymentsOverlapping(
      period.periodStart,
      period.periodEnd,
    );
    const totalPaidMmk = Math.round(
      payments.reduce((s, p) => s + p.amountPaidMmk, 0) * 100,
    ) / 100;

    const dto = new ZakatCoverageResponseDto();
    dto.periodStart = period.periodStart.toISOString().slice(0, 10);
    dto.periodEnd = period.periodEnd.toISOString().slice(0, 10);
    dto.totalPaidMmk = totalPaidMmk;
    dto.payments = payments.map((p) => ZakatPaymentResponseDto.fromEntity(p));
    return dto;
  }
}
