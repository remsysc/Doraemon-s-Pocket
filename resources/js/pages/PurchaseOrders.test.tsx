import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PurchaseOrders from "./PurchaseOrders";
import * as inventoryApi from "../lib/inventory-api";
import * as api from "../lib/api";

vi.mock("../lib/inventory-api", () => ({
    getPurchaseOrders: vi.fn(),
    createPurchaseOrder: vi.fn(),
    updatePurchaseOrder: vi.fn(),
    deletePurchaseOrder: vi.fn(),
    receivePurchaseOrder: vi.fn(),
    getSuppliers: vi.fn(),
    getProducts: vi.fn(),
    exportPurchaseOrdersCsv: vi.fn(),
    importPurchaseOrdersCsv: vi.fn(),
}));

vi.mock("../lib/api", () => ({
    getCurrentUser: vi.fn(),
}));

const mockSupplier: inventoryApi.Supplier = {
    id: "sup-1",
    name: "Daikin Philippines",
    lead_time_days: 7,
    is_active: true,
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
};

const mockProduct: inventoryApi.Product = {
    id: "prod-1",
    name: "Portable AC 1.0 HP",
    unit_of_measure: "unit",
    unit_cost: 12500,
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
};

const mockPO: inventoryApi.PurchaseOrder = {
    id: "po-1",
    po_number: "PO-2026-0001",
    supplier_id: "sup-1",
    supplier: mockSupplier,
    status: "ordered",
    order_date: "2026-08-01",
    expected_delivery_date: "2026-08-10",
    notes: "First batch",
    total_cost: 125000,
    items: [
        {
            id: "poi-1",
            sku_id: "prod-1",
            quantity_ordered: 10,
            quantity_received: 0,
            unit_cost: 12500,
            product: mockProduct,
        },
    ],
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
};

describe("PurchaseOrders Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(api.getCurrentUser).mockResolvedValue({
            data: { id: "1", name: "Purchasing Manager", email: "pm@example.com", role: "purchasing_manager" },
        } as any);
        vi.mocked(inventoryApi.getPurchaseOrders).mockResolvedValue({
            data: { data: [mockPO], meta: { current_page: 1, last_page: 1, total: 1 } },
        } as any);
        vi.mocked(inventoryApi.getSuppliers).mockResolvedValue({
            data: { data: [mockSupplier], meta: { current_page: 1, last_page: 1, total: 1 } },
        } as any);
        vi.mocked(inventoryApi.getProducts).mockResolvedValue({
            data: { data: [mockProduct], meta: { current_page: 1, last_page: 1, total: 1 } },
        } as any);
    });

    it("renders PO table with po_number, supplier, and status", async () => {
        render(<PurchaseOrders />);

        expect(await screen.findByText("PO-2026-0001")).toBeInTheDocument();
        expect(screen.getByText("Daikin Philippines")).toBeInTheDocument();
        expect(screen.getByText("Ordered")).toBeInTheDocument();
    });

    it("opens create PO modal and creates new PO with item", async () => {
        vi.mocked(inventoryApi.createPurchaseOrder).mockResolvedValue({ data: mockPO } as any);
        render(<PurchaseOrders />);

        fireEvent.click(await screen.findByRole("button", { name: "+ New PO" }));

        expect(screen.getByRole("heading", { name: "New Purchase Order" })).toBeInTheDocument();

        // Select supplier and SKU
        const selects = screen.getAllByRole("combobox");
        fireEvent.change(selects[1], { target: { value: "sup-1" } });
        fireEvent.change(selects[2], { target: { value: "prod-1" } });

        const qtyInput = screen.getByPlaceholderText("Qty");
        fireEvent.change(qtyInput, { target: { value: "5" } });

        fireEvent.click(screen.getByRole("button", { name: "Create PO" }));

        await waitFor(() => {
            expect(inventoryApi.createPurchaseOrder).toHaveBeenCalledWith(expect.objectContaining({
                supplier_id: "sup-1",
                items: expect.arrayContaining([
                    expect.objectContaining({
                        sku_id: "prod-1",
                        quantity_ordered: 5,
                    }),
                ]),
            }));
        });
    });
});
