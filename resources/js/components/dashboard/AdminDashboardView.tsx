import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import type {
    InventoryTransaction,
    AuditLog,
    CycleCount,
    TurnoverReportItem,
    VarianceReportItem,
} from "../../lib/inventory-api";

const AdminAnalyticsCharts = lazy(() =>
    import("./DashboardCharts").then((module) => ({
        default: module.AdminAnalyticsCharts,
    })),
);

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
    turnoverData: TurnoverReportItem[] | null;
    shrinkageData: VarianceReportItem[] | null;
    onOpenCountModal: () => void;
}

/* ── Reusable empty-state card ─────────────────────────────────────────── */
function EmptyState({
    icon,
    title,
    desc,
}: {
    icon: React.ReactNode;
    title: string;
    desc: string;
}) {
    return (
        <div className="empty-state-card">
            <div className="empty-state-card__icon">{icon}</div>
            <p className="empty-state-card__title">{title}</p>
            <p className="empty-state-card__desc">{desc}</p>
        </div>
    );
}

export default function AdminDashboardView({
    stats,
    recentTxns,
    recentAuditLogs,
    pendingCounts,
    turnoverData,
    shrinkageData,
    onOpenCountModal,
}: AdminDashboardProps) {
    return (
        <div className="dashboard-stack">

            {/* ── KPI Stat Cards ─────────────────────────────────────────── */}
            <section className="stats-grid--enhanced" aria-label="Key metrics">

                {/* Categories */}
                <div className="stat-card--enhanced">
                    <div className="stat-icon stat-icon--blue">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </div>
                    <div className="stat-card__info">
                        <span className="stat-card__value--lg">{stats.categories}</span>
                        <span className="stat-card__label--sm">Categories</span>
                    </div>
                </div>

                {/* Products */}
                <div className="stat-card--enhanced">
                    <div className="stat-icon stat-icon--green">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    </div>
                    <div className="stat-card__info">
                        <span className="stat-card__value--lg">{stats.products}</span>
                        <span className="stat-card__label--sm">Products</span>
                    </div>
                </div>

                {/* Lots */}
                <div className="stat-card--enhanced">
                    <div className="stat-icon stat-icon--blue">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M5 8h14M5 12h14M5 16h6" /><rect x="3" y="4" width="18" height="16" rx="2" />
                        </svg>
                    </div>
                    <div className="stat-card__info">
                        <span className="stat-card__value--lg">{stats.lots}</span>
                        <span className="stat-card__label--sm">Lots</span>
                    </div>
                </div>

                {/* Pending Counts — amber when there are items, blue otherwise */}
                <div className="stat-card--enhanced">
                    <div className={`stat-icon ${stats.pendingReconciliations > 0 ? "stat-icon--amber" : "stat-icon--blue"}`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                        </svg>
                    </div>
                    <div className="stat-card__info">
                        <span className="stat-card__value--lg">{stats.pendingReconciliations}</span>
                        <span className="stat-card__label--sm">Pending Counts</span>
                    </div>
                </div>

                {/* Transactions */}
                <div className="stat-card--enhanced">
                    <div className="stat-icon stat-icon--purple">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
                            <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
                        </svg>
                    </div>
                    <div className="stat-card__info">
                        <span className="stat-card__value--lg">{stats.transactions}</span>
                        <span className="stat-card__label--sm">Transactions</span>
                    </div>
                </div>

            </section>

            {/* ── Quick Actions ──────────────────────────────────────────── */}
            <section className="action-grid" aria-label="Quick actions">
                <Link to="/cycle-counts" className="action-tile">
                    <div className="action-tile__icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                        </svg>
                    </div>
                    <div className="action-tile__title">
                        Reconciliation Queue
                        {stats.pendingReconciliations > 0 && (
                            <span className="badge badge--flagged" style={{ marginLeft: 8 }}>
                                {stats.pendingReconciliations}
                            </span>
                        )}
                    </div>
                    <div className="action-tile__desc">Review floor counts &amp; approve adjustments</div>
                </Link>

                <Link to="/reports" className="action-tile">
                    <div className="action-tile__icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                        </svg>
                    </div>
                    <div className="action-tile__title">Reports &amp; Analytics</div>
                    <div className="action-tile__desc">Variance, shrinkage &amp; turnover reports</div>
                </Link>

                <Link to="/users" className="action-tile">
                    <div className="action-tile__icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </div>
                    <div className="action-tile__title">User Management</div>
                    <div className="action-tile__desc">Manage accounts, roles &amp; access</div>
                </Link>

                <Link to="/audit-logs" className="action-tile">
                    <div className="action-tile__icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                    </div>
                    <div className="action-tile__title">Audit Logs</div>
                    <div className="action-tile__desc">Immutable system event trail</div>
                </Link>
            </section>

            {/* ── Analytics Charts ───────────────────────────────────────── */}
            <Suspense fallback={<div className="analytics-loading">Loading analytics…</div>}>
                <AdminAnalyticsCharts
                    turnoverData={turnoverData}
                    shrinkageData={shrinkageData}
                />
            </Suspense>

            {/* ── Reconciliation Queue ───────────────────────────────────── */}
            <section className="table-section">
                <div className="table-section__header">
                    <h2>
                        Reconciliation Queue
                        {stats.pendingReconciliations > 0 && (
                            <span className="badge badge--flagged" style={{ marginLeft: 8 }}>
                                {stats.pendingReconciliations} pending
                            </span>
                        )}
                    </h2>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            className="btn btn--secondary btn--sm"
                            onClick={onOpenCountModal}
                        >
                            + Log Count
                        </button>
                        <Link to="/cycle-counts" className="audit-summary__link">
                            Full queue →
                        </Link>
                    </div>
                </div>

                {pendingCounts.length === 0 ? (
                    <EmptyState
                        icon={
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                            </svg>
                        }
                        title="All counts reconciled"
                        desc="No pending cycle counts — inventory is balanced across all locations."
                    />
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Counter</th>
                                    <th>Expected</th>
                                    <th>Counted</th>
                                    <th>Variance</th>
                                    <th>Flag</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingCounts.slice(0, 5).map((count) => {
                                    const isFlagged = count.is_flagged || count.variance_qty < 0;
                                    return (
                                        <tr key={count.id} className={isFlagged ? "row--flagged" : ""}>
                                            <td className="td-bold">
                                                {count.product?.name ?? count.sku_id.slice(0, 8)}
                                            </td>
                                            <td>{count.counter_name}</td>
                                            <td>{count.expected_qty}</td>
                                            <td>{count.counted_qty}</td>
                                            <td className={
                                                count.variance_qty < 0 ? "text-red" :
                                                count.variance_qty > 0 ? "text-green" : ""
                                            }>
                                                {count.variance_qty > 0 ? "+" : ""}{count.variance_qty}
                                                <span className="text-muted" style={{ fontSize: 11, marginLeft: 4 }}>
                                                    ({Math.abs(count.variance_pct).toFixed(1)}%)
                                                </span>
                                            </td>
                                            <td>
                                                {count.is_flagged ? (
                                                    <span className="badge badge--flagged">Flagged</span>
                                                ) : (
                                                    <span className="badge badge--pending">Normal</span>
                                                )}
                                            </td>
                                            <td>
                                                {isFlagged ? (
                                                    <Link to="/cycle-counts" className="btn btn--primary btn--sm">
                                                        Review
                                                    </Link>
                                                ) : (
                                                    <Link to="/cycle-counts" className="btn btn--secondary btn--sm">
                                                        View
                                                    </Link>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* ── Split: Ledger + Audit ──────────────────────────────────── */}
            <div className="dashboard-cols">

                {/* Recent Transactions */}
                <section className="table-section">
                    <div className="table-section__header">
                        <h2>Recent Transactions</h2>
                        <Link to="/transactions" className="audit-summary__link">View all →</Link>
                    </div>
                    {recentTxns.length === 0 ? (
                        <EmptyState
                            icon={
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                                    <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                                </svg>
                            }
                            title="No transactions yet"
                            desc="Stock movements will appear here once receipts, picks, or adjustments are recorded."
                        />
                    ) : (
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Type</th>
                                        <th>Delta</th>
                                        <th>Product</th>
                                        <th>By</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentTxns.slice(0, 6).map((txn) => (
                                        <tr key={txn.id}>
                                            <td>
                                                <span className={`badge badge--${txn.type.toLowerCase()}`}>
                                                    {txn.type}
                                                </span>
                                            </td>
                                            <td className={txn.quantity_delta >= 0 ? "text-green" : "text-red"}>
                                                {txn.quantity_delta >= 0 ? "+" : ""}{txn.quantity_delta}
                                            </td>
                                            <td>{txn.lot?.product?.name ?? "—"}</td>
                                            <td>{txn.actor?.name ?? "System"}</td>
                                            <td className="text-muted">
                                                {new Date(txn.occurred_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                {/* Audit Trail */}
                <section className="table-section">
                    <div className="table-section__header">
                        <h2>Audit Trail</h2>
                        <Link to="/audit-logs" className="audit-summary__link">View all →</Link>
                    </div>
                    {recentAuditLogs.length === 0 ? (
                        <EmptyState
                            icon={
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                    <polyline points="14 2 14 8 20 8"/>
                                    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                                </svg>
                            }
                            title="No audit events yet"
                            desc="System actions like creates, updates, and deletions will be logged here automatically."
                        />
                    ) : (
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Action</th>
                                        <th>Entity</th>
                                        <th>User</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentAuditLogs.slice(0, 6).map((log) => (
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
                                            <td className="text-muted">
                                                {new Date(log.occurred_at).toLocaleDateString()}
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
