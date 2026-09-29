# Expanded Data Management UI/UX Design Spec

## Summary
The expanded Data Management module empowers administrators, purchasing managers, and warehouse staff to export and bulk-import system entities (Categories, Products, Suppliers, Lots, Purchase Orders, Cycle Count sheets, and Inventory Ledger) safely and efficiently. The design balances a centralized Admin Hub with contextual, role-delegated actions directly inside operational workflows, featuring pre-flight dry-run validation, atomic transaction rollbacks, sample CSV template downloads, and line-level error diagnosis.

## Assumptions and open questions
- **Assumptions**:
  - Desktop-first enterprise web workstation with minimum viewport target of 1024px, gracefully responsive down to 360px mobile viewports.
  - Role capabilities: Admin has full access to the centralized hub and all entities; Purchasing Manager can bulk export/import Suppliers & POs; Warehouse Staff can bulk export/import Lots and Cycle Count sheets.
  - Browser supports modern File API and `Blob` downloads without external plugins.
  - Error messages must pinpoint line numbers and specific invalid fields.
- **Open questions**: None; all operational boundaries and entity rules were confirmed during technical alignment.

## Users and success metric
- **Primary users**:
  - *Inventory Admin*: Responsible for master data cataloging, system audits, and bulk data recovery.
  - *Purchasing Manager*: Onboards new vendor catalogs and bulk-creates purchase orders.
  - *Warehouse Supervisor*: Registers incoming lot shipments and uploads physical inventory count sheets.
- **Core task**: Upload a batch CSV file with instant validation feedback, resolving formatting/relational errors before committing any database changes.
- **Primary metric**: **Zero dirty partial states** (100% atomic rollbacks) and < 1 minute average time to identify and resolve CSV formatting errors.

## Flow

```mermaid
flowchart TD
    Start([User opens Data Management or Domain Page]) --> Step1[Select Entity Card or Click Bulk Action]
    Step1 --> Step2[Optional: Click 'Download Sample Template']
    Step2 --> Step3[Drag & Drop or Browse CSV File]
    Step3 --> Step4{Dry Run Enabled?}
    
    Step4 -- Yes (Checked) --> DryRun[Click 'Test Run (Preview)']
    DryRun --> API_Dry[Backend executes validation without commit]
    API_Dry -- Valid --> ShowPreviewSuccess[Display 'Preview Passed: X rows ready to import' + Commit Button]
    API_Dry -- Errors Found --> ShowDryErrors[Display Line-by-Line Error Drawer with actionable fixes]
    ShowDryErrors --> FixFile[User corrects CSV] --> Step3

    Step4 -- No (Direct) --> ClickImport[Click 'Import Batch']
    ClickImport --> API_Real[Backend validates and executes atomic DB transaction]
    API_Real -- Any Row Invalid --> Rollback[Atomic Rollback: 0 rows changed]
    Rollback --> ShowErrors[Alert with error summary & line numbers]
    ShowErrors --> FixFile
    API_Real -- All Rows Valid --> Commit[DB Committed + Audit Log Recorded]
    Commit --> ShowSuccess[Success Banner: 'Imported X new, updated Y records']
```

---

## Screens

### 1. Centralized Data Management Hub (`/data-management`)
- **Purpose / Primary action**: Central administration dashboard for bulk data operations across all 7 domain entities. Primary action is selecting a target entity card and initiating an export or validated import.
- **Layout**:
  - **Header Region**: Title, subtitle, and right-aligned "Schema Reference & Rules" toggle button (`aria-expanded`).
  - **Role Tab Bar**: 4 organized tabs:
    1. *Master Data* (Categories, Products)
    2. *Purchasing* (Suppliers, Purchase Orders)
    3. *Warehouse & Batches* (Lots, Inventory Ledger)
    4. *Stocktake* (Cycle Count Sheets, Variances)
  - **Entity Cards Grid**: 2-column responsive layout (`grid-cols-1 lg:grid-cols-2`, gap: 24px).
  - **Interactive Drawer**: Slide-over schema guide from the right (width: 480px) displaying required headers, types, and sample data.
- **Component Breakdown per Entity Card**:
  - *Card Header*: Entity icon, title, description, and "Export CSV" secondary button.
  - *Template Banner*: Subtle row with "Download Sample CSV" link button.
  - *Dropzone*: File drag-and-drop target (height: 120px) with clear dashed border (`--wb-border-strong`), accessible hidden `<input type="file">`, and manual "Browse files" button.
  - *Selected File Chip*: Shows filename, formatted size, and remove `(x)` icon button.
  - *Pre-Flight Toggle*: Switch/checkbox: "Dry Run (Validate without saving changes)". Checked by default for safety.
  - *Card Footer*: Primary action button ("Run Preview" when dry-run is active, "Import to Database" when inactive).
- **States**:
  - *Default*: Clean dropzone with prompt "Drop .csv file here or click to browse".
  - *File Selected*: Chip renders with green border indicator.
  - *Loading / Uploading*: Progress bar with indeterminate animation or percentage, action button disabled with spinner.
  - *Dry Run Success*: Green pill badge: "Preview Passed: 24 valid rows found. Ready to commit."
  - *Error*: Red alert callout with expandable accordion list of line-item errors (e.g., `Line 4: Barcode '12345' not found in catalog`).
  - *Success*: Toast notification and card-level banner showing imported/updated count.

### 2. Embedded Domain Modals (Role-Delegated)
- **Pages**: `Suppliers.tsx`, `PurchaseOrders.tsx`, `Lots.tsx`, `CycleCounts.tsx`
- **Location**: Placed in the page header adjacent to existing "Create / New" buttons.
- **Components**:
  - Secondary button group: `[ Export CSV ]` `[ Bulk Import ]`
  - Clicking `[ Bulk Import ]` opens an accessible modal dialog (`role="dialog"`, `aria-modal="true"`):
    - Title: "Bulk Import [Entity Name]"
    - Sample template download link.
    - Drag & drop file area.
    - Dry-run validation toggle.
    - Action buttons: `[ Cancel ]` and `[ Validate & Import ]`.
    - Auto-dismiss on Escape key or backdrop click (with unsaved file warning).

---

## Nielsen Heuristics Application & Review

| Heuristic | Design Implementation |
|---|---|
| **#1 Visibility of System Status** | Distinct "Dry Run" vs "Live Import" badges; spinner states during upload; immediate visual feedback on file drop. |
| **#2 Match between System and Real World** | Terms like "Dry Run (Preview)", "Sample Template", "Rows", and "Line 12" rather than raw SQL or DB table names. |
| **#3 User Control and Freedom** | Remove button on selected file before submit; modal cancel buttons; non-destructive dry-run by default. |
| **#4 Consistency and Standards** | Identical dropzone, error accordion, and template download patterns across all 7 entities. |
| **#5 Error Prevention** | Atomic all-or-nothing rollback (prevents half-baked data); pre-flight dry run; file type constraints (`.csv` only). |
| **#6 Recognition over Recall** | Interactive Schema Reference drawer with exact header names and sample values visible without leaving the page. |
| **#7 Flexibility and Efficiency** | 1-click sample templates; keyboard shortcuts (`Esc` closes drawer/modals); drag-and-drop + click-to-browse. |
| **#8 Aesthetic and Minimalist Design** | Chunked into tabs (Master Data, Purchasing, Warehouse, Stocktake); avoids cognitive overload of 7 cards at once. |
| **#9 Error Recovery** | Precise line numbers, column names, and suggested corrections (e.g. `Line 7: Expiry date must be YYYY-MM-DD`). |
| **#10 Help and Documentation** | Contextual tooltips explaining synchronized lot onboarding, draft PO generation, and schema rules. |

---

## Accessibility Standard: WCAG 2.2 Level AA

1. **Color Contrast**:
   - Normal text: `--wb-text-primary` (`#f0f2f8`) on `--wb-surface-1` (`#13161e`) has contrast ratio **13.6:1** (exceeds 4.5:1).
   - Secondary text: `--wb-text-secondary` (`#8892a8`) on `--wb-surface-1` has contrast ratio **5.2:1** (exceeds 4.5:1).
   - Accent button: White text (`#ffffff`) on `--wb-accent` (`#0096ff`) has contrast ratio **3.8:1** $\rightarrow$ adjusted to dark blue text (`#0c0e14`) or deeper primary blue `#0077d4` for **4.7:1** on interactive controls.
   - Danger badge: `--wb-danger` (`#ef4444`) paired with text label and error icon, never color alone.
2. **Keyboard Operability & Focus**:
   - Hidden file inputs use `sr-only` and are triggered via keyboard-focusable `<label>` or `<button>`.
   - Focus ring: `outline: 2px solid var(--wb-accent); outline-offset: 2px;` visible on all interactive tabs, chips, and buttons.
   - Keyboard trap prevention in modals with standard focus trapping and `Esc` key handling.
3. **Screen Reader Semantics**:
   - Drag-and-drop dropzone announced with `role="region"` and `aria-label="CSV file upload area"`.
   - Error summaries announced immediately via `role="alert"` (`aria-live="assertive"`).
   - Success messages announced via `role="status"` (`aria-live="polite"`).
   - Tab navigation implemented with proper ARIA tabs pattern (`role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`).
4. **Target Size**:
   - All buttons, tabs, and file remove targets have minimum interactive dimensions of **40×40px** (desktop) and **44×44px** (mobile touch).

---

## Design Tokens Reused & Applied

```css
/* Surface hierarchy */
--wb-bg: #0c0e14;
--wb-surface-1: #13161e; /* Card background */
--wb-surface-2: #1a1d27; /* Dropzone background & table headers */

/* Spacing scale (4pt/8pt) */
spacing-xs: 4px;
spacing-sm: 8px;
spacing-md: 16px;
spacing-lg: 24px;
spacing-xl: 32px;

/* Interactive & Accent */
--wb-accent: #0096ff;
--wb-accent-hover: #0080eb;
--wb-accent-muted: rgba(0, 150, 255, 0.12);

/* Status feedback */
--wb-success: #22c55e;
--wb-success-muted: rgba(34, 197, 94, 0.12);
--wb-danger: #ef4444;
--wb-danger-muted: rgba(239, 68, 68, 0.12);
--wb-warning: #f59e0b;
--wb-warning-muted: rgba(245, 158, 11, 0.12);
```

---

## Acceptance Criteria

- [ ] **Tab Organization**: Navigating between Master Data, Purchasing, Warehouse, and Stocktake updates visible cards without full page reload.
- [ ] **Sample Template Download**: Clicking "Download Sample CSV" downloads a valid `.csv` with exact headers and one sample row.
- [ ] **Pre-Flight Dry Run**:
  - When "Dry Run" is checked, clicking the action validates rows and displays error counts or a green pass banner.
  - No database records are written or modified in dry-run mode.
- [ ] **Atomic Rollback Feedback**: When a live import contains an invalid row, the entire batch is rejected with an alert showing the exact row number and validation error.
- [ ] **Keyboard Navigation**: The entire upload flow (browsing file, toggling dry-run, submitting, and dismissing errors) can be completed using only the keyboard (`Tab`, `Space`, `Enter`, `Esc`).
- [ ] **Accessibility Compliance**: Meets WCAG 2.2 Level AA contrast, target size, and screen reader live-region requirements.
- [ ] **Domain Modals**: Authorized users on `/suppliers`, `/purchase-orders`, `/lots`, and `/cycle-counts` can trigger the import modal without navigating to the Admin hub.

---

## Risks and Alternatives Considered

- **Alternative Considered (Single Giant List)**: Showing all 7 entity cards on one long page.
  - *Rejected*: Caused severe cognitive overload and excessive vertical scrolling. The 4-tab categorization matches user mental models (Purchasing vs Warehouse vs Master Data).
- **Alternative Considered (Full Screen Wizard)**: A multi-step wizard (Upload $\rightarrow$ Map Columns $\rightarrow$ Validate $\rightarrow$ Commit).
  - *Rejected*: Over-engineered for standard CSV templates. Providing canonical sample CSV downloads and pre-flight dry runs is faster and simpler for warehouse and purchasing workflows.
