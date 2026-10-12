import { useEffect, useState, useMemo, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";

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
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";
import { useToast } from "../components/ToastContext";

type ModalMode = "create" | "edit" | null;
type SortField = "name" | "slug";
type SortOrder = "asc" | "desc";

export default function Categories() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { toast } = useToast();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [meta, setMeta] = useState<PaginatedResponse<Category>["meta"] | null>(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [editTarget, setEditTarget] = useState<Category | null>(null);
    const [formError, setFormError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    const [submitting, setSubmitting] = useState(false);

    // Sorting
    const [sortField, setSortField] = useState<SortField>("name");
    const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

    // Deletion
    const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
    const [deleting, setDeleting] = useState(false);

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

    // Handle Quick Add ?action=new
    useEffect(() => {
        if (searchParams.get("action") === "new") {
            openCreate();
            searchParams.delete("action");
            setSearchParams(searchParams, { replace: true });
        }
    }, [searchParams]);

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

    function handleSort(field: SortField) {
        if (sortField === field) {
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortField(field);
            setSortOrder("asc");
        }
    }

    const sortedCategories = useMemo(() => {
        return [...categories].sort((a, b) => {
            let valA = "";
            let valB = "";

            if (sortField === "name") {
                valA = a.name.toLowerCase();
                valB = b.name.toLowerCase();
            } else if (sortField === "slug") {
                valA = a.slug.toLowerCase();
                valB = b.slug.toLowerCase();
            }

            if (valA < valB) return sortOrder === "asc" ? -1 : 1;
            if (valA > valB) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });
    }, [categories, sortField, sortOrder]);

    function openCreate() {
        setFormName("");
        setFormSlug("");
        setFormDescription("");
        setFormError("");
        setFieldErrors({});
        setEditTarget(null);
        setModalMode("create");
    }

    function openEdit(category: Category) {
        setFormName(category.name);
        setFormSlug(category.slug);
        setFormDescription(category.description ?? "");
        setFormError("");
        setFieldErrors({});
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
        setFieldErrors({});
        setSubmitting(true);

        try {
            if (modalMode === "create") {
                const payload: StoreCategoryPayload = {
                    name: formName,
                    slug: formSlug,
                    description: formDescription || undefined,
                };
                await createCategory(payload);
                toast.success(`Category "${formName}" created successfully.`);
            } else if (modalMode === "edit" && editTarget) {
                const payload: UpdateCategoryPayload = {
                    name: formName,
                    slug: formSlug,
                    description: formDescription || undefined,
                };
                await updateCategory(editTarget.id, payload);
                toast.success(`Category "${formName}" updated successfully.`);
            }
            closeModal();
            fetchCategories();
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
            await deleteCategory(deleteTarget.id);
            toast.success(`Category "${deleteTarget.name}" deleted.`);
            setDeleteTarget(null);
            fetchCategories();
        } catch (err: any) {
            if (err?.response?.status === 403) {
                toast.error("You are not authorized to delete categories.");
            } else {
                toast.error("Failed to delete category.");
            }
        } finally {
            setDeleting(false);
        }
    }

    return (
        <>
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
                        {sortedCategories.length === 0 ? (
                            <div className="empty-state">
                                <p>No categories found.</p>
                                {isAdmin && (
                                    <button
                                        type="button"
                                        className="btn btn--primary btn--sm mt-3"
                                        onClick={openCreate}
                                    >
                                        + Create First Category
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
                                            <th className="sortable" onClick={() => handleSort("slug")}>
                                                Slug
                                                <span className={`sort-icon ${sortField === "slug" ? "sort-icon--active" : ""}`}>
                                                    {sortField === "slug" ? (sortOrder === "asc" ? "▲" : "▼") : "↕"}
                                                </span>
                                            </th>
                                            <th>Description</th>
                                            <th>Created</th>
                                            {isAdmin && <th>Actions</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedCategories.map((cat) => (
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
                                                                aria-label={`Edit ${cat.name}`}
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                className="btn btn--sm btn--danger"
                                                                onClick={() => setDeleteTarget(cat)}
                                                                aria-label={`Delete ${cat.name}`}
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
                                Page {meta.current_page} of {meta.last_page} · {meta.total} categories
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
                title={modalMode === "create" ? "New Category" : "Edit Category"}
                subtitle="Organize appliances and products by functional department."
            >
                {formError && <div className="form-error mb-4">{formError}</div>}

                <form className="modal__form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="cat-name">Name *</label>
                        <input
                            id="cat-name"
                            type="text"
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            required
                            placeholder="e.g. Electronics"
                            aria-invalid={!!fieldErrors.name}
                        />
                        {fieldErrors.name && (
                            <p className="field-error">{fieldErrors.name[0]}</p>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="cat-slug">Slug *</label>
                        <input
                            id="cat-slug"
                            type="text"
                            value={formSlug}
                            onChange={(e) => setFormSlug(e.target.value)}
                            required
                            placeholder="e.g. electronics"
                            aria-invalid={!!fieldErrors.slug}
                        />
                        {fieldErrors.slug && (
                            <p className="field-error">{fieldErrors.slug[0]}</p>
                        )}
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
            </Modal>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteTarget !== null}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                title="Delete Category"
                message={
                    deleteTarget
                        ? `Are you sure you want to delete category "${deleteTarget.name}"? Products assigned to this category will require reassignment.`
                        : ""
                }
                confirmLabel="Delete Category"
                variant="danger"
                loading={deleting}
            />
        </>
    );
}
