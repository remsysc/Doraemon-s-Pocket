import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import PlaceholderCard from "../components/PlaceholderCard";
import { getCurrentUser, type AuthUser } from "../lib/api";
import {
    getCategories,
    getProducts,
    getLots,
    getTransactions,
    getAuditLogs,
    type InventoryTransaction,
    type AuditLog,
} from "../lib/inventory-api";

interface DashboardStats {
    categories: number;
    products: number;
    lots: number;
    transactions: number;
}

const ROLE_INFO: Record<string, { icon: string; label: string; description: string }> = {
    admin: {
        icon: "👑",
        label: "Admin",
        description: "You have full access to all features including audit logs.",
    },
    warehouse_staff: {
        icon: "🏗️",
        label: "Warehouse Staff",
        description: "You can manage lots and record inventory transactions.",
    },
    purchasing_manager: {
        icon: "📊",
        label: "Purchasing Manager",
        description: "You have read-only access to monitor inventory.",
    },
};

export default function Dashboard() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [stats, setStats] = useState<DashboardStats>({
        categories: 0,
        products: 0,
        lots: 0,
        transactions: 0,
    });
    const [recentTxns, setRecentTxns] = useState<InventoryTransaction[]>([]);
    const [recentAuditLogs, setRecentAuditLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDashboardData() {
            try {
                const userRes = await getCurrentUser();
                setUser(userRes.data);
                const role = userRes.data.role;

                const [catRes, prodRes, lotRes, txnRes] = await Promise.all([
                    getCategories(1, 1),
                    getProducts(1, 1),
                    getLots(1, 1),
                    getTransactions(1, 5),
                ]);

                setStats({
                    categories: catRes.data.meta.total,
                    products: prodRes.data.meta.total,
                    lots: lotRes.data.meta.total,
                    transactions: txnRes.data.meta.total,
                });

                setRecentTxns(txnRes.data.data);

                // Only fetch audit logs for admin
                if (role === "admin") {
                    try {
                        const auditRes = await getAuditLogs(1, 5);
                        setRecentAuditLogs(auditRes.data.data);
                    } catch {
                        // Audit logs may not be accessible
                    }
                }
            } catch {
                // Stats stay at 0 if the API is unreachable
            } finally {
                setLoading(false);
            }
        }

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <DashboardLayout>
                <div className="page-loading">Loading dashboard…</div>
            </DashboardLayout>
        );
    }

    const role = user?.role ?? "warehouse_staff";
    const roleInfo = ROLE_INFO[role] ?? ROLE_INFO.warehouse_staff;

    return (
        <DashboardLayout>
            <div className="page-header">
                <div>
                    <h1>Inventory Dashboard</h1>
                    <p className="page-subtitle">Overview of your inventory system</p>
                </div>
            </div>

            {/* Role Banner */}
            <div className={`role-banner role-banner--${role}`}>
                <span className="role-banner__icon">{roleInfo.icon}</span>
                <div className="role-banner__text">
                    <span className="role-banner__role">{roleInfo.label}</span>
                    <span className="role-banner__description">{roleInfo.description}</span>
                </div>
            </div>

            {/* Stat Cards — vary by role */}
            <section className="stats-grid">
                {(role === "admin" || role === "purchasing_manager") && (
                    <>
                        <div className="stat-card stat-card--blue">
                            <div className="stat-card__icon">📁</div>
                            <div className="stat-card__info">
                                <span className="stat-card__value">{stats.categories}</span>
                                <span className="stat-card__label">Categories</span>
                            </div>
                        </div>

                        <div className="stat-card stat-card--green">
                            <div className="stat-card__icon">📦</div>
                            <div className="stat-card__info">
                                <span className="stat-card__value">{stats.products}</span>
                                <span className="stat-card__label">Products</span>
                            </div>
                        </div>
                    </>
                )}

                <div className="stat-card stat-card--orange">
                    <div className="stat-card__icon">🏷️</div>
                    <div className="stat-card__info">
                        <span className="stat-card__value">{stats.lots}</span>
                        <span className="stat-card__label">Lots</span>
                    </div>
                </div>

                <div className="stat-card stat-card--purple">
                    <div className="stat-card__icon">📋</div>
                    <div className="stat-card__info">
                        <span className="stat-card__value">{stats.transactions}</span>
                        <span className="stat-card__label">Transactions</span>
                    </div>
                </div>
            </section>

            {/* Quick Action — Warehouse Staff + Admin */}
            {(role === "admin" || role === "warehouse_staff") && (
                <div className="quick-action">
                    <div className="quick-action__info">
                        <span className="quick-action__title">Record a new transaction</span>
                        <span className="quick-action__subtitle">
                            Log stock receipts, picks, sales, or adjustments
                        </span>
                    </div>
                    <Link to="/transactions" className="quick-action__btn">
                        + New Transaction
                    </Link>
                </div>
            )}

            {/* Recent Transactions */}
            <h3 className="dashboard-section-title">Recent Transactions</h3>
            <section className="table-section">
                <div className="table-section__header">
                    <h2>Latest Activity</h2>
                    <Link to="/transactions" className="audit-summary__link">
                        View all →
                    </Link>
                </div>
                {recentTxns.length === 0 ? (
                    <p className="empty-state">No transactions recorded yet.</p>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Quantity</th>
                                    <th>Product</th>
                                    <th>Actor</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentTxns.map((txn) => (
                                    <tr key={txn.id}>
                                        <td>
                                            <span className={`badge badge--${txn.type.toLowerCase()}`}>
                                                {txn.type}
                                            </span>
                                        </td>
                                        <td className={txn.quantity_delta >= 0 ? "text-green" : "text-red"}>
                                            {txn.quantity_delta >= 0 ? "+" : ""}
                                            {txn.quantity_delta}
                                        </td>
                                        <td>{txn.lot?.product?.name ?? "—"}</td>
                                        <td>{txn.actor?.name ?? "—"}</td>
                                        <td>
                                            {new Date(txn.occured_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Audit Logs Summary — Admin only */}
            {role === "admin" && (
                <>
                    <h3 className="dashboard-section-title">Audit Logs</h3>
                    <div className="audit-summary">
                        <div className="audit-summary__header">
                            <h2>📜 Recent Audit Activity</h2>
                            <Link to="/audit-logs" className="audit-summary__link">
                                View all →
                            </Link>
                        </div>
                        {recentAuditLogs.length === 0 ? (
                            <p className="empty-state">No audit logs yet.</p>
                        ) : (
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Action</th>
                                            <th>Resource</th>
                                            <th>User</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentAuditLogs.map((log) => (
                                            <tr key={log.id}>
                                                <td>
                                                    <span className="badge badge--adjustment">
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td>{log.auditable_type.split("\\").pop()}</td>
                                                <td>{log.user?.name ?? "System"}</td>
                                                <td>{new Date(log.created_at).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Placeholder Cards — Upcoming features */}
            <h3 className="dashboard-section-title">Upcoming Features</h3>
            <div className="placeholder-grid">
                {role === "admin" && (
                    <>
                        <PlaceholderCard title="Alerts" icon="🔔" />
                        <PlaceholderCard title="Reorder Configurations" icon="⚙️" />
                        <PlaceholderCard title="Cycle Counts" icon="🔄" />
                    </>
                )}
                {role === "warehouse_staff" && (
                    <PlaceholderCard title="Cycle Counts" icon="🔄" />
                )}
                {role === "purchasing_manager" && (
                    <>
                        <PlaceholderCard title="Purchase Orders" icon="🛒" />
                        <PlaceholderCard title="Reorder Suggestions" icon="💡" />
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}
