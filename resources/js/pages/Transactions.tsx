import { useEffect, useState, type FormEvent } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { getCurrentUser, type AuthUser } from "../lib/api";
import {
    getTransactions,
    getLots,
    createTransaction,
    type InventoryTransaction,
    type Lot,
    type StoreTransactionPayload,
    type PaginatedResponse,
} from "../lib/inventory-api";

const TXN_TYPES = [
    "RECEIPT",
    "RESERVE",
    "PICK",
    "SALE",
    "ADJUSTMENT",
    "WRITE_OFF",
] as const;

export default function Transactions() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
    const [meta, setMeta] = useState<PaginatedResponse<InventoryTransaction>["meta"] | null>(null);
    const [lots, setLots] = useState<Lot[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formError, setFormError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Form fields
    const [formLotId, setFormLotId] = useState("");
    const [formType, setFormType] = useState<(typeof TXN_TYPES)[number]>("RECEIPT");
    const [formQtyDelta, setFormQtyDelta] = useState("");
    const [formOccuredAt, setFormOccuredAt] = useState("");

    useEffect(() => {
        getCurrentUser().then((res) => setUser(res.data));
        getLots(1, 100).then((res) => setLots(res.data.data));
    }, []);

    useEffect(() => {
        fetchTransactions();
    }, [page]);

    async function fetchTransactions() {
        setLoading(true);
        try {
            const res = await getTransactions(page);
            setTransactions(res.data.data);
            setMeta(res.data.meta);
        } catch {
            // empty table
        } finally {
            setLoading(false);
        }
    }

    const canWrite = user?.role === "admin" || user?.role === "warehouse_staff";

    function openForm() {
        setFormLotId(lots[0]?.lot_id ?? "");
        setFormType("RECEIPT");
        setFormQtyDelta("");
        setFormOccuredAt(new Date().toISOString().slice(0, 16));
        setFormError("");
        setShowForm(true);
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setFormError("");
        setSubmitting(true);

        const qty = parseInt(formQtyDelta, 10);
        if (isNaN(qty) || qty === 0) {
            setFormError("Quantity delta must be a non-zero integer.");
            setSubmitting(false);
            return;
        }

        try {
            const payload: StoreTransactionPayload = {
                lot_id: formLotId,
                txn_type: formType,
                qty_delta: qty,
                occurred_at: formOccuredAt,
            };
            await createTransaction(payload);
            setShowForm(false);
            fetchTransactions();
        } catch (err: any) {
            if (err?.response?.status === 422) {
                const errors = err.response.data.errors;
                const first = Object.values(errors)[0] as string[];
                setFormError(first?.[0] ?? "Validation failed.");
            } else if (err?.response?.status === 403) {
                setFormError("You are not authorized to create transactions.");
            } else {
                setFormError("An error occurred. Please try again.");
            }
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <DashboardLayout>
            <div className="page-header">
                <div>
                    <h1>Inventory Transactions</h1>
                    <p className="page-subtitle">
                        Append-only ledger of stock movements
                    </p>
                </div>
                {canWrite && (
                    <button className="btn btn--primary" onClick={openForm}>
                        + Record Transaction
                    </button>
                )}
            </div>

            {loading ? (
                <div className="page-loading">Loading transactions…</div>
            ) : (
                <>
                    <section className="table-section">
                        {transactions.length === 0 ? (
                            <p className="empty-state">No transactions recorded yet.</p>
                        ) : (
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Type</th>
                                            <th>Qty Delta</th>
                                            <th>Product</th>
                                            <th>Lot (Bin)</th>
                                            <th>Actor</th>
                                            <th>Occurred At</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.map((txn) => (
                                            <tr key={txn.id}>
                                                <td>
                                                    <span className={`badge badge--${txn.type.toLowerCase()}`}>
                                                        {txn.type}
                                                    </span>
                                                </td>
                                                <td className={txn.quantity_delta >= 0 ? "text-green" : "text-red"}>
                                                    {txn.quantity_delta >= 0 ? "+" : ""}
                                                    {txn.quantity_delta}
                                                </td>
                                                <td>{txn.lot?.product?.name ?? "—"}</td>
                                                <td>{txn.lot?.bin_location ?? "—"}</td>
                                                <td>{txn.actor?.name ?? "—"}</td>
                                                <td>
                                                    {new Date(txn.occurred_at).toLocaleString()}
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

            {/* Create Transaction Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal__header">
                            <h2>Record Transaction</h2>
                            <button className="modal__close" onClick={() => setShowForm(false)}>
                                ×
                            </button>
                        </div>

                        {formError && <div className="form-error">{formError}</div>}

                        <form className="modal__form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="txn-lot">Lot</label>
                                <select
                                    id="txn-lot"
                                    value={formLotId}
                                    onChange={(e) => setFormLotId(e.target.value)}
                                    required
                                >
                                    <option value="">Select lot</option>
                                    {lots.map((lot) => (
                                        <option key={lot.lot_id} value={lot.lot_id}>
                                            {lot.product?.name ?? lot.sku_id} — {lot.bin_location ?? "No bin"}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="txn-type">Transaction Type</label>
                                <select
                                    id="txn-type"
                                    value={formType}
                                    onChange={(e) => setFormType(e.target.value as typeof formType)}
                                    required
                                >
                                    {TXN_TYPES.map((t) => (
                                        <option key={t} value={t}>
                                            {t}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="txn-qty">Quantity Delta</label>
                                <input
                                    id="txn-qty"
                                    type="number"
                                    value={formQtyDelta}
                                    onChange={(e) => setFormQtyDelta(e.target.value)}
                                    required
                                    placeholder="e.g. 10 or -5"
                                />
                                <small className="form-hint">
                                    Positive for inbound (RECEIPT), negative for outbound (SALE, PICK, etc.)
                                </small>
                            </div>

                            <div className="form-group">
                                <label htmlFor="txn-date">Occurred At</label>
                                <input
                                    id="txn-date"
                                    type="datetime-local"
                                    value={formOccuredAt}
                                    onChange={(e) => setFormOccuredAt(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="modal__actions">
                                <button
                                    type="button"
                                    className="btn btn--secondary"
                                    onClick={() => setShowForm(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn--primary" disabled={submitting}>
                                    {submitting ? "Recording…" : "Record Transaction"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
