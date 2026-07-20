import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service.js';
import { toDecimal } from './_prisma-helpers.js';
import { MasterDataMapper } from '../mappers/master-data.mapper.js';
import type {
  CreateCityInput,
  CreateCustomerInput,
  CreateGateInput,
  CreateNamedCodeInput,
  CreateProductInput,
  CreateProductSkuInput,
  CreateRawMaterialInput,
  CreateSupplierInput,
  IMasterDataRepository,
  LinkSupplierRawMaterialInput,
  MasterDataListQuery,
  PaginatedList,
  UpdateCityInput,
  UpdateCustomerInput,
  UpdateGateInput,
  UpdateNamedCodeInput,
  UpdateProductInput,
  UpdateProductSkuInput,
  UpdateRawMaterialInput,
  UpdateSupplierInput,
  UpdateSupplierRawMaterialInput,
} from '../../domain/repositories/master-data.repository.interface.js';
import type {
  CityEntity,
  CompanyContextEntity,
  CustomerEntity,
  GateEntity,
  NamedCodeEntity,
  ProductEntity,
  ProductSkuEntity,
  RawMaterialEntity,
  SupplierEntity,
  SupplierRawMaterialEntity,
} from '../../domain/entities/master-data.entity.js';
import { CustomerType } from '../../domain/enums/customer-type.enum.js';
import { GateType } from '../../domain/enums/gate-type.enum.js';

function namedSearchOr(search?: string) {
  const term = search?.trim();
  if (!term) return undefined;
  const q = { contains: term, mode: 'insensitive' as const };
  return [{ code: q }, { nameEn: q }, { nameMm: q }];
}

@Injectable()
export class MasterDataRepository implements IMasterDataRepository {
  constructor(private readonly prisma: PrismaService) {}

  private pageParams(query: MasterDataListQuery) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    return { page, limit, skip: (page - 1) * limit };
  }

  private async pageResult<T>(
    page: number,
    limit: number,
    total: number,
    items: T[],
  ): Promise<PaginatedList<T>> {
    return { items, total, page, limit };
  }

  async getCompanyContext(): Promise<CompanyContextEntity> {
    const company = await this.prisma.company.findFirst({
      where: { deletedAt: null },
      include: {
        factories: { where: { deletedAt: null } },
        stockLocations: { where: { deletedAt: null } },
      },
    });
    return MasterDataMapper.companyContext(company);
  }

  async listUnits(query: MasterDataListQuery): Promise<PaginatedList<NamedCodeEntity>> {
    const { page, limit, skip } = this.pageParams(query);
    const or = namedSearchOr(query.search);
    const where: Prisma.UnitWhereInput = {
      deletedAt: null,
      ...(or ? { OR: or } : {}),
    };
    const [total, rows] = await Promise.all([
      this.prisma.unit.count({ where }),
      this.prisma.unit.findMany({ where, orderBy: { code: 'asc' }, skip, take: limit }),
    ]);
    return this.pageResult(page, limit, total, rows.map((r) => MasterDataMapper.namedCode(r)));
  }

  async createUnit(data: CreateNamedCodeInput): Promise<NamedCodeEntity> {
    const row = await this.prisma.unit.create({
      data: {
        code: data.code,
        nameEn: data.nameEn,
        nameMm: data.nameMm ?? null,
        symbol: data.symbol ?? null,
      },
    });
    return MasterDataMapper.namedCode(row);
  }

  async updateUnit(id: string, data: UpdateNamedCodeInput): Promise<NamedCodeEntity> {
    await this.requireActive('unit', id);
    const row = await this.prisma.unit.update({
      where: { id },
      data: {
        ...(data.code !== undefined ? { code: data.code } : {}),
        ...(data.nameEn !== undefined ? { nameEn: data.nameEn } : {}),
        ...(data.nameMm !== undefined ? { nameMm: data.nameMm } : {}),
        ...(data.symbol !== undefined ? { symbol: data.symbol } : {}),
      },
    });
    return MasterDataMapper.namedCode(row);
  }

  async softDeleteUnit(id: string): Promise<void> {
    await this.requireActive('unit', id);
    await this.prisma.unit.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async listBrands(query: MasterDataListQuery): Promise<PaginatedList<NamedCodeEntity>> {
    const { page, limit, skip } = this.pageParams(query);
    const or = namedSearchOr(query.search);
    const where: Prisma.BrandWhereInput = {
      deletedAt: null,
      ...(or ? { OR: or } : {}),
    };
    const [total, rows] = await Promise.all([
      this.prisma.brand.count({ where }),
      this.prisma.brand.findMany({ where, orderBy: { nameEn: 'asc' }, skip, take: limit }),
    ]);
    return this.pageResult(page, limit, total, rows.map((r) => MasterDataMapper.namedCode(r)));
  }

  async createBrand(data: CreateNamedCodeInput): Promise<NamedCodeEntity> {
    const row = await this.prisma.brand.create({
      data: {
        code: data.code,
        nameEn: data.nameEn,
        nameMm: data.nameMm ?? null,
        description: data.description ?? null,
      },
    });
    return MasterDataMapper.namedCode(row);
  }

  async updateBrand(id: string, data: UpdateNamedCodeInput): Promise<NamedCodeEntity> {
    await this.requireActive('brand', id);
    const row = await this.prisma.brand.update({
      where: { id },
      data: {
        ...(data.code !== undefined ? { code: data.code } : {}),
        ...(data.nameEn !== undefined ? { nameEn: data.nameEn } : {}),
        ...(data.nameMm !== undefined ? { nameMm: data.nameMm } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
      },
    });
    return MasterDataMapper.namedCode(row);
  }

  async softDeleteBrand(id: string): Promise<void> {
    await this.requireActive('brand', id);
    await this.prisma.brand.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async listProducts(query: MasterDataListQuery): Promise<PaginatedList<ProductEntity>> {
    const { page, limit, skip } = this.pageParams(query);
    const or = namedSearchOr(query.search);
    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      ...(or ? { OR: or } : {}),
    };
    const [total, rows] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({ where, orderBy: { nameEn: 'asc' }, skip, take: limit }),
    ]);
    return this.pageResult(page, limit, total, rows.map((r) => MasterDataMapper.product(r)));
  }

  async createProduct(data: CreateProductInput): Promise<ProductEntity> {
    const row = await this.prisma.product.create({
      data: {
        brandId: data.brandId,
        code: data.code,
        nameEn: data.nameEn,
        nameMm: data.nameMm ?? null,
        description: data.description ?? null,
      },
    });
    return MasterDataMapper.product(row);
  }

  async updateProduct(id: string, data: UpdateProductInput): Promise<ProductEntity> {
    await this.requireActive('product', id);
    const row = await this.prisma.product.update({
      where: { id },
      data: {
        ...(data.brandId !== undefined ? { brandId: data.brandId } : {}),
        ...(data.code !== undefined ? { code: data.code } : {}),
        ...(data.nameEn !== undefined ? { nameEn: data.nameEn } : {}),
        ...(data.nameMm !== undefined ? { nameMm: data.nameMm } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
      },
    });
    return MasterDataMapper.product(row);
  }

  async softDeleteProduct(id: string): Promise<void> {
    await this.requireActive('product', id);
    await this.prisma.product.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async listProductSkus(
    query: MasterDataListQuery,
  ): Promise<PaginatedList<ProductSkuEntity>> {
    const { page, limit, skip } = this.pageParams(query);
    const or = namedSearchOr(query.search);
    const where: Prisma.ProductSkuWhereInput = {
      deletedAt: null,
      ...(or ? { OR: or } : {}),
    };
    const [total, rows] = await Promise.all([
      this.prisma.productSku.count({ where }),
      this.prisma.productSku.findMany({ where, orderBy: { code: 'asc' }, skip, take: limit }),
    ]);
    return this.pageResult(page, limit, total, rows.map((r) => MasterDataMapper.sku(r)));
  }

  async createProductSku(data: CreateProductSkuInput): Promise<ProductSkuEntity> {
    const row = await this.prisma.productSku.create({
      data: {
        productId: data.productId,
        unitId: data.unitId,
        code: data.code,
        nameEn: data.nameEn,
        nameMm: data.nameMm ?? null,
        packSize: toDecimal(data.packSize ?? 1),
      },
    });
    return MasterDataMapper.sku(row);
  }

  async updateProductSku(
    id: string,
    data: UpdateProductSkuInput,
  ): Promise<ProductSkuEntity> {
    await this.requireActive('productSku', id);
    const row = await this.prisma.productSku.update({
      where: { id },
      data: {
        ...(data.productId !== undefined ? { productId: data.productId } : {}),
        ...(data.unitId !== undefined ? { unitId: data.unitId } : {}),
        ...(data.code !== undefined ? { code: data.code } : {}),
        ...(data.nameEn !== undefined ? { nameEn: data.nameEn } : {}),
        ...(data.nameMm !== undefined ? { nameMm: data.nameMm } : {}),
        ...(data.packSize !== undefined ? { packSize: toDecimal(data.packSize) } : {}),
      },
    });
    return MasterDataMapper.sku(row);
  }

  async softDeleteProductSku(id: string): Promise<void> {
    await this.requireActive('productSku', id);
    await this.prisma.productSku.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async listRegions(query: MasterDataListQuery): Promise<PaginatedList<NamedCodeEntity>> {
    const { page, limit, skip } = this.pageParams(query);
    const or = namedSearchOr(query.search);
    const where: Prisma.RegionWhereInput = {
      deletedAt: null,
      ...(or ? { OR: or } : {}),
    };
    const [total, rows] = await Promise.all([
      this.prisma.region.count({ where }),
      this.prisma.region.findMany({ where, orderBy: { nameEn: 'asc' }, skip, take: limit }),
    ]);
    return this.pageResult(page, limit, total, rows.map((r) => MasterDataMapper.namedCode(r)));
  }

  async createRegion(data: CreateNamedCodeInput): Promise<NamedCodeEntity> {
    const row = await this.prisma.region.create({
      data: {
        code: data.code,
        nameEn: data.nameEn,
        nameMm: data.nameMm ?? null,
      },
    });
    return MasterDataMapper.namedCode(row);
  }

  async updateRegion(id: string, data: UpdateNamedCodeInput): Promise<NamedCodeEntity> {
    await this.requireActive('region', id);
    const row = await this.prisma.region.update({
      where: { id },
      data: {
        ...(data.code !== undefined ? { code: data.code } : {}),
        ...(data.nameEn !== undefined ? { nameEn: data.nameEn } : {}),
        ...(data.nameMm !== undefined ? { nameMm: data.nameMm } : {}),
      },
    });
    return MasterDataMapper.namedCode(row);
  }

  async softDeleteRegion(id: string): Promise<void> {
    await this.requireActive('region', id);
    await this.prisma.region.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async listCities(query: MasterDataListQuery): Promise<PaginatedList<CityEntity>> {
    const { page, limit, skip } = this.pageParams(query);
    const or = namedSearchOr(query.search);
    const where: Prisma.CityWhereInput = {
      deletedAt: null,
      ...(query.regionId ? { regionId: query.regionId } : {}),
      ...(or ? { OR: or } : {}),
    };
    const [total, rows] = await Promise.all([
      this.prisma.city.count({ where }),
      this.prisma.city.findMany({ where, orderBy: { nameEn: 'asc' }, skip, take: limit }),
    ]);
    return this.pageResult(page, limit, total, rows.map((r) => MasterDataMapper.city(r)));
  }

  async createCity(data: CreateCityInput): Promise<CityEntity> {
    const row = await this.prisma.city.create({
      data: {
        regionId: data.regionId,
        code: data.code,
        nameEn: data.nameEn,
        nameMm: data.nameMm ?? null,
      },
    });
    return MasterDataMapper.city(row);
  }

  async updateCity(id: string, data: UpdateCityInput): Promise<CityEntity> {
    await this.requireActive('city', id);
    const row = await this.prisma.city.update({
      where: { id },
      data: {
        ...(data.regionId !== undefined ? { regionId: data.regionId } : {}),
        ...(data.code !== undefined ? { code: data.code } : {}),
        ...(data.nameEn !== undefined ? { nameEn: data.nameEn } : {}),
        ...(data.nameMm !== undefined ? { nameMm: data.nameMm } : {}),
      },
    });
    return MasterDataMapper.city(row);
  }

  async softDeleteCity(id: string): Promise<void> {
    await this.requireActive('city', id);
    await this.prisma.city.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async listGates(query: MasterDataListQuery): Promise<PaginatedList<GateEntity>> {
    const { page, limit, skip } = this.pageParams(query);
    const or = namedSearchOr(query.search);
    const where: Prisma.GateWhereInput = {
      deletedAt: null,
      ...(or ? { OR: or } : {}),
    };
    const [total, rows] = await Promise.all([
      this.prisma.gate.count({ where }),
      this.prisma.gate.findMany({
        where,
        include: { cityCoverages: { where: { deletedAt: null } } },
        orderBy: { nameEn: 'asc' },
        skip,
        take: limit,
      }),
    ]);
    return this.pageResult(page, limit, total, rows.map((r) => MasterDataMapper.gate(r)));
  }

  async createGate(data: CreateGateInput): Promise<GateEntity> {
    const row = await this.prisma.gate.create({
      data: {
        cityId: data.cityId,
        parentGateId: data.parentGateId ?? null,
        code: data.code,
        nameEn: data.nameEn,
        nameMm: data.nameMm ?? null,
        gateType: data.gateType ?? GateType.BRANCH,
        phone: data.phone ?? null,
        addressEn: data.addressEn ?? null,
      },
      include: { cityCoverages: true },
    });
    return MasterDataMapper.gate(row);
  }

  async updateGate(id: string, data: UpdateGateInput): Promise<GateEntity> {
    await this.requireActive('gate', id);
    const row = await this.prisma.gate.update({
      where: { id },
      data: {
        ...(data.cityId !== undefined ? { cityId: data.cityId } : {}),
        ...(data.parentGateId !== undefined ? { parentGateId: data.parentGateId } : {}),
        ...(data.code !== undefined ? { code: data.code } : {}),
        ...(data.nameEn !== undefined ? { nameEn: data.nameEn } : {}),
        ...(data.nameMm !== undefined ? { nameMm: data.nameMm } : {}),
        ...(data.gateType !== undefined ? { gateType: data.gateType } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.addressEn !== undefined ? { addressEn: data.addressEn } : {}),
      },
      include: { cityCoverages: { where: { deletedAt: null } } },
    });
    return MasterDataMapper.gate(row);
  }

  async softDeleteGate(id: string): Promise<void> {
    await this.requireActive('gate', id);
    await this.prisma.gate.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async setGateCityCoverage(
    gateId: string,
    cityIds: string[],
  ): Promise<GateEntity> {
    await this.requireActive('gate', gateId);
    const existing = await this.prisma.gateCityCoverage.findMany({
      where: { gateId, deletedAt: null },
    });
    for (const row of existing) {
      if (!cityIds.includes(row.cityId)) {
        await this.prisma.gateCityCoverage.update({
          where: { id: row.id },
          data: { deletedAt: new Date() },
        });
      }
    }
    for (const cityId of cityIds) {
      const found = await this.prisma.gateCityCoverage.findFirst({
        where: { gateId, cityId },
      });
      if (found) {
        await this.prisma.gateCityCoverage.update({
          where: { id: found.id },
          data: { deletedAt: null },
        });
      } else {
        await this.prisma.gateCityCoverage.create({ data: { gateId, cityId } });
      }
    }
    const gate = await this.prisma.gate.findFirst({
      where: { id: gateId },
      include: { cityCoverages: { where: { deletedAt: null } } },
    });
    if (!gate) throw new NotFoundException('Gate not found');
    return MasterDataMapper.gate(gate);
  }

  async listCustomers(
    query: MasterDataListQuery,
  ): Promise<PaginatedList<CustomerEntity>> {
    const { page, limit, skip } = this.pageParams(query);
    const or = namedSearchOr(query.search);
    const where: Prisma.CustomerWhereInput = {
      deletedAt: null,
      ...(or ? { OR: or } : {}),
    };
    const [total, rows] = await Promise.all([
      this.prisma.customer.count({ where }),
      this.prisma.customer.findMany({
        where,
        orderBy: { nameEn: 'asc' },
        skip,
        take: limit,
      }),
    ]);
    return this.pageResult(page, limit, total, rows.map((r) => MasterDataMapper.customer(r)));
  }

  async createCustomer(data: CreateCustomerInput): Promise<CustomerEntity> {
    const row = await this.prisma.customer.create({
      data: {
        code: data.code,
        customerType: data.customerType ?? CustomerType.SHOP,
        shopType: data.shopType ?? null,
        nameEn: data.nameEn,
        nameMm: data.nameMm ?? null,
        phone: data.phone ?? null,
        cityId: data.cityId,
        preferredGateId: data.preferredGateId ?? null,
        addressEn: data.addressEn ?? null,
      },
    });
    return MasterDataMapper.customer(row);
  }

  async updateCustomer(
    id: string,
    data: UpdateCustomerInput,
  ): Promise<CustomerEntity> {
    await this.requireActive('customer', id);
    const row = await this.prisma.customer.update({
      where: { id },
      data: {
        ...(data.code !== undefined ? { code: data.code } : {}),
        ...(data.customerType !== undefined ? { customerType: data.customerType } : {}),
        ...(data.shopType !== undefined ? { shopType: data.shopType } : {}),
        ...(data.nameEn !== undefined ? { nameEn: data.nameEn } : {}),
        ...(data.nameMm !== undefined ? { nameMm: data.nameMm } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.cityId !== undefined ? { cityId: data.cityId } : {}),
        ...(data.preferredGateId !== undefined
          ? { preferredGateId: data.preferredGateId }
          : {}),
        ...(data.addressEn !== undefined ? { addressEn: data.addressEn } : {}),
      },
    });
    return MasterDataMapper.customer(row);
  }

  async softDeleteCustomer(id: string): Promise<void> {
    await this.requireActive('customer', id);
    await this.prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async listSuppliers(
    query: MasterDataListQuery,
  ): Promise<PaginatedList<SupplierEntity>> {
    const { page, limit, skip } = this.pageParams(query);
    const or = namedSearchOr(query.search);
    const where: Prisma.SupplierWhereInput = {
      deletedAt: null,
      ...(or ? { OR: or } : {}),
    };
    const [total, rows] = await Promise.all([
      this.prisma.supplier.count({ where }),
      this.prisma.supplier.findMany({
        where,
        orderBy: { nameEn: 'asc' },
        skip,
        take: limit,
      }),
    ]);
    return this.pageResult(page, limit, total, rows.map((r) => MasterDataMapper.supplier(r)));
  }

  async createSupplier(data: CreateSupplierInput): Promise<SupplierEntity> {
    const row = await this.prisma.supplier.create({
      data: {
        code: data.code,
        nameEn: data.nameEn,
        nameMm: data.nameMm ?? null,
        phone: data.phone ?? null,
        addressEn: data.addressEn ?? null,
      },
    });
    return MasterDataMapper.supplier(row);
  }

  async updateSupplier(
    id: string,
    data: UpdateSupplierInput,
  ): Promise<SupplierEntity> {
    await this.requireActive('supplier', id);
    const row = await this.prisma.supplier.update({
      where: { id },
      data: {
        ...(data.code !== undefined ? { code: data.code } : {}),
        ...(data.nameEn !== undefined ? { nameEn: data.nameEn } : {}),
        ...(data.nameMm !== undefined ? { nameMm: data.nameMm } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.addressEn !== undefined ? { addressEn: data.addressEn } : {}),
      },
    });
    return MasterDataMapper.supplier(row);
  }

  async softDeleteSupplier(id: string): Promise<void> {
    await this.requireActive('supplier', id);
    await this.prisma.supplier.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async listRawMaterials(
    query: MasterDataListQuery,
  ): Promise<PaginatedList<RawMaterialEntity>> {
    const { page, limit, skip } = this.pageParams(query);
    const or = namedSearchOr(query.search);
    const where: Prisma.RawMaterialWhereInput = {
      deletedAt: null,
      ...(or ? { OR: or } : {}),
    };
    const [total, rows] = await Promise.all([
      this.prisma.rawMaterial.count({ where }),
      this.prisma.rawMaterial.findMany({
        where,
        orderBy: { nameEn: 'asc' },
        skip,
        take: limit,
      }),
    ]);
    return this.pageResult(
      page,
      limit,
      total,
      rows.map((r) => MasterDataMapper.rawMaterial(r)),
    );
  }

  async createRawMaterial(
    data: CreateRawMaterialInput,
  ): Promise<RawMaterialEntity> {
    const row = await this.prisma.rawMaterial.create({
      data: {
        code: data.code,
        nameEn: data.nameEn,
        nameMm: data.nameMm ?? null,
        unitId: data.unitId,
        description: data.description ?? null,
      },
    });
    return MasterDataMapper.rawMaterial(row);
  }

  async updateRawMaterial(
    id: string,
    data: UpdateRawMaterialInput,
  ): Promise<RawMaterialEntity> {
    await this.requireActive('rawMaterial', id);
    const row = await this.prisma.rawMaterial.update({
      where: { id },
      data: {
        ...(data.code !== undefined ? { code: data.code } : {}),
        ...(data.nameEn !== undefined ? { nameEn: data.nameEn } : {}),
        ...(data.nameMm !== undefined ? { nameMm: data.nameMm } : {}),
        ...(data.unitId !== undefined ? { unitId: data.unitId } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
      },
    });
    return MasterDataMapper.rawMaterial(row);
  }

  async softDeleteRawMaterial(id: string): Promise<void> {
    await this.requireActive('rawMaterial', id);
    await this.prisma.rawMaterial.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async linkSupplierRawMaterial(
    data: LinkSupplierRawMaterialInput,
  ): Promise<SupplierRawMaterialEntity> {
    const row = await this.prisma.supplierRawMaterial.create({
      data: {
        supplierId: data.supplierId,
        rawMaterialId: data.rawMaterialId,
        unitPriceMmk:
          data.unitPriceMmk != null ? toDecimal(data.unitPriceMmk) : null,
        isPreferred: data.isPreferred ?? false,
      },
    });
    return MasterDataMapper.supplierRaw(row);
  }

  async updateSupplierRawMaterial(
    id: string,
    data: UpdateSupplierRawMaterialInput,
  ): Promise<SupplierRawMaterialEntity> {
    await this.requireActive('supplierRawMaterial', id);
    const row = await this.prisma.supplierRawMaterial.update({
      where: { id },
      data: {
        ...(data.supplierId !== undefined ? { supplierId: data.supplierId } : {}),
        ...(data.rawMaterialId !== undefined
          ? { rawMaterialId: data.rawMaterialId }
          : {}),
        ...(data.unitPriceMmk !== undefined
          ? {
              unitPriceMmk:
                data.unitPriceMmk != null ? toDecimal(data.unitPriceMmk) : null,
            }
          : {}),
        ...(data.isPreferred !== undefined ? { isPreferred: data.isPreferred } : {}),
      },
    });
    return MasterDataMapper.supplierRaw(row);
  }

  async softDeleteSupplierRawMaterial(id: string): Promise<void> {
    await this.requireActive('supplierRawMaterial', id);
    await this.prisma.supplierRawMaterial.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private async requireActive(
    model:
      | 'unit'
      | 'brand'
      | 'product'
      | 'productSku'
      | 'region'
      | 'city'
      | 'gate'
      | 'customer'
      | 'supplier'
      | 'rawMaterial'
      | 'supplierRawMaterial',
    id: string,
  ): Promise<void> {
    const where = { id, deletedAt: null };
    let found: { id: string } | null = null;
    switch (model) {
      case 'unit':
        found = await this.prisma.unit.findFirst({ where, select: { id: true } });
        break;
      case 'brand':
        found = await this.prisma.brand.findFirst({ where, select: { id: true } });
        break;
      case 'product':
        found = await this.prisma.product.findFirst({
          where,
          select: { id: true },
        });
        break;
      case 'productSku':
        found = await this.prisma.productSku.findFirst({
          where,
          select: { id: true },
        });
        break;
      case 'region':
        found = await this.prisma.region.findFirst({
          where,
          select: { id: true },
        });
        break;
      case 'city':
        found = await this.prisma.city.findFirst({ where, select: { id: true } });
        break;
      case 'gate':
        found = await this.prisma.gate.findFirst({ where, select: { id: true } });
        break;
      case 'customer':
        found = await this.prisma.customer.findFirst({
          where,
          select: { id: true },
        });
        break;
      case 'supplier':
        found = await this.prisma.supplier.findFirst({
          where,
          select: { id: true },
        });
        break;
      case 'rawMaterial':
        found = await this.prisma.rawMaterial.findFirst({
          where,
          select: { id: true },
        });
        break;
      case 'supplierRawMaterial':
        found = await this.prisma.supplierRawMaterial.findFirst({
          where,
          select: { id: true },
        });
        break;
    }
    if (!found) throw new NotFoundException(`${model} not found`);
  }
}