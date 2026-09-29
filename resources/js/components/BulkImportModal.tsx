import { useState, useRef, type ChangeEvent, type FormEvent, type DragEvent } from "react";
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

    if (!isOpen) return null;

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
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

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files?.[0]) {
            const dropped = e.dataTransfer.files[0];
            if (dropped.name.endsWith(".csv") || dropped.type.includes("csv") || dropped.type === "text/plain") {
                setFile(dropped);
                setError(null);
                setResult(null);
            } else {
                setError("Please select a valid .csv file.");
            }
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
        <div className="modal-backdrop fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div
                className="analytics-card bg-[var(--wb-surface-1)] border border-[var(--wb-border-strong)] rounded-xl w-full max-w-lg shadow-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                {/* Modal Header */}
                <div className="analytics-card__header flex items-center justify-between p-4 sm:p-5 border-b border-[var(--wb-border)] shrink-0">
                    <div>
                        <h2 id="modal-title" className="text-sm sm:text-base font-semibold text-[var(--wb-text-primary)]">
                            {title}
                        </h2>
                        {helperText && (
                            <p className="text-[11px] sm:text-xs text-[var(--wb-text-secondary)] mt-0.5">{helperText}</p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-[var(--wb-text-muted)] hover:text-[var(--wb-text-primary)] text-lg leading-none p-1.5 rounded touch-manipulation"
                        aria-label="Close modal"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
                    {/* Template download link */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs">
                        <span className="text-[var(--wb-text-secondary)]">Format: UTF-8 Encoded CSV</span>
                        <button
                            type="button"
                            onClick={handleDownloadTemplate}
                            disabled={downloadingTemplate}
                            className="text-[var(--wb-accent)] hover:underline inline-flex items-center gap-1 font-medium self-start sm:self-auto touch-manipulation"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="12" y1="18" x2="12" y2="12" />
                                <line x1="9" y1="15" x2="15" y2="15" />
                            </svg>
                            <span>{downloadingTemplate ? "Downloading..." : "Sample Template"}</span>
                        </button>
                    </div>

                    {/* Dropzone */}
                    <div
                        onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                        onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                        onDrop={handleDrop}
                        onClick={() => inputRef.current?.click()}
                        className={`border-2 border-dashed rounded-lg p-4 sm:p-5 text-center cursor-pointer transition-colors ${
                            dragActive
                                ? "border-[var(--wb-accent)] bg-[var(--wb-accent-muted)]"
                                : "border-[var(--wb-border)] hover:border-[var(--wb-border-strong)] bg-[var(--wb-surface-2)]"
                        }`}
                    >
                        <input
                            ref={inputRef}
                            type="file"
                            accept=".csv,text/csv"
                            className="hidden"
                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                if (e.target.files?.[0]) {
                                    setFile(e.target.files[0]);
                                    setError(null);
                                    setResult(null);
                                }
                            }}
                        />
                        <div className="flex flex-col items-center justify-center space-y-1">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--wb-text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            {file ? (
                                <div className="text-xs sm:text-sm font-medium text-[var(--wb-text-primary)] break-all">
                                    {file.name}{" "}
                                    <span className="text-[11px] text-[var(--wb-text-secondary)]">({formatBytes(file.size)})</span>
                                </div>
                            ) : (
                                <>
                                    <p className="text-xs font-medium text-[var(--wb-text-primary)]">
                                        Tap to browse or drop .csv file here
                                    </p>
                                    <p className="text-[11px] text-[var(--wb-text-muted)]">Max file size: 10MB</p>
                                </>
                            )}
                        </div>
                    </div>

                    {file && (
                        <div className="flex items-center justify-between text-xs pt-1">
                            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={dryRun}
                                    onChange={(e) => setDryRun(e.target.checked)}
                                    className="rounded border-[var(--wb-border)] text-[var(--wb-accent)] focus:ring-[var(--wb-accent)]"
                                />
                                <span className="text-[var(--wb-text-primary)] font-medium text-[11px] sm:text-xs">
                                    Dry Run (Preview validation only)
                                </span>
                            </label>
                            <button
                                type="button"
                                onClick={() => {
                                    setFile(null);
                                    setResult(null);
                                    if (inputRef.current) inputRef.current.value = "";
                                }}
                                className="text-xs text-[var(--wb-danger)] hover:underline"
                            >
                                Clear
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 text-xs bg-[var(--wb-danger-muted)] border border-[var(--wb-danger)] text-[var(--wb-danger)] rounded-lg">
                            {error}
                        </div>
                    )}

                    {result && (
                        <div className="space-y-2">
                            <div
                                className={`p-3 text-xs rounded-lg border ${
                                    result.errors && result.errors.length > 0
                                        ? "bg-[var(--wb-danger-muted)] border-[var(--wb-danger)] text-[var(--wb-danger)]"
                                        : result.dry_run
                                        ? "bg-[var(--wb-accent-muted)] border-[var(--wb-accent)] text-[var(--wb-accent)]"
                                        : "bg-[var(--wb-success-muted)] border-[var(--wb-success)] text-[var(--wb-success)]"
                                }`}
                            >
                                <div className="font-semibold">{result.message}</div>
                                {result.dry_run && result.errors.length === 0 && (
                                    <div className="mt-1 text-[11px] text-[var(--wb-text-secondary)]">
                                        ✓ Pre-flight validation passed. Uncheck "Dry Run" and click Commit Import to persist.
                                    </div>
                                )}
                            </div>

                            {result.errors && result.errors.length > 0 && (
                                <div className="max-h-32 overflow-y-auto p-2 bg-[var(--wb-surface-2)] border border-[var(--wb-border)] rounded-md space-y-1">
                                    <div className="text-[11px] font-semibold text-[var(--wb-danger)]">
                                        Validation Errors ({result.errors.length}):
                                    </div>
                                    {result.errors.map((err, i) => (
                                        <div key={i} className="text-[11px] font-mono text-[var(--wb-text-secondary)] break-words">
                                            • {err}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Modal Footer Actions - mobile-friendly stack */}
                    <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-3 border-t border-[var(--wb-border)] shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn--secondary btn--sm w-full sm:w-auto justify-center"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!file || loading}
                            className={`btn btn--sm w-full sm:w-auto justify-center ${dryRun ? "btn--secondary" : "btn--primary"}`}
                        >
                            {loading ? (
                                <span className="inline-flex items-center gap-1.5">
                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                                    <span>Processing...</span>
                                </span>
                            ) : (
                                <span>{dryRun ? "Run Validation Preview" : "Commit Import"}</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
