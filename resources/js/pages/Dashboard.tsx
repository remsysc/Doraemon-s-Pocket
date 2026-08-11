import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import {
    getCategories,
    getProducts,
    getLots,
    getTransactions,
    type InventoryTransaction,
} from "../lib/inventory-api";

interface DashboardStats {
    categories: number;
    products: number;
    lots: number;
    transactions: number;
}

export default function Dashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        categories: 0,
        products: 0,
        lots: 0,
        transactions: 0,
    });
    const [recentTxns, setRecentTxns] = useState<InventoryTransaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDashboardData() {
            try {
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

    return (
        <DashboardLayout>
            <div className="page-header">
                <h1>Inventory Dashboard</h1>
                <p className="page-subtitle">Overview of your inventory system</p>
            </div>

            <section className="stats-grid">
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

            <section className="table-section">
                <div className="table-section__header">
                    <h2>Recent Transactions</h2>
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
        </DashboardLayout>
    );
}
