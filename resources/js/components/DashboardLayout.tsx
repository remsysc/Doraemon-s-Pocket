import { useState, useEffect, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getCurrentUser, logout, type AuthUser } from "../lib/api";
import "../../css/dashboard.css";

interface DashboardLayoutProps {
    children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const navigate = useNavigate();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        getCurrentUser()
            .then((res) => setUser(res.data))
            .catch(() => navigate("/login"));
    }, [navigate]);

    const handleLogout = async () => {
        try {
            await logout();
        } finally {
            navigate("/login");
        }
    };

    const navItems = [
        { to: "/dashboard", icon: "📊", label: "Dashboard" },
        { to: "/categories", icon: "📁", label: "Categories" },
        { to: "/products", icon: "📦", label: "Products" },
        { to: "/lots", icon: "🏷️", label: "Lots" },
        { to: "/transactions", icon: "📋", label: "Transactions" },
    ];

    return (
        <div className="layout">
            <aside className={`sidebar ${sidebarOpen ? "" : "sidebar--collapsed"}`}>
                <div className="sidebar__header">
                    <span className="sidebar__logo">⚡</span>
                    {sidebarOpen && <h1 className="sidebar__title">WalangBrownout</h1>}
                </div>

                <nav className="sidebar__nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `sidebar__link ${isActive ? "sidebar__link--active" : ""}`
                            }
                        >
                            <span className="sidebar__link-icon">{item.icon}</span>
                            {sidebarOpen && (
                                <span className="sidebar__link-label">{item.label}</span>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar__footer">
                    {user && sidebarOpen && (
                        <div className="sidebar__user">
                            <span className="sidebar__user-name">{user.name}</span>
                            <span className="sidebar__user-role">
                                {user.role.replace("_", " ")}
                            </span>
                        </div>
                    )}
                    <button className="sidebar__logout" onClick={handleLogout}>
                        {sidebarOpen ? "Logout" : "🚪"}
                    </button>
                </div>
            </aside>

            <div className="main-area">
                <header className="topbar">
                    <button
                        className="topbar__toggle"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        aria-label="Toggle sidebar"
                    >
                        ☰
                    </button>
                    <div className="topbar__right">
                        {user && (
                            <span className="topbar__greeting">
                                Hello, {user.name}
                            </span>
                        )}
                    </div>
                </header>

                <main className="content">{children}</main>
            </div>
        </div>
    );
}
