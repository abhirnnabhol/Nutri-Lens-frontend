import React from "react";

/**
 * Reusable Button component matching NutriLens mobile-first visual identity.
 * Variants: 'primary' (teal), 'secondary' (light teal), 'outline', 'danger', 'ghost'
 * Sizes: 'sm', 'md', 'lg'
 */
export default function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  disabled = false,
  type = "button",
  onClick,
  icon,
  ...props
}) {
  const baseClass = "nl-btn-core";
  const variantClass = `nl-btn-core--${variant}`;
  const sizeClass = `nl-btn-core--${size}`;
  const widthClass = fullWidth ? "nl-btn-core--full" : "";

  return (
    <button
      type={type}
      className={`${baseClass} ${variantClass} ${sizeClass} ${widthClass} ${className}`.trim()}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {icon && <span className="nl-btn-core__icon">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}
