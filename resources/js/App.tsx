import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login";
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
import DashboardLayout from "./components/DashboardLayout";

export default function App() {
    return (
        <ErrorBoundary>
            <BrowserRouter>
                <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<Login />} />

                    {/* Protected dashboard layout wrapper */}
                    <Route
                        element={
                            <ProtectedRoute>
                                <DashboardLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/categories" element={<Categories />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/lots" element={<Lots />} />
                        <Route path="/transactions" element={<Transactions />} />
                        <Route path="/stock" element={<StockOverview />} />
                        <Route
                            path="/cycle-counts"
                            element={
                                <RoleRoute allowedRoles={["admin", "warehouse_staff"]}>
                                    <CycleCounts />
                                </RoleRoute>
                            }
                        />
                        <Route
                            path="/purchasing"
                            element={
                                <RoleRoute allowedRoles={["admin", "purchasing_manager"]}>
                                    <PurchasingDashboard />
                                </RoleRoute>
                            }
                        />
                        <Route
                            path="/reports"
                            element={
                                <RoleRoute allowedRoles={["admin"]}>
                                    <Reports />
                                </RoleRoute>
                            }
                        />
                        <Route
                            path="/users"
                            element={
                                <RoleRoute allowedRoles={["admin"]}>
                                    <UserManagement />
                                </RoleRoute>
                            }
                        />
                        <Route
                            path="/audit-logs"
                            element={
                                <RoleRoute allowedRoles={["admin"]}>
                                    <AuditLogs />
                                </RoleRoute>
                            }
                        />

                        {/* Redirect root to dashboard */}
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </ErrorBoundary>
    );
}
