import React, { useRef, useEffect } from "react";
import Modal from "./Modal";

export interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string | React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "danger" | "primary" | "warning";
    loading?: boolean;
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    variant = "danger",
    loading = false,
}: ConfirmModalProps) {
    const cancelBtnRef = useRef<HTMLButtonElement>(null);

    // Auto-focus cancel button for safe keyboard navigation
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                cancelBtnRef.current?.focus();
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const confirmBtnClass =
        variant === "danger"
            ? "btn btn--danger"
            : variant === "warning"
            ? "btn btn--warning"
            : "btn btn--primary";

    return (
        <Modal
            isOpen={isOpen}
            onClose={loading ? () => {} : onClose}
            title={title}
            size="sm"
            className="confirm-modal"
        >
            <div className="confirm-modal__body">
                {typeof message === "string" ? (
                    <p className="confirm-modal__message">{message}</p>
                ) : (
                    message
                )}
            </div>

            <div className="modal__actions">
                <button
                    ref={cancelBtnRef}
                    type="button"
                    className="btn btn--secondary"
                    onClick={onClose}
                    disabled={loading}
                >
                    {cancelLabel}
                </button>
                <button
                    type="button"
                    className={confirmBtnClass}
                    onClick={onConfirm}
                    disabled={loading}
                >
                    {loading ? "Processing..." : confirmLabel}
                </button>
            </div>
        </Modal>
    );
}
