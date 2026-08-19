import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { getCurrentUser, type AuthUser } from "../lib/api";
import {
    getCategories,
    getProducts,
    getLots,
    getTransactions,
    getAuditLogs,
    type InventoryTransaction,
    type AuditLog,
} from "../lib/inventory-api";

interface DashboardStats {
    categories: number;
    products: number;
    lots: number;
    transactions: number;
}

const ROLE_LABEL: Record<string, string> = {
    admin: "Administrator",
    purchasing_manager: "Purchasing Manager",
    warehouse_staff: "Warehouse Staff",
};

function StatCard({
    label,
    value,
    icon,
    accent,
    delta,
}: {
    label: string;
    value: number | string;
    icon: React.ReactNode;
    accent: string;
    delta?: string;
}) {
    return (
        <div
            style={{
                background: "#fff",
                border: "1px solid #E5E7EB",
                borderRadius: 12,
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                transition: "box-shadow 0.15s",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* accent bar */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: 3,
                    height: "100%",
                    background: accent,
                    borderRadius: "12px 0 0 12px",
                }}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span
                    style={{
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "#6B7280",
                    }}
                >
                    {label}
                </span>
                <span
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: `${accent}18`,
                        color: accent,
                    }}
                >
                    {icon}
                </span>
            </div>
            <div>
                <span
                    style={{
                        fontSize: 30,
                        fontWeight: 700,
                        color: "#111827",
                        lineHeight: 1,
                        fontVariantNumeric: "tabular-nums",
                    }}
                >
                    {value}
                </span>
            </div>
            {delta && (
                <span style={{ fontSize: 12, color: "#6B7280" }}>{delta}</span>
            )}
        </div>
    );
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
                paddingBottom: 12,
                borderBottom: "1px solid #F3F4F6",
            }}
        >
            <h2
                style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#111827",
                    letterSpacing: "0.01em",
                }}
            >
                {title}
            </h2>
            {action}
        </div>
    );
}

function ViewAllLink({ to }: { to: string }) {
    return (
        <Link
            to={to}
            style={{
                fontSize: 12,
                fontWeight: 500,
                color: "#4F46E5",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 4,
            }}
        >
            View all
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
        </Link>
    );
}

function Badge({ type }: { type: string }) {
    const map: Record<string, { bg: string; color: string }> = {
        receipt: { bg: "#DCFCE7", color: "#15803D" },
        pick: { bg: "#FEF3C7", color: "#B45309" },
        sale: { bg: "#DBEAFE", color: "#1D4ED8" },
        adjustment: { bg: "#F3E8FF", color: "#7E22CE" },
        return: { bg: "#FFE4E6", color: "#BE123C" },
    };
    const style = map[type.toLowerCase()] ?? { bg: "#F3F4F6", color: "#374151" };
    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "2px 8px",
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                background: style.bg,
                color: style.color,
            }}
        >
            {type}
        </span>
    );
}

function ActionBadge({ action }: { action: string }) {
    const map: Record<string, { bg: string; color: string }> = {
        created: { bg: "#DCFCE7", color: "#15803D" },
        updated: { bg: "#DBEAFE", color: "#1D4ED8" },
        deleted: { bg: "#FFE4E6", color: "#BE123C" },
    };
    const style = map[action.toLowerCase()] ?? { bg: "#F3F4F6", color: "#374151" };
    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "2px 8px",
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                background: style.bg,
                color: style.color,
            }}
        >
            {action}
        </span>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div
            style={{
                padding: "32px 16px",
                textAlign: "center",
                color: "#9CA3AF",
                fontSize: 13,
                borderRadius: 8,
                background: "#FAFAFA",
                border: "1px dashed #E5E7EB",
            }}
        >
            <svg
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                style={{ margin: "0 auto 8px", display: "block", opacity: 0.4 }}
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h18" />
            </svg>
            {message}
        </div>
    );
}

// ─── Table styles ──────────────────────────────────────────────────────────────

const tableSectionStyle: React.CSSProperties = {
    background: "#fff",
    border: "1px solid #E5E7EB",
    borderRadius: 12,
    padding: "20px 24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    marginBottom: 20,
};

const tableStyle: React.CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
};

const thStyle: React.CSSProperties = {
    padding: "8px 12px",
    textAlign: "left",
    fontSize: 11,
    fontWeight: 600,
    color: "#6B7280",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    borderBottom: "1px solid #F3F4F6",
    background: "#FAFAFA",
};

const tdStyle: React.CSSProperties = {
    padding: "11px 12px",
    color: "#374151",
    borderBottom: "1px solid #F9FAFB",
    verticalAlign: "middle",
};

// ─── Main Component ────────────────────────────────────────────────────────────

export default function Dashboard() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [stats, setStats] = useState<DashboardStats>({
        categories: 0,
        products: 0,
        lots: 0,
        transactions: 0,
    });
    const [recentTxns, setRecentTxns] = useState<InventoryTransaction[]>([]);
    const [recentAuditLogs, setRecentAuditLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDashboardData() {
            try {
                const userRes = await getCurrentUser();
                setUser(userRes.data);
                const role = userRes.data.role;

                const [catRes, prodRes, lotRes, txnRes] = await Promise.all([
                    getCategories(1, 1),
                    getProducts(1, 1),
                    getLots(1, 1),
                    getTransactions(1, 5),
                ]);

                setStats({
                    categories: catRes.data.meta.total,
                    products: prodRes.data.meta.total,
                    lots: lotRes.data.meta.total,
                    transactions: txnRes.data.meta.total,
                });

                setRecentTxns(txnRes.data.data);

                if (role === "admin") {
                    try {
                        const auditRes = await getAuditLogs(1, 5);
                        setRecentAuditLogs(auditRes.data.data);
                    } catch {
                        /* not accessible */
                    }
                }
            } catch {
                /* silently fail — stats stay 0 */
            } finally {
                setLoading(false);
            }
        }
        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <DashboardLayout>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: 200,
                        color: "#9CA3AF",
                        fontSize: 14,
                        gap: 10,
                    }}
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        style={{ animation: "spin 1s linear infinite" }}
                    >
                        <path d="M21 12a9 9 0 11-6.219-8.56" />
                    </svg>
                    Loading dashboard…
                </div>
            </DashboardLayout>
        );
    }

    const role = user?.role ?? "warehouse_staff";
    const canWrite = role === "admin" || role === "warehouse_staff";
    const isPM = role === "purchasing_manager";
    const isAdmin = role === "admin";

    return (
        <DashboardLayout>
            {/* ── Page Header ─────────────────────────────── */}
            <div
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    marginBottom: 24,
                    flexWrap: "wrap",
                    gap: 12,
                }}
            >
                <div>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            marginBottom: 4,
                        }}
                    >
                        <h1
                            style={{
                                margin: 0,
                                fontSize: 22,
                                fontWeight: 700,
                                color: "#111827",
                                letterSpacing: "-0.02em",
                            }}
                        >
                            Operations Overview
                        </h1>
                        <span
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                padding: "3px 10px",
                                borderRadius: 100,
                                background: "#F0FDF4",
                                color: "#15803D",
                                fontSize: 11,
                                fontWeight: 600,
                            }}
                        >
                            <span
                                style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: "50%",
                                    background: "#22C55E",
                                    display: "inline-block",
                                }}
                            />
                            Live
                        </span>
                    </div>
                    <p
                        style={{
                            margin: 0,
                            fontSize: 13,
                            color: "#6B7280",
                        }}
                    >
                        {user?.name
                            ? `Signed in as ${user.name} · ${ROLE_LABEL[role] ?? role}`
                            : "Inventory management system"}
                    </p>
                </div>

                {canWrite && (
                    <Link
                        to="/transactions"
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "9px 18px",
                            borderRadius: 8,
                            background: "#4F46E5",
                            color: "#fff",
                            fontWeight: 600,
                            fontSize: 13,
                            textDecoration: "none",
                            boxShadow: "0 1px 3px rgba(79,70,229,0.3)",
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                        New Transaction
                    </Link>
                )}
            </div>

            {/* ── KPI Cards ────────────────────────────────── */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: 16,
                    marginBottom: 24,
                }}
            >
                {(isAdmin || isPM) && (
                    <>
                        <StatCard
                            label="Categories"
                            value={stats.categories}
                            accent="#4F46E5"
                            icon={
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="7" height="7" rx="1" />
                                    <rect x="14" y="3" width="7" height="7" rx="1" />
                                    <rect x="3" y="14" width="7" height="7" rx="1" />
                                    <rect x="14" y="14" width="7" height="7" rx="1" />
                                </svg>
                            }
                            delta="Total active categories"
                        />
                        <StatCard
                            label="Products"
                            value={stats.products}
                            accent="#0EA5E9"
                            icon={
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                                </svg>
                            }
                            delta="SKUs in catalog"
                        />
                    </>
                )}
                <StatCard
                    label="Active Lots"
                    value={stats.lots}
                    accent="#F59E0B"
                    icon={
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
                            <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
                        </svg>
                    }
                    delta="Lot batches tracked"
                />
                <StatCard
                    label="Transactions"
                    value={stats.transactions}
                    accent="#8B5CF6"
                    icon={
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                            <polyline points="17 6 23 6 23 12" />
                        </svg>
                    }
                    delta="All-time movement records"
                />
            </div>

            {/* ── Notice Banner ────────────────────────────── */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    borderRadius: 8,
                    border: "1px solid #FEF08A",
                    background: "#FEFCE8",
                    marginBottom: 24,
                    fontSize: 13,
                    color: "#713F12",
                }}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CA8A04" strokeWidth="2">
                    <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <span>
                    <strong style={{ fontWeight: 600 }}>Reorder advisory active.</strong>{" "}
                    Monitor stock thresholds to prevent stockouts on critical components.
                </span>
                <Link
                    to="/lots"
                    style={{
                        marginLeft: "auto",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#92400E",
                        textDecoration: "none",
                        whiteSpace: "nowrap",
                    }}
                >
                    Review lots →
                </Link>
            </div>

            {/* ── Recent Transactions ──────────────────────── */}
            <div style={tableSectionStyle}>
                <SectionHeader
                    title="Recent Transactions"
                    action={<ViewAllLink to="/transactions" />}
                />
                {recentTxns.length === 0 ? (
                    <EmptyState message="No transactions recorded yet. Activity will appear here." />
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={tableStyle}>
                            <thead>
                                <tr>
                                    {["Type", "Qty", "Product", "Performed by", "Date"].map((h) => (
                                        <th key={h} style={thStyle}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {recentTxns.map((txn) => (
                                    <tr key={txn.id} style={{ transition: "background 0.1s" }}>
                                        <td style={tdStyle}>
                                            <Badge type={txn.type} />
                                        </td>
                                        <td style={tdStyle}>
                                            <span
                                                style={{
                                                    fontWeight: 600,
                                                    fontVariantNumeric: "tabular-nums",
                                                    color: txn.quantity_delta >= 0 ? "#15803D" : "#DC2626",
                                                }}
                                            >
                                                {txn.quantity_delta >= 0 ? "+" : ""}
                                                {txn.quantity_delta}
                                            </span>
                                        </td>
                                        <td style={{ ...tdStyle, fontWeight: 500, color: "#111827" }}>
                                            {txn.lot?.product?.name ?? "—"}
                                        </td>
                                        <td style={{ ...tdStyle, color: "#6B7280" }}>
                                            {txn.actor?.name ?? "—"}
                                        </td>
                                        <td style={{ ...tdStyle, color: "#9CA3AF", fontSize: 12 }}>
                                            {new Date(txn.occured_at).toLocaleDateString(undefined, {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                            })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Audit Log — Admin only ───────────────────── */}
            {isAdmin && (
                <div style={tableSectionStyle}>
                    <SectionHeader
                        title="Audit Activity"
                        action={<ViewAllLink to="/audit-logs" />}
                    />
                    {recentAuditLogs.length === 0 ? (
                        <EmptyState message="No audit activity recorded yet." />
                    ) : (
                        <div style={{ overflowX: "auto" }}>
                            <table style={tableStyle}>
                                <thead>
                                    <tr>
                                        {["Action", "Resource", "User", "Date"].map((h) => (
                                            <th key={h} style={thStyle}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentAuditLogs.map((log) => (
                                        <tr key={log.id}>
                                            <td style={tdStyle}>
                                                <ActionBadge action={log.action} />
                                            </td>
                                            <td style={{ ...tdStyle, fontWeight: 500 }}>
                                                {log.auditable_type.split("\\").pop()}
                                            </td>
                                            <td style={{ ...tdStyle, color: "#6B7280" }}>
                                                {log.user?.name ?? "System"}
                                            </td>
                                            <td style={{ ...tdStyle, color: "#9CA3AF", fontSize: 12 }}>
                                                {new Date(log.created_at).toLocaleDateString(undefined, {
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── Roadmap Notice ───────────────────────────── */}
            <div
                style={{
                    padding: "12px 16px",
                    borderRadius: 8,
                    border: "1px solid #E5E7EB",
                    background: "#F9FAFB",
                    fontSize: 12,
                    color: "#9CA3AF",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                }}
            >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4l3 3" />
                </svg>
                <span>
                    {isAdmin && "Upcoming: Alerts, Reorder Configuration, Cycle Counts"}
                    {role === "warehouse_staff" && "Upcoming: Cycle Counts"}
                    {isPM && "Upcoming: Purchase Orders, Reorder Suggestions"}
                </span>
            </div>
        </DashboardLayout>
    );
}