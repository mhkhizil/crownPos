import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { toDateOnly, toDecimal } from './_prisma-helpers.js';
import { InventoryMapper } from '../mappers/inventory.mapper.js';
import type {
  AdjustBalanceInput,
  AvailableQuantityQuery,
  IInventoryRepository,
  RecordDailyStockCountInput,
} from '../../domain/repositories/inventory.repository.interface.js';
import type {
  DailyStockCountEntity,
  InventoryBalanceEntity,
} from '../../domain/entities/inventory-balance.entity.js';

@Injectable()
export class InventoryRepository implements IInventoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPrimaryStockLocationId(): Promise<string | null> {
    const loc = await this.prisma.stockLocation.findFirst({
      where: { deletedAt: null, isPrimary: true },
    });
    return loc?.id ?? null;
  }

  async primaryStockLocationId(): Promise<string> {
    const id = await this.findPrimaryStockLocationId();
    if (!id) {
      throw new BadRequestException('No primary stock location configured');
    }
    return id;
  }

  async getAvailableQuantity(query: AvailableQuantityQuery): Promise<number> {
    const bal = await this.prisma.inventoryBalance.findFirst({
      where: {
        deletedAt: null,
        itemType: query.itemType,
        unitId: query.unitId,
        productSkuId: query.productSkuId ?? null,
        rawMaterialId: query.rawMaterialId ?? null,
        ...(query.stockLocationId
          ? { stockLocationId: query.stockLocationId }
          : {}),
      },
    });
    return bal ? Number(bal.quantityAvailable) : 0;
  }

  async adjustBalance(
    input: AdjustBalanceInput,
  ): Promise<InventoryBalanceEntity> {
    const stockLocationId =
      input.stockLocationId ?? (await this.primaryStockLocationId());
    const existing = await this.prisma.inventoryBalance.findFirst({
      where: {
        stockLocationId,
        itemType: input.itemType,
        rawMaterialId: input.rawMaterialId ?? null,
        productSkuId: input.productSkuId ?? null,
        unitId: input.unitId,
        deletedAt: null,
      },
    });
    const row = existing
      ? await this.prisma.inventoryBalance.update({
          where: { id: existing.id },
          data: {
            quantityAvailable: existing.quantityAvailable.add(
              toDecimal(input.delta),
            ),
            asOfDate: input.asOfDate,
          },
        })
      : await this.prisma.inventoryBalance.create({
          data: {
            stockLocationId,
            itemType: input.itemType,
            rawMaterialId: input.rawMaterialId ?? null,
            productSkuId: input.productSkuId ?? null,
            unitId: input.unitId,
            quantityAvailable: toDecimal(input.delta),
            asOfDate: input.asOfDate,
          },
        });
    return InventoryMapper.balanceToDomain(row);
  }

  async recordDailyStockCount(
    data: RecordDailyStockCountInput,
  ): Promise<DailyStockCountEntity> {
    const countDate = toDateOnly(data.countDate);
    const existing = await this.prisma.dailyStockCount.findFirst({
      where: {
        stockLocationId: data.stockLocationId,
        countDate,
        deletedAt: null,
      },
    });
    if (existing) {
      await this.prisma.dailyStockCountLine.updateMany({
        where: { dailyStockCountId: existing.id, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      await this.prisma.dailyStockCount.update({
        where: { id: existing.id },
        data: { notes: data.notes ?? null, countedAt: new Date() },
      });
    }
    const count =
      existing ??
      (await this.prisma.dailyStockCount.create({
        data: {
          stockLocationId: data.stockLocationId,
          countDate,
          notes: data.notes ?? null,
        },
      }));

    for (const line of data.lines) {
      await this.prisma.dailyStockCountLine.create({
        data: {
          dailyStockCountId: count.id,
          itemType: line.itemType,
          rawMaterialId: line.rawMaterialId ?? null,
          productSkuId: line.productSkuId ?? null,
          unitId: line.unitId,
          quantityOnHand: toDecimal(line.quantityOnHand),
        },
      });
      const existingBal = await this.prisma.inventoryBalance.findFirst({
        where: {
          stockLocationId: data.stockLocationId,
          itemType: line.itemType,
          rawMaterialId: line.rawMaterialId ?? null,
          productSkuId: line.productSkuId ?? null,
          unitId: line.unitId,
          deletedAt: null,
        },
      });
      if (existingBal) {
        await this.prisma.inventoryBalance.update({
          where: { id: existingBal.id },
          data: {
            quantityAvailable: toDecimal(line.quantityOnHand),
            asOfDate: countDate,
          },
        });
      } else {
        await this.prisma.inventoryBalance.create({
          data: {
            stockLocationId: data.stockLocationId,
            itemType: line.itemType,
            rawMaterialId: line.rawMaterialId ?? null,
            productSkuId: line.productSkuId ?? null,
            unitId: line.unitId,
            quantityAvailable: toDecimal(line.quantityOnHand),
            asOfDate: countDate,
          },
        });
      }
    }
    const row = await this.prisma.dailyStockCount.findFirst({
      where: { id: count.id },
      include: { lines: { where: { deletedAt: null } } },
    });
    if (!row) throw new NotFoundException('Stock count not found');
    return InventoryMapper.stockCountToDomain(row);
  }

  async listInventoryBalances(
    stockLocationId?: string,
  ): Promise<InventoryBalanceEntity[]> {
    const rows = await this.prisma.inventoryBalance.findMany({
      where: {
        deletedAt: null,
        ...(stockLocationId ? { stockLocationId } : {}),
      },
    });
    return rows.map((r) => InventoryMapper.balanceToDomain(r));
  }
}
