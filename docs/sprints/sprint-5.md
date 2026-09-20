# Sprint 5 — Reconciliation, Reports & User Management

> Status: ⬜ Planned  
> Depends on: Sprint 4 Classification & Reorder Intelligence ✅ Complete

## Goal

Resolve unexplained inventory shrinkage and complete operational oversight:
allow Warehouse Staff to submit physical cycle counts at the moment discrepancies
are found, allow Admin to review variances and reconcile stock via the append-only
ledger (`ADJUSTMENT` transactions), provide Admin variance and turnover reports,
and add Admin user management.

Catalog pricing and monetary ABC are documented on the product roadmap and deferred
to the post-Sprint 5 backlog.

Implements PRD FR-16, FR-18, FR-19 and SPEC FR-30, FR-36, FR-38.

## Resolved open questions

### OQ-3 — Cycle-count submit-vs-view split & reconciliation (SPEC FR-30, FR-36) — RESOLVED

- **Submission:** Warehouse Staff submits physical counts (`POST /api/cycle-counts`).
  Admin passes via superuser bypass. Purchasing Manager gets 403 Forbidden.
- **Viewing counts:** Warehouse Staff can view their own submitted counts. Admin
  can view all counts and filter by status or discrepancy. Purchasing Manager gets 403.
- **Separation of duties:** Submitting a count never mutates stock directly. Counts
  start with status `pending`.
- **Reconciliation action:** Admin only (`POST /api/cycle-counts/{id}/reconcile`).
  Creates an append-only `ADJUSTMENT` transaction with `qty_delta = counted_qty - snapshot_on_hand`
  via `InventoryTransactionService::applySideEffect()`, which atomically updates
  `inventory_snapshots` under row-level lock. Marks status `reconciled` and records
  `reconciliation_txn_id`.
- **Dismissal:** Admin can dismiss a false alarm (`POST /api/cycle-counts/{id}/dismiss`)
  with notes, marking status `dismissed` without modifying stock.

### Variance & alert threshold

- `expected_qty`: snapshot `qty_on_hand` at the time of count.
- `variance_qty = counted_qty - expected_qty`.
- `variance_pct = expected_qty > 0 ? (abs(variance_qty) / expected_qty) * 100 : (counted_qty > 0 ? 100.0 : 0.0)`.
- `is_flagged = variance_pct > config('inventory.variance_alert_threshold_percentage')` (default 5.0%).

### Inventory turnover report (FR-18)

- Evaluated in **unit volume** over a trailing window (default 90 days, `TURNOVER_WINDOW_DAYS`).
- `outflow_units`: sum of absolute `qty_delta` for `SALE` and `PICK` per category.
- `avg_on_hand`: average `qty_on_hand` across category SKUs in snapshots.
- `turnover_ratio = avg_on_hand > 0 ? round(outflow_units / avg_on_hand, 2) : 0.0`.
- Categorized into velocity tiers: High (≥ 3.0), Medium (1.0–2.99), Low (< 1.0),
  Dead Stock (0.0).

### User management (FR-19, FR-38)

- Admin-only CRUD (`/api/users`).
- Cannot deactivate or delete own active account.
- Lifecycle writes trigger `AuditObserver` -> `AuditLogService` generating
  `CREATE_USER`, `UPDATE_USER`, and `DEACTIVATE_USER` records.

## Scope checklist

| Item | Status |
| --- | --- |
| `cycle_counts` schema (UUID PK, FKs, snapshot comparison, status, PG checks) | ✅ Done |
| `CycleCount` model, relationships, non-standard PK handling | ✅ Done |
| Cycle count submission endpoint (Warehouse Staff + Admin; PM 403) | ✅ Done |
| Cycle count list & detail endpoints (WS own counts, Admin all counts) | ✅ Done |
| Reconciliation endpoint (`POST /api/cycle-counts/{id}/reconcile`, Admin only) | ✅ Done |
| Dismissal endpoint (`POST /api/cycle-counts/{id}/dismiss`, Admin only) | ✅ Done |
| Variance report endpoint (`GET /api/reports/variance`, Admin only) | ✅ Done |
| Turnover report endpoint (`GET /api/reports/turnover`, Admin only) | ✅ Done |
| User management endpoints (Admin only CRUD + deactivation) | ✅ Done |
| Config keys: `variance_alert_threshold_percentage` and `turnover_window_days` | ✅ Done |
| Demo cycle count seeder (thermostat shrinkage case: 45 recorded vs 12 physical) | ✅ Done |
| Frontend: Warehouse cycle count submission form/modal | ⬜ Not started |
| Frontend: Admin reconciliation review queue (reconcile / dismiss) | ⬜ Not started |
| Frontend: Admin variance and turnover report screens | ⬜ Not started |
| Frontend: Admin user management screen | ⬜ Not started |
| RBAC + reconciliation + math + edge-case tests | ✅ Done |

> Backend implemented and verified on real PostgreSQL 17 (full suite: 140 tests /
> 556 assertions pass, including the 3 PostgreSQL-specific constraint/concurrency
> tests). Frontend items remain for a follow-up. See `docs/ai/decisions.md`
> (Sprint 5) for implementation notes and two PostgreSQL-only bug fixes.

## API contracts (written before implementation per SPEC §4 process rule)

```
# Cycle Counts
POST   /api/cycle-counts                         role: warehouse_staff, admin   (PM: 403)
GET    /api/cycle-counts                         role: warehouse_staff, admin   (PM: 403)
GET    /api/cycle-counts/{cycle_count}           role: warehouse_staff, admin   (PM: 403)
POST   /api/cycle-counts/{cycle_count}/reconcile role: admin only              (WS: 403, PM: 403)
POST   /api/cycle-counts/{cycle_count}/dismiss   role: admin only              (WS: 403, PM: 403)

  CycleCount JSON:
  {
    "id": uuid,
    "sku_id": uuid,
    "lot_id": uuid|null,
    "product": <ProductResource>?,
    "counted_by": int,
    "counter_name": string,
    "expected_qty": int,
    "counted_qty": int,
    "variance_qty": int,
    "variance_pct": number,
    "is_flagged": bool,
    "status": "pending"|"reconciled"|"dismissed",
    "notes": string|null,
    "reconciled_by": int|null,
    "reconciled_at": iso8601|null,
    "reconciliation_txn_id": uuid|null,
    "counted_at": iso8601
  }

  POST /api/cycle-counts request:
  {
    "sku_id": uuid,
    "lot_id"?: uuid|null,
    "counted_qty": int>=0,
    "notes"?: string|null
  }

  POST /api/cycle-counts/{id}/reconcile request:
  {
    "notes"?: string|null
  }

# Reports
GET    /api/reports/variance?flagged_only=bool&category_id=uuid   role: admin only
  {
    "data": [
      {
        "sku_id": uuid,
        "product_name": string,
        "category_name": string,
        "current_qty_on_hand": int,
        "total_counts": int,
        "net_variance_qty": int,
        "flagged_discrepancy_count": int,
        "last_counted_at": iso8601|null
      }
    ],
    "meta": {
      "threshold_percentage": number,
      "total_audited_skus": int,
      "total_discrepancies": int,
      "net_shrinkage_units": int
    }
  }

GET    /api/reports/turnover?window_days=90                      role: admin only
  {
    "data": [
      {
        "category_id": uuid,
        "category_name": string,
        "product_count": int,
        "outflow_units": int,
        "avg_on_hand": number,
        "turnover_ratio": number,
        "velocity_tier": "High"|"Medium"|"Low"|"Dead Stock"
      }
    ],
    "meta": {
      "window_days": int,
      "generated_at": iso8601
    }
  }

# User Management
GET    /api/users                               role: admin only
POST   /api/users                               role: admin only
GET    /api/users/{user}                        role: admin only
PUT    /api/users/{user}                        role: admin only
DELETE /api/users/{user}                        role: admin only

  User JSON:
  {
    "id": int,
    "name": string,
    "email": string,
    "role": "admin"|"purchasing_manager"|"warehouse_staff",
    "is_active": bool,
    "created_at": iso8601
  }
```

## Traceable tasks

| Task ID | Component | Description | Est. | Traces to |
| --- | --- | --- | --- | --- |
| **SETUP-5.1** | Schema | `cycle_counts` table migration with indexes, foreign keys, and checks | M | FR-30, FR-36 |
| **SETUP-5.2** | Config | `variance_alert_threshold_percentage` and `turnover_window_days` config keys | S | FR-30, FR-18 |
| **FR-30.1** | Model | `CycleCount` Eloquent model with UUID PK, relationships, and status scopes | S | FR-30 |
| **FR-30.2** | Validation | `StoreCycleCountRequest` (validates `sku_id`, `lot_id`, `counted_qty`) | S | FR-30, FR-36 |
| **FR-30.3** | Service | `CycleCountService::recordCount` comparing against snapshot `qty_on_hand` | M | FR-30 |
| **FR-30.4** | Controller | `CycleCountController` (`store`, `index`, `show`) and `CycleCountResource` | M | FR-30, FR-36 |
| **FR-30.5** | Policy | `CycleCountPolicy`: WS can create and view own counts; Admin superuser | S | FR-36 |
| **FR-30.6** | Service | `CycleCountService::reconcile` creating atomic `ADJUSTMENT` transaction | M | FR-30 |
| **FR-30.7** | Controller | `reconcile` and `dismiss` endpoints on `CycleCountController` (Admin only) | S | FR-30, FR-36 |
| **FR-18.1** | Service | `ReportService::getVarianceReport` aggregating discrepancies and net variance | M | FR-18, FR-30 |
| **FR-18.2** | Service | `ReportService::getTurnoverReport` calculating volume outflow and turnover ratio | M | FR-18 |
| **FR-18.3** | Controller | `ReportController` (`variance`, `turnover`) behind `role:admin` | S | FR-18 |
| **FR-38.1** | Validation | `StoreUserRequest` and `UpdateUserRequest` with email unique rules and roles | S | FR-19, FR-38 |
| **FR-38.2** | Controller | `UserController` (CRUD + deactivation, self-deactivation guard) and `UserPolicy` | M | FR-19, FR-38 |
| **FE-5.1** | API Client | API functions in `resources/js/lib/inventory-api.ts` for counts, reports, users | S | FR-30, FR-18, FR-38 |
| **FE-5.2** | UI (WS) | Cycle count submission modal / form on warehouse stock view | M | FR-30 |
| **FE-5.3** | UI (Admin) | Admin variance and shrinkage report screen with threshold flags | M | FR-18, FR-30 |
| **FE-5.4** | UI (Admin) | Admin inventory turnover report screen with velocity tiers | M | FR-18 |
| **FE-5.5** | UI (Admin) | Admin reconciliation queue (one-click reconcile / dismiss) | M | FR-30 |
| **FE-5.6** | UI (Admin) | Admin user management screen (list, add, edit role, deactivate) | M | FR-38 |
| **FE-5.7** | Navigation | Update `DashboardLayout.tsx` and `App.tsx` routes with role guards | S | FR-30, FR-38 |
| **SEED-5.1** | Seeder | `CycleCountSeeder` with realistic demo discrepancy data (thermostat case) | S | PRD §1 |
| **TEST-5.1** | Tests | Cycle count submission, variance math, threshold flag, and RBAC tests | M | FR-30, FR-36 |
| **TEST-5.2** | Tests | Admin reconciliation creating `ADJUSTMENT` transaction and updating snapshot | M | FR-30 |
| **TEST-5.3** | Tests | Variance and turnover reports calculations and Admin-only RBAC tests | M | FR-18 |
| **TEST-5.4** | Tests | User management CRUD, self-deactivation guard, and audit observer tests | M | FR-38, FR-31 |

## Acceptance criteria

1. Warehouse Staff and Admin can submit cycle counts (`POST /api/cycle-counts`);
   Purchasing Manager receives 403; guests receive 401.
2. Cycle count captures `expected_qty` from `inventory_snapshots.qty_on_hand`
   at submission time and computes `variance_qty` and `variance_pct`.
3. Discrepancies with `variance_pct > 5.0%` are automatically flagged (`is_flagged: true`).
4. Cycle count submission does not alter `inventory_snapshots` or `inventory_transactions`.
5. Admin reconciliation (`POST /api/cycle-counts/{id}/reconcile`) creates an `ADJUSTMENT`
   transaction with `qty_delta = counted_qty - snapshot_on_hand`, updates the snapshot
   under row-level lock, and sets status to `reconciled`.
6. Non-admin users receive 403 on reconcile, dismiss, variance report, turnover report,
   and user management routes.
7. Variance report aggregates discrepancy metrics across SKUs and categories; turnover
   report calculates unit-volume turnover ratios without price dependencies.
8. Admin can create, update, and deactivate users; Admins cannot deactivate their own
   account; user writes generate audit log entries.
9. Existing Sprint 1–4 behavior remains green.

## Non-goals

- Product catalog pricing, valuation, and monetary ABC (deferred to post-Sprint 5 backlog).
- Barcode scanner hardware integration.
- Purchase order lifecycle beyond reorder alerts.
- Valuation or COGS modeling during Sprint 5 (strict non-goal).
- Automatic recurring cycle-count cron schedules (counts are staff-initiated).

## Technical constraints

- Business logic in Services (`CycleCountService`, `ReportService`); validation and authorization in FormRequests and Policies.
- `cycle_counts.id` is UUID PK (`use HasUuids`); foreign keys to `products.sku_id` and `users.id`.
- Reconciliation adjustments must call `InventoryTransactionService::applySideEffect()` inside a DB transaction with row-level locking.
- PostgreSQL check constraints driver-guarded for SQLite memory test compatibility.
