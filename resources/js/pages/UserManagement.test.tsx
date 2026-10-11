import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import UserManagement from "./UserManagement";
import * as inventoryApi from "../lib/inventory-api";
import * as api from "../lib/api";

vi.mock("../lib/inventory-api", () => ({
    getUsers: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
    deactivateUser: vi.fn(),
}));

vi.mock("../lib/api", () => ({
    getCurrentUser: vi.fn(),
}));

const mockUsers: inventoryApi.ManagedUser[] = [
    {
        id: 1,
        name: "Admin User",
        email: "admin@example.com",
        role: "admin",
        is_active: true,
        created_at: "2026-08-01T00:00:00Z",
    },
    {
        id: 2,
        name: "Warehouse Person",
        email: "wh@example.com",
        role: "warehouse_staff",
        is_active: true,
        created_at: "2026-08-01T00:00:00Z",
    },
];

describe("UserManagement Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(api.getCurrentUser).mockResolvedValue({
            data: { id: "1", name: "Admin User", email: "admin@example.com", role: "admin" },
        } as any);
        vi.mocked(inventoryApi.getUsers).mockResolvedValue({
            data: { data: mockUsers, meta: { current_page: 1, last_page: 1, total: 2 } },
        } as any);
    });

    it("renders user table with names, roles, and status", async () => {
        render(<UserManagement />);

        expect(await screen.findByText("Admin User")).toBeInTheDocument();
        expect(screen.getByText("wh@example.com")).toBeInTheDocument();
        expect(screen.getByText("Warehouse Staff")).toBeInTheDocument();
    });

    it("validates password match on new user submission", async () => {
        render(<UserManagement />);

        fireEvent.click(await screen.findByRole("button", { name: "+ Add User" }));

        expect(screen.getByRole("heading", { name: "Create User" })).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: "New Staff" } });
        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "new@example.com" } });
        fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: "password123" } });
        fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "mismatch456" } });

        fireEvent.click(screen.getByRole("button", { name: "Create User" }));

        expect(await screen.findByText("Passwords do not match.")).toBeInTheDocument();
        expect(inventoryApi.createUser).not.toHaveBeenCalled();
    });

    it("submits create user with matched passwords and selected role", async () => {
        vi.mocked(inventoryApi.createUser).mockResolvedValue({ data: mockUsers[1] } as any);
        render(<UserManagement />);

        fireEvent.click(await screen.findByRole("button", { name: "+ Add User" }));

        fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: "New Staff" } });
        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "new@example.com" } });
        fireEvent.change(screen.getByLabelText(/role/i), { target: { value: "warehouse_staff" } });
        fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: "secret1234" } });
        fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "secret1234" } });

        fireEvent.click(screen.getByRole("button", { name: "Create User" }));

        await waitFor(() => {
            expect(inventoryApi.createUser).toHaveBeenCalledWith({
                name: "New Staff",
                email: "new@example.com",
                password: "secret1234",
                password_confirmation: "secret1234",
                role: "warehouse_staff",
            });
        });
    });
});
