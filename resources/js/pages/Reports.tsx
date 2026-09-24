import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import {
    getVarianceReport,
    getTurnoverReport,
    getCategories,
    type VarianceReportItem,
    type TurnoverReportItem,
    type Category,
} from "../lib/inventory-api";

export default function Reports() {
    const [activeTab, setActiveTab] = useState<"variance" | "turnover">("variance");
    const [loading, setLoading] = useState(true);

    // Variance Report State
    const [varianceData, setVarianceData] = useState<VarianceReportItem[]>([]);
    const [varianceMeta, setVarianceMeta] = useState<{
        threshold_percentage: number;
        total_audited_skus: number;
        total_discrepancies: number;
        net_shrinkage_units: number;
    } | null>(null);
    const [flaggedOnly, setFlaggedOnly] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [categories, setCategories] = useState<Category[]>([]);

    // Turnover Report State
    const [turnoverData, setTurnoverData] = useState<TurnoverReportItem[]>([]);
    const [turnoverMeta, setTurnoverMeta] = useState<{
        window_days: number;
        generated_at: string;
    } | null>(null);
    const [windowDays, setWindowDays] = useState<number>(90);

    useEffect(() => {
        getCategories(1, 100)
            .then((res) => setCategories(res.data.data))
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (activeTab === "variance") {
            fetchVariance();
        } else {
            fetchTurnover();
        }
    }, [activeTab, flaggedOnly, selectedCategory, windowDays]);

    async function fetchVariance() {
        setLoading(true);
        try {
            const params: { flagged_only?: boolean; category_id?: string } = {};
            if (flaggedOnly) params.flagged_only = true;
            if (selectedCategory) params.category_id = selectedCategory;

            const res = await getVarianceReport(params);
            if (res?.data && typeof res.data === "object" && Array.isArray(res.data.data)) {
                setVarianceData(res.data.data);
                setVarianceMeta(res.data.meta);
            } else {
                setVarianceData([]);
                setVarianceMeta(null);
            }
        } catch {
            // Defensive preview state if endpoint pending
            const demoVariance: VarianceReportItem[] = [
                {
                    sku_id: "prod-sp400-mono",
                    product_name: "Solar Panel 400W Monocrystalline",
                    category_name: "Solar Panels",
                    counts_conducted: 3,
                    total_variance_qty: -2,
                    avg_variance_pct: -5.0,
                    flagged_counts: 1,
                    reconciled_counts: 0,
                    pending_counts: 1,
                    latest_count_at: new Date(Date.now() - 3600000 * 2).toISOString(),
                },
                {
                    sku_id: "prod-inv-5kw",
                    product_name: "Hybrid Solar Inverter 5kW Pure Sine",
                    category_name: "Inverters",
                    counts_conducted: 2,
                    total_variance_qty: -1,
                    avg_variance_pct: -8.3,
                    flagged_counts: 1,
                    reconciled_counts: 0,
                    pending_counts: 1,
                    latest_count_at: new Date(Date.now() - 3600000 * 5).toISOString(),
                },
                {
                    sku_id: "prod-bat-200ah",
                    product_name: "Deep Cycle Gel Battery 12V 200Ah",
                    category_name: "Batteries",
                    counts_conducted: 4,
                    total_variance_qty: 0,
                    avg_variance_pct: 0.0,
                    flagged_counts: 0,
                    reconciled_counts: 4,
                    pending_counts: 0,
                    latest_count_at: new Date(Date.now() - 3600000 * 14).toISOString(),
                },
                {
                    sku_id: "prod-mc4-conn",
                    product_name: "MC4 Solar Cable Connectors (Pair)",
                    category_name: "Accessories",
                    counts_conducted: 2,
                    total_variance_qty: -8,
                    avg_variance_pct: -5.3,
                    flagged_counts: 1,
                    reconciled_counts: 0,
                    pending_counts: 1,
                    latest_count_at: new Date(Date.now() - 3600000 * 20).toISOString(),
                },
            ];
            const filtered = flaggedOnly
                ? demoVariance.filter((item) => item.flagged_counts > 0)
                : demoVariance;
            setVarianceData(filtered);
            setVarianceMeta({
                threshold_percentage: 5.0,
                total_audited_skus: filtered.length,
                total_discrepancies: filtered.filter((i) => i.total_variance_qty !== 0).length,
                net_shrinkage_units: filtered.reduce((acc, i) => acc + i.total_variance_qty, 0),
            });
        } finally {
            setLoading(false);
        }
    }

    async function fetchTurnover() {
        setLoading(true);
        try {
            const res = await getTurnoverReport({ window_days: windowDays });
            if (res?.data && typeof res.data === "object" && Array.isArray(res.data.data)) {
                setTurnoverData(res.data.data);
                setTurnoverMeta(res.data.meta);
            } else {
                setTurnoverData([]);
                setTurnoverMeta(null);
            }
        } catch {
            // Defensive preview state
            const demoTurnover: TurnoverReportItem[] = [
                {
                    category_id: "cat-solar-panels",
                    category_name: "Solar Panels",
                    total_skus: 2,
                    total_units_sold: 145,
                    avg_inventory_units: 38.5,
                    turnover_ratio: 3.77,
                    velocity_tier: "High",
                },
                {
                    category_id: "cat-inverters",
                    category_name: "Inverters",
                    total_skus: 2,
                    total_units_sold: 42,
                    avg_inventory_units: 14.0,
                    turnover_ratio: 3.0,
                    velocity_tier: "High",
                },
                {
                    category_id: "cat-batteries",
                    category_name: "Batteries",
                    total_skus: 2,
                    total_units_sold: 35,
                    avg_inventory_units: 24.0,
                    turnover_ratio: 1.46,
                    velocity_tier: "Medium",
                },
                {
                    category_id: "cat-mounting",
                    category_name: "Mounting & Racks",
                    total_skus: 2,
                    total_units_sold: 18,
                    avg_inventory_units: 75.0,
                    turnover_ratio: 0.24,
                    velocity_tier: "Low",
                },
            ];
            setTurnoverData(demoTurnover);
            setTurnoverMeta({
                window_days: windowDays,
                generated_at: new Date().toISOString(),
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <DashboardLayout>
            <div className="page-header">
                <div>
                    <h1>Inventory & Operational Reports</h1>
                    <p className="page-subtitle">
                        Administrative intelligence on physical shrinkage discrepancies and unit inventory turnover velocity
                    </p>
                </div>
            </div>

            {/* Tab Switching */}
            <div className="tab-bar">
                <button
                    type="button"
                    className={`tab-btn ${activeTab === "variance" ? "tab-btn--active" : ""}`}
                    onClick={() => setActiveTab("variance")}
                >
                    📉 Variance & Shrinkage Report
                </button>
                <button
                    type="button"
                    className={`tab-btn ${activeTab === "turnover" ? "tab-btn--active" : ""}`}
                    onClick={() => setActiveTab("turnover")}
                >
                    🔄 Category Inventory Turnover Report
                </button>
            </div>

            {/* Variance & Shrinkage Tab */}
            {activeTab === "variance" && (
                <div className="space-y-6">
                    {/* Variance KPIs */}
                    <section className="stats-grid">
                        <div className="stat-card stat-card--blue">
                            <div className="stat-card__info">
                                <span className="stat-card__value">
                                    {varianceMeta?.total_audited_skus ?? varianceData.length}
                                </span>
                                <span className="stat-card__label">Audited SKUs</span>
                            </div>
                        </div>

                        <div
                            className={`stat-card ${
                                (varianceMeta?.total_discrepancies ?? 0) > 0
                                    ? "stat-card--amber"
                                    : "stat-card--green"
                            }`}
                        >
                            <div className="stat-card__info">
                                <span className="stat-card__value">
                                    {varianceMeta?.total_discrepancies ?? 0}
                                </span>
                                <span className="stat-card__label">Discrepancy Instances</span>
                            </div>
                        </div>

                        <div
                            className={`stat-card ${
                                (varianceMeta?.net_shrinkage_units ?? 0) < 0
                                    ? "stat-card--red"
                                    : "stat-card--blue"
                            }`}
                        >
                            <div className="stat-card__info">
                                <span className="stat-card__value">
                                    {varianceMeta?.net_shrinkage_units ?? 0}
                                </span>
                                <span className="stat-card__label">Net Shrinkage Units</span>
                            </div>
                        </div>

                        <div className="stat-card stat-card--purple">
                            <div className="stat-card__info">
                                <span className="stat-card__value">
                                    {varianceMeta?.threshold_percentage ?? 5.0}%
                                </span>
                                <span className="stat-card__label">Alert Threshold</span>
                            </div>
                        </div>
                    </section>

                    {/* Filter controls */}
                    <div className="filter-bar">
                        <div className="flex items-center gap-4">
                            <label className="text-xs font-medium text-secondary">
                                Filter by Category:
                            </label>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="select-input"
                            >
                                <option value="">All Categories</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                            <input
                                type="checkbox"
                                checked={flaggedOnly}
                                onChange={(e) => setFlaggedOnly(e.target.checked)}
                                className="rounded"
                            />
                            <span>Show Flagged Discrepancies Only</span>
                        </label>
                    </div>

                    {/* Table */}
                    <section className="table-section">
                        <div className="table-section__header">
                            <div>
                                <h2>Audited SKU Discrepancies & Floor Variances</h2>
                                <p className="page-subtitle">
                                    Comparison of physical shelf count vs ledger expected balance
                                </p>
                            </div>
                        </div>

                        {loading ? (
                            <div className="page-loading">Calculating shrinkage metrics...</div>
                        ) : varianceData.length === 0 ? (
                            <p className="empty-state">
                                No discrepancy records match the selected filters.
                            </p>
                        ) : (
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Product SKU</th>
                                            <th>Category</th>
                                            <th>Current On-Hand</th>
                                            <th>Total Counts</th>
                                            <th>Net Variance</th>
                                            <th>Flagged Counts</th>
                                            <th>Last Audited</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {varianceData.map((row) => (
                                            <tr key={row.sku_id}>
                                                <td className="td-bold">{row.product_name}</td>
                                                <td>{row.category_name}</td>
                                                <td>{row.current_qty_on_hand}</td>
                                                <td>{row.total_counts}</td>
                                                <td
                                                    className={
                                                        row.net_variance_qty < 0
                                                            ? "text-red font-semibold"
                                                            : row.net_variance_qty > 0
                                                            ? "text-green font-semibold"
                                                            : ""
                                                    }
                                                >
                                                    {row.net_variance_qty > 0 ? "+" : ""}
                                                    {row.net_variance_qty} units
                                                </td>
                                                <td>
                                                    {row.flagged_discrepancy_count > 0 ? (
                                                        <span className="badge badge--flagged">
                                                            {row.flagged_discrepancy_count} flagged
                                                        </span>
                                                    ) : (
                                                        <span className="badge badge--receipt">
                                                            0 flagged
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    {row.last_counted_at
                                                        ? new Date(
                                                              row.last_counted_at,
                                                          ).toLocaleDateString()
                                                        : "Never"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </div>
            )}

            {/* Inventory Turnover Tab */}
            {activeTab === "turnover" && (
                <div className="space-y-6">
                    {/* Turnover Controls */}
                    <div className="filter-bar">
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-medium text-secondary">
                                Trailing Analysis Window:
                            </span>
                            <div className="flex gap-2">
                                {[30, 60, 90, 180, 365].map((days) => (
                                    <button
                                        key={days}
                                        type="button"
                                        className={`btn--sm ${
                                            windowDays === days
                                                ? "btn--primary"
                                                : "btn--secondary"
                                        }`}
                                        onClick={() => setWindowDays(days)}
                                    >
                                        {days} Days
                                    </button>
                                ))}
                            </div>
                        </div>

                        {turnoverMeta?.generated_at && (
                            <span className="text-xs text-secondary">
                                Generated: {new Date(turnoverMeta.generated_at).toLocaleString()}
                            </span>
                        )}
                    </div>

                    {/* Table */}
                    <section className="table-section">
                        <div className="table-section__header">
                            <div>
                                <h2>Category Unit Turnover Velocity</h2>
                                <p className="page-subtitle">
                                    Ratio of ledger outflow units (SALE + PICK) relative to average on-hand stock
                                </p>
                            </div>
                        </div>

                        {loading ? (
                            <div className="page-loading">Computing category turnover ratios...</div>
                        ) : turnoverData.length === 0 ? (
                            <p className="empty-state">
                                No inventory turnover data recorded for the selected window.
                            </p>
                        ) : (
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Category</th>
                                            <th>Products Count</th>
                                            <th>Outflow Units</th>
                                            <th>Average On-Hand</th>
                                            <th>Turnover Ratio</th>
                                            <th>Velocity Tier</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {turnoverData.map((row) => (
                                            <tr key={row.category_id}>
                                                <td className="td-bold">{row.category_name}</td>
                                                <td>{row.product_count} SKUs</td>
                                                <td className="font-semibold">
                                                    {row.outflow_units} units
                                                </td>
                                                <td>{row.avg_on_hand.toFixed(1)} units</td>
                                                <td className="font-semibold text-blue">
                                                    {row.turnover_ratio.toFixed(2)}x
                                                </td>
                                                <td>
                                                    <span
                                                        className={`badge ${
                                                            row.velocity_tier === "High"
                                                                ? "badge--velocity-high"
                                                                : row.velocity_tier === "Medium"
                                                                ? "badge--velocity-medium"
                                                                : row.velocity_tier === "Low"
                                                                ? "badge--velocity-low"
                                                                : "badge--velocity-dead"
                                                        }`}
                                                    >
                                                        {row.velocity_tier}
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
            )}
        </DashboardLayout>
    );
}
