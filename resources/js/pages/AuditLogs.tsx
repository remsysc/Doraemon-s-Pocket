import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import {
    getAuditLogs,
    type AuditLog,
    type PaginatedResponse,
} from "../lib/inventory-api";

export default function AuditLogs() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [meta, setMeta] = useState<PaginatedResponse<AuditLog>["meta"] | null>(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, [page]);

    async function fetchLogs() {
        setLoading(true);
        try {
            const res = await getAuditLogs(page);
            setLogs(res.data.data);
            setMeta(res.data.meta);
        } catch {
            // empty table
        } finally {
            setLoading(false);
        }
    }

    return (
        <DashboardLayout>
            <div className="page-header">
                <div>
                    <h1>Audit Logs</h1>
                    <p className="page-subtitle">Complete audit trail of all system changes</p>
                </div>
            </div>

            {loading ? (
                <div className="page-loading">Loading audit logs…</div>
            ) : (
                <>
                    <section className="table-section">
                        {logs.length === 0 ? (
                            <p className="empty-state">No audit logs found.</p>
                        ) : (
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Action</th>
                                            <th>Resource Type</th>
                                            <th>Resource ID</th>
                                            <th>User</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.map((log) => (
                                            <tr key={log.id}>
                                                <td>
                                                    <span className="badge badge--adjustment">
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td className="td-bold">
                                                    {log.auditable_type.split("\\").pop()}
                                                </td>
                                                <td>
                                                    <code>{log.auditable_id}</code>
                                                </td>
                                                <td>{log.user?.name ?? "System"}</td>
                                                <td>
                                                    {new Date(log.created_at).toLocaleString()}
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
        </DashboardLayout>
    );
}
