import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import ScoreBadge from "../components/common/ScoreBadge";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import { useApp } from "../context/AppContext";
import apiClient from "../services/api";

const CATEGORY_ICONS = {
  snacks: "🍿",
  chocolates: "🍫",
  "soft-drinks": "🥤",
  dairy: "🥛",
  "packaged-food": "🥫",
  beverages: "🧃",
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    toggleProductSelection,
    isProductSelected,
    setSelectedProducts,
    selectedProducts,
  } = useApp();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    // Check if scanned product was passed directly in router state
    if (location.state?.scannedProduct) {
      setProduct(location.state.scannedProduct);
      setLoading(false);
      return;
    }

    // Check if product is an offline scanned product in selectedProducts
    if (String(id).startsWith("scanned-")) {
      const found = (selectedProducts || []).find(
        (p) => String(p.id) === String(id),
      );
      if (found) {
        setProduct(found);
        setLoading(false);
        return;
      }
    }

    apiClient
      .get(`/products/${id}`)
      .then((res) => {
        if (!isMounted) return;
        if (res.data) {
          setProduct(res.data);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || "Failed to load product details.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleCompareClick = () => {
    if (product) {
      if (!isProductSelected(product.id)) {
        toggleProductSelection(product);
      }
      navigate("/compare");
    }
  };

  if (loading) {
    return (
      <div
        className="nl-search-page"
        style={{
          padding: "48px 16px",
          textAlign: "center",
          color: "var(--nl-text-muted)",
        }}
      >
        Loading product information...
      </div>
    );
  }

  if (error || !product) {
    return (
      <div
        className="nl-search-page"
        style={{ padding: "48px 16px", textAlign: "center" }}
      >
        <p style={{ fontWeight: 700, color: "#991b1b", marginBottom: "12px" }}>
          {error || "Product not found."}
        </p>
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          ← Go Back
        </Button>
      </div>
    );
  }

  const scoreNum =
    product.health_score !== undefined && product.health_score !== null
      ? Math.round(Number(product.health_score))
      : 65;

  const emoji = CATEGORY_ICONS[product.category_slug] || "🥗";
  const isSelected = isProductSelected(product.id);

  // Ingredients formatting
  const ingredientNames = Array.isArray(product.ingredients)
    ? product.ingredients.map((ing) =>
        typeof ing === "string" ? ing : ing.name,
      )
    : [];

  return (
    <div className="nl-search-page" style={{ paddingBottom: "90px" }}>
      {/* Top Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <button
          type="button"
          className="nl-chip"
          onClick={() => navigate(-1)}
          style={{ cursor: "pointer" }}
        >
          ← Back
        </button>
        <span className="nl-product-card__category-tag">
          {product.category_name || "Food Product"}
        </span>
      </div>

      {/* Product Hero Card */}
      <Card style={{ textAlign: "center", marginBottom: "16px" }}>
        <div
          className="nl-product-card__thumb"
          style={{
            margin: "0 auto 12px",
            width: "68px",
            height: "68px",
            fontSize: "2rem",
          }}
        >
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} />
          ) : (
            <span>{emoji}</span>
          )}
        </div>

        <h1
          style={{
            fontSize: "1.3rem",
            fontWeight: 800,
            color: "var(--nl-text-main)",
            marginBottom: "4px",
            lineHeight: 1.3,
          }}
        >
          {product.name}
        </h1>

        <p
          style={{
            color: "var(--nl-text-sub)",
            fontSize: "0.88rem",
            marginBottom: "12px",
          }}
        >
          {product.brand}{" "}
          {product.serving_size ? `• Serving: ${product.serving_size}` : ""}
        </p>

        <div
          style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}
        >
          <ScoreBadge score={scoreNum} showScore />
        </div>
      </Card>

      {/* Personalized Insights Card */}
      {product.personalizedInsight?.hasInsight && (
        <Card
          style={{
            marginBottom: "16px",
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <h3
              style={{
                fontSize: "0.95rem",
                fontWeight: 700,
                margin: 0,
                color: "#1d4ed8",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>🎯</span> Personalized Insights
            </h3>
            {product.personalizedInsight.profileFactors?.length > 0 && (
              <span
                style={{
                  fontSize: "0.7rem",
                  color: "#1d4ed8",
                  background: "#dbeafe",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontWeight: 600,
                }}
              >
                {product.personalizedInsight.profileFactors[0]}
              </span>
            )}
          </div>

          {product.personalizedInsight.notices?.map((notice, nIdx) => (
            <p
              key={`pn-${nIdx}`}
              style={{
                margin: "0 0 6px 0",
                color: "#1e3a8a",
                fontSize: "0.85rem",
                lineHeight: 1.45,
                fontWeight: 500,
              }}
            >
              {notice}
            </p>
          ))}

          {product.personalizedInsight.recommendations?.map((rec, rIdx) => (
            <p
              key={`pr-${rIdx}`}
              style={{
                margin: "0 0 6px 0",
                color: "#1e40af",
                fontSize: "0.85rem",
                fontStyle: "italic",
                lineHeight: 1.45,
              }}
            >
              "{rec}"
            </p>
          ))}

          <div
            style={{
              fontSize: "0.7rem",
              color: "#64748b",
              borderTop: "1px solid #dbeafe",
              paddingTop: "6px",
              marginTop: "6px",
            }}
          >
            ℹ️ {product.personalizedInsight.disclaimer}
          </div>
        </Card>
      )}

      {/* Nutrition Facts Preview */}
      <Card style={{ marginBottom: "16px" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "12px" }}>
          Nutrition Facts (per serving: {product.serving_size || "100g"})
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
            fontSize: "0.88rem",
          }}
        >
          <div
            style={{
              padding: "10px",
              background: "#f8faf9",
              borderRadius: "8px",
            }}
          >
            <span
              style={{
                fontSize: "0.74rem",
                color: "var(--nl-text-muted)",
                display: "block",
              }}
            >
              Calories
            </span>
            <strong>
              {product.calories !== undefined
                ? `${Math.round(product.calories)} kcal`
                : "—"}
            </strong>
          </div>

          <div
            style={{
              padding: "10px",
              background: "#f8faf9",
              borderRadius: "8px",
            }}
          >
            <span
              style={{
                fontSize: "0.74rem",
                color: "var(--nl-text-muted)",
                display: "block",
              }}
            >
              Total Sugar
            </span>
            <strong>
              {product.total_sugar !== undefined
                ? `${product.total_sugar}g`
                : "—"}
            </strong>
          </div>

          <div
            style={{
              padding: "10px",
              background: "#f8faf9",
              borderRadius: "8px",
            }}
          >
            <span
              style={{
                fontSize: "0.74rem",
                color: "var(--nl-text-muted)",
                display: "block",
              }}
            >
              Protein
            </span>
            <strong>
              {product.protein !== undefined ? `${product.protein}g` : "—"}
            </strong>
          </div>

          <div
            style={{
              padding: "10px",
              background: "#f8faf9",
              borderRadius: "8px",
            }}
          >
            <span
              style={{
                fontSize: "0.74rem",
                color: "var(--nl-text-muted)",
                display: "block",
              }}
            >
              Sodium
            </span>
            <strong>
              {product.sodium !== undefined
                ? `${Math.round(product.sodium)}mg`
                : "—"}
            </strong>
          </div>

          <div
            style={{
              padding: "10px",
              background: "#f8faf9",
              borderRadius: "8px",
            }}
          >
            <span
              style={{
                fontSize: "0.74rem",
                color: "var(--nl-text-muted)",
                display: "block",
              }}
            >
              Total Fat
            </span>
            <strong>
              {product.total_fat !== undefined ? `${product.total_fat}g` : "—"}
            </strong>
          </div>

          <div
            style={{
              padding: "10px",
              background: "#f8faf9",
              borderRadius: "8px",
            }}
          >
            <span
              style={{
                fontSize: "0.74rem",
                color: "var(--nl-text-muted)",
                display: "block",
              }}
            >
              Fiber
            </span>
            <strong>
              {product.fiber !== undefined ? `${product.fiber}g` : "—"}
            </strong>
          </div>
        </div>
      </Card>

      {/* Ingredients Preview */}
      {ingredientNames.length > 0 && (
        <Card style={{ marginBottom: "20px" }}>
          <h3
            style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "8px" }}
          >
            Ingredients ({ingredientNames.length})
          </h3>
          <p
            style={{
              fontSize: "0.85rem",
              color: "var(--nl-text-sub)",
              lineHeight: 1.5,
            }}
          >
            {ingredientNames.join(", ")}
          </p>
        </Card>
      )}

      {/* Action Button */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <Button
          variant={isSelected ? "outline" : "primary"}
          size="md"
          fullWidth
          onClick={handleCompareClick}
        >
          {isSelected
            ? "View in Comparison (Already Selected) →"
            : "Add to Comparison →"}
        </Button>
      </div>
    </div>
  );
}
