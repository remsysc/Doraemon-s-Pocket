import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/Dashboard";
import Categories from "./pages/Categories";
import Products from "./pages/Products";
import Lots from "./pages/Lots";
import Transactions from "./pages/Transactions";
import StockOverview from "./pages/StockOverview";
import PurchasingDashboard from "./pages/PurchasingDashboard";
import AuditLogs from "./pages/AuditLogs";
import CycleCounts from "./pages/CycleCounts";
import Reports from "./pages/Reports";
import UserManagement from "./pages/UserManagement";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import ErrorBoundary from "./components/ErrorBoundary";

export default function App() {
    return (
        <ErrorBoundary>
            <BrowserRouter>
                <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected routes */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/categories"
                    element={
                        <ProtectedRoute>
                            <Categories />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/products"
                    element={
                        <ProtectedRoute>
                            <Products />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/lots"
                    element={
                        <ProtectedRoute>
                            <Lots />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/transactions"
                    element={
                        <ProtectedRoute>
                            <Transactions />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/stock"
                    element={
                        <ProtectedRoute>
                            <StockOverview />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/cycle-counts"
                    element={
                        <ProtectedRoute>
                            <RoleRoute allowedRoles={["admin", "warehouse_staff"]}>
                                <CycleCounts />
                            </RoleRoute>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/purchasing"
                    element={
                        <ProtectedRoute>
                            <RoleRoute allowedRoles={["admin", "purchasing_manager"]}>
                                <PurchasingDashboard />
                            </RoleRoute>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/reports"
                    element={
                        <ProtectedRoute>
                            <RoleRoute allowedRoles={["admin"]}>
                                <Reports />
                            </RoleRoute>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/users"
                    element={
                        <ProtectedRoute>
                            <RoleRoute allowedRoles={["admin"]}>
                                <UserManagement />
                            </RoleRoute>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/audit-logs"
                    element={
                        <ProtectedRoute>
                            <RoleRoute allowedRoles={["admin"]}>
                                <AuditLogs />
                            </RoleRoute>
                        </ProtectedRoute>
                    }
                />

                {/* Redirect root to dashboard */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </BrowserRouter>
        </ErrorBoundary>
    );
}
