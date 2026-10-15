import { useState, useRef, type ChangeEvent, type FormEvent, type DragEvent } from "react";
import Modal from "./Modal";
import { downloadSampleTemplate, type ImportDataResponse } from "../lib/inventory-api";

interface BulkImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    templateType: string;
    onImport: (file: File, dryRun: boolean) => Promise<ImportDataResponse>;
    onSuccess?: () => void;
    helperText?: string;
}

export default function BulkImportModal({
    isOpen,
    onClose,
    title,
    templateType,
    onImport,
    onSuccess,
    helperText,
}: BulkImportModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [dryRun, setDryRun] = useState(true);
    const [loading, setLoading] = useState(false);
    const [downloadingTemplate, setDownloadingTemplate] = useState(false);
    const [result, setResult] = useState<ImportDataResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    const handleReset = () => {
        setFile(null);
        setResult(null);
        setError(null);
        setDryRun(true);
        if (inputRef.current) inputRef.current.value = "";
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    async function handleDownloadTemplate() {
        setDownloadingTemplate(true);
        setError(null);
        try {
            const blob = await downloadSampleTemplate(templateType);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `sample_${templateType}_template.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to download sample template.");
        } finally {
            setDownloadingTemplate(false);
        }
    }

    const processSelectedFile = (selected: File) => {
        if (selected.name.endsWith(".csv") || selected.type.includes("csv") || selected.type === "text/plain") {
            setFile(selected);
            setError(null);
            setResult(null);
        } else {
            setError("Please select a valid CSV (.csv) file.");
        }
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files?.[0]) {
            processSelectedFile(e.dataTransfer.files[0]);
        }
    };

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!file) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await onImport(file, dryRun);
            setResult(res);
            if (!dryRun && res.errors.length === 0) {
                setFile(null);
                if (inputRef.current) inputRef.current.value = "";
                if (onSuccess) onSuccess();
            }
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Bulk import failed.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={loading ? () => {} : handleClose}
            title={title}
            subtitle={helperText}
            size="wide"
        >
            <form onSubmit={handleSubmit} className="modal__form space-y-4">
                {/* Format specs and Template download strip */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg bg-[var(--wb-surface-2)] border border-[var(--wb-border)]">
                    <div className="flex items-center gap-2">
                        <span className="badge badge--pill text-[10px] bg-[var(--wb-surface-1)] text-[var(--wb-text-secondary)] border border-[var(--wb-border)] font-semibold px-2 py-0.5">
                            CSV
                        </span>
                        <span className="text-xs text-[var(--wb-text-secondary)]">
                            UTF-8 encoded table • Up to 10MB
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={handleDownloadTemplate}
                        disabled={downloadingTemplate}
                        className="inline-flex items-center gap-1.5 text-xs text-[var(--wb-accent)] hover:text-[var(--wb-accent-hover)] font-medium transition-colors self-start sm:self-auto touch-manipulation cursor-pointer disabled:opacity-50"
                    >
                        {downloadingTemplate ? (
                            <>
                                <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                </svg>
                                <span>Downloading...</span>
                            </>
                        ) : (
                            <>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                <span>Download Sample Template</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Hidden native input */}
                <input
                    ref={inputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    tabIndex={-1}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        if (e.target.files?.[0]) {
                            processSelectedFile(e.target.files[0]);
                        }
                    }}
                />

                {/* Dropzone or File Card */}
                {!file ? (
                    <div
                        onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                        onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                        onDrop={handleDrop}
                        onClick={() => inputRef.current?.click()}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                inputRef.current?.click();
                            }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-label="Upload CSV file"
                        className={`group relative border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-150 flex flex-col items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-[var(--wb-accent)] ${
                            dragActive
                                ? "border-[var(--wb-accent)] bg-[var(--wb-accent-muted)] scale-[1.01]"
                                : "border-[var(--wb-border-strong)] hover:border-[var(--wb-accent)] bg-[var(--wb-surface-2)]/60 hover:bg-[var(--wb-surface-2)]"
                        }`}
                    >
                        <div className="w-12 h-12 rounded-full bg-[var(--wb-surface-1)] border border-[var(--wb-border)] flex items-center justify-center text-[var(--wb-accent)] shadow-sm mb-3 group-hover:scale-110 transition-transform">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                        </div>
                        <p className="text-sm font-semibold text-[var(--wb-text-primary)]">
                            Drag & drop your CSV file here
                        </p>
                        <p className="text-xs text-[var(--wb-text-secondary)] mt-1">
                            or <span className="text-[var(--wb-accent)] font-medium underline-offset-2 hover:underline">browse files</span> from your computer
                        </p>
                    </div>
                ) : (
                    <div className="p-4 rounded-xl border border-[var(--wb-border-strong)] bg-[var(--wb-surface-2)] flex items-center justify-between gap-3 animate-in fade-in duration-150">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-lg bg-[var(--wb-accent-muted)] border border-[var(--wb-accent-muted-border)] text-[var(--wb-accent)] flex flex-col items-center justify-center shrink-0">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                </svg>
                                <span className="text-[8px] font-bold tracking-tight uppercase">CSV</span>
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-semibold text-[var(--wb-text-primary)] truncate" title={file.name}>
                                    {file.name}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[var(--wb-text-secondary)]">
                                    <span>{formatBytes(file.size)}</span>
                                    <span>•</span>
                                    <span className="text-[var(--wb-success)] font-medium inline-flex items-center gap-1">
                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                        Ready
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                            <button
                                type="button"
                                onClick={() => inputRef.current?.click()}
                                className="btn btn--secondary btn--sm"
                                title="Choose a different file"
                            >
                                Change
                            </button>
                            <button
                                type="button"
                                onClick={handleReset}
                                className="btn btn--danger btn--sm px-2"
                                title="Remove file"
                                aria-label="Remove file"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}

                {/* Import Option: Dry Run Checkbox Card */}
                {file && (
                    <div className="p-3.5 rounded-xl border border-[var(--wb-border)] bg-[var(--wb-surface-2)] flex items-start gap-3">
                        <input
                            type="checkbox"
                            id="dry-run-checkbox"
                            checked={dryRun}
                            onChange={(e) => setDryRun(e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-[var(--wb-border-strong)] text-[var(--wb-accent)] focus:ring-[var(--wb-accent)] cursor-pointer"
                        />
                        <div className="flex-1">
                            <label htmlFor="dry-run-checkbox" className="text-xs font-semibold text-[var(--wb-text-primary)] cursor-pointer select-none block">
                                Dry Run Validation (Preview Only)
                            </label>
                            <p className="text-[11px] text-[var(--wb-text-secondary)] mt-0.5 select-none leading-relaxed">
                                {dryRun
                                    ? "Simulates the import process to verify headers, schema, and rows without making changes to the database."
                                    : "Live commit mode: Validated rows will be committed directly to the database in an atomic transaction."}
                            </p>
                        </div>
                    </div>
                )}

                {/* Error Banner */}
                {error && (
                    <div className="p-3.5 text-xs bg-[var(--wb-danger-muted)] border border-[var(--wb-danger)] text-[var(--wb-danger)] rounded-xl flex items-start gap-2.5">
                        <svg className="shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span className="font-medium leading-relaxed">{error}</span>
                    </div>
                )}

                {/* Result Feedback */}
                {result && (
                    <div className="space-y-2.5">
                        <div
                            className={`p-3.5 text-xs rounded-xl border ${
                                result.errors && result.errors.length > 0
                                    ? "bg-[var(--wb-danger-muted)] border-[var(--wb-danger)] text-[var(--wb-danger)]"
                                    : result.dry_run
                                    ? "bg-[var(--wb-accent-muted)] border-[var(--wb-accent)] text-[var(--wb-accent)]"
                                    : "bg-[var(--wb-success-muted)] border-[var(--wb-success)] text-[var(--wb-success)]"
                            }`}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 font-semibold">
                                    {result.errors && result.errors.length > 0 ? (
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="12" y1="8" x2="12" y2="12" />
                                            <line x1="12" y1="16" x2="12.01" y2="16" />
                                        </svg>
                                    ) : (
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    )}
                                    <span>{result.message}</span>
                                </div>
                                {result.errors && result.errors.length > 0 && (
                                    <span className="badge badge--pill badge--danger text-[10px]">
                                        {result.errors.length} {result.errors.length === 1 ? "Error" : "Errors"}
                                    </span>
                                )}
                            </div>

                            {result.dry_run && result.errors.length === 0 && (
                                <div className="mt-2 pt-2 border-t border-[var(--wb-accent-muted-border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                    <span className="text-[11px] text-[var(--wb-text-secondary)]">
                                        Validation checks passed. Ready to persist records.
                                    </span>
                                    {dryRun && (
                                        <button
                                            type="button"
                                            onClick={() => setDryRun(false)}
                                            className="btn btn--sm btn--primary inline-flex items-center gap-1.5 self-start sm:self-auto"
                                        >
                                            <span>Switch to Commit Import</span>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="5" y1="12" x2="19" y2="12" />
                                                <polyline points="12 5 19 12 12 19" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {result.errors && result.errors.length > 0 && (
                            <div className="max-h-36 overflow-y-auto p-3 bg-[var(--wb-surface-2)] border border-[var(--wb-border)] rounded-xl space-y-1.5">
                                <p className="text-[10px] font-semibold text-[var(--wb-text-muted)] uppercase tracking-wider">
                                    Validation Error Details
                                </p>
                                {result.errors.map((err, i) => (
                                    <div key={i} className="text-xs font-mono text-[var(--wb-text-secondary)] bg-[var(--wb-surface-1)] border border-[var(--wb-border)] p-2 rounded-lg break-words flex items-start gap-2">
                                        <span className="text-[var(--wb-danger)] shrink-0">•</span>
                                        <span>{err}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Modal Footer Actions */}
                <div className="modal__actions flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-3 border-t border-[var(--wb-border)]">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={loading}
                        className="btn btn--secondary w-full sm:w-auto justify-center"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!file || loading}
                        className={`btn w-full sm:w-auto justify-center ${
                            !dryRun && file ? "btn--primary" : "btn--secondary"
                        }`}
                    >
                        {loading ? (
                            <span className="inline-flex items-center gap-2">
                                <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                </svg>
                                <span>{dryRun ? "Validating..." : "Importing..."}</span>
                            </span>
                        ) : !file ? (
                            <span>Select CSV File</span>
                        ) : dryRun ? (
                            <span className="inline-flex items-center gap-1.5">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                                <span>Run Validation Preview</span>
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <span>Commit Import</span>
                            </span>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
