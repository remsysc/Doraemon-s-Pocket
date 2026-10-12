import { useEffect, useState, useMemo, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";

import { getCurrentUser, type AuthUser } from "../lib/api";
import {
    getLots,
    getProducts,
    createLot,
    updateLot,
    deleteLot,
    exportLotsCsv,
    importLotsCsv,
    type Lot,
    type Product,
    type StoreLotPayload,
    type UpdateLotPayload,
    type PaginatedResponse,
} from "../lib/inventory-api";
import BulkImportModal from "../components/BulkImportModal";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";
import CopyBadge from "../components/CopyBadge";
import { useToast } from "../components/ToastContext";

type ModalMode = "create" | "edit" | null;
type SortField = "product" | "bin" | "received" | "expiry";
type SortOrder = "asc" | "desc";

export default function Lots() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { toast } = useToast();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [lots, setLots] = useState<Lot[]>([]);
    const [meta, setMeta] = useState<PaginatedResponse<Lot>["meta"] | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [editTarget, setEditTarget] = useState<Lot | null>(null);
    const [formError, setFormError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    const [submitting, setSubmitting] = useState(false);

    // Sorting
    const [sortField, setSortField] = useState<SortField>("received");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

    // Delete confirmation modal state
    const [deleteTarget, setDeleteTarget] = useState<Lot | null>(null);
    const [deleting, setDeleting] = useState(false);

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

    // Handle Quick Add ?action=new
    useEffect(() => {
        if (searchParams.get("action") === "new") {
            openCreate();
            searchParams.delete("action");
            setSearchParams(searchParams, { replace: true });
        }
    }, [searchParams, products]);

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

    function handleSort(field: SortField) {
        if (sortField === field) {
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortField(field);
            setSortOrder("asc");
        }
    }

    const sortedLots = useMemo(() => {
        return [...lots].sort((a, b) => {
            let valA: string | number = "";
            let valB: string | number = "";

            if (sortField === "product") {
                valA = (a.product?.name ?? a.sku_id).toLowerCase();
                valB = (b.product?.name ?? b.sku_id).toLowerCase();
            } else if (sortField === "bin") {
                valA = (a.bin_location ?? "").toLowerCase();
                valB = (b.bin_location ?? "").toLowerCase();
            } else if (sortField === "received") {
                valA = a.received_date ? new Date(a.received_date).getTime() : 0;
                valB = b.received_date ? new Date(b.received_date).getTime() : 0;
            } else if (sortField === "expiry") {
                valA = a.expiry_date ? new Date(a.expiry_date).getTime() : 0;
                valB = b.expiry_date ? new Date(b.expiry_date).getTime() : 0;
            }

            if (valA < valB) return sortOrder === "asc" ? -1 : 1;
            if (valA > valB) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });
    }, [lots, sortField, sortOrder]);

    function openCreate() {
        setFormProductId(products[0]?.id ?? "");
        setFormReceivedDate(new Date().toISOString().slice(0, 16));
        setFormExpiryDate("");
        setFormBinLocation("");
        setFormError("");
        setFieldErrors({});
        setEditTarget(null);
        setModalMode("create");
    }

    function openEdit(lot: Lot) {
        setFormProductId(lot.sku_id);
        setFormReceivedDate(lot.received_date?.slice(0, 16) ?? "");
        setFormExpiryDate(lot.expiry_date ?? "");
        setFormBinLocation(lot.bin_location ?? "");
        setFormError("");
        setFieldErrors({});
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
        setFieldErrors({});
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
                toast.success("Lot batch created successfully.");
            } else if (modalMode === "edit" && editTarget) {
                const payload: UpdateLotPayload = {
                    sku_id: formProductId,
                    received_date: formReceivedDate,
                    expiry_date: formExpiryDate || null,
                    bin_location: formBinLocation || null,
                };
                await updateLot(editTarget.lot_id, payload);
                toast.success("Lot batch updated successfully.");
            }
            closeModal();
            fetchLots();
        } catch (err: any) {
            if (err?.response?.status === 422) {
                const errors = err.response.data.errors || {};
                setFieldErrors(errors);
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

    async function confirmDelete() {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await deleteLot(deleteTarget.lot_id);
            toast.success("Lot deleted successfully.");
            setDeleteTarget(null);
            fetchLots();
        } catch (err: any) {
            if (err?.response?.status === 403) {
                toast.error("You are not authorized to delete lots.");
            } else {
                toast.error("Failed to delete lot.");
            }
        } finally {
            setDeleting(false);
        }
    }

    const [importModalOpen, setImportModalOpen] = useState(false);
    const [exporting, setExporting] = useState(false);

    const handleExportCsv = async () => {
        setExporting(true);
        try {
            const blob = await exportLotsCsv();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `lots_export_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success("Lots exported to CSV successfully.");
        } catch {
            toast.error("Failed to export lots CSV.");
        } finally {
            setExporting(false);
        }
    };

    return (
        <>
            <div className="page-header">
                <div>
                    <h1>Lots</h1>
                    <p className="page-subtitle">Manage stock receipt lots</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className="btn btn--secondary btn--sm"
                        onClick={handleExportCsv}
                        disabled={exporting}
                    >
                        {exporting ? "Exporting..." : "Export CSV"}
                    </button>
                    {canWrite && (
                        <>
                            <button
                                type="button"
                                className="btn btn--secondary btn--sm"
                                onClick={() => setImportModalOpen(true)}
                            >
                                Import CSV
                            </button>
                            <button className="btn btn--primary btn--sm" onClick={openCreate}>
                                + New Lot
                            </button>
                        </>
                    )}
                </div>
            </div>

            <BulkImportModal
                isOpen={importModalOpen}
                onClose={() => setImportModalOpen(false)}
                title="Bulk Import Lots & Batches"
                templateType="lots"
                onImport={importLotsCsv}
                onSuccess={fetchLots}
                helperText="Synchronized Onboarding: Creating lot batches will automatically record an INBOUND_RECEIPT and increment inventory snapshots."
            />

            {loading ? (
                <div className="page-loading">Loading lots…</div>
            ) : (
                <>
                    <section className="table-section">
                        {sortedLots.length === 0 ? (
                            <div className="empty-state">
                                <p>No lots found.</p>
                                {canWrite && (
                                    <button
                                        type="button"
                                        className="btn btn--primary btn--sm mt-3"
                                        onClick={openCreate}
                                    >
                                        + Receive First Lot
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Lot ID</th>
                                            <th className="sortable" onClick={() => handleSort("product")}>
                                                Product
                                                <span className={`sort-icon ${sortField === "product" ? "sort-icon--active" : ""}`}>
                                                    {sortField === "product" ? (sortOrder === "asc" ? "▲" : "▼") : "↕"}
                                                </span>
                                            </th>
                                            <th className="sortable" onClick={() => handleSort("bin")}>
                                                Bin Location
                                                <span className={`sort-icon ${sortField === "bin" ? "sort-icon--active" : ""}`}>
                                                    {sortField === "bin" ? (sortOrder === "asc" ? "▲" : "▼") : "↕"}
                                                </span>
                                            </th>
                                            <th className="sortable" onClick={() => handleSort("received")}>
                                                Received
                                                <span className={`sort-icon ${sortField === "received" ? "sort-icon--active" : ""}`}>
                                                    {sortField === "received" ? (sortOrder === "asc" ? "▲" : "▼") : "↕"}
                                                </span>
                                            </th>
                                            <th className="sortable" onClick={() => handleSort("expiry")}>
                                                Expiry
                                                <span className={`sort-icon ${sortField === "expiry" ? "sort-icon--active" : ""}`}>
                                                    {sortField === "expiry" ? (sortOrder === "asc" ? "▲" : "▼") : "↕"}
                                                </span>
                                            </th>
                                            {canWrite && <th>Actions</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedLots.map((lot) => (
                                            <tr key={lot.lot_id}>
                                                <td>
                                                    <CopyBadge value={lot.lot_id} label={lot.lot_id.slice(0, 8) + "…"} />
                                                </td>
                                                <td className="td-bold">
                                                    {lot.product?.name ?? lot.sku_id}
                                                </td>
                                                <td><code>{lot.bin_location ?? "—"}</code></td>
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
                                                {canWrite && (
                                                    <td>
                                                        <div className="action-btns">
                                                            <button
                                                                className="btn btn--sm btn--secondary"
                                                                onClick={() => openEdit(lot)}
                                                                aria-label="Edit lot"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                className="btn btn--sm btn--danger"
                                                                onClick={() => setDeleteTarget(lot)}
                                                                aria-label="Delete lot"
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
                        <div className="pagination p-4">
                            <span className="pagination__info text-xs text-secondary">
                                Page {meta.current_page} of {meta.last_page} · {meta.total} lots
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
                </>
            )}

            {/* Modal */}
            <Modal
                isOpen={modalMode !== null}
                onClose={closeModal}
                title={modalMode === "create" ? "New Lot" : "Edit Lot"}
                subtitle="Record physical stock lot batch and assigned warehouse bin."
            >
                {formError && <div className="form-error mb-4">{formError}</div>}

                <form className="modal__form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="lot-product">Product *</label>
                        <select
                            id="lot-product"
                            value={formProductId}
                            onChange={(e) => setFormProductId(e.target.value)}
                            required
                            aria-invalid={!!fieldErrors.sku_id}
                        >
                            <option value="">Select product</option>
                            {products.map((prod) => (
                                <option key={prod.id} value={prod.id}>
                                    {prod.name}
                                </option>
                            ))}
                        </select>
                        {fieldErrors.sku_id && (
                            <p className="field-error">{fieldErrors.sku_id[0]}</p>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="lot-received">Received Date *</label>
                        <input
                            id="lot-received"
                            type="datetime-local"
                            value={formReceivedDate}
                            onChange={(e) => setFormReceivedDate(e.target.value)}
                            required
                            aria-invalid={!!fieldErrors.received_date}
                        />
                        {fieldErrors.received_date && (
                            <p className="field-error">{fieldErrors.received_date[0]}</p>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="lot-expiry">Expiry Date (optional)</label>
                        <input
                            id="lot-expiry"
                            type="date"
                            value={formExpiryDate}
                            onChange={(e) => setFormExpiryDate(e.target.value)}
                        />
                        {fieldErrors.expiry_date && (
                            <p className="field-error">{fieldErrors.expiry_date[0]}</p>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="lot-bin">Bin Location *</label>
                        <input
                            id="lot-bin"
                            type="text"
                            value={formBinLocation}
                            onChange={(e) => setFormBinLocation(e.target.value)}
                            required
                            placeholder="e.g. A1-01, Shelf B3"
                            aria-invalid={!!fieldErrors.bin_location}
                        />
                        {fieldErrors.bin_location && (
                            <p className="field-error">{fieldErrors.bin_location[0]}</p>
                        )}
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
            </Modal>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteTarget !== null}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                title="Delete Lot Batch"
                message={
                    deleteTarget
                        ? `Are you sure you want to delete lot "${deleteTarget.lot_id.slice(0, 8)}…" for product "${deleteTarget.product?.name ?? deleteTarget.sku_id}"?`
                        : ""
                }
                confirmLabel="Delete Lot"
                variant="danger"
                loading={deleting}
            />
        </>
    );
}
