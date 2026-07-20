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
} from '../entities/master-data.entity.js';
import type { CustomerType } from '../enums/customer-type.enum.js';
import type { GateType } from '../enums/gate-type.enum.js';
import type { ShopType } from '../enums/shop-type.enum.js';

export const MASTER_DATA_REPOSITORY = Symbol('MASTER_DATA_REPOSITORY');

export interface MasterDataListQuery {
  page: number;
  limit: number;
  search?: string;
  regionId?: string;
}

export interface PaginatedList<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateNamedCodeInput {
  code: string;
  nameEn: string;
  nameMm?: string | null;
  symbol?: string | null;
  description?: string | null;
}

export type UpdateNamedCodeInput = Partial<CreateNamedCodeInput>;

export interface CreateProductInput {
  brandId: string;
  code: string;
  nameEn: string;
  nameMm?: string | null;
  description?: string | null;
}

export type UpdateProductInput = Partial<CreateProductInput>;

export interface CreateProductSkuInput {
  productId: string;
  unitId: string;
  code: string;
  nameEn: string;
  nameMm?: string | null;
  packSize?: number;
}

export type UpdateProductSkuInput = Partial<CreateProductSkuInput>;

export interface CreateCityInput {
  regionId: string;
  code: string;
  nameEn: string;
  nameMm?: string | null;
}

export type UpdateCityInput = Partial<CreateCityInput>;

export interface CreateGateInput {
  cityId: string;
  parentGateId?: string | null;
  code: string;
  nameEn: string;
  nameMm?: string | null;
  gateType?: GateType;
  phone?: string | null;
  addressEn?: string | null;
}

export type UpdateGateInput = Partial<CreateGateInput>;

export interface CreateCustomerInput {
  code: string;
  customerType?: CustomerType;
  shopType?: ShopType | null;
  nameEn: string;
  nameMm?: string | null;
  phone?: string | null;
  cityId: string;
  preferredGateId?: string | null;
  addressEn?: string | null;
}

export type UpdateCustomerInput = Partial<CreateCustomerInput>;

export interface CreateSupplierInput {
  code: string;
  nameEn: string;
  nameMm?: string | null;
  phone?: string | null;
  addressEn?: string | null;
}

export type UpdateSupplierInput = Partial<CreateSupplierInput>;

export interface CreateRawMaterialInput {
  code: string;
  nameEn: string;
  nameMm?: string | null;
  unitId: string;
  description?: string | null;
}

export type UpdateRawMaterialInput = Partial<CreateRawMaterialInput>;

export interface LinkSupplierRawMaterialInput {
  supplierId: string;
  rawMaterialId: string;
  unitPriceMmk?: number | null;
  isPreferred?: boolean;
}

export type UpdateSupplierRawMaterialInput =
  Partial<LinkSupplierRawMaterialInput>;

export interface IMasterDataRepository {
  getCompanyContext(): Promise<CompanyContextEntity>;

  listUnits(query: MasterDataListQuery): Promise<PaginatedList<NamedCodeEntity>>;
  createUnit(data: CreateNamedCodeInput): Promise<NamedCodeEntity>;
  updateUnit(id: string, data: UpdateNamedCodeInput): Promise<NamedCodeEntity>;
  softDeleteUnit(id: string): Promise<void>;

  listBrands(query: MasterDataListQuery): Promise<PaginatedList<NamedCodeEntity>>;
  createBrand(data: CreateNamedCodeInput): Promise<NamedCodeEntity>;
  updateBrand(id: string, data: UpdateNamedCodeInput): Promise<NamedCodeEntity>;
  softDeleteBrand(id: string): Promise<void>;

  listProducts(query: MasterDataListQuery): Promise<PaginatedList<ProductEntity>>;
  createProduct(data: CreateProductInput): Promise<ProductEntity>;
  updateProduct(id: string, data: UpdateProductInput): Promise<ProductEntity>;
  softDeleteProduct(id: string): Promise<void>;

  listProductSkus(
    query: MasterDataListQuery,
  ): Promise<PaginatedList<ProductSkuEntity>>;
  createProductSku(data: CreateProductSkuInput): Promise<ProductSkuEntity>;
  updateProductSku(
    id: string,
    data: UpdateProductSkuInput,
  ): Promise<ProductSkuEntity>;
  softDeleteProductSku(id: string): Promise<void>;

  listRegions(query: MasterDataListQuery): Promise<PaginatedList<NamedCodeEntity>>;
  createRegion(data: CreateNamedCodeInput): Promise<NamedCodeEntity>;
  updateRegion(id: string, data: UpdateNamedCodeInput): Promise<NamedCodeEntity>;
  softDeleteRegion(id: string): Promise<void>;

  listCities(query: MasterDataListQuery): Promise<PaginatedList<CityEntity>>;
  createCity(data: CreateCityInput): Promise<CityEntity>;
  updateCity(id: string, data: UpdateCityInput): Promise<CityEntity>;
  softDeleteCity(id: string): Promise<void>;

  listGates(query: MasterDataListQuery): Promise<PaginatedList<GateEntity>>;
  createGate(data: CreateGateInput): Promise<GateEntity>;
  updateGate(id: string, data: UpdateGateInput): Promise<GateEntity>;
  softDeleteGate(id: string): Promise<void>;
  setGateCityCoverage(gateId: string, cityIds: string[]): Promise<GateEntity>;

  listCustomers(
    query: MasterDataListQuery,
  ): Promise<PaginatedList<CustomerEntity>>;
  createCustomer(data: CreateCustomerInput): Promise<CustomerEntity>;
  updateCustomer(
    id: string,
    data: UpdateCustomerInput,
  ): Promise<CustomerEntity>;
  softDeleteCustomer(id: string): Promise<void>;

  listSuppliers(
    query: MasterDataListQuery,
  ): Promise<PaginatedList<SupplierEntity>>;
  createSupplier(data: CreateSupplierInput): Promise<SupplierEntity>;
  updateSupplier(
    id: string,
    data: UpdateSupplierInput,
  ): Promise<SupplierEntity>;
  softDeleteSupplier(id: string): Promise<void>;

  listRawMaterials(
    query: MasterDataListQuery,
  ): Promise<PaginatedList<RawMaterialEntity>>;
  createRawMaterial(data: CreateRawMaterialInput): Promise<RawMaterialEntity>;
  updateRawMaterial(
    id: string,
    data: UpdateRawMaterialInput,
  ): Promise<RawMaterialEntity>;
  softDeleteRawMaterial(id: string): Promise<void>;

  linkSupplierRawMaterial(
    data: LinkSupplierRawMaterialInput,
  ): Promise<SupplierRawMaterialEntity>;
  updateSupplierRawMaterial(
    id: string,
    data: UpdateSupplierRawMaterialInput,
  ): Promise<SupplierRawMaterialEntity>;
  softDeleteSupplierRawMaterial(id: string): Promise<void>;
}
