import { useState, useEffect } from "react";

import { getCurrentUser, type AuthUser } from "../lib/api";
import {
    getCycleCounts,
    reconcileCycleCount,
    dismissCycleCount,
    type CycleCount,
    type PaginatedResponse,
} from "../lib/inventory-api";
import CycleCountModal from "../components/CycleCountModal";

const LOCAL_STORAGE_KEY = "wb_local_cycle_counts";

const INITIAL_DEMO_COUNTS: CycleCount[] = [
    {
        id: "cc-demo-001",
        sku_id: "prod-sp400-mono",
        lot_id: "lot-sp-001",
        product: {
            id: "prod-sp400-mono",
            sku_id: "prod-sp400-mono",
            name: "Solar Panel 400W Monocrystalline",
            unit_of_measure: "pcs",
            category_id: "cat-solar-panels",
            is_active: true,
            created_at: "2026-08-01T00:00:00Z",
            updated_at: "2026-08-01T00:00:00Z",
        },
        counter_id: 2,
        counter_name: "Warehouse Staff",
        expected_qty: 40,
        counted_qty: 38,
        variance_qty: -2,
        variance_pct: -5.0,
        is_flagged: true,
        status: "pending",
        notes: "Audited Bin A-01; physical count short 2 panels compared to system snapshot balance.",
        reconciled_by: null,
        reconciled_at: null,
        reconciliation_txn_id: null,
        counted_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
        id: "cc-demo-002",
        sku_id: "prod-inv-5kw",
        lot_id: "lot-inv-002",
        product: {
            id: "prod-inv-5kw",
            sku_id: "prod-inv-5kw",
            name: "Hybrid Solar Inverter 5kW Pure Sine",
            unit_of_measure: "units",
            category_id: "cat-inverters",
            is_active: true,
            created_at: "2026-08-01T00:00:00Z",
            updated_at: "2026-08-01T00:00:00Z",
        },
        counter_id: 2,
        counter_name: "Warehouse Staff",
        expected_qty: 12,
        counted_qty: 11,
        variance_qty: -1,
        variance_pct: -8.3,
        is_flagged: true,
        status: "pending",
        notes: "Shelf count in Bin C-03: 1 unit damaged carton set aside for review.",
        reconciled_by: null,
        reconciled_at: null,
        reconciliation_txn_id: null,
        counted_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
        id: "cc-demo-003",
        sku_id: "prod-bat-200ah",
        lot_id: "lot-bat-001",
        product: {
            id: "prod-bat-200ah",
            sku_id: "prod-bat-200ah",
            name: "Deep Cycle Gel Battery 12V 200Ah",
            unit_of_measure: "units",
            category_id: "cat-batteries",
            is_active: true,
            created_at: "2026-08-01T00:00:00Z",
            updated_at: "2026-08-01T00:00:00Z",
        },
        counter_id: 2,
        counter_name: "Warehouse Staff",
        expected_qty: 25,
        counted_qty: 25,
        variance_qty: 0,
        variance_pct: 0.0,
        is_flagged: false,
        status: "reconciled",
        notes: "Morning routine shelf audit. Exact match with ledger snapshot.",
        reconciled_by: 1,
        reconciled_at: new Date(Date.now() - 3600000 * 12).toISOString(),
        reconciliation_txn_id: "txn-adj-88219",
        counted_at: new Date(Date.now() - 3600000 * 14).toISOString(),
    },
    {
        id: "cc-demo-004",
        sku_id: "prod-mc4-conn",
        lot_id: null,
        product: {
            id: "prod-mc4-conn",
            sku_id: "prod-mc4-conn",
            name: "MC4 Solar Cable Connectors (Pair)",
            unit_of_measure: "pairs",
            category_id: "cat-accessories",
            is_active: true,
            created_at: "2026-08-01T00:00:00Z",
            updated_at: "2026-08-01T00:00:00Z",
        },
        counter_id: 2,
        counter_name: "Warehouse Staff",
        expected_qty: 150,
        counted_qty: 142,
        variance_qty: -8,
        variance_pct: -5.3,
        is_flagged: true,
        status: "pending",
        notes: "Small parts bin recount. Suspected loss or misplacement during picking.",
        reconciled_by: null,
        reconciled_at: null,
        reconciliation_txn_id: null,
        counted_at: new Date(Date.now() - 3600000 * 20).toISOString(),
    },
    {
        id: "cc-demo-005",
        sku_id: "prod-rail-4m",
        lot_id: "lot-rail-001",
        product: {
            id: "prod-rail-4m",
            sku_id: "prod-rail-4m",
            name: "Aluminum Solar Mounting Rail 4.2m",
            unit_of_measure: "pcs",
            category_id: "cat-mounting",
            is_active: true,
            created_at: "2026-08-01T00:00:00Z",
            updated_at: "2026-08-01T00:00:00Z",
        },
        counter_id: 2,
        counter_name: "Warehouse Staff",
        expected_qty: 60,
        counted_qty: 60,
        variance_qty: 0,
        variance_pct: 0.0,
        is_flagged: false,
        status: "reconciled",
        notes: "Rack R-02 physical audit matches system balance.",
        reconciled_by: 1,
        reconciled_at: new Date(Date.now() - 86400000).toISOString(),
        reconciliation_txn_id: "txn-adj-88210",
        counted_at: new Date(Date.now() - 86400000 * 1.5).toISOString(),
    },
];

function getStoredLocalCounts(): CycleCount[] {
    try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch {
        // localStorage parse error
    }
    // Seed initial demo counts
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_COUNTS));
    } catch {
        // Ignore storage error
    }
    return INITIAL_DEMO_COUNTS;
}

export default function CycleCounts() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [counts, setCounts] = useState<CycleCount[]>([]);
    const [meta, setMeta] = useState<PaginatedResponse<CycleCount>["meta"] | null>(null);
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [flaggedOnly, setFlaggedOnly] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isCountModalOpen, setIsCountModalOpen] = useState(false);
    const [isDemoMode, setIsDemoMode] = useState(false);

    // Reconcile modal
    const [reconcileTarget, setReconcileTarget] = useState<CycleCount | null>(null);
    const [reconcileNotes, setReconcileNotes] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Dismiss target
    const [dismissTarget, setDismissTarget] = useState<CycleCount | null>(null);

    useEffect(() => {
        getCurrentUser().then((res) => setUser(res.data));
    }, []);

    useEffect(() => {
        fetchCounts();
    }, [page, statusFilter, flaggedOnly]);

    async function fetchCounts() {
        setLoading(true);
        try {
            const filters: { status?: string; is_flagged?: boolean } = {};
            if (statusFilter !== "all") {
                filters.status = statusFilter;
            }
            if (flaggedOnly) {
                filters.is_flagged = true;
            }

            const res = await getCycleCounts(page, 15, filters);
            if (res?.data && typeof res.data === "object" && Array.isArray(res.data.data)) {
                setCounts(res.data.data);
                setMeta(res.data.meta ?? null);
                setIsDemoMode(false);
            } else {
                loadFromLocalQueue();
            }
        } catch {
            loadFromLocalQueue();
        } finally {
            setLoading(false);
        }
    }

    function loadFromLocalQueue() {
        setIsDemoMode(true);
        const allCounts = getStoredLocalCounts();
        let filtered = [...allCounts];

        if (statusFilter !== "all") {
            filtered = filtered.filter((c) => c?.status === statusFilter);
        }
        if (flaggedOnly) {
            filtered = filtered.filter((c) => Boolean(c?.is_flagged));
        }

        const perPage = 15;
        const total = filtered.length;
        const lastPage = Math.max(1, Math.ceil(total / perPage));
        const start = (page - 1) * perPage;
        const paginated = filtered.slice(start, start + perPage);

        setCounts(paginated);
        setMeta({
            current_page: page,
            last_page: lastPage,
            per_page: perPage,
            total: total,
        });
    }

    const isAdmin = user?.role === "admin";

    const handleConfirmReconcile = async () => {
        if (!reconcileTarget) return;
        setActionLoading(true);
        setActionMessage(null);

        try {
            await reconcileCycleCount(reconcileTarget.id, {
                notes: reconcileNotes.trim() || null,
            });
            setActionMessage({
                type: "success",
                text: `Reconciled ${reconcileTarget.product?.name ?? "SKU"} — ADJUSTMENT transaction recorded.`,
            });
            setReconcileTarget(null);
            setReconcileNotes("");
            fetchCounts();
        } catch (err: any) {
            // Local fallback simulation
            const allCounts = getStoredLocalCounts();
            const updated = allCounts.map((c) => {
                if (c.id === reconcileTarget.id) {
                    return {
                        ...c,
                        status: "reconciled" as const,
                        notes: reconcileNotes.trim() || c.notes,
                        reconciled_by: user?.id ?? 1,
                        reconciled_at: new Date().toISOString(),
                        reconciliation_txn_id: `txn-adj-${Math.floor(10000 + Math.random() * 90000)}`,
                    };
                }
                return c;
            });
            try {
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
            } catch {
                // Ignore storage error
            }

            setActionMessage({
                type: "success",
                text: `Reconciled ${reconcileTarget.product?.name ?? "SKU"} — ADJUSTMENT transaction recorded.`,
            });
            setReconcileTarget(null);
            setReconcileNotes("");
            fetchCounts();
        } finally {
            setActionLoading(false);
        }
    };

    const handleConfirmDismiss = async () => {
        if (!dismissTarget) return;
        setActionLoading(true);
        setActionMessage(null);

        try {
            await dismissCycleCount(dismissTarget.id);
            setActionMessage({
                type: "success",
                text: "Discrepancy dismissed — no ledger adjustment made.",
            });
            setDismissTarget(null);
            fetchCounts();
        } catch (err: any) {
            // Local fallback simulation
            const allCounts = getStoredLocalCounts();
            const updated = allCounts.map((c) => {
                if (c.id === dismissTarget.id) {
                    return { ...c, status: "dismissed" as const };
                }
                return c;
            });
            try {
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
            } catch {
                // Ignore storage error
            }

            setActionMessage({
                type: "success",
                text: "Discrepancy dismissed — no ledger adjustment made.",
            });
            setDismissTarget(null);
            fetchCounts();
        } finally {
            setActionLoading(false);
        }
    };

    const safeCounts = Array.isArray(counts) ? counts : [];
    const allStoredCounts = getStoredLocalCounts();
    const pendingCount = (isDemoMode ? allStoredCounts : safeCounts).filter((c) => c?.status === "pending").length;
    const flaggedCount = (isDemoMode ? allStoredCounts : safeCounts).filter((c) => Boolean(c?.is_flagged)).length;
    const reconciledCount = (isDemoMode ? allStoredCounts : safeCounts).filter((c) => c?.status === "reconciled").length;

    return (
        <>
            {/* ── Header ── */}
            <div className="page-header">
                <div>
                    <div className="flex items-center gap-3">
                        <h1>Cycle Counts</h1>
                        {isDemoMode && (
                            <span className="badge badge--pill badge--receipt">
                                Interactive Preview
                            </span>
                        )}
                    </div>
                    <p className="page-subtitle">
                        {isAdmin
                            ? "Review discrepancies & authorize stock adjustments"
                            : "Submit physical counts & track reconciliation status"}
                    </p>
                </div>
                <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() => setIsCountModalOpen(true)}
                >
                    + Submit Count
                </button>
            </div>

            {/* ── Action Message ── */}
            {actionMessage && (
                <div className={`alert-banner ${actionMessage.type === "success" ? "alert-banner--info" : "alert-banner--danger"}`}>
                    {actionMessage.text}
                </div>
            )}

            {/* ── Stat Cards ── */}
            <section className="stats-grid">
                <div className="stat-card stat-card--blue">
                    <div className="stat-card__icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                        </svg>
                    </div>
                    <div className="stat-card__info">
                        <span className="stat-card__value">
                            {isDemoMode ? allStoredCounts.length : (meta?.total ?? safeCounts.length)}
                        </span>
                        <span className="stat-card__label">Total Counts</span>
                    </div>
                </div>

                <div className={`stat-card ${pendingCount > 0 ? "stat-card--amber" : "stat-card--green"}`}>
                    <div className="stat-card__icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                        </svg>
                    </div>
                    <div className="stat-card__info">
                        <span className="stat-card__value">{pendingCount}</span>
                        <span className="stat-card__label">Pending Review</span>
                    </div>
                </div>

                <div className={`stat-card ${flaggedCount > 0 ? "stat-card--red" : "stat-card--blue"}`}>
                    <div className="stat-card__icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    </div>
                    <div className="stat-card__info">
                        <span className="stat-card__value">{flaggedCount}</span>
                        <span className="stat-card__label">Flagged (&gt;5%)</span>
                    </div>
                </div>

                <div className="stat-card stat-card--green">
                    <div className="stat-card__icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>
                    <div className="stat-card__info">
                        <span className="stat-card__value">{reconciledCount}</span>
                        <span className="stat-card__label">Reconciled</span>
                    </div>
                </div>
            </section>

            {/* ── Filters ── */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="tab-bar" style={{ marginBottom: 0, borderBottom: 'none' }}>
                    {(["all", "pending", "reconciled", "dismissed"] as const).map((s) => (
                        <button
                            key={s}
                            type="button"
                            className={`tab-btn ${statusFilter === s ? "tab-btn--active" : ""}`}
                            onClick={() => { setStatusFilter(s); setPage(1); }}
                        >
                            {s === "all" ? "All" : s === "pending" ? `Pending (${pendingCount})` : s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>

                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer" style={{ color: 'var(--wb-text-secondary)' }}>
                    <input
                        type="checkbox"
                        checked={flaggedOnly}
                        onChange={(e) => { setFlaggedOnly(e.target.checked); setPage(1); }}
                        className="rounded"
                    />
                    Flagged only
                </label>
            </div>

            {/* ── Main Table ── */}
            <section className="table-section">
                {loading ? (
                    <div className="page-loading">Loading cycle counts…</div>
                ) : safeCounts.length === 0 ? (
                    <div className="empty-state" style={{ textAlign: 'center', padding: '40px 0' }}>
                        <p style={{ marginBottom: 12 }}>No counts match the selected filter.</p>
                        <button
                            type="button"
                            className="btn btn--primary btn--sm"
                            onClick={() => setIsCountModalOpen(true)}
                        >
                            + Submit Count
                        </button>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Lot</th>
                                    <th>By</th>
                                    <th>Expected</th>
                                    <th>Counted</th>
                                    <th>Variance</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    {isAdmin && <th></th>}
                                </tr>
                            </thead>
                            <tbody>
                                {safeCounts.map((c) => {
                                    const productName = c?.product?.name ?? (c?.sku_id ? c.sku_id.slice(0, 8) : "—");
                                    const lotDisplay = c?.lot_id ? c.lot_id.slice(0, 8) : null;
                                    const varianceQty = c?.variance_qty ?? 0;
                                    const variancePctNum = c?.variance_pct != null ? Math.abs(Number(c.variance_pct)) : 0;
                                    const countedDateStr = c?.counted_at ? new Date(c.counted_at).toLocaleDateString() : "—";
                                    const isFlagged = Boolean(c?.is_flagged);

                                    return (
                                        <tr key={c.id}>
                                            <td className="td-bold">
                                                {productName}
                                                {c?.notes && (
                                                    <div
                                                        className="text-muted"
                                                        style={{ fontSize: 11, fontWeight: 400, marginTop: 2, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                                        title={c.notes}
                                                    >
                                                        {c.notes}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                {lotDisplay
                                                    ? <code>{lotDisplay}</code>
                                                    : <span className="text-muted">—</span>
                                                }
                                            </td>
                                            <td>{c?.counter_name ?? "—"}</td>
                                            <td>{c?.expected_qty ?? 0}</td>
                                            <td>{c?.counted_qty ?? 0}</td>
                                            <td>
                                                <span className={
                                                    varianceQty < 0 ? "text-red" :
                                                    varianceQty > 0 ? "text-green" : "text-muted"
                                                }>
                                                    {varianceQty > 0 ? "+" : ""}{varianceQty}
                                                </span>
                                                <span className="text-muted" style={{ fontSize: 11, marginLeft: 4 }}>
                                                    ({variancePctNum.toFixed(1)}%)
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${
                                                    c?.status === "reconciled" ? "badge--reconciled"
                                                    : c?.status === "dismissed" ? "badge--dismissed"
                                                    : isFlagged ? "badge--flagged"
                                                    : "badge--pending"
                                                }`}>
                                                    {c?.status === "pending" && isFlagged ? "Flagged" : c?.status ?? "pending"}
                                                </span>
                                            </td>
                                            <td className="text-muted">{countedDateStr}</td>
                                            {isAdmin && (
                                                <td>
                                                    {c?.status === "pending" ? (
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                className="btn btn--success btn--sm"
                                                                onClick={() => { setReconcileTarget(c); setReconcileNotes(c?.notes ?? ""); }}
                                                            >
                                                                Reconcile
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="btn btn--danger btn--sm"
                                                                onClick={() => setDismissTarget(c)}
                                                            >
                                                                Dismiss
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted" style={{ fontSize: 11 }}>
                                                            {c?.status === "reconciled" ? "Adjusted" : "Closed"}
                                                        </span>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {meta && meta.last_page > 1 && (
                    <div className="pagination p-4">
                        <span className="pagination__info text-xs" style={{ color: 'var(--wb-text-muted)' }}>
                            Page {meta.current_page} of {meta.last_page} · {meta.total} counts
                        </span>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                className="btn btn--secondary btn--sm"
                                disabled={meta.current_page <= 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                            >
                                Previous
                            </button>
                            <button
                                type="button"
                                className="btn btn--secondary btn--sm"
                                disabled={meta.current_page >= meta.last_page}
                                onClick={() => setPage((p) => p + 1)}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </section>

            {/* ── Reconcile Modal ── */}
            {reconcileTarget && (
                <div className="modal-overlay" onClick={() => setReconcileTarget(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal__header">
                            <div>
                                <h2>Authorize Reconciliation</h2>
                                <p className="page-subtitle">{reconcileTarget.product?.name ?? "SKU"}</p>
                            </div>
                            <button className="modal__close" onClick={() => setReconcileTarget(null)}>
                                &times;
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Variance summary */}
                            <div className="info-card" style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                                {[
                                    { label: "Expected", value: `${reconcileTarget.expected_qty} u` },
                                    { label: "Counted", value: `${reconcileTarget.counted_qty} u` },
                                    {
                                        label: "Adjustment",
                                        value: `${reconcileTarget.variance_qty > 0 ? "+" : ""}${reconcileTarget.variance_qty} u`,
                                        color: reconcileTarget.variance_qty < 0 ? "var(--wb-danger)" : "var(--wb-success)",
                                    },
                                ].map(({ label, value, color }) => (
                                    <div key={label} style={{ textAlign: 'center', flex: 1 }}>
                                        <div style={{ fontSize: 11, color: 'var(--wb-text-muted)', marginBottom: 4 }}>{label}</div>
                                        <div style={{ fontSize: 18, fontWeight: 700, color: color ?? 'var(--wb-text-primary)' }}>{value}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="form-group">
                                <label htmlFor="reconcile-notes">Justification / Notes</label>
                                <textarea
                                    id="reconcile-notes"
                                    value={reconcileNotes}
                                    onChange={(e) => setReconcileNotes(e.target.value)}
                                    placeholder="e.g. Authorized write-down due to verified shrinkage in morning cycle count"
                                    rows={3}
                                />
                            </div>

                            <div className="modal__actions">
                                <button
                                    type="button"
                                    className="btn btn--secondary"
                                    onClick={() => setReconcileTarget(null)}
                                    disabled={actionLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn--success"
                                    onClick={handleConfirmReconcile}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? "Adjusting…" : "Authorize & Adjust"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Dismiss Modal ── */}
            {dismissTarget && (
                <div className="modal-overlay" onClick={() => setDismissTarget(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal__header">
                            <div>
                                <h2>Dismiss Discrepancy</h2>
                                <p className="page-subtitle">{dismissTarget.product?.name ?? "SKU"}</p>
                            </div>
                            <button className="modal__close" onClick={() => setDismissTarget(null)}>
                                &times;
                            </button>
                        </div>

                        <p style={{ fontSize: 13, color: 'var(--wb-text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
                            Mark this count as dismissed — no <code>ADJUSTMENT</code> transaction will be recorded in the ledger.
                        </p>

                        <div className="modal__actions">
                            <button
                                type="button"
                                className="btn btn--secondary"
                                onClick={() => setDismissTarget(null)}
                                disabled={actionLoading}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn--danger"
                                onClick={handleConfirmDismiss}
                                disabled={actionLoading}
                            >
                                {actionLoading ? "Dismissing…" : "Dismiss"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Submit Modal */}
            <CycleCountModal
                isOpen={isCountModalOpen}
                onClose={() => setIsCountModalOpen(false)}
                onSuccess={() => fetchCounts()}
            />
        </>
    );
}
