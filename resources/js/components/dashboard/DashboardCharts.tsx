import type { CSSProperties, ReactNode } from "react";
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
    PurchaseOrder,
    TurnoverReportItem,
    VarianceReportItem,
} from "../../lib/inventory-api";

/* ── Shared empty-state for chart cards ────────────────────────────────── */
function ChartEmptyState({
    icon,
    title,
    desc,
    compact = false,
}: {
    icon: ReactNode;
    title: string;
    desc: string;
    compact?: boolean;
}) {
    return (
        <div className={`empty-state-card ${compact ? "empty-state-card--compact" : ""}`}
             style={compact ? { padding: "28px 20px" } : undefined}>
            <div className="empty-state-card__icon">{icon}</div>
            <p className="empty-state-card__title">{title}</p>
            <p className="empty-state-card__desc">{desc}</p>
        </div>
    );
}

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
                    <ChartEmptyState
                        icon={
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                            </svg>
                        }
                        title="Turnover data unavailable"
                        desc="Could not load turnover data. Check your connection and try refreshing."
                    />
                ) : turnoverData.length === 0 ? (
                    <ChartEmptyState
                        icon={
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
                            </svg>
                        }
                        title="No turnover data yet"
                        desc="Turnover ratios will appear once inventory transactions are recorded over a 90-day window."
                    />
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
                    <ChartEmptyState
                        icon={
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                            </svg>
                        }
                        title="Shrinkage data unavailable"
                        desc="Could not load shrinkage data. Check your connection and try refreshing."
                    />
                ) : shrinkageByProduct.length === 0 ? (
                    <ChartEmptyState
                        icon={
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                            </svg>
                        }
                        title="No shrinkage losses recorded"
                        desc="Great news — no inventory value losses have been detected in the current period."
                    />
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
    purchaseOrders: PurchaseOrder[] | null;
    purchaseOrdersLoading: boolean;
}

export function PurchasingAnalyticsCharts({
    classifications,
    purchaseOrders,
    purchaseOrdersLoading,
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
                    <ChartEmptyState
                        icon={
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="8" x2="12" y2="16"/>
                            </svg>
                        }
                        title="No classification data"
                        desc="Run the ABC/XYZ classification to see SKU distribution by value and demand variability."
                    />
                </article>
                <PurchaseOrderTrendsCard
                    purchaseOrders={purchaseOrders}
                    loading={purchaseOrdersLoading}
                />
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
            <PurchaseOrderTrendsCard
                    purchaseOrders={purchaseOrders}
                    loading={purchaseOrdersLoading}
                />
        </section>
    );
}

interface MonthlyPurchaseOrderPoint {
    key: string;
    month: string;
    fullMonth: string;
    orderCount: number;
    orderValue: number;
}

interface SupplierLeadTimePoint {
    supplier: string;
    leadTimeDays: number;
}

function buildMonthlyPurchaseOrderData(
    purchaseOrders: PurchaseOrder[],
): MonthlyPurchaseOrderPoint[] {
    const today = new Date();
    const firstMonth = new Date(today.getFullYear(), today.getMonth() - 11, 1);
    const monthlyData = Array.from({ length: 12 }, (_, index) => {
        const date = new Date(firstMonth.getFullYear(), firstMonth.getMonth() + index, 1);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

        return {
            key,
            month: date.toLocaleDateString("en", { month: "short" }),
            fullMonth: date.toLocaleDateString("en", { month: "long", year: "numeric" }),
            orderCount: 0,
            orderValue: 0,
        };
    });
    const pointsByMonth = new Map(monthlyData.map((point) => [point.key, point] as const));

    for (const order of purchaseOrders) {
        if (order.status === "draft" || !order.order_date) {
            continue;
        }

        const point = pointsByMonth.get(order.order_date.slice(0, 7));
        if (!point) {
            continue;
        }

        point.orderCount += 1;
        const orderValue = Number(order.total_amount);
        if (Number.isFinite(orderValue)) {
            point.orderValue += orderValue;
        }
    }

    return monthlyData;
}

function buildSupplierLeadTimeData(
    purchaseOrders: PurchaseOrder[],
): SupplierLeadTimePoint[] {
    const suppliers = new Map<string, SupplierLeadTimePoint>();

    for (const order of purchaseOrders) {
        const supplier = order.supplier;
        if (order.status === "draft" || !supplier?.is_active) {
            continue;
        }

        const leadTimeDays = Number(supplier.lead_time_days);
        if (Number.isFinite(leadTimeDays)) {
            suppliers.set(supplier.id, {
                supplier: supplier.name,
                leadTimeDays,
            });
        }
    }

    return [...suppliers.values()]
        .sort(
            (first, second) =>
                second.leadTimeDays - first.leadTimeDays ||
                first.supplier.localeCompare(second.supplier),
        )
        .slice(0, 6);
}

function PurchaseOrderTrendsCard({
    purchaseOrders,
    loading,
}: {
    purchaseOrders: PurchaseOrder[] | null;
    loading: boolean;
}) {
    const monthlyData = purchaseOrders
        ? buildMonthlyPurchaseOrderData(purchaseOrders)
        : [];
    const supplierLeadTimes = purchaseOrders
        ? buildSupplierLeadTimeData(purchaseOrders)
        : [];
    const orderCount = monthlyData.reduce(
        (total, point) => total + point.orderCount,
        0,
    );
    const orderValue = monthlyData.reduce(
        (total, point) => total + point.orderValue,
        0,
    );

    return (
        <article className="analytics-card">
            <header className="analytics-card__header">
                <div>
                    <h2>Purchase order trends</h2>
                    <p>
                        Recent order activity and current configured supplier lead times
                    </p>
                </div>
                <a href="/purchase-orders" className="audit-summary__link">
                    View POs →
                </a>
            </header>

            {loading ? (
                <ChartEmptyState
                    compact
                    icon={
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                        </svg>
                    }
                    title="Loading procurement analytics…"
                    desc="Fetching purchase order data."
                />
            ) : purchaseOrders === null ? (
                <ChartEmptyState
                    compact
                    icon={
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                    }
                    title="Could not load purchase orders"
                    desc="Purchase-order analytics are unavailable. Try refreshing the page."
                />
            ) : (
                <div className="procurement-chart-grid">
                    <section
                        className="procurement-chart-panel"
                        aria-label="Purchase-order volume"
                    >
                        <div className="procurement-chart-panel__header">
                            <h3>Placed and received orders</h3>
                            <p>By order date · past 12 months</p>
                        </div>
                        <div className="procurement-chart-summary">
                            <div>
                                <span>Orders</span>
                                <strong>{orderCount}</strong>
                            </div>
                            <div>
                                <span>Ordered value</span>
                                <strong>{pesoFormatter.format(orderValue)}</strong>
                            </div>
                        </div>
                        {orderCount === 0 ? (
                            <ChartEmptyState
                                compact
                                icon={
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                                    </svg>
                                }
                                title="No orders in past 12 months"
                                desc="Placed or received purchase orders will appear as a monthly trend chart."
                            />
                        ) : (
                            <div className="analytics-chart analytics-chart--compact">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={monthlyData}
                                        title="Purchase orders placed or received by month over the past 12 months"
                                        margin={{ top: 8, right: 8, bottom: 4, left: -18 }}
                                    >
                                        <CartesianGrid
                                            stroke="var(--wb-border)"
                                            strokeDasharray="3 3"
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey="month"
                                            tick={{ fill: "var(--wb-text-muted)", fontSize: 10 }}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            allowDecimals={false}
                                            width={34}
                                            tick={{ fill: "var(--wb-text-muted)", fontSize: 10 }}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <Tooltip
                                            contentStyle={tooltipContentStyle}
                                            labelStyle={tooltipLabelStyle}
                                            itemStyle={tooltipItemStyle}
                                            labelFormatter={(label) =>
                                                monthlyData.find(
                                                    (point) => point.month === String(label),
                                                )?.fullMonth ?? String(label)
                                            }
                                            formatter={(value) => [
                                                Number(value),
                                                "Purchase orders",
                                            ]}
                                        />
                                        <Bar
                                            dataKey="orderCount"
                                            name="Purchase orders"
                                            fill="var(--wb-accent)"
                                            radius={[4, 4, 0, 0]}
                                            maxBarSize={22}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </section>

                    <section
                        className="procurement-chart-panel"
                        aria-label="Supplier lead-time estimates"
                    >
                        <div className="procurement-chart-panel__header">
                            <h3>Supplier lead-time estimates</h3>
                            <p>Configured days · active suppliers with orders</p>
                        </div>
                        {supplierLeadTimes.length === 0 ? (
                            <ChartEmptyState
                                compact
                                icon={
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                                    </svg>
                                }
                                title="No supplier lead times"
                                desc="Active suppliers with placed or received orders will show configured lead-time estimates."
                            />
                        ) : (
                            <div className="analytics-chart analytics-chart--compact">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={supplierLeadTimes}
                                        layout="vertical"
                                        title="Configured supplier lead-time estimates in days"
                                        margin={{ top: 4, right: 12, bottom: 4, left: 0 }}
                                    >
                                        <CartesianGrid
                                            stroke="var(--wb-border)"
                                            strokeDasharray="3 3"
                                            horizontal={false}
                                        />
                                        <XAxis
                                            type="number"
                                            allowDecimals={false}
                                            tick={{ fill: "var(--wb-text-muted)", fontSize: 10 }}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value: number) => `${value}d`}
                                        />
                                        <YAxis
                                            type="category"
                                            dataKey="supplier"
                                            width={104}
                                            interval={0}
                                            tick={{ fill: "var(--wb-text-secondary)", fontSize: 10 }}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <Tooltip
                                            contentStyle={tooltipContentStyle}
                                            labelStyle={tooltipLabelStyle}
                                            itemStyle={tooltipItemStyle}
                                            formatter={(value) => [
                                                `${Number(value)} days`,
                                                "Configured lead time",
                                            ]}
                                        />
                                        <Bar
                                            dataKey="leadTimeDays"
                                            name="Configured lead time"
                                            fill="var(--wb-warning)"
                                            radius={[0, 4, 4, 0]}
                                            maxBarSize={22}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </section>
                </div>
            )}
        </article>
    );
}
