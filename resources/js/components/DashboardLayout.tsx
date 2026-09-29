import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate, Outlet } from "react-router-dom";
import { getCurrentUser, logout, type AuthUser } from "../lib/api";
import "../../css/dashboard.css";

interface NavSection {
    label?: string;
    items: { to: string; label: string; icon: string }[];
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

/** Inline SVG icon set — avoids an icon library dependency. */
const Icons: Record<string, JSX.Element> = {
    dashboard: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
    ),
    categories: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
    ),
    products: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
    ),
    lots: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 8h14M5 12h14M5 16h6" /><rect x="3" y="4" width="18" height="16" rx="2" />
        </svg>
    ),
    stock: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
    ),
    transactions: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
        </svg>
    ),
    cycleCounts: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
    ),
    purchasing: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
    ),
    suppliers: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
    ),
    purchaseOrders: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
        </svg>
    ),
    reports: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
    ),
    users: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    auditLogs: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
        </svg>
    ),
    dataManagement: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
    ),
    signOut: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
        </svg>
    ),
    search: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    ),
    plus: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    ),
    clock: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
    ),
};

export default function DashboardLayout() {
    const navigate = useNavigate();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(
        () => typeof window === "undefined" || window.innerWidth > 760,
    );
    const [theme, setTheme] = useState<"dark" | "light">(getStoredTheme);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);

    const [quickAddOpen, setQuickAddOpen] = useState(false);
    const quickAddRef = useRef<HTMLDivElement>(null);

    const [searchOpen, setSearchOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setSearchOpen(true);
            }
            if (e.key === 'Escape') {
                setSearchOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setProfileMenuOpen(false);
            }
            if (quickAddRef.current && !quickAddRef.current.contains(event.target as Node)) {
                setQuickAddOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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
            items: [{ to: "/dashboard", label: "Dashboard", icon: "dashboard" }],
        },
        {
            label: "Inventory",
            items: [
                { to: "/categories", label: "Categories", icon: "categories" },
                { to: "/products", label: "Products", icon: "products" },
                { to: "/lots", label: "Lots", icon: "lots" },
                { to: "/stock", label: "Stock Overview", icon: "stock" },
                { to: "/transactions", label: "Transactions", icon: "transactions" },
                ...(user?.role === "admin" || user?.role === "warehouse_staff"
                    ? [{ to: "/cycle-counts", label: "Cycle Counts", icon: "cycleCounts" }]
                    : []),
            ],
        },
        ...(user?.role === "admin" || user?.role === "purchasing_manager"
            ? [
                  {
                      label: "Purchasing",
                      items: [
                          { to: "/purchasing", label: "Purchasing Analytics", icon: "purchasing" },
                          { to: "/suppliers", label: "Suppliers", icon: "suppliers" },
                          { to: "/purchase-orders", label: "Purchase Orders", icon: "purchaseOrders" },
                      ],
                  },
              ]
            : user?.role === "warehouse_staff"
              ? [
                    {
                        label: "Purchasing",
                        items: [{ to: "/purchase-orders", label: "Purchase Orders", icon: "purchaseOrders" }],
                    },
                ]
              : []),
        ...(user?.role === "admin"
            ? [
                  {
                      label: "Administration",
                      items: [
                          { to: "/reports", label: "Reports & Analytics", icon: "reports" },
                          { to: "/users", label: "User Management", icon: "users" },
                          { to: "/audit-logs", label: "Audit Logs", icon: "auditLogs" },
                          { to: "/data-management", label: "Data Management", icon: "dataManagement" },
                      ],
                  },
              ]
            : []),
    ];

    return (
        <div className="layout" data-theme={theme}>
            <aside
                id="primary-navigation"
                className={`sidebar ${sidebarOpen ? "" : "sidebar--collapsed"}`}
            >
                {/* Brand header */}
                <div className="sidebar__header">
                    {/* Doraemon face logomark */}
                    <svg
                        className="sidebar__logomark"
                        viewBox="0 0 80 80"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-label="Doraemon's Pocket logo"
                        style={{ width: 32, height: 32, borderRadius: 0, background: 'none', padding: 0 }}
                    >
                        {/* Head */}
                        <circle cx="40" cy="37" r="36" fill="#00A8E0" />
                        {/* White face oval */}
                        <ellipse cx="40" cy="51" rx="24" ry="20" fill="#fff" />
                        {/* Eyes */}
                        <circle cx="28" cy="30" r="9" fill="#fff" />
                        <circle cx="52" cy="30" r="9" fill="#fff" />
                        <circle cx="30" cy="31" r="5.5" fill="#111" />
                        <circle cx="54" cy="31" r="5.5" fill="#111" />
                        <circle cx="31.5" cy="29" r="2" fill="#fff" />
                        <circle cx="55.5" cy="29" r="2" fill="#fff" />
                        {/* Nose */}
                        <circle cx="40" cy="44" r="5" fill="#E0332E" />
                        {/* Mouth */}
                        <path d="M26 54 Q40 66 54 54" stroke="#111" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                        {/* Vertical line from nose to mouth */}
                        <line x1="40" y1="49" x2="40" y2="54" stroke="#111" strokeWidth="2" />
                        {/* Whiskers left */}
                        <line x1="5"  y1="44" x2="26" y2="48" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
                        <line x1="5"  y1="51" x2="26" y2="51" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
                        <line x1="5"  y1="58" x2="26" y2="54" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
                        {/* Whiskers right */}
                        <line x1="54" y1="48" x2="75" y2="44" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
                        <line x1="54" y1="51" x2="75" y2="51" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
                        <line x1="54" y1="54" x2="75" y2="58" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
                        {/* Red collar */}
                        <rect x="10" y="70" width="60" height="9" rx="4" fill="#E0332E" />
                        {/* Bell */}
                        <circle cx="40" cy="79" r="6" fill="#F5C400" />
                        <circle cx="40" cy="79" r="1.8" fill="#9A7D00" />
                        <line x1="34" y1="79" x2="46" y2="79" stroke="#9A7D00" strokeWidth="1.2" />
                    </svg>
                    <div className="sidebar__wordmark">
                        <div className="sidebar__logo">
                            <span className="sidebar__brand--light">Doraemon's </span>
                            <span className="sidebar__brand--bold">Pocket</span>
                        </div>
                        <div className="sidebar__title">Inventory</div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="sidebar__nav" aria-label="Main navigation">
                    <div className="sidebar__search-container">
                        <button className="sidebar__search-btn" onClick={() => setSearchOpen(true)}>
                            <span className="sidebar__link-icon">{Icons.search}</span>
                            <span className="sidebar__search-placeholder">Quick search...</span>
                            <span className="sidebar__search-shortcut">⌘K</span>
                        </button>
                    </div>

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
                                    title={item.label}
                                    className={({ isActive }) =>
                                        `sidebar__link ${isActive ? "sidebar__link--active" : ""}`
                                    }
                                    onClick={() => {
                                        if (window.innerWidth <= 760) {
                                            setSidebarOpen(false);
                                        }
                                    }}
                                >
                                    <span className="sidebar__link-icon">
                                        {Icons[item.icon]}
                                    </span>
                                    <span className="sidebar__link-label">{item.label}</span>
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </nav>

            </aside>

            {sidebarOpen && (
                <button
                    type="button"
                    className="sidebar-backdrop"
                    aria-label="Close navigation menu"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <div className="main-area">
                <header className="topbar">
                    <button
                        className="topbar__toggle"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        aria-label={sidebarOpen ? "Close navigation menu" : "Open navigation menu"}
                        aria-controls="primary-navigation"
                        aria-expanded={sidebarOpen}
                    >
                        {sidebarOpen ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        )}
                    </button>
                    <div className="topbar__right">
                        {user && (user.role === "admin" || user.role === "warehouse_staff" || user.role === "purchasing_manager") && (
                            <div className="topbar__profile-wrapper" ref={quickAddRef}>
                                <button
                                    className="topbar__theme-toggle"
                                    aria-label="Quick Add"
                                    title="Quick Add"
                                    aria-expanded={quickAddOpen}
                                    onClick={() => setQuickAddOpen(!quickAddOpen)}
                                >
                                    {Icons.plus}
                                </button>

                                {quickAddOpen && (
                                    <div className="topbar__dropdown">
                                        {user.role === "admin" && (
                                            <button className="topbar__dropdown-item" onClick={() => { setQuickAddOpen(false); navigate("/products"); }}>
                                                New Product
                                            </button>
                                        )}
                                        {(user.role === "admin" || user.role === "purchasing_manager") && (
                                            <>
                                                <button className="topbar__dropdown-item" onClick={() => { setQuickAddOpen(false); navigate("/purchase-orders"); }}>
                                                    New Purchase Order
                                                </button>
                                                <button className="topbar__dropdown-item" onClick={() => { setQuickAddOpen(false); navigate("/suppliers"); }}>
                                                    New Supplier
                                                </button>
                                            </>
                                        )}
                                        {(user.role === "admin" || user.role === "warehouse_staff") && (
                                            <>
                                                <button className="topbar__dropdown-item" onClick={() => { setQuickAddOpen(false); navigate("/lots"); }}>
                                                    Receive Lot
                                                </button>
                                                <button className="topbar__dropdown-item" onClick={() => { setQuickAddOpen(false); navigate("/cycle-counts"); }}>
                                                    Log Cycle Count
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            className="topbar__theme-toggle"
                            onClick={toggleTheme}
                            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                        >
                            {theme === "dark" ? (
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="5" />
                                    <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                                </svg>
                            ) : (
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                                </svg>
                            )}
                        </button>
                        <div className="topbar__divider" />
                        {user && (
                            <div className="topbar__profile-wrapper" ref={profileMenuRef}>
                                <button 
                                    className="topbar__profile"
                                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                                    aria-expanded={profileMenuOpen}
                                >
                                    <span className="topbar__avatar">
                                        {user.name.charAt(0).toUpperCase()}
                                    </span>
                                    <div className="topbar__user-info">
                                        <span className="topbar__user-name">{user.name}</span>
                                        <span className="topbar__user-role">
                                            {user.role.replace(/_/g, " ")}
                                        </span>
                                    </div>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, marginLeft: 4 }}>
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </button>

                                {profileMenuOpen && (
                                    <div className="topbar__dropdown">
                                        <button className="topbar__dropdown-item text-red" onClick={handleLogout}>
                                            {Icons.signOut}
                                            Sign out
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </header>

                <main className="content content--grid-bg"><Outlet /></main>
            </div>

            {searchOpen && (
                <div className="modal-overlay" onClick={() => setSearchOpen(false)}>
                    <div className="modal search-modal" onClick={e => e.stopPropagation()}>
                        <div className="search-modal__input-wrapper">
                            {Icons.search}
                            <input 
                                type="text" 
                                autoFocus 
                                placeholder="Search products, lots, or transactions..." 
                                className="search-modal__input"
                            />
                            <button className="search-modal__close" onClick={() => setSearchOpen(false)}>Esc</button>
                        </div>
                        <div className="search-modal__results">
                            <div className="search-modal__recent">
                                <div className="dashboard-section-title" style={{ padding: '0 20px', marginBottom: '8px' }}>Recent Searches</div>
                                <button className="search-modal__result-item">
                                    {Icons.clock}
                                    <span>Doraemon Figure (SKU-892)</span>
                                </button>
                                <button className="search-modal__result-item">
                                    {Icons.clock}
                                    <span>Anywhere Door</span>
                                </button>
                                <button className="search-modal__result-item">
                                    {Icons.clock}
                                    <span>LOT-4921</span>
                                </button>
                                <button className="search-modal__result-item">
                                    {Icons.clock}
                                    <span>TXN-0092</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
