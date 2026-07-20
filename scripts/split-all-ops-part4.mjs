/**
 * Part 4: master-data (one use-case per action)
 * Run: node scripts/split-all-ops-part4.mjs
 */
import fs from 'fs';
import path from 'path';

const root = process.cwd();
function w(rel, content) {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
  console.log('✓', rel);
}

function uc({ file, className, typeImports = '', args, body }) {
  w(
    `src/application/use-cases/master-data/${file}.ts`,
    `import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { MASTER_DATA_REPOSITORY } from '../../../domain/repositories/master-data.repository.interface.js';
import type { IMasterDataRepository } from '../../../domain/repositories/master-data.repository.interface.js';
${typeImports}import { requirePermission } from '../_helpers/admin-authorization.helper.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';

@Injectable()
export class ${className} {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(MASTER_DATA_REPOSITORY)
    private readonly repo: IMasterDataRepository,
  ) {}

  async execute(${args}): Promise<unknown> {
    await requirePermission(
      this.users,
      actorId,
      PermissionCode.MANAGE_MASTER_DATA,
    );
    ${body}
  }
}
`,
  );
  return { file, className };
}

const actions = [
  uc({
    file: 'get-company-context.use-case',
    className: 'GetCompanyContextUseCase',
    args: 'actorId: string',
    body: 'return this.repo.getCompanyContext();',
  }),
  uc({
    file: 'list-units.use-case',
    className: 'ListUnitsUseCase',
    args: 'actorId: string',
    body: 'return this.repo.listUnits();',
  }),
  uc({
    file: 'create-unit.use-case',
    className: 'CreateUnitUseCase',
    typeImports:
      "import type { CreateNamedCodeInput } from '../../../domain/repositories/master-data.repository.interface.js';\n",
    args: 'actorId: string, data: CreateNamedCodeInput',
    body: 'return this.repo.createUnit(data);',
  }),
  uc({
    file: 'list-brands.use-case',
    className: 'ListBrandsUseCase',
    args: 'actorId: string',
    body: 'return this.repo.listBrands();',
  }),
  uc({
    file: 'create-brand.use-case',
    className: 'CreateBrandUseCase',
    typeImports:
      "import type { CreateNamedCodeInput } from '../../../domain/repositories/master-data.repository.interface.js';\n",
    args: 'actorId: string, data: CreateNamedCodeInput',
    body: 'return this.repo.createBrand(data);',
  }),
  uc({
    file: 'list-products.use-case',
    className: 'ListProductsUseCase',
    args: 'actorId: string',
    body: 'return this.repo.listProducts();',
  }),
  uc({
    file: 'create-product.use-case',
    className: 'CreateProductUseCase',
    typeImports:
      "import type { CreateProductInput } from '../../../domain/repositories/master-data.repository.interface.js';\n",
    args: 'actorId: string, data: CreateProductInput',
    body: 'return this.repo.createProduct(data);',
  }),
  uc({
    file: 'list-product-skus.use-case',
    className: 'ListProductSkusUseCase',
    args: 'actorId: string',
    body: 'return this.repo.listProductSkus();',
  }),
  uc({
    file: 'create-product-sku.use-case',
    className: 'CreateProductSkuUseCase',
    typeImports:
      "import type { CreateProductSkuInput } from '../../../domain/repositories/master-data.repository.interface.js';\n",
    args: 'actorId: string, data: CreateProductSkuInput',
    body: 'return this.repo.createProductSku(data);',
  }),
  uc({
    file: 'list-regions.use-case',
    className: 'ListRegionsUseCase',
    args: 'actorId: string',
    body: 'return this.repo.listRegions();',
  }),
  uc({
    file: 'create-region.use-case',
    className: 'CreateRegionUseCase',
    typeImports:
      "import type { CreateNamedCodeInput } from '../../../domain/repositories/master-data.repository.interface.js';\n",
    args: 'actorId: string, data: CreateNamedCodeInput',
    body: 'return this.repo.createRegion(data);',
  }),
  uc({
    file: 'list-cities.use-case',
    className: 'ListCitiesUseCase',
    args: 'actorId: string, regionId?: string',
    body: 'return this.repo.listCities(regionId);',
  }),
  uc({
    file: 'create-city.use-case',
    className: 'CreateCityUseCase',
    typeImports:
      "import type { CreateCityInput } from '../../../domain/repositories/master-data.repository.interface.js';\n",
    args: 'actorId: string, data: CreateCityInput',
    body: 'return this.repo.createCity(data);',
  }),
  uc({
    file: 'list-gates.use-case',
    className: 'ListGatesUseCase',
    args: 'actorId: string',
    body: 'return this.repo.listGates();',
  }),
  uc({
    file: 'create-gate.use-case',
    className: 'CreateGateUseCase',
    typeImports:
      "import type { CreateGateInput } from '../../../domain/repositories/master-data.repository.interface.js';\n",
    args: 'actorId: string, data: CreateGateInput',
    body: 'return this.repo.createGate(data);',
  }),
  uc({
    file: 'set-gate-city-coverage.use-case',
    className: 'SetGateCityCoverageUseCase',
    args: 'actorId: string, gateId: string, cityIds: string[]',
    body: 'return this.repo.setGateCityCoverage(gateId, cityIds);',
  }),
  uc({
    file: 'list-customers.use-case',
    className: 'ListCustomersUseCase',
    args: 'actorId: string',
    body: 'return this.repo.listCustomers();',
  }),
  uc({
    file: 'create-customer.use-case',
    className: 'CreateCustomerUseCase',
    typeImports:
      "import type { CreateCustomerInput } from '../../../domain/repositories/master-data.repository.interface.js';\n",
    args: 'actorId: string, data: CreateCustomerInput',
    body: 'return this.repo.createCustomer(data);',
  }),
  uc({
    file: 'list-suppliers.use-case',
    className: 'ListSuppliersUseCase',
    args: 'actorId: string',
    body: 'return this.repo.listSuppliers();',
  }),
  uc({
    file: 'create-supplier.use-case',
    className: 'CreateSupplierUseCase',
    typeImports:
      "import type { CreateSupplierInput } from '../../../domain/repositories/master-data.repository.interface.js';\n",
    args: 'actorId: string, data: CreateSupplierInput',
    body: 'return this.repo.createSupplier(data);',
  }),
  uc({
    file: 'list-raw-materials.use-case',
    className: 'ListRawMaterialsUseCase',
    args: 'actorId: string',
    body: 'return this.repo.listRawMaterials();',
  }),
  uc({
    file: 'create-raw-material.use-case',
    className: 'CreateRawMaterialUseCase',
    typeImports:
      "import type { CreateRawMaterialInput } from '../../../domain/repositories/master-data.repository.interface.js';\n",
    args: 'actorId: string, data: CreateRawMaterialInput',
    body: 'return this.repo.createRawMaterial(data);',
  }),
  uc({
    file: 'link-supplier-raw-material.use-case',
    className: 'LinkSupplierRawMaterialUseCase',
    typeImports:
      "import type { LinkSupplierRawMaterialInput } from '../../../domain/repositories/master-data.repository.interface.js';\n",
    args: 'actorId: string, data: LinkSupplierRawMaterialInput',
    body: 'return this.repo.linkSupplierRawMaterial(data);',
  }),
];

w(
  'src/application/use-cases/master-data/index.ts',
  actions.map((a) => `export * from './${a.file}.js';`).join('\n') + '\n',
);

const imports = actions
  .map(
    (a) =>
      `import { ${a.className} } from '../../../application/use-cases/master-data/${a.file}.js';`,
  )
  .join('\n');

const ctorParams = [
  'private readonly getCompanyContext: GetCompanyContextUseCase',
  'private readonly listUnits: ListUnitsUseCase',
  'private readonly createUnit: CreateUnitUseCase',
  'private readonly listBrands: ListBrandsUseCase',
  'private readonly createBrand: CreateBrandUseCase',
  'private readonly listProducts: ListProductsUseCase',
  'private readonly createProduct: CreateProductUseCase',
  'private readonly listProductSkus: ListProductSkusUseCase',
  'private readonly createProductSku: CreateProductSkuUseCase',
  'private readonly listRegions: ListRegionsUseCase',
  'private readonly createRegion: CreateRegionUseCase',
  'private readonly listCities: ListCitiesUseCase',
  'private readonly createCity: CreateCityUseCase',
  'private readonly listGates: ListGatesUseCase',
  'private readonly createGate: CreateGateUseCase',
  'private readonly setGateCityCoverage: SetGateCityCoverageUseCase',
  'private readonly listCustomers: ListCustomersUseCase',
  'private readonly createCustomer: CreateCustomerUseCase',
  'private readonly listSuppliers: ListSuppliersUseCase',
  'private readonly createSupplier: CreateSupplierUseCase',
  'private readonly listRawMaterials: ListRawMaterialsUseCase',
  'private readonly createRawMaterial: CreateRawMaterialUseCase',
  'private readonly linkSupplierRawMaterial: LinkSupplierRawMaterialUseCase',
]
  .map((p) => `    ${p},`)
  .join('\n');

w(
  'src/presentation/modules/master-data/master-data.controller.ts',
  `import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../../common/decorators/current-user.decorator.js';
import { ApiResponseDto } from '../../../application/dtos/common/api-response.dto.js';
${imports}
import { ROUTE_PREFIX } from '../../routing.paths.js';
import type {
  CreateCityInput,
  CreateCustomerInput,
  CreateGateInput,
  CreateNamedCodeInput,
  CreateProductInput,
  CreateProductSkuInput,
  CreateRawMaterialInput,
  CreateSupplierInput,
  LinkSupplierRawMaterialInput,
} from '../../../domain/repositories/master-data.repository.interface.js';

@ApiTags('Master Data')
@Controller(\`\${ROUTE_PREFIX.adminDashboard}/master-data\`)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MasterDataController {
  constructor(
${ctorParams}
  ) {}

  @Get('company')
  @ApiOperation({ summary: 'Company / factory / stock location context' })
  async company(@CurrentUser() u: JwtPayload) {
    return ApiResponseDto.success(
      await this.getCompanyContext.execute(u.sub),
    );
  }

  @Get('units')
  async units(@CurrentUser() u: JwtPayload) {
    return ApiResponseDto.success(await this.listUnits.execute(u.sub));
  }
  @Post('units')
  @HttpCode(HttpStatus.CREATED)
  async createUnitHandler(
    @CurrentUser() u: JwtPayload,
    @Body() body: CreateNamedCodeInput,
  ) {
    return ApiResponseDto.success(
      await this.createUnit.execute(u.sub, body),
      'Unit created',
    );
  }

  @Get('brands')
  async brands(@CurrentUser() u: JwtPayload) {
    return ApiResponseDto.success(await this.listBrands.execute(u.sub));
  }
  @Post('brands')
  @HttpCode(HttpStatus.CREATED)
  async createBrandHandler(
    @CurrentUser() u: JwtPayload,
    @Body() body: CreateNamedCodeInput,
  ) {
    return ApiResponseDto.success(
      await this.createBrand.execute(u.sub, body),
      'Brand created',
    );
  }

  @Get('products')
  async products(@CurrentUser() u: JwtPayload) {
    return ApiResponseDto.success(await this.listProducts.execute(u.sub));
  }
  @Post('products')
  @HttpCode(HttpStatus.CREATED)
  async createProductHandler(
    @CurrentUser() u: JwtPayload,
    @Body() body: CreateProductInput,
  ) {
    return ApiResponseDto.success(
      await this.createProduct.execute(u.sub, body),
      'Product created',
    );
  }

  @Get('skus')
  async skus(@CurrentUser() u: JwtPayload) {
    return ApiResponseDto.success(await this.listProductSkus.execute(u.sub));
  }
  @Post('skus')
  @HttpCode(HttpStatus.CREATED)
  async createSku(
    @CurrentUser() u: JwtPayload,
    @Body() body: CreateProductSkuInput,
  ) {
    return ApiResponseDto.success(
      await this.createProductSku.execute(u.sub, body),
      'SKU created',
    );
  }

  @Get('regions')
  async regions(@CurrentUser() u: JwtPayload) {
    return ApiResponseDto.success(await this.listRegions.execute(u.sub));
  }
  @Post('regions')
  @HttpCode(HttpStatus.CREATED)
  async createRegionHandler(
    @CurrentUser() u: JwtPayload,
    @Body() body: CreateNamedCodeInput,
  ) {
    return ApiResponseDto.success(
      await this.createRegion.execute(u.sub, body),
      'Region created',
    );
  }

  @Get('cities')
  async cities(
    @CurrentUser() u: JwtPayload,
    @Query('regionId') regionId?: string,
  ) {
    return ApiResponseDto.success(
      await this.listCities.execute(u.sub, regionId),
    );
  }
  @Post('cities')
  @HttpCode(HttpStatus.CREATED)
  async createCityHandler(
    @CurrentUser() u: JwtPayload,
    @Body() body: CreateCityInput,
  ) {
    return ApiResponseDto.success(
      await this.createCity.execute(u.sub, body),
      'City created',
    );
  }

  @Get('gates')
  async gates(@CurrentUser() u: JwtPayload) {
    return ApiResponseDto.success(await this.listGates.execute(u.sub));
  }
  @Post('gates')
  @HttpCode(HttpStatus.CREATED)
  async createGateHandler(
    @CurrentUser() u: JwtPayload,
    @Body() body: CreateGateInput,
  ) {
    return ApiResponseDto.success(
      await this.createGate.execute(u.sub, body),
      'Gate created',
    );
  }
  @Post('gates/:gateId/coverage')
  async gateCoverage(
    @CurrentUser() u: JwtPayload,
    @Param('gateId') gateId: string,
    @Body() body: { cityIds: string[] },
  ) {
    return ApiResponseDto.success(
      await this.setGateCityCoverage.execute(
        u.sub,
        gateId,
        body.cityIds ?? [],
      ),
      'Gate coverage updated',
    );
  }

  @Get('customers')
  async customers(@CurrentUser() u: JwtPayload) {
    return ApiResponseDto.success(await this.listCustomers.execute(u.sub));
  }
  @Post('customers')
  @HttpCode(HttpStatus.CREATED)
  async createCustomerHandler(
    @CurrentUser() u: JwtPayload,
    @Body() body: CreateCustomerInput,
  ) {
    return ApiResponseDto.success(
      await this.createCustomer.execute(u.sub, body),
      'Customer created',
    );
  }

  @Get('suppliers')
  async suppliers(@CurrentUser() u: JwtPayload) {
    return ApiResponseDto.success(await this.listSuppliers.execute(u.sub));
  }
  @Post('suppliers')
  @HttpCode(HttpStatus.CREATED)
  async createSupplierHandler(
    @CurrentUser() u: JwtPayload,
    @Body() body: CreateSupplierInput,
  ) {
    return ApiResponseDto.success(
      await this.createSupplier.execute(u.sub, body),
      'Supplier created',
    );
  }

  @Get('raw-materials')
  async rawMaterials(@CurrentUser() u: JwtPayload) {
    return ApiResponseDto.success(await this.listRawMaterials.execute(u.sub));
  }
  @Post('raw-materials')
  @HttpCode(HttpStatus.CREATED)
  async createRawMaterialHandler(
    @CurrentUser() u: JwtPayload,
    @Body() body: CreateRawMaterialInput,
  ) {
    return ApiResponseDto.success(
      await this.createRawMaterial.execute(u.sub, body),
      'Raw material created',
    );
  }
  @Post('supplier-raw-materials')
  @HttpCode(HttpStatus.CREATED)
  async linkSupplierRaw(
    @CurrentUser() u: JwtPayload,
    @Body() body: LinkSupplierRawMaterialInput,
  ) {
    return ApiResponseDto.success(
      await this.linkSupplierRawMaterial.execute(u.sub, body),
      'Linked',
    );
  }
}
`,
);

w(
  'src/presentation/modules/master-data/master-data.module.ts',
  `import { Module } from '@nestjs/common';
import { MasterDataController } from './master-data.controller.js';
${imports}
import { MASTER_DATA_REPOSITORY } from '../../../domain/repositories/master-data.repository.interface.js';
import { MasterDataRepository } from '../../../infrastructure/repositories/master-data.repository.js';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import { UserRepository } from '../../../infrastructure/repositories/user.repository.js';

@Module({
  controllers: [MasterDataController],
  providers: [
${actions.map((a) => `    ${a.className},`).join('\n')}
    { provide: MASTER_DATA_REPOSITORY, useClass: MasterDataRepository },
    { provide: USER_REPOSITORY, useClass: UserRepository },
  ],
})
export class MasterDataModule {}
`,
);

console.log('master-data done');
