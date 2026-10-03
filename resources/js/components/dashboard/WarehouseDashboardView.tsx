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
        <div className="dashboard-stack">

            {/* ── Stat Cards ── */}
            <section className="stats-grid--enhanced" aria-label="Key metrics">

                <div className="stat-card--enhanced">
                    <div className="stat-icon stat-icon--amber">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M5 8h14M5 12h14M5 16h6" /><rect x="3" y="4" width="18" height="16" rx="2" />
                        </svg>
                    </div>
                    <div className="stat-card__info">
                        <span className="stat-card__value--lg">{stats.lots}</span>
                        <span className="stat-card__label--sm">Active Lots</span>
                    </div>
                </div>

                <div className="stat-card--enhanced">
                    <div className={`stat-icon ${stats.expiringCount > 0 ? "stat-icon--red" : "stat-icon--blue"}`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                    </div>
                    <div className="stat-card__info">
                        <span className="stat-card__value--lg">{stats.expiringCount}</span>
                        <span className="stat-card__label--sm">Expiring in 30d</span>
                    </div>
                </div>

                <div className="stat-card--enhanced">
                    <div className={`stat-icon ${stats.pendingCounts > 0 ? "stat-icon--amber" : "stat-icon--green"}`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                        </svg>
                    </div>
                    <div className="stat-card__info">
                        <span className="stat-card__value--lg">{stats.pendingCounts}</span>
                        <span className="stat-card__label--sm">Pending Counts</span>
                    </div>
                </div>

                <div className="stat-card--enhanced">
                    <div className="stat-icon stat-icon--purple">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
                            <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
                        </svg>
                    </div>
                    <div className="stat-card__info">
                        <span className="stat-card__value--lg">{stats.transactions}</span>
                        <span className="stat-card__label--sm">Movements</span>
                    </div>
                </div>

            </section>

            {/* ── Quick Actions ── */}
            <section className="action-grid">
                <button
                    type="button"
                    className="action-tile text-left"
                    onClick={onOpenCountModal}
                >
                    <div className="action-tile__icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                        </svg>
                    </div>
                    <div className="action-tile__title">Submit Cycle Count</div>
                    <div className="action-tile__desc">Log a physical shelf verification</div>
                </button>

                <Link to="/transactions" className="action-tile">
                    <div className="action-tile__icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
                            <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
                        </svg>
                    </div>
                    <div className="action-tile__title">Record Movement</div>
                    <div className="action-tile__desc">Receipt, pick, or write-off</div>
                </Link>

                <Link to="/lots" className="action-tile">
                    <div className="action-tile__icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 8h14M5 12h14M5 16h6" /><rect x="3" y="4" width="18" height="16" rx="2" />
                        </svg>
                    </div>
                    <div className="action-tile__title">Lots & Bins</div>
                    <div className="action-tile__desc">Lot locations & expiry dates</div>
                </Link>

                <Link to="/stock" className="action-tile">
                    <div className="action-tile__icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                        </svg>
                    </div>
                    <div className="action-tile__title">Stock Levels</div>
                    <div className="action-tile__desc">On-hand, reserved & available</div>
                </Link>
            </section>

            {/* ── FEFO Expiry Watchlist ── */}
            <section className="table-section">
                <div className="table-section__header">
                    <h2>
                        Expiry Watchlist
                        <span style={{ fontWeight: 400, color: 'var(--wb-text-muted)', fontSize: 12, marginLeft: 8 }}>
                            FEFO — next 30 days
                        </span>
                    </h2>
                    <Link to="/lots" className="audit-summary__link">All lots →</Link>
                </div>

                {expiringLots.length === 0 ? (
                    <p className="empty-state">No lots expiring within 30 days.</p>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Lot</th>
                                    <th>Expiry</th>
                                    <th>Days Left</th>
                                    <th>Units</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expiringLots.slice(0, 6).map((lot) => (
                                    <tr key={lot.lot_id}>
                                        <td className="td-bold">{lot.product?.name ?? lot.sku_id}</td>
                                        <td><code>{lot.lot_id.slice(0, 8)}</code></td>
                                        <td>{lot.expiry_date}</td>
                                        <td>
                                            <span className={`badge ${lot.days_to_expiry <= 10 ? "badge--flagged" : "badge--pending"}`}>
                                                {lot.days_to_expiry}d
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

            {/* ── Split: Movements + Counts ── */}
            <div className="dashboard-cols">
                {/* Recent Movements */}
                <section className="table-section">
                    <div className="table-section__header">
                        <h2>Recent Movements</h2>
                        <Link to="/transactions" className="audit-summary__link">View all →</Link>
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
                                                <span className={`badge badge--${txn.type.toLowerCase()}`}>
                                                    {txn.type}
                                                </span>
                                            </td>
                                            <td className={txn.quantity_delta >= 0 ? "text-green" : "text-red"}>
                                                {txn.quantity_delta >= 0 ? "+" : ""}{txn.quantity_delta}
                                            </td>
                                            <td>{txn.lot?.product?.name ?? "—"}</td>
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

                {/* Cycle Counts */}
                <section className="table-section">
                    <div className="table-section__header">
                        <h2>Cycle Counts</h2>
                        <Link to="/cycle-counts" className="audit-summary__link">All counts →</Link>
                    </div>
                    {recentCounts.length === 0 ? (
                        <div className="empty-state">
                            <p style={{ marginBottom: 12 }}>No counts submitted yet.</p>
                            <button
                                type="button"
                                className="btn btn--primary btn--sm"
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
                                            <td className="text-muted">{count.expected_qty}</td>
                                            <td>
                                                <span className={`badge ${
                                                    count.status === "reconciled" ? "badge--reconciled"
                                                    : count.status === "dismissed" ? "badge--dismissed"
                                                    : count.is_flagged ? "badge--flagged"
                                                    : "badge--pending"
                                                }`}>
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
