import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { SALES_REPOSITORY } from '../../../domain/repositories/sales.repository.interface.js';
import type { ISalesRepository } from '../../../domain/repositories/sales.repository.interface.js';
import { requirePermission } from '../_helpers/admin-authorization.helper.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';
import { SalesOrderResponseDto } from '../../dtos/sales/sales-order-response.dto.js';

@Injectable()
export class ListSalesOrdersUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(SALES_REPOSITORY) private readonly repo: ISalesRepository,
  ) {}

  async execute(actorId: string): Promise<SalesOrderResponseDto[]> {
    await requirePermission(
      this.users,
      actorId,
      PermissionCode.MANAGE_SALES,
    );
    const rows = await this.repo.listSalesOrders();
    return rows.map((e) => SalesOrderResponseDto.fromEntity(e));
  }
}
