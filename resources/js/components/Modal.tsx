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
    const prevIsOpenRef = useRef(false);
    const onCloseRef = useRef(onClose);

    useEffect(() => {
        onCloseRef.current = onClose;
    });

    // Save active element when modal opens, restore on close
    useEffect(() => {
        if (isOpen && !prevIsOpenRef.current) {
            triggerRef.current = document.activeElement as HTMLElement | null;
        } else if (!isOpen && prevIsOpenRef.current && triggerRef.current) {
            triggerRef.current.focus();
        }
        prevIsOpenRef.current = isOpen;
    }, [isOpen]);

    // Initial focus to first editable field in modal content ONCE on open
    useEffect(() => {
        if (!isOpen) return;

        const timer = setTimeout(() => {
            if (modalRef.current) {
                // If user is already focused on an element inside this modal, don't steal focus
                if (
                    document.activeElement &&
                    modalRef.current.contains(document.activeElement)
                ) {
                    return;
                }

                // Prefer first editable field in content over the close button
                const contentInput = modalRef.current.querySelector<HTMLElement>(
                    '.modal__content input:not([disabled]), .modal__content select:not([disabled]), .modal__content textarea:not([disabled])'
                );
                if (contentInput) {
                    contentInput.focus();
                } else {
                    const firstFocusable = modalRef.current.querySelector<HTMLElement>(
                        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
                    );
                    if (firstFocusable) {
                        firstFocusable.focus();
                    } else {
                        modalRef.current.focus();
                    }
                }
            }
        }, 30);

        return () => clearTimeout(timer);
    }, [isOpen]);

    // Handle Escape and Tab focus trapping & background scroll lock
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                onCloseRef.current();
                return;
            }

            if (e.key === "Tab") {
                if (!modalRef.current) return;
                const focusable = modalRef.current.querySelectorAll<HTMLElement>(
                    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
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

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = originalOverflow;
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const sizeClass =
        size === "lg"
            ? "modal--lg"
            : size === "wide"
            ? "modal--wide"
            : size === "sm"
            ? "modal--sm"
            : "";

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
