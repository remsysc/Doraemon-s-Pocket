import { useState, useEffect, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getCurrentUser, logout, type AuthUser } from "../lib/api";
import "../../css/dashboard.css";

interface DashboardLayoutProps {
    children: ReactNode;
}

interface NavSection {
    label?: string;
    items: { to: string; label: string }[];
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

    const navSections: NavSection[] = [
        {
            items: [{ to: "/dashboard", label: "Dashboard" }],
        },
        {
            label: "INVENTORY",
            items: [
                { to: "/categories", label: "Categories" },
                { to: "/products", label: "Products" },
                { to: "/lots", label: "Lots" },
                { to: "/transactions", label: "Transactions" },
            ],
        },
        ...(user?.role === "admin"
            ? [
                  {
                      label: "ADMINISTRATION",
                      items: [{ to: "/audit-logs", label: "Audit Logs" }],
                  },
              ]
            : []),
    ];

    return (
        <div className="layout">
            <aside className={`sidebar ${sidebarOpen ? "" : "sidebar--collapsed"}`}>
                <div className="sidebar__header">
                    <div className="sidebar__logo">
                        <span className="sidebar__brand--light">Walang</span>
                        <span className="sidebar__brand--bold">Brownout</span>
                    </div>
                    <div className="sidebar__title">Inventory Management</div>
                </div>

                <nav className="sidebar__nav">
                    {navSections.map((section, idx) => (
                        <div key={idx}>
                            {section.label && (
                                <div className="sidebar__section-label">
                                    {section.label}
                                </div>
                            )}
                            {section.items.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    className={({ isActive }) =>
                                        `sidebar__link ${isActive ? "sidebar__link--active" : ""}`
                                    }
                                >
                                    <span className="sidebar__link-label">{item.label}</span>
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </nav>

                <div className="sidebar__footer">
                    {user && (
                        <div className="sidebar__user">
                            <span className="sidebar__user-name">{user.name}</span>
                            <span className="sidebar__user-role">
                                {user.role.replace(/_/g, " ")}
                            </span>
                        </div>
                    )}
                    <button className="sidebar__logout" onClick={handleLogout}>
                        Sign out
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
                        &#9776;
                    </button>
                    <div className="topbar__right">
                        {user && (
                            <div className="topbar__profile">
                                <span className="topbar__avatar">
                                    {user.name.charAt(0).toUpperCase()}
                                </span>
                                <div className="topbar__user-info">
                                    <span className="topbar__user-name">{user.name}</span>
                                    <span className="topbar__user-role">
                                        {user.role.replace(/_/g, " ")}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                <main className="content">{children}</main>
            </div>
        </div>
    );
}
