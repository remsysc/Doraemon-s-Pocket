# Sprints 3–6 — Forward-Looking Roadmap

> Status: ⬜ Roadmap
> Sprint 2 is complete. Sprint 3 has a dedicated plan in [`sprint-3.md`](sprint-3.md); later sprint sections remain requirement-level only.

---

## Sprint 3 — Inventory Snapshots & Concurrency

> Detailed plan: [`sprint-3.md`](sprint-3.md) | Status: ⬜ Planned

| Item                                                              | Owner | Status         |
| ----------------------------------------------------------------- | ----- | -------------- |
| INVENTORY_SNAPSHOT table (qty_on_hand, qty_reserved, qty_available) | —   | ⬜ not started |
| Row-level locking on snapshot update path (lockForUpdate)         | —     | ⬜ not started |
| Reservation workflow (RESERVE / release)                          | —     | ⬜ not started |
| Concurrency stress tests (oversell prevention)                    | —     | ⬜ not started |
| Frontend: stock overview / real-time on-hand display              | —     | ⬜ not started |

---

## Sprint 4 — Classification & Reorder Intelligence

| Item                                                              | Owner | Status         |
| ----------------------------------------------------------------- | ----- | -------------- |
| ABC/XYZ classification engine                                     | —     | ⬜ not started |
| REORDER_CONFIG table + endpoints (PM + admin write; WS no access) | —     | ⬜ not started |
| ROP computation (avg demand × lead time + safety stock)           | —     | ⬜ not started |
| EOQ computation (non-seasonal items) — blocked on OQ-6            | —     | ⬜ not started |
| Seasonal reorder trigger (is_seasonal items, Holt-Winters/index)  | —     | ⬜ not started |
| Expiry alert endpoint (PM + admin only)                           | —     | ⬜ not started |
| Reorder alert endpoint (PM + admin only)                          | —     | ⬜ not started |
| Frontend: purchasing dashboard (alerts + stock overview)          | —     | ⬜ not started |

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
| Seed realistic demo data                                          | —     | ✅ BASELINE DONE in Sprint 2 — 24 repeatable ledger transactions; final demo-flow expansion remains Sprint 6 |
| Performance review (N+1 checks, eager loading audit)              | —     | ⬜ not started |
| Auth hardening notes / tech debt doc for real deployment          | —     | ⬜ not started |

---

## Blocked Items

| Item                                 | Blocked On                                                   |
| ------------------------------------ | ------------------------------------------------------------ |
| EOQ computation (FR-29)              | OQ-6: `order_cost`/`holding_cost_per_unit` not modeled; pricing is out of scope. |
| Seasonal reorder trigger (FR-28)     | Depends on `inventory_transactions` history from Sprint 2/3. |
| Cycle-count split (FR-30, FR-36)     | OQ-3: submit vs. view role split is inferred — confirm with perms team before Sprint 5. |
