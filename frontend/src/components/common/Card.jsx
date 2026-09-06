import React from "react";

/**
 * Reusable Card component matching NutriLens rounded card design.
 */
export default function Card({
  children,
  className = "",
  hoverable = false,
  padding = "normal", // 'none' | 'sm' | 'normal' | 'lg'
  onClick,
  ...props
}) {
  const hoverClass = hoverable ? "nl-card--hoverable" : "";
  const paddingClass = `nl-card--pad-${padding}`;

  return (
    <div
      className={`nl-card ${hoverClass} ${paddingClass} ${className}`.trim()}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}
