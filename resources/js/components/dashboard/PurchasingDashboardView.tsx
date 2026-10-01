import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import type {
    ReorderAlert,
    ExpiryAlert,
    Classification,
    PurchaseOrder,
    ReorderConfig,
} from "../../lib/inventory-api";

const PurchasingAnalyticsCharts = lazy(() =>
    import("./DashboardCharts").then((module) => ({
        default: module.PurchasingAnalyticsCharts,
    })),
);

interface PurchasingDashboardProps {
    reorderAlerts: ReorderAlert[];
    expiryAlerts: ExpiryAlert[];
    configs: ReorderConfig[];
    classifications: Classification[];
    purchaseOrders: PurchaseOrder[] | null;
    purchaseOrdersLoading: boolean;
    totalProducts: number;
}

export default function PurchasingDashboardView({
    reorderAlerts,
    expiryAlerts,
    configs,
    classifications,
    purchaseOrders,
    purchaseOrdersLoading,
    totalProducts,
}: PurchasingDashboardProps) {
    const classACount = classifications.filter((c) => c.abc === "A").length;

    return (
        <div className="purchasing-dashboard space-y-6">
            {/* Quick Actions */}
            <section className="action-grid">
                <Link to="/purchasing" className="action-tile">
                    <div className="action-tile__icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                        </svg>
                    </div>
                    <div className="action-tile__title">Reorder Hub</div>
                    <div className="action-tile__desc">EOQ, safety stock & lead times</div>
                </Link>

                <Link to="/purchase-orders" className="action-tile">
                    <div className="action-tile__icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                    </div>
                    <div className="action-tile__title">Purchase Orders</div>
                    <div className="action-tile__desc">Manage procurement & deliveries</div>
                </Link>

                <Link to="/suppliers" className="action-tile">
                    <div className="action-tile__icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                        </svg>
                    </div>
                    <div className="action-tile__title">Suppliers</div>
                    <div className="action-tile__desc">Vendor master data & lead times</div>
                </Link>

                <Link to="/stock" className="action-tile">
                    <div className="action-tile__icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    </div>
                    <div className="action-tile__title">Stock Matrix</div>
                    <div className="action-tile__desc">On-hand, reserved & available</div>
                </Link>

                <Link to="/products" className="action-tile">
                    <div className="action-tile__icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 8h14M5 12h14M5 16h6" /><rect x="3" y="4" width="18" height="16" rx="2" />
                        </svg>
                    </div>
                    <div className="action-tile__title">Product Catalog</div>
                    <div className="action-tile__desc">Master SKUs & shelf-life rules</div>
                </Link>
            </section>

            {/* Purchasing Metrics */}
            <section className="stats-grid">
                <div className={`stat-card ${reorderAlerts.length > 0 ? "stat-card--red" : "stat-card--blue"}`}>
                    <div className="stat-card__icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                    </div>
                    <div className="stat-card__info">
                        <span className="stat-card__value">{reorderAlerts.length}</span>
                        <span className="stat-card__label">Reorder Alerts</span>
                    </div>
                </div>

                <div className="stat-card stat-card--green">
                    <div className="stat-card__icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
                        </svg>
                    </div>
                    <div className="stat-card__info">
                        <span className="stat-card__value">{classACount}</span>
                        <span className="stat-card__label">Class A SKUs</span>
                    </div>
                </div>

                <div className={`stat-card ${expiryAlerts.length > 0 ? "stat-card--amber" : "stat-card--blue"}`}>
                    <div className="stat-card__icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                    </div>
                    <div className="stat-card__info">
                        <span className="stat-card__value">{expiryAlerts.length}</span>
                        <span className="stat-card__label">Expiring in 30d</span>
                    </div>
                </div>

                <div className="stat-card stat-card--purple">
                    <div className="stat-card__icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
                        </svg>
                    </div>
                    <div className="stat-card__info">
                        <span className="stat-card__value">{configs.length}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--wb-text-muted)' }}>/{totalProducts}</span></span>
                        <span className="stat-card__label">Reorder Rules</span>
                    </div>
                </div>
            </section>

            <Suspense fallback={<div className="analytics-loading">Loading analytics…</div>}>
                <PurchasingAnalyticsCharts
                    classifications={classifications}
                    purchaseOrders={purchaseOrders}
                    purchaseOrdersLoading={purchaseOrdersLoading}
                />
            </Suspense>

            {/* Reorder Alerts */}
            <section className="table-section">
                <div className="table-section__header">
                    <h2>Reorder Alerts</h2>
                    <Link to="/purchasing" className="audit-summary__link">Full hub →</Link>
                </div>

                {reorderAlerts.length === 0 ? (
                    <p className="empty-state">✓ All SKUs are above their reorder thresholds.</p>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Available</th>
                                    <th>ROP</th>
                                    <th>Suggested Order</th>
                                    <th>Demand</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reorderAlerts.map((alert) => (
                                    <tr key={alert.sku_id}>
                                        <td className="td-bold">{alert.product?.name ?? alert.sku_id}</td>
                                        <td className="text-red">{alert.qty_available} units</td>
                                        <td>{alert.reorder_point} units</td>
                                        <td>
                                            {alert.suggested_order_qty ? (
                                                <span className="text-green">{alert.suggested_order_qty} units</span>
                                            ) : (
                                                <span className="text-muted">—</span>
                                            )}
                                        </td>
                                        <td>
                                            {alert.seasonal ? (
                                                <span className="badge badge--sale">Seasonal</span>
                                            ) : (
                                                <span className="badge badge--receipt">Steady</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Demand Classifications + Expiry Watchlist */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ABC / XYZ */}
                <section className="table-section">
                    <div className="table-section__header">
                        <h2>Priority Matrix</h2>
                        <Link to="/purchasing" className="audit-summary__link">Full analysis →</Link>
                    </div>

                    {classifications.length === 0 ? (
                        <p className="empty-state">No classifications computed yet.</p>
                    ) : (
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>ABC</th>
                                        <th>XYZ</th>
                                        <th>Annual</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {classifications.slice(0, 6).map((item) => (
                                        <tr key={item.sku_id}>
                                            <td className="td-bold">
                                                {item.product?.name ?? item.sku_id.slice(0, 8)}
                                            </td>
                                            <td>
                                                <span className={`badge ${
                                                    item.abc === "A" ? "badge--velocity-high"
                                                    : item.abc === "B" ? "badge--velocity-medium"
                                                    : "badge--velocity-low"
                                                }`}>
                                                    {item.abc}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${
                                                    item.xyz === "X" ? "badge--velocity-high"
                                                    : item.xyz === "Y" ? "badge--velocity-medium"
                                                    : "badge--velocity-dead"
                                                }`}>
                                                    {item.xyz}{item.cv != null ? ` · ${item.cv.toFixed(1)}` : ""}
                                                </span>
                                            </td>
                                            <td>{item.annual_demand}<span className="text-muted"> u/yr</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                {/* Expiry Watchlist */}
                <section className="table-section">
                    <div className="table-section__header">
                        <h2>Expiry Watchlist</h2>
                        <Link to="/lots" className="audit-summary__link">All lots →</Link>
                    </div>

                    {expiryAlerts.length === 0 ? (
                        <p className="empty-state">No lots expiring within 30 days.</p>
                    ) : (
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Lot</th>
                                        <th>Remaining</th>
                                        <th>Units</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expiryAlerts.slice(0, 6).map((lot) => (
                                        <tr key={lot.lot_id}>
                                            <td className="td-bold">
                                                {lot.product?.name ?? lot.sku_id.slice(0, 8)}
                                            </td>
                                            <td><code>{lot.lot_id.slice(0, 8)}</code></td>
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
            </div>
        </div>
    );
}
