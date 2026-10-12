import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Lots from "./Lots";
import * as inventoryApi from "../lib/inventory-api";
import * as api from "../lib/api";

function renderWithRouter(ui: React.ReactElement) {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
}

vi.mock("../lib/inventory-api", () => ({
    getLots: vi.fn(),
    getProducts: vi.fn(),
    createLot: vi.fn(),
    updateLot: vi.fn(),
    deleteLot: vi.fn(),
    importLotsCsv: vi.fn(),
}));

vi.mock("../lib/api", () => ({
    getCurrentUser: vi.fn(),
}));

const mockProduct: inventoryApi.Product = {
    id: "prod-uuid-1",
    name: "Portable AC 1.0 HP",
    unit_of_measure: "unit",
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
};

const mockLots: inventoryApi.Lot[] = [
    {
        lot_id: "lot-uuid-1",
        sku_id: "prod-uuid-1",
        product: mockProduct,
        received_date: "2026-08-01T10:00:00Z",
        expiry_date: null,
        bin_location: "AC-A01",
        created_at: "2026-08-01T10:00:00Z",
        updated_at: "2026-08-01T10:00:00Z",
    },
];

describe("Lots Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(api.getCurrentUser).mockResolvedValue({
            data: { id: "1", name: "Warehouse Staff", email: "ws@example.com", role: "warehouse_staff" },
        } as any);
        vi.mocked(inventoryApi.getProducts).mockResolvedValue({
            data: { data: [mockProduct], meta: { current_page: 1, last_page: 1, total: 1 } },
        } as any);
        vi.mocked(inventoryApi.getLots).mockResolvedValue({
            data: { data: mockLots, meta: { current_page: 1, last_page: 1, total: 1 } },
        } as any);
    });

    it("renders lots with bin location and product info", async () => {
        renderWithRouter(<Lots />);

        expect(await screen.findByText("AC-A01")).toBeInTheDocument();
        expect(screen.getByText("Portable AC 1.0 HP")).toBeInTheDocument();
    });

    it("validates that bin_location is required in the create modal", async () => {
        renderWithRouter(<Lots />);

        fireEvent.click(await screen.findByRole("button", { name: "+ New Lot" }));

        expect(screen.getByRole("heading", { name: "New Lot" })).toBeInTheDocument();

        const binInput = screen.getByLabelText(/bin location/i) as HTMLInputElement;
        expect(binInput.required).toBe(true);

        const expiryInput = screen.getByLabelText(/expiry date/i) as HTMLInputElement;
        expect(expiryInput.required).toBe(false);
    });

    it("creates lot with optional expiry date left blank", async () => {
        vi.mocked(inventoryApi.createLot).mockResolvedValue({ data: mockLots[0] } as any);
        renderWithRouter(<Lots />);

        fireEvent.click(await screen.findByRole("button", { name: "+ New Lot" }));

        fireEvent.change(screen.getByLabelText(/product/i), { target: { value: "prod-uuid-1" } });
        fireEvent.change(screen.getByLabelText(/received date/i), { target: { value: "2026-08-01T10:00" } });
        fireEvent.change(screen.getByLabelText(/bin location/i), { target: { value: "AC-A02" } });

        fireEvent.click(screen.getByRole("button", { name: "Create" }));

        await waitFor(() => {
            expect(inventoryApi.createLot).toHaveBeenCalledWith({
                sku_id: "prod-uuid-1",
                received_date: "2026-08-01T10:00",
                bin_location: "AC-A02",
                expiry_date: null,
            });
        });
    });

    it("creates lot with optional expiry date populated", async () => {
        vi.mocked(inventoryApi.createLot).mockResolvedValue({ data: mockLots[0] } as any);
        renderWithRouter(<Lots />);

        fireEvent.click(await screen.findByRole("button", { name: "+ New Lot" }));

        fireEvent.change(screen.getByLabelText(/product/i), { target: { value: "prod-uuid-1" } });
        fireEvent.change(screen.getByLabelText(/received date/i), { target: { value: "2026-08-01T10:00" } });
        fireEvent.change(screen.getByLabelText(/bin location/i), { target: { value: "AC-A03" } });
        fireEvent.change(screen.getByLabelText(/expiry date/i), { target: { value: "2027-08-01" } });

        fireEvent.click(screen.getByRole("button", { name: "Create" }));

        await waitFor(() => {
            expect(inventoryApi.createLot).toHaveBeenCalledWith({
                sku_id: "prod-uuid-1",
                received_date: "2026-08-01T10:00",
                bin_location: "AC-A03",
                expiry_date: "2027-08-01",
            });
        });
    });
});
