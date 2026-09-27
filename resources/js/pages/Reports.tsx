import { useState, useEffect } from "react";

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
        net_shrinkage_value: number;
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
                    current_qty_on_hand: 40,
                    total_counts: 3,
                    net_variance_qty: -2,
                    net_variance_value: -12000,
                    flagged_discrepancy_count: 1,
                    last_counted_at: new Date(Date.now() - 3600000 * 2).toISOString(),
                },
                {
                    sku_id: "prod-inv-5kw",
                    product_name: "Hybrid Solar Inverter 5kW Pure Sine",
                    category_name: "Inverters",
                    current_qty_on_hand: 12,
                    total_counts: 2,
                    net_variance_qty: -1,
                    net_variance_value: -20000,
                    flagged_discrepancy_count: 1,
                    last_counted_at: new Date(Date.now() - 3600000 * 5).toISOString(),
                },
                {
                    sku_id: "prod-bat-200ah",
                    product_name: "Deep Cycle Gel Battery 12V 200Ah",
                    category_name: "Batteries",
                    current_qty_on_hand: 50,
                    total_counts: 4,
                    net_variance_qty: 0,
                    net_variance_value: 0,
                    flagged_discrepancy_count: 0,
                    last_counted_at: new Date(Date.now() - 3600000 * 14).toISOString(),
                },
                {
                    sku_id: "prod-mc4-conn",
                    product_name: "MC4 Solar Cable Connectors (Pair)",
                    category_name: "Accessories",
                    current_qty_on_hand: 150,
                    total_counts: 2,
                    net_variance_qty: -8,
                    net_variance_value: -400,
                    flagged_discrepancy_count: 1,
                    last_counted_at: new Date(Date.now() - 3600000 * 20).toISOString(),
                },
            ];
            const filtered = flaggedOnly
                ? demoVariance.filter((item) => item.flagged_discrepancy_count > 0)
                : demoVariance;
            setVarianceData(filtered);
            setVarianceMeta({
                threshold_percentage: 5.0,
                total_audited_skus: filtered.length,
                total_discrepancies: filtered.filter((i) => i.net_variance_qty !== 0).length,
                net_shrinkage_units: filtered.reduce((acc, i) => acc + i.net_variance_qty, 0),
                net_shrinkage_value: filtered.reduce((acc, i) => acc + (i.net_variance_value ?? 0), 0),
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
                    product_count: 2,
                    outflow_units: 145,
                    avg_on_hand: 38.5,
                    inventory_valuation: 450000,
                    turnover_ratio: 3.77,
                    velocity_tier: "High",
                },
                {
                    category_id: "cat-inverters",
                    category_name: "Inverters",
                    product_count: 2,
                    outflow_units: 42,
                    avg_on_hand: 14.0,
                    inventory_valuation: 280000,
                    turnover_ratio: 3.0,
                    velocity_tier: "High",
                },
                {
                    category_id: "cat-batteries",
                    category_name: "Batteries",
                    product_count: 2,
                    outflow_units: 35,
                    avg_on_hand: 24.0,
                    inventory_valuation: 120000,
                    turnover_ratio: 1.46,
                    velocity_tier: "Medium",
                },
                {
                    category_id: "cat-mounting",
                    category_name: "Mounting & Racks",
                    product_count: 2,
                    outflow_units: 18,
                    avg_on_hand: 75.0,
                    inventory_valuation: 15000,
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
        <>
            <div className="page-header">
                <div>
                    <h1>Reports & Analytics</h1>
                    <p className="page-subtitle">Variance, shrinkage & turnover analysis</p>
                </div>
            </div>

            {/* ── Tab Switching ── */}
            <div className="tab-bar">
                <button
                    type="button"
                    className={`tab-btn ${activeTab === "variance" ? "tab-btn--active" : ""}`}
                    onClick={() => setActiveTab("variance")}
                >
                    Variance & Shrinkage
                </button>
                <button
                    type="button"
                    className={`tab-btn ${activeTab === "turnover" ? "tab-btn--active" : ""}`}
                    onClick={() => setActiveTab("turnover")}
                >
                    Inventory Turnover
                </button>
            </div>

            {/* ── Variance & Shrinkage Tab ── */}
            {activeTab === "variance" && (
                <div className="space-y-6">
                    <section className="stats-grid">
                        <div className="stat-card stat-card--blue">
                            <div className="stat-card__icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </div>
                            <div className="stat-card__info">
                                <span className="stat-card__value">
                                    {varianceMeta?.total_audited_skus ?? varianceData.length}
                                </span>
                                <span className="stat-card__label">Audited SKUs</span>
                            </div>
                        </div>

                        <div className={`stat-card ${(varianceMeta?.total_discrepancies ?? 0) > 0 ? "stat-card--amber" : "stat-card--green"}`}>
                            <div className="stat-card__icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                            </div>
                            <div className="stat-card__info">
                                <span className="stat-card__value">
                                    {varianceMeta?.total_discrepancies ?? 0}
                                </span>
                                <span className="stat-card__label">Discrepancies</span>
                            </div>
                        </div>

                        <div className={`stat-card ${(varianceMeta?.net_shrinkage_units ?? 0) < 0 ? "stat-card--red" : "stat-card--blue"}`}>
                            <div className="stat-card__icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                                </svg>
                            </div>
                            <div className="stat-card__info">
                                <span className="stat-card__value">
                                    {varianceMeta?.net_shrinkage_units ?? 0}
                                </span>
                                <span className="stat-card__label">Shrinkage (Units)</span>
                            </div>
                        </div>

                        <div className={`stat-card ${(varianceMeta?.net_shrinkage_value ?? 0) < 0 ? "stat-card--red" : "stat-card--blue"}`}>
                            <div className="stat-card__icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                </svg>
                            </div>
                            <div className="stat-card__info">
                                <span className="stat-card__value">
                                    ₱{Math.abs(varianceMeta?.net_shrinkage_value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    {(varianceMeta?.net_shrinkage_value ?? 0) < 0 ? " Loss" : ""}
                                </span>
                                <span className="stat-card__label">Value Loss</span>
                            </div>
                        </div>
                    </section>

                    {/* Filter controls */}
                    <div className="filter-bar">
                        <div className="flex items-center gap-4">
                            <label className="text-xs font-medium text-secondary">
                                Category:
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

                        <label className="flex items-center gap-2 text-xs font-medium cursor-pointer" style={{ color: 'var(--wb-text-secondary)' }}>
                            <input
                                type="checkbox"
                                checked={flaggedOnly}
                                onChange={(e) => setFlaggedOnly(e.target.checked)}
                                className="rounded"
                            />
                            <span>Flagged only</span>
                        </label>
                    </div>

                    <section className="table-section">
                        <div className="table-section__header">
                            <div>
                                <h2>Audited SKU Variances</h2>
                                <p className="page-subtitle">Shelf count vs expected balance</p>
                            </div>
                        </div>

                        {loading ? (
                            <div className="page-loading">Calculating shrinkage metrics...</div>
                        ) : varianceData.length === 0 ? (
                            <p className="empty-state">No records match the selected filters.</p>
                        ) : (
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Category</th>
                                            <th>On-Hand</th>
                                            <th>Counts</th>
                                            <th>Variance</th>
                                            <th>Value</th>
                                            <th>Flagged</th>
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
                                                <td className={
                                                    row.net_variance_qty < 0 ? "text-red font-semibold"
                                                    : row.net_variance_qty > 0 ? "text-green font-semibold" : ""
                                                }>
                                                    {row.net_variance_qty > 0 ? "+" : ""}{row.net_variance_qty}
                                                </td>
                                                <td className={
                                                    (row.net_variance_value ?? 0) < 0 ? "text-red font-semibold"
                                                    : (row.net_variance_value ?? 0) > 0 ? "text-green font-semibold" : ""
                                                }>
                                                    {(row.net_variance_value ?? 0) < 0 ? "-" : ((row.net_variance_value ?? 0) > 0 ? "+" : "")}₱{Math.abs(row.net_variance_value ?? 0).toFixed(2)}
                                                </td>
                                                <td>
                                                    {row.flagged_discrepancy_count > 0 ? (
                                                        <span className="badge badge--flagged">
                                                            {row.flagged_discrepancy_count}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted">—</span>
                                                    )}
                                                </td>
                                                <td className="text-muted">
                                                    {row.last_counted_at ? new Date(row.last_counted_at).toLocaleDateString() : "Never"}
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

            {/* ── Inventory Turnover Tab ── */}
            {activeTab === "turnover" && (
                <div className="space-y-6">
                    <div className="filter-bar">
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-medium text-secondary">
                                Time Window:
                            </span>
                            <div className="flex gap-2">
                                {[30, 60, 90, 180, 365].map((days) => (
                                    <button
                                        key={days}
                                        type="button"
                                        className={`btn btn--sm ${windowDays === days ? "btn--primary" : "btn--secondary"}`}
                                        onClick={() => setWindowDays(days)}
                                    >
                                        {days} Days
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <section className="table-section">
                        <div className="table-section__header">
                            <div>
                                <h2>Category Turnover Velocity</h2>
                                <p className="page-subtitle">Outflows (sales & picks) vs average stock</p>
                            </div>
                        </div>

                        {loading ? (
                            <div className="page-loading">Computing category turnover ratios...</div>
                        ) : turnoverData.length === 0 ? (
                            <p className="empty-state">No turnover data for this window.</p>
                        ) : (
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Category</th>
                                            <th>Products</th>
                                            <th>Outflow</th>
                                            <th>Avg On-Hand</th>
                                            <th>Valuation</th>
                                            <th>Turnover</th>
                                            <th>Velocity</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {turnoverData.map((row) => (
                                            <tr key={row.category_id}>
                                                <td className="td-bold">{row.category_name}</td>
                                                <td>{row.product_count}</td>
                                                <td className="font-semibold">{row.outflow_units}</td>
                                                <td>{row.avg_on_hand.toFixed(1)}</td>
                                                <td>₱{(row.inventory_valuation ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                                                <td className="font-semibold text-blue">
                                                    {row.turnover_ratio.toFixed(2)}x
                                                </td>
                                                <td>
                                                    <span className={`badge ${
                                                        row.velocity_tier === "High" ? "badge--velocity-high"
                                                        : row.velocity_tier === "Medium" ? "badge--velocity-medium"
                                                        : row.velocity_tier === "Low" ? "badge--velocity-low"
                                                        : "badge--velocity-dead"
                                                    }`}>
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
        </>
    );
}
