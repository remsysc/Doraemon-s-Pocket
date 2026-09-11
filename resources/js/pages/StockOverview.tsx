import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import {
    getInventorySnapshots,
    type InventorySnapshot,
    type PaginatedResponse,
} from "../lib/inventory-api";

export default function StockOverview() {
    const [snapshots, setSnapshots] = useState<InventorySnapshot[]>([]);
    const [meta, setMeta] = useState<
        PaginatedResponse<InventorySnapshot>["meta"] | null
    >(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        setLoading(true);

        getInventorySnapshots(page)
            .then((res) => {
                if (!active) return;
                setSnapshots(res.data.data);
                setMeta(res.data.meta);
            })
            .catch(() => {
                if (!active) return;
                setSnapshots([]);
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [page]);

    return (
        <DashboardLayout>
            <div className="page-header">
                <div>
                    <h1>Stock Overview</h1>
                    <p className="page-subtitle">
                        Real-time on-hand, reserved, and available stock per SKU
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="page-loading">Loading stock…</div>
            ) : (
                <>
                    <section className="table-section">
                        {snapshots.length === 0 ? (
                            <p className="empty-state">
                                No stock recorded yet. Snapshots appear once stock
                                transactions are logged.
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
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {snapshots.map((snapshot) => (
                                            <tr key={snapshot.sku_id}>
                                                <td>
                                                    {snapshot.product?.name ?? snapshot.sku_id}
                                                </td>
                                                <td>{snapshot.qty_on_hand}</td>
                                                <td>{snapshot.qty_reserved}</td>
                                                <td
                                                    className={
                                                        snapshot.qty_available > 0
                                                            ? "text-green"
                                                            : "text-red"
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
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    {meta && meta.last_page > 1 && (
                        <div className="pagination">
                            <button
                                className="btn btn--sm"
                                disabled={page <= 1}
                                onClick={() => setPage(page - 1)}
                            >
                                ← Prev
                            </button>
                            <span className="pagination__info">
                                Page {meta.current_page} of {meta.last_page}
                            </span>
                            <button
                                className="btn btn--sm"
                                disabled={page >= meta.last_page}
                                onClick={() => setPage(page + 1)}
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </>
            )}
        </DashboardLayout>
    );
}
