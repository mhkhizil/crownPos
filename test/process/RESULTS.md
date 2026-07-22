# System process test results + gap matrix

Generated from plan `system_test_plan_a50e8abb` after implementing L2/L3 suites.

**How to re-run**

```bash
npm run db:seed          # wipe + full 54-model story (docs/seed.md)
npm test                 # L0/L1/L2 (mocked + use-case)
npm run test:process     # L3 HTTP process (tagged fixture; requires root)
npm run test:integrity   # DB integrity against full seed
npm run test:edge        # E1–E9 edge / bug regressions
```

**Run stamp:** 2026-07-20 — full-table seed; integrity **9/9**; edge E1–E9 **9/9**; L3 process **5/5**; L2 unit green.

---

## Scenario results

| ID | Scenario | Layer | Result | Notes |
|---|---|---|---|---|
| P1 | Manufacture → nearby direct → receive → partial/full pay → SALE_OK | L3 | **PASS** | FG↑/raw↓, confirm, receive → `GOODS_RECEIVED`, invoice → `AWAITING_PAYMENT`, full pay → `SALE_OK` |
| P2 | VIA_GATE status chain | L3 | **PASS** | Intermediate steps do not flip order; receive → `GOODS_RECEIVED` |
| P3 | Insufficient stock | L3 | **PASS** | Confirm 400, status `HOLD`; outbound create 400 |
| M-var | Same FG, different raw qty | L3 | **PASS** | Two production days; raw balance −(10+18) |
| Neg | SALE_OK before receive | L3 | **PASS** | Early full pay stays `CONFIRMED`; receive then → `SALE_OK` |
| L2-stock | Confirm sufficient / insufficient | L2 | **PASS** | |
| L2-pay | Partial → awaiting; full → SALE_OK | L2 | **PASS** | |
| L2-perm | Missing MANAGE_SALES / PRODUCTION / BILLING | L2 | **PASS** | |
| L2-reup | Production re-upsert inventory | L2 | **PASS** | Identical retry no-op; qty change reverses then applies |

---

## Business-fact matrix (plan §§Sales / Manufacturing)

| # | Fact | Result | Evidence |
|---|---|---|---|
| S1 | Order sources sales/shop call | **PASS** | P1 uses `SHOP_INBOUND_CALL`; P2 uses `SALES_OUTBOUND_CALL` |
| S2 | Stock check before continue | **PASS** | Confirm + L2 confirm specs |
| S3 | No-stock hold | **PASS** | Confirm → `HOLD` + 400; re-confirm from HOLD when stock OK |
| S4 | Scheduled outbound + driver | **PASS** | Outbound create from `CONFIRMED` → `READY_AT_FACTORY` |
| S5 | Nearby DIRECT_TO_SHOP → receive | **PASS** | P1; receive → `GOODS_RECEIVED`, not SALE_OK |
| S6 | Far VIA_GATE sequence | **PASS** | Happy path + server enforces channel-specific next statuses |
| S7 | Received ≠ paid; GOODS_RECEIVED | **PASS** | Receive → `GOODS_RECEIVED`; invoice → `AWAITING_PAYMENT`; pay → `SALE_OK` |
| S8 | SALE_OK only after full payment | **PASS** | P1 + L2 payment |
| S9 | Direct still receive → pay → OK | **PASS** | Early pay cannot SALE_OK; receive then closes if already paid |
| S10 | Collection reminders while unpaid | **PASS** | P1 creates reminder; status stays awaiting |
| M1–M4 | Free-form raw / daily output / employees / variable raw | **PASS** | P1 + M-var |
| M5 | Raw depletion + re-upsert | **PASS** | Create adjusts; re-upsert reverses prior then applies (or no-op if identical) |
| M6 | Inventory feeds sales confirm | **PASS** | P1/P3 |
| M7 | Drop raw inbound without production | **EXPECTED GAP** | No purchase API; seed uses direct `inventoryBalance` workaround |

---

## Product gap list (from plan) — current verdict

| # | Gap | Verdict after this run |
|---|---|---|
| 1 | Raw inbound / purchase APIs | **CLOSED** — `POST/GET .../purchases`, `POST .../purchases/:id/receive`, cancel; `receiveImmediately` for drop-raw |
| 2 | `GOODS_RECEIVED` never set as status | **CLOSED** — unpaid receive → `GOODS_RECEIVED`; invoice → `AWAITING_PAYMENT`; early invoice + receive → `AWAITING_PAYMENT`; early pay + receive → `SALE_OK` |
| 3 | No HOLD order status | **CLOSED** — insufficient stock → `HOLD` (no REJECT; internal-only) |
| 4 | Outbound status machine not enforced | **CLOSED** — channel-aware transitions in `TransitionOutboundStatusUseCase` |
| 5 | SALE_OK without prior receive | **CLOSED** — payment only closes after receive; early pay + later receive → SALE_OK |
| 6 | Master data incomplete CRUD | **IMPROVED** — update/delete + pagination now exist (prior work); not re-failed here |
| 7 | Production re-upsert inventory double-count | **CLOSED** — reverse prior + apply new; identical payload skips inventory |
| 8 | Pricing not wired into order create | **EXPECTED GAP** — orders still require manual `unitPriceMmk` |
| 9 | Company/Factory/StockLocation write APIs | **EXPECTED GAP** — seed/`ensureCompanyFactoryStock` only |
| 10 | Soft-delete APIs for catalog | **IMPROVED** — master-data DELETE soft-delete present |
| 11 | Optional BOM estimate APIs | Deferred (OK) |
| 12 | No L2/L3 process suite | **CLOSED** — this change set |

---

## Artifacts

| Path | Role |
|---|---|
| `test/process/process-seed.ts` | Minimal company/factory/SKU/customer/raw seed |
| `test/process/process-http.ts` | Nest AppModule + root JWT helpers |
| `test/process/sales-manufacture.process.e2e-spec.ts` | L3 P1/P2/P3/M-var/Neg |
| `src/application/use-cases/sales/confirm-sales-order.use-case.spec.ts` | L2 stock + sales permission |
| `src/application/use-cases/billing/record-payment.use-case.spec.ts` | L2 payment + billing permission |
| `src/application/use-cases/production/upsert-production-day.use-case.spec.ts` | L2 production + re-upsert gap |

Remaining expected gaps: pricing wiring (8), company/factory/stock write APIs (9).

---

## Sales analysis (added 2026-07-20)

| Endpoint | Purpose |
|---|---|
| `GET /api/v1/admin/dashboard/bd-analytics/analytics/sales?period=DAILY\|MONTHLY\|YEARLY&from=&to=` | Full sales analysis with continuous buckets + range totals |
| `GET .../analytics/summary` | Now **exposes** `salesByDay` (last ~90 snapshot days) + `brandsOwned` |
| `POST .../analytics/snapshots/:date` | Refresh day snapshot including `totalCollectedMmk` |

Each analysis bucket / totals includes: `totalOrders`, `totalCustomersSold`, `totalQtySold`, `totalSalesMmk`, `totalCollectedMmk`, `saleOkOrders`, `saleOkSalesMmk`.

---

## Purchases / raw inbound (added 2026-07-20)

| Endpoint | Purpose |
|---|---|
| `POST /api/v1/admin/dashboard/purchases` | Create ORDERED PO; optional `receiveImmediately=true` to stock raw now |
| `POST .../purchases/:id/receive` | Partial/full receive → RAW_MATERIAL inventory ↑ |
| `GET .../purchases` / `GET .../purchases/:id` | List / detail |
| `POST .../purchases/:id/cancel` | Cancel if nothing received yet |

Permission: `MANAGE_INVENTORY`.

---

## Full-table seed + integrity / edge (2026-07-20)

| Artifact | Role |
|---|---|
| `prisma/seed.ts` + `prisma/seed/phase-*.ts` | Destructive full-model seed (54 tables) |
| `docs/seed.md` | Seed graph, codes, inventory math |
| `test/process/data-integrity.process.e2e-spec.ts` | Coverage, FKs, XOR inventory, SALE_OK arithmetic, auth graph |
| `test/process/edge-cases.process.e2e-spec.ts` | E1–E9 (multi-invoice pay, no primary loc, dup PO lines, confirm reserve, concurrent receive, dup invoice, overpay, outbound qty, invoice on DRAFT) |

Hardening with edge suite: single active invoice per order; reject over-allocation; outbound qty ≤ order qty; no invoice on DRAFT/HOLD.

---

## Collection reminder live alarms (2026-07-20)

| Piece | Role |
|---|---|
| Cron (`EVERY_MINUTE`) | Claims `SCHEDULED` reminders with `scheduledFor <= now` → `NOTIFIED` |
| Pusher | Event `collection-reminder.due` on `collection-reminders` (+ `user-{assigneeId}`) |
| Brevo / SMSPoh | Email + SMS to assignee when contact exists (soft no-op if env missing) |
| `POST .../billing/collection-reminders/dispatch-due` | Manual/ops trigger |

Env: `PUSHER_*`, optional `COLLECTION_REMINDER_DISPATCH_ENABLED=false` to pause cron.

---

## Hanafi zakat calculator + tracker (2026-07-23)

| Artifact | Role |
|---|---|
| `docs/zakat-hanafi.md` | Fiqh buckets, APIs, M1–M5 worksheet, completeness codes |
| `POST .../bd-analytics/zakat/hanafi/calculate` | Gold/silver nisab estimate |
| `.../zakat/payments` | MONTH / YEAR / CUSTOM payment tracker |
| Domain calculator + period resolver | Pure math (unit Z/P) |
| `npm run test:zakat` | Unit zakat + process tracker + M1–M5 manual verify |
| `PurchaseOrder.amountPaidMmk` + payables APIs | Supplier paid / amount left; zakat auto-deducts unpaid PO balance |
| `GET .../purchases/suppliers/:id/payables` | Per-supplier AP summary |
| `POST .../purchases/:id/payments` | Record supplier payment on a PO |

**Run stamp:** 2026-07-23 — unit zakat **18/18**; process zakat-hanafi **9/9** (tracker + M1–M5). Re-seed after manual-verify.

Loans / non-PO liabilities stay manual via calculate `payablesMmk` (`MANUAL_OTHER_LIABILITIES`).
