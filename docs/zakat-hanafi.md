# Hanafi business zakat (estimate helper)

This is an **ops estimate**, not a fatwa. Consult a local scholar for edge cases.

## What is zakatable (Hanafi trade wealth)

| Bucket | Source |
|---|---|
| Cash / bank | Manual on calculate request |
| Receivables | Open invoices (`balanceDueMmk`), excluding DRAFT / CANCELLED / WRITTEN_OFF |
| Finished goods | Inventory qty × city sell price (else latest invoice line) |
| Raw materials | Inventory qty × last PO / supplier cost |
| Payables | Manual deduction |

**Excluded:** physical assets (vehicles, machines, …) — shown as `excludedPhysicalAssetsMmk` only.

**Rate:** 2.5% when `haulCompleted` and net ≥ nisab.

**Nisab styles:** `GOLD` = 85 g × gold/g; `SILVER` = 595 g × silver/g.

## APIs (`MANAGE_BD`)

- `POST /api/v1/admin/dashboard/bd-analytics/zakat/hanafi/calculate`
- `POST /api/v1/admin/dashboard/bd-analytics/zakat/payments` — MONTH / YEAR / CUSTOM
- `GET .../zakat/payments` — list
- `GET .../zakat/payments/coverage` — overlap sum
- `DELETE .../zakat/payments/:id` — soft-delete

Tracker periods are **Gregorian** (ops ledger). Classical haul is lunar — see consideration `GREGORIAN_TRACKER_NOT_LUNAR_HAUL`.

## Completeness codes (`considerations[]`)

Always returned on calculate:

- `MANUAL_CASH`, `MANUAL_PAYABLES`, `NO_AP_LEDGER`
- `NO_DOUBTFUL_DEBT_FILTER`, `NO_WIP_VALUATION`, `NO_CONSIGNMENT_FLAG`
- `GREGORIAN_TRACKER_NOT_LUNAR_HAUL`, `BUSINESS_ONLY_NOT_PERSONAL`

## M1–M5 worksheet (manual-vs-system)

Locked arrange (`test/process/zakat-manual-worksheet.ts`):

- FG 100 × 1,000 = 100,000
- Raw 50 × 200 = 10,000
- AR = 50,000
- Excluded book value = 5,000,000 (not in net)
- Silver/g = 1,000 → nisab 595,000
- Gold/g = 100,000 → nisab 8,500,000

Base trade wealth = 160,000.

| ID | Style | Cash | Bank | Payables | Haul | Expected |
|---|---|---|---|---|---|---|
| M1 | SILVER | 500,000 | 0 | 0 | yes | net 660,000 ≥ nisab → due 16,500 |
| M2 | GOLD | 500,000 | 0 | 0 | yes | net 660,000 &lt; 8.5M → due 0 |
| M3 | GOLD | 10,000,000 | 2,000,000 | 100,000 | yes | net 12,060,000 → due 301,500; assets excluded |
| M4 | SILVER | 10,000,000 | 0 | 0 | no | due 0 (haul) |
| M5 | SILVER | 400,000 | 0 | 200,000 | yes | net 360,000 &lt; 595k → due 0 |

Hand formula:

```
nisab = grams * pricePerGram
net = cash + bank + AR + FG + raw - payables   (floor 0)
due = haul && net >= nisab ? round2(net * 0.025) : 0
```

Run: `npm run test:zakat` then `npm run db:seed` (manual-verify mutates stock/AR).
