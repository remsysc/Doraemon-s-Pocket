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
        return <div>Checking permissions...</div>;
    }

    if (!user || !allowedRoles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
}
