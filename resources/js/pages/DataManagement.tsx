import { useState, useEffect } from "react";
import {
    exportCategoriesCsv,
    exportProductsCsv,
    exportSuppliersCsv,
    exportLotsCsv,
    exportPurchaseOrdersCsv,
    exportCycleCountsCsv,
    exportInventoryTransactionsCsv,
    importCategoriesCsv,
    importProductsCsv,
    importSuppliersCsv,
    importLotsCsv,
    importPurchaseOrdersCsv,
    importCycleCountsCsv,
    downloadSampleTemplate,
    getAuditLogs,
    type ImportDataResponse,
    type AuditLog,
} from "../lib/inventory-api";
import BulkImportModal from "../components/BulkImportModal";

interface EntityDef {
    id: string;
    name: string;
    domain: "Catalog" | "Procurement" | "Warehouse" | "Ledger";
    domainLabel: string;
    domainBadge: string;
    description: string;
    mode: "Import & Export" | "Export Only";
    templateType?: string;
    exportFilename: string;
    exportFn: () => Promise<Blob>;
    importFn?: (file: File, dryRun: boolean) => Promise<ImportDataResponse>;
    helperText?: string;
    columns: string;
}

function formatActionBadge(action: string) {
    if (action === "bulk_import" || action.includes("import")) {
        return <span className="badge badge--pill badge--receipt">Bulk Import</span>;
    }
    if (action === "bulk_export" || action.includes("export")) {
        return <span className="badge badge--pill badge--sale">Bulk Export</span>;
    }
    if (action === "create") {
        return <span className="badge badge--pill badge--receipt">Created</span>;
    }
    if (action === "update") {
        return <span className="badge badge--pill badge--pending">Updated</span>;
    }
    if (action === "delete") {
        return <span className="badge badge--pill badge--danger">Deleted</span>;
    }
    return <span className="badge badge--pill badge--adjustment">{action.replace(/_/g, " ")}</span>;
}

function formatEntityTitle(entityType?: string | null) {
    if (!entityType) return "System Resource";
    const raw = entityType.split("\\").pop() || entityType;
    const map: Record<string, string> = {
        Category: "Categories",
        Product: "Products Master",
        Supplier: "Suppliers & Vendors",
        Lot: "Lots & Batches",
        PurchaseOrder: "Purchase Orders",
        CycleCount: "Cycle Counts",
        InventoryTransaction: "Inventory Ledger",
    };
    return map[raw] || raw;
}

function formatLogDetails(log: AuditLog) {
    const values = log.new_values || (log as any).details;
    if (!values || typeof values !== "object") return null;

    const parts: string[] = [];
    if (values.imported_count !== undefined) {
        parts.push(`${values.imported_count} imported`);
        if (values.updated_count) {
            parts.push(`${values.updated_count} updated`);
        }
    } else if (values.count !== undefined) {
        parts.push(`${values.count} records exported`);
    } else if (values.imported_po_count !== undefined) {
        parts.push(`${values.imported_po_count} orders imported`);
    }

    if (values.filename) {
        parts.push(`file: ${values.filename}`);
    }

    if (parts.length === 0) {
        if (values.name) {
            parts.push(`"${values.name}"`);
        } else if (values.barcode) {
            parts.push(`SKU: ${values.barcode}`);
        } else if (values.po_number) {
            parts.push(`PO #${values.po_number}`);
        }
    }

    return parts.length > 0 ? parts.join(" • ") : null;
}

function formatLogTimestamp(timestamp?: string | null) {
    if (!timestamp) return "Just now";
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "Recently";
    return date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

export default function DataManagement() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDomain, setSelectedDomain] = useState<string>("all");
    const [showSchemaGuide, setShowSchemaGuide] = useState(false);
    const [exportingId, setExportingId] = useState<string | null>(null);
    const [downloadingTemplateId, setDownloadingTemplateId] = useState<string | null>(null);
    const [activeImportEntity, setActiveImportEntity] = useState<EntityDef | null>(null);
    const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const entities: EntityDef[] = [
        {
            id: "categories",
            name: "Categories",
            domain: "Catalog",
            domainLabel: "Catalog",
            domainBadge: "badge--receipt",
            description: "Product categories, taxonomy hierarchy, and catalog slug structure",
            mode: "Import & Export",
            templateType: "categories",
            exportFilename: "categories_export",
            exportFn: exportCategoriesCsv,
            importFn: importCategoriesCsv,
            helperText: "Restores soft-deleted categories or creates new taxonomy records.",
            columns: "category_id, name*, slug, description",
        },
        {
            id: "products",
            name: "Products Master",
            domain: "Catalog",
            domainLabel: "Catalog",
            domainBadge: "badge--receipt",
            description: "SKUs, barcodes, unit cost/price, classification flags, and UOM",
            mode: "Import & Export",
            templateType: "products",
            exportFilename: "products_export",
            exportFn: exportProductsCsv,
            importFn: importProductsCsv,
            helperText: "Auto-creates zero-stock inventory snapshot rows upon SKU creation.",
            columns: "sku_id, category_name, name*, barcode*, unit_of_measure, is_seasonal, unit_cost, unit_price",
        },
        {
            id: "suppliers",
            name: "Suppliers & Vendors",
            domain: "Procurement",
            domainLabel: "Procurement",
            domainBadge: "badge--sale",
            description: "Vendor profiles, procurement lead times, contacts, and active status",
            mode: "Import & Export",
            templateType: "suppliers",
            exportFilename: "suppliers_export",
            exportFn: exportSuppliersCsv,
            importFn: importSuppliersCsv,
            helperText: "Configures supplier lead times used by automated reorder calculations.",
            columns: "name*, contact_name, contact_email, contact_phone, address, lead_time_days, is_active",
        },
        {
            id: "purchase_orders",
            name: "Purchase Orders",
            domain: "Procurement",
            domainLabel: "Procurement",
            domainBadge: "badge--sale",
            description: "Vendor orders & line items grouped by PO number into draft orders",
            mode: "Import & Export",
            templateType: "purchase_orders",
            exportFilename: "purchase_orders_export",
            exportFn: exportPurchaseOrdersCsv,
            importFn: importPurchaseOrdersCsv,
            helperText: "Flattened line-item CSV grouping: rows sharing po_number are consolidated with auto-calculated total.",
            columns: "po_number*, supplier_name*, order_date, barcode*, quantity_ordered*, unit_cost",
        },
        {
            id: "lots",
            name: "Lots & Batches",
            domain: "Warehouse",
            domainLabel: "Warehouse",
            domainBadge: "badge--pending",
            description: "Physical batch inventory with synchronized inbound ledger receipt",
            mode: "Import & Export",
            templateType: "lots",
            exportFilename: "lots_export",
            exportFn: exportLotsCsv,
            importFn: importLotsCsv,
            helperText: "Synchronized Onboarding: Automatically creates RECEIPT transaction and increments on-hand snapshots.",
            columns: "lot_id, barcode*, bin_location*, quantity*, received_date*, expiry_date",
        },
        {
            id: "cycle_counts",
            name: "Cycle Count Sheets",
            domain: "Warehouse",
            domainLabel: "Warehouse",
            domainBadge: "badge--pending",
            description: "Physical stocktake count sheets for discrepancy detection against system stock",
            mode: "Import & Export",
            templateType: "cycle_count_sheet",
            exportFilename: "cycle_counts_export",
            exportFn: () => exportCycleCountsCsv(),
            importFn: importCycleCountsCsv,
            helperText: "Ingests physical count sheets and generates pending counts with variance calculations.",
            columns: "barcode*, lot_id, counted_quantity*, notes",
        },
        {
            id: "inventory_transactions",
            name: "Inventory Ledger",
            domain: "Ledger",
            domainLabel: "Ledger",
            domainBadge: "badge--write-off",
            description: "Immutable, append-only ledger of all physical stock movements",
            mode: "Export Only",
            exportFilename: "inventory_transactions_ledger",
            exportFn: () => exportInventoryTransactionsCsv(),
            helperText: "Export-only compliance trail: Audit ledger cannot be modified via import to guarantee append-only integrity.",
            columns: "txn_id, occurred_at, txn_type, qty_delta, sku_id, barcode, product_name, actor_name",
        },
    ];

    useEffect(() => {
        loadRecentActivity();
    }, []);

    const loadRecentActivity = async () => {
        setLogsLoading(true);
        try {
            const res = await getAuditLogs(1, 20);
            const logsData = res.data?.data || [];
            // Filter to bulk operations or fallback to recent audit events
            const bulkLogs = logsData.filter(
                (log) => log.action === "bulk_import" || log.action === "bulk_export"
            );
            setRecentLogs(bulkLogs.length > 0 ? bulkLogs : logsData.slice(0, 6));
        } catch {
            // Audit logs fallback
        } finally {
            setLogsLoading(false);
        }
    };

    const handleExport = async (entity: EntityDef) => {
        setExportingId(entity.id);
        setActionMessage(null);
        try {
            const blob = await entity.exportFn();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${entity.exportFilename}_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            setActionMessage({
                type: "success",
                text: `Exported ${entity.name} successfully.`,
            });
            loadRecentActivity();
        } catch (err: unknown) {
            setActionMessage({
                type: "error",
                text: err instanceof Error ? err.message : `Failed to export ${entity.name}.`,
            });
        } finally {
            setExportingId(null);
        }
    };

    const handleDownloadTemplate = async (entity: EntityDef) => {
        if (!entity.templateType) return;
        setDownloadingTemplateId(entity.id);
        setActionMessage(null);
        try {
            const blob = await downloadSampleTemplate(entity.templateType);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `sample_${entity.templateType}_template.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err: unknown) {
            setActionMessage({
                type: "error",
                text: err instanceof Error ? err.message : "Failed to download sample template.",
            });
        } finally {
            setDownloadingTemplateId(null);
        }
    };

    const filteredEntities = entities.filter((entity) => {
        const matchesSearch =
            entity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entity.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entity.domainLabel.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDomain = selectedDomain === "all" || entity.domain.toLowerCase() === selectedDomain.toLowerCase();
        return matchesSearch && matchesDomain;
    });

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-lg sm:text-xl font-bold text-[var(--wb-text-primary)]">Data Management Hub</h1>
                    <p className="page-subtitle text-xs text-[var(--wb-text-secondary)]">
                        Enterprise bulk import/export center with atomic transactions, pre-flight dry runs, and audit logging
                    </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                        type="button"
                        className="btn btn--secondary btn--sm inline-flex items-center gap-1.5 touch-manipulation"
                        onClick={() => setShowSchemaGuide(!showSchemaGuide)}
                        aria-expanded={showSchemaGuide}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="16" x2="12" y2="12" />
                            <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                        <span>{showSchemaGuide ? "Hide Schema Specs" : "Schema Specs"}</span>
                    </button>
                </div>
            </div>

            {/* Notification alert */}
            {actionMessage && (
                <div
                    className={`alert-banner ${
                        actionMessage.type === "success" ? "alert-banner--info" : "alert-banner--danger"
                    }`}
                    role="alert"
                >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {actionMessage.type === "success" ? (
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3" />
                        ) : (
                            <>
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </>
                        )}
                    </svg>
                    <span>{actionMessage.text}</span>
                </div>
            )}

            {/* Top Stat Cards */}
            <section className="stats-grid" aria-label="Data Management Overview">
                <div className="stat-card stat-card--blue">
                    <div className="stat-card__icon" aria-hidden="true">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <ellipse cx="12" cy="5" rx="9" ry="3" />
                            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                        </svg>
                    </div>
                    <div className="stat-card__info">
                        <span className="stat-card__value">7</span>
                        <span className="stat-card__label">System Modules</span>
                    </div>
                </div>

                <div className="stat-card stat-card--green">
                    <div className="stat-card__icon" aria-hidden="true">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>
                    <div className="stat-card__info">
                        <span className="stat-card__value">100%</span>
                        <span className="stat-card__label">Atomic Rollback Safety</span>
                    </div>
                </div>

                <div className="stat-card stat-card--amber">
                    <div className="stat-card__icon" aria-hidden="true">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    </div>
                    <div className="stat-card__info">
                        <span className="stat-card__value">Pre-Flight</span>
                        <span className="stat-card__label">Dry Run Validation</span>
                    </div>
                </div>

                <div className="stat-card stat-card--purple">
                    <div className="stat-card__icon" aria-hidden="true">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                    </div>
                    <div className="stat-card__info">
                        <span className="stat-card__value">Audited</span>
                        <span className="stat-card__label">Immutable Operation Trail</span>
                    </div>
                </div>
            </section>

            {/* Schema Reference Guide (Collapsible Drawer/Card) */}
            {showSchemaGuide && (
                <div className="analytics-card p-4 sm:p-6 bg-[var(--wb-surface-1)] border border-[var(--wb-border-strong)] rounded-xl space-y-4 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between border-b border-[var(--wb-border)] pb-3">
                        <div>
                            <h2 className="text-sm sm:text-base font-semibold text-[var(--wb-text-primary)]">
                                Canonical CSV Schema Specifications
                            </h2>
                            <p className="text-[11px] sm:text-xs text-[var(--wb-text-secondary)] mt-0.5">
                                Headers must match exactly. Required fields are marked with *. UTF-8 encoding without BOM recommended.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowSchemaGuide(false)}
                            className="text-xs text-[var(--wb-text-muted)] hover:text-[var(--wb-text-primary)] p-1 touch-manipulation"
                        >
                            ✕ Close
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-xs">
                        {entities.map((e) => (
                            <div key={e.id} className="p-3 bg-[var(--wb-surface-2)] rounded-lg space-y-1.5 border border-[var(--wb-border)]">
                                <div className="flex items-center justify-between gap-1">
                                    <span className="font-semibold text-[var(--wb-text-primary)]">{e.name}</span>
                                    <span className={`badge badge--pill text-[10px] ${e.domainBadge}`}>{e.domainLabel}</span>
                                </div>
                                <code className="font-mono text-[11px] text-[var(--wb-accent)] block break-all">
                                    {e.columns}
                                </code>
                                <p className="text-[11px] text-[var(--wb-text-muted)]">{e.helperText}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Search & Category Filter Navigation Bar */}
            <div className="filter-bar flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2 w-full sm:max-w-xs md:max-w-sm">
                    <input
                        type="text"
                        placeholder="Search entities or modules…"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="form-control text-xs w-full"
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => setSearchTerm("")}
                            className="text-xs text-[var(--wb-text-muted)] hover:text-[var(--wb-text-primary)] px-1"
                        >
                            Clear
                        </button>
                    )}
                </div>

                {/* Module Navigation Tabs (Horizontally scrollable on mobile) */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto scrollbar-none" role="tablist" aria-label="Filter modules">
                    {[
                        { id: "all", label: "All Modules" },
                        { id: "Catalog", label: "Catalog" },
                        { id: "Procurement", label: "Procurement" },
                        { id: "Warehouse", label: "Warehouse" },
                        { id: "Ledger", label: "Audit & Ledger" },
                    ].map(({ id, label }) => (
                        <button
                            key={id}
                            type="button"
                            role="tab"
                            aria-selected={selectedDomain === id}
                            onClick={() => setSelectedDomain(id)}
                            className={`btn btn--sm text-xs py-2 px-3.5 rounded-full transition-all shrink-0 whitespace-nowrap touch-manipulation min-h-[38px] ${
                                selectedDomain === id
                                    ? "btn--primary font-semibold shadow-sm"
                                    : "btn--secondary text-[var(--wb-text-secondary)] hover:text-[var(--wb-text-primary)]"
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Entity Directory Table */}
            <section className="table-section">
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Data Entity & Scope</th>
                                <th>Description</th>
                                <th>Access Mode</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEntities.map((entity) => (
                                <tr key={entity.id}>
                                    <td className="font-medium whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <span className={`badge badge--pill ${entity.domainBadge}`}>
                                                {entity.domainLabel}
                                            </span>
                                            <span className="text-sm text-[var(--wb-text-primary)] font-semibold">
                                                {entity.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="text-xs text-[var(--wb-text-secondary)] max-w-xs leading-relaxed">
                                        {entity.description}
                                    </td>
                                    <td className="whitespace-nowrap">
                                        <span className="text-xs font-mono text-[var(--wb-text-muted)]">
                                            {entity.mode}
                                        </span>
                                    </td>
                                    <td className="text-right whitespace-nowrap">
                                        <div className="inline-flex items-center justify-end gap-2">
                                            {entity.templateType && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDownloadTemplate(entity)}
                                                    disabled={downloadingTemplateId === entity.id}
                                                    className="btn btn--secondary btn--sm"
                                                    title="Download sample CSV template"
                                                >
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                        <polyline points="14 2 14 8 20 8" />
                                                    </svg>
                                                    <span>{downloadingTemplateId === entity.id ? "…" : "Template"}</span>
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => handleExport(entity)}
                                                disabled={exportingId === entity.id}
                                                className="btn btn--secondary btn--sm"
                                                title="Export full CSV"
                                            >
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                    <polyline points="7 10 12 15 17 10" />
                                                    <line x1="12" y1="15" x2="12" y2="3" />
                                                </svg>
                                                <span>{exportingId === entity.id ? "Exporting…" : "Export"}</span>
                                            </button>

                                            {entity.importFn && (
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveImportEntity(entity)}
                                                    className="btn btn--primary btn--sm"
                                                    title="Bulk import CSV with dry-run verification"
                                                >
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                        <polyline points="17 8 12 3 7 8" />
                                                        <line x1="12" y1="3" x2="12" y2="15" />
                                                    </svg>
                                                    <span>Import</span>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Recent Bulk Operations Activity Table */}
            <section className="table-section">
                <div className="table-section__header flex items-center justify-between">
                    <div>
                        <h2>Recent Data Operations Activity</h2>
                        <p className="page-subtitle">Audit trail of administrative bulk ingestions and exports across system modules</p>
                    </div>
                    <button
                        type="button"
                        onClick={loadRecentActivity}
                        disabled={logsLoading}
                        className="btn btn--secondary btn--sm"
                    >
                        {logsLoading ? "Refreshing…" : "Refresh"}
                    </button>
                </div>

                {logsLoading ? (
                    <div className="page-loading">Loading recent activity…</div>
                ) : recentLogs.length === 0 ? (
                    <p className="empty-state">No bulk operations recorded yet. Recent CSV exports and imports will appear here.</p>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Operation</th>
                                    <th>Resource</th>
                                    <th>Details</th>
                                    <th>Performed By</th>
                                    <th>Date & Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentLogs.map((log) => {
                                    const details = formatLogDetails(log);
                                    return (
                                        <tr key={log.id}>
                                            <td className="whitespace-nowrap">
                                                <span className={`badge ${
                                                    log.action.includes("import") ? "badge--receipt"
                                                    : log.action.includes("export") ? "badge--sale"
                                                    : "badge--adjustment"
                                                }`}>
                                                    {log.action === "bulk_import" ? "Bulk Import"
                                                     : log.action === "bulk_export" ? "Bulk Export"
                                                     : log.action.replace(/_/g, " ")}
                                                </span>
                                            </td>
                                            <td className="td-bold whitespace-nowrap">
                                                {formatEntityTitle(log.entity_type)}
                                            </td>
                                            <td className="text-secondary text-xs">
                                                {details ?? "—"}
                                            </td>
                                            <td className="whitespace-nowrap">
                                                {log.actor?.name ?? "System"}
                                            </td>
                                            <td className="text-muted text-xs whitespace-nowrap">
                                                {formatLogTimestamp(log.occurred_at)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Active Import Modal */}
            {activeImportEntity && activeImportEntity.importFn && (
                <BulkImportModal
                    isOpen={Boolean(activeImportEntity)}
                    onClose={() => setActiveImportEntity(null)}
                    title={`Bulk Import ${activeImportEntity.name}`}
                    templateType={activeImportEntity.templateType || activeImportEntity.id}
                    onImport={activeImportEntity.importFn}
                    onSuccess={() => {
                        setActionMessage({
                            type: "success",
                            text: `Successfully imported ${activeImportEntity.name} batch into database.`,
                        });
                        loadRecentActivity();
                    }}
                    helperText={activeImportEntity.helperText}
                />
            )}
        </div>
    );
}
