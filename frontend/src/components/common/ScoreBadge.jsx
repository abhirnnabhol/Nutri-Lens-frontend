import React from "react";

/**
 * Color-coded Health Score Badge component.
 * Levels:
 * - 'good' (80-100) -> green
 * - 'moderate' (60-79) -> teal
 * - 'fair' (40-59) -> amber
 * - 'poor' (0-39) -> red
 */
export function getScoreLevel(score) {
  if (typeof score !== "number") return "moderate";
  if (score >= 80) return "good";
  if (score >= 60) return "moderate";
  if (score >= 40) return "fair";
  return "poor";
}

export default function ScoreBadge({
  score,
  label,
  level,
  showScore = false,
  className = "",
}) {
  const effectiveLevel =
    level || (typeof score === "number" ? getScoreLevel(score) : "moderate");
  const displayText =
    label || effectiveLevel.charAt(0).toUpperCase() + effectiveLevel.slice(1);

  return (
    <span
      className={`nl-badge nl-badge--${effectiveLevel} ${className}`.trim()}
    >
      {showScore && typeof score === "number" && `${score}/100 `}
      {displayText}
    </span>
  );
}
