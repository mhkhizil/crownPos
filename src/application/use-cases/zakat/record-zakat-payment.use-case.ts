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
  RecordZakatPaymentDto,
  ZakatPaymentResponseDto,
} from '../../dtos/zakat/zakat.dto.js';

function parseDateOnly(value: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!m) throw new BadRequestException(`Invalid date: ${value}`);
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

@Injectable()
export class RecordZakatPaymentUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(ZAKAT_REPOSITORY) private readonly zakat: IZakatRepository,
  ) {}

  async execute(
    actorId: string,
    body: RecordZakatPaymentDto,
  ): Promise<ZakatPaymentResponseDto> {
    await requirePermission(this.users, actorId, PermissionCode.MANAGE_BD);

    let period;
    try {
      period = resolveZakatPeriod({
        periodType: body.periodType,
        year: body.year,
        month: body.month,
        periodStart: body.periodStart,
        periodEnd: body.periodEnd,
      });
    } catch (err: unknown) {
      if (err instanceof ZakatPeriodValidationError) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }

    const payment = await this.zakat.createPayment({
      companyId: body.companyId ?? null,
      periodType: period.periodType,
      periodStart: period.periodStart,
      periodEnd: period.periodEnd,
      year: period.year,
      month: period.month,
      amountPaidMmk: body.amountPaidMmk,
      paidAt: parseDateOnly(body.paidAt),
      nisabStyle: body.nisabStyle ?? null,
      calculatedDueMmk: body.calculatedDueMmk ?? null,
      notes: body.notes ?? null,
      createdByUserId: actorId,
    });

    return ZakatPaymentResponseDto.fromEntity(payment);
  }
}
