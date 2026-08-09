# ERD — Doraemon's Pocket

> Last updated: 2026-08-04
> `(impl.)` = migration exists | `(planned)` = not yet migrated
> ⚠️ Non-standard PKs (`sku_id`, `lot_id`) require explicit
> `protected $primaryKey` on every model — missing it silently breaks
> `find()` and route-model binding.

---

## Entity Relationship Diagram

```
┌─────────────┐       ┌──────────────────┐       ┌──────────────────────┐
│    users    │       │    categories    │       │       products       │
│─────────────│       │──────────────────│       │──────────────────────│
│ id (PK) *¹  │       │ id UUID (PK)     │◄──────│ sku_id UUID (PK) ⚠️  │
│ name        │       │ name             │       │ category_id UUID (FK)│
│ email       │       │ slug             │       │ name                 │
│ password    │       │ created_at       │       │ description          │
│ role        │       │ updated_at       │       │ barcode              │
│ created_at  │       │ deleted_at       │       │ unit_of_measure      │
│ updated_at  │       └──────────────────┘       │ is_seasonal          │
└──────┬──────┘                                  │ shelf_life_days      │
       │                                         │ is_active            │
       │ actor_id                                │ created_at           │
       │                                         │ updated_at           │
       ▼                                         └────────┬─────────────┘
┌──────────────────────────┐                             │ sku_id
│   inventory_transactions │                             ▼
│   (planned — Sprint 2)   │              ┌──────────────────────┐
│──────────────────────────│              │         lots         │
│ txn_id UUID (PK)         │◄─────────────│ lot_id UUID (PK) ⚠️  │
│ lot_id UUID (FK)         │  lot_id      │ sku_id UUID (FK)     │
│ txn_type enum            │              │ received_date *²     │
│ qty_delta integer        │              │ expiry_date date      │
│ occurred_at timestamp    │              │ bin_location string   │
│ actor_id FK → users.id   │              │ created_at           │
└──────────────────────────┘              │ updated_at           │
                                          └──────────────────────┘
                                                     │ sku_id
                                                     ▼
                                    ┌─────────────────────────────┐
                                    │    inventory_snapshots      │
                                    │    (planned — Sprint 3)     │
                                    │─────────────────────────────│
                                    │ sku_id UUID (PK, FK)        │
                                    │ qty_on_hand integer         │
                                    │ qty_reserved integer        │
                                    │ qty_available integer       │
                                    │ last_updated timestamp      │
                                    └─────────────────────────────┘

┌──────────────────────────┐    ┌──────────────────────────┐
│     reorder_configs      │    │        audit_logs        │
│  (planned — Sprint 4)    │    │ (impl. schema/read API;  │
│──────────────────────────│    │ automatic logging pending)│
│ sku_id UUID (PK, FK)     │    │ audit_id UUID (PK)       │
│ reorder_point integer    │    │ actor_id FK → users.id   │
│ safety_stock integer     │    │ action string            │
│ lead_time_days integer   │    │ entity_type string       │
└──────────────────────────┘    │ entity_id string         │
                                │ old_values jsonb         │
                                │ new_values jsonb         │
                                │ occurred_at timestamp    │
                                └──────────────────────────┘
```

---

## Schema Reference

### users (impl.)

| Column            | Type      | Notes                                                                                 |
| ----------------- | --------- | ------------------------------------------------------------------------------------- |
| id                | bigint PK | auto-incrementing; intentional choice for internal user/actor references in this single-warehouse project |
| name              | string    | not null                                                                              |
| email             | string    | unique, not null                                                                      |
| email_verified_at | timestamp | nullable                                                                              |
| password          | string    | not null, hashed                                                                      |
| remember_token    | string    | nullable                                                                              |
| role              | string    | enum: `admin` \| `purchasing_manager` \| `warehouse_staff`, default `warehouse_staff` |
| created_at        | timestamp |                                                                                       |
| updated_at        | timestamp |                                                                                       |

### categories (impl.)

| Column     | Type      | Notes                   |
| ---------- | --------- | ----------------------- |
| id         | uuid PK   |                         |
| name       | string    | not null                |
| slug       | string    | unique, not null        |
| created_at | timestamp |                         |
| updated_at | timestamp |                         |
| deleted_at | timestamp | nullable — soft deletes |

### products (impl.)

| Column          | Type      | Notes                                                        |
| --------------- | --------- | ------------------------------------------------------------ |
| sku_id          | uuid PK   | ⚠️ Non-standard — `$primaryKey = 'sku_id'` required on Model |
| category_id     | uuid FK   | → categories.id, indexed                                     |
| name            | string    | not null                                                     |
| description     | string    | nullable                                                     |
| barcode         | string    | nullable                                                     |
| unit_of_measure | string    | not null                                                     |
| is_seasonal     | boolean   | default false                                                |
| shelf_life_days | integer   | nullable                                                     |
| is_active       | boolean   | default true                                                 |
| created_at      | timestamp |                                                              |
| updated_at      | timestamp |                                                              |

No price/cost/valuation field — deliberate non-goal.

### lots (impl.)

| Column        | Type      | Notes                                                                |
| ------------- | --------- | -------------------------------------------------------------------- |
| lot_id        | uuid PK   | ⚠️ Non-standard — `$primaryKey = 'lot_id'` required on Model         |
| sku_id        | uuid FK   | → products.sku_id, indexed                                           |
| received_date | dateTime  | not null — precise physical receipt time; intentional dateTime decision (resolved 2026-08-09) |
| expiry_date   | date      | nullable — drives FEFO ordering                                      |
| bin_location  | string    | not null                                                             |
| created_at    | timestamp |                                                                      |
| updated_at    | timestamp |                                                                      |

Deletion behavior: restrict Product deletion while Lots reference it (intentional; preserves inventory traceability).

### inventory_transactions (implemented — Sprint 2)

| Column      | Type      | Notes                                                           |
| ----------- | --------- | --------------------------------------------------------------- |
| txn_id      | uuid PK   |                                                                 |
| lot_id      | uuid FK   | → lots.lot_id                                                   |
| txn_type    | enum      | `RECEIPT`, `RESERVE`, `PICK`, `SALE`, `ADJUSTMENT`, `WRITE_OFF` |
| qty_delta   | integer   | signed — positive for RECEIPT, negative for SALE/PICK/WRITE_OFF |
| occurred_at | timestamp | not null, default now()                                         |
| actor_id    | FK        | → users.id — set server-side, never client-supplied             |

Append-only: no UPDATE/DELETE route ever exposed.

### inventory_snapshots (planned — Sprint 3)

| Column        | Type      | Notes                                                 |
| ------------- | --------- | ----------------------------------------------------- |
| sku_id        | uuid PK   | FK → products.sku_id                                  |
| qty_on_hand   | integer   | not null, default 0                                   |
| qty_reserved  | integer   | not null, default 0                                   |
| qty_available | integer   | not null, default 0 — derived: on_hand minus reserved |
| last_updated  | timestamp | not null                                              |

Updated only via the transaction-insert path with `lockForUpdate()` — never written directly.

### reorder_configs (planned — Sprint 4)

| Column         | Type    | Notes                |
| -------------- | ------- | -------------------- |
| sku_id         | uuid PK | FK → products.sku_id |
| reorder_point  | integer | not null             |
| safety_stock   | integer | not null             |
| lead_time_days | integer | not null             |

Write: `purchasing_manager` + `admin`. `warehouse_staff` has no access at all (read or write).

### audit_logs (implemented schema and admin read API; automatic logging pending)

| Column      | Type                  | Notes                                      |
| ----------- | --------------------- | ------------------------------------------ |
| audit_id    | uuid PK               | generated server-side; immutable event ID  |
| actor_id    | bigint FK → users.id  | server-side actor; not client-supplied     |
| action      | string                | e.g. `CREATE_PRODUCT`, `UPDATE_LOT`        |
| entity_type | string                | affected resource type                     |
| entity_id   | string                | supports UUID and bigint entity identifiers |
| old_values  | jsonb                 | nullable; state before change              |
| new_values  | jsonb                 | nullable; state after change               |
| occurred_at | timestamp             | event timestamp                            |

Indexes: `(entity_type, entity_id)` and `occurred_at`.

Read: `GET /api/audit-logs` and `GET /api/audit-logs/{audit_log}`, `admin` only. No public create, update, or delete routes. Records are append-only and system-generated; automatic logging of Product, Lot, Category, and User writes remains pending.
