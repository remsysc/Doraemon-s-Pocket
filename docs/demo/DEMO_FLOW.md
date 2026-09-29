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

Doraemon's Pocket replaces the batch spreadsheet with an append-only transaction ledger, real-time inventory snapshots with row-level locking, intelligent reorder forecasting, role-based governance, and supplier purchase orders.

---

## 2. Demo Preparation & Seed Data

On a clean environment, execute:
```bash
php artisan migrate:fresh --seed
```

### Pre-configured Demo Accounts
| Role | Email | Password | Primary Mission |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@test.com` | `password` | Superuser, catalog governance, variance reports, audit logs, user & data management |
| **Purchasing Manager** | `purchasing@test.com` | `password` | Reorder points, EOQ, classification, suppliers, purchase orders |
| **Warehouse Staff** | `warehouse@test.com` | `password` | Physical receipts, lot bin allocation, FEFO picking, cycle counts |

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
*Demonstrates solving seasonal AC stockouts and panic over-ordering.*

1. **Inspect Portable AC Unit:**
   - Navigate to `/products` as Admin or Purchasing Manager.
   - Open **Portable AC 1.0 HP** (`WB-AC-1000`): flagged as `is_seasonal: true`.
2. **Review Reorder Alert:**
   - Log in as **Purchasing Manager** and visit `/purchasing`.
   - The **Reorder Alerts** widget identifies Portable AC units approaching lead-time threshold.
   - Unlike non-seasonal items computed via flat trailing averages and EOQ, the seasonal trigger factors in the summer demand spike shifted by `lead_time_days`.
3. **Generate Purchase Order:**
   - Click into **Purchase Orders** (`/purchase-orders`) and click **"Create Purchase Order"**.
   - Select Supplier: **CoolTech Global Supplies** (`lead_time_days: 14`).
   - Add Item: `Portable AC 1.0 HP`, Quantity: `20`, Unit Cost: `₱12,500.00`.
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
*Demonstrates catching the 45 recorded vs. 12 physical thermostat gap.*

1. **Warehouse Floor Count Submission:**
   - Log in as **Warehouse Staff** (`warehouse@test.com`).
   - Navigate to **Cycle Counts** (`/cycle-counts`).
   - Click **"Submit Cycle Count"**:
     - Product: **Digital Smart Thermostat** (`WB-TH-0100`).
     - Physical Counted Quantity: `12`.
     - Notes: *"Physical audit of shelf TH-01: only 12 boxed units found."*
   - Submit. The system calculates variance against snapshot expected quantity (`45`):
     - Discrepancy: `-33 units (-73.33%)`.
     - Automatically marked as **Flagged** because variance exceeds the 5% alert threshold.
2. **Admin Reconciliation & Shrinkage Report:**
   - Log in as **Admin** (`admin@test.com`).
   - Navigate to **Reports & Analytics** (`/reports`).
   - View the **Variance & Shrinkage Report**:
     - Highlights Digital Smart Thermostat: `45 Expected` vs `12 Counted` (`-33 units`).
     - Surfaces total financial loss in Philippine Pesos: `-33 × ₱2,500.00 = ₱82,500.00 loss`.
3. **Ledger Adjustment:**
   - In `/cycle-counts`, Admin clicks **"Reconcile"** on the flagged count.
   - The system appends an `ADJUSTMENT` transaction of `-33` to the immutable ledger.
   - The snapshot `qty_on_hand` drops to `12`, synchronizing system record with physical reality.
4. **Audit Trail Verification:**
   - Navigate to `/audit-logs`.
   - The exact actor, timestamp, previous state (`45`), and reconciled state (`12`) are permanently recorded in the tamper-evident audit log.

---

### Act 4: Symptom 3 Mitigation — Expiry Trap & FEFO Picking (FR-17, FR-19, FR-35)
*Demonstrates preventing ₱15,000 in expired filter write-offs.*

1. **Expiry Alert Notification:**
   - Log in as **Purchasing Manager** (`purchasing@test.com`).
   - Visit `/purchasing` -> **Expiry Alerts (Next 30 Days)**.
   - The system alerts that **HEPA Air Purifier Filters** in Lot `LOT-AP-EXP1` expire in 14 days.
2. **Enforce First-Expired, First-Out (FEFO) Picking:**
   - Log in as **Warehouse Staff** (`warehouse@test.com`).
   - Navigate to `/lots` and select FEFO Sort (or `/api/lots?fefo=1`).
   - The lots are automatically prioritized by ascending `expiry_date`:
     - Priority 1: `LOT-AP-EXP1` (Expires in 14 days) -> **Pick First**.
     - Priority 2: `LOT-AP-EXP2` (Expires in 180 days) -> **Hold**.
   - Recording an outbound `ISSUE` transaction from `LOT-AP-EXP1` depletes the aging lot first, directly preventing expired product write-offs.

---

### Act 5: Concurrency Safety & Oversell Protection (Sprint 3)
*Demonstrates that simultaneous orders never cause negative stock or overselling.*

1. Open the Stock Overview screen (`/stock`).
2. Two warehouse pickers or sales channels simultaneously request reserving stock for an item with only 5 available units:
   - Worker A reserves 4 units -> Snapshot updates `qty_reserved: 4`, `qty_available: 1`.
   - Worker B attempts to reserve 2 units -> System acquires row-lock via `lockForUpdate()`, validates insufficient available stock (`1 < 2`), and safely rejects with HTTP 422 ("Insufficient available stock").
   - Concurrency stress tests in `tests/Feature/InventoryTransactionConcurrencyTest.php` guarantee zero oversell under multi-threaded load.

---

### Act 6: System Data Management & CSV Portability (Sprint 6, DATA-6.1)
*Demonstrates Master Data export and bulk import for business continuity.*

1. Log in as **Admin** (`admin@test.com`).
2. Navigate to **Data Management** (`/data-management`).
3. Click **"Export CSV"** for Products and Categories:
   - Instantly downloads standard CSV files containing SKU, category, barcodes, pricing, and specs.
4. Upload an updated CSV with new items or pricing changes:
   - System validates headers, upserts records, preserves snapshots, and displays line-by-line feedback.
