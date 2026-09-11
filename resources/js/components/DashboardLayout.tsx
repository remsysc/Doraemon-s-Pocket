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

function getStoredTheme(): "dark" | "light" {
    try {
        const stored = localStorage.getItem("wb-theme");
        if (stored === "light" || stored === "dark") return stored;
    } catch {
        // localStorage unavailable
    }
    return "dark";
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const navigate = useNavigate();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [theme, setTheme] = useState<"dark" | "light">(getStoredTheme);

    useEffect(() => {
        getCurrentUser()
            .then((res) => setUser(res.data))
            .catch(() => navigate("/login"));
    }, [navigate]);

    useEffect(() => {
        try {
            localStorage.setItem("wb-theme", theme);
        } catch {
            // localStorage unavailable
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === "dark" ? "light" : "dark"));
    };

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
                { to: "/stock", label: "Stock Overview" },
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
        <div className="layout" data-theme={theme}>
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
                        <button
                            className="topbar__theme-toggle"
                            onClick={toggleTheme}
                            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                        >
                            {theme === "dark" ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="5" />
                                    <line x1="12" y1="1" x2="12" y2="3" />
                                    <line x1="12" y1="21" x2="12" y2="23" />
                                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                    <line x1="1" y1="12" x2="3" y2="12" />
                                    <line x1="21" y1="12" x2="23" y2="12" />
                                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                                </svg>
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                                </svg>
                            )}
                        </button>
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

                <main className="content content--grid-bg">{children}</main>
            </div>
        </div>
    );
}
