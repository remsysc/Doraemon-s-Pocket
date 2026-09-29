import { useState, useRef, type ChangeEvent, type FormEvent, type DragEvent } from "react";
import {
    exportCategoriesCsv,
    exportProductsCsv,
    importCategoriesCsv,
    importProductsCsv,
    type ImportDataResponse,
} from "../lib/inventory-api";

export default function DataManagement() {
    // Categories state
    const [categoryFile, setCategoryFile] = useState<File | null>(null);
    const [categoryLoading, setCategoryLoading] = useState(false);
    const [categoryExporting, setCategoryExporting] = useState(false);
    const [categoryResult, setCategoryResult] = useState<ImportDataResponse | null>(null);
    const [categoryError, setCategoryError] = useState<string | null>(null);
    const [categoryDragActive, setCategoryDragActive] = useState(false);
    const categoryInputRef = useRef<HTMLInputElement>(null);

    // Products state
    const [productFile, setProductFile] = useState<File | null>(null);
    const [productLoading, setProductLoading] = useState(false);
    const [productExporting, setProductExporting] = useState(false);
    const [productResult, setProductResult] = useState<ImportDataResponse | null>(null);
    const [productError, setProductError] = useState<string | null>(null);
    const [productDragActive, setProductDragActive] = useState(false);
    const productInputRef = useRef<HTMLInputElement>(null);

    // Optional Schema Guide state
    const [showSchemaGuide, setShowSchemaGuide] = useState(false);

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    async function handleExportCategories() {
        setCategoryExporting(true);
        setCategoryError(null);
        try {
            const blob = await exportCategoriesCsv();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `categories_export_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err: unknown) {
            setCategoryError(err instanceof Error ? err.message : "Export failed.");
        } finally {
            setCategoryExporting(false);
        }
    }

    async function handleExportProducts() {
        setProductExporting(true);
        setProductError(null);
        try {
            const blob = await exportProductsCsv();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `products_export_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err: unknown) {
            setProductError(err instanceof Error ? err.message : "Export failed.");
        } finally {
            setProductExporting(false);
        }
    }

    const handleCategoryDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setCategoryDragActive(false);
        if (e.dataTransfer.files?.[0]) {
            const file = e.dataTransfer.files[0];
            if (file.name.endsWith(".csv") || file.type.includes("csv") || file.type === "text/plain") {
                setCategoryFile(file);
                setCategoryError(null);
            } else {
                setCategoryError("Please select a .csv file.");
            }
        }
    };

    const handleProductDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setProductDragActive(false);
        if (e.dataTransfer.files?.[0]) {
            const file = e.dataTransfer.files[0];
            if (file.name.endsWith(".csv") || file.type.includes("csv") || file.type === "text/plain") {
                setProductFile(file);
                setProductError(null);
            } else {
                setProductError("Please select a .csv file.");
            }
        }
    };

    async function handleImportCategories(e: FormEvent) {
        e.preventDefault();
        if (!categoryFile) return;

        setCategoryLoading(true);
        setCategoryResult(null);
        setCategoryError(null);

        try {
            const res = await importCategoriesCsv(categoryFile);
            setCategoryResult(res);
            setCategoryFile(null);
            if (categoryInputRef.current) categoryInputRef.current.value = "";
        } catch (err: any) {
            setCategoryError(err.response?.data?.message || err.message || "Import failed.");
        } finally {
            setCategoryLoading(false);
        }
    }

    async function handleImportProducts(e: FormEvent) {
        e.preventDefault();
        if (!productFile) return;

        setProductLoading(true);
        setProductResult(null);
        setProductError(null);

        try {
            const res = await importProductsCsv(productFile);
            setProductResult(res);
            setProductFile(null);
            if (productInputRef.current) productInputRef.current.value = "";
        } catch (err: any) {
            setProductError(err.response?.data?.message || err.message || "Import failed.");
        } finally {
            setProductLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1>Data Management</h1>
                    <p className="page-subtitle">Export and bulk-import Categories and Products via CSV</p>
                </div>
                <button
                    type="button"
                    className="btn btn--secondary btn--sm"
                    onClick={() => setShowSchemaGuide(!showSchemaGuide)}
                >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    {showSchemaGuide ? "Hide Schema Guide" : "Schema Guide"}
                </button>
            </div>

            {/* Workstation Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Categories Card */}
                <div className="analytics-card">
                    <div className="analytics-card__header">
                        <div>
                            <h2>Categories</h2>
                            <p>Taxonomy and grouping master data</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleExportCategories}
                            disabled={categoryExporting}
                            className="btn btn--secondary btn--sm"
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            {categoryExporting ? "Exporting…" : "Export CSV"}
                        </button>
                    </div>

                    <div className="p-5 space-y-3">
                        <form onSubmit={handleImportCategories} className="space-y-3">
                            <input
                                ref={categoryInputRef}
                                id="cat-file"
                                type="file"
                                accept=".csv,text/csv,text/plain"
                                className="sr-only"
                                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                    setCategoryFile(e.target.files?.[0] || null);
                                    setCategoryError(null);
                                }}
                            />

                            {!categoryFile ? (
                                <div
                                    tabIndex={0}
                                    role="button"
                                    aria-label="Upload Category CSV"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            categoryInputRef.current?.click();
                                        }
                                    }}
                                    onClick={() => categoryInputRef.current?.click()}
                                    onDragOver={(e) => { e.preventDefault(); setCategoryDragActive(true); }}
                                    onDragLeave={() => setCategoryDragActive(false)}
                                    onDrop={handleCategoryDrop}
                                    className={`dropzone ${categoryDragActive ? "dropzone--active" : ""}`}
                                    style={{ padding: "16px 12px", gap: "4px" }}
                                >
                                    <div className="dropzone__icon" style={{ width: 32, height: 32, marginBottom: 0 }}>
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                            <polyline points="17 8 12 3 7 8" />
                                            <line x1="12" y1="3" x2="12" y2="15" />
                                        </svg>
                                    </div>
                                    <span className="dropzone__title" style={{ fontSize: "12.5px" }}>Choose CSV or drag & drop</span>
                                    <span className="dropzone__subtitle" style={{ fontSize: "11px" }}>Required header: name</span>
                                </div>
                            ) : (
                                <div className="file-preview" style={{ padding: "8px 12px" }}>
                                    <div className="file-preview__info">
                                        <span className="file-preview__name" style={{ fontSize: "12.5px" }}>{categoryFile.name}</span>
                                        <span className="file-preview__size">{formatBytes(categoryFile.size)}</span>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn--secondary btn--sm"
                                        style={{ padding: "2px 8px", fontSize: "11px" }}
                                        onClick={() => {
                                            setCategoryFile(null);
                                            if (categoryInputRef.current) categoryInputRef.current.value = "";
                                        }}
                                    >
                                        Remove
                                    </button>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={!categoryFile || categoryLoading}
                                className="btn btn--primary w-full"
                                aria-busy={categoryLoading}
                            >
                                {categoryLoading ? "Importing…" : "Upload & Import"}
                            </button>
                        </form>

                        {categoryError && (
                            <div className="alert-banner alert-banner--danger" role="alert" style={{ padding: "8px 12px", marginBottom: 0 }}>
                                <span className="text-xs">{categoryError}</span>
                            </div>
                        )}

                        {categoryResult && (
                            <div className="alert-banner alert-banner--success" role="status" style={{ padding: "10px 12px", marginBottom: 0 }}>
                                <div className="w-full space-y-1.5 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold">{categoryResult.message}</span>
                                        <div className="flex gap-1.5">
                                            <span className="badge badge--sale">+{categoryResult.imported_count}</span>
                                            <span className="badge badge--adjustment">~{categoryResult.updated_count}</span>
                                        </div>
                                    </div>
                                    {categoryResult.errors.length > 0 && (
                                        <ul className="list-disc pl-4 text-[11px] space-y-0.5 text-amber-500 max-h-24 overflow-y-auto">
                                            {categoryResult.errors.map((err, i) => (
                                                <li key={i}>{err}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Products Card */}
                <div className="analytics-card">
                    <div className="analytics-card__header">
                        <div>
                            <h2>Products</h2>
                            <p>SKUs, barcodes, pricing & classifications</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleExportProducts}
                            disabled={productExporting}
                            className="btn btn--secondary btn--sm"
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            {productExporting ? "Exporting…" : "Export CSV"}
                        </button>
                    </div>

                    <div className="p-5 space-y-3">
                        <form onSubmit={handleImportProducts} className="space-y-3">
                            <input
                                ref={productInputRef}
                                id="prod-file"
                                type="file"
                                accept=".csv,text/csv,text/plain"
                                className="sr-only"
                                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                    setProductFile(e.target.files?.[0] || null);
                                    setProductError(null);
                                }}
                            />

                            {!productFile ? (
                                <div
                                    tabIndex={0}
                                    role="button"
                                    aria-label="Upload Product CSV"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            productInputRef.current?.click();
                                        }
                                    }}
                                    onClick={() => productInputRef.current?.click()}
                                    onDragOver={(e) => { e.preventDefault(); setProductDragActive(true); }}
                                    onDragLeave={() => setProductDragActive(false)}
                                    onDrop={handleProductDrop}
                                    className={`dropzone ${productDragActive ? "dropzone--active" : ""}`}
                                    style={{ padding: "16px 12px", gap: "4px" }}
                                >
                                    <div className="dropzone__icon" style={{ width: 32, height: 32, marginBottom: 0 }}>
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                            <polyline points="17 8 12 3 7 8" />
                                            <line x1="12" y1="3" x2="12" y2="15" />
                                        </svg>
                                    </div>
                                    <span className="dropzone__title" style={{ fontSize: "12.5px" }}>Choose CSV or drag & drop</span>
                                    <span className="dropzone__subtitle" style={{ fontSize: "11px" }}>Required headers: name, barcode</span>
                                </div>
                            ) : (
                                <div className="file-preview" style={{ padding: "8px 12px" }}>
                                    <div className="file-preview__info">
                                        <span className="file-preview__name" style={{ fontSize: "12.5px" }}>{productFile.name}</span>
                                        <span className="file-preview__size">{formatBytes(productFile.size)}</span>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn--secondary btn--sm"
                                        style={{ padding: "2px 8px", fontSize: "11px" }}
                                        onClick={() => {
                                            setProductFile(null);
                                            if (productInputRef.current) productInputRef.current.value = "";
                                        }}
                                    >
                                        Remove
                                    </button>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={!productFile || productLoading}
                                className="btn btn--primary w-full"
                                aria-busy={productLoading}
                            >
                                {productLoading ? "Importing…" : "Upload & Import"}
                            </button>
                        </form>

                        {productError && (
                            <div className="alert-banner alert-banner--danger" role="alert" style={{ padding: "8px 12px", marginBottom: 0 }}>
                                <span className="text-xs">{productError}</span>
                            </div>
                        )}

                        {productResult && (
                            <div className="alert-banner alert-banner--success" role="status" style={{ padding: "10px 12px", marginBottom: 0 }}>
                                <div className="w-full space-y-1.5 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold">{productResult.message}</span>
                                        <div className="flex gap-1.5">
                                            <span className="badge badge--sale">+{productResult.imported_count}</span>
                                            <span className="badge badge--adjustment">~{productResult.updated_count}</span>
                                        </div>
                                    </div>
                                    {productResult.errors.length > 0 && (
                                        <ul className="list-disc pl-4 text-[11px] space-y-0.5 text-amber-500 max-h-24 overflow-y-auto">
                                            {productResult.errors.map((err, i) => (
                                                <li key={i}>{err}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* CSV Schema Guide Table Section (Optional) */}
            {showSchemaGuide && (
                <section className="table-section">
                    <div className="table-section__header">
                        <h2>CSV Schema Guide</h2>
                        <button
                            type="button"
                            className="btn btn--secondary btn--sm"
                            onClick={() => setShowSchemaGuide(false)}
                        >
                            Close
                        </button>
                    </div>

                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Entity</th>
                                    <th>Column Header</th>
                                    <th>Status</th>
                                    <th>Type</th>
                                    <th>Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="td-bold">Categories</td>
                                    <td><code>name</code></td>
                                    <td><span className="badge badge--danger">Required</span></td>
                                    <td>String</td>
                                    <td>Display name (unique)</td>
                                </tr>
                                <tr>
                                    <td className="td-bold">Categories</td>
                                    <td><code>slug</code></td>
                                    <td><span className="badge badge--inactive">Optional</span></td>
                                    <td>String</td>
                                    <td>Auto-generated from name if omitted</td>
                                </tr>
                                <tr>
                                    <td className="td-bold">Categories</td>
                                    <td><code>description</code></td>
                                    <td><span className="badge badge--inactive">Optional</span></td>
                                    <td>Text</td>
                                    <td>Category summary</td>
                                </tr>
                                <tr>
                                    <td className="td-bold">Categories</td>
                                    <td><code>category_id</code></td>
                                    <td><span className="badge badge--inactive">Optional</span></td>
                                    <td>UUID</td>
                                    <td>Updates existing category if matched</td>
                                </tr>
                                <tr>
                                    <td className="td-bold">Products</td>
                                    <td><code>name</code></td>
                                    <td><span className="badge badge--danger">Required</span></td>
                                    <td>String</td>
                                    <td>Product name / SKU label</td>
                                </tr>
                                <tr>
                                    <td className="td-bold">Products</td>
                                    <td><code>barcode</code></td>
                                    <td><span className="badge badge--danger">Required</span></td>
                                    <td>String</td>
                                    <td>Unique barcode identifier</td>
                                </tr>
                                <tr>
                                    <td className="td-bold">Products</td>
                                    <td><code>category_name</code></td>
                                    <td><span className="badge badge--inactive">Optional</span></td>
                                    <td>String</td>
                                    <td>Auto-creates category if missing</td>
                                </tr>
                                <tr>
                                    <td className="td-bold">Products</td>
                                    <td><code>unit_cost / unit_price</code></td>
                                    <td><span className="badge badge--inactive">Optional</span></td>
                                    <td>Decimal</td>
                                    <td>Values in Philippine Peso (₱)</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
        </div>
    );
}
