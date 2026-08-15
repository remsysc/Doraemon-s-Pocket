import { useEffect, useState, type FormEvent } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { getCurrentUser, type AuthUser } from "../lib/api";
import {
    getLots,
    getProducts,
    createLot,
    updateLot,
    deleteLot,
    type Lot,
    type Product,
    type StoreLotPayload,
    type UpdateLotPayload,
    type PaginatedResponse,
} from "../lib/inventory-api";

type ModalMode = "create" | "edit" | null;

export default function Lots() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [lots, setLots] = useState<Lot[]>([]);
    const [meta, setMeta] = useState<PaginatedResponse<Lot>["meta"] | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [editTarget, setEditTarget] = useState<Lot | null>(null);
    const [formError, setFormError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Form fields
    const [formProductId, setFormProductId] = useState("");
    const [formReceivedDate, setFormReceivedDate] = useState("");
    const [formExpiryDate, setFormExpiryDate] = useState("");
    const [formBinLocation, setFormBinLocation] = useState("");

    useEffect(() => {
        getCurrentUser().then((res) => setUser(res.data));
        getProducts(1, 100).then((res) => setProducts(res.data.data));
    }, []);

    useEffect(() => {
        fetchLots();
    }, [page]);

    async function fetchLots() {
        setLoading(true);
        try {
            const res = await getLots(page);
            setLots(res.data.data);
            setMeta(res.data.meta);
        } catch {
            // empty table
        } finally {
            setLoading(false);
        }
    }

    const canWrite = user?.role === "admin" || user?.role === "warehouse_staff";

    function openCreate() {
        setFormProductId(products[0]?.id ?? "");
        setFormReceivedDate(new Date().toISOString().slice(0, 16));
        setFormExpiryDate("");
        setFormBinLocation("");
        setFormError("");
        setEditTarget(null);
        setModalMode("create");
    }

    function openEdit(lot: Lot) {
        setFormProductId(lot.sku_id);
        setFormReceivedDate(lot.received_date?.slice(0, 16) ?? "");
        setFormExpiryDate(lot.expiry_date ?? "");
        setFormBinLocation(lot.bin_location ?? "");
        setFormError("");
        setEditTarget(lot);
        setModalMode("edit");
    }

    function closeModal() {
        setModalMode(null);
        setEditTarget(null);
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setFormError("");
        setSubmitting(true);

        try {
            if (modalMode === "create") {
                const payload: StoreLotPayload = {
                    sku_id: formProductId,
                    received_date: formReceivedDate,
                    expiry_date: formExpiryDate || null,
                    bin_location: formBinLocation || null,
                };
                await createLot(payload);
            } else if (modalMode === "edit" && editTarget) {
                const payload: UpdateLotPayload = {
                    sku_id: formProductId,
                    received_date: formReceivedDate,
                    expiry_date: formExpiryDate || null,
                    bin_location: formBinLocation || null,
                };
                await updateLot(editTarget.lot_id, payload);
            }
            closeModal();
            fetchLots();
        } catch (err: any) {
            if (err?.response?.status === 422) {
                const errors = err.response.data.errors;
                const first = Object.values(errors)[0] as string[];
                setFormError(first?.[0] ?? "Validation failed.");
            } else if (err?.response?.status === 403) {
                setFormError("You are not authorized to perform this action.");
            } else {
                setFormError("An error occurred. Please try again.");
            }
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete(lot: Lot) {
        const productName = lot.product?.name ?? lot.sku_id;
        if (!confirm(`Delete lot for "${productName}" (bin: ${lot.bin_location ?? "N/A"})?`)) {
            return;
        }
        try {
            await deleteLot(lot.lot_id);
            fetchLots();
        } catch (err: any) {
            if (err?.response?.status === 403) {
                alert("You are not authorized to delete lots.");
            } else {
                alert("Failed to delete lot.");
            }
        }
    }

    return (
        <DashboardLayout>
            <div className="page-header">
                <div>
                    <h1>Lots</h1>
                    <p className="page-subtitle">Manage stock receipt lots</p>
                </div>
                {canWrite && (
                    <button className="btn btn--primary" onClick={openCreate}>
                        + New Lot
                    </button>
                )}
            </div>

            {loading ? (
                <div className="page-loading">Loading lots…</div>
            ) : (
                <>
                    <section className="table-section">
                        {lots.length === 0 ? (
                            <p className="empty-state">No lots found.</p>
                        ) : (
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Bin Location</th>
                                            <th>Received</th>
                                            <th>Expiry</th>
                                            <th>Created</th>
                                            {canWrite && <th>Actions</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lots.map((lot) => (
                                            <tr key={lot.lot_id}>
                                                <td className="td-bold">
                                                    {lot.product?.name ?? lot.sku_id}
                                                </td>
                                                <td>{lot.bin_location ?? "—"}</td>
                                                <td>
                                                    {lot.received_date
                                                        ? new Date(lot.received_date).toLocaleDateString()
                                                        : "—"}
                                                </td>
                                                <td>
                                                    {lot.expiry_date
                                                        ? new Date(lot.expiry_date).toLocaleDateString()
                                                        : "—"}
                                                </td>
                                                <td>
                                                    {new Date(lot.created_at).toLocaleDateString()}
                                                </td>
                                                {canWrite && (
                                                    <td>
                                                        <div className="action-btns">
                                                            <button
                                                                className="btn btn--sm btn--secondary"
                                                                onClick={() => openEdit(lot)}
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                className="btn btn--sm btn--danger"
                                                                onClick={() => handleDelete(lot)}
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
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

            {/* Modal */}
            {modalMode && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal__header">
                            <h2>{modalMode === "create" ? "New Lot" : "Edit Lot"}</h2>
                            <button className="modal__close" onClick={closeModal}>×</button>
                        </div>

                        {formError && <div className="form-error">{formError}</div>}

                        <form className="modal__form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="lot-product">Product</label>
                                <select
                                    id="lot-product"
                                    value={formProductId}
                                    onChange={(e) => setFormProductId(e.target.value)}
                                    required
                                >
                                    <option value="">Select product</option>
                                    {products.map((prod) => (
                                        <option key={prod.id} value={prod.id}>
                                            {prod.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="lot-received">Received Date</label>
                                <input
                                    id="lot-received"
                                    type="datetime-local"
                                    value={formReceivedDate}
                                    onChange={(e) => setFormReceivedDate(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="lot-expiry">Expiry Date (optional)</label>
                                <input
                                    id="lot-expiry"
                                    type="date"
                                    value={formExpiryDate}
                                    onChange={(e) => setFormExpiryDate(e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="lot-bin">Bin Location</label>
                                <input
                                    id="lot-bin"
                                    type="text"
                                    value={formBinLocation}
                                    onChange={(e) => setFormBinLocation(e.target.value)}
                                    placeholder="e.g. A1-01, Shelf B3"
                                />
                            </div>

                            <div className="modal__actions">
                                <button type="button" className="btn btn--secondary" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn--primary" disabled={submitting}>
                                    {submitting
                                        ? "Saving…"
                                        : modalMode === "create"
                                          ? "Create"
                                          : "Update"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
