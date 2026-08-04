# PRD — Doraemon's Pocket (Inventory Management System)
> Status: Draft | Date: 2026-08-01 | Owner: Rem (Backend) | Team: Rem (Backend), Lagunzad & Larce (Frontend), Product Owner / Scrum Master per Sprint 0 doc

## 1. Problem Statement
WalangBrownout Appliances runs inventory on a single spreadsheet updated manually once a week. This weekly-batch model is the root cause of three symptoms: (1) seasonal stockouts followed by panic over-ordering for portable AC units, (2) unexplained shrinkage between recorded and physical thermostat stock (45 recorded vs. 12 on the floor), and (3) ₱15,000 in write-offs from expired air-purifier filters picked in the wrong order. The business needs a real-time, transaction-based system of record instead of a weekly snapshot.

## 2. Goals
- Replace the weekly spreadsheet with a real-time transactional ledger (`INVENTORY_TRANSACTION`) so on-hand quantity updates the moment a movement occurs.
- Classify catalog items (ABC-XYZ) so control policy matches item risk/value instead of one-size-fits-all rules.
- Direct picking by FEFO (nearest expiry), not shelf position, to eliminate expiry write-offs.
- Replace panic-ordering with a mathematically derived Reorder Point (ROP) + Economic Order Quantity (EOQ), with seasonal adjustment for Z-class items.
- Give each of the three roles (Admin, Purchasing Manager, Warehouse Staff) a role-appropriate view: reports/user mgmt, purchasing dashboard + alerts, and pick list/stock lookup respectively.

## 3. Non-Goals (Out of Scope)
- **Pricing / financial valuation** — no cost/price fields on Product, no COGS or valuation reporting. Explicit, deliberate boundary (Blueprint §4.1).
- Nested/hierarchical categories — categories are a flat, fixed set of four (AC units, purifiers, filters, thermostats).
- Any write UI for `INVENTORY_TRANSACTION` or `AUDIT_LOG` beyond the append-only endpoints — these are system-of-record tables, not user-editable.
- Multi-warehouse / multi-location inventory (single warehouse, `bin_location` string only).
- Supplier/vendor management, purchase order lifecycle beyond triggering a reorder alert.
- Mobile app (Warehouse Staff UI is a responsive web view, not a native app).
- Production-hardening of auth (open self-registration with role selection is acceptable for the academic demo; flagged as tech debt for real deployment).

## 4. Target Users
- **Warehouse Staff (Picker)** — needs a FEFO-ordered pick list and real-time discrepancy flagging at the moment of picking.
- **Purchasing Manager** — needs seasonal reorder alerts and EOQ-suggested order quantities on a purchasing dashboard.
- **Admin / Branch Owner** — needs variance/shrinkage reports and user management, at a summary level across all three symptoms.

## 5. User Stories
- As a Warehouse Staff member, I want my pick list ordered by nearest expiry date, so that I never pull a shorter-shelf-life lot after a longer one is already expired.
- As a Warehouse Staff member, I want a real-time on-hand count, so that I can flag a discrepancy (theft/damage/miscount) at the moment I see it, not a week later.
- As a Purchasing Manager, I want a reorder alert that fires early for seasonal items (e.g. AC units), so that I never have to panic-order 3x normal volume.
- As a Purchasing Manager, I want the system to suggest an EOQ-sized order, so that my order quantity is derived from cost, not guesswork.
- As an Admin, I want a variance report comparing recorded vs. physical counts, so that I can distinguish real shrinkage from a timing/oversell problem.
- As an Admin, I want to manage user accounts and roles, so that access matches each employee's job function.
- As any authenticated user, I want to log in/out via a session that persists across page reloads, so that I don't have to re-authenticate constantly.

## 6. Functional Requirements
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Users can register with name, email, password, and one of three roles (admin, purchasing_manager, warehouse_staff). | P0 |
| FR-2 | Users can log in/out via Sanctum SPA cookie-based session auth. | P0 |
| FR-3 | Routes are guarded by role: Admin and Purchasing Manager can write to Category/Product/Lot; all authenticated roles can read. | P0 |
| FR-4 | Admin/Purchasing Manager can perform full CRUD on Category (flat, 4 fixed categories, soft-deletable). | P0 |
| FR-5 | Admin/Purchasing Manager can perform full CRUD on Product (sku_id PK, category FK, is_seasonal flag, shelf_life_days). | P0 |
| FR-6 | Admin/Purchasing Manager can perform full CRUD on Lot (lot_id PK, product FK, received_date, expiry_date, bin_location). | P0 |
| FR-7 | Every stock movement is recorded as an append-only `INVENTORY_TRANSACTION` row (RECEIPT/RESERVE/PICK/SALE/ADJUSTMENT/WRITE_OFF) with signed qty_delta and actor_id — never a direct quantity overwrite. | P0 |
| FR-8 | `INVENTORY_SNAPSHOT` (qty_on_hand, qty_reserved, qty_available) is derived and updated within the same DB transaction as any INVENTORY_TRANSACTION insert, using row-level locking to prevent overselling. | P0 |
| FR-9 | Warehouse Staff can view a pick list ordered by nearest lot expiry_date (FEFO) for a given product. | P0 |
| FR-10 | System raises an expiry alert when a lot's expiry_date falls within a configurable window (default 30 days) and qty_on_hand > 0. | P1 |
| FR-11 | `REORDER_CONFIG` stores reorder_point, safety_stock, and lead_time_days per SKU. | P1 |
| FR-12 | System computes ROP = (avg daily demand × lead time) + safety stock, with safety stock = Z × √[(lead_time_avg × demand_variance) + (demand_avg² × lead_time_variance)]. | P1 |
| FR-13 | System computes EOQ = √[(2 × annual demand × order cost) / holding cost per unit] for non-seasonal items. | P1 |
| FR-14 | For is_seasonal=true items, reorder trigger is shifted earlier by lead_time relative to last year's same-period demand (seasonal index), not a flat trailing average. | P1 |
| FR-15 | System classifies each product by ABC (value/turnover) and XYZ (demand variability). | P1 |
| FR-16 | Admin can run/view a cycle-count reconciliation: submit a physical count, compare to qty_on_hand, and flag variance beyond a configurable threshold (default >5%). | P1 |
| FR-17 | Every write to Product/Lot/Category/User is recorded to an append-only `AUDIT_LOG` with actor, action, entity, old/new values. | P2 |
| FR-18 | Admin can view variance/shrinkage and inventory-turnover-by-category reports. | P2 |

## 7. Non-Functional Requirements
- **Auth:** Sanctum SPA cookie-based session auth; CSRF cookie flow required before any state-changing request.
- **Concurrency:** Concurrent sale/pick requests against the same lot must not oversell — enforced via row-level locking at the DB transaction level (FR-8).
- **Data integrity:** `INVENTORY_TRANSACTION` and `AUDIT_LOG` are append-only; no UPDATE/DELETE routes are exposed for either.
- **Stack constraint:** Laravel 13, PostgreSQL, React (TypeScript) SPA in the same monorepo, Vite/Rolldown, Tailwind, Docker/Podman.
- **Scale:** Single warehouse, academic-project scale — no specific throughput target.

## 8. Success Metrics
- All three root-cause symptoms in Blueprint §2 have a corresponding, demoable mitigation (seasonal ROP, real-time ledger + variance report, FEFO picking).
- Sprint review demo (Sprint 6) shows: role-guarded auth, full Category/Product/Lot CRUD, append-only transaction ledger, real-time snapshot, FEFO pick list, ROP/EOQ alert, and a variance report — end to end.
- Zero direct writes to `qty_on_hand`/`qty_available` outside the transaction-triggered update path (verifiable by code review / test).

## 9. Assumptions & Open Questions
- Assumed: single warehouse, single currency-less unit tracking (no pricing) — confirmed explicitly in Blueprint §4.1 and memory.
- Assumed: "purchasing_manager" and "admin" share write access to Category/Product/Lot; only Admin manages Users. 🚧 Not explicitly stated in blueprint — confirm before implementing user-management endpoint restrictions.
- 🚧 Open: exact `onDelete` behavior for Lot when parent Product is deleted (restrict vs. cascade) — flagged in memory as unresolved.
- 🚧 Open: `received_date` type — currently `dateTime` in migration vs. `date` in blueprint ERD text. Needs reconciliation.
- Open self-registration with role selection is accepted as a demo-only simplification, not a production security decision.

## 10. Risks
- **Risk:** Concurrency bugs in the snapshot-update path could allow overselling. — *Mitigation:* row-level locking + concurrency stress tests (Sprint 3, per Excalidraw board).
- **Risk:** FEFO logic silently regresses to FIFO-by-insertion-order if lot queries aren't explicitly ordered by expiry_date. — *Mitigation:* cover with a dedicated test asserting pick-list order on out-of-order lot insertion.
- **Risk:** Non-standard PK naming (`sku_id`, `lot_id`) causes silent failures in route-model binding or relationships if `$primaryKey` is missed on a new model. — *Mitigation:* checklist item in code review for every new model touching these tables.
- **Risk:** Scope creep into pricing/valuation during Sprint 4 classification work (ABC analysis is revenue-adjacent). — *Mitigation:* explicit non-goal, reiterate in sprint planning.
