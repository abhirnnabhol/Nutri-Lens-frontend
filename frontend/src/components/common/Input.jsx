import React, { useState } from "react";

/**
 * Reusable Input component with optional leading icon, label, error state, and password visibility toggle.
 */
export default function Input({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  icon,
  required = false,
  className = "",
  id,
  name,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const effectiveType = isPassword
    ? showPassword
      ? "text"
      : "password"
    : type;
  const inputId =
    id ||
    name ||
    (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className={`nl-input-group ${className}`.trim()}>
      {label && (
        <label htmlFor={inputId} className="nl-field__label">
          {label}{" "}
          {required && (
            <span style={{ color: "var(--nl-badge-poor-text)" }}>*</span>
          )}
        </label>
      )}

      <div
        className={`nl-field__input-wrap ${
          icon ? "nl-field__input-wrap--has-icon" : ""
        } ${isPassword ? "nl-field__input-wrap--has-toggle" : ""}`}
      >
        {icon && <span className="nl-field__icon">{icon}</span>}

        <input
          id={inputId}
          name={name}
          type={effectiveType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`nl-input ${error ? "nl-input--error" : ""}`}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            className="nl-field__toggle"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
      </div>

      {error && <span className="nl-input-error-msg">{error}</span>}
    </div>
  );
}
