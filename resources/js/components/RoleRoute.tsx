import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getCurrentUser, type AuthUser } from "../lib/api";

interface RoleRouteProps {
    children: ReactNode;
    allowedRoles: string[];
}

export default function RoleRoute({ children, allowedRoles }: RoleRouteProps) {
    const [checking, setChecking] = useState(true);
    const [user, setUser] = useState<AuthUser | null>(null);

    useEffect(() => {
        let active = true;

        getCurrentUser()
            .then((res) => {
                if (active) setUser(res.data);
            })
            .catch(() => {
                if (active) setUser(null);
            })
            .finally(() => {
                if (active) setChecking(false);
            });

        return () => { active = false; };
    }, []);

    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-slate-900 text-slate-300">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-medium text-slate-400">Verifying role permissions...</span>
                </div>
            </div>
        );
    }

    if (!user || !allowedRoles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
}
