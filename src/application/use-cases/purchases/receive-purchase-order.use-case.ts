import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { PURCHASE_REPOSITORY } from '../../../domain/repositories/purchase.repository.interface.js';
import type { IPurchaseRepository } from '../../../domain/repositories/purchase.repository.interface.js';
import { INVENTORY_REPOSITORY } from '../../../domain/repositories/inventory.repository.interface.js';
import type { IInventoryRepository } from '../../../domain/repositories/inventory.repository.interface.js';
import { requirePermission } from '../_helpers/admin-authorization.helper.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';
import { PurchaseStatus } from '../../../domain/enums/purchase-status.enum.js';
import {
  PurchaseOrderResponseDto,
  ReceivePurchaseOrderDto,
} from '../../dtos/purchases/purchase-order.dto.js';

/** Merge duplicate line ids so inventory and PO qty stay aligned. */
function aggregateReceiveLines(
  lines: ReceivePurchaseOrderDto['lines'],
): Array<{ purchaseOrderLineId: string; quantityReceived: number }> {
  const byId = new Map<string, number>();
  for (const line of lines) {
    byId.set(
      line.purchaseOrderLineId,
      (byId.get(line.purchaseOrderLineId) ?? 0) + line.quantityReceived,
    );
  }
  return [...byId.entries()].map(([purchaseOrderLineId, quantityReceived]) => ({
    purchaseOrderLineId,
    quantityReceived,
  }));
}

@Injectable()
export class ReceivePurchaseOrderUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(PURCHASE_REPOSITORY) private readonly purchases: IPurchaseRepository,
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventory: IInventoryRepository,
  ) {}

  async execute(
    actorId: string,
    purchaseOrderId: string,
    data: ReceivePurchaseOrderDto,
  ): Promise<PurchaseOrderResponseDto> {
    await requirePermission(
      this.users,
      actorId,
      PermissionCode.MANAGE_INVENTORY,
    );

    const before = await this.purchases.getPurchaseOrder(purchaseOrderId);
    if (!before) throw new NotFoundException('Purchase order not found');

    // Idempotent: already fully received — inventory was applied in the same txn.
    if (before.status === PurchaseStatus.RECEIVED) {
      return PurchaseOrderResponseDto.fromEntity(before);
    }

    const aggregatedLines = aggregateReceiveLines(data.lines);
    if (!aggregatedLines.length) {
      throw new BadRequestException('Receive requires at least one line');
    }

    const lineById = new Map(before.lines.map((l) => [l.id, l]));
    for (const recv of aggregatedLines) {
      if (!lineById.has(recv.purchaseOrderLineId)) {
        throw new BadRequestException(
          `Line ${recv.purchaseOrderLineId} not on this purchase order`,
        );
      }
    }

    const stockLocationId =
      data.stockLocationId ??
      (await this.inventory.findPrimaryStockLocationId()) ??
      undefined;
    if (!stockLocationId) {
      throw new BadRequestException('No primary stock location configured');
    }

    const asOfDate = new Date();
    const inventoryBumps = aggregatedLines.map((recv) => {
      const line = lineById.get(recv.purchaseOrderLineId)!;
      return {
        rawMaterialId: line.rawMaterialId,
        unitId: line.unitId,
        delta: recv.quantityReceived,
        stockLocationId,
        asOfDate,
      };
    });

    // PO qty + inventory commit together (or neither).
    const updated = await this.purchases.receivePurchaseOrder({
      purchaseOrderId,
      lines: aggregatedLines,
      inventoryBumps,
    });

    return PurchaseOrderResponseDto.fromEntity(updated);
  }
}
