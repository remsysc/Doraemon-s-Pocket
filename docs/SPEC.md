# SPEC — Doraemon's Pocket (Inventory Management System)
> Status: Draft | Date: 2026-08-01 | Source PRD: PRD.md | Binding for all implementation sessions

This spec is the source of truth for implementation. Where code and spec disagree, that's a bug — fix whichever side is wrong and log it in the Changelog (§10). Where this spec doesn't cover a case, stop and flag it rather than guessing.

---

## 1. Scope of This Spec

Covers Sprint 1 (done) through Sprint 2 (in progress) in full detail, and Sprints 3–6 at requirement-level (to be expanded into their own spec sections as those sprints start). Do not implement Sprint 3+ behavior against this document alone — flag it as unspecified first.

### 1.1 Sprint status source of truth

Per-item status below tracks the **live Excalidraw checklist** (`.excalidraw`), not the static Sprint 7.4 table in the Blueprint doc — the Excalidraw file has per-person WIP/DONE tags that postdate the Blueprint and reflect actual current state:

**Sprint 1 — Foundation & auth**
| Item | Owner | Status |
|---|---|---|
| Repo setup, CI, project skeleton | Rem | ✅ DONE |
| USER table (id, email, password_hash, role) | Rem | ✅ DONE |
| Register/login endpoints, session auth | Rem | ✅ DONE |
| Role-based route-guarding middleware | Rem | ✅ DONE |
| Purchasing Manager / Warehouse Staff / Admin personas | Cindy & Vane | ⬜ not started |
| User can/can't-do, UI expectations | Cindy & Vane | ⬜ not started |
| Wireframes | Lyll & Larce | ✅ DONE |
| Frontend: login/register pages, protected-route wrapper | Lyll & Larce | 🟡 WIP |
| Initial DB seeders (users, roles, sample products) | Rem | ✅ DONE |
| List all endpoints (API contract doc) | Rem | ✅ DONE |
| Test: can't hit inventory endpoint unauthenticated | — | ⬜ not started |

**Sprint 2 — Core ledger** (current sprint)
| Item | Owner | Status |
|---|---|---|
| CATEGORY table + CRUD endpoints | Rem | 🟡 WIP |
| PRODUCT table + CRUD endpoints | Rem | ✅ DONE *(per checklist — see 🚧 discrepancy note below)* |
| LOT table + CRUD endpoints | Rem | 🟡 WIP |
| INVENTORY_TRANSACTION table + append-only write endpoint | — | ⬜ not started |
| AUDIT_LOG table | — | ⬜ not started |
| Automatic audit logging middleware/service | — | ⬜ not started |
| Frontend: Category Management | — | ⬜ not started |
| Frontend: Product List | — | ⬜ not started |
| Frontend: Product Form | — | ⬜ not started |
| Frontend: Lot Management | — | ⬜ not started |
| Seed realistic inventory data | — | ⬜ not started |
| Test: transaction writes are immutable | — | ⬜ not started |
| Test: audit logs are generated for CRUD operations | — | ⬜ not started |

**Sprints 3–6** — every item in the Excalidraw checklist is currently unchecked (`[]`). Nothing in Snapshot derivation, reservation workflow, ABC/XYZ classification, ROP/EOQ, cycle-count reconciliation, or hardening has been started. Treat §§4–7 of this spec for those sprints as **forward-looking requirements only**, not in-progress work.

🚧 **DISCREPANCY:** The checklist marks Product CRUD `[/]` (DONE), but `routes/api.php` has every Product/Category/Lot route commented out, and no `ProductController` create/store/update/destroy logic is visible in the reviewed files. Likely reading: the **migration + model** for Product is done, but the **CRUD endpoints** are not — the checklist item bundles both under one checkbox. Recommend splitting this checklist item in the Excalidraw board (e.g. separate "Product migration/model" from "Product CRUD endpoints") so status doesn't overstate completion. Until confirmed, this spec treats Product CRUD as WIP, not done, for planning purposes.

---

## 2. Requirements (EARS syntax)

### Auth & Roles (Sprint 1 — implemented)
- **FR-1** THE SYSTEM SHALL allow account creation via `POST /api/register` with `name`, `email`, `password`, `password_confirmation`, and `role` (one of `admin`, `purchasing_manager`, `warehouse_staff`).
- **FR-2** WHEN a registration request has a `role` outside the enum THE SYSTEM SHALL return 422 with a field-level error on `role`.
- **FR-3** THE SYSTEM SHALL authenticate via Sanctum SPA cookie session (`POST /api/login`, `POST /api/logout`, `GET /api/user`).
- **FR-4** IF a request to `/sanctum/csrf-cookie` has not preceded a state-changing request THEN THE SYSTEM SHALL reject that request per Sanctum's CSRF middleware (419).
- **FR-5** WHILE a route is guarded by `role:` middleware THE SYSTEM SHALL return 403 if the authenticated user's role is not in the allowed list, and 401 if unauthenticated.

### Category (Sprint 2 — in progress)
- **FR-6** THE SYSTEM SHALL support full CRUD on Category via `/api/categories` and `/api/categories/{category}`.
- **FR-7** THE SYSTEM SHALL restrict Category write operations (create/update/delete) to `admin` and `purchasing_manager` roles.
- **FR-8** THE SYSTEM SHALL allow any authenticated role to read Category (list/show).
- **FR-9** WHEN a Category is soft-deleted and a new Category is created with a slug matching the soft-deleted one THE SYSTEM SHALL create a new record, NOT auto-revive the soft-deleted one. Reviving a soft-deleted Category requires an explicit `POST /api/categories/{category}/restore` endpoint. 🚧 OPEN QUESTION: this restore endpoint is not yet built — confirm it's in Sprint 2 scope before Sprint 2 is marked done.

### Product (Sprint 2 — in progress)
- **FR-10** THE SYSTEM SHALL support full CRUD on Product via `/api/products` and `/api/products/{product}`.
- **FR-11** THE SYSTEM SHALL restrict Product write operations to `admin` and `purchasing_manager` roles.
- **FR-12** THE SYSTEM SHALL allow any authenticated role to read Product.
- **FR-13** IF a Product's `category_id` does not reference an existing Category THEN THE SYSTEM SHALL return 422.
- **FR-14** THE SYSTEM SHALL NOT expose any price, cost, or valuation field on Product (non-goal, Blueprint §4.1).

### Lot (Sprint 2 — in progress)
- **FR-15** THE SYSTEM SHALL support full CRUD on Lot via `/api/lots` and `/api/lots/{lot}`.
- **FR-16** THE SYSTEM SHALL restrict Lot write operations to `admin` and `purchasing_manager` roles.
- **FR-17** THE SYSTEM SHALL allow any authenticated role to read Lot.
- **FR-18** 🚧 OPEN QUESTION: `onDelete` behavior when a Lot's parent Product is deleted — no default currently specified in the migration (`constrained()` defaults to `restrict` under Laravel unless overridden). Confirm with the team whether deleting a Product with active Lots should be blocked (restrict — current implicit behavior) or cascade. Do not change migration behavior without this confirmation.
- **FR-19** 🚧 OPEN QUESTION: `received_date` type mismatch — migration defines `dateTime`, Blueprint §4.1 ERD text says `date`. Resolve before Sprint 2 sign-off; this spec currently treats the migration (`dateTime`) as authoritative since it's the implemented artifact, but flags it for review.

### Inventory Transaction Ledger (Sprint 2, not yet started)
- **FR-20** THE SYSTEM SHALL record every stock movement as an append-only row in `inventory_transactions` with `txn_type` in (`RECEIPT`, `RESERVE`, `PICK`, `SALE`, `ADJUSTMENT`, `WRITE_OFF`), a signed `qty_delta`, `occurred_at`, and `actor_id` set from the authenticated session — never a client-supplied actor_id.
- **FR-21** THE SYSTEM SHALL NOT expose any UPDATE or DELETE route for `inventory_transactions`. Only `POST` (create) and `GET` (read) are permitted.
- **FR-22** WHEN an `inventory_transactions` row of type `SALE` or `PICK` is inserted THE SYSTEM SHALL, within the same database transaction, decrement `qty_available` on the corresponding `inventory_snapshots` row using row-level locking (`SELECT ... FOR UPDATE` or Eloquent's `lockForUpdate()`).
- **FR-23** IF a decrement would take `qty_available` below zero THEN THE SYSTEM SHALL reject the transaction (422) and roll back, rather than allowing negative available stock.

### FEFO Picking (Sprint 2/4)
- **FR-24** THE SYSTEM SHALL order any pick-list query for a given Product by `lots.expiry_date` ascending (nulls last), regardless of `received_date` or insertion order.
- **FR-25** WHEN a Lot's `expiry_date` falls within the configurable expiry window (default 30 days, configurable via `REORDER_CONFIG`-adjacent config, not yet modeled) AND `qty_on_hand` for that lot > 0, THE SYSTEM SHALL surface it in an expiry-alert endpoint.

### Reorder / ROP / EOQ (Sprint 4 — not yet started, requirement-level only)
- **FR-26** THE SYSTEM SHALL compute `ROP = (avg_daily_demand × lead_time_days) + safety_stock` per SKU, reading `lead_time_days` from `reorder_configs`.
- **FR-27** THE SYSTEM SHALL compute `safety_stock = Z × sqrt((lead_time_avg × demand_variance) + (demand_avg^2 × lead_time_variance))` with a configurable Z (default 1.65 for ~95% service level).
- **FR-28** WHERE a Product has `is_seasonal = true` THE SYSTEM SHALL compute its reorder trigger from the same period last year's demand (seasonal index or Holt-Winters decomposition), shifted earlier by `lead_time_days`, rather than a flat trailing average.
- **FR-29** THE SYSTEM SHALL compute `EOQ = sqrt((2 × annual_demand × order_cost) / holding_cost_per_unit)` for non-seasonal items. 🚧 OPEN QUESTION: `order_cost` and `holding_cost_per_unit` are not yet modeled anywhere in the schema — since pricing is explicitly out of scope (PRD non-goal), confirm whether these are (a) hardcoded constants for the demo, (b) added as non-price "operational cost" fields distinct from unit price, or (c) descoped from the EOQ calculation entirely for this project. This blocks FR-29 implementation.

### Reconciliation & Audit (Sprint 5 — not yet started, requirement-level only)
- **FR-30** THE SYSTEM SHALL accept a physical cycle-count submission and compare it to `qty_on_hand`, flagging a variance alert when the discrepancy exceeds a configurable threshold (default 5%).
- **FR-31** THE SYSTEM SHALL record every write to `products`, `lots`, `categories`, and `users` to an append-only `audit_logs` table capturing actor, action, entity type/id, old values, new values.

---

## 3. Data Models

Fields marked `(impl.)` reflect the actual current migration; fields marked `(planned)` are not yet migrated.

### users (impl.)
```
id: bigint, pk, auto-increment          -- NOTE: not UUID, despite blueprint calling for UUID PK.
                                         -- 🚧 OPEN QUESTION: blueprint §4.1 specifies user_id UUID PK;
                                         -- actual users table uses Laravel's default bigint id.
                                         -- Confirm whether this is an accepted deviation or needs
                                         -- a migration to UUID before Sprint 2 sign-off.
name: string, not null
email: string, unique, not null
email_verified_at: timestamp, nullable
password: string, not null (hashed cast)
remember_token: string, nullable
role: string, not null, default 'warehouse_staff'  -- enum in (admin, purchasing_manager, warehouse_staff)
created_at, updated_at: timestamp
```

### categories (impl.)
```
id: uuid, pk
name: string, not null
slug: string, unique, not null
created_at, updated_at: timestamp
deleted_at: timestamp, nullable (soft deletes)
```

### products (impl.)
```
sku_id: uuid, pk                        -- non-standard PK name; requires explicit
                                         -- protected $primaryKey = 'sku_id' in Model.
category_id: uuid, fk -> categories.id, indexed
name: string, not null
description: string, nullable
barcode: string, nullable
unit_of_measure: string, not null
is_seasonal: boolean, default false
shelf_life_days: integer, nullable
is_active: boolean, default true
created_at, updated_at: timestamp
```
No price/cost/valuation field — deliberate (PRD non-goal, FR-14).

### lots (impl.)
```
lot_id: uuid, pk                        -- non-standard PK name; requires explicit
                                         -- protected $primaryKey = 'lot_id' in Model.
sku_id: uuid, fk -> products.sku_id, indexed
received_date: dateTime, not null       -- 🚧 see FR-19
expiry_date: date, nullable             -- drives FEFO ordering (FR-24)
bin_location: string, not null
created_at, updated_at: timestamp
```

### inventory_transactions (planned — Sprint 2)
```
txn_id: uuid, pk
lot_id: uuid, fk -> lots.lot_id
txn_type: enum(RECEIPT, RESERVE, PICK, SALE, ADJUSTMENT, WRITE_OFF), not null
qty_delta: integer, not null            -- signed; positive for RECEIPT, negative for SALE/PICK/WRITE_OFF
occurred_at: timestamp, not null, default now()
actor_id: fk -> users.id, not null      -- set server-side from auth()->id(), never client-supplied
```
Append-only: no update/delete route exposed (FR-21).

### inventory_snapshots (planned — Sprint 3)
```
sku_id: uuid, pk, fk -> products.sku_id
qty_on_hand: integer, not null, default 0
qty_reserved: integer, not null, default 0
qty_available: integer, not null, default 0   -- derived: qty_on_hand - qty_reserved
last_updated: timestamp, not null
```
Derived/cached — updated only via the transaction-insert trigger path (FR-22), never directly.

### reorder_configs (planned — Sprint 4)
```
sku_id: uuid, pk, fk -> products.sku_id
reorder_point: integer, not null
safety_stock: integer, not null
lead_time_days: integer, not null
```

### audit_logs (planned — Sprint 2/5)
```
audit_id: uuid, pk
actor_id: fk -> users.id, not null
action: string, not null                -- e.g. CREATE_PRODUCT, UPDATE_LOT
entity_type: string, not null
entity_id: uuid, not null
old_values: json, nullable
new_values: json, nullable
ip_address: string, nullable
user_agent: string, nullable
occurred_at: timestamp, not null
```

---

## 4. API Contracts

### Implemented (Sprint 1)
```
POST /api/register
  Auth: none
  Request:  { name: string, email: string, password: string, password_confirmation: string, role: "admin"|"purchasing_manager"|"warehouse_staff" }
  Response 201: { token: string, user: {...} }
  Response 422: { message: string, errors: { [field]: string[] } }

POST /api/login
  Auth: none
  Request:  { email: string, password: string, remember?: boolean }
  Response 200: <User JSON>
  Response 422: { message: string, errors: { email: ["These credentials do not match our records."] } }

POST /api/logout
  Auth: sanctum
  Response 204: no content

GET /api/user
  Auth: sanctum
  Response 200: <User JSON>
  Response 401: { message: "Unauthenticated." }
```

### Planned (Sprint 2 — per commented routes in routes/api.php)
```
GET  /api/categories                 Auth: sanctum (any role)
GET  /api/categories/{category}      Auth: sanctum (any role)
POST /api/categories                 Auth: sanctum + role:admin,purchasing_manager
PUT  /api/categories/{category}      Auth: sanctum + role:admin,purchasing_manager
DELETE /api/categories/{category}    Auth: sanctum + role:admin,purchasing_manager

GET  /api/products                   Auth: sanctum (any role)
GET  /api/products/{product}         Auth: sanctum (any role)
POST /api/products                   Auth: sanctum + role:admin,purchasing_manager
PUT  /api/products/{product}         Auth: sanctum + role:admin,purchasing_manager
DELETE /api/products/{product}       Auth: sanctum + role:admin,purchasing_manager

GET  /api/lots                       Auth: sanctum (any role)
GET  /api/lots/{lot}                 Auth: sanctum (any role)
POST /api/lots                       Auth: sanctum + role:admin,purchasing_manager
PUT  /api/lots/{lot}                 Auth: sanctum + role:admin,purchasing_manager
DELETE /api/lots/{lot}               Auth: sanctum + role:admin,purchasing_manager
```
All list endpoints: standard Laravel pagination (`?page=`), Resource-wrapped response `{ data: [...], meta: {...} }` per AGENTS.md API convention. 🚧 OPEN QUESTION: exact per-field validation rules for Product/Lot (e.g. max lengths, barcode format) not yet specified — define in FormRequest classes and backfill into this spec once written, don't invent them ad hoc in the controller.

### Not yet routed (Sprints 2–5, requirement-level only — do not implement against this table alone)
```
POST /api/inventory-transactions
GET  /api/inventory-transactions
GET  /api/inventory-transactions/{transaction}
GET  /api/audit-logs
GET  /api/inventory-snapshots
GET  /api/inventory-snapshots/{product}
POST /api/products/{product}/reserve
POST /api/products/{product}/release
GET  /api/inventory-classifications
POST /api/inventory-classifications/recompute
GET/POST /api/reorder-configs
GET/PUT/DELETE /api/reorder-configs/{product}
GET  /api/alerts/reorder
GET  /api/alerts/expiry
GET/POST /api/cycle-counts
GET  /api/cycle-counts/{count}
GET  /api/reports/turnover
GET  /api/reports/variance
GET  /api/alerts/history
```
Full request/response shapes for these are 🚧 OPEN — write them into this spec (§4) before starting the corresponding sprint, not while coding it.

---

## 5. Edge Cases & Error Handling

| Case | Behavior |
|---|---|
| Two simultaneous SALE transactions on the last unit of a lot | Row-level lock on `inventory_snapshots` ensures only one succeeds; the other gets 422 `INSUFFICIENT_STOCK`. (FR-22, FR-23) |
| Registration with an already-registered email | 422, field-level error on `email` (`unique:users,email` — already implemented). |
| Category slug collision after soft-delete | New record created, not auto-revived (FR-9). Explicit restore endpoint required to reuse. |
| Product created with `category_id` pointing to a soft-deleted Category | 🚧 OPEN QUESTION: not yet decided whether this should be allowed (category still valid as an FK target) or rejected. Flag before Sprint 2 sign-off. |
| Lot created with `expiry_date` in the past | 🚧 OPEN QUESTION: not yet decided whether this is rejected (422) or allowed (e.g. backfilling historical data). |
| Non-admin/non-purchasing_manager attempts write on Category/Product/Lot | 403 via `role` middleware. |
| Unauthenticated request to any `auth:sanctum` route | 401. |
| CSRF cookie not fetched before a state-changing request | 419 (Sanctum default). |

---

## 6. Non-Functional Constraints
- Auth model: Sanctum SPA cookie session, `stateful` domains per `config/sanctum.php`.
- No Repository layer — Eloquent Model is the abstraction (per AGENTS.md/repo convention).
- All business logic lives in Service classes, not Controllers (per AGENTS.md).
- All input validation via FormRequest classes, not inline controller validation.
- Non-standard PKs (`sku_id`, `lot_id`) require explicit `protected $primaryKey` declarations on every model touching those tables — missing this breaks `HasUuids`, `find()`, and route-model binding silently.

---

## 7. Acceptance Criteria (sample — expand per requirement as each is implemented)

```
FR-7: THE SYSTEM SHALL restrict Category write operations to admin and purchasing_manager roles.
  Given a user with role warehouse_staff, authenticated
  When they POST /api/categories with a valid payload
  Then the response is 403
  And no category row is created

FR-22: WHEN a SALE transaction is inserted THE SYSTEM SHALL decrement qty_available under row-level lock.
  Given a product with inventory_snapshots.qty_available = 1
  When two concurrent POST /api/inventory-transactions requests each submit a SALE of qty 1 for that product
  Then exactly one succeeds with 201
  And the other fails with 422 INSUFFICIENT_STOCK
  And qty_available is 0, not negative
```
Remaining FR-1 through FR-31 acceptance criteria: 🚧 to be written as each is implemented, not batched in advance — writing acceptance criteria for unbuilt Sprint 4/5 endpoints now would itself be guessing at their final shape.

---

## 8. Assumptions
- `users.id` staying `bigint` (not UUID as blueprint specifies) is treated as an accepted, already-shipped deviation from the blueprint, not a bug to fix — flagged in §3 for team sign-off rather than silently accepted.
- `admin` and `purchasing_manager` share identical write permissions on Category/Product/Lot (PRD §9 assumption, not yet explicitly confirmed by team).
- Pagination and Resource-wrapped JSON shape follow the AGENTS.md convention (`{ data, message, meta }`) for all new list/show endpoints.

## 9. Open Questions
- 🚧 `onDelete` behavior for Lot when parent Product is deleted (FR-18).
- 🚧 `received_date` type: `dateTime` (migration) vs `date` (blueprint) (FR-19).
- 🚧 `order_cost` / `holding_cost_per_unit` sourcing for EOQ, given pricing is out-of-scope (FR-29).
- 🚧 Whether a soft-deleted Category can still be referenced by new Products (§5).
- 🚧 Whether past-dated `expiry_date` on Lot creation is rejected or allowed (§5).
- 🚧 Category restore endpoint (FR-9) — confirm it's in Sprint 2 scope.
- 🚧 Users table UUID vs bigint deviation from blueprint (§3, §8) — needs explicit team sign-off, not silent acceptance.

## 10. Changelog
- 2026-08-01 — Initial spec drafted from Blueprint doc, existing migrations/models, routes/api.php, and AGENTS.md conventions.
