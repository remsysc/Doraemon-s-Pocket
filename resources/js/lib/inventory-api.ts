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
    occured_at: string;
    created_at: string;
    lot?: Lot;
    actor?: { id: number; name: string; email: string; role: string };
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
    occured_at: string;
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
