import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { PRODUCTION_REPOSITORY } from '../../../domain/repositories/production.repository.interface.js';
import type { IProductionRepository } from '../../../domain/repositories/production.repository.interface.js';
import { INVENTORY_REPOSITORY } from '../../../domain/repositories/inventory.repository.interface.js';
import type { IInventoryRepository } from '../../../domain/repositories/inventory.repository.interface.js';
import type { ProductionDailyRecordEntity } from '../../../domain/entities/production-daily-record.entity.js';
import { requirePermission } from '../_helpers/admin-authorization.helper.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';
import { InventoryItemType } from '../../../domain/enums/inventory-item-type.enum.js';
import { UpsertProductionDayDto } from '../../dtos/production/upsert-production-day.dto.js';
import { ProductionDayResponseDto } from '../../dtos/production/production-day-response.dto.js';

/** Stable key of inventory-affecting lines (order-independent). */
export function productionInventoryFingerprint(
  lines: Array<{
    productSkuId: string;
    unitId: string;
    quantityProduced: number;
  }>,
  rawUsages: Array<{
    rawMaterialId: string;
    unitId: string;
    quantityUsed: number;
  }>,
): string {
  const fg = [...lines]
    .map(
      (l) =>
        `FG:${l.productSkuId}|${l.unitId}|${Number(l.quantityProduced)}`,
    )
    .sort()
    .join(';');
  const raw = [...rawUsages]
    .map(
      (u) =>
        `RM:${u.rawMaterialId}|${u.unitId}|${Number(u.quantityUsed)}`,
    )
    .sort()
    .join(';');
  return `${fg}#${raw}`;
}

function fingerprintFromEntity(day: ProductionDailyRecordEntity): string {
  return productionInventoryFingerprint(day.lines, day.rawUsages);
}

@Injectable()
export class UpsertProductionDayUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(PRODUCTION_REPOSITORY) private readonly repo: IProductionRepository,
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventory: IInventoryRepository,
  ) {}

  async execute(
    actorId: string,
    data: UpsertProductionDayDto,
  ): Promise<ProductionDayResponseDto> {
    await requirePermission(
      this.users,
      actorId,
      PermissionCode.MANAGE_PRODUCTION,
    );

    const previous = await this.repo.findProductionDay(
      data.factoryId,
      data.productionDate,
    );
    const nextFingerprint = productionInventoryFingerprint(
      data.lines,
      data.rawUsages,
    );
    const inventoryUnchanged =
      previous != null &&
      fingerprintFromEntity(previous) === nextFingerprint;

    const result = await this.repo.upsertProductionDay(data);
    const asOf = new Date(`${data.productionDate}T00:00:00.000Z`);

    if (inventoryUnchanged) {
      // Idempotent retry / no-op edit of employeeCount/notes/workers only.
      return ProductionDayResponseDto.fromEntity(result);
    }

    if (previous) {
      await this.reverseInventory(previous, asOf);
    }
    await this.applyInventory(data, asOf);

    return ProductionDayResponseDto.fromEntity(result);
  }

  private async reverseInventory(
    previous: ProductionDailyRecordEntity,
    asOf: Date,
  ): Promise<void> {
    for (const line of previous.lines) {
      await this.inventory.adjustBalance({
        itemType: InventoryItemType.FINISHED_GOOD,
        productSkuId: line.productSkuId,
        unitId: line.unitId,
        delta: -line.quantityProduced,
        asOfDate: asOf,
      });
    }
    for (const usage of previous.rawUsages) {
      await this.inventory.adjustBalance({
        itemType: InventoryItemType.RAW_MATERIAL,
        rawMaterialId: usage.rawMaterialId,
        unitId: usage.unitId,
        delta: usage.quantityUsed,
        asOfDate: asOf,
      });
    }
  }

  private async applyInventory(
    data: UpsertProductionDayDto,
    asOf: Date,
  ): Promise<void> {
    for (const line of data.lines) {
      await this.inventory.adjustBalance({
        itemType: InventoryItemType.FINISHED_GOOD,
        productSkuId: line.productSkuId,
        unitId: line.unitId,
        delta: line.quantityProduced,
        asOfDate: asOf,
      });
    }
    for (const usage of data.rawUsages) {
      await this.inventory.adjustBalance({
        itemType: InventoryItemType.RAW_MATERIAL,
        rawMaterialId: usage.rawMaterialId,
        unitId: usage.unitId,
        delta: -usage.quantityUsed,
        asOfDate: asOf,
      });
    }
  }
}
