# WalangBrownout Appliances — End-to-End Demo Script & Flow

> **Sprint 6 Demo Flow Document (DEMO-6.1 / PRD §1, §8)**  
> **Target Audience:** Stakeholders, Product Owner, Operations Team  
> **System:** Doraemon's Pocket (Laravel 13 API + React SPA)

---

## 1. Executive Summary & Context

WalangBrownout Appliances previously operated on a weekly manual spreadsheet. That legacy process caused three acute operational failures:

1. **Seasonal Stockouts & Panic Over-ordering:** Portable AC units ran out during heatwaves, followed by costly emergency bulk orders.
2. **Mystery Shrinkage:** 45 smart thermostats were recorded on the spreadsheet, but only 12 existed on the warehouse floor (unexplained shrinkage of 33 units).
3. **The Expiry Trap:** ₱15,000 worth of HEPA air-purifier filters were written off because newer inventory was picked before older lots (LIFO instead of FEFO).

Doraemon's Pocket replaces the batch spreadsheet with an append-only transaction ledger, real-time inventory snapshots with row-level locking, reorder forecasting, role-based governance, and supplier purchase orders. The story figures below are illustrative; current seed-data differences are called out where they affect the walkthrough.

---

## 2. Demo Preparation & Seed Data

On a disposable/clean environment, execute:

```bash
php artisan migrate:fresh --seed
```

> `migrate:fresh` drops all existing tables. Do not run it against data you need to keep. The current seed does not reproduce every number in the original scenario; see the notes in Acts 3 and 4.

### Pre-configured Demo Accounts

| Role                   | Email                 | Password   | Primary Mission                                                                     |
| :--------------------- | :-------------------- | :--------- | :---------------------------------------------------------------------------------- |
| **Admin**              | `admin@test.com`      | `password` | Superuser, catalog governance, variance reports, audit logs, user & data management |
| **Purchasing Manager** | `purchasing@test.com` | `password` | Reorder points, EOQ, classification, suppliers, purchase orders                     |
| **Warehouse Staff**    | `warehouse@test.com`  | `password` | Physical receipts, lot bin allocation, FEFO picking, cycle counts                   |

---

## 3. Step-by-Step Demonstration Flow

### Act 1: Separation of Duties & RBAC (Blueprint & PRD §4)

1. **Login as Purchasing Manager (`purchasing@test.com`):**
    - View navigation: Purchasing Analytics, Reorder Configs, Suppliers, Purchase Orders.
    - Note that Stock Overview & Transactions are accessible in read-only mode.
    - Attempting physical inventory adjustments or catalog modifications is blocked (returns 403 Forbidden).
2. **Login as Warehouse Staff (`warehouse@test.com`):**
    - View navigation: Lots, Transactions, Cycle Counts, and Purchase Order Receiving.
    - Reorder configurations, purchasing alerts, financial reports, and user administration are completely hidden.

---

### Act 2: Symptom 1 Mitigation — Seasonal Reorder Intelligence & POs (FR-28, FR-29, FR-40, FR-41)

_Demonstrates solving seasonal AC stockouts and panic over-ordering._

1. **Inspect Portable AC Unit:**
    - Navigate to `/products` as Admin or Purchasing Manager.
    - Open **Portable AC 1.0 HP** (`WB-AC-1000`): flagged as `is_seasonal: true`.
2. **Review Reorder Alert:**
    - Log in as **Purchasing Manager** and visit `/purchasing`.
    - The **Reorder Alerts** widget identifies Portable AC units approaching lead-time threshold.
    - Unlike non-seasonal items computed via flat trailing averages and EOQ, the seasonal trigger factors in the summer demand spike shifted by `lead_time_days`.
3. **Generate Purchase Order:**
    - Click into **Purchase Orders** (`/purchase-orders`) and click **"Create Purchase Order"**.
    - Select the seeded supplier **CoolTech Distributors** (supplier lead time: 7 days). The Portable AC reorder configuration separately uses a 14-day lead time.
    - Add Item: `Portable AC 1.0 HP` (`WB-AC-1000`), Quantity: `20`, Unit Cost: `₱12,500.00` (the seeded Product `unit_cost`).
    - Save as `draft`, then advance status to `ordered`.
4. **Physical Stock Receiving against PO:**
    - Log in as **Warehouse Staff** (`warehouse@test.com`).
    - Navigate to `/purchase-orders`. Click **"Receive Items"** on the ordered PO.
    - Enter `20` units received into Bin `AC-A01`.
    - Submit receipt:
        - Automatically appends a `RECEIPT` transaction (`+20`) to the ledger.
        - Transitions PO status to `received`.
        - Immediately increments `qty_on_hand` and `qty_available` in the inventory snapshot without manual spreadsheet updates.

---

### Act 3: Symptom 2 Mitigation — Mystery Shrinkage Resolution & Audit (FR-30, FR-31)

_Demonstrates catching the 45 recorded vs. 12 physical thermostat gap._

1. **Warehouse Floor Count Submission:**
    - Log in as **Warehouse Staff** (`warehouse@test.com`).
    - Navigate to **Cycle Counts** (`/cycle-counts`).
    - Click **"Submit Cycle Count"**:
        - Product: **Digital Smart Thermostat** (`WB-TH-0100`).
        - Physical Counted Quantity: `12`.
        - Notes: _"Physical audit of shelf TH-01: only 12 boxed units found."_
    - On the current fresh seed, `WB-TH-0100` has `28` units on hand (18 + 12 receipts − 2 picked). The count therefore records `28` expected vs `12` counted:
        - Discrepancy: `-16 units (-57.14%)`.
        - Automatically marked as **Flagged** because variance exceeds the 5% alert threshold.
    - The original PRD scenario is 45 vs 12. `CycleCountSeeder` still has a static note/comment saying 45, but the seeded ledger currently computes 28; the seed needs correction before the original numbers can be demoed.
2. **Admin Reconciliation & Shrinkage Report:**
    - Log in as **Admin** (`admin@test.com`).
    - Review the pending count in the reconciliation queue; the variance report aggregates reconciled counts, so inspect it after reconciliation.
    - The current count is `28 Expected` vs `12 Counted` (`-16 units`). The Product's seeded `unit_cost` is ₱1,200, so the corresponding inventory-cost impact is ₱19,200, not the original scenario's 45-vs-12 / ₱82,500 figures.
3. **Ledger Adjustment:**
    - In `/cycle-counts`, Admin clicks **"Reconcile"** on the flagged count.
    - The system appends an `ADJUSTMENT` transaction of `-33` to the immutable ledger.
    - The snapshot `qty_on_hand` drops to `12`, synchronizing system record with physical reality.
4. **Ledger and Count Verification:**
    - Re-open the reconciled count to review the recorded counter, expected/count quantities, and reconciliation status.
    - Navigate to `/transactions` and verify the appended `ADJUSTMENT` transaction, actor, and timestamp.
    - The audit-log observer does not audit cycle-count reconciliation or inventory-transaction rows. The audit log is append-only, but it is not tamper-evident.

---

### Act 4: Symptom 3 Mitigation — Expiry Trap & FEFO Picking (FR-17, FR-19, FR-35)

_Demonstrates preventing ₱15,000 in expired filter write-offs._

1. **Expiry Alert Notification:**
    - Log in as **Purchasing Manager** (`purchasing@test.com`).
    - Visit `/purchasing` -> **Expiry Alerts (Next 30 Days)**.
    - The current fresh seed does not contain a filter lot expiring within 30 days. The seeded `HEPA Replacement Filter Small` lots in bins `FL-A01` and `FL-A02` expire in approximately 180 and 365 days, respectively. The original 14-day alert scenario requires different demo data.
2. **Inspect Expiry Ordering (partial FEFO support):**
    - Log in as **Warehouse Staff** (`warehouse@test.com`).
    - The `/lots` page has no FEFO sort control. The authenticated lot API supports expiry sorting: `GET /api/lots?filter[sku_id]=<WB-FL-0100 SKU UUID>&sort=expiry_date`.
    - For the seeded filter product, bin `FL-A01` (earlier expiry, about 180 days) sorts before `FL-A02` (about 365 days).
    - This demonstrates expiry-date ordering only. The application does not currently provide an automated pick-list or enforce lot allocation order. `ISSUE` is not a supported transaction type; a `PICK` consumes previously reserved stock.

---

### Act 5: Concurrency Safety & Oversell Protection (Sprint 3)

_Demonstrates that simultaneous orders never cause negative stock or overselling._

1. Open the Stock Overview screen (`/stock`).
2. Two warehouse pickers or sales channels simultaneously request reserving stock for an item with only 5 available units:
    - Worker A reserves 4 units -> Snapshot updates `qty_reserved: 4`, `qty_available: 1`.
    - Worker B attempts to reserve 2 units -> System acquires row-lock via `lockForUpdate()`, validates insufficient available stock (`1 < 2`), and safely rejects with HTTP 422 ("Insufficient available stock").
    - `tests/Feature/InventoryTransactionConcurrencyTest.php` covers the PostgreSQL row-lock behavior for the competing stock update scenario; it verifies the tested case rather than guaranteeing behavior under every possible load.

---

### Act 6: System Data Management & CSV Portability (Sprint 6, DATA-6.1)

_Demonstrates Master Data export and bulk import for business continuity._

1. Log in as **Admin** (`admin@test.com`).
2. Navigate to **Data Management** (`/data-management`).
3. Click **"Export CSV"** for Products and Categories:
    - Instantly downloads standard CSV files containing SKU, category, barcodes, pricing, and specs.
4. Upload an updated Categories or Products CSV using the dry-run option before committing:
    - The importer validates supported headers and reports import/update counts and validation errors. Product import does not import Inventory Transactions; ledger data remains append-only and export-only.
