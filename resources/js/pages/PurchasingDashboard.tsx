import { lazy, Suspense, useEffect, useState } from "react";
import {
    getReorderAlerts,
    getExpiryAlerts,
    getReorderConfigs,
    getClassifications,
    type ReorderAlert,
    type ExpiryAlert,
    type ReorderConfig,
    type Classification,
} from "../lib/inventory-api";

const PurchasingAnalyticsCharts = lazy(() =>
    import("../components/dashboard/DashboardCharts").then((module) => ({
        default: module.PurchasingAnalyticsCharts,
    })),
);

export default function PurchasingDashboard() {
    const [reorderAlerts, setReorderAlerts] = useState<ReorderAlert[]>([]);
    const [expiryAlerts, setExpiryAlerts] = useState<ExpiryAlert[]>([]);
    const [configs, setConfigs] = useState<ReorderConfig[]>([]);
    const [classifications, setClassifications] = useState<Classification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        setLoading(true);

        Promise.all([
            getReorderAlerts(),
            getExpiryAlerts(30),
            getReorderConfigs(1, 100),
            getClassifications(),
        ])
            .then(([reorder, expiry, cfg, cls]) => {
                if (!active) return;
                setReorderAlerts(reorder.data.data);
                setExpiryAlerts(expiry.data.data);
                setConfigs(cfg.data.data);
                setClassifications(cls.data.data);
            })
            .catch(() => {
                if (!active) return;
                setReorderAlerts([]);
                setExpiryAlerts([]);
                setConfigs([]);
                setClassifications([]);
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => { active = false; };
    }, []);

    const classACount = classifications.filter((c) => c.abc === "A").length;

    return (
        <>
            <div className="page-header">
                <div>
                    <h1>Purchasing Analytics</h1>
                    <p className="page-subtitle">Reorder alerts, demand classification & replenishment config</p>
                </div>
            </div>

            {/* Metrics */}
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
                        <span className="stat-card__value">{configs.length}</span>
                        <span className="stat-card__label">Reorder Rules</span>
                    </div>
                </div>
            </section>

            {loading ? (
                <div className="page-loading">Loading purchasing data…</div>
            ) : (
                <>
                    {/* Reorder Alerts */}
                    <section className="table-section mb-6">
                        <div className="table-section__header">
                            <h2>Reorder Alerts</h2>
                        </div>

                        {reorderAlerts.length === 0 ? (
                            <p className="empty-state">All SKUs are safely above their reorder points.</p>
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

                    {/* Expiry Alerts */}
                    <section className="table-section mb-6">
                        <div className="table-section__header">
                            <h2>Expiry Watchlist <span style={{ fontWeight: 400, color: 'var(--wb-text-muted)', fontSize: 12 }}>— next 30 days</span></h2>
                        </div>

                        {expiryAlerts.length === 0 ? (
                            <p className="empty-state">No lots expiring within 30 days.</p>
                        ) : (
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Expiry Date</th>
                                            <th>Days Left</th>
                                            <th>Units</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {expiryAlerts.map((alert) => (
                                            <tr key={alert.lot_id}>
                                                <td className="td-bold">{alert.product?.name ?? alert.sku_id}</td>
                                                <td>{alert.expiry_date}</td>
                                                <td>
                                                    <span className={`badge ${alert.days_to_expiry <= 10 ? "badge--flagged" : "badge--pending"}`}>
                                                        {alert.days_to_expiry}d
                                                    </span>
                                                </td>
                                                <td className="td-bold">{alert.qty_on_hand}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    <Suspense fallback={<div className="analytics-loading">Loading analytics…</div>}>
                        <PurchasingAnalyticsCharts classifications={classifications} />
                    </Suspense>

                    {/* ABC / XYZ Classification */}
                    <section className="table-section mb-6">
                        <div className="table-section__header">
                            <div>
                                <h2>Demand Classification</h2>
                            </div>
                            {/* ABC/XYZ legend pills */}
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                <span className="badge badge--velocity-high">A · High vol</span>
                                <span className="badge badge--velocity-medium">B · Mid</span>
                                <span className="badge badge--velocity-low">C · Slow</span>
                                <span style={{ width: 1, background: 'var(--wb-border)', margin: '0 4px' }} />
                                <span className="badge badge--velocity-high">X · Steady</span>
                                <span className="badge badge--velocity-medium">Y · Variable</span>
                                <span className="badge badge--velocity-dead">Z · Erratic</span>
                            </div>
                        </div>

                        {classifications.length === 0 ? (
                            <p className="empty-state">No classifications yet — update as transactions occur.</p>
                        ) : (
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>ABC</th>
                                            <th>XYZ</th>
                                            <th>Annual Volume</th>
                                            <th>Annual Value</th>
                                            <th>CV</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {classifications.map((row) => (
                                            <tr key={row.sku_id}>
                                                <td className="td-bold">{row.product?.name ?? row.sku_id}</td>
                                                <td>
                                                    <span className={`badge ${
                                                        row.abc === "A" ? "badge--velocity-high"
                                                        : row.abc === "B" ? "badge--velocity-medium"
                                                        : "badge--velocity-low"
                                                    }`}>{row.abc}</span>
                                                </td>
                                                <td>
                                                    <span className={`badge ${
                                                        row.xyz === "X" ? "badge--velocity-high"
                                                        : row.xyz === "Y" ? "badge--velocity-medium"
                                                        : "badge--velocity-dead"
                                                    }`}>{row.xyz}</span>
                                                </td>
                                                <td>{row.annual_demand}<span className="text-muted"> u/yr</span></td>
                                                <td>₱{row.annual_value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                                                <td>
                                                    {row.cv != null ? (
                                                        <span className={row.cv < 0.5 ? "text-green" : row.cv <= 1.0 ? "text-blue" : "text-amber"}>
                                                            {row.cv.toFixed(2)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    {/* Reorder Configuration */}
                    <section className="table-section">
                        <div className="table-section__header">
                            <h2>Reorder Parameters</h2>
                        </div>

                        {configs.length === 0 ? (
                            <p className="empty-state">No reorder configurations set yet.</p>
                        ) : (
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Lead Time</th>
                                            <th>ROP</th>
                                            <th>Safety Stock</th>
                                            <th>Order Cost</th>
                                            <th>Holding Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {configs.map((cfg) => (
                                            <tr key={cfg.sku_id}>
                                                <td className="td-bold">{cfg.product?.name ?? cfg.sku_id}</td>
                                                <td>{cfg.lead_time_days}d</td>
                                                <td>{cfg.reorder_point != null ? `${cfg.reorder_point} u` : <span className="text-muted">Auto</span>}</td>
                                                <td>{cfg.safety_stock != null ? `${cfg.safety_stock} u` : <span className="text-muted">Auto</span>}</td>
                                                <td>{cfg.order_cost != null ? `₱${cfg.order_cost}` : <span className="text-muted">—</span>}</td>
                                                <td>{cfg.holding_cost_per_unit != null ? `₱${cfg.holding_cost_per_unit}/yr` : <span className="text-muted">—</span>}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </>
            )}
        </>
    );
}
