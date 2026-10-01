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
    PurchaseOrder,
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
                    <p className="analytics-empty">
                        No classification data is available yet.
                    </p>
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
                <p className="analytics-empty" role="status">
                    Loading procurement analytics…
                </p>
            ) : purchaseOrders === null ? (
                <p className="analytics-empty" role="status">
                    Purchase-order analytics could not be loaded.
                </p>
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
                            <p className="analytics-empty analytics-empty--compact">
                                No placed or received purchase orders in the past 12 months.
                            </p>
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
                            <p className="analytics-empty analytics-empty--compact">
                                No active suppliers with placed or received purchase orders.
                            </p>
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
