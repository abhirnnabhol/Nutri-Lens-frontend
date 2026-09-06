import React from "react";
import Button from "./Button";

/**
 * Reusable ErrorState component with message and optional retry callback.
 */
export default function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Try Again",
  className = "",
}) {
  return (
    <div className={`nl-error-state ${className}`.trim()}>
      <div className="nl-error-state__icon">⚠️</div>
      <h3 className="nl-error-state__title">{title}</h3>
      {message && <p className="nl-error-state__message">{message}</p>}
      {onRetry && (
        <Button variant="primary" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
