import { useEffect, useState } from "react";

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
        <>
            <div className="page-header">
                <div>
                    <h1>Stock Overview</h1>
                    <p className="page-subtitle">Real-time on-hand, reserved, and available stock</p>
                </div>
                {canSubmitCount && (
                    <button
                        type="button"
                        className="btn btn--primary"
                        onClick={() => {
                            setSelectedSkuId(undefined);
                            setIsCountModalOpen(true);
                        }}
                    >
                        + Log Count
                    </button>
                )}
            </div>

            {/* ── Stat Cards ── */}
            <section className="stats-grid">
                <div className="stat-card stat-card--blue">
                    <div className="stat-card__icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </div>
                    <div className="stat-card__info">
                        <span className="stat-card__value">{meta?.total ?? snapshots.length}</span>
                        <span className="stat-card__label">Master SKUs</span>
                    </div>
                </div>

                <div className="stat-card stat-card--green">
                    <div className="stat-card__icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>
                    <div className="stat-card__info">
                        <span className="stat-card__value">{inStockCount}</span>
                        <span className="stat-card__label">In Stock (&gt;0)</span>
                    </div>
                </div>

                <div className={`stat-card ${outOfStockCount > 0 ? "stat-card--red" : "stat-card--blue"}`}>
                    <div className="stat-card__icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                        </svg>
                    </div>
                    <div className="stat-card__info">
                        <span className="stat-card__value">{outOfStockCount}</span>
                        <span className="stat-card__label">Out of Stock</span>
                    </div>
                </div>

                <div className="stat-card stat-card--purple">
                    <div className="stat-card__icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
                        </svg>
                    </div>
                    <div className="stat-card__info">
                        <span className="stat-card__value">{totalOnHand}</span>
                        <span className="stat-card__label">Total Units</span>
                    </div>
                </div>
            </section>

            {/* ── Search ── */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search by product name or SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
            </div>

            {/* ── Table ── */}
            <section className="table-section">
                {loading ? (
                    <div className="page-loading">Loading inventory snapshots…</div>
                ) : filteredSnapshots.length === 0 ? (
                    <p className="empty-state">
                        {searchTerm
                            ? "No products matched your search."
                            : "No stock recorded yet."}
                    </p>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>On Hand</th>
                                    <th>Reserved</th>
                                    <th>Available</th>
                                    <th>Status</th>
                                    {canSubmitCount && <th></th>}
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
                                        <td className={snapshot.qty_available > 0 ? "text-green font-semibold" : "text-red font-semibold"}>
                                            {snapshot.qty_available}
                                        </td>
                                        <td>
                                            <span className={`badge ${snapshot.qty_available <= 0 ? "badge--sale" : "badge--receipt"}`}>
                                                {snapshot.qty_available <= 0 ? "Out of stock" : "In stock"}
                                            </span>
                                        </td>
                                        {canSubmitCount && (
                                            <td>
                                                <button
                                                    type="button"
                                                    className="btn btn--secondary btn--sm"
                                                    onClick={() => {
                                                        setSelectedSkuId(snapshot.sku_id);
                                                        setIsCountModalOpen(true);
                                                    }}
                                                >
                                                    Count
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
                            Page {meta.current_page} of {meta.last_page} · {meta.total} products
                        </span>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                className="btn btn--secondary btn--sm"
                                disabled={page <= 1}
                                onClick={() => setPage(page - 1)}
                            >
                                Previous
                            </button>
                            <button
                                type="button"
                                className="btn btn--secondary btn--sm"
                                disabled={page >= meta.last_page}
                                onClick={() => setPage(page + 1)}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </section>

            <CycleCountModal
                isOpen={isCountModalOpen}
                defaultSkuId={selectedSkuId}
                onClose={() => setIsCountModalOpen(false)}
                onSuccess={() => fetchSnapshots()}
            />
        </>
    );
}
