# Sprints 3–6 — Forward-Looking Roadmap

> Status: ⬜ Roadmap
> Sprints 2, 3, and 4 are complete. Sprints 3 and 4 have dedicated plans in [`sprint-3.md`](sprint-3.md) and [`sprint-4.md`](sprint-4.md); Sprint 5–6 sections remain requirement-level only.

---

## Sprint 3 — Inventory Snapshots & Concurrency

> Detailed plan: [`sprint-3.md`](sprint-3.md) | Status: ✅ Complete

| Item                                                              | Owner | Status         |
| ----------------------------------------------------------------- | ----- | -------------- |
| INVENTORY_SNAPSHOT table (qty_on_hand, qty_reserved, qty_available) | Rem | ✅ done |
| Row-level locking on snapshot update path (lockForUpdate)         | Rem   | ✅ done |
| Reservation workflow (RESERVE / release)                          | Rem   | ✅ done |
| Concurrency stress tests (oversell prevention)                    | Rem   | ✅ done — PostgreSQL row-lock test |
| Frontend: stock overview / real-time on-hand display              | Rem   | ✅ done |

---

## Sprint 4 — Classification & Reorder Intelligence

> Detailed plan: [`sprint-4.md`](sprint-4.md) | Status: ✅ Complete

| Item                                                              | Owner | Status         |
| ----------------------------------------------------------------- | ----- | -------------- |
| ABC/XYZ classification engine                                     | Rem   | ✅ done — volume Pareto + CV |
| REORDER_CONFIG table + endpoints (PM + admin write; WS no access) | Rem   | ✅ done |
| ROP computation (avg demand × lead time + safety stock)           | Rem   | ✅ done |
| EOQ computation (non-seasonal items) — OQ-6 resolved              | Rem   | ✅ done — operational costs on reorder_configs |
| Seasonal reorder trigger (is_seasonal items, seasonal index)      | Rem   | ✅ done — flag + basis baseline |
| Expiry alert endpoint (PM + admin only)                           | Rem   | ✅ done |
| Reorder alert endpoint (PM + admin only)                          | Rem   | ✅ done |
| Frontend: purchasing dashboard (alerts + stock overview)          | Rem   | ✅ done |

---

## Sprint 5 — Reconciliation & Audit

| Item                                                              | Owner | Status         |
| ----------------------------------------------------------------- | ----- | -------------- |
| Automatic AUDIT_LOG write path for Product/Lot/Category/User writes | —     | ✅ DONE in Sprint 2 — `AuditObserver` + `AuditLogService` |
| Automatic audit logging service/middleware                        | —     | ✅ DONE in Sprint 2 — observer/service path; no HTTP middleware |
| Cycle-count submission endpoint (warehouse_staff)                 | —     | ⬜ not started |
| Variance/shrinkage reconciliation report (admin)                  | —     | ⬜ not started |
| Inventory turnover by category report (admin)                     | —     | ⬜ not started |
| Frontend: admin reports & user management screen                  | —     | ⬜ not started |

---

## Sprint 6 — Hardening & Demo

| Item                                                              | Owner | Status         |
| ----------------------------------------------------------------- | ----- | -------------- |
| End-to-end demo flow (all three symptom mitigations demoable)     | —     | ⬜ not started |
| Role-guard test coverage for FR-32–FR-38                          | —     | ⬜ not started |
| Seed realistic demo data                                          | —     | ✅ BASELINE DONE — 26 repeatable ledger transactions (Sprint 2 baseline + Sprint 3 snapshot rebuild); final demo-flow expansion remains Sprint 6 |
| Performance review (N+1 checks, eager loading audit)              | —     | ⬜ not started |
| Auth hardening notes / tech debt doc for real deployment          | —     | ⬜ not started |

---

## Blocked Items

| Item                                 | Blocked On                                                   |
| ------------------------------------ | ------------------------------------------------------------ |
| ~~EOQ computation (FR-29)~~ ✅ resolved | OQ-6 resolved 2026-09-11 — operational cost inputs modeled on `reorder_configs`, not Product. |
| ~~Seasonal reorder trigger (FR-28)~~ ✅ baseline | Implemented as a seasonal flag + basis; richer decomposition improves the number as ledger history accumulates. |
| Cycle-count split (FR-30, FR-36)     | OQ-3: submit vs. view role split is inferred — confirm with perms team before Sprint 5. |
