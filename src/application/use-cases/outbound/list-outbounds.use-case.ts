import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { OUTBOUND_REPOSITORY } from '../../../domain/repositories/outbound.repository.interface.js';
import type { IOutboundRepository } from '../../../domain/repositories/outbound.repository.interface.js';
import { requirePermission } from '../_helpers/admin-authorization.helper.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';
import { OutboundResponseDto } from '../../dtos/outbound/outbound-response.dto.js';

@Injectable()
export class ListOutboundsUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(OUTBOUND_REPOSITORY) private readonly repo: IOutboundRepository,
  ) {}

  async execute(actorId: string): Promise<OutboundResponseDto[]> {
    await requirePermission(this.users, actorId, PermissionCode.MANAGE_OUTBOUND);
    const rows = await this.repo.listOutbounds();
    return rows.map((e) => OutboundResponseDto.fromEntity(e));
  }
}
