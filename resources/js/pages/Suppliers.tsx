import { useEffect, useState } from "react";
import {
    getSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    exportSuppliersCsv,
    importSuppliersCsv,
    type Supplier,
    type StoreSupplierPayload,
} from "../lib/inventory-api";
import { getCurrentUser, type AuthUser } from "../lib/api";
import BulkImportModal from "../components/BulkImportModal";

type ModalMode = "create" | "edit";

interface SupplierForm {
    name: string;
    contact_name: string;
    contact_email: string;
    contact_phone: string;
    address: string;
    lead_time_days: number;
}

const emptyForm = (): SupplierForm => ({
    name: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    address: "",
    lead_time_days: 7,
});

export default function Suppliers() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<ModalMode>("create");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<SupplierForm>(emptyForm());
    const [saving, setSaving] = useState(false);

    const canWrite = user?.role === "admin" || user?.role === "purchasing_manager";

    useEffect(() => {
        getCurrentUser()
            .then((res) => setUser(res.data))
            .catch(() => {});
    }, []);

    const load = () => {
        setLoading(true);
        getSuppliers(1, 100)
            .then((res) => {
                setSuppliers(res.data.data);
            })
            .catch(() => setError("Failed to load suppliers."))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, []);

    const openCreate = () => {
        setModalMode("create");
        setEditingId(null);
        setForm(emptyForm());
        setModalOpen(true);
    };

    const openEdit = (s: Supplier) => {
        setModalMode("edit");
        setEditingId(s.id);
        setForm({
            name: s.name,
            contact_name: s.contact_name ?? "",
            contact_email: s.contact_email ?? "",
            contact_phone: s.contact_phone ?? "",
            address: s.address ?? "",
            lead_time_days: s.lead_time_days,
        });
        setModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            const payload: StoreSupplierPayload = {
                name: form.name,
                contact_name: form.contact_name || undefined,
                contact_email: form.contact_email || undefined,
                contact_phone: form.contact_phone || undefined,
                address: form.address || undefined,
                lead_time_days: form.lead_time_days,
            };

            if (modalMode === "create") {
                await createSupplier(payload);
            } else if (editingId) {
                await updateSupplier(editingId, payload);
            }

            setModalOpen(false);
            load();
        } catch {
            setError("Failed to save supplier.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this supplier? This cannot be undone.")) return;
        try {
            await deleteSupplier(id);
            load();
        } catch {
            setError("Failed to delete supplier.");
        }
    };

    const filteredSuppliers = suppliers.filter((s) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            s.name.toLowerCase().includes(term) ||
            (s.contact_name?.toLowerCase().includes(term) ?? false) ||
            (s.contact_email?.toLowerCase().includes(term) ?? false)
        );
    });

    const activeCount = suppliers.filter((s) => s.is_active).length;
    const avgLeadTime = suppliers.length
        ? Math.round(suppliers.reduce((acc, s) => acc + s.lead_time_days, 0) / suppliers.length)
        : 0;

    const [importModalOpen, setImportModalOpen] = useState(false);
    const [exporting, setExporting] = useState(false);

    const handleExportCsv = async () => {
        setExporting(true);
        try {
            const blob = await exportSuppliersCsv();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `suppliers_export_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch {
            setError("Failed to export suppliers CSV.");
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="page-header">
                <div>
                    <h1>Suppliers</h1>
                    <p className="page-subtitle">Manage supplier master data for procurement and POs</p>
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
                                + Add Supplier
                            </button>
                        </>
                    )}
                </div>
            </div>

            <BulkImportModal
                isOpen={importModalOpen}
                onClose={() => setImportModalOpen(false)}
                title="Bulk Import Suppliers"
                templateType="suppliers"
                onImport={importSuppliersCsv}
                onSuccess={load}
                helperText="Upload CSV of supplier records. Matching existing name or ID will update the record."
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
            <section className="stats-grid" aria-label="Supplier statistics">
                <div className="stat-card stat-card--blue">
                    <div className="stat-card__icon" aria-hidden="true">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                        </svg>
                    </div>
                    <div className="stat-card__info">
                        <span className="stat-card__value">{suppliers.length}</span>
                        <span className="stat-card__label">Total Suppliers</span>
                    </div>
                </div>

                <div className="stat-card stat-card--green">
                    <div className="stat-card__icon" aria-hidden="true">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>
                    <div className="stat-card__info">
                        <span className="stat-card__value">{activeCount}</span>
                        <span className="stat-card__label">Active Partners</span>
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
                        <span className="stat-card__value">{avgLeadTime}d</span>
                        <span className="stat-card__label">Avg Lead Time</span>
                    </div>
                </div>
            </section>

            {/* Filter bar */}
            <div className="filter-bar">
                <input
                    type="search"
                    className="search-input"
                    placeholder="Search by company, contact, or email…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <span className="text-xs text-muted">
                    Showing {filteredSuppliers.length} of {suppliers.length} suppliers
                </span>
            </div>

            {loading ? (
                <div className="page-loading">Loading suppliers…</div>
            ) : (
                <section className="table-section">
                    <div className="table-section__header">
                        <h2>All Suppliers ({filteredSuppliers.length})</h2>
                    </div>

                    {filteredSuppliers.length === 0 ? (
                        <p className="empty-state">
                            {searchTerm ? "No suppliers match your search." : "No suppliers registered yet."}
                        </p>
                    ) : (
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Contact</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Lead Time</th>
                                        <th>Status</th>
                                        {canWrite && <th>Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSuppliers.map((s) => (
                                        <tr key={s.id}>
                                            <td className="td-bold">{s.name}</td>
                                            <td>{s.contact_name ?? <span className="text-muted">—</span>}</td>
                                            <td>{s.contact_email ?? <span className="text-muted">—</span>}</td>
                                            <td>{s.contact_phone ?? <span className="text-muted">—</span>}</td>
                                            <td>{s.lead_time_days} days</td>
                                            <td>
                                                <span className={`badge ${s.is_active ? "badge--active" : "badge--inactive"}`}>
                                                    {s.is_active ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            {canWrite && (
                                                <td>
                                                    <div className="action-btns">
                                                        <button
                                                            className="btn btn--secondary btn--sm"
                                                            onClick={() => openEdit(s)}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            className="btn btn--danger btn--sm"
                                                            onClick={() => handleDelete(s.id)}
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
            )}

            {/* Create / Edit Modal */}
            {modalOpen && (
                <div className="modal-overlay" onClick={() => setModalOpen(false)}>
                    <div
                        className="modal"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-label={modalMode === "create" ? "Add Supplier" : "Edit Supplier"}
                    >
                        <div className="modal__header">
                            <h2>{modalMode === "create" ? "Add Supplier" : "Edit Supplier"}</h2>
                            <button
                                className="modal__close"
                                onClick={() => setModalOpen(false)}
                                aria-label="Close dialog"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="modal__form">
                            <div className="form-group">
                                <label>Company Name *</label>
                                <input
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    required
                                    maxLength={255}
                                    placeholder="e.g., Daikin Philippines"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Contact Person</label>
                                    <input
                                        value={form.contact_name}
                                        onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                                        maxLength={255}
                                        placeholder="Full name"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Contact Email</label>
                                    <input
                                        type="email"
                                        value={form.contact_email}
                                        onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                                        placeholder="name@company.com"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input
                                        value={form.contact_phone}
                                        onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                                        maxLength={50}
                                        placeholder="+63 917 123 4567"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Lead Time (days) *</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={form.lead_time_days}
                                        onChange={(e) =>
                                            setForm({ ...form, lead_time_days: parseInt(e.target.value, 10) || 0 })
                                        }
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Physical Address</label>
                                <textarea
                                    rows={2}
                                    value={form.address}
                                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                                    maxLength={1000}
                                    placeholder="Warehouse or office address"
                                />
                            </div>

                            <div className="modal__actions">
                                <button
                                    type="button"
                                    className="btn btn--secondary"
                                    onClick={() => setModalOpen(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn--primary" disabled={saving}>
                                    {saving ? "Saving…" : modalMode === "create" ? "Create Supplier" : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
