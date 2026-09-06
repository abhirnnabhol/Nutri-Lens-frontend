import React, { useEffect } from "react";

/**
 * Reusable Modal / Bottom-Sheet component.
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = "400px",
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="nl-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="nl-modal-container"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="nl-modal-header">
          {title && <h3 className="nl-modal-title">{title}</h3>}
          <button
            type="button"
            className="nl-modal-close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        <div className="nl-modal-body">{children}</div>

        {footer && <div className="nl-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
