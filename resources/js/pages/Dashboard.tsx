import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
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

                if (role === "admin") {
                    try {
                        const auditRes = await getAuditLogs(1, 5);
                        setRecentAuditLogs(auditRes.data.data);
                    } catch {
                        // Audit logs may not be accessible
                    }
                }
            } catch {
                // Stats stay at 0
            } finally {
                setLoading(false);
            }
        }

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <DashboardLayout>
                <div className="page-loading">Loading...</div>
            </DashboardLayout>
        );
    }

    const role = user?.role ?? "warehouse_staff";
    const canWrite = role === "admin" || role === "warehouse_staff";

    return (
        <DashboardLayout>
            <div className="page-header">
                <div>
                    <h1>Dashboard</h1>
                    <p className="page-subtitle">Inventory overview</p>
                </div>
            </div>

            {/* Metrics */}
            <section className="stats-grid">
                {(role === "admin" || role === "purchasing_manager") && (
                    <>
                        <div className="stat-card stat-card--blue">
                            <div className="stat-card__info">
                                <span className="stat-card__value">{stats.categories}</span>
                                <span className="stat-card__label">Categories</span>
                            </div>
                        </div>
                        <div className="stat-card stat-card--green">
                            <div className="stat-card__info">
                                <span className="stat-card__value">{stats.products}</span>
                                <span className="stat-card__label">Products</span>
                            </div>
                        </div>
                    </>
                )}
                <div className="stat-card stat-card--amber">
                    <div className="stat-card__info">
                        <span className="stat-card__value">{stats.lots}</span>
                        <span className="stat-card__label">Lots</span>
                    </div>
                </div>
                <div className="stat-card stat-card--purple">
                    <div className="stat-card__info">
                        <span className="stat-card__value">{stats.transactions}</span>
                        <span className="stat-card__label">Transactions</span>
                    </div>
                </div>
            </section>

            {/* Quick Action */}
            {canWrite && (
                <div className="quick-action">
                    <div className="quick-action__info">
                        <span className="quick-action__title">Record a transaction</span>
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
            <section className="table-section">
                <div className="table-section__header">
                    <h2>Recent Transactions</h2>
                    <Link to="/transactions" className="audit-summary__link">
                        View all
                    </Link>
                </div>
                {recentTxns.length === 0 ? (
                    <p className="empty-state">
                        No transactions recorded yet. Activity will appear here.
                    </p>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Qty</th>
                                    <th>Product</th>
                                    <th>User</th>
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
                                        <td>{txn.lot?.product?.name ?? "\u2014"}</td>
                                        <td>{txn.actor?.name ?? "\u2014"}</td>
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

            {/* Audit Logs — Admin only */}
            {role === "admin" && (
                <div className="audit-summary">
                    <div className="audit-summary__header">
                        <h2>Recent Audit Activity</h2>
                        <Link to="/audit-logs" className="audit-summary__link">
                            View all
                        </Link>
                    </div>
                    {recentAuditLogs.length === 0 ? (
                        <p className="empty-state">No audit activity yet.</p>
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
            )}

            {/* Planned */}
            {role === "admin" && (
                <p className="coming-soon">Planned: Alerts, Reorder Configuration, Cycle Counts</p>
            )}
            {role === "warehouse_staff" && (
                <p className="coming-soon">Planned: Cycle Counts</p>
            )}
            {role === "purchasing_manager" && (
                <p className="coming-soon">Planned: Purchase Orders, Reorder Suggestions</p>
            )}
        </DashboardLayout>
    );
}
