# Sprint 2 — Core Ledger

> Status: 🟡 In Progress | Current sprint

---

| Item                                                        | Owner | Status                                                               |
| ----------------------------------------------------------- | ----- | -------------------------------------------------------------------- |
| CATEGORY table + CRUD endpoints                            | Rem   | ✅ DONE — `CategoryProductLotCrudTest`                              |
| CATEGORY restore endpoint                                   | Rem   | ✅ DONE — Admin-only explicit restore required by `SPEC.md` FR-9  |
| PRODUCT table + CRUD endpoints                             | Rem   | ✅ DONE — `CategoryProductLotCrudTest`                              |
| LOT table + CRUD endpoints                                 | Rem   | ✅ DONE — `CategoryProductLotCrudTest`                              |
| LOT validation decisions and regression coverage           | Rem   | ✅ DONE (2026-08-09) — `CategoryProductLotCrudTest`                 |
| INVENTORY_TRANSACTION table + append-only write endpoint   | Rem   | ✅ DONE (2026-08-07)                                                 |
| AUDIT_LOG schema + admin-only read API                      | Rem   | ✅ DONE (2026-08-09) — `AuditLogTest` (5 tests, 28 assertions)       |
| Automatic audit logging middleware/service                  | —     | ⬜ not started                                                       |
| Frontend: Category Management                              | —     | ⬜ not started                                                       |
| Frontend: Product List                                     | —     | ⬜ not started                                                       |
| Frontend: Product Form                                     | —     | ⬜ not started                                                       |
| Frontend: Lot Management                                   | —     | ⬜ not started                                                       |
| Seed realistic inventory data                              | —     | ⬜ not started                                                       |
| Test: transaction writes are immutable (no PUT/PATCH/DELETE) | Rem | ✅ DONE — `InventoryTransactionTest` (25 tests, 80 assertions)       |
| Test: audit logs are generated for CRUD operations         | —     | ⬜ not started                                                       |

---

## Review Corrections

The previous Product CRUD discrepancy note was stale. `routes/api.php` exposes
live Category, Product, and Lot resource routes; the corresponding controllers
implement CRUD methods; and `CategoryProductLotCrudTest` passes 10 tests with
31 assertions. Category and Lot CRUD are therefore complete at the endpoint
and test-coverage level. Remaining gaps are tracked separately above rather
than being represented as generic CRUD WIP.

`InventoryTransactionTest` passes 24 tests with 67 assertions. The test suite
confirms authenticated read access, Admin/Warehouse Staff append access,
Purchasing Manager write denial, and the absence of PUT/PATCH/DELETE routes.

---

## OQ-7 and OQ-8 Resolution

OQ-7 and OQ-8 are resolved and no longer block Sprint 2:

- OQ-7: Soft-deleted Categories cannot be assigned to new or updated Products; existing relationships remain readable; explicit Admin restoration is required before reuse.
- OQ-8: Normal Lot create/update flows reject `expiry_date` before today with 422 and retain nullable expiry dates. Historical expired Lots require a future explicit backfill/import workflow.

`inventory_transactions` now uses the six explicit specification types:
`RECEIPT`, `RESERVE`, `PICK`, `SALE`, `ADJUSTMENT`, and `WRITE_OFF`.
`InventoryTransactionTest` covers acceptance of all six types while preserving
append-only behavior. Snapshot-side effects remain deferred to Sprint 3.
