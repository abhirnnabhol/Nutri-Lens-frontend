import React from "react";
import { useNavigate } from "react-router-dom";
import ScoreBadge, { getScoreLevel } from "./ScoreBadge";

const CATEGORY_EMOJIS = {
  snacks: "🍿",
  chocolates: "🍫",
  "soft-drinks": "🥤",
  dairy: "🥛",
  "packaged-food": "🥫",
  beverages: "🧃",
};

export default function ProductCard({
  product,
  onClick,
  onSelect,
  isSelected = false,
  showCompareToggle = true,
  className = "",
}) {
  const navigate = useNavigate();

  if (!product) return null;

  const handleCardClick = () => {
    if (onClick) {
      onClick(product);
    } else if (product.id) {
      navigate(`/product/${product.id}`);
    }
  };

  const handleToggleSelect = (e) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(product);
    }
  };

  const scoreNum =
    product.health_score !== undefined && product.health_score !== null
      ? Math.round(Number(product.health_score))
      : typeof product.score === "number"
        ? product.score
        : null;

  const categorySlug = product.category_slug || "";
  const emoji = CATEGORY_EMOJIS[categorySlug] || "🥗";
  const categoryName = product.category_name || product.category || "General";

  const calories =
    product.calories !== undefined
      ? `${Math.round(product.calories)} kcal`
      : "—";
  const sugar =
    product.total_sugar !== undefined ? `${product.total_sugar}g` : "—";
  const protein = product.protein !== undefined ? `${product.protein}g` : "—";
  const sodium =
    product.sodium !== undefined ? `${Math.round(product.sodium)}mg` : "—";

  return (
    <div
      className={`nl-product-card ${isSelected ? "nl-product-card--selected" : ""} ${className}`.trim()}
    >
      {/* Top Header: Category Tag & Health Score Badge */}
      <div className="nl-product-card__header">
        <span className="nl-product-card__category-tag">{categoryName}</span>
        {scoreNum !== null ? (
          <ScoreBadge score={scoreNum} showScore />
        ) : (
          <span className="nl-badge nl-badge--moderate">Pending</span>
        )}
      </div>

      {/* Main Row: Thumbnail + Product Name & Brand */}
      <div
        className="nl-product-card__main"
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
      >
        <div className="nl-product-card__thumb">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} />
          ) : (
            <span>{emoji}</span>
          )}
        </div>

        <div className="nl-product-card__details">
          <h3 className="nl-product-card__name" title={product.name}>
            {product.name}
          </h3>
          <div className="nl-product-card__brand">
            {product.brand}{" "}
            {product.serving_size ? `• ${product.serving_size}` : ""}
          </div>
        </div>
      </div>

      {/* Nutrition Information Bar */}
      <div className="nl-product-card__nutrition">
        <div className="nl-product-card__nutri-item">
          <span className="nl-product-card__nutri-label">Cal</span>
          <span className="nl-product-card__nutri-val">{calories}</span>
        </div>
        <div className="nl-product-card__nutri-item">
          <span className="nl-product-card__nutri-label">Sugar</span>
          <span className="nl-product-card__nutri-val">{sugar}</span>
        </div>
        <div className="nl-product-card__nutri-item">
          <span className="nl-product-card__nutri-label">Protein</span>
          <span className="nl-product-card__nutri-val">{protein}</span>
        </div>
        <div className="nl-product-card__nutri-item">
          <span className="nl-product-card__nutri-label">Sodium</span>
          <span className="nl-product-card__nutri-val">{sodium}</span>
        </div>
      </div>

      {/* Bottom Action: Multi-Product Selection for Comparison */}
      {showCompareToggle && (
        <div className="nl-product-card__actions">
          <button
            type="button"
            className={`nl-compare-select-btn ${isSelected ? "nl-compare-select-btn--active" : ""}`}
            onClick={handleToggleSelect}
          >
            {isSelected ? (
              <>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Selected</span>
              </>
            ) : (
              <>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Add to Compare</span>
              </>
            )}
          </button>

          <button
            type="button"
            className="nl-link-teal"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "0.82rem",
              fontWeight: 700,
            }}
            onClick={handleCardClick}
          >
            Details →
          </button>
        </div>
      )}
    </div>
  );
}
