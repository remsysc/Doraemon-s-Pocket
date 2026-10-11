import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Categories from "./Categories";
import * as inventoryApi from "../lib/inventory-api";
import * as api from "../lib/api";

vi.mock("../lib/inventory-api", () => ({
    getCategories: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
    restoreCategory: vi.fn(),
}));

vi.mock("../lib/api", () => ({
    getCurrentUser: vi.fn(),
}));

const mockCategories: inventoryApi.Category[] = [
    {
        id: "cat-1",
        name: "Kitchen Appliances",
        slug: "kitchen-appliances",
        description: "Kitchen electrics",
    },
];

describe("Categories Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(api.getCurrentUser).mockResolvedValue({
            data: { id: "1", name: "Admin", email: "admin@example.com", role: "admin" },
        } as any);
        vi.mocked(inventoryApi.getCategories).mockResolvedValue({
            data: { data: mockCategories, meta: { current_page: 1, last_page: 1, total: 1 } },
        } as any);
    });

    it("renders categories table", async () => {
        render(<Categories />);

        expect(await screen.findByText("Kitchen Appliances")).toBeInTheDocument();
        expect(screen.getByText("kitchen-appliances")).toBeInTheDocument();
        expect(screen.getByText("Kitchen electrics")).toBeInTheDocument();
    });

    it("creates a category with optional description left empty", async () => {
        vi.mocked(inventoryApi.createCategory).mockResolvedValue({ data: mockCategories[0] } as any);
        render(<Categories />);

        fireEvent.click(await screen.findByRole("button", { name: "+ New Category" }));

        expect(screen.getByRole("heading", { name: "New Category" })).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Cooling & Fans" } });
        fireEvent.change(screen.getByLabelText("Slug"), { target: { value: "cooling-fans" } });
        // Description left blank

        fireEvent.click(screen.getByRole("button", { name: "Create" }));

        await waitFor(() => {
            expect(inventoryApi.createCategory).toHaveBeenCalledWith({
                name: "Cooling & Fans",
                slug: "cooling-fans",
                description: undefined,
            });
        });
    });

    it("creates a category with all fields populated", async () => {
        vi.mocked(inventoryApi.createCategory).mockResolvedValue({ data: mockCategories[0] } as any);
        render(<Categories />);

        fireEvent.click(await screen.findByRole("button", { name: "+ New Category" }));

        fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Thermostats" } });
        fireEvent.change(screen.getByLabelText("Slug"), { target: { value: "thermostats" } });
        fireEvent.change(screen.getByLabelText("Description"), { target: { value: "Temperature controls" } });

        fireEvent.click(screen.getByRole("button", { name: "Create" }));

        await waitFor(() => {
            expect(inventoryApi.createCategory).toHaveBeenCalledWith({
                name: "Thermostats",
                slug: "thermostats",
                description: "Temperature controls",
            });
        });
    });
});
