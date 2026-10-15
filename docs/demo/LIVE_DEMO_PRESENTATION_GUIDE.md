# Doraemon's Pocket — Master Live Demo & Presentation Guide

> **Document Type:** Live Demonstration Playbook & Technical Presentation Guide  
> **Target Audience:** Evaluators, Stakeholders, Technical Judges & Operations Executives  
> **System:** Doraemon's Pocket — Inventory Management System (IMS)  
> **Stack:** Laravel 13 REST API, PostgreSQL 16+, React 18 + TypeScript SPA, Tailwind CSS, Vite  
> **Companion Files:** [PRD.md](../prd/PRD.md), [SPEC.md](../spec/SPEC.md), [DEMO_FLOW.md](DEMO_FLOW.md), [erd.md](../erd/erd.md)

---

## 1. Presentation Executive Summary

### 1.1 The Business Crisis: WalangBrownout Appliances
WalangBrownout Appliances is a regional retailer/distributor of environmental and climate appliances (Air Conditioners, Air Purifiers, Replacement Filters, and Digital Thermostats).

Historically, the company operated inventory on a **single manual spreadsheet updated once a week by batch**. This weekly-batch, non-transactional process caused three catastrophic operational failures:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       THE BATCH SPREADSHEET CRISIS                         │
│       (Single un-audited spreadsheet updated once a week in batches)        │
└──────────────┬──────────────────────────────┬───────────────────────────────┘
               │                              │                               │
               ▼                              ▼                               ▼
    [1. The Summer Crunch]        [2. Mystery Shrinkage]            [3. The Expiry Trap]
  Seasonal stockouts followed    Spreadsheet recorded 45 units;    ₱15,000 written off in
  by panic bulk over-ordering    physical count found only 12.     expired HEPA filters picked
  due to lack of seasonal lead-  Zero audit trail, zero accountability,  in LIFO order from shelf fronts.
  time aware reordering.         timing vs. theft unknown.
```

### 1.2 The Core Solution: Doraemon's Pocket
Doraemon's Pocket replaces the batch spreadsheet with:
1. **An Immutable, Append-Only Transaction Ledger (`inventory_transactions`)**: Zero direct overwrites to stock balances. Every single movement is an audited, signed delta with an authenticated actor and timestamp.
2. **Real-Time Row-Locked Snapshots (`inventory_snapshots`)**: Instant on-hand, reserved, and available quantities guaranteed against overselling via PostgreSQL row-level locks (`SELECT ... FOR UPDATE`).
3. **Scientifically Driven Replenishment (Seasonal ROP + EOQ)**: Predictive lead-time shifting for seasonal items ($is\_seasonal$) and Wilson Economic Order Quantity formulas for non-seasonal catalog items.
4. **FEFO Inventory Preservation**: First-Expired, First-Out lot routing by expiration dates rather than physical shelf convenience, supported by proactive 30-day alert feeds.
5. **Enforced Separation of Duties (RBAC)**: Catalog governance (Admin), purchasing and supplier procurement (Purchasing Manager), and physical stock execution (Warehouse Staff) are isolated to prevent conflict of interest and shrinkage.

---

## 2. Problem Statements vs. System Solutions Matrix

When presenting, use this reference table to map every real-world problem to its mathematical, architectural, and operational answer in the application:

| Problem Symptom | Real-World Failure Scenario | Root Cause in Spreadsheets | Doraemon's Pocket Technical Solution | How to Demonstrate Live |
| :--- | :--- | :--- | :--- | :--- |
| **1. The Summer Crunch** | Portable AC units sell out during heatwaves. Purchasing manager panic-orders 3x normal stock, tying up capital and spiking holding costs. | Spreadsheets use flat trailing averages that react after stockouts occur, ignoring lead times and seasonal demand spikes. | **Seasonal Reorder Point (ROP):** Shifting reorder triggers earlier by `lead_time_days` using same-period historical demand. Paired with integrated **Supplier Purchase Orders**. | Log in as Purchasing Manager $\rightarrow$ inspect `/purchasing` Reorder Alerts $\rightarrow$ show seasonal trigger on `WB-AC-1000` $\rightarrow$ generate PO $\rightarrow$ receive stock as Warehouse Staff. |
| **2. Mystery Shrinkage** | Spreadsheet recorded 45 smart thermostats; warehouse physical audit found only 12 units on the shelf (33 units missing / ₱82,500 retail loss). | Anyone could overwrite spreadsheet cells. No actor log, no timestamp, no blind physical count reconciliation. | **Append-Only Ledger & Reconciled Cycle Counts:** Warehouse submits blind physical counts; deviations $>5\%$ flag a discrepancy alert; Admin reconciles with an atomic `ADJUSTMENT` transaction and audit log. | Log in as Warehouse Staff $\rightarrow$ submit cycle count of 12 for `WB-TH-0100` $\rightarrow$ log in as Admin $\rightarrow$ view flagged count and shrinkage report $\rightarrow$ click Reconcile. |
| **3. The Expiry Trap** | ₱15,000 worth of HEPA filters expired on the shelf because pickers grabbed the newest boxes from the front of the rack. | Spreadsheets track a single aggregate number (e.g. "100 filters"), obscuring lot batches, expiration dates, and bin locations. | **FEFO Lot Tracking & Expiry Alerts:** Granular `lots` tracking `expiry_date` and `bin_location`; API query sorting by `expiry_date ASC`; 30-day proactive expiry alert banners. | Log in as Purchasing Manager $\rightarrow$ view 30-day Expiry Alert widget $\rightarrow$ switch to Warehouse Staff $\rightarrow$ view lots sorted by nearest expiry date. |
| **4. Overselling & Race Conditions** | Two sales channels sell the same last 5 items simultaneously; warehouse cannot fulfill orders. | Spreadsheets are static and batch-processed; no concurrency isolation or inventory reservation locks. | **ACID Row-Level Locking:** Transactions update snapshots within a database transaction using `lockForUpdate()`, strictly checking `qty_available >= qty_requested`. | Review transaction projection rules $\rightarrow$ show rejection with HTTP 422 `INSUFFICIENT_STOCK` on attempted overdraft. |
| **5. Lack of Separation of Duties** | The person who orders stock also counts it and edits the records, enabling fraud and cover-ups. | Shared spreadsheet password or shared folder access with no role boundaries. | **Strict 3-Tier RBAC:** Distinct route guards and Model Policies. Purchasing cannot touch physical stock; Warehouse cannot edit prices or reorder rules. | Show Purchasing Manager getting `403 Forbidden` on physical adjustments; show Warehouse Staff interface free of financial/cost metrics. |

---

## 3. System Architecture & Under-the-Hood Mechanisms

### 3.1 Architectural Pipeline

```
               ┌────────────────────────────────────────────────────────┐
               │              React 18 SPA (TypeScript)                │
               │   Axios Client + CSRF Sanctum Cookie + Role Routing    │
               └───────────────────────────┬────────────────────────────┘
                                           │ HTTP REST / JSON
                                           ▼
               ┌────────────────────────────────────────────────────────┐
               │                 Laravel 13 REST API                    │
               │   Route Middleware ('role:admin,purchasing_manager')   │
               └──────┬────────────────────┬────────────────────┬───────┘
                      │                    │                    │
                      ▼                    ▼                    ▼
             [FormRequests]        [Model Policies]      [Domain Services]
             Validation & Types    before() Superuser   - InventoryTransactionService
                                                        - ReorderService
                                                        - DataManagementService
                                           │
                                           ▼
               ┌────────────────────────────────────────────────────────┐
               │           PostgreSQL Database (ACID Engine)            │
               │  - inventory_transactions (Append-only immutable event)│
               │  - inventory_snapshots (Derived via lockForUpdate())    │
               │  - audit_logs (System-generated mutation history)      │
               └────────────────────────────────────────────────────────┘
```

### 3.2 Concurrency & Ledger Invariant: The Dual-Table Architecture
The core data design is the absolute decoupling of **historical events** from **current state**:

1. **`inventory_transactions` (The Event Store / System of Record)**:
   - Primary key: `txn_id` (UUID)
   - Immutable and append-only: There is **NO `PUT`, `PATCH`, or `DELETE` route** in the entire application for this table.
   - Every movement records: `lot_id`, `actor_id` (enforced server-side from session, never client-supplied), `txn_type`, signed `qty_delta`, and `occurred_at`.
   - Supported Types: `RECEIPT (+)` | `RESERVE (-/+)` | `PICK (-)` | `SALE (-)` | `ADJUSTMENT (±)` | `WRITE_OFF (-)`.

2. **`inventory_snapshots` (The Derived Read-Optimized State)**:
   - Primary key: `sku_id` (UUID, 1-to-1 with Product)
   - Maintained within the exact same database transaction as transaction insertions using `lockForUpdate()`:
     ```php
     DB::transaction(function () use ($lot, $actorId, $type, $qtyDelta) {
         // 1. Lock SKU snapshot row
         $snapshot = InventorySnapshot::where('sku_id', $lot->sku_id)
             ->lockForUpdate()
             ->firstOrFail();

         // 2. Compute state transition
         $newOnHand = $snapshot->qty_on_hand + $deltaOnHand;
         $newReserved = $snapshot->qty_reserved + $deltaReserved;
         $newAvailable = $newOnHand - $newReserved;

         // 3. Enforce Invariants
         if ($newOnHand < 0 || $newReserved < 0 || $newAvailable < 0) {
             throw new InventoryTransactionException("INSUFFICIENT_STOCK", 422);
         }

         // 4. Save snapshot & append ledger row
     });
     ```
   - **PostgreSQL Check Constraints:** Database-level constraints enforce `qty_on_hand >= 0`, `qty_reserved >= 0`, `qty_available >= 0`, and `qty_available = (qty_on_hand - qty_reserved)`.

### 3.3 Mathematical Engine: Inventory Replenishment & Classification

#### 1. Reorder Point (ROP) Formula
$$ROP = (d \times L) + SS$$
- $d$: Average daily demand (derived dynamically from outflow transactions `SALE` + `PICK` over the trailing 90 days).
- $L$: Replenishment lead time in days (stored on `reorder_configs.lead_time_days` or inherited from `suppliers.lead_time_days`).
- $SS$: Safety Stock.

#### 2. Dynamic Safety Stock (Buffer against Demand Volatility)
$$SS = Z \times \sqrt{L \cdot \sigma_D^2}$$
- $Z$: Service level factor (default $Z = 1.65$ for a ~95% service level cycle).
- $\sigma_D^2$: Variance of daily demand calculated from ledger outflow history.

#### 3. Seasonal Shifting (Mitigating the Summer Crunch)
For products flagged with `is_seasonal = true` (e.g. `WB-AC-1000` Portable AC):
- Standard moving averages flatten seasonal spikes and cause late ordering.
- Doraemon's Pocket calculates the trigger by indexing the same period in the previous year and **shifting the threshold earlier by `lead_time_days`**.
- This guarantees purchase orders are raised *before* the heatwave arrives, not during it.

#### 4. Economic Order Quantity (EOQ) (Minimizing Holding & Ordering Costs)
For standard non-seasonal items with non-price operational costs configured:
$$EOQ = \sqrt{\frac{2 \cdot D \cdot S}{H}}$$
- $D$: Annual demand (units/year projected from historical velocity).
- $S$: Fixed cost per purchase order (`order_cost` in PHP).
- $H$: Annual holding cost per unit (`holding_cost_per_unit` in PHP).

#### 5. ABC & XYZ Matrix Classification
- **ABC Analysis (Pareto Value Analysis):**
  - Evaluates Annual Consumption Value: $\text{Annual Demand} \times \text{unit\_cost}$.
  - **Class A:** Top ~80% of inventory value (requires tightest control and frequent counts).
  - **Class B:** Next ~15% of inventory value.
  - **Class C:** Bottom ~5% of inventory value (bulk items, automated reorder).
- **XYZ Analysis (Demand Predictability):**
  - Evaluates Coefficient of Variation of Demand: $CV = \frac{\sigma_D}{\mu_D}$.
  - **Class X:** $CV < 0.5$ (Steady, predictable demand).
  - **Class Y:** $0.5 \le CV \le 1.0$ (Variable, seasonal demand).
  - **Class Z:** $CV > 1.0$ (Erratic, unpredictable demand).

---

## 4. Complete Application Functionality & Interface Tour

The SPA is organized into role-tailored dashboards and dedicated operational screens:

### 4.1 Authentication & Role-Based UI Routing
- `/login`: Cookie-based session authentication via Laravel Sanctum.
- Protected layout with responsive sidebar, dynamic role badges, user dropdown, and instant logout.
- Direct unauthorized URL navigation is intercepted by `<RoleRoute />`, redirecting unauthorized users cleanly back to `/dashboard`.

### 4.2 Screens & Capabilities Breakdown

| Screen Route | Primary Role | Visible Features & Functions | Live Demo Action |
| :--- | :--- | :--- | :--- |
| **`/dashboard`** | All Roles | **Role-Adaptive Interface:**<br>• **Admin:** KPI cards (Categories, Products, Active Lots, Transactions, Pending Reconciliations, Audit Logs), Turnover Velocity & Shrinkage Loss Charts, Quick Count modal trigger.<br>• **Purchasing Manager:** Reorder Alert feed, Expiry Alert feed, ABC Distribution chart, PO volume & supplier lead-time chart.<br>• **Warehouse Staff:** Active Lots counter, Expiring Lots indicator, Pending Physical Counts, Recent Transactions log, 1-click Quick Count. | Switch between demo accounts to highlight how the dashboard adapts to the employee's responsibility. |
| **`/stock`** | All Roles | **Real-Time Snapshot Table:** Displays SKU barcode, product name, category badge, On Hand, Reserved, and Available stock levels. Real-time indicators prevent stale-cache reads. | Point out that Available = On Hand - Reserved. Highlight that there is no "Edit" button here because snapshots cannot be hand-edited. |
| **`/categories`** | All (Admin Write) | Flat 4-category taxonomy (`Air Conditioning Units`, `Air Purifiers`, `Air Purifier Filters`, `Thermostats`). Full CRUD for Admin; soft deletion and explicit restore via `/api/categories/{id}/restore`. | Show that Warehouse Staff only sees a read-only table; Admin gets "+ New Category", Edit, and Delete actions. |
| **`/products`** | All (Admin Write) | Catalog master data: SKU Barcode, Name, Category, Unit Cost, Unit Price, Seasonal flag, Shelf Life Days. Includes CSV bulk import modal. | Show `WB-AC-1000` seasonal badge and pricing fields ($unit\_cost = ₱12,500$, $unit\_price = ₱16,000$). |
| **`/lots`** | All (Admin + WS Write) | Physical lot batches: Lot ID, SKU, Received Date/Time, Expiry Date, Bin Location (e.g. `FL-A01`, `AC-A01`). Admin & Warehouse Staff can create lots at physical receipt time. | Show that lots record bin locations and expiration dates, which was impossible on the spreadsheet. |
| **`/transactions`** | All (Admin + WS Write) | **Immutable Ledger Log:** Displays Txn ID, Product, Bin, Type badge (`RECEIPT`, `PICK`, etc.), signed delta, Actor email, and exact timestamp. Export CSV button. | Filter by transaction type; prove that no "Delete" or "Edit" button exists on any transaction row. |
| **`/purchasing`** | Admin + PM | **Reorder & Expiry Management:** Reorder Point alerts, dynamic EOQ suggestions, 30-day Expiry Alert list, SKU lead-time configuration modal, ABC/XYZ classification matrix view. | Open reorder configuration modal for an item; demonstrate how changing lead time or safety stock recalculates ROP. |
| **`/suppliers`** | All (Admin + PM Write) | Directory of vendors: Supplier Name, Contact Person, Email, Phone, Address, Configured Lead Time Days, Active status. Full CRUD for PM + Admin. | Show suppliers `CoolTech Distributors` (7d lead time) and `FilterHub Supply` (14d lead time). |
| **`/purchase-orders`** | All (Admin + PM Write, WS Receive) | **Procurement Lifecycle:** PO Number, Supplier, Order Date, Status badge (`draft` $\rightarrow$ `ordered` $\rightarrow$ `received`), total amount. Purchasing creates/submits POs; Warehouse Staff receives them with bin allocation. | Show the workflow: Create PO as PM $\rightarrow$ Order it $\rightarrow$ Log in as Warehouse Staff to click "Receive Items". |
| **`/cycle-counts`** | Admin + WS | **Physical Stock Audits:** Submit physical count (SKU, counted qty, shelf notes). Displays Expected Qty, Counted Qty, Discrepancy, Variance %, and Flag status ($>5\%$). Admin has "Reconcile" button. | Submit count of 12 for Thermostat $\rightarrow$ show red `FLAGGED` tag $\rightarrow$ Admin reconciles in 1 click. |
| **`/reports`** | Admin Only | **Management Intelligence:** Category Turnover velocity table, Shrinkage/Variance valuation report (discrepancy units $\times$ unit cost = financial loss), interactive charts. | Show total financial shrinkage impact calculated in real Philippine Pesos (₱). |
| **`/audit-logs`** | Admin Only | **System Accountability:** System-generated immutable audit feed. Captures Actor, Action (`CREATED`, `UPDATED`, `DELETED`), Entity Type, ID, Old Values, New Values, and timestamp. | Show how changing a product name or category is recorded with before-and-after JSON diffs. |
| **`/users`** | Admin Only | **User Administration:** List users, assign roles (`admin`, `purchasing_manager`, `warehouse_staff`), activate/deactivate accounts. | Emphasize that only Admin can grant or revoke privileges. |
| **`/data-management`**| Admin Only | **Data Portability:** Master data CSV Export and Dry-Run Bulk Import for Categories, Products, Lots, Suppliers, POs, and Cycle Counts. Ledger is export-only. | Download a CSV export and explain the dry-run validation preview. |

---

## 5. Live Demo Playbook: Step-by-Step Script for Presenters

Follow this exact chronological script during your live demonstration:

### Demo Credentials Cheat Sheet
| Role | Email | Password | Primary Demo Responsibility |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@test.com` | `password` | Superuser: Catalog governance, reconciliations, audit logs, reports |
| **Purchasing Manager** | `purchasing@test.com` | `password` | Procurement: Reorder alerts, EOQ, supplier management, creating POs |
| **Warehouse Staff** | `warehouse@test.com` | `password` | Floor Operations: Physical receipts, bin allocation, cycle counts |

---

### ACT 0: Environment Reset & Orientation (1 Minute)
**Objective:** Establish a clean, known state and introduce the business scenario.

1. **Presenter Script:**
   > *"Good morning/afternoon. Today I am presenting Doraemon's Pocket, built for WalangBrownout Appliances. Before we begin, we reset our database to our validated catalog baseline."*
2. **Terminal Command (Optional or Pre-run):**
   ```bash
   php artisan migrate:fresh --seed
   ```
3. **Talking Points:**
   - 4 Flat Categories, 8 Products, 16 Lots, 3 Suppliers, and pre-seeded realistic transaction history.

---

### ACT 1: Enforcing Separation of Duties & RBAC (2 Minutes)
**Objective:** Prove that security and role separation are enforced both in the UI and at the API level.

1. **Step 1: Log in as Purchasing Manager (`purchasing@test.com` / `password`)**
   - Point out the sidebar navigation:
     - Sees: `Dashboard`, `Products`, `Lots`, `Transactions`, `Stock Overview`, `Purchasing`, `Suppliers`, `Purchase Orders`.
     - **Hidden:** `User Management`, `Audit Logs`, `Reports`, `Data Management`.
   - Navigate to `/transactions` or `/lots`:
     - Point out that the "+ Create Lot" or "+ Add Transaction" buttons **do not exist**.
     - Purchasing Manager is strictly an analyst and buyer—they cannot alter physical stock.
2. **Step 2: Log in as Warehouse Staff (`warehouse@test.com` / `password`)**
   - Point out the clean operational interface:
     - Sees: `Dashboard`, `Lots`, `Transactions`, `Stock Overview`, `Cycle Counts`, `Purchase Orders`.
     - **Hidden:** `Purchasing`, `Suppliers`, `Reports`, `User Management`, `Audit Logs`, `Data Management`.
   - **Presenter Script:**
     > *"Notice the deliberate absence of cost, profit margins, and reorder point formulas here. Warehouse staff are shielded from operational noise and focused entirely on physical stock movements and bin fidelity."*

---

### ACT 2: Mitigating Problem 1 — The Summer Crunch (Seasonal Reorder & PO) (3 Minutes)
**Objective:** Demonstrate how seasonal intelligence prevents AC stockouts and eliminates panic ordering.

1. **Step 1: Inspect Seasonal Flag on AC Unit**
   - Log in as **Purchasing Manager** (`purchasing@test.com`).
   - Navigate to **Products** (`/products`).
   - Find **Portable AC 1.0 HP** (`WB-AC-1000`):
     - Point out the blue badge: `Seasonal: Yes`.
     - Shelf life is `None` (non-perishable), Unit Cost is `₱12,500.00`.
2. **Step 2: Review the Reorder Alert**
   - Navigate to **Purchasing** (`/purchasing`).
   - In the **Reorder Alerts** widget, locate `WB-AC-1000`:
     - Explain the seasonal logic: Non-seasonal items use flat historical demand; this seasonal AC factors in the summer demand wave shifted backwards by its 14-day lead time.
     - The alert warns that stock must be ordered *now* to arrive before peak demand.
3. **Step 3: Create & Submit Purchase Order**
   - Navigate to **Purchase Orders** (`/purchase-orders`).
   - Click **"Create Purchase Order"**:
     - Supplier: Select **CoolTech Distributors** (Contact: Maria Santos, Lead Time: 7 days).
     - Add Item: Select **Portable AC 1.0 HP** (`WB-AC-1000`).
     - Quantity: Enter `20`.
     - Unit Cost: Automatically populates `₱12,500.00`.
     - Total: `₱250,000.00`.
     - Click **"Create Purchase Order"**.
   - In the PO list, the new order appears with status `draft`.
   - Click **"Mark as Ordered"** $\rightarrow$ Status badge changes to blue `ordered`.
4. **Step 4: Receive Stock on Warehouse Floor**
   - Log out and log in as **Warehouse Staff** (`warehouse@test.com`).
   - Navigate to **Purchase Orders** (`/purchase-orders`).
   - Click **"Receive Items"** on the ordered PO:
     - Location Bin: Enter `AC-A01`.
     - Quantity: `20`.
     - Click **"Confirm Receipt"**.
   - **The Verification:**
     - PO status advances to green `received`.
     - Navigate to `/transactions`: A new `RECEIPT` transaction of `+20` units appears with the actor `warehouse@test.com` and an immutable timestamp.
     - Navigate to `/stock`: `WB-AC-1000` On-Hand and Available quantities have instantly updated by +20 without any manual spreadsheet tallying!

---

### ACT 3: Mitigating Problem 2 — Mystery Shrinkage & Audit Reconciliation (3 Minutes)
**Objective:** Demonstrate finding missing thermostats, isolating discrepancy, and executing an audited reconciliation.

1. **Step 1: Warehouse Floor Audit & Count Submission**
   - Stay logged in as **Warehouse Staff** (`warehouse@test.com`).
   - Navigate to **Cycle Counts** (`/cycle-counts`).
   - Click **"Submit Cycle Count"**:
     - Product: Select **Digital Smart Thermostat** (`WB-TH-0100`).
     - Physical Counted Quantity: Enter `12`.
     - Notes: *"Physical audit of shelf TH-01: only 12 boxed units found on the rack."*
     - Click **"Submit Count"**.
   - In the Cycle Counts table:
     - Expected Quantity: System automatically looks up current snapshot (`28` units in current seed).
     - Counted Quantity: `12`.
     - Discrepancy: `-16 units (-57.14%)`.
     - Status: Yellow `PENDING` with a bold red `FLAGGED` tag (because discrepancy exceeds the 5% threshold).
     - Notice that Warehouse Staff has **no button to reconcile or adjust the ledger**.
2. **Step 2: Admin Investigation & Reconciliation**
   - Log out and log in as **Admin** (`admin@test.com`).
   - On `/dashboard`, see the **Pending Reconciliations** counter flagged in amber.
   - Navigate to **Cycle Counts** (`/cycle-counts`):
     - Click **"Reconcile"** on the flagged thermostat count.
     - A confirmation modal appears detailing:
       - Expected: `28`
       - Counted: `12`
       - Adjustment Delta: `-16`
     - Click **"Confirm Reconciliation"**.
3. **Step 3: Verification of Financial Loss & Immutable Audit Trail**
   - Navigate to **Reports** (`/reports`):
     - Under the **Shrinkage & Variance Report**, locate `WB-TH-0100`.
     - The report multiplies the reconciled shortfall (`-16 units`) by the Product Unit Cost (`₱1,200.00`) = **₱19,200.00 confirmed shrinkage loss** *(or ₱82,500.00 at retail valuation)*.
   - Navigate to **Transactions** (`/transactions`):
     - An immutable `ADJUSTMENT` row with `qty_delta: -16` appears, logged under `admin@test.com`.
   - Navigate to **Audit Logs** (`/audit-logs`):
     - Show that every administrative change is tracked with timestamp, actor, and before/after values.

---

### ACT 4: Mitigating Problem 3 — The Expiry Trap & FEFO Stock Preservation (2 Minutes)
**Objective:** Demonstrate shelf-life intelligence that eliminates ₱15,000 filter write-offs.

1. **Step 1: Proactive Expiry Monitoring**
   - Log in as **Purchasing Manager** (`purchasing@test.com`).
   - Navigate to **Purchasing** (`/purchasing`).
   - Scroll to **Expiry Alerts (Next 30 Days)**:
     - Explain how the system alerts procurement whenever any perishable lot is within 30 days of expiration.
     - Prevents ordering new batches while existing batches are about to expire.
2. **Step 2: FEFO Lot Ordering for Pickers**
   - Log in as **Warehouse Staff** (`warehouse@test.com`).
   - Navigate to **Lots** (`/lots`).
   - Filter or look at **HEPA Replacement Filter Small** (`WB-FL-0100`):
     - Point out Bin `FL-A01` (expires in ~180 days) vs Bin `FL-A02` (expires in ~365 days).
   - **Presenter Script:**
     > *"Under the old spreadsheet, pickers grabbed boxes from `FL-A02` because it was closest to the warehouse door. Under Doraemon's Pocket, pick instructions enforce First-Expired, First-Out (FEFO). The API guarantees that picking queries sort by `expiry_date ASC (nulls last)`. Older stock is always exhausted first, eliminating the ₱15,000 expiry write-off."*

---

### ACT 5: Concurrency Safety & Oversell Protection (1 Minute)
**Objective:** Explain how PostgreSQL row-level locks prevent negative stock.

1. **Presenter Explanation with Code Reference:**
   - Open `/stock` and show an item with low available stock (e.g. Available = 1).
   - **Presenter Script:**
     > *"What happens if two online channels try to reserve this last unit simultaneously? In a spreadsheet or naive database, both check available = 1, both succeed, and inventory drops to -1. In Doraemon's Pocket, our `InventoryTransactionService` wraps every stock change in a database transaction with `lockForUpdate()`. The first worker locks the SKU row, decrements available to 0. When the second worker gains lock, `0 < 1` triggers an atomic rollback and returns HTTP 422 with code `INSUFFICIENT_STOCK`. Overselling is mathematically impossible."*

---

### ACT 6: Executive Analytics & Data Portability (1 Minute)
**Objective:** Highlight business intelligence and enterprise readiness.

1. **Admin Analytics Charts:**
   - Log in as **Admin** (`admin@test.com`) and visit `/dashboard`.
   - Show the **Category Turnover Velocity** bar chart and **Recorded Shrinkage Loss** chart.
2. **Purchasing Distribution Charts:**
   - Switch to **Purchasing Manager** (`purchasing@test.com`) on `/dashboard`.
   - Show the **ABC / XYZ Inventory Distribution** donut chart and the **12-Month Purchase Order Volume** trends chart.
3. **Data Management & CSV Portability:**
   - As Admin, visit **Data Management** (`/data-management`).
   - Show 1-click **Export CSV** for master data.
   - Show the **Dry-Run Bulk Import** modal: Allows uploading CSV updates with pre-validation to test for errors before committing changes.
   - Point out that **Inventory Transactions are export-only**—even Admin cannot import or alter past ledger history!

---

## 6. Technical Q&A Defense & Objection Handling

Prepare for tough questions from judges or evaluators with these vetted answers:

### Q1: "Why not just use an Excel spreadsheet with formulas and visual basic macros?"
> **Answer:** "Spreadsheets fail at three fundamental enterprise requirements:
> 1. **Concurrency:** Excel cannot execute row-level locking. Simultaneous edits cause silent overwrites and race conditions.
> 2. **Auditability & Integrity:** A spreadsheet is a state snapshot, not an event ledger. Anyone can change a number from 45 to 12 without recording who did it, why, or when.
> 3. **Separation of Duties:** You cannot prevent a user with edit permissions on a spreadsheet from modifying both reorder formulas and stock levels."

### Q2: "Can a rogue warehouse worker or admin directly modify `qty_on_hand` in the database?"
> **Answer:** "No. In the application code, `inventory_snapshots` has no create, update, or delete controller endpoints. The snapshot row is updated exclusively as a side-effect inside `InventoryTransactionService::project()` during an `INVENTORY_TRANSACTION` insert. Furthermore, PostgreSQL check constraints at the database schema level enforce `qty_on_hand >= 0` and `qty_available = qty_on_hand - qty_reserved`."

### Q3: "Why is the Purchasing Manager blocked from logging inventory receipts if they created the Purchase Order?"
> **Answer:** "This is a classic internal control principle known as **Separation of Duties (SoD)**. In corporate accounting and supply chain governance, the person who authorizes a commercial purchase must never be the person who verifies physical receipt on the dock. Allowing the buyer to sign off on receipt creates an open invitation for phantom shipments and embezzlement."

### Q4: "How does the system distinguish between real shrinkage (theft/damage) and a timing discrepancy?"
> **Answer:** "Through our Cycle Count workflow. When warehouse staff submits a count, it doesn't immediately overwrite stock. It generates a pending audit comparison with expected quantities. If the variance exceeds 5%, it is flagged. Admin reviews the pending queue against pending receipts or open sales orders. Only upon explicit Admin reconciliation is an `ADJUSTMENT` transaction appended, preserving the exact variance history in financial reports."

### Q5: "How does the seasonal reorder formula work if you have a brand-new product without prior-year sales history?"
> **Answer:** "The system checks for sufficient prior-year historical transactions. If available, it uses the seasonal index shifted by `lead_time_days`. If `insufficient_history` is detected, the API transparently falls back to the baseline trailing daily average demand with configured safety stock overrides, and flags the item in the dashboard so the manager is aware."

### Q6: "Why are Inventory Transactions export-only, while other tables support CSV import?"
> **Answer:** "Because the ledger is our immutable financial system of record. Allowing bulk CSV import of transactions would introduce backdated or unverified transactions that bypass real-time row-locks and physical verification. To bring in stock, users must execute structured receipts or authorized adjustments."

---

## 7. Demo Checklist & Fast-Reference Summary

Print or keep this quick reference visible on a second monitor during the presentation:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LIVE DEMO QUICK CHEAT SHEET                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. ACCOUNTS                                                                 │
│    • Admin:      admin@test.com      / password (Full Control & Reconcile)  │
│    • Purchasing: purchasing@test.com / password (ROP, EOQ, POs, Suppliers) │
│    • Warehouse:  warehouse@test.com  / password (Counts, Bins, Receipts)    │
│                                                                             │
│ 2. KEY URLS                                                                 │
│    • Main Dashboard:    http://localhost/dashboard                          │
│    • Reorder Hub:       http://localhost/purchasing                         │
│    • Purchase Orders:   http://localhost/purchase-orders                    │
│    • Cycle Counts:      http://localhost/cycle-counts                       │
│    • Reports:           http://localhost/reports                            │
│    • Audit Logs:        http://localhost/audit-logs                         │
│                                                                             │
│ 3. THREE HERO STORIES TO DELIVER                                            │
│    • Story 1 (AC Units):    Seasonal Lead-Time ROP -> PO -> Warehouse Recv  │
│    • Story 2 (Thermostat):  12 Counted vs 28 Exp -> Flagged -> Reconcile    │
│    • Story 3 (Filters):     FEFO Lot Expiry Order -> 0 Write-Offs           │
└─────────────────────────────────────────────────────────────────────────────┘
```
