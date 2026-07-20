import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { PRICING_REPOSITORY } from '../../../domain/repositories/pricing.repository.interface.js';
import type { IPricingRepository } from '../../../domain/repositories/pricing.repository.interface.js';
import { requirePermission } from '../_helpers/admin-authorization.helper.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';
import {
  CityPriceResponseDto,
  UpsertCityPriceDto,
} from '../../dtos/pricing/pricing.dto.js';

@Injectable()
export class UpsertCityPriceUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(PRICING_REPOSITORY) private readonly repo: IPricingRepository,
  ) {}

  async execute(actorId: string, data: UpsertCityPriceDto) {
    await requirePermission(this.users, actorId, PermissionCode.MANAGE_PRICING);
    return CityPriceResponseDto.fromEntity(
      await this.repo.upsertCityPrice(data),
    );
  }
}
