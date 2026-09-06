import React from "react";

/**
 * Reusable LoadingState component for async operations.
 */
export default function LoadingState({
  message = "Loading...",
  fullScreen = false,
  className = "",
}) {
  return (
    <div
      className={`nl-loading-state ${
        fullScreen ? "nl-loading-state--fullscreen" : ""
      } ${className}`.trim()}
    >
      <div className="nl-loading-spinner" />
      {message && <p className="nl-loading-message">{message}</p>}
    </div>
  );
}
