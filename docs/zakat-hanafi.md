# Hanafi business zakat (estimate helper)

This is an **ops estimate**, not a fatwa. Consult a local scholar for edge cases.

## What is zakatable (Hanafi trade wealth)

| Bucket | Source |
|---|---|
| Cash / bank | Manual, **or** `useCashLedgerBalances` from ledger **TOTAL** (business auto + manual) |
| Cash ledger views | `view=BUSINESS` (sales/PO only), `MANUAL` (custom only), `TOTAL` (both) |
| Receivables | Open invoices with `recoverability=LIKELY` (`balanceDueMmk`); excludes DRAFT / CANCELLED / WRITTEN_OFF and DOUBTFUL / HOPELESS |
| Doubtful / hopeless AR | Auto-excluded; shown as `excludedDoubtfulReceivablesMmk`. Set via `PATCH .../billing/invoices/:id/recoverability` |
| Finished goods | Inventory qty × city sell price (else latest invoice line) |
| Raw materials | Inventory qty × last PO / supplier cost |
| **Supplier payables (AP)** | **Auto:** sum of PO `totalAmountMmk − amountPaidMmk` (excludes DRAFT / CANCELLED) |
| Other liabilities (loans…) | Manual `payablesMmk` on calculate (added on top of supplier AP) |

**Excluded:** physical assets (vehicles, machines, …) — shown as `excludedPhysicalAssetsMmk` only.

**Rate:** 2.5% when `haulCompleted` and net ≥ nisab.

**Nisab styles:** `GOLD` = 85 g × gold/g; `SILVER` = 595 g × silver/g.

### Supplier AP (section 4 closed for POs)

- `GET .../purchases/suppliers/:supplierId/payables` — paid / amount left / per-PO payment status  
- `POST .../purchases/:id/payments` — record payment to supplier (`amountPaidMmk` ↑)  
- Zakat response fields: `supplierPayablesMmk`, `otherPayablesMmk`, `payablesMmk` (= sum)

Loans / non-PO debts are still manual (`MANUAL_OTHER_LIABILITIES`).

## APIs (`MANAGE_BD` for zakat; `MANAGE_INVENTORY` for purchases)

**Yearly only** (Gregorian calendar year) — not daily/monthly.

- `POST .../bd-analytics/cash-ledger` — manual capital / personal / home / misc
- `GET .../cash-ledger?view=BUSINESS|MANUAL|TOTAL&date=` — daily book by slice
- `GET .../cash-ledger/balances?view=BUSINESS|MANUAL|TOTAL` — nets by slice
- Auto BUSINESS posts: invoice payment → INFLOW; PO payment → OUTFLOW
- `DELETE .../cash-ledger/:id`
- `POST .../zakat/hanafi/calculate` — optional `useCashLedgerBalances` (TOTAL view)
- `POST .../zakat/payments` — `periodType: YEAR` + `year` required
- `GET .../zakat/payments` — list (optional `year` / date range)
- `GET .../zakat/payments/coverage?periodType=YEAR&year=` — year coverage sum
- `DELETE .../zakat/payments/:id` — soft-delete

Tracker periods are **Gregorian year** (ops ledger). Classical haul is lunar — see consideration `GREGORIAN_TRACKER_NOT_LUNAR_HAUL`.

## Completeness codes (`considerations[]`)

- `MANUAL_CASH`, `CASH_LEDGER_CUSTOM_ONLY` — manual slice still needed for capital/personal; business slice auto-posts going forward
- `MANUAL_OTHER_LIABILITIES`
- `RECEIVABLES_RECOVERABILITY_FLAG` — staff marks invoices LIKELY / DOUBTFUL / HOPELESS; only LIKELY enters net
- `GREGORIAN_TRACKER_NOT_LUNAR_HAUL`
- `SUPPLIER_AP_AUTO` — supplier PO unpaid balances are deducted automatically
- `NO_WIP_VALUATION`, `NO_CONSIGNMENT_FLAG`, `BUSINESS_ONLY_NOT_PERSONAL`

## M1–M5 worksheet (manual-vs-system)

Locked arrange (`test/process/zakat-manual-worksheet.ts`):

- FG 100 × 1,000 = 100,000
- Raw 50 × 200 = 10,000
- AR = 50,000
- Excluded book value = 5,000,000 (not in net)
- Silver/g = 1,000 → nisab 595,000
- Gold/g = 100,000 → nisab 8,500,000

Base trade wealth = 160,000. Arrange clears open PO balances (`amountPaidMmk = total`) so supplier AP does not shift the worksheet.

| ID | Style | Cash | Bank | Payables (manual) | Haul | Expected (no extra AP) |
|---|---|---|---|---|---|---|
| M1 | SILVER | 500,000 | 0 | 0 | yes | net 660,000 → due 16,500 |
| M2 | GOLD | 500,000 | 0 | 0 | yes | below gold nisab → due 0 |
| M3 | GOLD | 10,000,000 | 2,000,000 | 100,000 | yes | due on net after payables |
| M4 | SILVER | 10,000,000 | 0 | 0 | no | due 0 (haul) |
| M5 | SILVER | 400,000 | 0 | 200,000 | yes | may be below nisab |

Hand formula:

```
nisab = grams * pricePerGram
supplierAP = sum(PO.total - PO.paid)  // auto
payables = supplierAP + manualOther
net = cash + bank + AR + FG + raw - payables   (floor 0)
due = haul && net >= nisab ? round2(net * 0.025) : 0
```

Run: `npm run test:zakat` then `npm run db:seed` (manual-verify mutates stock/AR).

## Cash ledger loopholes (known / accepted)

| Risk | Behavior today | Ops / test |
|---|---|---|
| Pre-go-live invoice/PO payments | Not backfilled into ledger | Only new payments auto-post |
| Staff double-post | MANUAL OTHER can duplicate BUSINESS collection/PO pay → TOTAL overstates | Never manual-post shop collections or PO pays (CL8 documents) |
| `useCashLedgerBalances` + `cashOnHandMmk: 0` | Explicit **0 wins** over ledger | Omit cash/bank fields when using ledger (CL10) |
| Pocket overdraft | Net floored at 0; outflows still counted | Do not read 0 as “balanced” (CL6) |
| `PaymentMethod.OTHER` | Always mapped to BANK | Prefer COD vs BANK_TRANSFER |
| Soft-delete BUSINESS row | Allowed; removed from balances | Prefer correcting via new payments |
| No CASH↔BANK transfer / wages auto | Missing unless MANUAL | Enter as MANUAL pairs / BUSINESS_EXPENSE |
| Unpaid invoice | In AR only, not ledger | Correct (CL11) |

**Views:** `BUSINESS` = auto sales/PO only; `MANUAL` = custom only; `TOTAL` = both. Do **not** sum `cashOnHand` across views — recompute from rows (unit worksheet F).

Process suite: `npm run test:cash-ledger` (CL1–CL12).
