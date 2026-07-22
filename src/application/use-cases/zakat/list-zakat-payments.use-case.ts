import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { ZAKAT_REPOSITORY } from '../../../domain/repositories/zakat.repository.interface.js';
import type { IZakatRepository } from '../../../domain/repositories/zakat.repository.interface.js';
import { requirePermission } from '../_helpers/admin-authorization.helper.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';
import {
  ListZakatPaymentsQueryDto,
  ZakatPaymentResponseDto,
} from '../../dtos/zakat/zakat.dto.js';

function parseOptionalDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!m) return undefined;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

@Injectable()
export class ListZakatPaymentsUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(ZAKAT_REPOSITORY) private readonly zakat: IZakatRepository,
  ) {}

  async execute(
    actorId: string,
    query: ListZakatPaymentsQueryDto,
  ): Promise<ZakatPaymentResponseDto[]> {
    await requirePermission(this.users, actorId, PermissionCode.MANAGE_BD);
    const rows = await this.zakat.listPayments({
      from: parseOptionalDate(query.from),
      to: parseOptionalDate(query.to),
      year: query.year,
      month: query.month,
    });
    return rows.map((r) => ZakatPaymentResponseDto.fromEntity(r));
  }
}
