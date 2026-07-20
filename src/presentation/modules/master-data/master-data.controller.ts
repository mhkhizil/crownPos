import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../../common/decorators/current-user.decorator.js';
import {
  ApiNullSuccessResponse,
  ApiPaginatedSuccessResponse,
  ApiSuccessResponse,
} from '../../../common/decorators/api-response.decorator.js';
import { ApiResponseDto } from '../../../application/dtos/common/api-response.dto.js';
import { PaginatedResponseDto } from '../../../application/dtos/common/pagination.dto.js';
import * as uc from '../../../application/use-cases/master-data/index.js';
import { ROUTE_PREFIX } from '../../routing.paths.js';
import {
  CityListQueryDto,
  CityResponseDto,
  CompanyContextResponseDto,
  CreateCityDto,
  CreateCustomerDto,
  CreateGateDto,
  CreateNamedCodeDto,
  CreateProductDto,
  CreateProductSkuDto,
  CreateRawMaterialDto,
  CreateSupplierDto,
  CustomerResponseDto,
  GateResponseDto,
  LinkSupplierRawMaterialDto,
  MasterDataListQueryDto,
  NamedCodeResponseDto,
  ProductResponseDto,
  ProductSkuResponseDto,
  RawMaterialResponseDto,
  SetGateCoverageDto,
  SupplierRawMaterialResponseDto,
  SupplierResponseDto,
  UpdateCityDto,
  UpdateCustomerDto,
  UpdateGateDto,
  UpdateNamedCodeDto,
  UpdateProductDto,
  UpdateProductSkuDto,
  UpdateRawMaterialDto,
  UpdateSupplierDto,
  UpdateSupplierRawMaterialDto,
} from '../../../application/dtos/master-data/index.js';

@ApiTags('Master Data')
@Controller(`${ROUTE_PREFIX.adminDashboard}/master-data`)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MasterDataController {
  constructor(
    private readonly getCompanyContext: uc.GetCompanyContextUseCase,
    private readonly listUnits: uc.ListUnitsUseCase,
    private readonly createUnit: uc.CreateUnitUseCase,
    private readonly updateUnit: uc.UpdateUnitUseCase,
    private readonly deleteUnit: uc.DeleteUnitUseCase,
    private readonly listBrands: uc.ListBrandsUseCase,
    private readonly createBrand: uc.CreateBrandUseCase,
    private readonly updateBrand: uc.UpdateBrandUseCase,
    private readonly deleteBrand: uc.DeleteBrandUseCase,
    private readonly listProducts: uc.ListProductsUseCase,
    private readonly createProduct: uc.CreateProductUseCase,
    private readonly updateProduct: uc.UpdateProductUseCase,
    private readonly deleteProduct: uc.DeleteProductUseCase,
    private readonly listProductSkus: uc.ListProductSkusUseCase,
    private readonly createProductSku: uc.CreateProductSkuUseCase,
    private readonly updateProductSku: uc.UpdateProductSkuUseCase,
    private readonly deleteProductSku: uc.DeleteProductSkuUseCase,
    private readonly listRegions: uc.ListRegionsUseCase,
    private readonly createRegion: uc.CreateRegionUseCase,
    private readonly updateRegion: uc.UpdateRegionUseCase,
    private readonly deleteRegion: uc.DeleteRegionUseCase,
    private readonly listCities: uc.ListCitiesUseCase,
    private readonly createCity: uc.CreateCityUseCase,
    private readonly updateCity: uc.UpdateCityUseCase,
    private readonly deleteCity: uc.DeleteCityUseCase,
    private readonly listGates: uc.ListGatesUseCase,
    private readonly createGate: uc.CreateGateUseCase,
    private readonly updateGate: uc.UpdateGateUseCase,
    private readonly deleteGate: uc.DeleteGateUseCase,
    private readonly setGateCityCoverage: uc.SetGateCityCoverageUseCase,
    private readonly listCustomers: uc.ListCustomersUseCase,
    private readonly createCustomer: uc.CreateCustomerUseCase,
    private readonly updateCustomer: uc.UpdateCustomerUseCase,
    private readonly deleteCustomer: uc.DeleteCustomerUseCase,
    private readonly listSuppliers: uc.ListSuppliersUseCase,
    private readonly createSupplier: uc.CreateSupplierUseCase,
    private readonly updateSupplier: uc.UpdateSupplierUseCase,
    private readonly deleteSupplier: uc.DeleteSupplierUseCase,
    private readonly listRawMaterials: uc.ListRawMaterialsUseCase,
    private readonly createRawMaterial: uc.CreateRawMaterialUseCase,
    private readonly updateRawMaterial: uc.UpdateRawMaterialUseCase,
    private readonly deleteRawMaterial: uc.DeleteRawMaterialUseCase,
    private readonly linkSupplierRawMaterial: uc.LinkSupplierRawMaterialUseCase,
    private readonly updateSupplierRawMaterial: uc.UpdateSupplierRawMaterialUseCase,
    private readonly deleteSupplierRawMaterial: uc.DeleteSupplierRawMaterialUseCase,
  ) {}

  @Get('company')
  @ApiOperation({ summary: 'Company / factory / stock location context' })
  @ApiSuccessResponse(CompanyContextResponseDto, {
    status: HttpStatus.OK,
    description: 'Company context retrieved',
  })
  async company(
    @CurrentUser() u: JwtPayload,
  ): Promise<ApiResponseDto<CompanyContextResponseDto>> {
    return ApiResponseDto.success(await this.getCompanyContext.execute(u.sub));
  }

  // —— Units ——
  @Get('units')
  @ApiOperation({ summary: 'List units (paginated, searchable)' })
  @ApiPaginatedSuccessResponse(NamedCodeResponseDto, {
    status: HttpStatus.OK,
    description: 'Units retrieved',
  })
  async units(
    @CurrentUser() u: JwtPayload,
    @Query() query: MasterDataListQueryDto,
  ): Promise<ApiResponseDto<PaginatedResponseDto<NamedCodeResponseDto>>> {
    return ApiResponseDto.success(await this.listUnits.execute(u.sub, query));
  }

  @Post('units')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create unit' })
  @ApiSuccessResponse(NamedCodeResponseDto, {
    status: HttpStatus.CREATED,
    description: 'Unit created',
  })
  async createUnitHandler(
    @CurrentUser() u: JwtPayload,
    @Body() body: CreateNamedCodeDto,
  ): Promise<ApiResponseDto<NamedCodeResponseDto>> {
    return ApiResponseDto.success(
      await this.createUnit.execute(u.sub, body),
      'Unit created',
    );
  }

  @Patch('units/:id')
  @ApiOperation({ summary: 'Update unit' })
  @ApiSuccessResponse(NamedCodeResponseDto, {
    status: HttpStatus.OK,
    description: 'Unit updated',
  })
  async updateUnitHandler(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
    @Body() body: UpdateNamedCodeDto,
  ): Promise<ApiResponseDto<NamedCodeResponseDto>> {
    return ApiResponseDto.success(
      await this.updateUnit.execute(u.sub, id, body),
      'Unit updated',
    );
  }

  @Delete('units/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete unit' })
  @ApiNullSuccessResponse({ status: HttpStatus.OK, description: 'Unit deleted' })
  async deleteUnitHandler(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
  ): Promise<ApiResponseDto<null>> {
    await this.deleteUnit.execute(u.sub, id);
    return ApiResponseDto.success(null, 'Unit deleted');
  }

  // —— Brands ——
  @Get('brands')
  @ApiOperation({ summary: 'List brands (paginated, searchable)' })
  @ApiPaginatedSuccessResponse(NamedCodeResponseDto, {
    status: HttpStatus.OK,
    description: 'Brands retrieved',
  })
  async brands(
    @CurrentUser() u: JwtPayload,
    @Query() query: MasterDataListQueryDto,
  ): Promise<ApiResponseDto<PaginatedResponseDto<NamedCodeResponseDto>>> {
    return ApiResponseDto.success(await this.listBrands.execute(u.sub, query));
  }

  @Post('brands')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create brand' })
  @ApiSuccessResponse(NamedCodeResponseDto, {
    status: HttpStatus.CREATED,
    description: 'Brand created',
  })
  async createBrandHandler(
    @CurrentUser() u: JwtPayload,
    @Body() body: CreateNamedCodeDto,
  ): Promise<ApiResponseDto<NamedCodeResponseDto>> {
    return ApiResponseDto.success(
      await this.createBrand.execute(u.sub, body),
      'Brand created',
    );
  }

  @Patch('brands/:id')
  @ApiOperation({ summary: 'Update brand' })
  @ApiSuccessResponse(NamedCodeResponseDto, {
    status: HttpStatus.OK,
    description: 'Brand updated',
  })
  async updateBrandHandler(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
    @Body() body: UpdateNamedCodeDto,
  ): Promise<ApiResponseDto<NamedCodeResponseDto>> {
    return ApiResponseDto.success(
      await this.updateBrand.execute(u.sub, id, body),
      'Brand updated',
    );
  }

  @Delete('brands/:id')
  @ApiOperation({ summary: 'Soft-delete brand' })
  @ApiNullSuccessResponse({
    status: HttpStatus.OK,
    description: 'Brand deleted',
  })
  async deleteBrandHandler(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
  ): Promise<ApiResponseDto<null>> {
    await this.deleteBrand.execute(u.sub, id);
    return ApiResponseDto.success(null, 'Brand deleted');
  }

  // —— Products ——
  @Get('products')
  @ApiOperation({ summary: 'List products (paginated, searchable)' })
  @ApiPaginatedSuccessResponse(ProductResponseDto, {
    status: HttpStatus.OK,
    description: 'Products retrieved',
  })
  async products(
    @CurrentUser() u: JwtPayload,
    @Query() query: MasterDataListQueryDto,
  ): Promise<ApiResponseDto<PaginatedResponseDto<ProductResponseDto>>> {
    return ApiResponseDto.success(
      await this.listProducts.execute(u.sub, query),
    );
  }

  @Post('products')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create product' })
  @ApiSuccessResponse(ProductResponseDto, {
    status: HttpStatus.CREATED,
    description: 'Product created',
  })
  async createProductHandler(
    @CurrentUser() u: JwtPayload,
    @Body() body: CreateProductDto,
  ): Promise<ApiResponseDto<ProductResponseDto>> {
    return ApiResponseDto.success(
      await this.createProduct.execute(u.sub, body),
      'Product created',
    );
  }

  @Patch('products/:id')
  @ApiOperation({ summary: 'Update product' })
  @ApiSuccessResponse(ProductResponseDto, {
    status: HttpStatus.OK,
    description: 'Product updated',
  })
  async updateProductHandler(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
    @Body() body: UpdateProductDto,
  ): Promise<ApiResponseDto<ProductResponseDto>> {
    return ApiResponseDto.success(
      await this.updateProduct.execute(u.sub, id, body),
      'Product updated',
    );
  }

  @Delete('products/:id')
  @ApiOperation({ summary: 'Soft-delete product' })
  @ApiNullSuccessResponse({
    status: HttpStatus.OK,
    description: 'Product deleted',
  })
  async deleteProductHandler(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
  ): Promise<ApiResponseDto<null>> {
    await this.deleteProduct.execute(u.sub, id);
    return ApiResponseDto.success(null, 'Product deleted');
  }

  // —— SKUs ——
  @Get('skus')
  @ApiOperation({ summary: 'List product SKUs (paginated, searchable)' })
  @ApiPaginatedSuccessResponse(ProductSkuResponseDto, {
    status: HttpStatus.OK,
    description: 'SKUs retrieved',
  })
  async skus(
    @CurrentUser() u: JwtPayload,
    @Query() query: MasterDataListQueryDto,
  ): Promise<ApiResponseDto<PaginatedResponseDto<ProductSkuResponseDto>>> {
    return ApiResponseDto.success(
      await this.listProductSkus.execute(u.sub, query),
    );
  }

  @Post('skus')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create product SKU' })
  @ApiSuccessResponse(ProductSkuResponseDto, {
    status: HttpStatus.CREATED,
    description: 'SKU created',
  })
  async createSku(
    @CurrentUser() u: JwtPayload,
    @Body() body: CreateProductSkuDto,
  ): Promise<ApiResponseDto<ProductSkuResponseDto>> {
    return ApiResponseDto.success(
      await this.createProductSku.execute(u.sub, body),
      'SKU created',
    );
  }

  @Patch('skus/:id')
  @ApiOperation({ summary: 'Update product SKU' })
  @ApiSuccessResponse(ProductSkuResponseDto, {
    status: HttpStatus.OK,
    description: 'SKU updated',
  })
  async updateSku(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
    @Body() body: UpdateProductSkuDto,
  ): Promise<ApiResponseDto<ProductSkuResponseDto>> {
    return ApiResponseDto.success(
      await this.updateProductSku.execute(u.sub, id, body),
      'SKU updated',
    );
  }

  @Delete('skus/:id')
  @ApiOperation({ summary: 'Soft-delete product SKU' })
  @ApiNullSuccessResponse({ status: HttpStatus.OK, description: 'SKU deleted' })
  async deleteSku(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
  ): Promise<ApiResponseDto<null>> {
    await this.deleteProductSku.execute(u.sub, id);
    return ApiResponseDto.success(null, 'SKU deleted');
  }

  // —— Regions ——
  @Get('regions')
  @ApiOperation({ summary: 'List regions (paginated, searchable)' })
  @ApiPaginatedSuccessResponse(NamedCodeResponseDto, {
    status: HttpStatus.OK,
    description: 'Regions retrieved',
  })
  async regions(
    @CurrentUser() u: JwtPayload,
    @Query() query: MasterDataListQueryDto,
  ): Promise<ApiResponseDto<PaginatedResponseDto<NamedCodeResponseDto>>> {
    return ApiResponseDto.success(await this.listRegions.execute(u.sub, query));
  }

  @Post('regions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create region' })
  @ApiSuccessResponse(NamedCodeResponseDto, {
    status: HttpStatus.CREATED,
    description: 'Region created',
  })
  async createRegionHandler(
    @CurrentUser() u: JwtPayload,
    @Body() body: CreateNamedCodeDto,
  ): Promise<ApiResponseDto<NamedCodeResponseDto>> {
    return ApiResponseDto.success(
      await this.createRegion.execute(u.sub, body),
      'Region created',
    );
  }

  @Patch('regions/:id')
  @ApiOperation({ summary: 'Update region' })
  @ApiSuccessResponse(NamedCodeResponseDto, {
    status: HttpStatus.OK,
    description: 'Region updated',
  })
  async updateRegionHandler(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
    @Body() body: UpdateNamedCodeDto,
  ): Promise<ApiResponseDto<NamedCodeResponseDto>> {
    return ApiResponseDto.success(
      await this.updateRegion.execute(u.sub, id, body),
      'Region updated',
    );
  }

  @Delete('regions/:id')
  @ApiOperation({ summary: 'Soft-delete region' })
  @ApiNullSuccessResponse({
    status: HttpStatus.OK,
    description: 'Region deleted',
  })
  async deleteRegionHandler(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
  ): Promise<ApiResponseDto<null>> {
    await this.deleteRegion.execute(u.sub, id);
    return ApiResponseDto.success(null, 'Region deleted');
  }

  // —— Cities ——
  @Get('cities')
  @ApiOperation({ summary: 'List cities (paginated, searchable, region filter)' })
  @ApiPaginatedSuccessResponse(CityResponseDto, {
    status: HttpStatus.OK,
    description: 'Cities retrieved',
  })
  async cities(
    @CurrentUser() u: JwtPayload,
    @Query() query: CityListQueryDto,
  ): Promise<ApiResponseDto<PaginatedResponseDto<CityResponseDto>>> {
    return ApiResponseDto.success(await this.listCities.execute(u.sub, query));
  }

  @Post('cities')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create city' })
  @ApiSuccessResponse(CityResponseDto, {
    status: HttpStatus.CREATED,
    description: 'City created',
  })
  async createCityHandler(
    @CurrentUser() u: JwtPayload,
    @Body() body: CreateCityDto,
  ): Promise<ApiResponseDto<CityResponseDto>> {
    return ApiResponseDto.success(
      await this.createCity.execute(u.sub, body),
      'City created',
    );
  }

  @Patch('cities/:id')
  @ApiOperation({ summary: 'Update city' })
  @ApiSuccessResponse(CityResponseDto, {
    status: HttpStatus.OK,
    description: 'City updated',
  })
  async updateCityHandler(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
    @Body() body: UpdateCityDto,
  ): Promise<ApiResponseDto<CityResponseDto>> {
    return ApiResponseDto.success(
      await this.updateCity.execute(u.sub, id, body),
      'City updated',
    );
  }

  @Delete('cities/:id')
  @ApiOperation({ summary: 'Soft-delete city' })
  @ApiNullSuccessResponse({
    status: HttpStatus.OK,
    description: 'City deleted',
  })
  async deleteCityHandler(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
  ): Promise<ApiResponseDto<null>> {
    await this.deleteCity.execute(u.sub, id);
    return ApiResponseDto.success(null, 'City deleted');
  }

  // —— Gates ——
  @Get('gates')
  @ApiOperation({ summary: 'List gates (paginated, searchable)' })
  @ApiPaginatedSuccessResponse(GateResponseDto, {
    status: HttpStatus.OK,
    description: 'Gates retrieved',
  })
  async gates(
    @CurrentUser() u: JwtPayload,
    @Query() query: MasterDataListQueryDto,
  ): Promise<ApiResponseDto<PaginatedResponseDto<GateResponseDto>>> {
    return ApiResponseDto.success(await this.listGates.execute(u.sub, query));
  }

  @Post('gates')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create gate' })
  @ApiSuccessResponse(GateResponseDto, {
    status: HttpStatus.CREATED,
    description: 'Gate created',
  })
  async createGateHandler(
    @CurrentUser() u: JwtPayload,
    @Body() body: CreateGateDto,
  ): Promise<ApiResponseDto<GateResponseDto>> {
    return ApiResponseDto.success(
      await this.createGate.execute(u.sub, body),
      'Gate created',
    );
  }

  @Patch('gates/:id')
  @ApiOperation({ summary: 'Update gate' })
  @ApiSuccessResponse(GateResponseDto, {
    status: HttpStatus.OK,
    description: 'Gate updated',
  })
  async updateGateHandler(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
    @Body() body: UpdateGateDto,
  ): Promise<ApiResponseDto<GateResponseDto>> {
    return ApiResponseDto.success(
      await this.updateGate.execute(u.sub, id, body),
      'Gate updated',
    );
  }

  @Delete('gates/:id')
  @ApiOperation({ summary: 'Soft-delete gate' })
  @ApiNullSuccessResponse({
    status: HttpStatus.OK,
    description: 'Gate deleted',
  })
  async deleteGateHandler(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
  ): Promise<ApiResponseDto<null>> {
    await this.deleteGate.execute(u.sub, id);
    return ApiResponseDto.success(null, 'Gate deleted');
  }

  @Post('gates/:gateId/coverage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set gate city coverage' })
  @ApiSuccessResponse(GateResponseDto, {
    status: HttpStatus.OK,
    description: 'Gate coverage updated',
  })
  async gateCoverage(
    @CurrentUser() u: JwtPayload,
    @Param('gateId') gateId: string,
    @Body() body: SetGateCoverageDto,
  ): Promise<ApiResponseDto<GateResponseDto>> {
    return ApiResponseDto.success(
      await this.setGateCityCoverage.execute(
        u.sub,
        gateId,
        body.cityIds ?? [],
      ),
      'Gate coverage updated',
    );
  }

  // —— Customers ——
  @Get('customers')
  @ApiOperation({ summary: 'List customers (paginated, searchable)' })
  @ApiPaginatedSuccessResponse(CustomerResponseDto, {
    status: HttpStatus.OK,
    description: 'Customers retrieved',
  })
  async customers(
    @CurrentUser() u: JwtPayload,
    @Query() query: MasterDataListQueryDto,
  ): Promise<ApiResponseDto<PaginatedResponseDto<CustomerResponseDto>>> {
    return ApiResponseDto.success(
      await this.listCustomers.execute(u.sub, query),
    );
  }

  @Post('customers')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create customer' })
  @ApiSuccessResponse(CustomerResponseDto, {
    status: HttpStatus.CREATED,
    description: 'Customer created',
  })
  async createCustomerHandler(
    @CurrentUser() u: JwtPayload,
    @Body() body: CreateCustomerDto,
  ): Promise<ApiResponseDto<CustomerResponseDto>> {
    return ApiResponseDto.success(
      await this.createCustomer.execute(u.sub, body),
      'Customer created',
    );
  }

  @Patch('customers/:id')
  @ApiOperation({ summary: 'Update customer' })
  @ApiSuccessResponse(CustomerResponseDto, {
    status: HttpStatus.OK,
    description: 'Customer updated',
  })
  async updateCustomerHandler(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
    @Body() body: UpdateCustomerDto,
  ): Promise<ApiResponseDto<CustomerResponseDto>> {
    return ApiResponseDto.success(
      await this.updateCustomer.execute(u.sub, id, body),
      'Customer updated',
    );
  }

  @Delete('customers/:id')
  @ApiOperation({ summary: 'Soft-delete customer' })
  @ApiNullSuccessResponse({
    status: HttpStatus.OK,
    description: 'Customer deleted',
  })
  async deleteCustomerHandler(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
  ): Promise<ApiResponseDto<null>> {
    await this.deleteCustomer.execute(u.sub, id);
    return ApiResponseDto.success(null, 'Customer deleted');
  }

  // —— Suppliers ——
  @Get('suppliers')
  @ApiOperation({ summary: 'List suppliers (paginated, searchable)' })
  @ApiPaginatedSuccessResponse(SupplierResponseDto, {
    status: HttpStatus.OK,
    description: 'Suppliers retrieved',
  })
  async suppliers(
    @CurrentUser() u: JwtPayload,
    @Query() query: MasterDataListQueryDto,
  ): Promise<ApiResponseDto<PaginatedResponseDto<SupplierResponseDto>>> {
    return ApiResponseDto.success(
      await this.listSuppliers.execute(u.sub, query),
    );
  }

  @Post('suppliers')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create supplier' })
  @ApiSuccessResponse(SupplierResponseDto, {
    status: HttpStatus.CREATED,
    description: 'Supplier created',
  })
  async createSupplierHandler(
    @CurrentUser() u: JwtPayload,
    @Body() body: CreateSupplierDto,
  ): Promise<ApiResponseDto<SupplierResponseDto>> {
    return ApiResponseDto.success(
      await this.createSupplier.execute(u.sub, body),
      'Supplier created',
    );
  }

  @Patch('suppliers/:id')
  @ApiOperation({ summary: 'Update supplier' })
  @ApiSuccessResponse(SupplierResponseDto, {
    status: HttpStatus.OK,
    description: 'Supplier updated',
  })
  async updateSupplierHandler(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
    @Body() body: UpdateSupplierDto,
  ): Promise<ApiResponseDto<SupplierResponseDto>> {
    return ApiResponseDto.success(
      await this.updateSupplier.execute(u.sub, id, body),
      'Supplier updated',
    );
  }

  @Delete('suppliers/:id')
  @ApiOperation({ summary: 'Soft-delete supplier' })
  @ApiNullSuccessResponse({
    status: HttpStatus.OK,
    description: 'Supplier deleted',
  })
  async deleteSupplierHandler(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
  ): Promise<ApiResponseDto<null>> {
    await this.deleteSupplier.execute(u.sub, id);
    return ApiResponseDto.success(null, 'Supplier deleted');
  }

  // —— Raw materials ——
  @Get('raw-materials')
  @ApiOperation({ summary: 'List raw materials (paginated, searchable)' })
  @ApiPaginatedSuccessResponse(RawMaterialResponseDto, {
    status: HttpStatus.OK,
    description: 'Raw materials retrieved',
  })
  async rawMaterials(
    @CurrentUser() u: JwtPayload,
    @Query() query: MasterDataListQueryDto,
  ): Promise<ApiResponseDto<PaginatedResponseDto<RawMaterialResponseDto>>> {
    return ApiResponseDto.success(
      await this.listRawMaterials.execute(u.sub, query),
    );
  }

  @Post('raw-materials')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create raw material' })
  @ApiSuccessResponse(RawMaterialResponseDto, {
    status: HttpStatus.CREATED,
    description: 'Raw material created',
  })
  async createRawMaterialHandler(
    @CurrentUser() u: JwtPayload,
    @Body() body: CreateRawMaterialDto,
  ): Promise<ApiResponseDto<RawMaterialResponseDto>> {
    return ApiResponseDto.success(
      await this.createRawMaterial.execute(u.sub, body),
      'Raw material created',
    );
  }

  @Patch('raw-materials/:id')
  @ApiOperation({ summary: 'Update raw material' })
  @ApiSuccessResponse(RawMaterialResponseDto, {
    status: HttpStatus.OK,
    description: 'Raw material updated',
  })
  async updateRawMaterialHandler(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
    @Body() body: UpdateRawMaterialDto,
  ): Promise<ApiResponseDto<RawMaterialResponseDto>> {
    return ApiResponseDto.success(
      await this.updateRawMaterial.execute(u.sub, id, body),
      'Raw material updated',
    );
  }

  @Delete('raw-materials/:id')
  @ApiOperation({ summary: 'Soft-delete raw material' })
  @ApiNullSuccessResponse({
    status: HttpStatus.OK,
    description: 'Raw material deleted',
  })
  async deleteRawMaterialHandler(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
  ): Promise<ApiResponseDto<null>> {
    await this.deleteRawMaterial.execute(u.sub, id);
    return ApiResponseDto.success(null, 'Raw material deleted');
  }

  @Post('supplier-raw-materials')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Link supplier to raw material' })
  @ApiSuccessResponse(SupplierRawMaterialResponseDto, {
    status: HttpStatus.CREATED,
    description: 'Supplier–raw material linked',
  })
  async linkSupplierRaw(
    @CurrentUser() u: JwtPayload,
    @Body() body: LinkSupplierRawMaterialDto,
  ): Promise<ApiResponseDto<SupplierRawMaterialResponseDto>> {
    return ApiResponseDto.success(
      await this.linkSupplierRawMaterial.execute(u.sub, body),
      'Linked',
    );
  }

  @Patch('supplier-raw-materials/:id')
  @ApiOperation({ summary: 'Update supplier–raw material link' })
  @ApiSuccessResponse(SupplierRawMaterialResponseDto, {
    status: HttpStatus.OK,
    description: 'Link updated',
  })
  async updateSupplierRaw(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
    @Body() body: UpdateSupplierRawMaterialDto,
  ): Promise<ApiResponseDto<SupplierRawMaterialResponseDto>> {
    return ApiResponseDto.success(
      await this.updateSupplierRawMaterial.execute(u.sub, id, body),
      'Link updated',
    );
  }

  @Delete('supplier-raw-materials/:id')
  @ApiOperation({ summary: 'Soft-delete supplier–raw material link' })
  @ApiNullSuccessResponse({
    status: HttpStatus.OK,
    description: 'Link deleted',
  })
  async deleteSupplierRaw(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
  ): Promise<ApiResponseDto<null>> {
    await this.deleteSupplierRawMaterial.execute(u.sub, id);
    return ApiResponseDto.success(null, 'Link deleted');
  }
}
