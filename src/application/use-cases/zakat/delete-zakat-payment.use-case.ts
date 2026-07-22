import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { ZAKAT_REPOSITORY } from '../../../domain/repositories/zakat.repository.interface.js';
import type { IZakatRepository } from '../../../domain/repositories/zakat.repository.interface.js';
import { requirePermission } from '../_helpers/admin-authorization.helper.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';
import { ZakatPaymentResponseDto } from '../../dtos/zakat/zakat.dto.js';

@Injectable()
export class DeleteZakatPaymentUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(ZAKAT_REPOSITORY) private readonly zakat: IZakatRepository,
  ) {}

  async execute(
    actorId: string,
    paymentId: string,
  ): Promise<ZakatPaymentResponseDto> {
    await requirePermission(this.users, actorId, PermissionCode.MANAGE_BD);
    const deleted = await this.zakat.softDeletePayment(paymentId);
    if (!deleted) throw new NotFoundException('Zakat payment not found');
    return ZakatPaymentResponseDto.fromEntity(deleted);
  }
}
