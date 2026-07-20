import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { SALES_REPOSITORY } from '../../../domain/repositories/sales.repository.interface.js';
import type { ISalesRepository } from '../../../domain/repositories/sales.repository.interface.js';
import { requirePermission } from '../_helpers/admin-authorization.helper.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';
import { CreateSalesOrderDto } from '../../dtos/sales/create-sales-order.dto.js';
import { SalesOrderResponseDto } from '../../dtos/sales/sales-order-response.dto.js';

@Injectable()
export class CreateSalesOrderUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(SALES_REPOSITORY) private readonly repo: ISalesRepository,
  ) {}

  async execute(
    actorId: string,
    data: CreateSalesOrderDto,
  ): Promise<SalesOrderResponseDto> {
    await requirePermission(
      this.users,
      actorId,
      PermissionCode.MANAGE_SALES,
    );
    const entity = await this.repo.createSalesOrder({
      ...data,
      takenByUserId: data.takenByUserId ?? actorId,
    });
    return SalesOrderResponseDto.fromEntity(entity);
  }
}
