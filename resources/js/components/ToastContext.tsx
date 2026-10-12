import React, { createContext, useContext, useState, useCallback, useId } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextValue {
    toast: {
        success: (message: string) => void;
        error: (message: string) => void;
        info: (message: string) => void;
        warning: (message: string) => void;
    };
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const addToast = useCallback((message: string, type: ToastType) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const value: ToastContextValue = {
        toast: {
            success: (msg: string) => addToast(msg, "success"),
            error: (msg: string) => addToast(msg, "error"),
            info: (msg: string) => addToast(msg, "info"),
            warning: (msg: string) => addToast(msg, "warning"),
        },
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div
                className="wb-toast-container"
                aria-live="polite"
                aria-atomic="false"
            >
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        role="status"
                        className={`wb-toast wb-toast--${t.type}`}
                        onClick={() => removeToast(t.id)}
                    >
                        <span className="wb-toast__icon">
                            {t.type === "success" && (
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            )}
                            {t.type === "error" && (
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="15" y1="9" x2="9" y2="15" />
                                    <line x1="9" y1="9" x2="15" y2="15" />
                                </svg>
                            )}
                            {t.type === "warning" && (
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                    <line x1="12" y1="9" x2="12" y2="13" />
                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                            )}
                            {t.type === "info" && (
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="16" x2="12" y2="12" />
                                    <line x1="12" y1="8" x2="12.01" y2="8" />
                                </svg>
                            )}
                        </span>
                        <span className="wb-toast__message">{t.message}</span>
                        <button
                            type="button"
                            className="wb-toast__close"
                            aria-label="Dismiss notification"
                            onClick={(e) => {
                                e.stopPropagation();
                                removeToast(t.id);
                            }}
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

const fallbackToast: ToastContextValue = {
    toast: {
        success: () => "",
        error: () => "",
        info: () => "",
        warning: () => "",
    },
    removeToast: () => {},
};

export function useToast(): ToastContextValue {
    const context = useContext(ToastContext);
    if (!context) {
        return fallbackToast;
    }
    return context;
}
