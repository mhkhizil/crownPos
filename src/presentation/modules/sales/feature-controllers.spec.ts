import { jest } from '@jest/globals';
import { HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { createHttpTestApp } from '../../../test-utils/http-test-app.js';
import { SalesController } from './sales.controller.js';
import { ListSalesOrdersUseCase } from '../../../application/use-cases/sales/list-sales-orders.use-case.js';
import { GetSalesOrderUseCase } from '../../../application/use-cases/sales/get-sales-order.use-case.js';
import { CreateSalesOrderUseCase } from '../../../application/use-cases/sales/create-sales-order.use-case.js';
import { ConfirmSalesOrderUseCase } from '../../../application/use-cases/sales/confirm-sales-order.use-case.js';
import { ProductionController } from '../production/production.controller.js';
import { ListProductionDaysUseCase } from '../../../application/use-cases/production/list-production-days.use-case.js';
import { UpsertProductionDayUseCase } from '../../../application/use-cases/production/upsert-production-day.use-case.js';
import { MasterDataController } from '../master-data/master-data.controller.js';
import { GetCompanyContextUseCase } from '../../../application/use-cases/master-data/get-company-context.use-case.js';
import { ListUnitsUseCase } from '../../../application/use-cases/master-data/list-units.use-case.js';
import { CreateUnitUseCase } from '../../../application/use-cases/master-data/create-unit.use-case.js';
import { UpdateUnitUseCase } from '../../../application/use-cases/master-data/update-unit.use-case.js';
import { DeleteUnitUseCase } from '../../../application/use-cases/master-data/delete-unit.use-case.js';
import { ListBrandsUseCase } from '../../../application/use-cases/master-data/list-brands.use-case.js';
import { CreateBrandUseCase } from '../../../application/use-cases/master-data/create-brand.use-case.js';
import { UpdateBrandUseCase } from '../../../application/use-cases/master-data/update-brand.use-case.js';
import { DeleteBrandUseCase } from '../../../application/use-cases/master-data/delete-brand.use-case.js';
import { ListProductsUseCase } from '../../../application/use-cases/master-data/list-products.use-case.js';
import { CreateProductUseCase } from '../../../application/use-cases/master-data/create-product.use-case.js';
import { UpdateProductUseCase } from '../../../application/use-cases/master-data/update-product.use-case.js';
import { DeleteProductUseCase } from '../../../application/use-cases/master-data/delete-product.use-case.js';
import { ListProductSkusUseCase } from '../../../application/use-cases/master-data/list-product-skus.use-case.js';
import { CreateProductSkuUseCase } from '../../../application/use-cases/master-data/create-product-sku.use-case.js';
import { UpdateProductSkuUseCase } from '../../../application/use-cases/master-data/update-product-sku.use-case.js';
import { DeleteProductSkuUseCase } from '../../../application/use-cases/master-data/delete-product-sku.use-case.js';
import { ListRegionsUseCase } from '../../../application/use-cases/master-data/list-regions.use-case.js';
import { CreateRegionUseCase } from '../../../application/use-cases/master-data/create-region.use-case.js';
import { UpdateRegionUseCase } from '../../../application/use-cases/master-data/update-region.use-case.js';
import { DeleteRegionUseCase } from '../../../application/use-cases/master-data/delete-region.use-case.js';
import { ListCitiesUseCase } from '../../../application/use-cases/master-data/list-cities.use-case.js';
import { CreateCityUseCase } from '../../../application/use-cases/master-data/create-city.use-case.js';
import { UpdateCityUseCase } from '../../../application/use-cases/master-data/update-city.use-case.js';
import { DeleteCityUseCase } from '../../../application/use-cases/master-data/delete-city.use-case.js';
import { ListGatesUseCase } from '../../../application/use-cases/master-data/list-gates.use-case.js';
import { CreateGateUseCase } from '../../../application/use-cases/master-data/create-gate.use-case.js';
import { UpdateGateUseCase } from '../../../application/use-cases/master-data/update-gate.use-case.js';
import { DeleteGateUseCase } from '../../../application/use-cases/master-data/delete-gate.use-case.js';
import { SetGateCityCoverageUseCase } from '../../../application/use-cases/master-data/set-gate-city-coverage.use-case.js';
import { ListCustomersUseCase } from '../../../application/use-cases/master-data/list-customers.use-case.js';
import { CreateCustomerUseCase } from '../../../application/use-cases/master-data/create-customer.use-case.js';
import { UpdateCustomerUseCase } from '../../../application/use-cases/master-data/update-customer.use-case.js';
import { DeleteCustomerUseCase } from '../../../application/use-cases/master-data/delete-customer.use-case.js';
import { ListSuppliersUseCase } from '../../../application/use-cases/master-data/list-suppliers.use-case.js';
import { CreateSupplierUseCase } from '../../../application/use-cases/master-data/create-supplier.use-case.js';
import { UpdateSupplierUseCase } from '../../../application/use-cases/master-data/update-supplier.use-case.js';
import { DeleteSupplierUseCase } from '../../../application/use-cases/master-data/delete-supplier.use-case.js';
import { ListRawMaterialsUseCase } from '../../../application/use-cases/master-data/list-raw-materials.use-case.js';
import { CreateRawMaterialUseCase } from '../../../application/use-cases/master-data/create-raw-material.use-case.js';
import { UpdateRawMaterialUseCase } from '../../../application/use-cases/master-data/update-raw-material.use-case.js';
import { DeleteRawMaterialUseCase } from '../../../application/use-cases/master-data/delete-raw-material.use-case.js';
import { LinkSupplierRawMaterialUseCase } from '../../../application/use-cases/master-data/link-supplier-raw-material.use-case.js';
import { UpdateSupplierRawMaterialUseCase } from '../../../application/use-cases/master-data/update-supplier-raw-material.use-case.js';
import { DeleteSupplierRawMaterialUseCase } from '../../../application/use-cases/master-data/delete-supplier-raw-material.use-case.js';
import { InventoryController } from '../inventory/inventory.controller.js';
import { ListInventoryBalancesUseCase } from '../../../application/use-cases/inventory/list-inventory-balances.use-case.js';
import { RecordDailyStockCountUseCase } from '../../../application/use-cases/inventory/record-daily-stock-count.use-case.js';
import { PurchasesController } from '../purchases/purchases.controller.js';
import { CreatePurchaseOrderUseCase } from '../../../application/use-cases/purchases/create-purchase-order.use-case.js';
import { ReceivePurchaseOrderUseCase } from '../../../application/use-cases/purchases/receive-purchase-order.use-case.js';
import {
  CancelPurchaseOrderUseCase,
  GetPurchaseOrderUseCase,
  ListPurchaseOrdersUseCase,
} from '../../../application/use-cases/purchases/list-get-cancel-purchase.use-case.js';
import { OutboundController } from '../outbound/outbound.controller.js';
import { ListOutboundsUseCase } from '../../../application/use-cases/outbound/list-outbounds.use-case.js';
import { CreateOutboundUseCase } from '../../../application/use-cases/outbound/create-outbound.use-case.js';
import { TransitionOutboundStatusUseCase } from '../../../application/use-cases/outbound/transition-outbound-status.use-case.js';
import { BillingController } from '../billing/billing.controller.js';
import { ListInvoicesUseCase } from '../../../application/use-cases/billing/list-invoices.use-case.js';
import { CreateInvoiceFromOrderUseCase } from '../../../application/use-cases/billing/create-invoice-from-order.use-case.js';
import { ListPaymentsUseCase } from '../../../application/use-cases/billing/list-payments.use-case.js';
import { RecordPaymentUseCase } from '../../../application/use-cases/billing/record-payment.use-case.js';
import { ListCollectionRemindersUseCase } from '../../../application/use-cases/billing/list-collection-reminders.use-case.js';
import { CreateCollectionReminderUseCase } from '../../../application/use-cases/billing/create-collection-reminder.use-case.js';
import { DispatchDueCollectionRemindersUseCase } from '../../../application/use-cases/billing/dispatch-due-collection-reminders.use-case.js';
import { PricingController } from '../pricing/pricing.controller.js';
import { UpsertCustomerPriceUseCase } from '../../../application/use-cases/pricing/upsert-customer-price.use-case.js';
import { UpsertVolumeTierUseCase } from '../../../application/use-cases/pricing/upsert-volume-tier.use-case.js';
import { UpsertCityPriceUseCase } from '../../../application/use-cases/pricing/upsert-city-price.use-case.js';
import { ResolvePriceUseCase } from '../../../application/use-cases/pricing/resolve-price.use-case.js';
import { BdAnalyticsController } from '../bd-analytics/bd-analytics.controller.js';
import { UpsertCustomerTargetUseCase } from '../../../application/use-cases/bd-analytics/upsert-customer-target.use-case.js';
import { CreateDigitalAssetUseCase } from '../../../application/use-cases/bd-analytics/create-digital-asset.use-case.js';
import { ListDigitalAssetsUseCase } from '../../../application/use-cases/bd-analytics/list-digital-assets.use-case.js';
import { CreatePhysicalAssetUseCase } from '../../../application/use-cases/bd-analytics/create-physical-asset.use-case.js';
import { ListPhysicalAssetsUseCase } from '../../../application/use-cases/bd-analytics/list-physical-assets.use-case.js';
import { CreateMarketingPlanUseCase } from '../../../application/use-cases/bd-analytics/create-marketing-plan.use-case.js';
import { CreateCampaignUseCase } from '../../../application/use-cases/bd-analytics/create-campaign.use-case.js';
import { RecordBrandAwarenessUseCase } from '../../../application/use-cases/bd-analytics/record-brand-awareness.use-case.js';
import { GetAnalyticsSummaryUseCase } from '../../../application/use-cases/bd-analytics/get-analytics-summary.use-case.js';
import { GetSalesAnalysisUseCase } from '../../../application/use-cases/bd-analytics/get-sales-analysis.use-case.js';
import { RefreshDailySnapshotsUseCase } from '../../../application/use-cases/bd-analytics/refresh-daily-snapshots.use-case.js';

type AuthedCtx = {
  switchToHttp: () => {
    getRequest: () => { user: { sub: string; email: string } };
  };
};

function authOverride(actor: { sub: string; email: string }) {
  return {
    guard: JwtAuthGuard,
    canActivate: (ctx: unknown) => {
      const req = (ctx as AuthedCtx).switchToHttp().getRequest();
      req.user = actor;
      return true;
    },
  };
}

function mockExecute<T>(value: T) {
  return { execute: jest.fn<() => Promise<T>>().mockResolvedValue(value) };
}

describe('Split feature controllers', () => {
  const actor = { sub: 'user-1', email: 'root@test.com' };
  jest.setTimeout(60_000);

  it('sales endpoints call per-action use-cases', async () => {
    const listSalesOrders = mockExecute([{ id: 'o1' }]);
    const getSalesOrder = mockExecute({ id: 'o1' });
    const createSalesOrder = mockExecute({ id: 'o1', status: 'DRAFT' });
    const confirmSalesOrder = mockExecute({
      id: 'o1',
      status: 'CONFIRMED',
    });

    const { app, close } = await createHttpTestApp({
      controllers: [SalesController],
      providers: [
        { provide: ListSalesOrdersUseCase, useValue: listSalesOrders },
        { provide: GetSalesOrderUseCase, useValue: getSalesOrder },
        { provide: CreateSalesOrderUseCase, useValue: createSalesOrder },
        { provide: ConfirmSalesOrderUseCase, useValue: confirmSalesOrder },
      ],
      overrideGuards: [authOverride(actor)],
    });

    await request(app.getHttpServer())
      .get('/api/v1/admin/dashboard/sales/orders')
      .expect(HttpStatus.OK);
    expect(listSalesOrders.execute).toHaveBeenCalledWith('user-1');

    await request(app.getHttpServer())
      .get('/api/v1/admin/dashboard/sales/orders/o1')
      .expect(HttpStatus.OK);
    expect(getSalesOrder.execute).toHaveBeenCalledWith('user-1', 'o1');

    await request(app.getHttpServer())
      .post('/api/v1/admin/dashboard/sales/orders')
      .send({
        customerId: 'c1',
        orderDate: '2026-07-19',
        orderSource: 'SHOP_INBOUND_CALL',
        deliveryChannel: 'DIRECT_TO_SHOP',
        lines: [
          {
            productSkuId: 's1',
            unitId: 'u1',
            quantity: 1,
            unitPriceMmk: 1000,
          },
        ],
      })
      .expect(HttpStatus.CREATED);
    expect(createSalesOrder.execute).toHaveBeenCalled();

    await request(app.getHttpServer())
      .post('/api/v1/admin/dashboard/sales/orders/o1/confirm')
      .expect(HttpStatus.OK);
    expect(confirmSalesOrder.execute).toHaveBeenCalledWith('user-1', 'o1');

    await close();
  });

  it('other feature modules expose section routes', async () => {
    const useCases = [
      GetCompanyContextUseCase,
      ListUnitsUseCase,
      CreateUnitUseCase,
      UpdateUnitUseCase,
      DeleteUnitUseCase,
      ListBrandsUseCase,
      CreateBrandUseCase,
      UpdateBrandUseCase,
      DeleteBrandUseCase,
      ListProductsUseCase,
      CreateProductUseCase,
      UpdateProductUseCase,
      DeleteProductUseCase,
      ListProductSkusUseCase,
      CreateProductSkuUseCase,
      UpdateProductSkuUseCase,
      DeleteProductSkuUseCase,
      ListRegionsUseCase,
      CreateRegionUseCase,
      UpdateRegionUseCase,
      DeleteRegionUseCase,
      ListCitiesUseCase,
      CreateCityUseCase,
      UpdateCityUseCase,
      DeleteCityUseCase,
      ListGatesUseCase,
      CreateGateUseCase,
      UpdateGateUseCase,
      DeleteGateUseCase,
      SetGateCityCoverageUseCase,
      ListCustomersUseCase,
      CreateCustomerUseCase,
      UpdateCustomerUseCase,
      DeleteCustomerUseCase,
      ListSuppliersUseCase,
      CreateSupplierUseCase,
      UpdateSupplierUseCase,
      DeleteSupplierUseCase,
      ListRawMaterialsUseCase,
      CreateRawMaterialUseCase,
      UpdateRawMaterialUseCase,
      DeleteRawMaterialUseCase,
      LinkSupplierRawMaterialUseCase,
      UpdateSupplierRawMaterialUseCase,
      DeleteSupplierRawMaterialUseCase,
      ListProductionDaysUseCase,
      UpsertProductionDayUseCase,
      ListInventoryBalancesUseCase,
      RecordDailyStockCountUseCase,
      ListPurchaseOrdersUseCase,
      GetPurchaseOrderUseCase,
      CreatePurchaseOrderUseCase,
      ReceivePurchaseOrderUseCase,
      CancelPurchaseOrderUseCase,
      ListOutboundsUseCase,
      CreateOutboundUseCase,
      TransitionOutboundStatusUseCase,
      ListInvoicesUseCase,
      CreateInvoiceFromOrderUseCase,
      ListPaymentsUseCase,
      RecordPaymentUseCase,
      ListCollectionRemindersUseCase,
      CreateCollectionReminderUseCase,
      DispatchDueCollectionRemindersUseCase,
      UpsertCustomerPriceUseCase,
      UpsertVolumeTierUseCase,
      UpsertCityPriceUseCase,
      ResolvePriceUseCase,
      UpsertCustomerTargetUseCase,
      CreateDigitalAssetUseCase,
      ListDigitalAssetsUseCase,
      CreatePhysicalAssetUseCase,
      ListPhysicalAssetsUseCase,
      CreateMarketingPlanUseCase,
      CreateCampaignUseCase,
      RecordBrandAwarenessUseCase,
      GetAnalyticsSummaryUseCase,
      GetSalesAnalysisUseCase,
      RefreshDailySnapshotsUseCase,
    ] as const;

    const { app, close } = await createHttpTestApp({
      controllers: [
        MasterDataController,
        ProductionController,
        InventoryController,
        PurchasesController,
        OutboundController,
        BillingController,
        PricingController,
        BdAnalyticsController,
      ],
      providers: useCases.map((UseCase) => ({
        provide: UseCase,
        useValue: mockExecute({ ok: true }),
      })),
      overrideGuards: [authOverride(actor)],
    });

    await request(app.getHttpServer())
      .get('/api/v1/admin/dashboard/master-data/units')
      .expect(HttpStatus.OK);
    await request(app.getHttpServer())
      .get('/api/v1/admin/dashboard/production')
      .expect(HttpStatus.OK);
    await request(app.getHttpServer())
      .get('/api/v1/admin/dashboard/inventory/balances')
      .expect(HttpStatus.OK);
    await request(app.getHttpServer())
      .get('/api/v1/admin/dashboard/purchases')
      .expect(HttpStatus.OK);
    await request(app.getHttpServer())
      .get('/api/v1/admin/dashboard/outbound')
      .expect(HttpStatus.OK);
    await request(app.getHttpServer())
      .get('/api/v1/admin/dashboard/billing/invoices')
      .expect(HttpStatus.OK);
    await request(app.getHttpServer())
      .post('/api/v1/admin/dashboard/pricing/resolve')
      .send({ productSkuId: 's1', quantity: 1 })
      .expect(HttpStatus.OK);
    await request(app.getHttpServer())
      .get('/api/v1/admin/dashboard/bd-analytics/analytics/summary')
      .expect(HttpStatus.OK);

    await close();
  });
});
