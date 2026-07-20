import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { PRICING_REPOSITORY } from '../../../domain/repositories/pricing.repository.interface.js';
import type { IPricingRepository } from '../../../domain/repositories/pricing.repository.interface.js';
import { requirePermission } from '../_helpers/admin-authorization.helper.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';
import {
  ResolvePriceDto,
  ResolvePriceResponseDto,
} from '../../dtos/pricing/pricing.dto.js';

@Injectable()
export class ResolvePriceUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(PRICING_REPOSITORY) private readonly repo: IPricingRepository,
  ) {}

  async execute(actorId: string, data: ResolvePriceDto) {
    await requirePermission(this.users, actorId, PermissionCode.MANAGE_PRICING);
    const resolved = await this.repo.resolvePrice(data);
    if (!resolved) throw new NotFoundException('No price rule matched');
    return ResolvePriceResponseDto.fromEntity(resolved);
  }
}
