import React, { useState } from "react";

export interface CopyBadgeProps {
    value: string;
    label?: string;
    className?: string;
}

export default function CopyBadge({ value, label, className = "" }: CopyBadgeProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch {
            // fallback
        }
    };

    return (
        <span
            className={`copy-badge ${className}`}
            onClick={handleCopy}
            title={`Click to copy: ${value}`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleCopy(e as unknown as React.MouseEvent);
                }
            }}
            aria-label={`Copy ${label || value}`}
        >
            <code>{label || value}</code>
            <span className="copy-badge__icon" aria-hidden="true">
                {copied ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                ) : (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                )}
            </span>
            {copied && <span className="copy-badge__tooltip" role="status">Copied!</span>}
        </span>
    );
}
