import { Link } from "react-router-dom";
import type {
    InventoryTransaction,
    AuditLog,
    CycleCount,
} from "../../lib/inventory-api";

interface AdminDashboardProps {
    stats: {
        categories: number;
        products: number;
        lots: number;
        transactions: number;
        pendingReconciliations: number;
        auditCount: number;
    };
    recentTxns: InventoryTransaction[];
    recentAuditLogs: AuditLog[];
    pendingCounts: CycleCount[];
    onOpenCountModal: () => void;
}

export default function AdminDashboardView({
    stats,
    recentTxns,
    recentAuditLogs,
    pendingCounts,
    onOpenCountModal,
}: AdminDashboardProps) {
    return (
        <div className="admin-dashboard space-y-6">
            {/* Quick Action Hub */}
            <section className="action-grid">
                <Link to="/cycle-counts" className="action-tile">
                    <div className="action-tile__icon">⚖️</div>
                    <div className="action-tile__title">
                        Reconciliation Queue
                        {stats.pendingReconciliations > 0 && (
                            <span className="badge badge--flagged ml-2">
                                {stats.pendingReconciliations} pending
                            </span>
                        )}
                    </div>
                    <div className="action-tile__desc">
                        Review physical floor counts & authorize atomic stock adjustments
                    </div>
                </Link>

                <Link to="/reports" className="action-tile">
                    <div className="action-tile__icon">📊</div>
                    <div className="action-tile__title">Variance & Turnover Reports</div>
                    <div className="action-tile__desc">
                        Analyze shrinkage by SKU and category unit-velocity ratios
                    </div>
                </Link>

                <Link to="/users" className="action-tile">
                    <div className="action-tile__icon">👥</div>
                    <div className="action-tile__title">User Management & Access</div>
                    <div className="action-tile__desc">
                        Manage team accounts, assign roles, and handle deactivations
                    </div>
                </Link>

                <Link to="/audit-logs" className="action-tile">
                    <div className="action-tile__icon">🛡️</div>
                    <div className="action-tile__title">Audit Trail & Security</div>
                    <div className="action-tile__desc">
                        Inspect immutable system logs of all entity updates and mutations
                    </div>
                </Link>
            </section>

            {/* Admin Metric Cards */}
            <section className="stats-grid">
                <div className="stat-card stat-card--blue">
                    <div className="stat-card__info">
                        <span className="stat-card__value">{stats.categories}</span>
                        <span className="stat-card__label">Catalog Categories</span>
                    </div>
                </div>

                <div className="stat-card stat-card--green">
                    <div className="stat-card__info">
                        <span className="stat-card__value">{stats.products}</span>
                        <span className="stat-card__label">Master Products (SKUs)</span>
                    </div>
                </div>

                <div
                    className={`stat-card ${
                        stats.pendingReconciliations > 0
                            ? "stat-card--amber"
                            : "stat-card--blue"
                    }`}
                >
                    <div className="stat-card__info">
                        <span className="stat-card__value">
                            {stats.pendingReconciliations}
                        </span>
                        <span className="stat-card__label">Pending Count Reconciliations</span>
                    </div>
                </div>

                <div className="stat-card stat-card--purple">
                    <div className="stat-card__info">
                        <span className="stat-card__value">{stats.transactions}</span>
                        <span className="stat-card__label">Ledger Transactions</span>
                    </div>
                </div>
            </section>

            {/* Pending Reconciliation Queue Highlight */}
            <section className="table-section">
                <div className="table-section__header">
                    <div>
                        <h2>Cycle Count Discrepancy & Reconciliation Queue</h2>
                        <p className="page-subtitle">
                            Floor count verifications awaiting supervisor review and adjustment
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            className="btn--secondary btn--sm"
                            onClick={onOpenCountModal}
                        >
                            + Log Count
                        </button>
                        <Link to="/cycle-counts" className="audit-summary__link">
                            Open full queue
                        </Link>
                    </div>
                </div>

                {pendingCounts.length === 0 ? (
                    <p className="empty-state">
                        ✅ No pending cycle count discrepancies awaiting reconciliation. Inventory is balanced.
                    </p>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Staff Counter</th>
                                    <th>Expected Qty</th>
                                    <th>Counted Qty</th>
                                    <th>Variance Delta</th>
                                    <th>Variance %</th>
                                    <th>Priority</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingCounts.slice(0, 5).map((count) => (
                                    <tr key={count.id}>
                                        <td className="td-bold">
                                            {count.product?.name ?? count.sku_id.slice(0, 8)}
                                        </td>
                                        <td>{count.counter_name}</td>
                                        <td>{count.expected_qty}</td>
                                        <td className="font-semibold">{count.counted_qty}</td>
                                        <td
                                            className={
                                                count.variance_qty < 0
                                                    ? "text-red font-semibold"
                                                    : count.variance_qty > 0
                                                    ? "text-green font-semibold"
                                                    : ""
                                            }
                                        >
                                            {count.variance_qty > 0 ? "+" : ""}
                                            {count.variance_qty}
                                        </td>
                                        <td>{Math.abs(count.variance_pct).toFixed(1)}%</td>
                                        <td>
                                            {count.is_flagged ? (
                                                <span className="badge badge--flagged">
                                                    Flagged (&gt;5%)
                                                </span>
                                            ) : (
                                                <span className="badge badge--pending">
                                                    Normal Check
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <Link
                                                to="/cycle-counts"
                                                className="btn--primary btn--sm inline-flex"
                                            >
                                                Review
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Split Feeds: Recent Ledger & Audit Trail */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ledger Transactions */}
                <section className="table-section">
                    <div className="table-section__header">
                        <div>
                            <h2>Recent Ledger Activity</h2>
                            <p className="page-subtitle">Stock movements & adjustments</p>
                        </div>
                        <Link to="/transactions" className="audit-summary__link">
                            View ledger
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
                                        <th>Delta</th>
                                        <th>Product</th>
                                        <th>Actor</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentTxns.slice(0, 5).map((txn) => (
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
                                            <td>{txn.actor?.name ?? "System"}</td>
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

                {/* Audit Logs */}
                <section className="table-section">
                    <div className="table-section__header">
                        <div>
                            <h2>System Audit Activity</h2>
                            <p className="page-subtitle">Governance & security logs</p>
                        </div>
                        <Link to="/audit-logs" className="audit-summary__link">
                            View all logs
                        </Link>
                    </div>
                    {recentAuditLogs.length === 0 ? (
                        <p className="empty-state">No audit logs recorded yet.</p>
                    ) : (
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Action</th>
                                        <th>Entity</th>
                                        <th>User</th>
                                        <th>Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentAuditLogs.slice(0, 5).map((log) => (
                                        <tr key={log.id}>
                                            <td>
                                                <span className="badge badge--adjustment">
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="td-bold">
                                                {log.entity_type.split("\\").pop()}
                                            </td>
                                            <td>{log.actor?.name ?? "System"}</td>
                                            <td>
                                                {new Date(
                                                    log.occurred_at,
                                                ).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>

            {/* Architecture & Roadmap Capabilities Status */}
            <section className="table-section">
                <div className="table-section__header">
                    <div>
                        <h2>WalangBrownout Platform Roadmap & Capability Status</h2>
                        <p className="page-subtitle">
                            System architecture, implemented milestone modules, and upcoming plans
                        </p>
                    </div>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="info-card">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-green font-bold">✓ Complete</span>
                            <span className="font-semibold td-bold">Sprints 1–4: Core Foundation</span>
                        </div>
                        <p className="text-xs text-secondary leading-relaxed">
                            Append-only ledger, PostgreSQL row-level locks, real-time snapshot projections, ABC/XYZ classification, and EOQ/ROP reorder intelligence alerts.
                        </p>
                    </div>

                    <div className="info-card border-blue-500/40">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-blue font-bold">● Active</span>
                            <span className="font-semibold td-bold">Sprint 5: Reconciliation & Reports</span>
                        </div>
                        <p className="text-xs text-secondary leading-relaxed">
                            Warehouse staff physical cycle counts, Admin reconciliation queue with atomic adjustment generation, variance/shrinkage reports, and user governance.
                        </p>
                    </div>

                    <div className="info-card">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-amber font-bold">◻ Next</span>
                            <span className="font-semibold td-bold">Sprint 6: Hardening & Demo</span>
                        </div>
                        <p className="text-xs text-secondary leading-relaxed">
                            End-to-end symptom mitigations demo flow, complete RBAC regression matrix, performance optimizations, and production deployment readiness.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
