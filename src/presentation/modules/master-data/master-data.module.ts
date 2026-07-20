import { Module } from '@nestjs/common';
import { MasterDataController } from './master-data.controller.js';
import * as uc from '../../../application/use-cases/master-data/index.js';
import { MASTER_DATA_REPOSITORY } from '../../../domain/repositories/master-data.repository.interface.js';
import { MasterDataRepository } from '../../../infrastructure/repositories/master-data.repository.js';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import { UserRepository } from '../../../infrastructure/repositories/user.repository.js';

@Module({
  controllers: [MasterDataController],
  providers: [
    uc.GetCompanyContextUseCase,
    uc.ListUnitsUseCase,
    uc.CreateUnitUseCase,
    uc.UpdateUnitUseCase,
    uc.DeleteUnitUseCase,
    uc.ListBrandsUseCase,
    uc.CreateBrandUseCase,
    uc.UpdateBrandUseCase,
    uc.DeleteBrandUseCase,
    uc.ListProductsUseCase,
    uc.CreateProductUseCase,
    uc.UpdateProductUseCase,
    uc.DeleteProductUseCase,
    uc.ListProductSkusUseCase,
    uc.CreateProductSkuUseCase,
    uc.UpdateProductSkuUseCase,
    uc.DeleteProductSkuUseCase,
    uc.ListRegionsUseCase,
    uc.CreateRegionUseCase,
    uc.UpdateRegionUseCase,
    uc.DeleteRegionUseCase,
    uc.ListCitiesUseCase,
    uc.CreateCityUseCase,
    uc.UpdateCityUseCase,
    uc.DeleteCityUseCase,
    uc.ListGatesUseCase,
    uc.CreateGateUseCase,
    uc.UpdateGateUseCase,
    uc.DeleteGateUseCase,
    uc.SetGateCityCoverageUseCase,
    uc.ListCustomersUseCase,
    uc.CreateCustomerUseCase,
    uc.UpdateCustomerUseCase,
    uc.DeleteCustomerUseCase,
    uc.ListSuppliersUseCase,
    uc.CreateSupplierUseCase,
    uc.UpdateSupplierUseCase,
    uc.DeleteSupplierUseCase,
    uc.ListRawMaterialsUseCase,
    uc.CreateRawMaterialUseCase,
    uc.UpdateRawMaterialUseCase,
    uc.DeleteRawMaterialUseCase,
    uc.LinkSupplierRawMaterialUseCase,
    uc.UpdateSupplierRawMaterialUseCase,
    uc.DeleteSupplierRawMaterialUseCase,
    { provide: MASTER_DATA_REPOSITORY, useClass: MasterDataRepository },
    { provide: USER_REPOSITORY, useClass: UserRepository },
  ],
})
export class MasterDataModule {}
