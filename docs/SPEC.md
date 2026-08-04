# SPEC — Doraemon's Pocket (Inventory Management System)

> Status: Draft | Date: 2026-08-01 | Source PRD: PRD.md | Binding for all implementation sessions

This spec is the source of truth for implementation. Where code and spec disagree, that's a bug — fix whichever side is wrong and log it in the Changelog (§10). Where this spec doesn't cover a case, stop and flag it rather than guessing.

---

## 1. Scope of This Spec

Covers Sprint 1 (done) through Sprint 2 (in progress) in full detail, and Sprints 3–6 at requirement-level (to be expanded into their own spec sections as those sprints start). Do not implement Sprint 3+ behavior against this document alone — flag it as unspecified first.

### 1.1 Sprint status source of truth

Per-item status below tracks the **live Excalidraw checklist** (`.excalidraw`), not the static Sprint 7.4 table in the Blueprint doc — the Excalidraw file has per-person WIP/DONE tags that postdate the Blueprint and reflect actual current state:

**Sprint 1 — Foundation & auth**

| Item                                                    | Owner        | Status                                                                                                                               |
| ------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Repo setup, CI, project skeleton                        | Rem          | ✅ DONE                                                                                                                              |
| USER table (id, email, password_hash, role)             | Rem          | ✅ DONE                                                                                                                              |
| Register/login endpoints, session auth                  | Rem          | ✅ DONE                                                                                                                              |
| Role-based route-guarding middleware                    | Rem          | ✅ DONE                                                                                                                              |
| Purchasing Manager / Warehouse Staff / Admin personas   | Cindy & Vane | ✅ DONE (submitted 2026-08-04)                                                                                                       |
| User can/can't-do, UI expectations                      | Cindy & Vane | ✅ DONE (submitted 2026-08-04) — see §2 RBAC subsection below; not yet reflected in `routes/api.php`/`RoleMiddleware`, tracked in §9 |
| Wireframes                                              | Lyll & Larce | ✅ DONE                                                                                                                              |
| Frontend: login/register pages, protected-route wrapper | Lyll & Larce | 🟡 WIP                                                                                                                               |
| Initial DB seeders (users, roles, sample products)      | Rem          | ✅ DONE                                                                                                                              |
| List all endpoints (API contract doc)                   | Rem          | ✅ DONE                                                                                                                              |
| Test: can't hit inventory endpoint unauthenticated      | —            | ⬜ not started                                                                                                                       |

**Sprint 2 — Core ledger** (current sprint)

| Item                                                     | Owner | Status                                                    |
| -------------------------------------------------------- | ----- | --------------------------------------------------------- |
| CATEGORY table + CRUD endpoints                          | Rem   | 🟡 WIP                                                    |
| PRODUCT table + CRUD endpoints                           | Rem   | ✅ DONE _(per checklist — see 🚧 discrepancy note below)_ |
| LOT table + CRUD endpoints                               | Rem   | 🟡 WIP                                                    |
| INVENTORY_TRANSACTION table + append-only write endpoint | —     | ⬜ not started                                            |
| AUDIT_LOG table                                          | —     | ⬜ not started                                            |
| Automatic audit logging middleware/service               | —     | ⬜ not started                                            |
| Frontend: Category Management                            | —     | ⬜ not started                                            |
| Frontend: Product List                                   | —     | ⬜ not started                                            |
| Frontend: Product Form                                   | —     | ⬜ not started                                            |
| Frontend: Lot Management                                 | —     | ⬜ not started                                            |
| Seed realistic inventory data                            | —     | ⬜ not started                                            |
| Test: transaction writes are immutable                   | —     | ⬜ not started                                            |
| Test: audit logs are generated for CRUD operations       | —     | ⬜ not started                                            |

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
- **FR-7** THE SYSTEM SHALL restrict Category write operations (create/update/delete) to the `admin` role only. 🔄 CHANGED 2026-08-04: `purchasing_manager` write access to Category is removed (perms brief: Purchasing Manager can't edit product/category structure) — see FR-32/§9.
- **FR-8** THE SYSTEM SHALL allow any authenticated role to read Category (list/show).
- **FR-9** WHEN a Category is soft-deleted and a new Category is created with a slug matching the soft-deleted one THE SYSTEM SHALL create a new record, NOT auto-revive the soft-deleted one. Reviving a soft-deleted Category requires an explicit `POST /api/categories/{category}/restore` endpoint. 🚧 OPEN QUESTION: this restore endpoint is not yet built — confirm it's in Sprint 2 scope before Sprint 2 is marked done.

### Product (Sprint 2 — in progress)

- **FR-10** THE SYSTEM SHALL support full CRUD on Product via `/api/products` and `/api/products/{product}`.
- **FR-11** THE SYSTEM SHALL restrict Product write operations to the `admin` role only. 🔄 CHANGED 2026-08-04: `purchasing_manager` write access to Product is removed, same rationale as FR-7 — see FR-32/§9.
- **FR-12** THE SYSTEM SHALL allow any authenticated role to read Product.
- **FR-13** IF a Product's `category_id` does not reference an existing Category THEN THE SYSTEM SHALL return 422.
- **FR-14** THE SYSTEM SHALL NOT expose any price, cost, or valuation field on Product (non-goal, Blueprint §4.1).

### Lot (Sprint 2 — in progress)

- **FR-15** THE SYSTEM SHALL support full CRUD on Lot via `/api/lots` and `/api/lots/{lot}`.
- **FR-16** THE SYSTEM SHALL restrict Lot write operations to `admin` and `warehouse_staff` roles — a Lot record represents a physical receipt event owned by Warehouse Staff, with Admin retaining correction/oversight access. `purchasing_manager` is read-only on Lot, consistent with not performing physical stock movements. 🔄 CHANGED 2026-08-04. 🚧 Inferred: the perms brief never names `Lot` directly — see FR-33/§9.
- **FR-17** THE SYSTEM SHALL allow any authenticated role to read Lot.
- **FR-18** 🚧 OPEN QUESTION: `onDelete` behavior when a Lot's parent Product is deleted — no default currently specified in the migration (`constrained()` defaults to `restrict` under Laravel unless overridden). Confirm with the team whether deleting a Product with active Lots should be blocked (restrict — current implicit behavior) or cascade. Do not change migration behavior without this confirmation.
- **FR-19** 🚧 OPEN QUESTION: `received_date` type mismatch — migration defines `dateTime`, Blueprint §4.1 ERD text says `date`. Resolve before Sprint 2 sign-off; this spec currently treats the migration (`dateTime`) as authoritative since it's the implemented artifact, but flags it for review.

### Inventory Transaction Ledger (Sprint 2, not yet started)

- **FR-20** THE SYSTEM SHALL record every stock movement as an append-only row in `inventory_transactions` with `txn_type` in (`RECEIPT`, `RESERVE`, `PICK`, `SALE`, `ADJUSTMENT`, `WRITE_OFF`), a signed `qty_delta`, `occurred_at`, and `actor_id` set from the authenticated session — never a client-supplied actor_id. THE SYSTEM SHALL restrict `POST` access to `warehouse_staff` and `admin` (superuser — same permission, not a separate tier); `purchasing_manager` has read-only access to the ledger. 🔄 CHANGED 2026-08-04 — see FR-34/§9.
- **FR-21** THE SYSTEM SHALL NOT expose any UPDATE or DELETE route for `inventory_transactions`. Only `POST` (create) and `GET` (read) are permitted.
- **FR-22** WHEN an `inventory_transactions` row of type `SALE` or `PICK` is inserted THE SYSTEM SHALL, within the same database transaction, decrement `qty_available` on the corresponding `inventory_snapshots` row using row-level locking (`SELECT ... FOR UPDATE` or Eloquent's `lockForUpdate()`).
- **FR-23** IF a decrement would take `qty_available` below zero THEN THE SYSTEM SHALL reject the transaction (422) and roll back, rather than allowing negative available stock.

### FEFO Picking (Sprint 2/4)

- **FR-24** THE SYSTEM SHALL order any pick-list query for a given Product by `lots.expiry_date` ascending (nulls last), regardless of `received_date` or insertion order.
- **FR-25** WHEN a Lot's `expiry_date` falls within the configurable expiry window (default 30 days, configurable via `REORDER_CONFIG`-adjacent config, not yet modeled) AND `qty_on_hand` for that lot > 0, THE SYSTEM SHALL surface it in an expiry-alert endpoint. THE SYSTEM SHALL restrict visibility of this endpoint to `purchasing_manager` and `admin`; `warehouse_staff` instead sees expiry risk inline via the FEFO pick list (FR-24), not a separate alert feed. 🔄 CHANGED 2026-08-04, 🚧 inferred — see FR-35/§9.

### Reorder / ROP / EOQ (Sprint 4 — not yet started, requirement-level only)

- **FR-26** THE SYSTEM SHALL compute `ROP = (avg_daily_demand × lead_time_days) + safety_stock` per SKU, reading `lead_time_days` from `reorder_configs`.
- **FR-27** THE SYSTEM SHALL compute `safety_stock = Z × sqrt((lead_time_avg × demand_variance) + (demand_avg^2 × lead_time_variance))` with a configurable Z (default 1.65 for ~95% service level).
- **FR-28** WHERE a Product has `is_seasonal = true` THE SYSTEM SHALL compute its reorder trigger from the same period last year's demand (seasonal index or Holt-Winters decomposition), shifted earlier by `lead_time_days`, rather than a flat trailing average.
- **FR-29** THE SYSTEM SHALL compute `EOQ = sqrt((2 × annual_demand × order_cost) / holding_cost_per_unit)` for non-seasonal items. 🚧 OPEN QUESTION: `order_cost` and `holding_cost_per_unit` are not yet modeled anywhere in the schema — since pricing is explicitly out of scope (PRD non-goal), confirm whether these are (a) hardcoded constants for the demo, (b) added as non-price "operational cost" fields distinct from unit price, or (c) descoped from the EOQ calculation entirely for this project. This blocks FR-29 implementation.

### Reconciliation & Audit (Sprint 5 — not yet started, requirement-level only)

- **FR-30** THE SYSTEM SHALL allow `warehouse_staff` to submit a physical cycle-count / discrepancy flag at the moment it is found, comparing it to `qty_on_hand`. THE SYSTEM SHALL restrict viewing the resulting variance/shrinkage reconciliation report to `admin`, flagging a variance alert when the discrepancy exceeds a configurable threshold (default 5%). 🔄 CHANGED 2026-08-04, 🚧 submit-vs-view role split inferred — see FR-36/§9.
- **FR-31** THE SYSTEM SHALL record every write to `products`, `lots`, `categories`, and `users` to an append-only `audit_logs` table capturing actor, action, entity type/id, old values, new values. THE SYSTEM SHALL restrict read access to `audit_logs` to `admin` only; `purchasing_manager` and `warehouse_staff` SHALL NOT be able to view it. 🔄 CHANGED 2026-08-04 — see FR-37/§9.

### Role-Based Access Control (RBAC) refinement — perms team submission, 2026-08-04

This subsection is the single source of truth for role checks going forward; where it and a per-entity FR above ever drift, this subsection wins.

- **FR-32** THE SYSTEM SHALL restrict write access to `reorder_configs` (reorder_point, safety_stock, lead_time_days) to `purchasing_manager` and `admin` (superuser); `warehouse_staff` SHALL have no access (read or write) to `reorder_configs` or any reorder/EOQ/purchasing-alert endpoint. Admin's reorder-config screen is not part of its default UI, but that's a navigation choice, not a separate permission tier.
- **FR-33** 🚧 PROPOSED, pending team confirmation (the perms brief never names `Lot` directly): Lot write access is `admin` + `warehouse_staff`, per FR-16.
- **FR-34** THE SYSTEM SHALL restrict `POST /api/inventory-transactions` (all txn_types) to `warehouse_staff` and `admin` (superuser); `purchasing_manager` SHALL receive 403 on any write to this endpoint. 🚧 Adopts the stricter reading that "no physical stock movements" blocks all txn_types, not only PICK/RECEIPT — confirm before Sprint 2/4 sign-off.
- **FR-35** THE SYSTEM SHALL restrict read access to `/api/alerts/reorder` and `/api/alerts/expiry` to `purchasing_manager` and `admin`; `warehouse_staff` SHALL NOT see these alerts.
- **FR-36** THE SYSTEM SHALL restrict cycle-count _submission_ (`POST /api/cycle-counts`) to `warehouse_staff`; THE SYSTEM SHALL restrict variance/shrinkage _report_ viewing to `admin`.
- **FR-37** THE SYSTEM SHALL restrict read access to `GET /api/audit-logs` to `admin` only.
- **FR-38** THE SYSTEM SHALL restrict all user-management operations (create/update/deactivate/role-change on `users`, beyond self-registration) to `admin` only.

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

Write access (create/update/delete): `admin` only (FR-7). `purchasing_manager`/`warehouse_staff` read-only. 🔄 CHANGED 2026-08-04.

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

Write access (create/update/delete): `admin` only (FR-11). `purchasing_manager`/`warehouse_staff` read-only. 🔄 CHANGED 2026-08-04.

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

Write access (create/update): `admin` + `warehouse_staff` (FR-16, FR-33). `purchasing_manager` read-only. 🔄 CHANGED 2026-08-04, 🚧 inferred — see §9.

### inventory_transactions (planned — Sprint 2)

```
txn_id: uuid, pk
lot_id: uuid, fk -> lots.lot_id
txn_type: enum(RECEIPT, RESERVE, PICK, SALE, ADJUSTMENT, WRITE_OFF), not null
qty_delta: integer, not null            -- signed; positive for RECEIPT, negative for SALE/PICK/WRITE_OFF
occurred_at: timestamp, not null, default now()
actor_id: fk -> users.id, not null      -- set server-side from auth()->id(), never client-supplied
```

Append-only: no update/delete route exposed (FR-21). Write (POST) access: `warehouse_staff` and `admin` (superuser, same permission — not a separate escalation tier) (FR-20, FR-34); `purchasing_manager` read-only. 🔄 CHANGED 2026-08-04.

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

Write access: `purchasing_manager` and `admin` (superuser) (FR-32); `warehouse_staff` has no access at all (read or write). 🔄 CHANGED 2026-08-04.

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

Read access: `admin` only (FR-31, FR-37). `purchasing_manager`/`warehouse_staff` cannot view. 🔄 CHANGED 2026-08-04.

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
POST /api/categories                 Auth: sanctum + role:admin                    🔄 CHANGED 2026-08-04 (was admin,purchasing_manager)
PUT  /api/categories/{category}      Auth: sanctum + role:admin                    🔄 CHANGED 2026-08-04
DELETE /api/categories/{category}    Auth: sanctum + role:admin                    🔄 CHANGED 2026-08-04

GET  /api/products                   Auth: sanctum (any role)
GET  /api/products/{product}         Auth: sanctum (any role)
POST /api/products                   Auth: sanctum + role:admin                    🔄 CHANGED 2026-08-04 (was admin,purchasing_manager)
PUT  /api/products/{product}         Auth: sanctum + role:admin                    🔄 CHANGED 2026-08-04
DELETE /api/products/{product}       Auth: sanctum + role:admin                    🔄 CHANGED 2026-08-04

GET  /api/lots                       Auth: sanctum (any role)
GET  /api/lots/{lot}                 Auth: sanctum (any role)
POST /api/lots                       Auth: sanctum + role:admin,warehouse_staff     🔄 CHANGED 2026-08-04 (was admin,purchasing_manager), 🚧 inferred
PUT  /api/lots/{lot}                 Auth: sanctum + role:admin,warehouse_staff     🔄 CHANGED 2026-08-04, 🚧 inferred
DELETE /api/lots/{lot}               Auth: sanctum + role:admin,warehouse_staff     🔄 CHANGED 2026-08-04, 🚧 inferred
```

⚠️ `routes/api.php` and `RoleMiddleware` groups still implement the OLD rule (`role:admin,purchasing_manager` on all three resources) as of this spec update — code has not yet been changed to match. Do not treat this table as reflecting current running behavior until that follow-up lands; see §9.

All list endpoints: standard Laravel pagination (`?page=`), Resource-wrapped response `{ data: [...], meta: {...} }` per AGENTS.md API convention. 🚧 OPEN QUESTION: exact per-field validation rules for Product/Lot (e.g. max lengths, barcode format) not yet specified — define in FormRequest classes and backfill into this spec once written, don't invent them ad hoc in the controller.

### Not yet routed (Sprints 2–5, requirement-level only — do not implement against this table alone)

```
POST /api/inventory-transactions             role:warehouse_staff,admin                          FR-20, FR-34
GET  /api/inventory-transactions             role: any (all authenticated roles read; admin is a superuser everywhere, not called out per-line below)
GET  /api/inventory-transactions/{transaction} role: any
GET  /api/audit-logs                         role:admin                                          FR-31, FR-37
GET  /api/inventory-snapshots                role: any
GET  /api/inventory-snapshots/{product}      role: any
POST /api/products/{product}/reserve         role:warehouse_staff,admin
POST /api/products/{product}/release         role:warehouse_staff,admin
GET  /api/inventory-classifications          role: any
POST /api/inventory-classifications/recompute role:admin,purchasing_manager
GET/POST /api/reorder-configs                role:purchasing_manager,admin; warehouse_staff: no access  FR-32
GET/PUT/DELETE /api/reorder-configs/{product} role:purchasing_manager,admin; warehouse_staff: no access
GET  /api/alerts/reorder                     role:purchasing_manager,admin                       FR-35
GET  /api/alerts/expiry                      role:purchasing_manager,admin                       FR-25, FR-35
GET/POST /api/cycle-counts                   role:warehouse_staff (POST/submit); admin (GET/view report)  FR-30, FR-36
GET  /api/cycle-counts/{count}                role:warehouse_staff,admin
GET  /api/reports/turnover                    role:admin
GET  /api/reports/variance                    role:admin                                          FR-16, FR-36
GET  /api/alerts/history                      role:purchasing_manager,admin
```

Full request/response shapes for these are 🚧 OPEN — write them into this spec (§4) before starting the corresponding sprint, not while coding it.

---

## 5. Edge Cases & Error Handling

| Case                                                                                              | Behavior                                                                                                                                            |
| ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Two simultaneous SALE transactions on the last unit of a lot                                      | Row-level lock on `inventory_snapshots` ensures only one succeeds; the other gets 422 `INSUFFICIENT_STOCK`. (FR-22, FR-23)                          |
| Registration with an already-registered email                                                     | 422, field-level error on `email` (`unique:users,email` — already implemented).                                                                     |
| Category slug collision after soft-delete                                                         | New record created, not auto-revived (FR-9). Explicit restore endpoint required to reuse.                                                           |
| Product created with `category_id` pointing to a soft-deleted Category                            | 🚧 OPEN QUESTION: not yet decided whether this should be allowed (category still valid as an FK target) or rejected. Flag before Sprint 2 sign-off. |
| Lot created with `expiry_date` in the past                                                        | 🚧 OPEN QUESTION: not yet decided whether this is rejected (422) or allowed (e.g. backfilling historical data).                                     |
| Non-admin attempts write on Category/Product                                                      | 403 via `role` middleware (🔄 CHANGED 2026-08-04 — previously admin+purchasing_manager, now admin only; FR-7, FR-11).                               |
| Purchasing Manager or non-admin/non-warehouse_staff attempts write on Lot                         | 403 via `role` middleware (🔄 CHANGED 2026-08-04; FR-16, FR-33).                                                                                    |
| Purchasing Manager attempts `POST /api/inventory-transactions`                                    | 403 via `role` middleware — Purchasing Manager performs no physical stock movements (FR-20, FR-34).                                                 |
| Warehouse Staff attempts `GET /api/reorder-configs` or `/api/alerts/reorder`/`/api/alerts/expiry` | 403, or endpoint hidden client-side — reorder/EOQ/purchasing alerts are out of scope for Warehouse Staff (FR-32, FR-35).                            |
| Purchasing Manager or Warehouse Staff attempts `GET /api/audit-logs`                              | 403 — audit log is Admin-only (FR-31, FR-37).                                                                                                       |
| Purchasing Manager or Warehouse Staff attempts any user-management endpoint                       | 403 — user management is Admin-only (FR-38).                                                                                                        |
| Unauthenticated request to any `auth:sanctum` route                                               | 401.                                                                                                                                                |
| CSRF cookie not fetched before a state-changing request                                           | 419 (Sanctum default).                                                                                                                              |

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
FR-7: THE SYSTEM SHALL restrict Category write operations to the admin role only.
  Given a user with role purchasing_manager, authenticated
  When they POST /api/categories with a valid payload
  Then the response is 403
  And no category row is created
  (warehouse_staff gets the same 403 — unchanged from before 2026-08-04)

FR-34: THE SYSTEM SHALL restrict POST /api/inventory-transactions to warehouse_staff.
  Given a user with role purchasing_manager, authenticated
  When they POST /api/inventory-transactions with a valid PICK payload
  Then the response is 403
  And no inventory_transactions row is created

FR-32: THE SYSTEM SHALL restrict reorder_configs write access to purchasing_manager.
  Given a user with role warehouse_staff, authenticated
  When they GET or POST /api/reorder-configs
  Then the response is 403

FR-22: WHEN a SALE transaction is inserted THE SYSTEM SHALL decrement qty_available under row-level lock.
  Given a product with inventory_snapshots.qty_available = 1
  When two concurrent POST /api/inventory-transactions requests each submit a SALE of qty 1 for that product
  Then exactly one succeeds with 201
  And the other fails with 422 INSUFFICIENT_STOCK
  And qty_available is 0, not negative
```

Remaining FR-1 through FR-38 acceptance criteria: 🚧 to be written as each is implemented, not batched in advance — writing acceptance criteria for unbuilt Sprint 4/5 endpoints now would itself be guessing at their final shape.

---

## 8. Assumptions

- `users.id` staying `bigint` (not UUID as blueprint specifies) is treated as an accepted, already-shipped deviation from the blueprint, not a bug to fix — flagged in §3 for team sign-off rather than silently accepted.
- ✅ RESOLVED 2026-08-04 (was: `admin` and `purchasing_manager` share identical write permissions on Category/Product/Lot): they no longer do. `admin` alone writes Category/Product; `admin` + `warehouse_staff` write Lot; `purchasing_manager` writes `reorder_configs` and reads everything else. See §2 RBAC refinement (FR-32–FR-38) and §4.
- Pagination and Resource-wrapped JSON shape follow the AGENTS.md convention (`{ data, message, meta }`) for all new list/show endpoints.

## 9. Open Questions

- 🚧 `onDelete` behavior for Lot when parent Product is deleted (FR-18).
- 🚧 `received_date` type: `dateTime` (migration) vs `date` (blueprint) (FR-19).
- 🚧 `order_cost` / `holding_cost_per_unit` sourcing for EOQ, given pricing is out-of-scope (FR-29).
- 🚧 Whether a soft-deleted Category can still be referenced by new Products (§5).
- 🚧 Whether past-dated `expiry_date` on Lot creation is rejected or allowed (§5).
- 🚧 Category restore endpoint (FR-9) — confirm it's in Sprint 2 scope.
- 🚧 Users table UUID vs bigint deviation from blueprint (§3, §8) — needs explicit team sign-off, not silent acceptance.
- 🚧 **Lot write ownership (FR-16, FR-33):** the perms team's role brief never names the `Lot` entity directly. This spec infers `admin` + `warehouse_staff` write access from "Warehouse logs receipts in real time" + "Purchasing Manager can't perform physical stock movements." Confirm with the perms team before implementing.
- 🚧 **Scope of Purchasing Manager's "no physical stock movements" (FR-20, FR-34):** does it block all `inventory_transactions` txn_types (RECEIPT/PICK/SALE/ADJUSTMENT/WRITE_OFF), or only the two named as examples (PICK/RECEIPT)? This spec adopts the stricter all-txn-types reading. Confirm before Sprint 2/4 sign-off.
- 🚧 **Cycle-count submit-vs-view split (FR-30, FR-36):** inferred by combining "Warehouse flags discrepancies at the moment they're found" with "Admin gets variance/shrinkage reports" — not stated explicitly as two separate steps. Confirm before Sprint 5.
- ✅ RESOLVED 2026-08-04: Admin's exclusion from daily picking/reorder-config is UI-only, not a backend permission distinction. `RoleMiddleware` grants `admin` an unconditional pass regardless of a route's role list, and `CategoryPolicy`/`ProductPolicy`/`LotPolicy` each grant `admin` via a `before()` hook. Admin is a plain superuser — there is no separate "escalation" access tier anywhere in the implementation. "Admin doesn't do daily picking/reorder config" is purely which screen the frontend defaults Admin to.
- ✅ RESOLVED 2026-08-04: `routes/api.php`, `RoleMiddleware`, and the Category/Product/Lot Policies have been updated to match — Category/Product writes are `role:admin`, Lot writes are `role:admin,warehouse_staff`, and the corresponding Policy `create`/`update`/`delete` methods were updated to match (Category/Product: admin-only via `before()`, non-admin always `false`; Lot: `warehouse_staff`, with admin via `before()`). Covered by `tests/Feature/CategoryProductLotCrudTest.php` and `tests/Feature/RoleMiddlewareTest.php` (14 tests, all passing). FR-32–FR-38's ledger/reorder_configs/audit_logs/user-management endpoints remain unbuilt (Sprint 4/5), so those routes/policies don't exist yet to update — tracked as before, just no longer blocked on this RBAC decision.

## 10. Changelog

- 2026-08-01 — Initial spec drafted from Blueprint doc, existing migrations/models, routes/api.php, and AGENTS.md conventions.
- 2026-08-04 — RBAC refinement per perms team's role-brief submission (Warehouse Staff / Purchasing Manager / Admin can/can't-do + UI expectations). Category/Product write narrowed from `admin,purchasing_manager` to `admin` only (FR-7, FR-11). Lot write reassigned from `admin,purchasing_manager` to `admin,warehouse_staff` (FR-16, FR-33 — inferred, Lot not named explicitly in the brief). `inventory_transactions` POST restricted to `warehouse_staff` + `admin` (FR-20, FR-34); `purchasing_manager` read-only. Added FR-32–FR-38 covering `reorder_configs` write (purchasing_manager + admin), alert visibility (purchasing_manager+admin, not warehouse_staff), cycle-count submit-vs-view split (warehouse_staff submits, admin views report), `audit_logs` read (admin only), and user management (admin only).
- 2026-08-04 — Simplified Admin's permission model from a documented "escalation-only, not primary UI" access tier to a plain backend superuser: `admin` passes every role check unconditionally. Removed the escalation-path language from FR-7/FR-11/FR-16/FR-20/FR-32/FR-34 and the API contract table.
- 2026-08-04 — **Implemented in code:** `app/Http/Middleware/RoleMiddleware.php` now short-circuits to allow `role === 'admin'` before checking the route's role list. `routes/api.php` split the old `role:admin,purchasing_manager` write group into `role:admin` (Category/Product) and `role:admin,warehouse_staff` (Lot). `App\Policies\CategoryPolicy`, `ProductPolicy`, and `LotPolicy` updated to match (Category/Product `create`/`update`/`delete` now `false` for non-admin; Lot now checks `warehouse_staff` instead of `purchasing_manager`), since those Policies are a second, independent authorization layer invoked from each `FormRequest::authorize()` and had been overlooked in the first pass of this change. Added `tests/Feature/RoleMiddlewareTest.php` (admin-bypass-when-not-listed, non-admin-outside-list-forbidden, non-admin-inside-list-allowed, guest-401) and rewrote `tests/Feature/CategoryProductLotCrudTest.php` for the new role assignments. Full suite: 16 tests, 38 assertions, passing.
