import { useEffect, useState, type FormEvent } from "react";
import DashboardLayout from "../components/DashboardLayout";
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

type ModalMode = "create" | "edit" | null;

export default function Products() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [meta, setMeta] = useState<PaginatedResponse<Product>["meta"] | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [editTarget, setEditTarget] = useState<Product | null>(null);
    const [formError, setFormError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Form fields
    const [formName, setFormName] = useState("");
    const [formDescription, setFormDescription] = useState("");
    const [formBarcode, setFormBarcode] = useState("");
    const [formUnit, setFormUnit] = useState("");
    const [formCategoryId, setFormCategoryId] = useState("");
    const [formIsSeasonal, setFormIsSeasonal] = useState(false);
    const [formShelfLife, setFormShelfLife] = useState("");

    useEffect(() => {
        getCurrentUser().then((res) => setUser(res.data));
        // Load all categories for the dropdown
        getCategories(1, 100).then((res) => setCategories(res.data.data));
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [page]);

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

    function openCreate() {
        setFormName("");
        setFormDescription("");
        setFormBarcode("");
        setFormUnit("");
        setFormCategoryId(categories[0]?.id ?? "");
        setFormIsSeasonal(false);
        setFormShelfLife("");
        setFormError("");
        setEditTarget(null);
        setModalMode("create");
    }

    function openEdit(product: Product) {
        setFormName(product.name);
        setFormDescription(product.description ?? "");
        setFormBarcode(product.barcode ?? "");
        setFormUnit(product.unit_of_measure);
        setFormCategoryId(product.category?.id ?? "");
        setFormIsSeasonal(product.metadata.is_seasonal);
        setFormShelfLife(product.metadata.shelf_life_days?.toString() ?? "");
        setFormError("");
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
        setSubmitting(true);

        try {
            if (modalMode === "create") {
                const payload: StoreProductPayload = {
                    name: formName,
                    description: formDescription || undefined,
                    barcode: formBarcode || undefined,
                    unit_of_measure: formUnit,
                    category_id: formCategoryId,
                    is_seasonal: formIsSeasonal,
                    shelf_life_days: formShelfLife ? parseInt(formShelfLife, 10) : null,
                };
                await createProduct(payload);
            } else if (modalMode === "edit" && editTarget) {
                const payload: UpdateProductPayload = {
                    name: formName,
                    description: formDescription || undefined,
                    barcode: formBarcode || undefined,
                    unit_of_measure: formUnit,
                    category_id: formCategoryId,
                    is_seasonal: formIsSeasonal,
                    shelf_life_days: formShelfLife ? parseInt(formShelfLife, 10) : null,
                };
                await updateProduct(editTarget.id, payload);
            }
            closeModal();
            fetchProducts();
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

    async function handleDeactivate(product: Product) {
        if (!confirm(`Deactivate product "${product.name}"?`)) return;
        try {
            await deleteProduct(product.id);
            fetchProducts();
        } catch (err: any) {
            if (err?.response?.status === 403) {
                alert("You are not authorized to deactivate products.");
            } else if (err?.response?.status === 409 || err?.response?.status === 422) {
                alert(err.response.data.message ?? "Cannot deactivate: product has related lots.");
            } else {
                alert("Failed to deactivate product.");
            }
        }
    }

    return (
        <DashboardLayout>
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
                        {products.length === 0 ? (
                            <p className="empty-state">No products found.</p>
                        ) : (
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Category</th>
                                            <th>Unit</th>
                                            <th>Barcode</th>
                                            <th>Status</th>
                                            {isAdmin && <th>Actions</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.map((prod) => (
                                            <tr key={prod.id}>
                                                <td className="td-bold">{prod.name}</td>
                                                <td>{prod.category?.name ?? "—"}</td>
                                                <td>{prod.unit_of_measure}</td>
                                                <td><code>{prod.barcode ?? "—"}</code></td>
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
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                className="btn btn--sm btn--danger"
                                                                onClick={() => handleDeactivate(prod)}
                                                            >
                                                                Deactivate
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
                    <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
                        <div className="modal__header">
                            <h2>{modalMode === "create" ? "New Product" : "Edit Product"}</h2>
                            <button className="modal__close" onClick={closeModal}>×</button>
                        </div>

                        {formError && <div className="form-error">{formError}</div>}

                        <form className="modal__form" onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="prod-name">Name</label>
                                    <input
                                        id="prod-name"
                                        type="text"
                                        value={formName}
                                        onChange={(e) => setFormName(e.target.value)}
                                        required
                                        placeholder="Product name"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="prod-category">Category</label>
                                    <select
                                        id="prod-category"
                                        value={formCategoryId}
                                        onChange={(e) => setFormCategoryId(e.target.value)}
                                        required
                                    >
                                        <option value="">Select category</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="prod-unit">Unit of Measure</label>
                                    <input
                                        id="prod-unit"
                                        type="text"
                                        value={formUnit}
                                        onChange={(e) => setFormUnit(e.target.value)}
                                        required
                                        placeholder="e.g. piece, kg, box"
                                    />
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
                                        placeholder="Optional"
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
