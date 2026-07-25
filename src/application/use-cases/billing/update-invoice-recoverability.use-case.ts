import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { BILLING_REPOSITORY } from '../../../domain/repositories/billing.repository.interface.js';
import type { IBillingRepository } from '../../../domain/repositories/billing.repository.interface.js';
import { requirePermission } from '../_helpers/admin-authorization.helper.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';
import { UpdateInvoiceRecoverabilityDto } from '../../dtos/billing/billing-request.dto.js';
import { InvoiceResponseDto } from '../../dtos/billing/billing-response.dto.js';

@Injectable()
export class UpdateInvoiceRecoverabilityUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(BILLING_REPOSITORY) private readonly billing: IBillingRepository,
  ) {}

  async execute(
    actorId: string,
    invoiceId: string,
    body: UpdateInvoiceRecoverabilityDto,
  ): Promise<InvoiceResponseDto> {
    await requirePermission(this.users, actorId, PermissionCode.MANAGE_BILLING);

    const existing = await this.billing.findInvoiceById(invoiceId);
    if (!existing) {
      throw new NotFoundException(`Invoice ${invoiceId} not found`);
    }

    const updated = await this.billing.updateInvoiceRecoverability(
      invoiceId,
      body.recoverability,
    );
    return InvoiceResponseDto.fromEntity(updated);
  }
}
