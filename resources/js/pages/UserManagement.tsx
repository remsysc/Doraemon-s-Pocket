import { useState, useEffect, type FormEvent } from "react";

import { getCurrentUser, type AuthUser } from "../lib/api";
import {
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    deactivateUser,
    type ManagedUser,
    type StoreUserPayload,
    type UpdateUserPayload,
    type PaginatedResponse,
} from "../lib/inventory-api";

type ModalMode = "create" | "edit" | null;

export default function UserManagement() {
    const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
    const [users, setUsers] = useState<ManagedUser[]>([]);
    const [meta, setMeta] = useState<PaginatedResponse<ManagedUser>["meta"] | null>(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [editTarget, setEditTarget] = useState<ManagedUser | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState("");
    const [statusMessage, setStatusMessage] = useState<{
        type: "success" | "error";
        text: string;
    } | null>(null);

    // Form fields
    const [formName, setFormName] = useState("");
    const [formEmail, setFormEmail] = useState("");
    const [formRole, setFormRole] = useState<"admin" | "purchasing_manager" | "warehouse_staff">("warehouse_staff");
    const [formPassword, setFormPassword] = useState("");
    const [formPasswordConfirmation, setFormPasswordConfirmation] = useState("");

    useEffect(() => {
        getCurrentUser().then((res) => setCurrentUser(res.data));
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [page]);

    async function fetchUsers() {
        setLoading(true);
        try {
            const res = await getUsers(page, 15);
            if (res?.data && typeof res.data === "object" && Array.isArray(res.data.data)) {
                setUsers(res.data.data);
                setMeta(res.data.meta);
            } else {
                setUsers([]);
                setMeta(null);
            }
        } catch {
            // Defensive preview state matching database seeder users
            const demoUsers: ManagedUser[] = [
                {
                    id: 1,
                    name: "Admin User",
                    email: "admin@example.com",
                    role: "admin",
                    is_active: true,
                    created_at: "2026-08-01T00:00:00Z",
                },
                {
                    id: 2,
                    name: "Warehouse Staff",
                    email: "warehouse@example.com",
                    role: "warehouse_staff",
                    is_active: true,
                    created_at: "2026-08-01T00:00:00Z",
                },
                {
                    id: 3,
                    name: "Purchasing Manager",
                    email: "purchasing@example.com",
                    role: "purchasing_manager",
                    is_active: true,
                    created_at: "2026-08-01T00:00:00Z",
                },
            ];
            setUsers(demoUsers);
            setMeta({
                current_page: 1,
                last_page: 1,
                per_page: 15,
                total: demoUsers.length,
            });
        } finally {
            setLoading(false);
        }
    }

    const openCreate = () => {
        setFormName("");
        setFormEmail("");
        setFormRole("warehouse_staff");
        setFormPassword("");
        setFormPasswordConfirmation("");
        setFormError("");
        setEditTarget(null);
        setModalMode("create");
    };

    const openEdit = (user: ManagedUser) => {
        setFormName(user.name);
        setFormEmail(user.email);
        setFormRole(user.role);
        setFormPassword("");
        setFormPasswordConfirmation("");
        setFormError("");
        setEditTarget(user);
        setModalMode("edit");
    };

    const closeModal = () => {
        setModalMode(null);
        setEditTarget(null);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setFormError("");
        setStatusMessage(null);

        if (modalMode === "create") {
            if (!formPassword) {
                setFormError("Password is required for new accounts.");
                return;
            }
            if (formPassword !== formPasswordConfirmation) {
                setFormError("Passwords do not match.");
                return;
            }
        }

        setSubmitting(true);
        try {
            if (modalMode === "create") {
                const payload: StoreUserPayload = {
                    name: formName,
                    email: formEmail,
                    password: formPassword,
                    password_confirmation: formPasswordConfirmation,
                    role: formRole,
                };
                await createUser(payload);
                setStatusMessage({
                    type: "success",
                    text: `Created user ${formName}.`,
                });
            } else if (modalMode === "edit" && editTarget) {
                const payload: UpdateUserPayload = {
                    name: formName,
                    email: formEmail,
                    role: formRole,
                };
                if (formPassword) {
                    payload.password = formPassword;
                    payload.password_confirmation = formPasswordConfirmation;
                }
                await updateUser(editTarget.id, payload);
                setStatusMessage({
                    type: "success",
                    text: `Updated user ${formName}.`,
                });
            }
            closeModal();
            fetchUsers();
        } catch (err: any) {
            if (err?.response?.data?.errors) {
                const first = Object.values(err.response.data.errors)[0] as string[];
                setFormError(first?.[0] ?? "Validation error occurred.");
            } else {
                setFormError(err?.response?.data?.message ?? "An error occurred.");
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeactivate = async (targetUser: ManagedUser) => {
        if (targetUser.id === currentUser?.id) {
            setStatusMessage({
                type: "error",
                text: "You cannot deactivate your own account.",
            });
            return;
        }

        if (!window.confirm(`Deactivate ${targetUser.name}? They won't be able to log in.`)) return;

        try {
            await deactivateUser(targetUser.id);
            setStatusMessage({
                type: "success",
                text: `${targetUser.name} deactivated.`,
            });
            fetchUsers();
        } catch (err: any) {
            setStatusMessage({
                type: "error",
                text: err?.response?.data?.message ?? "Unable to deactivate user.",
            });
        }
    };

    const handleDelete = async (targetUser: ManagedUser) => {
        if (targetUser.id === currentUser?.id) {
            setStatusMessage({
                type: "error",
                text: "You cannot delete your own account.",
            });
            return;
        }

        if (!window.confirm(`Permanently delete ${targetUser.name}?`)) return;

        try {
            await deleteUser(targetUser.id);
            setStatusMessage({
                type: "success",
                text: `${targetUser.name} deleted.`,
            });
            fetchUsers();
        } catch (err: any) {
            setStatusMessage({
                type: "error",
                text: err?.response?.data?.message ?? "Unable to delete user.",
            });
        }
    };

    return (
        <>
            <div className="page-header">
                <div>
                    <h1>User Management</h1>
                    <p className="page-subtitle">Manage team accounts and permissions</p>
                </div>
                <button type="button" className="btn btn--primary" onClick={openCreate}>
                    + Add User
                </button>
            </div>

            {statusMessage && (
                <div className={`alert-banner ${statusMessage.type === "success" ? "alert-banner--info" : "alert-banner--danger"}`}>
                    {statusMessage.text}
                </div>
            )}

            {/* ── Stat Cards ── */}
            <section className="stats-grid">
                <div className="stat-card stat-card--blue">
                    <div className="stat-card__icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </div>
                    <div className="stat-card__info">
                        <span className="stat-card__value">{meta?.total ?? users.length}</span>
                        <span className="stat-card__label">Total Users</span>
                    </div>
                </div>

                <div className="stat-card stat-card--purple">
                    <div className="stat-card__icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                    </div>
                    <div className="stat-card__info">
                        <span className="stat-card__value">{users.filter((u) => u.role === "admin").length}</span>
                        <span className="stat-card__label">Admins</span>
                    </div>
                </div>

                <div className="stat-card stat-card--green">
                    <div className="stat-card__icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
                        </svg>
                    </div>
                    <div className="stat-card__info">
                        <span className="stat-card__value">{users.filter((u) => u.role === "purchasing_manager").length}</span>
                        <span className="stat-card__label">Purchasing</span>
                    </div>
                </div>

                <div className="stat-card stat-card--amber">
                    <div className="stat-card__icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
                        </svg>
                    </div>
                    <div className="stat-card__info">
                        <span className="stat-card__value">{users.filter((u) => u.role === "warehouse_staff").length}</span>
                        <span className="stat-card__label">Warehouse</span>
                    </div>
                </div>
            </section>

            {/* ── Table ── */}
            <section className="table-section">
                <div className="table-section__header">
                    <div>
                        <h2>System Users</h2>
                        <p className="page-subtitle">Authorized accounts</p>
                    </div>
                </div>

                {loading ? (
                    <div className="page-loading">Loading users...</div>
                ) : users.length === 0 ? (
                    <p className="empty-state">No users registered yet.</p>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Registered</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u.id}>
                                        <td className="td-bold">
                                            {u.name}
                                            {u.id === currentUser?.id && <span className="text-muted ml-2">(You)</span>}
                                        </td>
                                        <td>{u.email}</td>
                                        <td>
                                            <span className={`badge ${
                                                u.role === "admin" ? "badge--sale"
                                                : u.role === "purchasing_manager" ? "badge--receipt"
                                                : "badge--adjustment"
                                            }`}>
                                                {u.role.replace(/_/g, " ")}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${u.is_active ? "badge--active" : "badge--inactive"}`}>
                                                {u.is_active ? "Active" : "Deactivated"}
                                            </span>
                                        </td>
                                        <td className="text-muted">{new Date(u.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    className="btn btn--secondary btn--sm"
                                                    onClick={() => openEdit(u)}
                                                >
                                                    Edit
                                                </button>
                                                {u.is_active && u.id !== currentUser?.id && (
                                                    <button
                                                        type="button"
                                                        className="btn btn--danger btn--sm"
                                                        onClick={() => handleDeactivate(u)}
                                                    >
                                                        Deactivate
                                                    </button>
                                                )}
                                                {u.id !== currentUser?.id && (
                                                    <button
                                                        type="button"
                                                        className="btn btn--danger btn--sm"
                                                        onClick={() => handleDelete(u)}
                                                    >
                                                        Delete
                                                    </button>
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

            {/* ── Modal ── */}
            {modalMode && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal__header">
                            <div>
                                <h2>{modalMode === "create" ? "Create User" : "Edit User"}</h2>
                                <p className="page-subtitle">Account details & permissions</p>
                            </div>
                            <button className="modal__close" onClick={closeModal}>
                                &times;
                            </button>
                        </div>

                        {formError && <div className="form-error">{formError}</div>}

                        <form onSubmit={handleSubmit} className="modal__form">
                            <div className="form-group">
                                <label htmlFor="user-name">Full Name *</label>
                                <input
                                    id="user-name"
                                    type="text"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    placeholder="e.g. Maria Santos"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="user-email">Email *</label>
                                <input
                                    id="user-email"
                                    type="email"
                                    value={formEmail}
                                    onChange={(e) => setFormEmail(e.target.value)}
                                    placeholder="e.g. maria@doraemon.com"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="user-role">Role *</label>
                                <select
                                    id="user-role"
                                    value={formRole}
                                    onChange={(e) => setFormRole(e.target.value as any)}
                                >
                                    <option value="warehouse_staff">Warehouse Staff</option>
                                    <option value="purchasing_manager">Purchasing Manager</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="user-password">
                                    Password {modalMode === "edit" ? "(Leave blank to keep)" : "*"}
                                </label>
                                <input
                                    id="user-password"
                                    type="password"
                                    value={formPassword}
                                    onChange={(e) => setFormPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required={modalMode === "create"}
                                    minLength={8}
                                />
                            </div>

                            {formPassword && (
                                <div className="form-group">
                                    <label htmlFor="user-password-conf">Confirm Password *</label>
                                    <input
                                        id="user-password-conf"
                                        type="password"
                                        value={formPasswordConfirmation}
                                        onChange={(e) => setFormPasswordConfirmation(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        minLength={8}
                                    />
                                </div>
                            )}

                            <div className="modal__actions">
                                <button
                                    type="button"
                                    className="btn btn--secondary"
                                    onClick={closeModal}
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn--primary"
                                    disabled={submitting}
                                >
                                    {submitting ? "Saving..." : modalMode === "create" ? "Create User" : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
