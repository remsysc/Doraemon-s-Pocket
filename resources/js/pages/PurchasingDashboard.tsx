import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
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

    return (
        <DashboardLayout>
            <div className="page-header">
                <div>
                    <h1>Purchasing Dashboard</h1>
                    <p className="page-subtitle">
                        Reorder and expiry alerts, reorder configuration, and ABC/XYZ
                        classification
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="page-loading">Loading purchasing intelligence…</div>
            ) : (
                <>
                    <section className="table-section">
                        <h2>Reorder Alerts</h2>
                        {reorderAlerts.length === 0 ? (
                            <p className="empty-state">
                                No SKUs are at or below their reorder point.
                            </p>
                        ) : (
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Available</th>
                                            <th>Reorder Point</th>
                                            <th>Suggested Order (EOQ)</th>
                                            <th>Seasonal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reorderAlerts.map((alert) => (
                                            <tr key={alert.sku_id}>
                                                <td>{alert.product?.name ?? alert.sku_id}</td>
                                                <td className="text-red">{alert.qty_available}</td>
                                                <td>{alert.reorder_point}</td>
                                                <td>
                                                    {alert.suggested_order_qty ?? "—"}
                                                </td>
                                                <td>
                                                    {alert.seasonal ? (
                                                        <span className="badge badge--sale">Seasonal</span>
                                                    ) : (
                                                        <span className="badge badge--receipt">Standard</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    <section className="table-section">
                        <h2>Expiry Alerts (next 30 days)</h2>
                        {expiryAlerts.length === 0 ? (
                            <p className="empty-state">No lots expiring within the window.</p>
                        ) : (
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Expiry Date</th>
                                            <th>Days to Expiry</th>
                                            <th>On Hand</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {expiryAlerts.map((alert) => (
                                            <tr key={alert.lot_id}>
                                                <td>{alert.product?.name ?? alert.sku_id}</td>
                                                <td>{alert.expiry_date}</td>
                                                <td
                                                    className={
                                                        alert.days_to_expiry <= 7 ? "text-red" : ""
                                                    }
                                                >
                                                    {alert.days_to_expiry}
                                                </td>
                                                <td>{alert.qty_on_hand}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    <section className="table-section">
                        <h2>ABC / XYZ Classification</h2>
                        {classifications.length === 0 ? (
                            <p className="empty-state">No products to classify yet.</p>
                        ) : (
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>ABC</th>
                                            <th>XYZ</th>
                                            <th>Annual Demand</th>
                                            <th>CV</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {classifications.map((row) => (
                                            <tr key={row.sku_id}>
                                                <td>{row.product?.name ?? row.sku_id}</td>
                                                <td>{row.abc}</td>
                                                <td>{row.xyz}</td>
                                                <td>{row.annual_demand}</td>
                                                <td>{row.cv ?? "—"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    <section className="table-section">
                        <h2>Reorder Configuration</h2>
                        {configs.length === 0 ? (
                            <p className="empty-state">No reorder configuration set.</p>
                        ) : (
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Lead Time (days)</th>
                                            <th>Reorder Point</th>
                                            <th>Safety Stock</th>
                                            <th>Order Cost</th>
                                            <th>Holding Cost/Unit</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {configs.map((cfg) => (
                                            <tr key={cfg.sku_id}>
                                                <td>{cfg.product?.name ?? cfg.sku_id}</td>
                                                <td>{cfg.lead_time_days}</td>
                                                <td>{cfg.reorder_point ?? "auto"}</td>
                                                <td>{cfg.safety_stock ?? "auto"}</td>
                                                <td>{cfg.order_cost ?? "—"}</td>
                                                <td>{cfg.holding_cost_per_unit ?? "—"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </>
            )}
        </DashboardLayout>
    );
}
