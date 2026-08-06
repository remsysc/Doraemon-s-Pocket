# PRD — Doraemon's Pocket (Inventory Management System)

> Status: Draft | Date: 2026-08-01 | Owner: Rem (Backend) | Team: Rem (Backend), Lagunzad & Larce (Frontend), Product Owner / Scrum Master per Sprint 0 doc

## 1. Problem Statement

WalangBrownout Appliances runs inventory on a single spreadsheet updated manually once a week. This weekly-batch model is the root cause of three symptoms: (1) seasonal stockouts followed by panic over-ordering for portable AC units, (2) unexplained shrinkage between recorded and physical thermostat stock (45 recorded vs. 12 on the floor), and (3) ₱15,000 in write-offs from expired air-purifier filters picked in the wrong order. The business needs a real-time, transaction-based system of record instead of a weekly snapshot.

## 2. Goals

- Replace the weekly spreadsheet with a real-time transactional ledger (`INVENTORY_TRANSACTION`) so on-hand quantity updates the moment a movement occurs.
- Classify catalog items (ABC-XYZ) so control policy matches item risk/value instead of one-size-fits-all rules.
- Direct picking by FEFO (nearest expiry), not shelf position, to eliminate expiry write-offs.
- Replace panic-ordering with a mathematically derived Reorder Point (ROP) + Economic Order Quantity (EOQ), with seasonal adjustment for Z-class items.
- Give each of the three roles (Admin, Purchasing Manager, Warehouse Staff) a role-appropriate view **and permission set**: reports/user mgmt (Admin), purchasing dashboard + alerts (Purchasing Manager), and pick list/stock lookup (Warehouse Staff) — enforcing separation of duties between catalog governance, purchasing decisions, and physical stock execution, per the RBAC matrix in §4.

## 3. Non-Goals (Out of Scope)

- **Pricing / financial valuation** — no cost/price fields on Product, no COGS or valuation reporting. Explicit, deliberate boundary (Blueprint §4.1).
- Nested/hierarchical categories — categories are a flat, fixed set of four (AC units, purifiers, filters, thermostats).
- Any write UI for `INVENTORY_TRANSACTION` or `AUDIT_LOG` beyond the append-only endpoints — these are system-of-record tables, not user-editable. Per §4, the append-only ledger endpoint itself is restricted to a single writer role (Warehouse Staff).
- Multi-warehouse / multi-location inventory (single warehouse, `bin_location` string only).
- Supplier/vendor management, purchase order lifecycle beyond triggering a reorder alert.
- Mobile app (Warehouse Staff UI is a responsive web view, not a native app).
- Production-hardening of auth (open self-registration with role selection is acceptable for the academic demo; flagged as tech debt for real deployment).

## 4. Target Users

Roles are scoped by separation of duties: catalog governance (Admin) is kept separate from purchasing decisions (Purchasing Manager), which is kept separate from physical stock execution (Warehouse Staff). This isn't incidental — it's the same control that stops the person who decides _when_ to reorder from also being the person who records _what_ physically moved, which directly closes the gap that produced the Mystery Shrinkage symptom in §1.

### Warehouse Staff (Picker) — solves the Expiry Trap and Mystery Shrinkage

- **Can:** look up stock, follow a FEFO-ordered pick list, log picks/receipts in real time (append `RECEIPT`/`PICK`/`SALE`/`ADJUSTMENT`/`WRITE_OFF` rows to `INVENTORY_TRANSACTION`), flag count discrepancies at the moment they're found, create/update `Lot` records as part of logging a receipt (received_date, expiry_date, bin_location). 🚧 _Lot ownership isn't explicitly named in the role brief — inferred from "log picks/receipts in real time," see §9._
- **Can't:** see reorder points, EOQ math, or purchasing alerts; edit Product/Category master data; manage users; edit past transactions — the ledger is append-only, nobody edits history, only appends new entries.
- **UI expectation:** primary screen is the pick list / stock lookup, not a generic dashboard.

### Purchasing Manager — solves the Summer Crunch

- **Can:** view seasonal/reorder alerts, see EOQ-suggested order quantities, configure reorder points and safety stock (`REORDER_CONFIG`), view stock overview (read-only) across SKUs.
- **Can't:** touch user accounts; edit Product/Category structure; perform physical stock movements — no `INVENTORY_TRANSACTION` writes of any type, that's Warehouse's job; view the full audit log.
- **UI expectation:** primary screen is the purchasing dashboard (alerts + stock overview), not the pick list.

### Admin (Branch/Owner) — solves all three symptoms at a summary level

- **Can:** everything, full stop — Admin is a backend superuser. It passes every role check regardless of which roles a given endpoint lists, the same way it already does for Category/Product (admin-only) and Lot (admin+warehouse_staff). There is no resource Admin is permission-blocked from.
- **Doesn't, by UI convention (not a permission rule):** default to day-to-day physical picking or day-to-day reorder configuration. This is purely a navigation/dashboard choice — Admin's UI doesn't put a "Pick List" or "Configure Reorder Point" screen front and center, because that's not the job — but nothing in the backend stops Admin from using those endpoints directly if needed. There is no separate "escalation-only" access tier; it's the same permission as everyone else's, just not the default screen.
- **UI expectation:** primary screen is admin reports & user management, not the operational dashboards.

### RBAC summary matrix

Admin is a superuser and is omitted from the middle columns below — read it as "✅ for every row." The matrix exists to show what's _withheld_ from Warehouse Staff and Purchasing Manager, which is the actual point of the exercise.

| Capability                                                              | Warehouse Staff          | Purchasing Manager |
| ----------------------------------------------------------------------- | ------------------------ | ------------------ |
| Read Category/Product/Lot/stock levels                                  | ✅                       | ✅                 |
| Write Category/Product (master data)                                    | ❌                       | ❌                 |
| Write Lot (receipt-time creation/correction)                            | ✅                       | ❌                 |
| Append `INVENTORY_TRANSACTION` (RECEIPT/PICK/SALE/ADJUSTMENT/WRITE_OFF) | ✅                       | ❌                 |
| View reorder/EOQ/seasonal purchasing alerts                             | ❌                       | ✅                 |
| Write `REORDER_CONFIG` (ROP/safety stock)                               | ❌                       | ✅                 |
| Submit cycle count / flag discrepancy in real time                      | ✅                       | ❌                 |
| View variance/shrinkage reports                                         | ➖ (sees own flags only) | ❌                 |
| View full audit log                                                     | ❌                       | ❌                 |
| Manage user accounts/roles                                              | ❌                       | ❌                 |

## 5. User Stories

- As a Warehouse Staff member, I want my pick list ordered by nearest expiry date, so that I never pull a shorter-shelf-life lot after a longer one is already expired.
- As a Warehouse Staff member, I want a real-time on-hand count, so that I can flag a discrepancy (theft/damage/miscount) at the moment I see it, not a week later.
- As a Warehouse Staff member, I want to log a receipt the moment stock arrives, so that the lot's expiry date and bin location are captured before anything gets misplaced or forgotten.
- As a Purchasing Manager, I want a reorder alert that fires early for seasonal items (e.g. AC units), so that I never have to panic-order 3x normal volume.
- As a Purchasing Manager, I want the system to suggest an EOQ-sized order, so that my order quantity is derived from cost, not guesswork.
- As a Purchasing Manager, I want to configure reorder points and safety stock per SKU, so that alerts reflect real lead times without needing product/category edit access or physical stock access I don't need.
- As an Admin, I want a variance report comparing recorded vs. physical counts, so that I can distinguish real shrinkage from a timing/oversell problem.
- As an Admin, I want to manage user accounts and roles, so that access matches each employee's job function.
- As an Admin, I want to view the full audit log of who changed what, so that I can investigate a discrepancy without doing day-to-day data entry myself.
- As any authenticated user, I want to log in/out via a session that persists across page reloads, so that I don't have to re-authenticate constantly.

## 6. Functional Requirements

| ID    | Requirement                                                                                                                                                                                                                                                                                                                                     | Priority |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| FR-1  | Users can register with name, email, password, and one of three roles (admin, purchasing_manager, warehouse_staff).                                                                                                                                                                                                                             | P0       |
| FR-2  | Users can log in/out via Sanctum SPA cookie-based session auth.                                                                                                                                                                                                                                                                                 | P0       |
| FR-3  | Routes are guarded by role. Category/Product (master data) writes are Admin-only. Lot writes (recording a physical receipt) are restricted to Admin and Warehouse Staff. All authenticated roles can read Category/Product/Lot and stock levels.                                                                                                | P0       |
| FR-4  | Admin can perform full CRUD on Category (flat, 4 fixed categories, soft-deletable). Purchasing Manager and Warehouse Staff are read-only.                                                                                                                                                                                                       | P0       |
| FR-5  | Admin can perform full CRUD on Product (sku_id PK, category FK, is_seasonal flag, shelf_life_days). Purchasing Manager and Warehouse Staff are read-only.                                                                                                                                                                                       | P0       |
| FR-6  | Admin and Warehouse Staff can create/update Lot (lot_id PK, product FK, received_date, expiry_date, bin_location) — a Lot is created at the moment stock is physically received. Purchasing Manager is read-only on Lot, consistent with not performing physical stock movements.                                                               | P0       |
| FR-7  | Every stock movement is recorded as an append-only `INVENTORY_TRANSACTION` row (RECEIPT/RESERVE/PICK/SALE/ADJUSTMENT/WRITE_OFF) with signed qty_delta and actor_id — never a direct quantity overwrite. Warehouse Staff and Admin (superuser) can create these rows; Purchasing Manager has read-only access to the ledger.                     | P0       |
| FR-8  | `INVENTORY_SNAPSHOT` (qty_on_hand, qty_reserved, qty_available) is derived and updated within the same DB transaction as any INVENTORY_TRANSACTION insert, using row-level locking to prevent overselling.                                                                                                                                      | P0       |
| FR-9  | Warehouse Staff can view a pick list ordered by nearest lot expiry_date (FEFO) for a given product.                                                                                                                                                                                                                                             | P0       |
| FR-10 | System raises an expiry alert when a lot's expiry_date falls within a configurable window (default 30 days) and qty_on_hand > 0, visible to Purchasing Manager and Admin. Warehouse Staff sees expiry risk inline via the FEFO pick list (FR-9) rather than a separate alert feed.                                                              | P1       |
| FR-11 | `REORDER_CONFIG` stores reorder_point, safety_stock, and lead_time_days per SKU. Purchasing Manager writes it; Admin (superuser) can also write it, though the reorder-config screen isn't part of Admin's default UI; Warehouse Staff has no access at all (read or write).                                                                    | P1       |
| FR-12 | System computes ROP = (avg daily demand × lead time) + safety stock, with safety stock = Z × √[(lead_time_avg × demand_variance) + (demand_avg² × lead_time_variance)].                                                                                                                                                                         | P1       |
| FR-13 | System computes EOQ = √[(2 × annual demand × order cost) / holding cost per unit] for non-seasonal items.                                                                                                                                                                                                                                       | P1       |
| FR-14 | For is_seasonal=true items, reorder trigger is shifted earlier by lead_time relative to last year's same-period demand (seasonal index), not a flat trailing average.                                                                                                                                                                           | P1       |
| FR-15 | System classifies each product by ABC (value/turnover) and XYZ (demand variability).                                                                                                                                                                                                                                                            | P1       |
| FR-16 | Warehouse Staff can submit a physical cycle count / flag a discrepancy at the moment it's found, comparing it to qty_on_hand. Admin can view/run the resulting variance/shrinkage reconciliation report across SKUs, flagging variance beyond a configurable threshold (default >5%). 🚧 Submit-vs-view split inferred from role brief, see §9. | P1       |
| FR-17 | Every write to Product/Lot/Category/User is recorded to an append-only `AUDIT_LOG` with actor, action, entity, old/new values.                                                                                                                                                                                                                  | P2       |
| FR-18 | Admin can view variance/shrinkage and inventory-turnover-by-category reports.                                                                                                                                                                                                                                                                   | P2       |
| FR-19 | Only Admin can view, create, update, or deactivate user accounts and change role assignments (beyond a user's own self-registration). Purchasing Manager and Warehouse Staff have no access to user management.                                                                                                                                 | P0       |
| FR-20 | Only Admin can read the full `AUDIT_LOG`. Purchasing Manager and Warehouse Staff cannot view it, even for entities they can otherwise read.                                                                                                                                                                                                     | P2       |

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
- Role-guard tests confirm the RBAC matrix in §4 for all three roles (e.g. Purchasing Manager gets 403 on `POST /api/inventory-transactions`; Warehouse Staff gets 403 on `POST /api/products`; Warehouse Staff gets 403/hidden on `GET /api/reorder-configs`).

## 9. Assumptions & Open Questions

- Assumed: single warehouse, single currency-less unit tracking (no pricing) — confirmed explicitly in Blueprint §4.1 and memory.
- ✅ Resolved (2026-08-04, perms team submission): "purchasing_manager" and "admin" do **not** share write access to Category/Product/Lot. Category/Product writes are Admin-only; Lot writes are Admin + Warehouse Staff; only Admin manages Users. **Implemented** in `routes/api.php`, `RoleMiddleware`, and the `CategoryPolicy`/`ProductPolicy`/`LotPolicy` classes, with regression tests in `tests/Feature/CategoryProductLotCrudTest.php` and `tests/Feature/RoleMiddlewareTest.php`.
- ✅ Resolved (2026-08-04): Admin is a plain backend superuser, not a separate "escalation-only" access tier. `RoleMiddleware` grants `admin` an unconditional pass on every role-guarded route regardless of that route's role list (and each Policy's `before()` hook does the equivalent for FormRequest-driven authorization). "Admin doesn't do daily picking/reorder config" is a UI/navigation convention only, not a backend permission distinction.
- 🚧 Open: the perms team's role brief never names the `Lot` entity directly. This PRD infers Lot write = Admin + Warehouse Staff (a Lot is born from a physical receipt) from "Warehouse logs receipts in real time" + "Purchasing Manager can't perform physical stock movements." Confirm with the perms team before implementing further Lot-adjacent features.
- 🚧 Open: whether Purchasing Manager's "no physical stock movements" restriction blocks all `INVENTORY_TRANSACTION` txn_types (RECEIPT/PICK/SALE/ADJUSTMENT/WRITE_OFF) or only the two named as examples (PICK/RECEIPT). This PRD adopts the stricter all-txn-types reading (safer for the shrinkage-prevention goal) — confirm before implementing.
- 🚧 Open: whether Admin's cycle-count/reconciliation role is "submit or view" or "view only" — this PRD splits it as Warehouse submits in real time (FR-16), Admin views/runs the aggregate report, inferred from combining "Warehouse flags discrepancies at the moment they're found" with "Admin gets variance/shrinkage reports." Confirm before Sprint 5.
- 🚧 Open: exact `onDelete` behavior for Lot when parent Product is deleted (restrict vs. cascade) — flagged in memory as unresolved.
- 🚧 Open: `received_date` type — currently `dateTime` in migration vs. `date` in blueprint ERD text. Needs reconciliation.
- Open self-registration with role selection is accepted as a demo-only simplification, not a production security decision.

## 10. Risks

- **Risk:** Concurrency bugs in the snapshot-update path could allow overselling. — _Mitigation:_ row-level locking + concurrency stress tests (Sprint 3, per Excalidraw board).
- **Risk:** FEFO logic silently regresses to FIFO-by-insertion-order if lot queries aren't explicitly ordered by expiry_date. — _Mitigation:_ cover with a dedicated test asserting pick-list order on out-of-order lot insertion.
- **Risk:** Non-standard PK naming (`sku_id`, `lot_id`) causes silent failures in route-model binding or relationships if `$primaryKey` is missed on a new model. — _Mitigation:_ checklist item in code review for every new model touching these tables.
- **Risk:** Scope creep into pricing/valuation during Sprint 4 classification work (ABC analysis is revenue-adjacent). — _Mitigation:_ explicit non-goal, reiterate in sprint planning.
- **Risk:** `routes/api.php` currently grants Category/Product/Lot write access to `admin,purchasing_manager` together, which now contradicts §4/§6 above. — _Mitigation:_ update `RoleMiddleware` route groups and add regression tests for the new matrix before Sprint 2 sign-off; track as a named follow-up so it isn't silently forgotten.
