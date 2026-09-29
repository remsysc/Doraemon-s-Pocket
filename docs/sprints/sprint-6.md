# Sprint 6 — Hardening, Data Management & Demo

> Status: ✅ Complete  
> Depends on: Sprint 5 Reconciliation, Reports & User Management ✅ Complete

## Goal

Ensure the system is fully robust, performant, and ready for demonstration to stakeholders. This sprint focuses on validating role-based access control (RBAC), resolving any performance bottlenecks (N+1 queries), finalizing the demo data seeder, defining the end-to-end demo flow for WalangBrownout Appliances, and introducing **System-Wide Data Management** for Admins to easily control, import, and export all system records.

Implements the final QA, data administration, and deployment-readiness requirements for the project.

## Scope checklist

| Item | Status |
| --- | --- |
| E2E Demo Flow defined and documented (all three symptom mitigations) | ✅ Complete (`docs/demo/DEMO_FLOW.md`) |
| Supplier Management CRUD (Admin/PM) | ✅ Complete (`SupplierController`, `Suppliers.tsx`) |
| Purchase Order Lifecycle (`draft`, `ordered`, `received`) | ✅ Complete (`PurchaseOrderController`, `PurchaseOrders.tsx`) |
| System-Wide Data Management (Bulk import/export) | ✅ Complete (`DataManagementController`, `DataManagement.tsx`) |
| Smart Analytics & Visualizations (Admin & PM Dashboards) | ✅ Complete (`DashboardCharts.tsx`) |
| Full role-guard test coverage for FR-32–FR-43 | ✅ Complete (`RbacSprintSixTest.php`, `DataManagementTest.php`) |
| Seed realistic demo data expanded for full demo flow | ✅ Complete (`DatabaseSeeder`, `PurchaseOrderSeeder`, `CycleCountSeeder`) |
| Performance review: N+1 checks and eager loading audit | ✅ Complete (audited eager-loading across all list endpoints) |
| Tech debt and auth hardening notes documented | ✅ Complete (`docs/tech-debt/auth-hardening.md`, `docs/tech-debt.md`) |
| Deployment architecture & EC2 migration documented | ✅ Complete (`docs/tech-debt.md` §4) |

## Traceable tasks

| Task ID | Component | Description | Est. | Traces to | Status |
| --- | --- | --- | --- | --- | --- |
| **PO-6.1** | Schema | Migrations for `suppliers`, `purchase_orders`, and `purchase_order_items` | M | FR-39, FR-40 | ✅ Done |
| **PO-6.2** | Backend | CRUD endpoints for `/api/suppliers` and `/api/purchase-orders` with role guards | M | FR-39, FR-40 | ✅ Done |
| **PO-6.3** | Frontend | Purchasing Manager UI for Supplier tracking and PO generation/status updates | M | FR-39, FR-40 | ✅ Done |
| **CHART-6.1**| Frontend | Implement interactive charts (Recharts) for Admin (Turnover/Shrinkage) and PM (ABC/XYZ, PO trends) | M | FR-42, FR-43 | ✅ Done |
| **DATA-6.1** | Backend & Frontend | Create Admin-only bulk import/export endpoints and UI for Master Data (Products, Categories) via CSV | S | NFR | ✅ Done |
| **DEMO-6.1** | Documentation | Write demo script/flow showing overstock prevention (Sprint 4), shrinkage resolution (Sprint 5), and concurrency safety (Sprint 3) | S | PRD §1 | ✅ Done |
| **SEED-6.1** | Seeder | Expand `DatabaseSeeder` & sub-seeders to ensure the exact state needed for the demo script is present on fresh migrate | M | PRD §1 | ✅ Done |
| **TEST-6.1** | Tests | Add explicit RBAC tests for FR-32 to FR-43 (reorder config, lot writes, ledger writes, reports, user management, suppliers, POs, data import/export) | M | FR-32–FR-43 | ✅ Done |
| **PERF-6.1** | Backend | Audit endpoints to identify and fix N+1 query issues (e.g. `/api/products`, `/api/cycle-counts`, `/api/inventory-transactions`, `/api/purchase-orders`) using eager loading | M | NFR | ✅ Done |
| **DOC-6.1** | Documentation | Create `docs/tech-debt.md` covering Sanctum session hardening, production DB indexing, and scaling considerations | S | NFR | ✅ Done |
| **OPS-6.1** | Deployment | Target architecture & Dockerized EC2 environment guide documented | M | NFR | ✅ Done |

## Acceptance criteria

1. Purchasing Manager can create and manage Suppliers and Purchase Orders. (Verified by UI & tests)
2. Admin can navigate to a Data Management hub to export or import core system data. (Verified by `/data-management` & `DataManagementTest`)
3. Both Admin and Purchasing Manager dashboards display data visually using interactive charts (Turnover velocity, ABC/XYZ, Shrinkage). (Verified in `DashboardCharts.tsx`)
4. An `artisan migrate:fresh --seed` produces a database state ready to immediately demonstrate:
   - Oversell prevention / Stock tracking (Sprint 3)
   - Reorder intelligence / ABC classification (Sprint 4)
   - Discrepancy reconciliation & Reporting (Sprint 5)
   - Supplier tracking and PO generation (Sprint 6)
5. All API endpoints explicitly verify the correct roles according to FR-32–FR-43, proven by automated tests (`RbacSprintSixTest.php`, `DataManagementTest.php`).
6. API list endpoints (`GET /products`, `GET /cycle-counts`, `GET /inventory-transactions`, `GET /purchase-orders`) execute a constant number of queries regardless of result count (no N+1).
7. Tech debt and production-readiness notes are documented (`docs/tech-debt.md`).
8. Application deployment and Docker architecture are documented for AWS EC2 migration.

## Non-goals

- Frontend UI redesigns (UI polish was completed in Sprint 5).
- Complex infrastructure-as-code (Terraform) beyond the existing setup.
