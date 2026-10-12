import React, { useEffect, useRef } from "react";

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    size?: "sm" | "md" | "lg" | "wide";
    className?: string;
}

export default function Modal({
    isOpen,
    onClose,
    title,
    subtitle,
    children,
    size = "md",
    className = "",
}: ModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLElement | null>(null);

    // Save active element when modal opens, restore on close
    useEffect(() => {
        if (isOpen) {
            triggerRef.current = document.activeElement as HTMLElement | null;
        } else if (triggerRef.current) {
            triggerRef.current.focus();
        }
    }, [isOpen]);

    // Handle Escape and Tab focus trapping
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                onClose();
                return;
            }

            if (e.key === "Tab") {
                if (!modalRef.current) return;
                const focusable = modalRef.current.querySelectorAll<HTMLElement>(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                if (focusable.length === 0) return;

                const first = focusable[0];
                const last = focusable[focusable.length - 1];

                if (e.shiftKey) {
                    if (document.activeElement === first) {
                        last.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === last) {
                        first.focus();
                        e.preventDefault();
                    }
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        // Lock background scroll
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        // Initial focus to first focusable element inside modal
        const timer = setTimeout(() => {
            if (modalRef.current) {
                const firstFocusable = modalRef.current.querySelector<HTMLElement>(
                    'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])'
                );
                if (firstFocusable) {
                    firstFocusable.focus();
                } else {
                    modalRef.current.focus();
                }
            }
        }, 30);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = originalOverflow;
            clearTimeout(timer);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizeClass = size === "wide" || size === "lg" ? "modal--wide" : size === "sm" ? "modal--sm" : "";

    return (
        <div
            className="modal-overlay"
            onClick={onClose}
            role="presentation"
        >
            <div
                ref={modalRef}
                className={`modal ${sizeClass} ${className}`}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="wb-modal-title"
                tabIndex={-1}
            >
                <div className="modal__header">
                    <div>
                        <h2 id="wb-modal-title">{title}</h2>
                        {subtitle && <p className="modal__subtitle">{subtitle}</p>}
                    </div>
                    <button
                        type="button"
                        className="modal__close"
                        onClick={onClose}
                        aria-label="Close dialog"
                    >
                        ✕
                    </button>
                </div>
                <div className="modal__content">
                    {children}
                </div>
            </div>
        </div>
    );
}
