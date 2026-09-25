import { useEffect, useState } from "react";

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

export default function PurchasingDashboard() {
    const [reorderAlerts, setReorderAlerts] = useState<ReorderAlert[]>([]);
    const [expiryAlerts, setExpiryAlerts] = useState<ExpiryAlert[]>([]);
    const [configs, setConfigs] = useState<ReorderConfig[]>([]);
    const [classifications, setClassifications] = useState<Classification[]>([]);
    const [loading, setLoading] = useState(true);
    const [showGuide, setShowGuide] = useState(false);

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

        return () => {
            active = false;
        };
    }, []);

    const classACount = classifications.filter((c) => c.abc === "A").length;

    return (
        <>
            <div className="page-header">
                <div>
                    <h1>Purchasing & Replenishment Intelligence Hub</h1>
                    <p className="page-subtitle">
                        Reorder triggers, supplier lead times, ABC/XYZ demand prioritization, and economic order quantities
                    </p>
                </div>
            </div>

            {/* Quick Metrics */}
            <section className="stats-grid">
                <div
                    className={`stat-card ${
                        reorderAlerts.length > 0 ? "stat-card--red" : "stat-card--blue"
                    }`}
                >
                    <div className="stat-card__info">
                        <span className="stat-card__value">{reorderAlerts.length}</span>
                        <span className="stat-card__label">Items Below Reorder Threshold</span>
                    </div>
                </div>

                <div className="stat-card stat-card--green">
                    <div className="stat-card__info">
                        <span className="stat-card__value">{classACount}</span>
                        <span className="stat-card__label">Top-Priority Items (Class A • 80% Volume)</span>
                    </div>
                </div>

                <div
                    className={`stat-card ${
                        expiryAlerts.length > 0 ? "stat-card--amber" : "stat-card--blue"
                    }`}
                >
                    <div className="stat-card__info">
                        <span className="stat-card__value">{expiryAlerts.length}</span>
                        <span className="stat-card__label">Lots Approaching Expiry (30 Days)</span>
                    </div>
                </div>

                <div className="stat-card stat-card--purple">
                    <div className="stat-card__info">
                        <span className="stat-card__value">{configs.length}</span>
                        <span className="stat-card__label">Configured Replenishment Rules</span>
                    </div>
                </div>
            </section>

            {/* Explanatory Guide Card */}
            <div className="info-card mb-6">
                <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setShowGuide(!showGuide)}
                >
                    <div className="flex items-center gap-2">
                        <span className="text-base">💡</span>
                        <span className="font-semibold td-bold text-sm">
                            Terminology Guide: What do ABC, XYZ, and EOQ mean for your ordering?
                        </span>
                        <span className="text-xs text-secondary ml-1">
                            (Click to {showGuide ? "collapse" : "view guide"})
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
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed">
                        <div className="p-3 rounded bg-slate-100 dark:bg-white/5 space-y-1.5">
                            <span className="font-semibold text-blue text-sm block mb-1">
                                📊 ABC Volume Priority
                            </span>
                            <p className="text-secondary">
                                Ranks products by customer sales volume (Pareto 80/15/5):
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-secondary">
                                <li>
                                    <strong className="td-bold">Class A:</strong> Generates ~80% of sales volume. Top priority; never allow stockouts.
                                </li>
                                <li>
                                    <strong className="td-bold">Class B:</strong> Next ~15% of sales. Secondary priority; standard reorders.
                                </li>
                                <li>
                                    <strong className="td-bold">Class C:</strong> Bottom ~5% of sales. Slow moving; keep lean to avoid tying up capital.
                                </li>
                            </ul>
                        </div>

                        <div className="p-3 rounded bg-slate-100 dark:bg-white/5 space-y-1.5">
                            <span className="font-semibold text-blue text-sm block mb-1">
                                📈 XYZ Demand Predictability
                            </span>
                            <p className="text-secondary">
                                Measures sales stability using the Coefficient of Variation (CV):
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-secondary">
                                <li>
                                    <strong className="td-bold">X (Steady, CV &lt; 0.5):</strong> Reliable, consistent daily demand. Lean buffer needed.
                                </li>
                                <li>
                                    <strong className="td-bold">Y (Variable, CV 0.5–1.0):</strong> Moderate fluctuation or seasonality. Standard buffer.
                                </li>
                                <li>
                                    <strong className="td-bold">Z (Erratic, CV &gt; 1.0):</strong> Spiky, infrequent demand. Order on-demand.
                                </li>
                            </ul>
                        </div>

                        <div className="p-3 rounded bg-slate-100 dark:bg-white/5 space-y-1.5">
                            <span className="font-semibold text-blue text-sm block mb-1">
                                📦 EOQ & ROP Rules
                            </span>
                            <p className="text-secondary">
                                Mathematical formulas for cost optimization:
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-secondary">
                                <li>
                                    <strong className="td-bold">ROP (Reorder Point):</strong> The minimum stock level that automatically triggers a purchase order.
                                </li>
                                <li>
                                    <strong className="td-bold">EOQ (Economic Order Qty):</strong> Optimal purchase order batch size to balance ordering and holding costs.
                                </li>
                                <li>
                                    <strong className="td-bold">Safety Stock:</strong> Extra cushion to protect against late supplier deliveries.
                                </li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="page-loading">Loading purchasing intelligence…</div>
            ) : (
                <>
                    {/* Reorder Alerts */}
                    <section className="table-section mb-6">
                        <div className="table-section__header">
                            <div>
                                <h2>Critical Reorder Alerts (Stockout Prevention)</h2>
                                <p className="page-subtitle">
                                    SKUs where available inventory has fallen to or below the minimum safe reorder trigger point
                                </p>
                            </div>
                        </div>

                        {reorderAlerts.length === 0 ? (
                            <p className="empty-state">
                                ✅ All products are currently stocked safely above their reorder points.
                            </p>
                        ) : (
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Current Available</th>
                                            <th>
                                                Reorder Trigger (ROP)
                                                <span className="block text-xs font-normal text-muted">
                                                    Min threshold level
                                                </span>
                                            </th>
                                            <th>
                                                Suggested Order Size (EOQ)
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

                    {/* Expiry Alerts */}
                    <section className="table-section mb-6">
                        <div className="table-section__header">
                            <div>
                                <h2>Lots Approaching Expiry (Next 30 Days)</h2>
                                <p className="page-subtitle">
                                    Inventory batches nearing shelf-life expiration requiring vendor return or promotional clearance
                                </p>
                            </div>
                        </div>

                        {expiryAlerts.length === 0 ? (
                            <p className="empty-state">✅ No warehouse lots expiring within the 30-day window.</p>
                        ) : (
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Expiry Date</th>
                                            <th>Days to Expiry</th>
                                            <th>Units on Hand</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {expiryAlerts.map((alert) => (
                                            <tr key={alert.lot_id}>
                                                <td className="td-bold">
                                                    {alert.product?.name ?? alert.sku_id}
                                                </td>
                                                <td>{alert.expiry_date}</td>
                                                <td>
                                                    <span
                                                        className={`badge ${
                                                            alert.days_to_expiry <= 10
                                                                ? "badge--flagged"
                                                                : "badge--pending"
                                                        }`}
                                                    >
                                                        {alert.days_to_expiry} days
                                                    </span>
                                                </td>
                                                <td className="font-semibold">{alert.qty_on_hand} units</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    {/* ABC / XYZ Classification */}
                    <section className="table-section mb-6">
                        <div className="table-section__header">
                            <div>
                                <h2>Product Priority & Demand Stability (ABC / XYZ Analysis)</h2>
                                <p className="page-subtitle">
                                    Classification based on historical sales outflow volume (ABC) and demand consistency (XYZ)
                                </p>
                            </div>
                        </div>

                        {classifications.length === 0 ? (
                            <p className="empty-state">No products classified yet. Classifications update as transactions occur.</p>
                        ) : (
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Value Priority (ABC)</th>
                                            <th>Demand Predictability (XYZ)</th>
                                            <th>Annual Volume / Value</th>
                                            <th>
                                                Volatility Index (CV)
                                                <span className="block text-xs font-normal text-muted">
                                                    Lower is more predictable
                                                </span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {classifications.map((row) => (
                                            <tr key={row.sku_id}>
                                                <td className="td-bold">{row.product?.name ?? row.sku_id}</td>
                                                <td>
                                                    <span
                                                        className={`badge ${
                                                            row.abc === "A"
                                                                ? "badge--velocity-high"
                                                                : row.abc === "B"
                                                                ? "badge--velocity-medium"
                                                                : "badge--velocity-low"
                                                        }`}
                                                    >
                                                        {row.abc === "A"
                                                            ? "Class A • High Value"
                                                            : row.abc === "B"
                                                            ? "Class B • Medium"
                                                            : "Class C • Low Value"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span
                                                        className={`badge ${
                                                            row.xyz === "X"
                                                                ? "badge--velocity-high"
                                                                : row.xyz === "Y"
                                                                ? "badge--velocity-medium"
                                                                : "badge--velocity-dead"
                                                        }`}
                                                    >
                                                        {row.xyz === "X"
                                                            ? "X • Steady"
                                                            : row.xyz === "Y"
                                                            ? "Y • Fluctuating"
                                                            : "Z • Erratic"}
                                                    </span>
                                                </td>
                                                <td className="font-semibold">
                                                    <div>{row.annual_demand} units/yr</div>
                                                    <div className="text-sm text-muted">₱{row.annual_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/yr</div>
                                                </td>
                                                <td>
                                                    {row.cv != null ? (
                                                        <span className={row.cv < 0.5 ? "text-green" : row.cv <= 1.0 ? "text-blue" : "text-amber"}>
                                                            {row.cv.toFixed(2)} ({row.cv < 0.5 ? "Low" : row.cv <= 1.0 ? "Medium" : "High"})
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
                            <div>
                                <h2>Automated Reorder Parameters & Lead Times</h2>
                                <p className="page-subtitle">
                                    Supplier delivery lead times, safety buffer thresholds, and operational holding cost inputs
                                </p>
                            </div>
                        </div>

                        {configs.length === 0 ? (
                            <p className="empty-state">No reorder configurations set yet.</p>
                        ) : (
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>
                                                Supplier Lead Time
                                                <span className="block text-xs font-normal text-muted">
                                                    Days to deliver
                                                </span>
                                            </th>
                                            <th>
                                                Reorder Trigger (ROP)
                                                <span className="block text-xs font-normal text-muted">
                                                    Order when stock reaches
                                                </span>
                                            </th>
                                            <th>
                                                Safety Buffer Stock
                                                <span className="block text-xs font-normal text-muted">
                                                    Emergency reserve
                                                </span>
                                            </th>
                                            <th>Order Cost (PO)</th>
                                            <th>Annual Holding Cost/Unit</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {configs.map((cfg) => (
                                            <tr key={cfg.sku_id}>
                                                <td className="td-bold">{cfg.product?.name ?? cfg.sku_id}</td>
                                                <td>{cfg.lead_time_days} days</td>
                                                <td className="font-semibold">
                                                    {cfg.reorder_point != null ? `${cfg.reorder_point} units` : "Auto-computed"}
                                                </td>
                                                <td>
                                                    {cfg.safety_stock != null ? `${cfg.safety_stock} units` : "Auto-computed"}
                                                </td>
                                                <td>{cfg.order_cost != null ? `₱${cfg.order_cost}` : "—"}</td>
                                                <td>
                                                    {cfg.holding_cost_per_unit != null
                                                        ? `₱${cfg.holding_cost_per_unit}/yr`
                                                        : "—"}
                                                </td>
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
