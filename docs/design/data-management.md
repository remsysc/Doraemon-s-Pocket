# Data Management Redesign Specification

## Summary
The Data Management section provides Admin users with CSV export and transactional bulk-import capabilities for Master Data (Categories and Products). This redesign brings the Data Management view into full visual and behavioral consistency with the rest of the Doraemon's Pocket application (using design tokens `--wb-*`, `page-header`, `stats-grid`, `analytics-card`, `tab-bar`, `alert-banner`, and standard button and badge hierarchies). It replaces the ad-hoc utility styles and unstyled file input with an accessible, high-contrast, drag-and-drop file upload zone with clear feedback, item counters, row error diagnostics, and schema specifications.

## Assumptions and open questions
- **Assumptions**:
  - Primary user role is Admin (enforced at both route and backend policy levels).
  - Supported formats remain RFC 4180 standard CSV files with max upload size of 10MB.
  - The page operates in both Dark (default) and Light themes using the application's CSS design tokens.
  - The import endpoint responses provide `message`, `imported_count`, `updated_count`, and `errors: string[]`.
- **Open questions**: None blocking; existing API contracts remain intact.

## Users and success metric
- **Primary user**: System Administrator managing large-scale inventory catalog changes.
- **Core task**: Export current catalog data to CSV and safely bulk-upload updated/new categories and products with instant feedback.
- **Success metric**: 100% task completion with 0 unhandled error states and zero style divergence from the design system.

## Flow
1. **Entry**: Admin navigates to `/data-management` from sidebar navigation.
2. **Review overview**: Top stat cards indicate supported entities, data format (CSV), transaction safety, and role permission.
3. **Select task**: Use tabs (`All Operations`, `Categories`, `Products`, `Format Guide`) or navigate direct cards.
4. **Export (Happy Path)**:
   - Click "Export CSV" on either Categories or Products card.
   - Button enters loading state ("Exporting...").
   - Browser triggers file download (`categories_export_YYYY-MM-DD.csv` or `products_export_YYYY-MM-DD.csv`).
5. **Import (Happy Path)**:
   - Select or drag CSV file into the dedicated upload dropzone.
   - File details (name, size) are shown with a clear "Remove" button.
   - Click "Upload & Import Categories/Products".
   - Button shows spinner/loading state; inputs disabled.
   - Success alert appears showing `message`, pills for `imported_count` and `updated_count`.
6. **Import (Error / Warning Path)**:
   - Validation failure (422) or server error shows `alert-banner--danger` with clear diagnostic text.
   - Row-level warnings (non-fatal skipped rows) show an itemized warnings list without breaking the layout.
   - User can re-select a file or inspect the Format Guide tab below.

## Screens

### Screen: `/data-management`
- **Purpose / primary action**: Bulk import/export of master categories and products.
- **Layout**:
  - **Header**: Standard `.page-header` with page title "Data Management", subtitle, and quick export action shortcuts.
  - **Stats Grid**: 4 `.stat-card` elements showing:
    - Master Entities: Categories & Products
    - Export / Import Engine: Streaming CSV (RFC 4180)
    - Safety Guarantee: Transactional DB Rollback
    - Role Authorization: Admin Superuser
  - **Tab Bar**: `.tab-bar` with 4 tabs:
    - `All Operations` (default)
    - `Categories`
    - `Products`
    - `Format Guide`
  - **Operations Section**:
    - Dual-column grid on desktop (`grid-cols-1 lg:grid-cols-2 gap-6`), single column on mobile.
    - Uses `.analytics-card` styling with `.analytics-card__header` containing title, category badge, and direct Export button.
    - Card body with description, interactive drag-and-drop dropzone, file preview, import action button (`btn--primary`).
    - Dynamic alert feedback using `.alert-banner` (`--info` for success, `--danger` for errors).
    - Card footer indicating required and optional columns with `code` chips.
  - **Format Guide Section**:
    - Styled as `.table-section` or `.analytics-card` with full specification table: Field Name, Requirement Badge (`Required` / `Optional`), Data Type, Description, and Sample Value.
- **Components Used**:
  - Existing: `DashboardLayout`, `.page-header`, `.page-subtitle`, `.stats-grid`, `.stat-card`, `.tab-bar`, `.tab-btn`, `.tab-btn--active`, `.btn`, `.btn--primary`, `.btn--secondary`, `.btn--sm`, `.alert-banner`, `.badge`, `.badge--sale`, `.badge--adjustment`, `.badge--write_off`.
  - Dropzone: Enhanced accessible dropzone adhering to `--wb-surface-2`, `--wb-border-strong`, and `--wb-accent` focus/active rings.
- **States**:
  - Default: Empty dropzone awaiting file selection.
  - File Selected: Displays file badge with filename, humanized size, and clear button.
  - Loading: Buttons show "Exporting..." / "Importing...", disabled state, aria-busy="true".
  - Success: Alert banner with count summary badges.
  - Error: Alert banner with error message and error list.

## Tokens and components
- Uses `--wb-bg`, `--wb-surface-1`, `--wb-surface-2`, `--wb-border`, `--wb-border-strong`.
- Uses `--wb-accent` (#0096ff / #0080d3), `--wb-success` (#22c55e), `--wb-warning` (#f59e0b), `--wb-danger` (#ef4444).
- Spacing: 8pt grid (`gap-6`, `p-6`, `p-4`, `space-y-6`).
- Font sizing: 13.5px body, 15px card titles, 24px page header.

## Acceptance criteria
- [ ] Visual style is indistinguishable from `Products.tsx`, `Reports.tsx`, and `StockOverview.tsx`.
- [ ] Full responsiveness across mobile (<640px), tablet (<1024px), and desktop (>=1024px).
- [ ] Light and dark mode support with WCAG 2.2 AA compliant contrast ratios.
- [ ] Export Categories and Export Products download valid CSV files.
- [ ] Import Categories and Import Products properly validate file inputs, send multipart form data, and display import counts or error messages.
- [ ] Drag-and-drop and file input are accessible via keyboard with visible focus states and proper label/button semantics.
- [ ] No regression in backend tests (`php artisan test tests/Feature/DataManagementTest.php`).
- [ ] Production build succeeds without TypeScript or Vite errors (`npm run build`).

## Risks and alternatives considered
- *Alternative*: Keeping file inputs plain native inputs. *Rejected* because native file inputs lack drag-and-drop, accessible file clear actions, and violate the application's sleek dark-mode visual polish.
- *Alternative*: Modal dialogs for import. *Rejected* because import/export is a primary data management workstation task, and inline cards provide superior visibility and schema reference side-by-side.
