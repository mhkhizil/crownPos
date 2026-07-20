# Full-table seed

## What it does

`npm run db:seed` **TRUNCATES** all public tables (except `_prisma_migrations`), then inserts a coherent Myanmar manufacturing story covering **every** Prisma model (≥1 row each).

Stable lookup codes live in [`prisma/seed/constants.ts`](../prisma/seed/constants.ts) (e.g. `MAIN`, `SKU-FG-01`, `SO-SALE-OK`).

## Phases

| Phase | File | Content |
|---|---|---|
| A | `prisma/seed/phase-a-roots.ts` | Company, Region, Unit, Brand, Role, Permission, Supplier, snapshots, orphan Payment |
| B | `prisma/seed/phase-b-auth-catalog.ts` | Root + staff users, RolePermission, UserRole, City, Product, Raw, MarketingPlan, assets |
| C | `prisma/seed/phase-c-geo-factory.ts` | Gates, Factory, StockLocation, SKU (+ soft-deleted retired SKU), SupplierRawMaterial, campaign/awareness/depreciation |
| D | `prisma/seed/phase-d-pricing-customers.ts` | Customers, targets, prices, BOM |
| E | `prisma/seed/phase-e-ops-inventory.ts` | Received PO, production day, inventory balances, stock count |
| F | `prisma/seed/phase-f-sales-billing.ts` | SO-DRAFT / HOLD / CONFIRMED / GOODS-RECV / SALE-OK + outbounds, invoices, payments, reminders |

## Inventory math

- FG available after seed = `200 − 5 − 8 = 187` (produced minus received goods-recv and sale-ok)
- Raw available = `5000 − 50 = 4950`
- `SO-CONFIRMED` reserves 10 (not yet depleted from FG balance)

## Users

| Email | Role |
|---|---|
| `ROOT_ADMIN_EMAIL` (env) | Root (`isRoot=true`) |
| `ops.staff@seed.local` / `staff123` | `OPS_STAFF` with all 11 permissions |

## Related tests

```bash
npm run db:seed
npm run test:integrity   # FK / XOR / coverage / arithmetic
npm run test:edge        # E1–E9 HTTP edge cases
npm run test:process     # tagged L3 happy paths (independent fixture)
```

Do **not** run integrity/edge in parallel with another `db:seed` truncate.
Do **not** run `test:edge` in parallel with `test:process` (E2 temporarily clears primary stock location).
