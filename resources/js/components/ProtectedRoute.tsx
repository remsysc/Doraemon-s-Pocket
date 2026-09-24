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
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-slate-900 text-slate-300">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-medium text-slate-400">Verifying session...</span>
                </div>
            </div>
        );
    }

    if (!authenticated) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return <>{children}</>;
}
