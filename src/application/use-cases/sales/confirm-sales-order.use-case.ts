import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { SALES_REPOSITORY } from '../../../domain/repositories/sales.repository.interface.js';
import type { ISalesRepository } from '../../../domain/repositories/sales.repository.interface.js';
import { requirePermission } from '../_helpers/admin-authorization.helper.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';
import { SalesOrderResponseDto } from '../../dtos/sales/sales-order-response.dto.js';

@Injectable()
export class ConfirmSalesOrderUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(SALES_REPOSITORY) private readonly sales: ISalesRepository,
  ) {}

  async execute(
    actorId: string,
    orderId: string,
  ): Promise<SalesOrderResponseDto> {
    await requirePermission(
      this.users,
      actorId,
      PermissionCode.MANAGE_SALES,
    );

    const existing = await this.sales.getSalesOrder(orderId);
    if (!existing) throw new NotFoundException('Sales order not found');

    const { entity, shortages } =
      await this.sales.confirmWithStockCheck(orderId);

    if (shortages.length > 0) {
      throw new BadRequestException({
        message: 'Insufficient stock — order placed on HOLD',
        shortages,
        order: SalesOrderResponseDto.fromEntity(entity),
      });
    }

    return SalesOrderResponseDto.fromEntity(entity);
  }
}
