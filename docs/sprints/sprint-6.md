# Sprint 6 — Hardening, Data Management & Demo

> Status: ⚠️ Main scope implemented; PO-trends analytics and demo-seed fidelity remain follow-ups.
> Depends on: Sprint 5 Reconciliation, Reports & User Management ✅ Complete
> Overall sprint status is maintained in [`sprints.md`](sprints.md); this file is the detailed implementation record.

## Goal

Harden the application for stakeholder demonstration by validating RBAC, reviewing list-query eager loading, documenting the demo flow, and adding CSV data-management workflows. The implemented imports cover Categories, Products, Lots, Suppliers, Purchase Orders, and Cycle Counts; the append-only Inventory Ledger is export-only. Demo seed fidelity and PO analytics remain follow-ups.

Implements the final QA, data administration, and deployment-readiness requirements for the project.

## Scope checklist

| Item                                                                 | Status                                                                                                                                                                |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E2E Demo Flow documented (current seed/workflow gaps called out)     | ✅ Complete (`docs/demo/DEMO_FLOW.md`)                                                                                                                                |
| Supplier Management CRUD (Admin/PM)                                  | ✅ Complete (`SupplierController`, `Suppliers.tsx`)                                                                                                                   |
| Purchase Order Lifecycle (`draft`, `ordered`, `received`)            | ✅ Complete (`PurchaseOrderController`, `PurchaseOrders.tsx`)                                                                                                         |
| System-Wide Data Management (Bulk import/export)                     | ✅ Complete (`DataManagementController`, `DataManagement.tsx`)                                                                                                        |
| Smart Analytics & Visualizations (Admin & PM Dashboards)             | ⚠️ Partial: Admin turnover/shrinkage and PM ABC/XYZ charts exist; PO trends are still a placeholder (`DashboardCharts.tsx`)                                           |
| Role-guard coverage for implemented Sprint 6 endpoints (FR-32–FR-41) | ✅ Complete (`RbacSprintSixTest.php`, `DataManagementTest.php`)                                                                                                       |
| Demo seed data expanded                                              | ⚠️ Seeders exist, but thermostat count and near-expiry filter data do not match the documented scenario (`DatabaseSeeder`, `PurchaseOrderSeeder`, `CycleCountSeeder`) |
| Performance review: N+1 checks and eager loading audit               | ✅ Complete (audited eager-loading across all list endpoints)                                                                                                         |
| Tech debt and auth hardening notes documented                        | ✅ Complete (`docs/tech-debt/auth-hardening.md`, `docs/tech-debt.md`)                                                                                                 |
| EC2 target architecture documented (migration not performed)         | ✅ Documentation complete; migration remains a TODO (`docs/tech-debt.md` §4)                                                                                          |

## Traceable tasks

| Task ID       | Component          | Description                                                                                                                                                                 | Est. | Traces to    | Status                                                                          |
| ------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ------------ | ------------------------------------------------------------------------------- |
| **PO-6.1**    | Schema             | Migrations for `suppliers`, `purchase_orders`, and `purchase_order_items`                                                                                                   | M    | FR-39, FR-40 | ✅ Done                                                                         |
| **PO-6.2**    | Backend            | CRUD endpoints for `/api/suppliers` and `/api/purchase-orders` with role guards                                                                                             | M    | FR-39, FR-40 | ✅ Done                                                                         |
| **PO-6.3**    | Frontend           | Purchasing Manager UI for Supplier tracking and PO generation/status updates                                                                                                | M    | FR-39, FR-40 | ✅ Done                                                                         |
| **CHART-6.1** | Frontend           | Implement interactive charts (Recharts) for Admin (Turnover/Shrinkage) and PM (ABC/XYZ, PO trends)                                                                          | M    | FR-42, FR-43 | ⚠️ Partial — turnover, shrinkage, ABC/XYZ exist; PO trends remain a placeholder |
| **DATA-6.1**  | Backend & Frontend | Create Admin-only bulk import/export endpoints and UI for Master Data (Products, Categories) via CSV                                                                        | S    | NFR          | ✅ Done                                                                         |
| **DEMO-6.1**  | Documentation      | Write demo script/flow showing overstock prevention (Sprint 4), shrinkage resolution (Sprint 5), and concurrency safety (Sprint 3)                                          | S    | PRD §1       | ✅ Done                                                                         |
| **SEED-6.1**  | Seeder             | Expand `DatabaseSeeder` & sub-seeders to ensure the exact state needed for the demo script is present on fresh migrate                                                      | M    | PRD §1       | ⚠️ Seeders exist, but fresh-seed values do not fully match the demo narrative   |
| **TEST-6.1**  | Tests              | Add explicit RBAC tests for implemented role-guarded routes (reorder config, lot writes, ledger writes, reports, user management, suppliers, POs, data import/export)       | M    | FR-32–FR-41  | ✅ Done                                                                         |
| **PERF-6.1**  | Backend            | Audit endpoints to identify and fix N+1 query issues (e.g. `/api/products`, `/api/cycle-counts`, `/api/inventory-transactions`, `/api/purchase-orders`) using eager loading | M    | NFR          | ✅ Done                                                                         |
| **DOC-6.1**   | Documentation      | Create `docs/tech-debt.md` covering Sanctum session hardening, production DB indexing, and scaling considerations                                                           | S    | NFR          | ✅ Done                                                                         |
| **OPS-6.1**   | Deployment         | Target architecture & Dockerized EC2 environment guide documented                                                                                                           | M    | NFR          | ✅ Guide documented; deployment/migration not verified                          |

## Acceptance criteria

1. Purchasing Manager can create and manage Suppliers and Purchase Orders. (Verified by UI & tests)
2. Admin can navigate to a Data Management hub to export or import core system data. (Verified by `/data-management` & `DataManagementTest`)
3. Admin charts display category turnover and recorded shrinkage loss; Purchasing Manager charts display ABC/XYZ distributions. The PO trend / supplier lead-time chart required by CHART-6.1 is not implemented and remains a follow-up.
4. `php artisan migrate:fresh --seed` prepares catalog, ledger, reorder, cycle-count, supplier, and PO data. The current seed does not fully match the original demo narrative: `WB-TH-0100` has 28 on hand (not 45), and the seeded `WB-FL-0100` lots expire in 180 and 365 days (not within the next 30 days).
5. Implemented role-guarded API endpoints are covered by focused RBAC and data-management tests (`RbacSprintSixTest.php`, `DataManagementTest.php`); FR-42/FR-43 are chart requirements, not role-guarded API endpoints.
6. API list endpoints (`GET /products`, `GET /cycle-counts`, `GET /inventory-transactions`, `GET /purchase-orders`) execute a constant number of queries regardless of result count (no N+1).
7. Tech debt and target deployment guidance are documented (`docs/tech-debt.md`); this does not verify production readiness or an EC2 deployment.
8. The target AWS EC2 and Docker architecture is documented; the deployment migration itself remains outstanding.

## Non-goals

- Frontend UI redesigns (UI polish was completed in Sprint 5).
- Complex infrastructure-as-code (Terraform) beyond the existing setup.
