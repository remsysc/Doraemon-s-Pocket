import { Link } from "react-router-dom";
import type {
    InventoryTransaction,
    ExpiryAlert,
    CycleCount,
} from "../../lib/inventory-api";

interface WarehouseDashboardProps {
    stats: {
        lots: number;
        transactions: number;
        expiringCount: number;
        pendingCounts: number;
    };
    recentTxns: InventoryTransaction[];
    expiringLots: ExpiryAlert[];
    recentCounts: CycleCount[];
    onOpenCountModal: () => void;
}

export default function WarehouseDashboardView({
    stats,
    recentTxns,
    expiringLots,
    recentCounts,
    onOpenCountModal,
}: WarehouseDashboardProps) {
    return (
        <div className="warehouse-dashboard space-y-6">
            {/* Quick Action Grid */}
            <section className="action-grid">
                <button
                    type="button"
                    className="action-tile text-left"
                    onClick={onOpenCountModal}
                >
                    <div className="action-tile__icon">📋</div>
                    <div className="action-tile__title">+ Submit Cycle Count</div>
                    <div className="action-tile__desc">
                        Audit shelf stock & submit physical inventory verification
                    </div>
                </button>

                <Link to="/transactions" className="action-tile">
                    <div className="action-tile__icon">📦</div>
                    <div className="action-tile__title">+ Record Stock Movement</div>
                    <div className="action-tile__desc">
                        Log physical receipt, pick, dispatch, or damage write-off
                    </div>
                </Link>

                <Link to="/lots" className="action-tile">
                    <div className="action-tile__icon">📍</div>
                    <div className="action-tile__title">Bin Locations & Lots</div>
                    <div className="action-tile__desc">
                        Inspect warehouse bin mapping and lot expiration dates
                    </div>
                </Link>

                <Link to="/stock" className="action-tile">
                    <div className="action-tile__icon">📊</div>
                    <div className="action-tile__title">Real-time Stock Levels</div>
                    <div className="action-tile__desc">
                        Check current on-hand, reserved, and available stock
                    </div>
                </Link>
            </section>

            {/* Floor Metrics */}
            <section className="stats-grid">
                <div className="stat-card stat-card--amber">
                    <div className="stat-card__info">
                        <span className="stat-card__value">{stats.lots}</span>
                        <span className="stat-card__label">Active Lots in Warehouse</span>
                    </div>
                </div>

                <div
                    className={`stat-card ${
                        stats.expiringCount > 0 ? "stat-card--red" : "stat-card--blue"
                    }`}
                >
                    <div className="stat-card__info">
                        <span className="stat-card__value">{stats.expiringCount}</span>
                        <span className="stat-card__label">Expiring Within 30 Days</span>
                    </div>
                </div>

                <div className="stat-card stat-card--green">
                    <div className="stat-card__info">
                        <span className="stat-card__value">{stats.pendingCounts}</span>
                        <span className="stat-card__label">Active Count Audits</span>
                    </div>
                </div>

                <div className="stat-card stat-card--purple">
                    <div className="stat-card__info">
                        <span className="stat-card__value">{stats.transactions}</span>
                        <span className="stat-card__label">Ledger Movements</span>
                    </div>
                </div>
            </section>

            {/* Urgent FEFO Picking Watchlist */}
            <section className="table-section">
                <div className="table-section__header">
                    <div>
                        <h2>Urgent FEFO Pick Watchlist (Expiring Stock)</h2>
                        <p className="page-subtitle">
                            Prioritize first-expiry lots for picking and outbound fulfillment
                        </p>
                    </div>
                    <Link to="/lots" className="audit-summary__link">
                        View all lots
                    </Link>
                </div>

                {expiringLots.length === 0 ? (
                    <p className="empty-state">
                        ✅ No lots currently expiring within the next 30 days. Stock shelf-life is healthy.
                    </p>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Lot ID</th>
                                    <th>Bin Location</th>
                                    <th>Expiry Date</th>
                                    <th>Days Left</th>
                                    <th>Qty on Hand</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expiringLots.slice(0, 5).map((lot) => (
                                    <tr key={lot.lot_id}>
                                        <td className="td-bold">
                                            {lot.product?.name ?? lot.sku_id}
                                        </td>
                                        <td>
                                            <code>{lot.lot_id.slice(0, 8)}</code>
                                        </td>
                                        <td>
                                            <span className="badge badge--receipt">
                                                {lot.product?.unit_of_measure ? "Bin: " : ""}
                                                {lot.lot_id ? "Active Rack" : "—"}
                                            </span>
                                        </td>
                                        <td>{lot.expiry_date}</td>
                                        <td>
                                            <span
                                                className={`badge ${
                                                    lot.days_to_expiry <= 10
                                                        ? "badge--flagged"
                                                        : "badge--pending"
                                                }`}
                                            >
                                                {lot.days_to_expiry} days
                                            </span>
                                        </td>
                                        <td className="td-bold">{lot.qty_on_hand}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Recent Warehouse Movements Feed & Physical Counts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Movements */}
                <section className="table-section">
                    <div className="table-section__header">
                        <div>
                            <h2>Recent Warehouse Movements</h2>
                            <p className="page-subtitle">Latest floor receipts and picks</p>
                        </div>
                        <Link to="/transactions" className="audit-summary__link">
                            View ledger
                        </Link>
                    </div>
                    {recentTxns.length === 0 ? (
                        <p className="empty-state">No movements logged yet.</p>
                    ) : (
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Type</th>
                                        <th>Delta</th>
                                        <th>Product</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentTxns.slice(0, 6).map((txn) => (
                                        <tr key={txn.id}>
                                            <td>
                                                <span
                                                    className={`badge badge--${txn.type.toLowerCase()}`}
                                                >
                                                    {txn.type}
                                                </span>
                                            </td>
                                            <td
                                                className={
                                                    txn.quantity_delta >= 0
                                                        ? "text-green font-medium"
                                                        : "text-red font-medium"
                                                }
                                            >
                                                {txn.quantity_delta >= 0 ? "+" : ""}
                                                {txn.quantity_delta}
                                            </td>
                                            <td>{txn.lot?.product?.name ?? "—"}</td>
                                            <td>
                                                {new Date(
                                                    txn.occurred_at,
                                                ).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                {/* Submitted Cycle Counts */}
                <section className="table-section">
                    <div className="table-section__header">
                        <div>
                            <h2>Recent Floor Count Audits</h2>
                            <p className="page-subtitle">Cycle count verification history</p>
                        </div>
                        <Link to="/cycle-counts" className="audit-summary__link">
                            All counts
                        </Link>
                    </div>
                    {recentCounts.length === 0 ? (
                        <div className="empty-state text-center py-6">
                            <p className="text-muted mb-3">
                                No physical counts submitted yet for this cycle.
                            </p>
                            <button
                                type="button"
                                className="btn--primary btn--sm inline-flex"
                                onClick={onOpenCountModal}
                            >
                                + Record First Count
                            </button>
                        </div>
                    ) : (
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Counted</th>
                                        <th>Expected</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentCounts.slice(0, 6).map((count) => (
                                        <tr key={count.id}>
                                            <td className="td-bold">
                                                {count.product?.name ?? count.sku_id.slice(0, 8)}
                                            </td>
                                            <td>{count.counted_qty}</td>
                                            <td className="text-secondary">{count.expected_qty}</td>
                                            <td>
                                                <span
                                                    className={`badge ${
                                                        count.status === "reconciled"
                                                            ? "badge--reconciled"
                                                            : count.status === "dismissed"
                                                            ? "badge--dismissed"
                                                            : count.is_flagged
                                                            ? "badge--flagged"
                                                            : "badge--pending"
                                                    }`}
                                                >
                                                    {count.status === "pending" && count.is_flagged
                                                        ? "Flagged"
                                                        : count.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
