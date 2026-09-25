import { useEffect, useState } from "react";

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
    type InventoryTransaction,
    type AuditLog,
    type ExpiryAlert,
    type ReorderAlert,
    type ReorderConfig,
    type Classification,
    type CycleCount,
} from "../lib/inventory-api";
import AdminDashboardView from "../components/dashboard/AdminDashboardView";
import WarehouseDashboardView from "../components/dashboard/WarehouseDashboardView";
import PurchasingDashboardView from "../components/dashboard/PurchasingDashboardView";
import CycleCountModal from "../components/CycleCountModal";

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
            }

            // Audit logs (Admin only)
            if (currentUser.role === "admin") {
                promises.push(
                    getAuditLogs(1, 8)
                        .then((res) => setRecentAuditLogs(res.data.data))
                        .catch(() => setRecentAuditLogs([])),
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
                        {role === "admin" && "Executive control & system governance hub"}
                        {role === "warehouse_staff" && "Floor receiving, movement tracking & cycle count verification"}
                        {role === "purchasing_manager" && "Procurement planning, reorder alerts & stock replenishment"}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {(role === "admin" || role === "warehouse_staff") && (
                        <button
                            type="button"
                            className="btn--primary"
                            onClick={() => setIsCountModalOpen(true)}
                        >
                            Submit Cycle Count
                        </button>
                    )}
                </div>
            </div>

            {/* Admin Department Lens View Selector */}
            {role === "admin" && (
                <div className="tab-bar">
                    <button
                        type="button"
                        className={`tab-btn ${activeView === "admin" ? "tab-btn--active" : ""}`}
                        onClick={() => setActiveView("admin")}
                    >
                        Executive & Admin Overview
                    </button>
                    <button
                        type="button"
                        className={`tab-btn ${activeView === "warehouse" ? "tab-btn--active" : ""}`}
                        onClick={() => setActiveView("warehouse")}
                    >
                        Warehouse Operations Lens
                    </button>
                    <button
                        type="button"
                        className={`tab-btn ${activeView === "purchasing" ? "tab-btn--active" : ""}`}
                        onClick={() => setActiveView("purchasing")}
                    >
                        Purchasing & Reorder Intelligence Lens
                    </button>
                </div>
            )}

            {loading ? (
                <div className="page-loading">Loading inventory data & intelligence...</div>
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
