import api from "./api";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface Category {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    created_at: string;
    updated_at: string;
}

export interface Product {
    id: string;
    name: string;
    description: string | null;
    barcode: string | null;
    unit_of_measure: string;
    unit_cost?: number | null;
    unit_price?: number | null;
    category: Category;
    metadata: {
        is_seasonal: boolean;
        shelf_life_days: number | null;
    };
    status: "active" | "inactive";
    created_at: string;
    updated_at: string;
}

export interface Lot {
    lot_id: string;
    sku_id: string;
    received_date: string;
    expiry_date: string | null;
    bin_location: string | null;
    product?: Product;
    created_at: string;
    updated_at: string;
}

export interface InventoryTransaction {
    id: string;
    type: "RECEIPT" | "RESERVE" | "PICK" | "SALE" | "ADJUSTMENT" | "WRITE_OFF";
    quantity_delta: number;
    occurred_at: string;
    created_at: string;
    lot?: Lot;
    actor?: { id: number; name: string; email: string; role: string };
}

export interface InventorySnapshot {
    sku_id: string;
    qty_on_hand: number;
    qty_reserved: number;
    qty_available: number;
    product?: Product;
    updated_at: string | null;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    links: {
        first: string | null;
        last: string | null;
        prev: string | null;
        next: string | null;
    };
}

// ─── Category payloads ─────────────────────────────────────────────────────

export interface StoreCategoryPayload {
    name: string;
    slug: string;
    description?: string;
}

export interface UpdateCategoryPayload {
    name?: string;
    slug?: string;
    description?: string;
}

// ─── Product payloads ──────────────────────────────────────────────────────

export interface StoreProductPayload {
    name: string;
    description?: string;
    barcode?: string;
    unit_of_measure: string;
    unit_cost?: number | null;
    unit_price?: number | null;
    is_seasonal?: boolean;
    shelf_life_days?: number | null;
    is_active?: boolean;
    category_id: string;
}

export interface UpdateProductPayload {
    name?: string;
    description?: string;
    barcode?: string;
    unit_of_measure?: string;
    unit_cost?: number | null;
    unit_price?: number | null;
    is_seasonal?: boolean;
    shelf_life_days?: number | null;
    is_active?: boolean;
    category_id?: string;
}

// ─── Lot payloads ──────────────────────────────────────────────────────────

export interface StoreLotPayload {
    sku_id: string;
    received_date: string;
    expiry_date?: string | null;
    bin_location?: string | null;
}

export interface UpdateLotPayload {
    sku_id?: string;
    received_date?: string;
    expiry_date?: string | null;
    bin_location?: string | null;
}

// ─── Transaction payload ───────────────────────────────────────────────────

export interface StoreTransactionPayload {
    lot_id: string;
    txn_type: "RECEIPT" | "RESERVE" | "PICK" | "SALE" | "ADJUSTMENT" | "WRITE_OFF";
    qty_delta: number;
    occurred_at: string;
}

// ─── API Functions ─────────────────────────────────────────────────────────

function getCsrfCookie() {
    return api.get("/sanctum/csrf-cookie");
}

// Categories
export function getCategories(page = 1, perPage = 15) {
    return api.get<PaginatedResponse<Category>>("/api/categories", {
        params: { page, per_page: perPage },
    });
}

export function getCategory(id: string) {
    return api.get<{ data: Category }>(`/api/categories/${id}`);
}

export async function createCategory(payload: StoreCategoryPayload) {
    await getCsrfCookie();
    return api.post<{ data: Category }>("/api/categories", payload);
}

export async function updateCategory(id: string, payload: UpdateCategoryPayload) {
    await getCsrfCookie();
    return api.put<{ data: Category }>(`/api/categories/${id}`, payload);
}

export async function deleteCategory(id: string) {
    await getCsrfCookie();
    return api.delete(`/api/categories/${id}`);
}

export async function restoreCategory(id: string) {
    await getCsrfCookie();
    return api.post<{ data: Category }>(`/api/categories/${id}/restore`);
}

// Products
export function getProducts(page = 1, perPage = 15) {
    return api.get<PaginatedResponse<Product>>("/api/products", {
        params: { page, per_page: perPage },
    });
}

export function getProduct(id: string) {
    return api.get<{ data: Product }>(`/api/products/${id}`);
}

export async function createProduct(payload: StoreProductPayload) {
    await getCsrfCookie();
    return api.post<{ data: Product }>("/api/products", payload);
}

export async function updateProduct(id: string, payload: UpdateProductPayload) {
    await getCsrfCookie();
    return api.put<{ data: Product }>(`/api/products/${id}`, payload);
}

export async function deleteProduct(id: string) {
    await getCsrfCookie();
    return api.delete(`/api/products/${id}`);
}

// Lots
export function getLots(page = 1, perPage = 15) {
    return api.get<PaginatedResponse<Lot>>("/api/lots", {
        params: { page, per_page: perPage },
    });
}

export function getLot(id: string) {
    return api.get<{ data: Lot }>(`/api/lots/${id}`);
}

export async function createLot(payload: StoreLotPayload) {
    await getCsrfCookie();
    return api.post<{ data: Lot }>("/api/lots", payload);
}

export async function updateLot(id: string, payload: UpdateLotPayload) {
    await getCsrfCookie();
    return api.put<{ data: Lot }>(`/api/lots/${id}`, payload);
}

export async function deleteLot(id: string) {
    await getCsrfCookie();
    return api.delete(`/api/lots/${id}`);
}

// Inventory Transactions
export function getTransactions(page = 1, perPage = 15) {
    return api.get<PaginatedResponse<InventoryTransaction>>(
        "/api/inventory-transactions",
        { params: { page, per_page: perPage, include: "lot.product,actor" } },
    );
}

export function getTransaction(id: string) {
    return api.get<{ data: InventoryTransaction }>(
        `/api/inventory-transactions/${id}`,
    );
}

export async function createTransaction(payload: StoreTransactionPayload) {
    await getCsrfCookie();
    return api.post<{ data: InventoryTransaction }>(
        "/api/inventory-transactions",
        payload,
    );
}

// Inventory Snapshots (read-only derived stock)
export function getInventorySnapshots(page = 1, perPage = 15) {
    return api.get<PaginatedResponse<InventorySnapshot>>(
        "/api/inventory-snapshots",
        { params: { page, per_page: perPage, include: "product" } },
    );
}

export function getInventorySnapshot(skuId: string) {
    return api.get<{ data: InventorySnapshot }>(
        `/api/inventory-snapshots/${skuId}`,
        { params: { include: "product" } },
    );
}

// ─── Audit Logs ────────────────────────────────────────────────────────────

export interface AuditLog {
    id: string;
    actor?: { id: number; name: string; email: string; role: string };
    action: string;
    entity_type: string;
    entity_id: string;
    old_values: Record<string, unknown> | null;
    new_values: Record<string, unknown> | null;
    occurred_at: string;
}

export function getAuditLogs(page = 1, perPage = 15) {
    return api.get<PaginatedResponse<AuditLog>>("/api/audit-logs", {
        params: { page, per_page: perPage },
    });
}

export function getAuditLog(id: string) {
    return api.get<{ data: AuditLog }>(`/api/audit-logs/${id}`);
}

// ─── Reorder Intelligence & Purchasing Alerts (Sprint 4) ─────────────────────

export interface ReorderConfig {
    sku_id: string;
    reorder_point: number | null;
    safety_stock: number | null;
    lead_time_days: number;
    order_cost: string | number | null;
    holding_cost_per_unit: string | number | null;
    service_level_z: string | number;
    product?: Product;
    updated_at: string | null;
}

export interface ReorderAlert {
    sku_id: string;
    product: Product;
    qty_available: number;
    reorder_point: number;
    suggested_order_qty: number | null;
    seasonal: boolean;
}

export interface ExpiryAlert {
    lot_id: string;
    sku_id: string;
    product: Product;
    expiry_date: string;
    days_to_expiry: number;
    qty_on_hand: number;
}

export interface Classification {
    sku_id: string;
    product: Product;
    abc: "A" | "B" | "C";
    xyz: "X" | "Y" | "Z";
    annual_demand: number;
    annual_value: number;
    cv: number | null;
}

export function getReorderConfigs(page = 1, perPage = 15) {
    return api.get<PaginatedResponse<ReorderConfig>>("/api/reorder-configs", {
        params: { page, per_page: perPage },
    });
}

export function getReorderAlerts() {
    return api.get<{ data: ReorderAlert[] }>("/api/alerts/reorder");
}

export function getExpiryAlerts(days = 30) {
    return api.get<{ data: ExpiryAlert[] }>("/api/alerts/expiry", {
        params: { days },
    });
}

export function getClassifications() {
    return api.get<{ data: Classification[] }>("/api/inventory-classifications");
}

// ─── Cycle Counts (Sprint 5, FR-30, FR-36) ──────────────────────────────────

export interface CycleCount {
    id: string;
    sku_id: string;
    lot_id: string | null;
    product?: Product;
    counted_by: number;
    counter_name: string;
    expected_qty: number;
    counted_qty: number;
    variance_qty: number;
    variance_pct: number;
    is_flagged: boolean;
    status: "pending" | "reconciled" | "dismissed";
    notes: string | null;
    reconciled_by: number | null;
    reconciled_at: string | null;
    reconciliation_txn_id: string | null;
    counted_at: string;
}

export interface StoreCycleCountPayload {
    sku_id: string;
    lot_id?: string | null;
    counted_qty: number;
    notes?: string | null;
}

export interface ReconcileCycleCountPayload {
    notes?: string | null;
}

export function getCycleCounts(
    page = 1,
    perPage = 15,
    filters?: { status?: string; is_flagged?: boolean },
) {
    return api.get<PaginatedResponse<CycleCount>>("/api/cycle-counts", {
        params: {
            page,
            per_page: perPage,
            ...filters,
        },
    });
}

export function getCycleCount(id: string) {
    return api.get<{ data: CycleCount }>(`/api/cycle-counts/${id}`);
}

export async function createCycleCount(payload: StoreCycleCountPayload) {
    await getCsrfCookie();
    return api.post<{ data: CycleCount }>("/api/cycle-counts", payload);
}

export async function reconcileCycleCount(
    id: string,
    payload?: ReconcileCycleCountPayload,
) {
    await getCsrfCookie();
    return api.post<{ data: CycleCount }>(
        `/api/cycle-counts/${id}/reconcile`,
        payload ?? {},
    );
}

export async function dismissCycleCount(id: string) {
    await getCsrfCookie();
    return api.post<{ data: CycleCount }>(`/api/cycle-counts/${id}/dismiss`);
}

// ─── Reports (Sprint 5, FR-18) ──────────────────────────────────────────────

export interface VarianceReportItem {
    sku_id: string;
    product_name: string;
    category_name: string;
    current_qty_on_hand: number;
    total_counts: number;
    net_variance_qty: number;
    net_variance_value: number;
    flagged_discrepancy_count: number;
    last_counted_at: string | null;
}

export interface VarianceReportResponse {
    data: VarianceReportItem[];
    meta: {
        threshold_percentage: number;
        total_audited_skus: number;
        total_discrepancies: number;
        net_shrinkage_units: number;
        net_shrinkage_value: number;
    };
}

export interface TurnoverReportItem {
    category_id: string;
    category_name: string;
    product_count: number;
    outflow_units: number;
    avg_on_hand: number;
    inventory_valuation: number;
    turnover_ratio: number;
    velocity_tier: "High" | "Medium" | "Low" | "Dead Stock";
}

export interface TurnoverReportResponse {
    data: TurnoverReportItem[];
    meta: {
        window_days: number;
        generated_at: string;
    };
}

export function getVarianceReport(params?: {
    flagged_only?: boolean;
    category_id?: string;
}) {
    return api.get<VarianceReportResponse>("/api/reports/variance", {
        params,
    });
}

export function getTurnoverReport(params?: { window_days?: number }) {
    return api.get<TurnoverReportResponse>("/api/reports/turnover", {
        params,
    });
}

// ─── User Management (Sprint 5, FR-19, FR-38) ───────────────────────────────

export interface ManagedUser {
    id: number;
    name: string;
    email: string;
    role: "admin" | "purchasing_manager" | "warehouse_staff";
    is_active: boolean;
    created_at: string;
}

export interface StoreUserPayload {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    role: "admin" | "purchasing_manager" | "warehouse_staff";
}

export interface UpdateUserPayload {
    name?: string;
    email?: string;
    password?: string;
    password_confirmation?: string;
    role?: "admin" | "purchasing_manager" | "warehouse_staff";
    is_active?: boolean;
}

export function getUsers(page = 1, perPage = 15) {
    return api.get<PaginatedResponse<ManagedUser>>("/api/users", {
        params: { page, per_page: perPage },
    });
}

export function getUser(id: number) {
    return api.get<{ data: ManagedUser }>(`/api/users/${id}`);
}

export async function createUser(payload: StoreUserPayload) {
    await getCsrfCookie();
    return api.post<{ data: ManagedUser }>("/api/users", payload);
}

export async function updateUser(id: number, payload: UpdateUserPayload) {
    await getCsrfCookie();
    return api.put<{ data: ManagedUser }>(`/api/users/${id}`, payload);
}

export async function deleteUser(id: number) {
    await getCsrfCookie();
    return api.delete(`/api/users/${id}`);
}

export async function deactivateUser(id: number) {
    await getCsrfCookie();
    return api.post<{ data: ManagedUser }>(`/api/users/${id}/deactivate`);
}

