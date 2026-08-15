import { useEffect, useState, type FormEvent } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { getCurrentUser, type AuthUser } from "../lib/api";
import {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    type Category,
    type StoreCategoryPayload,
    type UpdateCategoryPayload,
    type PaginatedResponse,
} from "../lib/inventory-api";

type ModalMode = "create" | "edit" | null;

export default function Categories() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [meta, setMeta] = useState<PaginatedResponse<Category>["meta"] | null>(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [editTarget, setEditTarget] = useState<Category | null>(null);
    const [formError, setFormError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [formName, setFormName] = useState("");
    const [formSlug, setFormSlug] = useState("");
    const [formDescription, setFormDescription] = useState("");

    useEffect(() => {
        getCurrentUser().then((res) => setUser(res.data));
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [page]);

    async function fetchCategories() {
        setLoading(true);
        try {
            const res = await getCategories(page);
            setCategories(res.data.data);
            setMeta(res.data.meta);
        } catch {
            // fail silently, empty table shown
        } finally {
            setLoading(false);
        }
    }

    const isAdmin = user?.role === "admin";

    function openCreate() {
        setFormName("");
        setFormSlug("");
        setFormDescription("");
        setFormError("");
        setEditTarget(null);
        setModalMode("create");
    }

    function openEdit(category: Category) {
        setFormName(category.name);
        setFormSlug(category.slug);
        setFormDescription(category.description ?? "");
        setFormError("");
        setEditTarget(category);
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
                const payload: StoreCategoryPayload = {
                    name: formName,
                    slug: formSlug,
                    description: formDescription || undefined,
                };
                await createCategory(payload);
            } else if (modalMode === "edit" && editTarget) {
                const payload: UpdateCategoryPayload = {
                    name: formName,
                    slug: formSlug,
                    description: formDescription || undefined,
                };
                await updateCategory(editTarget.id, payload);
            }
            closeModal();
            fetchCategories();
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

    async function handleDelete(category: Category) {
        if (!confirm(`Delete category "${category.name}"? This action uses soft-delete.`)) {
            return;
        }
        try {
            await deleteCategory(category.id);
            fetchCategories();
        } catch (err: any) {
            if (err?.response?.status === 403) {
                alert("You are not authorized to delete categories.");
            } else {
                alert("Failed to delete category.");
            }
        }
    }

    return (
        <DashboardLayout>
            <div className="page-header">
                <div>
                    <h1>Categories</h1>
                    <p className="page-subtitle">Manage product categories</p>
                </div>
                {isAdmin && (
                    <button className="btn btn--primary" onClick={openCreate}>
                        + New Category
                    </button>
                )}
            </div>

            {loading ? (
                <div className="page-loading">Loading categories…</div>
            ) : (
                <>
                    <section className="table-section">
                        {categories.length === 0 ? (
                            <p className="empty-state">No categories found.</p>
                        ) : (
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Slug</th>
                                            <th>Description</th>
                                            <th>Created</th>
                                            {isAdmin && <th>Actions</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {categories.map((cat) => (
                                            <tr key={cat.id}>
                                                <td className="td-bold">{cat.name}</td>
                                                <td><code>{cat.slug}</code></td>
                                                <td>{cat.description ?? "—"}</td>
                                                <td>{new Date(cat.created_at).toLocaleDateString()}</td>
                                                {isAdmin && (
                                                    <td>
                                                        <div className="action-btns">
                                                            <button
                                                                className="btn btn--sm btn--secondary"
                                                                onClick={() => openEdit(cat)}
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                className="btn btn--sm btn--danger"
                                                                onClick={() => handleDelete(cat)}
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
                            <h2>{modalMode === "create" ? "New Category" : "Edit Category"}</h2>
                            <button className="modal__close" onClick={closeModal}>×</button>
                        </div>

                        {formError && <div className="form-error">{formError}</div>}

                        <form className="modal__form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="cat-name">Name</label>
                                <input
                                    id="cat-name"
                                    type="text"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    required
                                    placeholder="e.g. Electronics"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="cat-slug">Slug</label>
                                <input
                                    id="cat-slug"
                                    type="text"
                                    value={formSlug}
                                    onChange={(e) => setFormSlug(e.target.value)}
                                    required
                                    placeholder="e.g. electronics"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="cat-desc">Description</label>
                                <textarea
                                    id="cat-desc"
                                    value={formDescription}
                                    onChange={(e) => setFormDescription(e.target.value)}
                                    placeholder="Optional description"
                                    rows={3}
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
