# Sprint Status — Doraemon's Pocket

> This is the canonical status overview for Sprints 1–6. Sprint 1 is done with documentation follow-ups; Sprints 2–5 are complete; Sprint 6's main scope is implemented with follow-ups still open. Per-sprint files preserve detailed implementation notes and contracts; use this document for overall status.

| Sprint | Scope                                     | Status                                                                                           | Detailed record              |
| ------ | ----------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------- |
| 1      | Foundation & Auth                         | 🟡 Done with documentation follow-ups                                                            | [`sprint-1.md`](sprint-1.md) |
| 2      | Core Ledger                               | ✅ Complete                                                                                      | [`sprint-2.md`](sprint-2.md) |
| 3      | Inventory Snapshots & Concurrency         | ✅ Complete                                                                                      | [`sprint-3.md`](sprint-3.md) |
| 4      | Classification & Reorder Intelligence     | ✅ Complete                                                                                      | [`sprint-4.md`](sprint-4.md) |
| 5      | Reconciliation, Reports & User Management | ✅ Complete                                                                                      | [`sprint-5.md`](sprint-5.md) |
| 6      | Hardening, Data Management & Demo         | ⚠️ Main scope implemented; PO-trends chart, demo-seed fidelity, and deployment follow-ups remain | [`sprint-6.md`](sprint-6.md) |

---

## Sprint 1 — Foundation & Auth

> Status: 🟡 Done with documentation follow-ups. Detailed record: [`sprint-1.md`](sprint-1.md).

- Laravel API and React/TypeScript SPA foundation.
- Sanctum cookie-session authentication, login/logout, CSRF flow, and protected frontend routes.
- Role-based authorization foundation for Admin, Purchasing Manager, and Warehouse Staff.

## Sprint 2 — Core Ledger

> Status: ✅ Complete. Detailed record: [`sprint-2.md`](sprint-2.md).

- Category, Product, and Lot schema/API/UI plus append-only inventory transaction writes and Admin audit-log reads.
- All six transaction types and server-side actor attribution are implemented.
- Sprint 3 added atomic snapshot side effects; the current seed contains 26 ledger rows, not the original Sprint 2 count of 24.

## Sprint 3 — Inventory Snapshots & Concurrency

> Detailed plan: [`sprint-3.md`](sprint-3.md) | Status: ✅ Complete

| Item                                                                | Owner | Status                             |
| ------------------------------------------------------------------- | ----- | ---------------------------------- |
| INVENTORY_SNAPSHOT table (qty_on_hand, qty_reserved, qty_available) | Rem   | ✅ done                            |
| Row-level locking on snapshot update path (lockForUpdate)           | Rem   | ✅ done                            |
| Reservation workflow (RESERVE / release)                            | Rem   | ✅ done                            |
| Concurrency stress tests (oversell prevention)                      | Rem   | ✅ done — PostgreSQL row-lock test |
| Frontend: stock overview / real-time on-hand display                | Rem   | ✅ done                            |

---

## Sprint 4 — Classification & Reorder Intelligence

> Detailed plan: [`sprint-4.md`](sprint-4.md) | Status: ✅ Complete

| Item                                                              | Owner | Status                                         |
| ----------------------------------------------------------------- | ----- | ---------------------------------------------- |
| ABC/XYZ classification engine                                     | Rem   | ✅ done — volume Pareto + CV                   |
| REORDER_CONFIG table + endpoints (PM + admin write; WS no access) | Rem   | ✅ done                                        |
| ROP computation (avg demand × lead time + safety stock)           | Rem   | ✅ done                                        |
| EOQ computation (non-seasonal items) — OQ-6 resolved              | Rem   | ✅ done — operational costs on reorder_configs |
| Seasonal reorder trigger (is_seasonal items, seasonal index)      | Rem   | ✅ done — flag + basis baseline                |
| Expiry alert endpoint (PM + admin only)                           | Rem   | ✅ done                                        |
| Reorder alert endpoint (PM + admin only)                          | Rem   | ✅ done                                        |
| Frontend: purchasing dashboard (alerts + stock overview)          | Rem   | ✅ done                                        |

---

## Sprint 5 — Reconciliation & Audit

> Detailed plan: [`sprint-5.md`](sprint-5.md) | Status: ✅ Complete

| Item                                                                | Owner | Status                                                          |
| ------------------------------------------------------------------- | ----- | --------------------------------------------------------------- |
| Automatic AUDIT_LOG write path for Product/Lot/Category/User writes | —     | ✅ DONE in Sprint 2 — `AuditObserver` + `AuditLogService`       |
| Automatic audit logging service/middleware                          | —     | ✅ DONE in Sprint 2 — observer/service path; no HTTP middleware |
| Cycle-count submission endpoint (warehouse_staff)                   | —     | ✅ done                                                         |
| Variance/shrinkage reconciliation report (admin)                    | —     | ✅ done                                                         |
| Inventory turnover by category report (admin)                       | —     | ✅ done                                                         |
| Frontend: admin reports & user management screen                    | —     | ✅ done                                                         |

---

## Sprint 6 — Hardening & Demo

> Detailed plan: [`sprint-6.md`](sprint-6.md) | Status: ⚠️ Main scope implemented; follow-ups remain

| Item                                                                 | Owner | Status                                                                                                         |
| -------------------------------------------------------------------- | ----- | -------------------------------------------------------------------------------------------------------------- |
| End-to-end demo flow documented (with seed/workflow limitations)     | Rem   | ✅ done — `docs/demo/DEMO_FLOW.md`                                                                             |
| Role-guard coverage for implemented Sprint 6 endpoints (FR-32–FR-41) | Rem   | ✅ done — `RbacSprintSixTest.php` & `DataManagementTest.php`                                                   |
| Seed demo data                                                       | Rem   | ⚠️ Seeders exist; thermostat expected quantity and near-expiry filter scenario do not match the demo narrative |
| Performance review (N+1 checks, eager loading audit)                 | Rem   | ✅ done — eager-loaded relations on all list queries                                                           |
| Auth hardening notes & target deployment guidance                    | Rem   | ✅ docs exist; deployment/migration remains outstanding                                                        |
| Supplier & Purchase Order Management (FR-39, FR-40, FR-41)           | Rem   | ✅ done — CRUD + receiving endpoint + UI                                                                       |
| Admin turnover/shrinkage and PM ABC/XYZ charts                       | Rem   | ✅ done                                                                                                        |
| PM purchase-order trends / supplier lead-time chart                  | Rem   | ⬜ follow-up — current component is a placeholder                                                              |
| CSV Data Management                                                  | Rem   | ✅ Categories, Products, Lots, Suppliers, POs, Cycle Counts import/export; ledger export-only                  |

---

## Open Follow-ups

| Item                                             | Status / Notes                                                                                                  |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| ~~EOQ computation (FR-29)~~ ✅ resolved          | OQ-6 resolved 2026-09-11 — operational cost inputs modeled on `reorder_configs`, not Product.                   |
| ~~Seasonal reorder trigger (FR-28)~~ ✅ baseline | Implemented as a seasonal flag + basis; richer decomposition improves the number as ledger history accumulates. |
| Cycle-count split (FR-30, FR-36)                 | ✅ Resolved 2026-09-20 — WS submits real-time counts, Admin reconciles via ledger adjustments.                  |
| PO-trends chart (CHART-6.1 / PRD FR-21)          | ⬜ Not implemented — Purchasing dashboard shows a placeholder.                                                  |
| Demo seed fidelity                               | ⬜ The thermostat snapshot is 28 (not 45); filter lots expire in 180/365 days, not 14/180.                      |
| FEFO pick allocation                             | ⬜ No dedicated pick-list/allocation workflow; only expiry sorting and alerts are available.                    |
| Railway-to-EC2 migration                         | ⬜ Deployment TODO; `docs/tech-debt.md` describes a target architecture.                                        |

---

## Post-Sprint 5 Backlog Items

| Item                                                | Status  | Notes                                                                                      |
| --------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------ |
| Product catalog pricing (`unit_cost`, `unit_price`) | ✅ Done | Enable `unit_cost` and `unit_price` on `products` table (Admin write only).                |
| Monetary ABC Classification                         | ✅ Done | Upgrade `ClassificationService` to Annual Consumption Value (`annual_demand × unit_cost`). |
| Financial Valuation & Shrinkage Loss in Reports     | ✅ Done | Surface ₱ currency losses in variance reports and inventory valuation in turnover reports. |
