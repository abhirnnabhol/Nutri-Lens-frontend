import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import Button from "./Button";
import ScoreBadge from "./ScoreBadge";

/**
 * Reusable Comparison Tray Component (Step 9)
 *
 * Displays:
 * - Selected products count (e.g. "Selected products: 3")
 * - List of selected products (Product A, Product B, Product C)
 * - Actions:
 *   - Remove (individual)
 *   - Add another product
 *   - Compare Now
 *   - Clear All
 *
 * Can be used as a fixed floating tray across pages or inline inside Scanner/Search.
 */
export default function ComparisonTray({
  inline = false,
  onAddAnother = null,
  style = {},
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedProducts, removeProductFromCompare, clearSelectedProducts } =
    useApp();

  const [expanded, setExpanded] = useState(true);

  // If no products selected, don't show the tray
  if (!selectedProducts || selectedProducts.length === 0) {
    return null;
  }

  // If on the /compare page, don't overlay the floating tray (full page handles it)
  if (!inline && location.pathname === "/compare") {
    return null;
  }

  const handleAddAnother = () => {
    if (onAddAnother) {
      onAddAnother();
    } else {
      navigate("/scan");
    }
  };

  const handleCompareNow = () => {
    navigate("/compare");
  };

  const trayContent = (
    <div
      className="nl-comparison-tray"
      style={{
        background: "#ffffff",
        border: "1px solid var(--nl-border, #e2e8f0)",
        borderRadius: "var(--nl-radius-lg, 16px)",
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.16)",
        overflow: "hidden",
        width: "100%",
        maxWidth: inline ? "100%" : "480px",
        margin: "0 auto",
        transition: "all 0.25s ease",
        ...style,
      }}
    >
      {/* Tray Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
          color: "#ffffff",
          padding: "10px 14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          onClick={() => setExpanded(!expanded)}
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            userSelect: "none",
          }}
        >
          <span
            style={{
              background: "#ffffff",
              color: "#0f766e",
              fontWeight: 800,
              fontSize: "0.74rem",
              borderRadius: "12px",
              padding: "2px 8px",
            }}
          >
            {selectedProducts.length}
          </span>
          <span
            style={{
              fontWeight: 800,
              fontSize: "0.86rem",
              letterSpacing: "0.2px",
            }}
          >
            Selected products: {selectedProducts.length}
          </span>
          <span
            style={{
              fontSize: "0.7rem",
              opacity: 0.8,
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          >
            ▼
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={clearSelectedProducts}
            style={{
              background: "rgba(255,255,255,0.18)",
              border: "none",
              color: "#ffffff",
              fontSize: "0.72rem",
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
            title="Clear all products from tray"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Tray Body (Expanded) */}
      {expanded && (
        <div style={{ padding: "12px 14px", background: "#f8fafc" }}>
          {/* Selected Products List */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              maxHeight: "180px",
              overflowY: "auto",
              marginBottom: "12px",
              paddingRight: "2px",
            }}
          >
            {selectedProducts.map((product, idx) => {
              const scoreNum =
                product.health_score !== undefined &&
                product.health_score !== null
                  ? Math.round(product.health_score)
                  : product.score_evaluation?.score !== undefined
                    ? Math.round(product.score_evaluation.score)
                    : null;

              return (
                <div
                  key={product.id || idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    padding: "8px 10px",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 800,
                        color: "#0f766e",
                        background: "#ccfbf1",
                        borderRadius: "50%",
                        width: "20px",
                        height: "20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: "0.82rem",
                          color: "#1e293b",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {product.name || "Unnamed Product"}
                      </div>
                      <div
                        style={{
                          fontSize: "0.7rem",
                          color: "#64748b",
                        }}
                      >
                        {product.is_scanned
                          ? "📷 Scanned"
                          : product.brand || "Catalog"}
                        {scoreNum !== null && ` • Score: ${scoreNum}/100`}
                      </div>
                    </div>
                  </div>

                  {scoreNum !== null && (
                    <ScoreBadge score={scoreNum} size="sm" />
                  )}

                  <button
                    type="button"
                    onClick={() => removeProductFromCompare(product.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#94a3b8",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "4px",
                    }}
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "8px" }}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              style={{ flex: 1, fontSize: "0.78rem" }}
              onClick={handleAddAnother}
            >
              ＋ Add another product
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              style={{ flex: 1, fontSize: "0.78rem", fontWeight: 800 }}
              onClick={handleCompareNow}
            >
              Compare Now ({selectedProducts.length}) →
            </Button>
          </div>
        </div>
      )}

      {/* Minimized Bar Actions */}
      {!expanded && (
        <div
          style={{
            padding: "8px 14px",
            background: "#ffffff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
            Tap to view {selectedProducts.length} items
          </span>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleCompareNow}
            style={{ fontSize: "0.75rem", padding: "4px 12px" }}
          >
            Compare Now →
          </Button>
        </div>
      )}
    </div>
  );

  // If inline, render normally in place
  if (inline) {
    return (
      <div style={{ marginTop: "16px", marginBottom: "16px" }}>
        {trayContent}
      </div>
    );
  }

  // Floating dock mode: fixed above the bottom navigation bar
  return (
    <div
      style={{
        position: "fixed",
        bottom: "74px", // Sits just above bottom nav
        left: 0,
        right: 0,
        padding: "0 12px",
        zIndex: 900,
        pointerEvents: "none",
      }}
    >
      <div style={{ pointerEvents: "auto" }}>{trayContent}</div>
    </div>
  );
}
