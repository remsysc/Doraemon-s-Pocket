import type { CSSProperties } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import type {
    Classification,
    TurnoverReportItem,
    VarianceReportItem,
} from "../../lib/inventory-api";

const tooltipContentStyle: CSSProperties = {
    backgroundColor: "var(--wb-surface-1)",
    border: "1px solid var(--wb-border-strong)",
    borderRadius: "var(--wb-radius-sm)",
    boxShadow: "var(--wb-shadow-md)",
};

const tooltipLabelStyle: CSSProperties = {
    color: "var(--wb-text-primary)",
    fontWeight: 600,
};

const tooltipItemStyle: CSSProperties = {
    color: "var(--wb-text-secondary)",
};

const abcColors: Record<Classification["abc"], string> = {
    A: "var(--wb-success)",
    B: "var(--wb-warning)",
    C: "var(--wb-danger)",
};

const xyzColors: Record<Classification["xyz"], string> = {
    X: "var(--wb-accent)",
    Y: "var(--wb-warning)",
    Z: "var(--wb-danger)",
};

const pesoFormatter = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
});

interface AdminAnalyticsChartsProps {
    turnoverData: TurnoverReportItem[] | null;
    shrinkageData: VarianceReportItem[] | null;
}

export function AdminAnalyticsCharts({
    turnoverData,
    shrinkageData,
}: AdminAnalyticsChartsProps) {
    const shrinkageByProduct = (shrinkageData ?? [])
        .filter((item) => item.net_variance_value < 0)
        .sort((first, second) => first.net_variance_value - second.net_variance_value)
        .slice(0, 6)
        .map((item) => ({
            product_name: item.product_name,
            loss: Math.abs(item.net_variance_value),
        }));

    return (
        <section className="analytics-grid" aria-label="Inventory analytics">
            <article className="analytics-card">
                <header className="analytics-card__header">
                    <div>
                        <h2>Turnover velocity</h2>
                        <p>Category turnover ratio over the last 90 days</p>
                    </div>
                </header>
                {turnoverData === null ? (
                    <p className="analytics-empty">Turnover data could not be loaded.</p>
                ) : turnoverData.length === 0 ? (
                    <p className="analytics-empty">No turnover data for this period.</p>
                ) : (
                    <div className="analytics-chart" aria-label="Turnover ratio by category">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={turnoverData}
                                layout="vertical"
                                margin={{ top: 8, right: 16, bottom: 8, left: 4 }}
                            >
                                <CartesianGrid
                                    stroke="var(--wb-border)"
                                    strokeDasharray="3 3"
                                    horizontal={false}
                                />
                                <XAxis
                                    type="number"
                                    tick={{ fill: "var(--wb-text-muted)", fontSize: 11 }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value: number) => `${value}×`}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="category_name"
                                    width={112}
                                    tick={{ fill: "var(--wb-text-secondary)", fontSize: 11 }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    contentStyle={tooltipContentStyle}
                                    labelStyle={tooltipLabelStyle}
                                    itemStyle={tooltipItemStyle}
                                    formatter={(value) => [
                                        `${Number(value).toFixed(2)}×`,
                                        "Turnover ratio",
                                    ]}
                                />
                                <Bar
                                    dataKey="turnover_ratio"
                                    name="Turnover ratio"
                                    fill="var(--wb-accent)"
                                    radius={[0, 5, 5, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </article>

            <article className="analytics-card">
                <header className="analytics-card__header">
                    <div>
                        <h2>Shrinkage loss by product</h2>
                        <p>Top six products by recorded inventory value loss</p>
                    </div>
                </header>
                {shrinkageData === null ? (
                    <p className="analytics-empty">Shrinkage data could not be loaded.</p>
                ) : shrinkageByProduct.length === 0 ? (
                    <p className="analytics-empty">No recorded shrinkage losses.</p>
                ) : (
                    <div className="analytics-chart" aria-label="Shrinkage loss by product">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={shrinkageByProduct}
                                layout="vertical"
                                margin={{ top: 8, right: 20, bottom: 8, left: 4 }}
                            >
                                <CartesianGrid
                                    stroke="var(--wb-border)"
                                    strokeDasharray="3 3"
                                    horizontal={false}
                                />
                                <XAxis
                                    type="number"
                                    tick={{ fill: "var(--wb-text-muted)", fontSize: 11 }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value: number) => pesoFormatter.format(value)}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="product_name"
                                    width={132}
                                    tick={{ fill: "var(--wb-text-secondary)", fontSize: 11 }}
                                    tickLine={false}
                                    axisLine={false}
                                    interval={0}
                                />
                                <Tooltip
                                    contentStyle={tooltipContentStyle}
                                    labelStyle={tooltipLabelStyle}
                                    itemStyle={tooltipItemStyle}
                                    formatter={(value) => [
                                        pesoFormatter.format(Number(value)),
                                        "Recorded loss",
                                    ]}
                                />
                                <Bar
                                    dataKey="loss"
                                    name="Recorded loss"
                                    fill="var(--wb-danger)"
                                    radius={[0, 5, 5, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </article>
        </section>
    );
}

interface PurchasingAnalyticsChartsProps {
    classifications: Classification[];
}

export function PurchasingAnalyticsCharts({
    classifications,
}: PurchasingAnalyticsChartsProps) {
    const abcData = (["A", "B", "C"] as const)
        .map((grade) => ({
            name: grade,
            value: classifications.filter((item) => item.abc === grade).length,
        }))
        .filter((item) => item.value > 0);
    const xyzData = (["X", "Y", "Z"] as const)
        .map((grade) => ({
            name: grade,
            value: classifications.filter((item) => item.xyz === grade).length,
        }))
        .filter((item) => item.value > 0);

    if (classifications.length === 0) {
        return (
            <section className="analytics-grid" aria-label="Purchasing analytics">
                <article className="analytics-card">
                    <header className="analytics-card__header">
                        <div>
                            <h2>ABC / XYZ distribution</h2>
                            <p>SKU distribution by value and demand variability</p>
                        </div>
                    </header>
                    <p className="analytics-empty">
                        No classification data is available yet.
                    </p>
                </article>
                <PurchaseOrderTrendsPlaceholder />
            </section>
        );
    }

    return (
        <section className="analytics-grid" aria-label="Purchasing analytics">
            <article className="analytics-card">
                <header className="analytics-card__header">
                    <div>
                        <h2>ABC / XYZ distribution</h2>
                        <p>SKU distribution by value and demand variability</p>
                    </div>
                </header>
                <div className="analytics-pie-grid">
                    <div className="analytics-pie">
                        <h3>ABC value class</h3>
                        <div className="analytics-chart analytics-chart--pie">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={abcData}
                                        dataKey="value"
                                        nameKey="name"
                                        innerRadius="48%"
                                        outerRadius="76%"
                                        paddingAngle={3}
                                    >
                                        {abcData.map((item) => (
                                            <Cell key={item.name} fill={abcColors[item.name as Classification["abc"]]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={tooltipContentStyle}
                                        labelStyle={tooltipLabelStyle}
                                        itemStyle={tooltipItemStyle}
                                        formatter={(value) => [value, "SKUs"]}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={28}
                                        wrapperStyle={{ color: "var(--wb-text-secondary)", fontSize: 11 }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="analytics-pie">
                        <h3>XYZ demand variability</h3>
                        <div className="analytics-chart analytics-chart--pie">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={xyzData}
                                        dataKey="value"
                                        nameKey="name"
                                        innerRadius="48%"
                                        outerRadius="76%"
                                        paddingAngle={3}
                                    >
                                        {xyzData.map((item) => (
                                            <Cell key={item.name} fill={xyzColors[item.name as Classification["xyz"]]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={tooltipContentStyle}
                                        labelStyle={tooltipLabelStyle}
                                        itemStyle={tooltipItemStyle}
                                        formatter={(value) => [value, "SKUs"]}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={28}
                                        wrapperStyle={{ color: "var(--wb-text-secondary)", fontSize: 11 }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </article>
            <PurchaseOrderTrendsPlaceholder />
        </section>
    );
}

function PurchaseOrderTrendsPlaceholder() {
    return (
        <article className="analytics-card">
            <header className="analytics-card__header">
                <div>
                    <h2>Procurement & Fulfillment Hub</h2>
                    <p>Order volumes, supplier lead times & physical receipts</p>
                </div>
            </header>
            <div className="analytics-empty analytics-empty--notice" role="status">
                <div style={{ maxWidth: 360, margin: "0 auto", textAlign: "center" }}>
                    <p style={{ marginBottom: 12 }}>
                        Track and issue replenishment orders directly with active suppliers through the procurement hub.
                    </p>
                    <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
                        <a href="/purchase-orders" className="btn btn--secondary btn--sm">
                            View Purchase Orders →
                        </a>
                        <a href="/suppliers" className="btn btn--secondary btn--sm">
                            Manage Suppliers →
                        </a>
                    </div>
                </div>
            </div>
        </article>
    );
}
