import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { BILLING_REPOSITORY } from '../../../domain/repositories/billing.repository.interface.js';
import type { IBillingRepository } from '../../../domain/repositories/billing.repository.interface.js';
import { requirePermission } from '../_helpers/admin-authorization.helper.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';
import { CreateCollectionReminderDto } from '../../dtos/billing/billing-request.dto.js';
import { CollectionReminderResponseDto } from '../../dtos/billing/billing-response.dto.js';

@Injectable()
export class CreateCollectionReminderUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(BILLING_REPOSITORY) private readonly repo: IBillingRepository,
  ) {}

  async execute(actorId: string, data: CreateCollectionReminderDto): Promise<CollectionReminderResponseDto> {
    await requirePermission(this.users, actorId, PermissionCode.MANAGE_BILLING);
    return CollectionReminderResponseDto.fromEntity(
      await this.repo.createCollectionReminder({ ...data, createdByUserId: actorId }),
    );
  }
}
