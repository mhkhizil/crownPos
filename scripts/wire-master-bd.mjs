/**
 * Rewrite master-data + bd-analytics use-cases and controllers for typed DTOs.
 * node scripts/wire-master-bd.mjs
 */
import fs from 'fs';
import path from 'path';

const root = process.cwd();
function w(rel, content) {
  fs.writeFileSync(path.join(root, rel), content.replace(/\r?\n/g, '\n'));
  console.log('✓', rel);
}

function listUc(name, className, listMethod, responseDto) {
  w(
    `src/application/use-cases/master-data/${name}.ts`,
    `import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { MASTER_DATA_REPOSITORY } from '../../../domain/repositories/master-data.repository.interface.js';
import type { IMasterDataRepository } from '../../../domain/repositories/master-data.repository.interface.js';
import { requirePermission } from '../_helpers/admin-authorization.helper.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';
import { ${responseDto} } from '../../dtos/master-data/master-data-response.dto.js';

@Injectable()
export class ${className} {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(MASTER_DATA_REPOSITORY) private readonly repo: IMasterDataRepository,
  ) {}

  async execute(actorId: string${name === 'list-cities.use-case' ? ', regionId?: string' : ''}): Promise<${responseDto}[]> {
    await requirePermission(this.users, actorId, PermissionCode.MANAGE_MASTER_DATA);
    const rows = await this.repo.${listMethod}(${name === 'list-cities.use-case' ? 'regionId' : ''});
    return rows.map((e) => ${responseDto}.fromEntity(e));
  }
}
`,
  );
}

function createUc(name, className, createMethod, requestDto, responseDto) {
  w(
    `src/application/use-cases/master-data/${name}.ts`,
    `import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { MASTER_DATA_REPOSITORY } from '../../../domain/repositories/master-data.repository.interface.js';
import type { IMasterDataRepository } from '../../../domain/repositories/master-data.repository.interface.js';
import { requirePermission } from '../_helpers/admin-authorization.helper.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';
import { ${requestDto} } from '../../dtos/master-data/master-data-request.dto.js';
import { ${responseDto} } from '../../dtos/master-data/master-data-response.dto.js';

@Injectable()
export class ${className} {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(MASTER_DATA_REPOSITORY) private readonly repo: IMasterDataRepository,
  ) {}

  async execute(actorId: string, data: ${requestDto}): Promise<${responseDto}> {
    await requirePermission(this.users, actorId, PermissionCode.MANAGE_MASTER_DATA);
    return ${responseDto}.fromEntity(await this.repo.${createMethod}(data));
  }
}
`,
  );
}

listUc('list-units.use-case', 'ListUnitsUseCase', 'listUnits', 'NamedCodeResponseDto');
createUc('create-unit.use-case', 'CreateUnitUseCase', 'createUnit', 'CreateNamedCodeDto', 'NamedCodeResponseDto');
listUc('list-brands.use-case', 'ListBrandsUseCase', 'listBrands', 'NamedCodeResponseDto');
createUc('create-brand.use-case', 'CreateBrandUseCase', 'createBrand', 'CreateNamedCodeDto', 'NamedCodeResponseDto');
listUc('list-products.use-case', 'ListProductsUseCase', 'listProducts', 'ProductResponseDto');
createUc('create-product.use-case', 'CreateProductUseCase', 'createProduct', 'CreateProductDto', 'ProductResponseDto');
listUc('list-product-skus.use-case', 'ListProductSkusUseCase', 'listProductSkus', 'ProductSkuResponseDto');
createUc('create-product-sku.use-case', 'CreateProductSkuUseCase', 'createProductSku', 'CreateProductSkuDto', 'ProductSkuResponseDto');
listUc('list-regions.use-case', 'ListRegionsUseCase', 'listRegions', 'NamedCodeResponseDto');
createUc('create-region.use-case', 'CreateRegionUseCase', 'createRegion', 'CreateNamedCodeDto', 'NamedCodeResponseDto');
listUc('list-cities.use-case', 'ListCitiesUseCase', 'listCities', 'CityResponseDto');
createUc('create-city.use-case', 'CreateCityUseCase', 'createCity', 'CreateCityDto', 'CityResponseDto');
listUc('list-gates.use-case', 'ListGatesUseCase', 'listGates', 'GateResponseDto');
createUc('create-gate.use-case', 'CreateGateUseCase', 'createGate', 'CreateGateDto', 'GateResponseDto');
listUc('list-customers.use-case', 'ListCustomersUseCase', 'listCustomers', 'CustomerResponseDto');
createUc('create-customer.use-case', 'CreateCustomerUseCase', 'createCustomer', 'CreateCustomerDto', 'CustomerResponseDto');
listUc('list-suppliers.use-case', 'ListSuppliersUseCase', 'listSuppliers', 'SupplierResponseDto');
createUc('create-supplier.use-case', 'CreateSupplierUseCase', 'createSupplier', 'CreateSupplierDto', 'SupplierResponseDto');
listUc('list-raw-materials.use-case', 'ListRawMaterialsUseCase', 'listRawMaterials', 'RawMaterialResponseDto');
createUc('create-raw-material.use-case', 'CreateRawMaterialUseCase', 'createRawMaterial', 'CreateRawMaterialDto', 'RawMaterialResponseDto');
createUc(
  'link-supplier-raw-material.use-case',
  'LinkSupplierRawMaterialUseCase',
  'linkSupplierRawMaterial',
  'LinkSupplierRawMaterialDto',
  'SupplierRawMaterialResponseDto',
);

w(
  'src/application/use-cases/master-data/get-company-context.use-case.ts',
  `import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { MASTER_DATA_REPOSITORY } from '../../../domain/repositories/master-data.repository.interface.js';
import type { IMasterDataRepository } from '../../../domain/repositories/master-data.repository.interface.js';
import { requirePermission } from '../_helpers/admin-authorization.helper.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';
import { CompanyContextResponseDto } from '../../dtos/master-data/master-data-response.dto.js';

@Injectable()
export class GetCompanyContextUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(MASTER_DATA_REPOSITORY) private readonly repo: IMasterDataRepository,
  ) {}

  async execute(actorId: string): Promise<CompanyContextResponseDto> {
    await requirePermission(this.users, actorId, PermissionCode.MANAGE_MASTER_DATA);
    return CompanyContextResponseDto.fromEntity(await this.repo.getCompanyContext());
  }
}
`,
);

w(
  'src/application/use-cases/master-data/set-gate-city-coverage.use-case.ts',
  `import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { MASTER_DATA_REPOSITORY } from '../../../domain/repositories/master-data.repository.interface.js';
import type { IMasterDataRepository } from '../../../domain/repositories/master-data.repository.interface.js';
import { requirePermission } from '../_helpers/admin-authorization.helper.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';
import { GateResponseDto } from '../../dtos/master-data/master-data-response.dto.js';

@Injectable()
export class SetGateCityCoverageUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(MASTER_DATA_REPOSITORY) private readonly repo: IMasterDataRepository,
  ) {}

  async execute(actorId: string, gateId: string, cityIds: string[]): Promise<GateResponseDto> {
    await requirePermission(this.users, actorId, PermissionCode.MANAGE_MASTER_DATA);
    return GateResponseDto.fromEntity(await this.repo.setGateCityCoverage(gateId, cityIds));
  }
}
`,
);

console.log('master-data use-cases done');
