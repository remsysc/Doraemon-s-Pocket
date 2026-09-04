# Sprint 2 — Core Ledger

> Status: ✅ Complete | Completed: 2026-08-23

Sprint 2 delivers the catalog, lot, append-only inventory ledger, audit read path, automatic model-write auditing, frontend ledger/catalog screens, and repeatable demo inventory data.

| Item | Owner | Status |
| --- | --- | --- |
| Category table + CRUD endpoints | Rem | ✅ Done — `CategoryProductLotCrudTest` |
| Category restore endpoint | Rem | ✅ Done — Admin-only restore |
| Product table + CRUD endpoints | Rem | ✅ Done — `CategoryProductLotCrudTest` |
| Lot table + CRUD endpoints | Rem | ✅ Done — `CategoryProductLotCrudTest` |
| Lot validation decisions and regression coverage | Rem | ✅ Done — OQ-7/OQ-8 resolved |
| Inventory transaction table + append-only write endpoint | Rem | ✅ Done — all six transaction types |
| Audit-log schema + Admin-only read API | Rem | ✅ Done — `AuditLogTest` |
| Automatic audit logging | Rem | ✅ Done — `AuditObserver` + `AuditLogService` for Product, Lot, Category, and User |
| Frontend Category/Product/Lot screens | Lyll & Larce | ✅ Done |
| Frontend transaction ledger UI | Lyll & Larce | ✅ Done |
| Repeatable realistic inventory seed data | Rem | ✅ Done — 24 deterministic transactions across 8 products |
| Transaction append-only regression coverage | Rem | ✅ Done — no PUT/PATCH/DELETE routes |
| Audit generation and redaction regression coverage | Rem | ✅ Done — authenticated writes audited; sensitive User fields excluded |

## Seed data

`DatabaseSeeder` creates the three demo users, the complete 4-category/8-product/16-lot catalog, and 24 deterministic inventory transactions. The transaction seed covers `RECEIPT`, `RESERVE`, `PICK`, `SALE`, `ADJUSTMENT`, and `WRITE_OFF`, uses the existing `occurred_at` schema spelling, and is repeatable through fixed transaction UUIDs.

Bootstrap seed writes are intentionally not audited. Authenticated business writes are audited with the server-side actor; temporary unauthenticated registration is not audited until registration is replaced by Admin-only user management.

## Completion evidence

- `tests/Feature/CategoryProductLotCrudTest.php`
- `tests/Feature/InventoryTransactionTest.php`
- `tests/Feature/AuditLogTest.php`
- `tests/Feature/CatalogSeederTest.php`
- `tests/Feature/AuthRegistrationTest.php`

Sprint 3 is planned next. Inventory snapshot side effects, row-level locking, reservation semantics, and oversell prevention were deliberately deferred and are not part of Sprint 2 completion.
