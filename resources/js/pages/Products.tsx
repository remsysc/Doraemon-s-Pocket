import { useEffect, useState, useMemo, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";

import { getCurrentUser, type AuthUser } from "../lib/api";
import {
    getProducts,
    getCategories,
    createProduct,
    updateProduct,
    deleteProduct,
    type Product,
    type Category,
    type StoreProductPayload,
    type UpdateProductPayload,
    type PaginatedResponse,
} from "../lib/inventory-api";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";
import CopyBadge from "../components/CopyBadge";
import { useToast } from "../components/ToastContext";

type ModalMode = "create" | "edit" | null;
type SortField = "name" | "category" | "unit_cost" | "unit_price" | "status";
type SortOrder = "asc" | "desc";

const UNIT_OPTIONS: { value: string; label: string }[] = [
    { value: "unit", label: "Unit (unit)" },
    { value: "piece", label: "Piece (pc)" },
    { value: "box", label: "Box (box)" },
    { value: "set", label: "Set (set)" },
    { value: "pack", label: "Pack (pack)" },
    { value: "pair", label: "Pair (pair)" },
    { value: "carton", label: "Carton (ctn)" },
    { value: "bundle", label: "Bundle (bdl)" },
    { value: "kg", label: "Kilogram (kg)" },
    { value: "g", label: "Gram (g)" },
    { value: "m", label: "Meter (m)" },
];

const UNIT_OPTIONS: { value: string; label: string }[] = [
    { value: "unit", label: "Unit (unit)" },
    { value: "piece", label: "Piece (pc)" },
    { value: "box", label: "Box (box)" },
    { value: "set", label: "Set (set)" },
    { value: "pack", label: "Pack (pack)" },
    { value: "pair", label: "Pair (pair)" },
    { value: "carton", label: "Carton (ctn)" },
    { value: "bundle", label: "Bundle (bdl)" },
    { value: "kg", label: "Kilogram (kg)" },
    { value: "g", label: "Gram (g)" },
    { value: "m", label: "Meter (m)" },
];

export default function Products() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { toast } = useToast();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [meta, setMeta] = useState<PaginatedResponse<Product>["meta"] | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [editTarget, setEditTarget] = useState<Product | null>(null);
    const [formError, setFormError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    const [submitting, setSubmitting] = useState(false);

    // Sorting
    const [sortField, setSortField] = useState<SortField>("name");
    const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

    // Deactivation confirmation modal state
    const [deactivateTarget, setDeactivateTarget] = useState<Product | null>(null);
    const [deactivating, setDeactivating] = useState(false);

    // Form fields
    const [formName, setFormName] = useState("");
    const [formDescription, setFormDescription] = useState("");
    const [formBarcode, setFormBarcode] = useState("");
    const [formUnit, setFormUnit] = useState(UNIT_OPTIONS[0].value);
    const [formUnitCost, setFormUnitCost] = useState("");
    const [formUnitPrice, setFormUnitPrice] = useState("");
    const [formCategoryId, setFormCategoryId] = useState("");
    const [formIsSeasonal, setFormIsSeasonal] = useState(false);
    const [formShelfLife, setFormShelfLife] = useState("");
    const [formIsActive, setFormIsActive] = useState(true);

    useEffect(() => {
        getCurrentUser().then((res) => setUser(res.data));
        // Load all categories for the dropdown
        getCategories(1, 100).then((res) => setCategories(res.data.data));
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [page]);

    // Handle Quick Add ?action=new
    useEffect(() => {
        if (searchParams.get("action") === "new") {
            openCreate();
            // Clear parameter from URL so reload doesn't keep reopening
            searchParams.delete("action");
            setSearchParams(searchParams, { replace: true });
        }
    }, [searchParams, categories]);

    async function fetchProducts() {
        setLoading(true);
        try {
            const res = await getProducts(page);
            setProducts(res.data.data);
            setMeta(res.data.meta);
        } catch {
            // empty table
        } finally {
            setLoading(false);
        }
    }

    const isAdmin = user?.role === "admin";

    function handleSort(field: SortField) {
        if (sortField === field) {
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortField(field);
            setSortOrder("asc");
        }
    }

    const sortedProducts = useMemo(() => {
        return [...products].sort((a, b) => {
            let valA: string | number = "";
            let valB: string | number = "";

            if (sortField === "name") {
                valA = a.name.toLowerCase();
                valB = b.name.toLowerCase();
            } else if (sortField === "category") {
                valA = (a.category?.name ?? "").toLowerCase();
                valB = (b.category?.name ?? "").toLowerCase();
            } else if (sortField === "unit_cost") {
                valA = a.unit_cost ?? 0;
                valB = b.unit_cost ?? 0;
            } else if (sortField === "unit_price") {
                valA = a.unit_price ?? 0;
                valB = b.unit_price ?? 0;
            } else if (sortField === "status") {
                valA = a.status;
                valB = b.status;
            }

            if (valA < valB) return sortOrder === "asc" ? -1 : 1;
            if (valA > valB) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });
    }, [products, sortField, sortOrder]);

    function openCreate() {
        setFormName("");
        setFormDescription("");
        setFormBarcode("");
        setFormUnit(UNIT_OPTIONS[0].value);
        setFormUnitCost("");
        setFormUnitPrice("");
        setFormCategoryId(categories[0]?.id ?? "");
        setFormIsSeasonal(false);
        setFormShelfLife("");
        setFormIsActive(true);
        setFormError("");
        setFieldErrors({});
        setEditTarget(null);
        setModalMode("create");
    }

    function openEdit(product: Product) {
        setFormName(product.name);
        setFormDescription(product.description ?? "");
        setFormBarcode(product.barcode ?? "");
        setFormUnit(product.unit_of_measure);
        setFormUnitCost(product.unit_cost?.toString() ?? "");
        setFormUnitPrice(product.unit_price?.toString() ?? "");
        setFormCategoryId(product.category?.id ?? "");
        setFormIsSeasonal(product.metadata?.is_seasonal ?? false);
        setFormShelfLife(product.metadata?.shelf_life_days?.toString() ?? "");
        setFormIsActive(product.status === "active" || product.is_active !== false);
        setFormError("");
        setFieldErrors({});
        setEditTarget(product);
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
                const payload: StoreProductPayload = {
                    name: formName,
                    description: formDescription || undefined,
                    barcode: formBarcode || undefined,
                    unit_of_measure: formUnit,
                    unit_cost: formUnitCost ? parseFloat(formUnitCost) : null,
                    unit_price: formUnitPrice ? parseFloat(formUnitPrice) : null,
                    category_id: formCategoryId,
                    is_seasonal: formIsSeasonal,
                    shelf_life_days: formShelfLife ? parseInt(formShelfLife, 10) : null,
                    is_active: formIsActive,
                };
                await createProduct(payload);
                toast.success(`Product "${formName}" created successfully.`);
            } else if (modalMode === "edit" && editTarget) {
                const payload: UpdateProductPayload = {
                    name: formName,
                    description: formDescription || undefined,
                    barcode: formBarcode || undefined,
                    unit_of_measure: formUnit,
                    unit_cost: formUnitCost ? parseFloat(formUnitCost) : null,
                    unit_price: formUnitPrice ? parseFloat(formUnitPrice) : null,
                    category_id: formCategoryId,
                    is_seasonal: formIsSeasonal,
                    shelf_life_days: formShelfLife ? parseInt(formShelfLife, 10) : null,
                    is_active: formIsActive,
                };
                await updateProduct(editTarget.id, payload);
                toast.success(`Product "${formName}" updated successfully.`);
            }
            closeModal();
            fetchProducts();
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

    async function confirmDeactivate() {
        if (!deactivateTarget) return;
        setDeactivating(true);
        try {
            await deleteProduct(deactivateTarget.id);
            toast.success(`Product "${deactivateTarget.name}" deactivated.`);
            setDeactivateTarget(null);
            fetchProducts();
        } catch (err: any) {
            if (err?.response?.status === 403) {
                toast.error("You are not authorized to deactivate products.");
            } else if (err?.response?.status === 409 || err?.response?.status === 422) {
                toast.error(err.response.data.message ?? "Cannot deactivate: product has related lots.");
            } else {
                toast.error("Failed to deactivate product.");
            }
        } finally {
            setDeactivating(false);
        }
    }

    return (
        <>
            <div className="page-header">
                <div>
                    <h1>Products</h1>
                    <p className="page-subtitle">Manage inventory products</p>
                </div>
                {isAdmin && (
                    <button className="btn btn--primary" onClick={openCreate}>
                        + New Product
                    </button>
                )}
            </div>

            {loading ? (
                <div className="page-loading">Loading products…</div>
            ) : (
                <>
                    <section className="table-section">
                        {sortedProducts.length === 0 ? (
                            <div className="empty-state">
                                <p>No products found.</p>
                                {isAdmin && (
                                    <button
                                        type="button"
                                        className="btn btn--primary btn--sm mt-3"
                                        onClick={openCreate}
                                    >
                                        + Create First Product
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th className="sortable" onClick={() => handleSort("name")}>
                                                Name
                                                <span className={`sort-icon ${sortField === "name" ? "sort-icon--active" : ""}`}>
                                                    {sortField === "name" ? (sortOrder === "asc" ? "▲" : "▼") : "↕"}
                                                </span>
                                            </th>
                                            <th className="sortable" onClick={() => handleSort("category")}>
                                                Category
                                                <span className={`sort-icon ${sortField === "category" ? "sort-icon--active" : ""}`}>
                                                    {sortField === "category" ? (sortOrder === "asc" ? "▲" : "▼") : "↕"}
                                                </span>
                                            </th>
                                            <th>Unit</th>
                                            <th className="sortable" onClick={() => handleSort("unit_cost")}>
                                                Cost / Price
                                                <span className={`sort-icon ${sortField === "unit_cost" || sortField === "unit_price" ? "sort-icon--active" : ""}`}>
                                                    {sortField === "unit_cost" ? (sortOrder === "asc" ? "▲" : "▼") : "↕"}
                                                </span>
                                            </th>
                                            <th>Barcode</th>
                                            <th className="sortable" onClick={() => handleSort("status")}>
                                                Status
                                                <span className={`sort-icon ${sortField === "status" ? "sort-icon--active" : ""}`}>
                                                    {sortField === "status" ? (sortOrder === "asc" ? "▲" : "▼") : "↕"}
                                                </span>
                                            </th>
                                            {isAdmin && <th>Actions</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedProducts.map((prod) => (
                                            <tr key={prod.id}>
                                                <td className="td-bold">{prod.name}</td>
                                                <td>{prod.category?.name ?? "—"}</td>
                                                <td>{prod.unit_of_measure}</td>
                                                <td>
                                                    {prod.unit_cost != null || prod.unit_price != null ? (
                                                        <span>
                                                            {prod.unit_cost != null ? `₱${prod.unit_cost.toFixed(2)}` : "—"} / {prod.unit_price != null ? `₱${prod.unit_price.toFixed(2)}` : "—"}
                                                        </span>
                                                    ) : "—"}
                                                </td>
                                                <td>
                                                    {prod.barcode ? (
                                                        <CopyBadge value={prod.barcode} label={prod.barcode} />
                                                    ) : (
                                                        <span className="text-muted">—</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className={`badge badge--${prod.status}`}>
                                                        {prod.status}
                                                    </span>
                                                </td>
                                                {isAdmin && (
                                                    <td>
                                                        <div className="action-btns">
                                                            <button
                                                                className="btn btn--sm btn--secondary"
                                                                onClick={() => openEdit(prod)}
                                                                aria-label={`Edit ${prod.name}`}
                                                            >
                                                                Edit
                                                            </button>
                                                            {prod.status === "active" && (
                                                                <button
                                                                    className="btn btn--sm btn--danger"
                                                                    onClick={() => setDeactivateTarget(prod)}
                                                                    aria-label={`Deactivate ${prod.name}`}
                                                                >
                                                                    Deactivate
                                                                </button>
                                                            )}
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
                </>
            )}

            {/* Modal */}
            <Modal
                isOpen={modalMode !== null}
                onClose={closeModal}
                title={modalMode === "create" ? "New Product" : "Edit Product"}
                subtitle="Specify product attributes, pricing, and category classification."
                size="wide"
            >
                {formError && <div className="form-error mb-4">{formError}</div>}

                <form className="modal__form" onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="prod-name">Name *</label>
                            <input
                                id="prod-name"
                                type="text"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                required
                                placeholder="Product name"
                                aria-invalid={!!fieldErrors.name}
                            />
                            {fieldErrors.name && (
                                <p className="field-error">{fieldErrors.name[0]}</p>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="prod-category">Category *</label>
                            <select
                                id="prod-category"
                                value={formCategoryId}
                                onChange={(e) => setFormCategoryId(e.target.value)}
                                required
                                aria-invalid={!!fieldErrors.category_id}
                            >
                                <option value="">Select category</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                            {fieldErrors.category_id && (
                                <p className="field-error">{fieldErrors.category_id[0]}</p>
                            )}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="prod-unit">Unit of Measure *</label>
                            <select
                                id="prod-unit"
                                value={formUnit}
                                onChange={(e) => setFormUnit(e.target.value)}
                                required
                            >
                                {UNIT_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                                {formUnit && !UNIT_OPTIONS.some((opt) => opt.value === formUnit) && (
                                    <option value={formUnit}>{formUnit}</option>
                                )}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="prod-barcode">Barcode</label>
                            <input
                                id="prod-barcode"
                                type="text"
                                value={formBarcode}
                                onChange={(e) => setFormBarcode(e.target.value)}
                                placeholder="Optional barcode"
                            />
                            {fieldErrors.barcode && (
                                <p className="field-error">{fieldErrors.barcode[0]}</p>
                            )}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="prod-unit-cost">Unit Cost (₱)</label>
                            <input
                                id="prod-unit-cost"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formUnitCost}
                                onChange={(e) => setFormUnitCost(e.target.value)}
                                placeholder="0.00"
                            />
                            {fieldErrors.unit_cost && (
                                <p className="field-error">{fieldErrors.unit_cost[0]}</p>
                            )}
                        </div>
                        <div className="form-group">
                            <label htmlFor="prod-unit-price">Unit Price (₱)</label>
                            <input
                                id="prod-unit-price"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formUnitPrice}
                                onChange={(e) => setFormUnitPrice(e.target.value)}
                                placeholder="0.00"
                            />
                            {fieldErrors.unit_price && (
                                <p className="field-error">{fieldErrors.unit_price[0]}</p>
                            )}
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="prod-desc">Description</label>
                        <textarea
                            id="prod-desc"
                            value={formDescription}
                            onChange={(e) => setFormDescription(e.target.value)}
                            placeholder="Optional description"
                            rows={2}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="prod-shelf">Shelf Life (days)</label>
                            <input
                                id="prod-shelf"
                                type="number"
                                min="0"
                                value={formShelfLife}
                                onChange={(e) => setFormShelfLife(e.target.value)}
                                placeholder={formIsSeasonal ? "Required for seasonal" : "Optional"}
                            />
                        </div>

                        <div className="form-group form-group--checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={formIsSeasonal}
                                    onChange={(e) => setFormIsSeasonal(e.target.checked)}
                                />
                                Seasonal product
                            </label>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group form-group--checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={formIsActive}
                                    onChange={(e) => setFormIsActive(e.target.checked)}
                                />
                                Active
                            </label>
                        </div>
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

            {/* Deactivation Confirmation Modal */}
            <ConfirmModal
                isOpen={deactivateTarget !== null}
                onClose={() => setDeactivateTarget(null)}
                onConfirm={confirmDeactivate}
                title="Deactivate Product"
                message={
                    deactivateTarget
                        ? `Are you sure you want to deactivate "${deactivateTarget.name}"? Inactive products cannot be selected for new customer orders or receipts.`
                        : ""
                }
                confirmLabel="Deactivate"
                variant="danger"
                loading={deactivating}
            />
        </>
    );
}
