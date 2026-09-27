# Sprint 6 — Hardening, Data Management & Demo

> Status: ⬜ Not Started
> Depends on: Sprint 5 Reconciliation, Reports & User Management ✅ Complete

## Goal

Ensure the system is fully robust, performant, and ready for demonstration to stakeholders. This sprint focuses on validating role-based access control (RBAC), resolving any performance bottlenecks (N+1 queries), finalizing the demo data seeder, defining the end-to-end demo flow for WalangBrownout Appliances, and introducing **System-Wide Data Management** for Admins to easily control, import, and export all system records.

Implements the final QA, data administration, and deployment-readiness requirements for the project.

## Scope checklist

| Item | Status |
| --- | --- |
| E2E Demo Flow defined and documented (all three symptom mitigations) | ⬜ Not started |
| Supplier Management CRUD (Admin/PM) | ⬜ Not started |
| Purchase Order Lifecycle (`draft`, `ordered`, `received`) | ⬜ Not started |
| System-Wide Data Management (Bulk import/export) | ⬜ Not started |
| Smart Analytics & Visualizations (Admin & PM Dashboards) | ⬜ Not started |
| Full role-guard test coverage for FR-32–FR-43 | ⬜ Not started |
| Seed realistic demo data expanded for full demo flow | ⬜ Not started |
| Performance review: N+1 checks and eager loading audit | ⬜ Not started |
| Tech debt and auth hardening notes documented | ⬜ Not started |
| Migrate deployment to AWS EC2 (Dockerized) | ⬜ Not started |

## Traceable tasks

| Task ID | Component | Description | Est. | Traces to |
| --- | --- | --- | --- | --- |
| **PO-6.1** | Schema | Migrations for `suppliers`, `purchase_orders`, and `purchase_order_items` | M | FR-39, FR-40 |
| **PO-6.2** | Backend | CRUD endpoints for `/api/suppliers` and `/api/purchase-orders` with role guards | M | FR-39, FR-40 |
| **PO-6.3** | Frontend | Purchasing Manager UI for Supplier tracking and PO generation/status updates | M | FR-39, FR-40 |
| **CHART-6.1**| Frontend | Implement interactive charts (Recharts) for Admin (Turnover/Shrinkage) and PM (ABC/XYZ, PO trends) | M | FR-42, FR-43 |
| **DATA-6.1** | Backend | Create Admin-only bulk import/export endpoints for Master Data (Products, Categories) via CSV | S | NFR |
| **DEMO-6.1** | Documentation | Write demo script/flow showing overstock prevention (Sprint 4), shrinkage resolution (Sprint 5), and concurrency safety (Sprint 3) | S | PRD §1 |
| **SEED-6.1** | Seeder | Expand `DatabaseSeeder` & sub-seeders to ensure the exact state needed for the demo script is present on fresh migrate | M | PRD §1 |
| **TEST-6.1** | Tests | Add explicit RBAC tests for FR-32 to FR-43 (reorder config, lot writes, ledger writes, reports, user management, suppliers, POs) | M | FR-32–FR-43 |
| **PERF-6.1** | Backend | Audit endpoints to identify and fix N+1 query issues (e.g. `/api/products`, `/api/cycle-counts`, `/api/inventory-transactions`) using eager loading | M | NFR |
| **DOC-6.1** | Documentation | Create `docs/tech-debt.md` covering Sanctum session hardening, production DB indexing, and scaling considerations | S | NFR |
| **OPS-6.1** | Deployment | Provision AWS EC2 instance, configure security groups, install Docker/Docker Compose, and migrate deployment from Railway | M | NFR |

## Acceptance criteria

1. Purchasing Manager can create and manage Suppliers and Purchase Orders.
2. Admin can navigate to a Data Management hub to export or import core system data.
3. Both Admin and Purchasing Manager dashboards display data visually using interactive charts (Turnover velocity, ABC/XYZ, Shrinkage).
4. An `artisan migrate:fresh --seed` produces a database state ready to immediately demonstrate:
   - Oversell prevention / Stock tracking (Sprint 3)
   - Reorder intelligence / ABC classification (Sprint 4)
   - Discrepancy reconciliation & Reporting (Sprint 5)
   - Supplier tracking and PO generation (Sprint 6)
5. All API endpoints explicitly verify the correct roles according to FR-32–FR-43, proven by automated tests.
6. API list endpoints (`GET /products`, `GET /cycle-counts`, `GET /inventory-transactions`) execute a constant number of queries regardless of result count (no N+1).
7. Tech debt and production-readiness notes are documented.
8. Application is successfully migrated to and accessible via AWS EC2, running a healthy Dockerized production build connected to the production database.

## Non-goals

- Frontend UI redesigns (UI polish was completed in Sprint 5).
- Complex infrastructure-as-code (Terraform) beyond the existing setup.
