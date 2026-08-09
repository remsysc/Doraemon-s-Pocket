import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getCurrentUser } from "../lib/api";

interface ProtectedRouteProps {
    children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const location = useLocation();
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);

    useEffect(() => {
        let active = true;

        getCurrentUser()
            .then(() => {
                if (active) {
                    setAuthenticated(true);
                }
            })
            .catch(() => {
                if (active) {
                    setAuthenticated(false);
                }
            })
            .finally(() => {
                if (active) {
                    setCheckingAuth(false);
                }
            });

        return () => {
            active = false;
        };
    }, []);

    if (checkingAuth) {
        return <div>Checking your session...</div>;
    }

    if (!authenticated) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return <>{children}</>;
}
