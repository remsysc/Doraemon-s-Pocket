import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import DashboardLayout from "./DashboardLayout";
import * as inventoryApi from "../lib/inventory-api";
import * as api from "../lib/api";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual<any>("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

vi.mock("../lib/inventory-api", () => ({
    getExpiryAlerts: vi.fn(),
    getReorderAlerts: vi.fn(),
    searchProducts: vi.fn().mockResolvedValue({ data: { data: [] } }),
    searchLots: vi.fn().mockResolvedValue([]),
}));

vi.mock("../lib/api", () => ({
    getCurrentUser: vi.fn(),
    logout: vi.fn(),
}));

const mockProduct: inventoryApi.Product = {
    id: "prod-1",
    name: "Portable AC 1.0 HP",
    sku_id: "WB-AC-1000",
    unit_of_measure: "unit",
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
};

const mockReorderAlert: inventoryApi.ReorderAlert = {
    sku_id: "WB-AC-1000",
    product: mockProduct,
    qty_available: 2,
    reorder_point: 10,
    suggested_order_qty: 20,
    seasonal: true,
};

const mockExpiryAlert: inventoryApi.ExpiryAlert = {
    lot_id: "lot-uuid-1234",
    sku_id: "WB-FL-0100",
    product: {
        id: "prod-2",
        name: "HEPA Filter Small",
        sku_id: "WB-FL-0100",
        unit_of_measure: "piece",
        created_at: "2026-08-01T00:00:00Z",
        updated_at: "2026-08-01T00:00:00Z",
    },
    expiry_date: "2026-11-01",
    days_to_expiry: 15,
    qty_on_hand: 25,
};

describe("DashboardLayout Live Notifications", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        vi.mocked(api.getCurrentUser).mockResolvedValue({
            data: { id: "1", name: "Purchasing Manager", email: "pm@example.com", role: "purchasing_manager" },
        } as any);
        vi.mocked(inventoryApi.getReorderAlerts).mockResolvedValue({
            data: { data: [mockReorderAlert] },
        } as any);
        vi.mocked(inventoryApi.getExpiryAlerts).mockResolvedValue({
            data: { data: [mockExpiryAlert] },
        } as any);
    });

    it("displays the unread alert count badge and opens dropdown with alerts", async () => {
        render(
            <MemoryRouter>
                <DashboardLayout />
            </MemoryRouter>
        );

        // Expect unread count badge of 2 (1 reorder + 1 expiry)
        const bellButton = await screen.findByRole("button", { name: /alerts/i });
        expect(bellButton).toBeInTheDocument();
        expect(screen.getByText("2")).toBeInTheDocument();

        // Open dropdown
        fireEvent.click(bellButton);

        expect(screen.getByText("Portable AC 1.0 HP")).toBeInTheDocument();
        expect(screen.getByText("HEPA Filter Small")).toBeInTheDocument();
        expect(screen.getByText("2 new")).toBeInTheDocument();
    });

    it("marks alert as read and navigates to the issue when reorder alert is clicked", async () => {
        render(
            <MemoryRouter>
                <DashboardLayout />
            </MemoryRouter>
        );

        const bellButton = await screen.findByRole("button", { name: /alerts/i });
        fireEvent.click(bellButton);

        // Click reorder alert
        const reorderItem = screen.getByText("Portable AC 1.0 HP").closest("button");
        expect(reorderItem).not.toBeNull();
        fireEvent.click(reorderItem!);

        // Navigates directly to the issue
        expect(mockNavigate).toHaveBeenCalledWith("/purchasing?highlight=WB-AC-1000");

        // Verify key was marked as read in localStorage
        const stored = JSON.parse(localStorage.getItem("wb-read-alerts") || "[]");
        expect(stored).toContain("reorder:WB-AC-1000");
    });

    it("marks alert as read and navigates to lots when expiry alert is clicked", async () => {
        render(
            <MemoryRouter>
                <DashboardLayout />
            </MemoryRouter>
        );

        const bellButton = await screen.findByRole("button", { name: /alerts/i });
        fireEvent.click(bellButton);

        // Click expiry alert
        const expiryItem = screen.getByText("HEPA Filter Small").closest("button");
        expect(expiryItem).not.toBeNull();
        fireEvent.click(expiryItem!);

        // Navigates directly to the issue
        expect(mockNavigate).toHaveBeenCalledWith("/lots?highlight=lot-uuid-1234");

        // Verify key was marked as read in localStorage
        const stored = JSON.parse(localStorage.getItem("wb-read-alerts") || "[]");
        expect(stored).toContain("expiry:lot-uuid-1234");
    });

    it("marks all alerts as read when clicking Mark all read", async () => {
        render(
            <MemoryRouter>
                <DashboardLayout />
            </MemoryRouter>
        );

        const bellButton = await screen.findByRole("button", { name: /alerts/i });
        fireEvent.click(bellButton);

        const markAllButton = screen.getByRole("button", { name: /mark all read/i });
        fireEvent.click(markAllButton);

        // Unread count badge goes away
        expect(screen.queryByText("2 new")).not.toBeInTheDocument();
        expect(screen.getByText("All read")).toBeInTheDocument();

        const stored = JSON.parse(localStorage.getItem("wb-read-alerts") || "[]");
        expect(stored).toEqual(expect.arrayContaining(["reorder:WB-AC-1000", "expiry:lot-uuid-1234"]));
    });
});
