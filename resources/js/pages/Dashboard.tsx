import { useEffect, useState, type ReactNode } from "react";

import { getCurrentUser, type AuthUser } from "../lib/api";
import {
    getCategories,
    getProducts,
    getLots,
    getTransactions,
    getAuditLogs,
    getExpiryAlerts,
    getReorderAlerts,
    getReorderConfigs,
    getClassifications,
    getCycleCounts,
    getTurnoverReport,
    getVarianceReport,
    getAllPurchaseOrders,
    type PurchaseOrder,
    type InventoryTransaction,
    type AuditLog,
    type ExpiryAlert,
    type ReorderAlert,
    type ReorderConfig,
    type Classification,
    type CycleCount,
    type TurnoverReportItem,
    type VarianceReportItem,
} from "../lib/inventory-api";
import AdminDashboardView from "../components/dashboard/AdminDashboardView";
import WarehouseDashboardView from "../components/dashboard/WarehouseDashboardView";
import PurchasingDashboardView from "../components/dashboard/PurchasingDashboardView";
import CycleCountModal from "../components/CycleCountModal";

/* ── Skeleton shown while dashboard data loads ─────────────────────────── */
function SkeletonBlock({ className, style }: { className?: string; style?: React.CSSProperties }) {
    return <div className={`skeleton ${className ?? ""}`} style={style} />;
}

function SkeletonCard() {
    return (
        <div className="skeleton-card">
            <SkeletonBlock className="skeleton-card__icon" />
            <div className="stat-card__info">
                <SkeletonBlock className="skeleton-card__value" />
                <SkeletonBlock className="skeleton-card__label" />
            </div>
        </div>
    );
}

function SkeletonTableRows({ rows = 5, cols }: { rows?: number; cols: number[] }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, r) => (
                <div key={r} className="skeleton-row">
                    {cols.map((w, c) => (
                        <SkeletonBlock
                            key={c}
                            className="skeleton-row__cell"
                            style={{ width: w }}
                        />
                    ))}
                </div>
            ))}
        </>
    );
}

function SkeletonSection({ title, rows, cols }: { title: ReactNode; rows?: number; cols: number[] }) {
    return (
        <div className="skeleton-section">
            <div className="skeleton-section__header">
                <SkeletonBlock className="skeleton-section__title" />
            </div>
            <SkeletonTableRows rows={rows} cols={cols} />
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="dashboard-stack">
            {/* KPI cards */}
            <div className="stats-grid--enhanced">
                {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>

            {/* Quick action tiles */}
            <div className="action-grid">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="skeleton-card" style={{ minHeight: 90 }}>
                        <SkeletonBlock style={{ width: 36, height: 36, borderRadius: 8 }} />
                        <SkeletonBlock style={{ height: 14, width: "60%", borderRadius: 4 }} />
                        <SkeletonBlock style={{ height: 11, width: "80%", borderRadius: 4 }} />
                    </div>
                ))}
            </div>

            {/* Analytics chart placeholders */}
            <div className="analytics-grid">
                {[0, 1].map((i) => (
                    <div key={i} className="analytics-card">
                        <div className="analytics-card__header">
                            <SkeletonBlock style={{ height: 14, width: 160, borderRadius: 4 }} />
                        </div>
                        <SkeletonBlock className="skeleton-chart-area" />
                    </div>
                ))}
            </div>

            {/* Reconciliation queue */}
            <SkeletonSection
                title="Reconciliation Queue"
                rows={4}
                cols={["22%", "15%", "10%", "10%", "12%", "10%", "8%"]}
            />

            {/* Bottom two-col split */}
            <div className="dashboard-cols">
                <SkeletonSection
                    title="Recent Transactions"
                    rows={5}
                    cols={["18%", "12%", "30%", "18%", "14%"]}
                />
                <SkeletonSection
                    title="Audit Trail"
                    rows={5}
                    cols={["22%", "28%", "22%", "16%"]}
                />
            </div>
        </div>
    );
}

export default function Dashboard() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [activeView, setActiveView] = useState<"admin" | "warehouse" | "purchasing">("admin");
    const [loading, setLoading] = useState(true);
    const [isCountModalOpen, setIsCountModalOpen] = useState(false);

    // Common data
    const [categoriesCount, setCategoriesCount] = useState(0);
    const [productsCount, setProductsCount] = useState(0);
    const [lotsCount, setLotsCount] = useState(0);
    const [transactionsCount, setTransactionsCount] = useState(0);
    const [recentTxns, setRecentTxns] = useState<InventoryTransaction[]>([]);

    // Admin & Warehouse data
    const [recentAuditLogs, setRecentAuditLogs] = useState<AuditLog[]>([]);
    const [cycleCounts, setCycleCounts] = useState<CycleCount[]>([]);
    const [pendingCounts, setPendingCounts] = useState<CycleCount[]>([]);

    // Purchasing & Warehouse data
    const [expiryAlerts, setExpiryAlerts] = useState<ExpiryAlert[]>([]);
    const [reorderAlerts, setReorderAlerts] = useState<ReorderAlert[]>([]);
    const [reorderConfigs, setReorderConfigs] = useState<ReorderConfig[]>([]);
    const [classifications, setClassifications] = useState<Classification[]>([]);
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[] | null>(null);
    const [purchaseOrdersLoading, setPurchaseOrdersLoading] = useState(true);
    const [turnoverData, setTurnoverData] = useState<TurnoverReportItem[] | null>(null);
    const [varianceData, setVarianceData] = useState<VarianceReportItem[] | null>(null);

    async function loadData() {
        setLoading(true);
        try {
            const userRes = await getCurrentUser();
            const currentUser = userRes.data;
            setUser(currentUser);

            // Set default view based on role
            if (currentUser.role === "warehouse_staff") {
                setActiveView("warehouse");
            } else if (currentUser.role === "purchasing_manager") {
                setActiveView("purchasing");
            } else {
                setActiveView("admin");
            }

            // Fetch core stats and transactions
            const [catRes, prodRes, lotRes, txnRes] = await Promise.all([
                getCategories(1, 1).catch(() => ({ data: { meta: { total: 0 } } })),
                getProducts(1, 1).catch(() => ({ data: { meta: { total: 0 } } })),
                getLots(1, 1).catch(() => ({ data: { meta: { total: 0 } } })),
                getTransactions(1, 8).catch(() => ({ data: { meta: { total: 0 }, data: [] } })),
            ]);

            setCategoriesCount(catRes.data.meta.total);
            setProductsCount(prodRes.data.meta.total);
            setLotsCount(lotRes.data.meta.total);
            setTransactionsCount(txnRes.data.meta.total);
            setRecentTxns(txnRes.data.data);

            // Role-specific and cross-functional intelligence
            const promises: Promise<void>[] = [];

            // Expiry alerts (used by Warehouse & Purchasing)
            promises.push(
                getExpiryAlerts(30)
                    .then((res) => setExpiryAlerts(res.data.data))
                    .catch(() => setExpiryAlerts([])),
            );

            // Cycle counts (Warehouse & Admin)
            if (currentUser.role === "admin" || currentUser.role === "warehouse_staff") {
                promises.push(
                    getCycleCounts(1, 10)
                        .then((res) => {
                            const list = Array.isArray(res?.data?.data) ? res.data.data : [];
                            setCycleCounts(list);
                            setPendingCounts(list.filter((c) => c?.status === "pending"));
                        })
                        .catch(() => {
                            try {
                                const stored = localStorage.getItem("wb_local_cycle_counts");
                                if (stored) {
                                    const parsed = JSON.parse(stored);
                                    if (Array.isArray(parsed)) {
                                        setCycleCounts(parsed.slice(0, 10));
                                        setPendingCounts(parsed.filter((c: any) => c?.status === "pending"));
                                        return;
                                    }
                                }
                            } catch {
                                // Ignore
                            }
                            setCycleCounts([]);
                            setPendingCounts([]);
                        }),
                );
            }

            // Purchasing alerts & configs (Purchasing Manager & Admin)
            if (currentUser.role === "admin" || currentUser.role === "purchasing_manager") {
                promises.push(
                    getReorderAlerts()
                        .then((res) => setReorderAlerts(res.data.data))
                        .catch(() => setReorderAlerts([])),
                );
                promises.push(
                    getReorderConfigs(1, 100)
                        .then((res) => setReorderConfigs(res.data.data))
                        .catch(() => setReorderConfigs([])),
                );
                promises.push(
                    getClassifications()
                        .then((res) => setClassifications(res.data.data))
                        .catch(() => setClassifications([])),
                );
                setPurchaseOrdersLoading(true);
                void getAllPurchaseOrders()
                    .then(setPurchaseOrders)
                    .catch(() => setPurchaseOrders(null))
                    .finally(() => setPurchaseOrdersLoading(false));
            }

            // Audit logs (Admin only)
            if (currentUser.role === "admin") {
                promises.push(
                    getAuditLogs(1, 8)
                        .then((res) => setRecentAuditLogs(res.data.data))
                        .catch(() => setRecentAuditLogs([])),
                );
            }

            if (currentUser.role === "admin") {
                promises.push(
                    getTurnoverReport({ window_days: 90 })
                        .then((res) => setTurnoverData(res.data.data))
                        .catch(() => setTurnoverData(null)),
                );
                promises.push(
                    getVarianceReport()
                        .then((res) => setVarianceData(res.data.data))
                        .catch(() => setVarianceData(null)),
                );
            }

            await Promise.all(promises);
        } catch {
            // General error handling
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    const role = user?.role ?? "warehouse_staff";

    return (
        <>
            {/* Header with greeting and role badge */}
            <div className="page-header">
                <div>
                    <div className="flex items-center gap-3">
                        <h1>
                            Welcome back, {user?.name ?? "User"}
                        </h1>
                        <span className="badge badge--receipt uppercase font-semibold text-xs tracking-wider">
                            {role.replace(/_/g, " ")}
                        </span>
                    </div>
                    <p className="page-subtitle">
                        {role === "admin" && "System governance & executive overview"}
                        {role === "warehouse_staff" && "Receiving, movement tracking & cycle counts"}
                        {role === "purchasing_manager" && "Reorder alerts, procurement & replenishment"}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {(role === "admin" || role === "warehouse_staff") && (
                        <button
                            type="button"
                            className="btn btn--primary"
                            onClick={() => setIsCountModalOpen(true)}
                        >
                            Submit Cycle Count
                        </button>
                    )}
                </div>
            </div>

            {/* Admin Department Lens View Selector — pill toggle */}
            {role === "admin" && (
                <div className="pill-toggle" role="tablist" aria-label="Dashboard view">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={activeView === "admin"}
                        className={`pill-toggle__btn${activeView === "admin" ? " pill-toggle__btn--active" : ""}`}
                        onClick={() => setActiveView("admin")}
                    >
                        {/* grid icon */}
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                            <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
                        </svg>
                        Admin Overview
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={activeView === "warehouse"}
                        className={`pill-toggle__btn${activeView === "warehouse" ? " pill-toggle__btn--active" : ""}`}
                        onClick={() => setActiveView("warehouse")}
                    >
                        {/* box icon */}
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                        </svg>
                        Warehouse
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={activeView === "purchasing"}
                        className={`pill-toggle__btn${activeView === "purchasing" ? " pill-toggle__btn--active" : ""}`}
                        onClick={() => setActiveView("purchasing")}
                    >
                        {/* shopping cart icon */}
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                        </svg>
                        Purchasing
                    </button>
                </div>
            )}

            {loading ? (
                <DashboardSkeleton />
            ) : (
                <>
                    {/* Render active role view */}
                    {activeView === "warehouse" && (
                        <WarehouseDashboardView
                            stats={{
                                lots: lotsCount,
                                transactions: transactionsCount,
                                expiringCount: expiryAlerts.length,
                                pendingCounts: pendingCounts.length,
                            }}
                            recentTxns={recentTxns}
                            expiringLots={expiryAlerts}
                            recentCounts={cycleCounts}
                            onOpenCountModal={() => setIsCountModalOpen(true)}
                        />
                    )}

                    {activeView === "purchasing" && (
                        <PurchasingDashboardView
                            reorderAlerts={reorderAlerts}
                            expiryAlerts={expiryAlerts}
                            configs={reorderConfigs}
                            classifications={classifications}
                            purchaseOrders={purchaseOrders}
                            purchaseOrdersLoading={purchaseOrdersLoading}
                            totalProducts={productsCount}
                        />
                    )}

                    {activeView === "admin" && (
                        <AdminDashboardView
                            stats={{
                                categories: categoriesCount,
                                products: productsCount,
                                lots: lotsCount,
                                transactions: transactionsCount,
                                pendingReconciliations: pendingCounts.length,
                                auditCount: recentAuditLogs.length,
                            }}
                            recentTxns={recentTxns}
                            recentAuditLogs={recentAuditLogs}
                            pendingCounts={pendingCounts}
                            turnoverData={turnoverData}
                            shrinkageData={varianceData}
                            onOpenCountModal={() => setIsCountModalOpen(true)}
                        />
                    )}
                </>
            )}

            {/* Physical Cycle Count Modal */}
            <CycleCountModal
                isOpen={isCountModalOpen}
                onClose={() => setIsCountModalOpen(false)}
                onSuccess={() => {
                    loadData();
                }}
            />
        </>
    );
}
