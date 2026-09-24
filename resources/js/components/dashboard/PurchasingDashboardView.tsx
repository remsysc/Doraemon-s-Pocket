import { useState } from "react";
import { Link } from "react-router-dom";
import type {
    ReorderAlert,
    ExpiryAlert,
    Classification,
    ReorderConfig,
} from "../../lib/inventory-api";

interface PurchasingDashboardProps {
    reorderAlerts: ReorderAlert[];
    expiryAlerts: ExpiryAlert[];
    configs: ReorderConfig[];
    classifications: Classification[];
    totalProducts: number;
}

export default function PurchasingDashboardView({
    reorderAlerts,
    expiryAlerts,
    configs,
    classifications,
    totalProducts,
}: PurchasingDashboardProps) {
    const classACount = classifications.filter((c) => c.abc === "A").length;
    const [showGuide, setShowGuide] = useState(false);

    return (
        <div className="purchasing-dashboard space-y-6">
            {/* Quick Actions */}
            <section className="action-grid">
                <Link to="/purchasing" className="action-tile">
                    <div className="action-tile__icon">⚡</div>
                    <div className="action-tile__title">Reorder Intelligence Hub</div>
                    <div className="action-tile__desc">
                        Configure supplier lead times, safety buffers, and EOQ batch sizes
                    </div>
                </Link>

                <Link to="/stock" className="action-tile">
                    <div className="action-tile__icon">📦</div>
                    <div className="action-tile__title">Stock Availability Matrix</div>
                    <div className="action-tile__desc">
                        Inspect real-time on-hand, reserved, and available quantities
                    </div>
                </Link>

                <Link to="/products" className="action-tile">
                    <div className="action-tile__icon">🏷️</div>
                    <div className="action-tile__title">Product Catalog</div>
                    <div className="action-tile__desc">
                        Browse active master SKUs, units of measure, and shelf-life rules
                    </div>
                </Link>

                <Link to="/transactions" className="action-tile">
                    <div className="action-tile__icon">📈</div>
                    <div className="action-tile__title">Demand Outflow Trends</div>
                    <div className="action-tile__desc">
                        Analyze sales and pick outflows to calibrate replenishment schedules
                    </div>
                </Link>
            </section>

            {/* Purchasing Metrics */}
            <section className="stats-grid">
                <div
                    className={`stat-card ${
                        reorderAlerts.length > 0 ? "stat-card--red" : "stat-card--blue"
                    }`}
                >
                    <div className="stat-card__info">
                        <span className="stat-card__value">{reorderAlerts.length}</span>
                        <span className="stat-card__label">SKUs Needing Reorder (Below Min)</span>
                    </div>
                </div>

                <div className="stat-card stat-card--green">
                    <div className="stat-card__info">
                        <span className="stat-card__value">{classACount}</span>
                        <span className="stat-card__label">Top-Priority SKUs (Class A • 80% Volume)</span>
                    </div>
                </div>

                <div
                    className={`stat-card ${
                        expiryAlerts.length > 0 ? "stat-card--amber" : "stat-card--blue"
                    }`}
                >
                    <div className="stat-card__info">
                        <span className="stat-card__value">{expiryAlerts.length}</span>
                        <span className="stat-card__label">Lots Near Expiry (30 Days)</span>
                    </div>
                </div>

                <div className="stat-card stat-card--purple">
                    <div className="stat-card__info">
                        <span className="stat-card__value">{configs.length} / {totalProducts}</span>
                        <span className="stat-card__label">Configured Reorder Rules</span>
                    </div>
                </div>
            </section>

            {/* Reorder Alerts Priority Queue */}
            <section className="table-section">
                <div className="table-section__header">
                    <div>
                        <h2>Critical Reorder Alerts (Stockout Risk)</h2>
                        <p className="page-subtitle">
                            Products whose available stock has fallen below the minimum safe threshold (Reorder Point / ROP)
                        </p>
                    </div>
                    <Link to="/purchasing" className="audit-summary__link">
                        Full intelligence hub
                    </Link>
                </div>

                {reorderAlerts.length === 0 ? (
                    <p className="empty-state">
                        ✅ All inventory levels are currently above reorder thresholds. No stockouts imminent.
                    </p>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Available Stock</th>
                                    <th>
                                        Reorder Point (ROP)
                                        <span className="block text-xs font-normal text-muted">
                                            Min trigger level
                                        </span>
                                    </th>
                                    <th>
                                        Suggested Order (EOQ)
                                        <span className="block text-xs font-normal text-muted">
                                            Cost-optimal batch
                                        </span>
                                    </th>
                                    <th>Demand Pattern</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reorderAlerts.map((alert) => (
                                    <tr key={alert.sku_id}>
                                        <td className="td-bold">
                                            {alert.product?.name ?? alert.sku_id}
                                        </td>
                                        <td className="text-red font-semibold">
                                            {alert.qty_available} units
                                        </td>
                                        <td>{alert.reorder_point} units</td>
                                        <td>
                                            {alert.suggested_order_qty ? (
                                                <span className="text-green font-semibold">
                                                    {alert.suggested_order_qty} units
                                                </span>
                                            ) : (
                                                <span className="text-muted">Calculated on lead time</span>
                                            )}
                                        </td>
                                        <td>
                                            {alert.seasonal ? (
                                                <span className="badge badge--sale">Seasonal Peak</span>
                                            ) : (
                                                <span className="badge badge--receipt">Steady Demand</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Explanatory Guide Box for End Users */}
            <div className="info-card">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowGuide(!showGuide)}>
                    <div className="flex items-center gap-2">
                        <span className="text-base">💡</span>
                        <span className="font-semibold td-bold text-sm">
                            What do ABC and XYZ classifications mean?
                        </span>
                        <span className="text-xs text-secondary ml-1">
                            (Click to {showGuide ? "collapse" : "learn more"})
                        </span>
                    </div>
                    <button
                        type="button"
                        className="text-xs text-blue font-medium"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowGuide(!showGuide);
                        }}
                    >
                        {showGuide ? "Hide Guide ▲" : "Show Guide ▼"}
                    </button>
                </div>

                {showGuide && (
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
                        <div className="p-3 rounded bg-slate-100 dark:bg-white/5 space-y-1.5">
                            <span className="font-semibold text-blue text-sm block mb-1">
                                📊 ABC Analysis: Sales Volume Priority
                            </span>
                            <p className="text-secondary">
                                Sorts your products by unit sales volume (Pareto 80/15/5 rule):
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-secondary">
                                <li>
                                    <strong className="td-bold">Class A (Top ~80% of sales):</strong> Fast movers and revenue drivers. Never let these run out; review weekly.
                                </li>
                                <li>
                                    <strong className="td-bold">Class B (Next ~15% of sales):</strong> Moderate velocity items. Replenish with standard automated triggers.
                                </li>
                                <li>
                                    <strong className="td-bold">Class C (Bottom ~5% of sales):</strong> Slow movers. Keep lean inventory so cash isn't trapped on shelves.
                                </li>
                            </ul>
                        </div>

                        <div className="p-3 rounded bg-slate-100 dark:bg-white/5 space-y-1.5">
                            <span className="font-semibold text-blue text-sm block mb-1">
                                📈 XYZ Analysis: Demand Predictability
                            </span>
                            <p className="text-secondary">
                                Measures how stable or volatile daily customer orders are (Coefficient of Variation / CV):
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-secondary">
                                <li>
                                    <strong className="td-bold">X (Steady Demand, CV &lt; 0.5):</strong> Constant, reliable sales. Easy to forecast; safe to keep low safety stock.
                                </li>
                                <li>
                                    <strong className="td-bold">Y (Fluctuating Demand, CV 0.5–1.0):</strong> Variable sales with occasional peaks. Maintain a moderate buffer.
                                </li>
                                <li>
                                    <strong className="td-bold">Z (Erratic Demand, CV &gt; 1.0):</strong> Highly spiky or infrequent orders. Order on-demand to prevent excess inventory.
                                </li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>

            {/* Demand Classifications and Expiry Watchlist Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ABC / XYZ Demand Classifications */}
                <section className="table-section">
                    <div className="table-section__header">
                        <div>
                            <h2>Product Demand & Priority Matrix</h2>
                            <p className="page-subtitle">
                                ABC volume importance combined with XYZ order predictability
                            </p>
                        </div>
                        <Link to="/purchasing" className="audit-summary__link">
                            View full analysis
                        </Link>
                    </div>

                    {classifications.length === 0 ? (
                        <p className="empty-state">No classification data computed yet.</p>
                    ) : (
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Volume Priority (ABC)</th>
                                        <th>Predictability (XYZ)</th>
                                        <th>Annual Outflow</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {classifications.slice(0, 6).map((item) => (
                                        <tr key={item.sku_id}>
                                            <td className="td-bold">
                                                {item.product?.name ?? item.sku_id.slice(0, 8)}
                                            </td>
                                            <td>
                                                <span
                                                    className={`badge ${
                                                        item.abc === "A"
                                                            ? "badge--velocity-high"
                                                            : item.abc === "B"
                                                            ? "badge--velocity-medium"
                                                            : "badge--velocity-low"
                                                    }`}
                                                >
                                                    {item.abc === "A"
                                                        ? "Class A • High Volume"
                                                        : item.abc === "B"
                                                        ? "Class B • Medium"
                                                        : "Class C • Slow Mover"}
                                                </span>
                                            </td>
                                            <td>
                                                <span
                                                    className={`badge ${
                                                        item.xyz === "X"
                                                            ? "badge--velocity-high"
                                                            : item.xyz === "Y"
                                                            ? "badge--velocity-medium"
                                                            : "badge--velocity-dead"
                                                    }`}
                                                >
                                                    {item.xyz === "X"
                                                        ? "X • Steady"
                                                        : item.xyz === "Y"
                                                        ? "Y • Fluctuating"
                                                        : "Z • Erratic"}
                                                    {item.cv != null ? ` (CV: ${item.cv.toFixed(2)})` : ""}
                                                </span>
                                            </td>
                                            <td>{item.annual_demand} units/yr</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                {/* Expiry Risk Lots */}
                <section className="table-section">
                    <div className="table-section__header">
                        <div>
                            <h2>Procurement Expiry Risk Watchlist</h2>
                            <p className="page-subtitle">Lots needing supplier return or markdown</p>
                        </div>
                        <Link to="/lots" className="audit-summary__link">
                            View all lots
                        </Link>
                    </div>

                    {expiryAlerts.length === 0 ? (
                        <p className="empty-state">No expiring lots detected within 30 days.</p>
                    ) : (
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Lot</th>
                                        <th>Remaining</th>
                                        <th>Units at Risk</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expiryAlerts.slice(0, 6).map((lot) => (
                                        <tr key={lot.lot_id}>
                                            <td className="td-bold">
                                                {lot.product?.name ?? lot.sku_id.slice(0, 8)}
                                            </td>
                                            <td>
                                                <code>{lot.lot_id.slice(0, 8)}</code>
                                            </td>
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
                                            <td className="td-bold">{lot.qty_on_hand} units</td>
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
