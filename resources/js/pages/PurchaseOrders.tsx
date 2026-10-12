import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
    getPurchaseOrders,
    createPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    receivePurchaseOrder,
    getSuppliers,
    getProducts,
    exportPurchaseOrdersCsv,
    importPurchaseOrdersCsv,
    type PurchaseOrder,
    type Supplier,
    type Product,
} from "../lib/inventory-api";
import { getCurrentUser, type AuthUser } from "../lib/api";
import BulkImportModal from "../components/BulkImportModal";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";
import CopyBadge from "../components/CopyBadge";
import { useToast } from "../components/ToastContext";

type StatusBadgeClass = {
    draft: string;
    ordered: string;
    received: string;
};

const STATUS_BADGE: StatusBadgeClass = {
    draft: "badge--pending",
    ordered: "badge--sale",
    received: "badge--receipt",
};

type CreateForm = {
    supplier_id: string;
    order_date: string;
    expected_delivery_date: string;
    notes: string;
    items: Array<{ sku_id: string; quantity_ordered: number }>;
};

const emptyCreateForm = (): CreateForm => ({
    supplier_id: "",
    order_date: "",
    expected_delivery_date: "",
    notes: "",
    items: [{ sku_id: "", quantity_ordered: 1 }],
});

type SortField = "po_number" | "supplier" | "status" | "order_date" | "delivery_date";
type SortOrder = "asc" | "desc";

export default function PurchaseOrders() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { toast } = useToast();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Sorting
    const [sortField, setSortField] = useState<SortField>("order_date");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

    // Deletion confirmation
    const [deleteTarget, setDeleteTarget] = useState<PurchaseOrder | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Create PO modal
    const [createOpen, setCreateOpen] = useState(false);
    const [createForm, setCreateForm] = useState<CreateForm>(emptyCreateForm());
    const [saving, setSaving] = useState(false);

    // Receive modal
    const [receiveOpen, setReceiveOpen] = useState(false);
    const [receivePo, setReceivePo] = useState<PurchaseOrder | null>(null);
    const [receiveItems, setReceiveItems] = useState<Array<{ sku_id: string; qty_received: number }>>([]);

    const canWrite = user?.role === "admin" || user?.role === "purchasing_manager";
    const canReceive = user?.role === "admin" || user?.role === "warehouse_staff";

    useEffect(() => {
        getCurrentUser()
            .then((res) => setUser(res.data))
            .catch(() => {});
    }, []);

    const load = () => {
        setLoading(true);
        Promise.all([getPurchaseOrders(1, 100), getSuppliers(1, 100), getProducts(1, 100)])
            .then(([poRes, suppRes, prodRes]) => {
                setOrders(poRes.data.data);
                setSuppliers(suppRes.data.data);
                setProducts(prodRes.data.data);
            })
            .catch(() => setError("Failed to load purchase orders."))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, []);

    // Handle Quick Add ?action=new
    useEffect(() => {
        if (searchParams.get("action") === "new") {
            setCreateForm(emptyCreateForm());
            setCreateOpen(true);
            searchParams.delete("action");
            setSearchParams(searchParams, { replace: true });
        }
    }, [searchParams]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortField(field);
            setSortOrder("asc");
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            await createPurchaseOrder({
                supplier_id: createForm.supplier_id,
                order_date: createForm.order_date || undefined,
                expected_delivery_date: createForm.expected_delivery_date || undefined,
                notes: createForm.notes || undefined,
                items: createForm.items
                    .filter((i) => i.sku_id)
                    .map((i) => ({ sku_id: i.sku_id, quantity_ordered: i.quantity_ordered })),
            });
            setCreateOpen(false);
            setCreateForm(emptyCreateForm());
            toast.success("Purchase order created successfully.");
            load();
        } catch {
            setError("Failed to create purchase order.");
            toast.error("Failed to create purchase order.");
        } finally {
            setSaving(false);
        }
    };

    const handleAdvanceStatus = async (po: PurchaseOrder) => {
        const next = po.status === "draft" ? "ordered" : null;
        if (!next) return;
        try {
            await updatePurchaseOrder(po.id, { status: next });
            toast.success(`PO ${po.po_number} marked as Ordered.`);
            load();
        } catch {
            setError("Failed to update PO status.");
            toast.error("Failed to update PO status.");
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await deletePurchaseOrder(deleteTarget.id);
            toast.success(`Purchase order ${deleteTarget.po_number} deleted.`);
            setDeleteTarget(null);
            load();
        } catch {
            setError("Failed to delete purchase order.");
            toast.error("Failed to delete purchase order.");
        } finally {
            setDeleting(false);
        }
    };

    const openReceive = (po: PurchaseOrder) => {
        setReceivePo(po);
        const items = (po.items ?? []).map((item) => ({
            sku_id: item.sku_id,
            qty_received: Math.max(0, item.quantity_ordered - item.quantity_received),
        }));
        setReceiveItems(items.length > 0 ? items : [{ sku_id: "", qty_received: 1 }]);
        setReceiveOpen(true);
    };

    const handleReceive = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!receivePo) return;
        setSaving(true);
        setError(null);
        try {
            await receivePurchaseOrder(receivePo.id, {
                items: receiveItems.filter((i) => i.sku_id && i.qty_received > 0),
            });
            setReceiveOpen(false);
            toast.success(`Receipt recorded for PO ${receivePo.po_number}.`);
            load();
        } catch {
            setError("Failed to record receipt.");
            toast.error("Failed to record receipt.");
        } finally {
            setSaving(false);
        }
    };

    const addCreateItem = () =>
        setCreateForm((f) => ({ ...f, items: [...f.items, { sku_id: "", quantity_ordered: 1 }] }));

    const removeCreateItem = (idx: number) =>
        setCreateForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

    const filteredOrders = useMemo(() => {
        const filtered = orders.filter((po) => {
            const matchesStatus = statusFilter === "all" || po.status === statusFilter;
            if (!matchesStatus) return false;
            if (!searchTerm) return true;
            const term = searchTerm.toLowerCase();
            const poNum = po.po_number.toLowerCase();
            const supplierName = (po.supplier?.name ?? "").toLowerCase();
            return poNum.includes(term) || supplierName.includes(term);
        });

        return filtered.sort((a, b) => {
            let valA: string | number = "";
            let valB: string | number = "";

            if (sortField === "po_number") {
                valA = a.po_number.toLowerCase();
                valB = b.po_number.toLowerCase();
            } else if (sortField === "supplier") {
                valA = (a.supplier?.name ?? "").toLowerCase();
                valB = (b.supplier?.name ?? "").toLowerCase();
            } else if (sortField === "status") {
                valA = a.status;
                valB = b.status;
            } else if (sortField === "order_date") {
                valA = a.order_date ? new Date(a.order_date).getTime() : 0;
                valB = b.order_date ? new Date(b.order_date).getTime() : 0;
            } else if (sortField === "delivery_date") {
                valA = a.expected_delivery_date ? new Date(a.expected_delivery_date).getTime() : 0;
                valB = b.expected_delivery_date ? new Date(b.expected_delivery_date).getTime() : 0;
            }

            if (valA < valB) return sortOrder === "asc" ? -1 : 1;
            if (valA > valB) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });
    }, [orders, statusFilter, searchTerm, sortField, sortOrder]);

    const draftCount = orders.filter((po) => po.status === "draft").length;
    const orderedCount = orders.filter((po) => po.status === "ordered").length;
    const receivedCount = orders.filter((po) => po.status === "received").length;

    const [importModalOpen, setImportModalOpen] = useState(false);
    const [exporting, setExporting] = useState(false);

    const handleExportCsv = async () => {
        setExporting(true);
        try {
            const blob = await exportPurchaseOrdersCsv();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `purchase_orders_export_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch {
            setError("Failed to export purchase orders CSV.");
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="page-header">
                <div>
                    <h1>Purchase Orders</h1>
                    <p className="page-subtitle">Track supplier POs and record physical warehouse receipts</p>
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
                            <button
                                className="btn btn--primary btn--sm"
                                onClick={() => {
                                    setCreateForm(emptyCreateForm());
                                    setCreateOpen(true);
                                }}
                            >
                                + New PO
                            </button>
                        </>
                    )}
                </div>
            </div>

            <BulkImportModal
                isOpen={importModalOpen}
                onClose={() => setImportModalOpen(false)}
                title="Bulk Import Purchase Orders"
                templateType="purchase_orders"
                onImport={importPurchaseOrdersCsv}
                onSuccess={load}
                helperText="Upload flattened line-item CSV. Rows with the same po_number are consolidated into draft POs."
            />

            {error && (
                <div className="alert-banner alert-banner--danger" role="alert">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            {/* Top Stat Cards */}
            <section className="stats-grid" aria-label="Purchase Order statistics">
                <div className="stat-card stat-card--blue">
                    <div className="stat-card__icon" aria-hidden="true">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                        </svg>
                    </div>
                    <div className="stat-card__info">
                        <span className="stat-card__value">{orders.length}</span>
                        <span className="stat-card__label">Total Orders</span>
                    </div>
                </div>

                <div className="stat-card stat-card--purple">
                    <div className="stat-card__icon" aria-hidden="true">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                    </div>
                    <div className="stat-card__info">
                        <span className="stat-card__value">{draftCount}</span>
                        <span className="stat-card__label">Draft Status</span>
                    </div>
                </div>

                <div className="stat-card stat-card--amber">
                    <div className="stat-card__icon" aria-hidden="true">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="1" y="3" width="15" height="13" />
                            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                            <circle cx="5.5" cy="18.5" r="2.5" />
                            <circle cx="18.5" cy="18.5" r="2.5" />
                        </svg>
                    </div>
                    <div className="stat-card__info">
                        <span className="stat-card__value">{orderedCount}</span>
                        <span className="stat-card__label">In Transit / Ordered</span>
                    </div>
                </div>

                <div className="stat-card stat-card--green">
                    <div className="stat-card__icon" aria-hidden="true">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>
                    <div className="stat-card__info">
                        <span className="stat-card__value">{receivedCount}</span>
                        <span className="stat-card__label">Fully Received</span>
                    </div>
                </div>
            </section>

            {/* Filter Bar */}
            <div className="filter-bar">
                <input
                    type="search"
                    className="search-input"
                    placeholder="Search by PO number or supplier…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="flex items-center gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="btn btn--secondary btn--sm"
                        style={{ padding: "6px 10px", outline: "none" }}
                        aria-label="Filter orders by status"
                    >
                        <option value="all">All Statuses ({orders.length})</option>
                        <option value="draft">Draft ({draftCount})</option>
                        <option value="ordered">Ordered ({orderedCount})</option>
                        <option value="received">Received ({receivedCount})</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="page-loading">Loading purchase orders…</div>
            ) : (
                <section className="table-section">
                    <div className="table-section__header">
                        <h2>Purchase Orders ({filteredOrders.length})</h2>
                    </div>

                    {filteredOrders.length === 0 ? (
                        <p className="empty-state">
                            {searchTerm || statusFilter !== "all" ? "No matching purchase orders found." : "No purchase orders yet."}
                        </p>
                    ) : (
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th className="sortable" onClick={() => handleSort("po_number")}>
                                            PO Number
                                            <span className={`sort-icon ${sortField === "po_number" ? "sort-icon--active" : ""}`}>
                                                {sortField === "po_number" ? (sortOrder === "asc" ? "▲" : "▼") : "↕"}
                                            </span>
                                        </th>
                                        <th className="sortable" onClick={() => handleSort("supplier")}>
                                            Supplier
                                            <span className={`sort-icon ${sortField === "supplier" ? "sort-icon--active" : ""}`}>
                                                {sortField === "supplier" ? (sortOrder === "asc" ? "▲" : "▼") : "↕"}
                                            </span>
                                        </th>
                                        <th className="sortable" onClick={() => handleSort("status")}>
                                            Status
                                            <span className={`sort-icon ${sortField === "status" ? "sort-icon--active" : ""}`}>
                                                {sortField === "status" ? (sortOrder === "asc" ? "▲" : "▼") : "↕"}
                                            </span>
                                        </th>
                                        <th className="sortable" onClick={() => handleSort("order_date")}>
                                            Order Date
                                            <span className={`sort-icon ${sortField === "order_date" ? "sort-icon--active" : ""}`}>
                                                {sortField === "order_date" ? (sortOrder === "asc" ? "▲" : "▼") : "↕"}
                                            </span>
                                        </th>
                                        <th className="sortable" onClick={() => handleSort("delivery_date")}>
                                            Expected Delivery
                                            <span className={`sort-icon ${sortField === "delivery_date" ? "sort-icon--active" : ""}`}>
                                                {sortField === "delivery_date" ? (sortOrder === "asc" ? "▲" : "▼") : "↕"}
                                            </span>
                                        </th>
                                        <th>Line Items</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.map((po) => (
                                        <tr key={po.id}>
                                            <td className="td-bold">
                                                <CopyBadge value={po.po_number} label={po.po_number} />
                                            </td>
                                            <td>{po.supplier?.name ?? po.supplier_id}</td>
                                            <td>
                                                <span className={`badge ${STATUS_BADGE[po.status]}`}>
                                                    {po.status.charAt(0).toUpperCase() + po.status.slice(1)}
                                                </span>
                                            </td>
                                            <td>{po.order_date ?? <span className="text-muted">—</span>}</td>
                                            <td>{po.expected_delivery_date ?? <span className="text-muted">—</span>}</td>
                                            <td>{(po.items ?? []).length} item(s)</td>
                                            <td>
                                                <div className="action-btns">
                                                    {canWrite && po.status === "draft" && (
                                                        <button
                                                            className="btn btn--secondary btn--sm"
                                                            onClick={() => handleAdvanceStatus(po)}
                                                        >
                                                            Mark Ordered
                                                        </button>
                                                    )}
                                                    {canReceive && po.status === "ordered" && (
                                                        <button
                                                            className="btn btn--primary btn--sm"
                                                            onClick={() => openReceive(po)}
                                                        >
                                                            Receive
                                                        </button>
                                                    )}
                                                    {canWrite && po.status === "draft" && (
                                                        <button
                                                            className="btn btn--danger btn--sm"
                                                            onClick={() => setDeleteTarget(po)}
                                                        >
                                                            Delete
                                                        </button>
                                                    )}
                                                    {po.status === "received" && (
                                                        <span className="text-muted text-xs flex items-center gap-1">
                                                            ✓ Closed
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            )}

            {/* Create PO Modal */}
            <Modal
                isOpen={createOpen}
                onClose={() => setCreateOpen(false)}
                title="New Purchase Order"
                subtitle="Create a procurement order with suppliers and line items."
                size="wide"
            >
                <form onSubmit={handleCreate} className="modal__form">
                    <div className="form-group">
                        <label>Supplier *</label>
                        <select
                            value={createForm.supplier_id}
                            onChange={(e) => setCreateForm({ ...createForm, supplier_id: e.target.value })}
                            required
                        >
                            <option value="">— Select Supplier —</option>
                            {suppliers.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Order Date</label>
                            <input
                                type="date"
                                value={createForm.order_date}
                                onChange={(e) => setCreateForm({ ...createForm, order_date: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Expected Delivery</label>
                            <input
                                type="date"
                                value={createForm.expected_delivery_date}
                                onChange={(e) =>
                                    setCreateForm({
                                        ...createForm,
                                        expected_delivery_date: e.target.value,
                                    })
                                }
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Notes</label>
                        <textarea
                            rows={2}
                            value={createForm.notes}
                            onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                            placeholder="Internal PO references or delivery notes"
                        />
                    </div>

                    <div className="form-group">
                        <label>Line Items</label>
                        <div className="space-y-2">
                            {createForm.items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <div className="flex-1">
                                        <select
                                            value={item.sku_id}
                                            onChange={(e) => {
                                                const items = [...createForm.items];
                                                items[idx] = { ...items[idx], sku_id: e.target.value };
                                                setCreateForm({ ...createForm, items });
                                            }}
                                            required
                                        >
                                            <option value="">— Select SKU —</option>
                                            {products.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div style={{ width: 110 }}>
                                        <input
                                            type="number"
                                            min={1}
                                            placeholder="Qty"
                                            value={item.quantity_ordered}
                                            onChange={(e) => {
                                                const items = [...createForm.items];
                                                items[idx] = {
                                                    ...items[idx],
                                                    quantity_ordered: parseInt(e.target.value, 10) || 1,
                                                };
                                                setCreateForm({ ...createForm, items });
                                            }}
                                            required
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn--danger btn--sm"
                                        onClick={() => removeCreateItem(idx)}
                                        disabled={createForm.items.length === 1}
                                        aria-label="Remove item"
                                        title="Remove line item"
                                        style={{ padding: "8px 12px" }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="pt-2">
                            <button
                                type="button"
                                className="btn btn--secondary btn--sm"
                                onClick={addCreateItem}
                            >
                                + Add Item
                            </button>
                        </div>
                    </div>

                    <div className="modal__actions">
                        <button type="button" className="btn btn--secondary" onClick={() => setCreateOpen(false)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn--primary" disabled={saving}>
                            {saving ? "Creating…" : "Create PO"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Receive Modal */}
            <Modal
                isOpen={receiveOpen && receivePo !== null}
                onClose={() => setReceiveOpen(false)}
                title={receivePo ? `Receive Order: ${receivePo.po_number}` : "Receive Order"}
                subtitle="Enter physical delivered quantities into warehouse stock."
            >
                <form onSubmit={handleReceive} className="modal__form">
                    <p className="text-xs text-secondary leading-relaxed">
                        Enter the physical quantities delivered. Unreceived balances remain open.
                    </p>
                    <div className="space-y-2">
                        {receiveItems.map((item, idx) => {
                            const prod = products.find((p) => p.id === item.sku_id);
                            return (
                                <div key={idx} className="flex items-center gap-2">
                                    <div className="flex-1">
                                        <input
                                            readOnly
                                            disabled
                                            value={prod?.name ?? item.sku_id}
                                            style={{ opacity: 0.85 }}
                                        />
                                    </div>
                                    <div style={{ width: 110 }}>
                                        <input
                                            type="number"
                                            min={0}
                                            value={item.qty_received}
                                            onChange={(e) => {
                                                const items = [...receiveItems];
                                                items[idx] = {
                                                    ...items[idx],
                                                    qty_received: parseInt(e.target.value, 10) || 0,
                                                };
                                                setReceiveItems(items);
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="modal__actions">
                        <button type="button" className="btn btn--secondary" onClick={() => setReceiveOpen(false)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn--primary" disabled={saving}>
                            {saving ? "Recording…" : "Confirm Receipt"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteTarget !== null}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                title="Delete Purchase Order"
                message={
                    deleteTarget
                        ? `Are you sure you want to delete draft purchase order "${deleteTarget.po_number}"? This action cannot be undone.`
                        : ""
                }
                confirmLabel="Delete PO"
                variant="danger"
                loading={deleting}
            />
        </div>
    );
}
