import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Products from "./Products";
import * as inventoryApi from "../lib/inventory-api";
import * as api from "../lib/api";

function renderWithRouter(ui: React.ReactElement) {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
}

vi.mock("../lib/inventory-api", () => ({
    getProducts: vi.fn(),
    getCategories: vi.fn(),
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn(),
}));

vi.mock("../lib/api", () => ({
    getCurrentUser: vi.fn(),
}));

const mockCategories: inventoryApi.Category[] = [
    {
        id: "cat-uuid-1",
        name: "Cooling & AC",
        slug: "cooling-ac",
        description: "Air conditioners and fans",
    },
    {
        id: "cat-uuid-2",
        name: "Air Purifiers",
        slug: "air-purifiers",
        description: "Purifiers and filters",
    },
];

const mockProducts: inventoryApi.Product[] = [
    {
        id: "prod-uuid-1",
        name: "Portable AC 1.0 HP",
        description: "Compact portable air conditioner",
        barcode: "WB-AC-1000",
        unit_of_measure: "unit",
        unit_cost: 12500,
        unit_price: 16000,
        category: mockCategories[0],
        status: "active",
        is_active: true,
        metadata: {
            is_seasonal: true,
            shelf_life_days: null,
        },
        created_at: "2026-08-01T00:00:00Z",
        updated_at: "2026-08-01T00:00:00Z",
    },
];

describe("Products Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(api.getCurrentUser).mockResolvedValue({
            data: { id: "1", name: "Admin", email: "admin@example.com", role: "admin" },
        } as any);
        vi.mocked(inventoryApi.getCategories).mockResolvedValue({
            data: { data: mockCategories, meta: { current_page: 1, last_page: 1, total: 2 } },
        } as any);
        vi.mocked(inventoryApi.getProducts).mockResolvedValue({
            data: { data: mockProducts, meta: { current_page: 1, last_page: 1, total: 1 } },
        } as any);
    });

    it("renders the product list with unit, price, and status badge", async () => {
        renderWithRouter(<Products />);

        expect(await screen.findByText("Portable AC 1.0 HP")).toBeInTheDocument();
        expect(screen.getByText("Cooling & AC")).toBeInTheDocument();
        expect(screen.getByText("unit")).toBeInTheDocument();
        expect(screen.getByText("WB-AC-1000")).toBeInTheDocument();
        expect(screen.getByText("active")).toBeInTheDocument();
    });

    it("opens create modal with default unit dropdown and active status", async () => {
        renderWithRouter(<Products />);

        const createButton = await screen.findByRole("button", { name: "+ New Product" });
        fireEvent.click(createButton);

        expect(screen.getByRole("heading", { name: "New Product" })).toBeInTheDocument();

        // Unit of measure is a select dropdown defaulting to 'unit'
        const unitSelect = screen.getByLabelText(/unit of measure/i) as HTMLSelectElement;
        expect(unitSelect.tagName).toBe("SELECT");
        expect(unitSelect.value).toBe("unit");

        // Active status checkbox is present and checked by default
        const activeCheckbox = screen.getByRole("checkbox", { name: /active/i }) as HTMLInputElement;
        expect(activeCheckbox).toBeInTheDocument();
        expect(activeCheckbox.checked).toBe(true);

        // Barcode is marked optional in placeholder
        const barcodeInput = screen.getByPlaceholderText("Optional barcode") as HTMLInputElement;
        expect(barcodeInput.required).toBe(false);
    });

    it("submits product creation with only required fields (verifies optional fields can be left blank)", async () => {
        vi.mocked(inventoryApi.createProduct).mockResolvedValue({ data: mockProducts[0] } as any);
        renderWithRouter(<Products />);

        fireEvent.click(await screen.findByRole("button", { name: "+ New Product" }));

        // Fill required fields only
        fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "Minimal Product" } });
        fireEvent.change(screen.getByLabelText(/category/i), { target: { value: "cat-uuid-1" } });
        // Unit of Measure defaults to 'unit'

        // Barcode, description, costs, shelf life are left empty
        fireEvent.click(screen.getByRole("button", { name: "Create" }));

        await waitFor(() => {
            expect(inventoryApi.createProduct).toHaveBeenCalledWith({
                name: "Minimal Product",
                category_id: "cat-uuid-1",
                unit_of_measure: "unit",
                is_seasonal: false,
                is_active: true,
                description: undefined,
                barcode: undefined,
                unit_cost: null,
                unit_price: null,
                shelf_life_days: null,
            });
        });
    });

    it("submits product creation with all optional fields filled and custom dropdown selection", async () => {
        vi.mocked(inventoryApi.createProduct).mockResolvedValue({ data: mockProducts[0] } as any);
        renderWithRouter(<Products />);

        fireEvent.click(await screen.findByRole("button", { name: "+ New Product" }));

        fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "Heavy Industrial Fan" } });
        fireEvent.change(screen.getByLabelText(/category/i), { target: { value: "cat-uuid-1" } });
        fireEvent.change(screen.getByLabelText(/unit of measure/i), { target: { value: "box" } });
        fireEvent.change(screen.getByPlaceholderText("Optional barcode"), { target: { value: "WB-FAN-999" } });
        fireEvent.change(screen.getByPlaceholderText("Optional description"), { target: { value: "Floor-standing blower" } });
        fireEvent.change(screen.getByLabelText("Unit Cost (₱)"), { target: { value: "2500.50" } });
        fireEvent.change(screen.getByLabelText("Unit Price (₱)"), { target: { value: "3999.99" } });
        fireEvent.change(screen.getByLabelText("Shelf Life (days)"), { target: { value: "365" } });
        fireEvent.click(screen.getByRole("checkbox", { name: /seasonal product/i }));

        fireEvent.click(screen.getByRole("button", { name: "Create" }));

        await waitFor(() => {
            expect(inventoryApi.createProduct).toHaveBeenCalledWith({
                name: "Heavy Industrial Fan",
                category_id: "cat-uuid-1",
                unit_of_measure: "box",
                barcode: "WB-FAN-999",
                description: "Floor-standing blower",
                unit_cost: 2500.5,
                unit_price: 3999.99,
                shelf_life_days: 365,
                is_seasonal: true,
                is_active: true,
            });
        });
    });

    it("displays validation error message when API responds with 422", async () => {
        vi.mocked(inventoryApi.createProduct).mockRejectedValue({
            response: {
                status: 422,
                data: {
                    errors: {
                        name: ["The product name has already been taken."],
                    },
                },
            },
        });

        renderWithRouter(<Products />);
        fireEvent.click(await screen.findByRole("button", { name: "+ New Product" }));

        fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "Duplicate Name" } });
        fireEvent.change(screen.getByLabelText(/category/i), { target: { value: "cat-uuid-1" } });
        fireEvent.click(screen.getByRole("button", { name: "Create" }));

        const errorElements = await screen.findAllByText("The product name has already been taken.");
        expect(errorElements.length).toBeGreaterThanOrEqual(1);
    });

    it("populates edit modal with existing values and sends update payload with active status", async () => {
        vi.mocked(inventoryApi.updateProduct).mockResolvedValue({ data: mockProducts[0] } as any);
        renderWithRouter(<Products />);

        const editButton = await screen.findByRole("button", { name: /edit/i });
        fireEvent.click(editButton);

        expect(screen.getByRole("heading", { name: "Edit Product" })).toBeInTheDocument();
        expect(screen.getByDisplayValue("Portable AC 1.0 HP")).toBeInTheDocument();
        expect(screen.getByDisplayValue("WB-AC-1000")).toBeInTheDocument();

        // Change unit of measure to piece and toggle active
        fireEvent.change(screen.getByLabelText(/unit of measure/i), { target: { value: "piece" } });
        const activeCheckbox = screen.getByRole("checkbox", { name: /active/i });
        fireEvent.click(activeCheckbox); // uncheck active

        fireEvent.click(screen.getByRole("button", { name: "Update" }));

        await waitFor(() => {
            expect(inventoryApi.updateProduct).toHaveBeenCalledWith("prod-uuid-1", expect.objectContaining({
                name: "Portable AC 1.0 HP",
                unit_of_measure: "piece",
                is_active: false,
            }));
        });
    });

    it("allows uninterrupted typing into inputs when editing product without losing focus or resetting values", async () => {
        const user = userEvent.setup();
        renderWithRouter(<Products />);

        const editButton = await screen.findByRole("button", { name: /edit/i });
        await user.click(editButton);

        const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
        await user.click(nameInput);
        expect(document.activeElement).toBe(nameInput);

        // Clear and type with real keystroke dispatch
        await user.clear(nameInput);
        await user.type(nameInput, "Portable AC Updated");

        expect(nameInput.value).toBe("Portable AC Updated");
        expect(document.activeElement).toBe(nameInput);

        const descInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement;
        await user.click(descInput);
        expect(document.activeElement).toBe(descInput);

        await user.clear(descInput);
        await user.type(descInput, "New continuous description without stop");
        expect(descInput.value).toBe("New continuous description without stop");
        expect(document.activeElement).toBe(descInput);
    });
});
