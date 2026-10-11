import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Suppliers from "./Suppliers";
import * as inventoryApi from "../lib/inventory-api";
import * as api from "../lib/api";

vi.mock("../lib/inventory-api", () => ({
    getSuppliers: vi.fn(),
    createSupplier: vi.fn(),
    updateSupplier: vi.fn(),
    deleteSupplier: vi.fn(),
    importSuppliersCsv: vi.fn(),
}));

vi.mock("../lib/api", () => ({
    getCurrentUser: vi.fn(),
}));

const mockSuppliers: inventoryApi.Supplier[] = [
    {
        id: "sup-1",
        name: "Daikin Philippines",
        contact_name: "John Doe",
        contact_email: "john@daikin.ph",
        contact_phone: "+639171234567",
        address: "Taguig City",
        lead_time_days: 7,
        is_active: true,
        created_at: "2026-08-01T00:00:00Z",
        updated_at: "2026-08-01T00:00:00Z",
    },
];

describe("Suppliers Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(api.getCurrentUser).mockResolvedValue({
            data: { id: "1", name: "Purchasing Manager", email: "pm@example.com", role: "purchasing_manager" },
        } as any);
        vi.mocked(inventoryApi.getSuppliers).mockResolvedValue({
            data: { data: mockSuppliers, meta: { current_page: 1, last_page: 1, total: 1 } },
        } as any);
    });

    it("renders suppliers table", async () => {
        render(<Suppliers />);

        expect(await screen.findByText("Daikin Philippines")).toBeInTheDocument();
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("7 days")).toBeInTheDocument();
    });

    it("submits create supplier with only required company name and defaults", async () => {
        vi.mocked(inventoryApi.createSupplier).mockResolvedValue({ data: mockSuppliers[0] } as any);
        render(<Suppliers />);

        fireEvent.click(await screen.findByRole("button", { name: "+ Add Supplier" }));

        expect(screen.getByRole("heading", { name: "Add Supplier" })).toBeInTheDocument();

        fireEvent.change(screen.getByPlaceholderText(/e.g., Daikin Philippines/i), { target: { value: "Carrier PH" } });
        // Optional contacts left blank

        fireEvent.click(screen.getByRole("button", { name: "Create Supplier" }));

        await waitFor(() => {
            expect(inventoryApi.createSupplier).toHaveBeenCalledWith({
                name: "Carrier PH",
                contact_name: undefined,
                contact_email: undefined,
                contact_phone: undefined,
                address: undefined,
                lead_time_days: 7,
            });
        });
    });
});
