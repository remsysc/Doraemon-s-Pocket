# Sprint 4 — Classification & Reorder Intelligence

> Status: ✅ Complete
> Depends on: Sprint 3 Inventory Snapshots & Concurrency ✅ complete

## Goal

Replace panic-ordering with mathematically derived reorder intelligence:
per-SKU reorder configuration, Reorder Point (ROP) with statistical safety
stock, Economic Order Quantity (EOQ) for non-seasonal items, a seasonal
reorder trigger for seasonal items, ABC/XYZ classification, and
purchasing-facing reorder and expiry alerts — all governed by the RBAC
matrix (Purchasing Manager + Admin write/read; Warehouse Staff has no
access to reorder/EOQ/alert surfaces).

Implements PRD FR-10–FR-15 and SPEC FR-25, FR-26, FR-27, FR-28, FR-29,
FR-32, FR-35.

## Resolved open questions

### OQ-6 — EOQ cost inputs (SPEC FR-29) — RESOLVED 2026-09-11

EOQ needs `order_cost` and `holding_cost_per_unit`, but pricing/valuation
is a hard non-goal (PRD §3, SPEC FR-14). Resolution: model both as
**nullable, non-price operational cost fields on `reorder_configs`** — the
purchasing-owned table — never on `Product`. They represent purchasing
operations economics (cost to place an order; cost to hold one unit per
year), are explicitly not unit price, COGS, or valuation, and never appear
on the Product master. This is option (b) from FR-29's open question.

EOQ is computed **only when both fields are present and positive**;
otherwise the API returns `eoq: null` for that SKU. This keeps EOQ optional
and demo-friendly without inventing a pricing model.

### Demand & lead-time statistics

- **Demand basis:** outflow quantity from `inventory_transactions`, summing
  the absolute value of `SALE` and `PICK` `qty_delta` per SKU over a
  trailing window (default 90 days, `REORDER_DEMAND_WINDOW_DAYS`).
- `avg_daily_demand = total_outflow / window_days`.
- `annual_demand = avg_daily_demand × 365`.
- **Demand variance:** variance of daily outflow across the window.
- **Lead-time variance:** not tracked historically (single-supplier demo
  assumption), so `lead_time_variance = 0`. Safety stock therefore reduces
  to `Z × sqrt(lead_time_days × demand_variance)` — the FR-27 formula with
  the lead-time-variance term zeroed. Documented as a modeling assumption.

### Seasonal trigger (FR-28)

Seasonal SKUs (`is_seasonal = true`) compute their reorder trigger from the
same-period-last-year demand (a seasonal index over the trailing window),
shifted earlier by `lead_time_days`, rather than a flat trailing average.
With only recent demo history the index falls back to the trailing average
and the response flags `seasonal_basis: "insufficient_history"`; the field
contract is stable so richer history improves the number without an API
change.

### Classification (FR-15)

- **ABC** by cumulative demand volume (Pareto): A ≤ 80%, B ≤ 95%, C the
  remainder. Volume, not value, because pricing is out of scope.
- **XYZ** by coefficient of variation (CV = stddev/mean) of daily demand:
  X < 0.5 (stable), Y < 1.0 (variable), Z ≥ 1.0 (erratic). Zero-demand SKUs
  are `Z`.
- Classifications are **derived on read** (no persisted table); a recompute
  endpoint exists for parity with the roadmap but returns the same live
  computation.

## Scope checklist

| Item | Status |
| --- | --- |
| `reorder_configs` schema (ROP/safety_stock/lead_time_days + operational costs + Z) | ✅ Implemented |
| `ReorderConfig` model, relationships, non-standard PK handling | ✅ Implemented |
| Reorder config CRUD endpoints (PM + admin write; WS no access) | ✅ Implemented |
| `ReorderService`: ROP, statistical safety stock, EOQ (non-seasonal), seasonal trigger | ✅ Implemented |
| `ClassificationService`: ABC by volume, XYZ by CV | ✅ Implemented |
| Reorder alert endpoint (available ≤ ROP), PM + admin only | ✅ Implemented |
| Expiry alert endpoint (lot expiry ≤ window, qty_on_hand > 0), PM + admin only | ✅ Implemented |
| Classification read + recompute endpoints | ✅ Implemented |
| Demo reorder-config seed data | ✅ Implemented |
| Frontend purchasing dashboard (alerts + reorder configs + classifications) | ✅ Implemented |
| RBAC + math + edge-case tests | ✅ Implemented |

## API contracts (written before implementation per SPEC §4 process rule)

```
GET    /api/reorder-configs                 role: purchasing_manager, admin   (WS: 403)
POST   /api/reorder-configs                 role: purchasing_manager, admin
GET    /api/reorder-configs/{product}       role: purchasing_manager, admin
PUT    /api/reorder-configs/{product}       role: purchasing_manager, admin
DELETE /api/reorder-configs/{product}       role: purchasing_manager, admin

  ReorderConfig JSON:
  {
    "sku_id": uuid,
    "reorder_point": int|null,        // null => derived ROP is authoritative
    "safety_stock": int|null,         // null => derived safety stock is used
    "lead_time_days": int,
    "order_cost": number|null,        // operational, non-price
    "holding_cost_per_unit": number|null,
    "service_level_z": number,        // default 1.65
    "product": <ProductResource>?,    // when included
    "updated_at": iso8601
  }

  POST/PUT request:
  {
    "sku_id": uuid,                   // POST only; PUT binds via {product}
    "reorder_point"?: int>=0|null,
    "safety_stock"?: int>=0|null,
    "lead_time_days": int>=0,
    "order_cost"?: number>=0|null,
    "holding_cost_per_unit"?: number>0|null,
    "service_level_z"?: number>0
  }

GET /api/reorder-configs/{product}/metrics  role: purchasing_manager, admin
  {
    "sku_id": uuid,
    "avg_daily_demand": number,
    "annual_demand": number,
    "demand_variance": number,
    "lead_time_days": int,
    "safety_stock": int,              // derived (statistical) or config override
    "reorder_point": int,             // derived ROP or config override
    "eoq": number|null,               // null when cost inputs missing/invalid
    "seasonal": bool,
    "seasonal_basis": "last_year"|"insufficient_history"|null,
    "window_days": int
  }

GET  /api/inventory-classifications         role: any authenticated
  { "data": [ { "sku_id", "product": {...}, "abc": "A"|"B"|"C",
               "xyz": "X"|"Y"|"Z", "annual_demand", "cv" } ], "meta": {...} }
POST /api/inventory-classifications/recompute  role: admin, purchasing_manager
  -> same payload as GET (live recomputation; no persisted state)

GET  /api/alerts/reorder                    role: purchasing_manager, admin  (WS: 403)
  { "data": [ { "sku_id", "product", "qty_available", "reorder_point",
               "suggested_order_qty" (eoq or null), "seasonal" } ] }
GET  /api/alerts/expiry?days=30             role: purchasing_manager, admin  (WS: 403)
  { "data": [ { "lot_id", "sku_id", "product", "expiry_date",
               "days_to_expiry", "qty_on_hand" } ] }
```

## Acceptance criteria

1. Purchasing Manager and Admin can CRUD `reorder_configs`; Warehouse Staff
   receives 403 on every reorder-config, alert, and classification-recompute
   route; guests receive 401.
2. ROP = `(avg_daily_demand × lead_time_days) + safety_stock`, with safety
   stock = `Z × sqrt(lead_time_days × demand_variance)` (lead-time variance
   zeroed), verifiable against a known fixture.
3. EOQ = `sqrt((2 × annual_demand × order_cost) / holding_cost_per_unit)`
   for non-seasonal SKUs when both cost inputs are present and positive;
   `null` otherwise.
4. Seasonal SKUs report `seasonal: true` and a seasonal basis flag.
5. ABC/XYZ classification is derived from ledger demand and returns a stable
   shape for all catalog SKUs.
6. The reorder alert lists SKUs whose `qty_available ≤ reorder_point`; the
   expiry alert lists lots expiring within the window with `qty_on_hand > 0`.
7. No price/cost/valuation field is added to `Product` (FR-14 preserved).
8. Existing Sprint 1–3 behavior remains green.

## Non-goals

- Purchase-order lifecycle beyond surfacing a reorder alert (PRD §3).
- Cycle counts, variance reports, turnover reports — Sprint 5.
- Persisted classification history or alert history storage.
- Any pricing/valuation model; operational cost inputs are not unit price.

## Technical constraints

- Business logic in Services; validation/authorization in FormRequests and
  Policies; list endpoints use Spatie QueryBuilder + pagination.
- `reorder_configs.sku_id` is a non-standard UUID PK/FK — explicit
  `$primaryKey` on the model; cascade delete with the Product.
- Demand statistics read the append-only ledger; no new writable stock path.
- PostgreSQL is the target DB; keep any raw constraints driver-guarded.
