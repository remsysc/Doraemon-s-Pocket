import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { getCurrentUser, type AuthUser } from "../lib/api";
import {
    getInventorySnapshots,
    type InventorySnapshot,
    type PaginatedResponse,
} from "../lib/inventory-api";
import CycleCountModal from "../components/CycleCountModal";

export default function StockOverview() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [snapshots, setSnapshots] = useState<InventorySnapshot[]>([]);
    const [meta, setMeta] = useState<PaginatedResponse<InventorySnapshot>["meta"] | null>(null);
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

    // Modal
    const [isCountModalOpen, setIsCountModalOpen] = useState(false);
    const [selectedSkuId, setSelectedSkuId] = useState<string | undefined>(undefined);

    useEffect(() => {
        getCurrentUser().then((res) => setUser(res.data));
    }, []);

    useEffect(() => {
        fetchSnapshots();
    }, [page]);

    async function fetchSnapshots() {
        setLoading(true);
        try {
            const res = await getInventorySnapshots(page);
            setSnapshots(res.data.data);
            setMeta(res.data.meta);
        } catch {
            setSnapshots([]);
        } finally {
            setLoading(false);
        }
    }

    const canSubmitCount = user?.role === "admin" || user?.role === "warehouse_staff";

    const filteredSnapshots = snapshots.filter((s) => {
        if (!searchTerm) return true;
        const name = s.product?.name?.toLowerCase() ?? "";
        const sku = s.sku_id.toLowerCase();
        const term = searchTerm.toLowerCase();
        return name.includes(term) || sku.includes(term);
    });

    const inStockCount = snapshots.filter((s) => s.qty_available > 0).length;
    const outOfStockCount = snapshots.filter((s) => s.qty_available <= 0).length;
    const totalOnHand = snapshots.reduce((acc, s) => acc + s.qty_on_hand, 0);

    return (
        <DashboardLayout>
            <div className="page-header">
                <div>
                    <h1>Stock Overview & Snapshots</h1>
                    <p className="page-subtitle">
                        Real-time on-hand, reserved, and available stock per master SKU with row-level locking integrity
                    </p>
                </div>
                {canSubmitCount && (
                    <button
                        type="button"
                        className="btn--primary"
                        onClick={() => {
                            setSelectedSkuId(undefined);
                            setIsCountModalOpen(true);
                        }}
                    >
                        📋 + Log Physical Count
                    </button>
                )}
            </div>

            {/* Metrics */}
            <section className="stats-grid">
                <div className="stat-card stat-card--blue">
                    <div className="stat-card__info">
                        <span className="stat-card__value">{meta?.total ?? snapshots.length}</span>
                        <span className="stat-card__label">Active Master SKUs</span>
                    </div>
                </div>

                <div className="stat-card stat-card--green">
                    <div className="stat-card__info">
                        <span className="stat-card__value">{inStockCount}</span>
                        <span className="stat-card__label">In Stock (Available &gt; 0)</span>
                    </div>
                </div>

                <div
                    className={`stat-card ${
                        outOfStockCount > 0 ? "stat-card--red" : "stat-card--blue"
                    }`}
                >
                    <div className="stat-card__info">
                        <span className="stat-card__value">{outOfStockCount}</span>
                        <span className="stat-card__label">Out of Stock</span>
                    </div>
                </div>

                <div className="stat-card stat-card--purple">
                    <div className="stat-card__info">
                        <span className="stat-card__value">{totalOnHand}</span>
                        <span className="stat-card__label">Total Units on Hand</span>
                    </div>
                </div>
            </section>

            {/* Search filter bar */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search by product name or SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
            </div>

            {/* Table */}
            <section className="table-section">
                {loading ? (
                    <div className="page-loading">Loading inventory snapshots…</div>
                ) : filteredSnapshots.length === 0 ? (
                    <p className="empty-state">
                        {searchTerm
                            ? "No products matched your search."
                            : "No stock recorded yet. Snapshots appear once stock transactions are logged."}
                    </p>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Product SKU</th>
                                    <th>On Hand</th>
                                    <th>Reserved</th>
                                    <th>Available</th>
                                    <th>Stock Status</th>
                                    {canSubmitCount && <th>Floor Audit</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSnapshots.map((snapshot) => (
                                    <tr key={snapshot.sku_id}>
                                        <td className="td-bold">
                                            {snapshot.product?.name ?? snapshot.sku_id}
                                        </td>
                                        <td>{snapshot.qty_on_hand}</td>
                                        <td className="text-secondary">{snapshot.qty_reserved}</td>
                                        <td
                                            className={
                                                snapshot.qty_available > 0
                                                    ? "text-green font-semibold"
                                                    : "text-red font-semibold"
                                            }
                                        >
                                            {snapshot.qty_available}
                                        </td>
                                        <td>
                                            {snapshot.qty_available <= 0 ? (
                                                <span className="badge badge--sale">
                                                    Out of stock
                                                </span>
                                            ) : (
                                                <span className="badge badge--receipt">
                                                    In stock
                                                </span>
                                            )}
                                        </td>
                                        {canSubmitCount && (
                                            <td>
                                                <button
                                                    type="button"
                                                    className="btn--secondary btn--sm"
                                                    onClick={() => {
                                                        setSelectedSkuId(snapshot.sku_id);
                                                        setIsCountModalOpen(true);
                                                    }}
                                                >
                                                    Audit Count
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {meta && meta.last_page > 1 && (
                    <div className="pagination p-4">
                        <span className="pagination__info text-xs text-secondary">
                            Page {meta.current_page} of {meta.last_page} ({meta.total} products)
                        </span>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                className="btn--secondary btn--sm"
                                disabled={page <= 1}
                                onClick={() => setPage(page - 1)}
                            >
                                ← Prev
                            </button>
                            <button
                                type="button"
                                className="btn--secondary btn--sm"
                                disabled={page >= meta.last_page}
                                onClick={() => setPage(page + 1)}
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                )}
            </section>

            {/* Cycle Count Modal */}
            <CycleCountModal
                isOpen={isCountModalOpen}
                defaultSkuId={selectedSkuId}
                onClose={() => setIsCountModalOpen(false)}
                onSuccess={() => fetchSnapshots()}
            />
        </DashboardLayout>
    );
}
