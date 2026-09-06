import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import ScoreBadge from "../components/common/ScoreBadge";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import apiClient from "../services/api";

const CATEGORY_EMOJIS = {
  snacks: "🍿",
  chocolates: "🍫",
  "soft-drinks": "🥤",
  dairy: "🥛",
  "packaged-food": "🥫",
  beverages: "🧃",
};

const getMedalEmoji = (rank) => {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return "🏅";
};

export default function Compare() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    selectedProducts,
    removeProductFromCompare,
    clearSelectedProducts,
    setSelectedProducts,
  } = useApp();

  const [rankingResults, setRankingResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [healthProfile, setHealthProfile] = useState(null);
  const [personalize, setPersonalize] = useState(true);
  const [error, setError] = useState(null);
  const [savedComparisonId, setSavedComparisonId] = useState(null);
  const [saving, setSaving] = useState(false);

  // If user enters Compare with 0 selected items, fetch 2 demo products so they can see comparison immediately
  useEffect(() => {
    if (selectedProducts.length === 0 && rankingResults.length === 0) {
      setLoading(true);
      apiClient
        .get("/products?limit=3")
        .then((res) => {
          if (res.data && Array.isArray(res.data) && res.data.length >= 2) {
            setSelectedProducts(res.data.slice(0, 3));
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [selectedProducts.length, rankingResults.length, setSelectedProducts]);

  // Load user health profile on mount
  useEffect(() => {
    let isMounted = true;
    apiClient
      .get("/profile")
      .then((res) => {
        if (!isMounted) return;
        const prof = res.data?.healthProfile || res.user?.healthProfile || null;
        if (prof) {
          setHealthProfile(prof);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Request backend ranking whenever selectedProducts or personalize changes
  useEffect(() => {
    if (selectedProducts.length === 0) {
      setRankingResults([]);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    const payload = {
      products: selectedProducts,
      productIds: selectedProducts.map((p) =>
        p.is_scanned || typeof p.id === "string" ? p : p.id,
      ),
      healthProfile: personalize ? healthProfile : null,
      personalize,
    };

    apiClient
      .post("/ranking", payload)
      .then((res) => {
        if (isMounted && res.results) {
          setRankingResults(res.results);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(
            err.response?.data?.error ||
              "Unable to calculate backend rankings. Please try again.",
          );
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedProducts, healthProfile, personalize]);

  // Save comparison to PostgreSQL history
  const handleSaveComparison = async () => {
    if (selectedProducts.length < 2 || saving) return;
    try {
      setSaving(true);
      const hasScanned = selectedProducts.some(
        (p) => p.is_scanned || String(p.id).startsWith("scanned-"),
      );
      const hasCatalog = selectedProducts.some(
        (p) => !p.is_scanned && typeof p.id === "number",
      );
      const mode =
        hasScanned && hasCatalog ? "hybrid" : hasScanned ? "offline" : "online";

      const res = await apiClient.post("/comparisons", {
        products: selectedProducts,
        productIds: selectedProducts.map((p) => p.id),
        title: `Comparison of ${selectedProducts.length} Products`,
        mode,
      });
      if (res.data && res.data.comparisonId) {
        setSavedComparisonId(res.data.comparisonId);
      }
    } catch (e) {
      // Non-blocking
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="nl-search-page" style={{ paddingBottom: "100px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.35rem", fontWeight: 800, margin: 0 }}>
            Food Comparison
          </h1>
          <span style={{ fontSize: "0.8rem", color: "var(--nl-text-sub)" }}>
            Ranked objectively by NutriLens Health Score
          </span>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            className="nl-chip"
            style={{ height: "36px", padding: "0 12px", fontSize: "0.8rem" }}
            onClick={() => navigate("/scan")}
          >
            📷 + Scan
          </button>
          <button
            type="button"
            className="nl-chip nl-chip--active"
            style={{ height: "36px", padding: "0 12px", fontSize: "0.8rem" }}
            onClick={() => navigate("/search")}
          >
            🔍 + Catalog
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: "54px 16px",
            color: "var(--nl-text-sub)",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              border: "3px solid #ccfbf1",
              borderTopColor: "var(--nl-teal)",
              borderRadius: "50%",
              margin: "0 auto 14px",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <strong
            style={{
              display: "block",
              color: "var(--nl-text-main)",
              fontSize: "0.95rem",
            }}
          >
            Evaluating NutriLens Health Scores...
          </strong>
          <span style={{ fontSize: "0.8rem", color: "var(--nl-text-muted)" }}>
            Normalizing nutrition data & computing objective ranking
          </span>
        </div>
      ) : error ? (
        <Card style={{ textAlign: "center", padding: "28px 20px" }}>
          <div style={{ fontSize: "2rem", marginBottom: "8px" }}>⚠️</div>
          <p
            style={{
              color: "#ef4444",
              fontSize: "0.9rem",
              marginBottom: "14px",
            }}
          >
            {error}
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate("/search")}
          >
            Select Products to Compare
          </Button>
        </Card>
      ) : rankingResults.length === 0 ? (
        <Card style={{ textAlign: "center", padding: "36px 20px" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>⚖️</div>
          <h3
            style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "6px" }}
          >
            No products selected yet
          </h3>
          <p
            style={{
              color: "var(--nl-text-sub)",
              fontSize: "0.88rem",
              marginBottom: "20px",
            }}
          >
            Search for packaged foods in our catalog and tap "Add to Compare" to
            rank them here.
          </p>
          <Button
            variant="primary"
            size="md"
            fullWidth
            onClick={() => navigate("/search")}
          >
            Explore & Select Products
          </Button>
        </Card>
      ) : (
        <>
          {/* Comparison Summary Banner */}
          <div
            style={{
              background: "#f0fdf9",
              border: "1px solid #ccfbf1",
              borderRadius: "var(--nl-radius-md)",
              padding: "10px 14px",
              marginBottom: "16px",
              fontSize: "0.82rem",
              color: "#0f766e",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <span>
                Comparing <strong>{rankingResults.length}</strong> items. Ranked
                from better choice to least recommended.
              </span>
              {savedComparisonId && (
                <div
                  style={{
                    marginTop: "4px",
                    fontSize: "0.76rem",
                    fontWeight: 700,
                    color: "var(--nl-teal-dark)",
                  }}
                >
                  ✓ Saved to history (ID: #{savedComparisonId})
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={clearSelectedProducts}
              style={{
                background: "none",
                border: "none",
                color: "#0d9488",
                fontWeight: 700,
                fontSize: "0.78rem",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Reset
            </button>
          </div>

          {/* Health Profile Personalization Controls */}
          {healthProfile && (
            <div
              style={{
                background: personalize ? "#f0fdf4" : "#f8fafc",
                border: `1px solid ${personalize ? "#bbf7d0" : "#e2e8f0"}`,
                borderRadius: "var(--nl-radius-md)",
                padding: "10px 14px",
                marginBottom: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "4px",
                  }}
                >
                  <strong
                    style={{
                      fontSize: "0.84rem",
                      color: personalize ? "#15803d" : "#64748b",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <span>👤</span> Health Profile Context:
                  </strong>
                  {healthProfile.conditions &&
                    healthProfile.conditions.map((cond, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: "0.7rem",
                          padding: "2px 7px",
                          borderRadius: "4px",
                          background: personalize ? "#dcfce7" : "#e2e8f0",
                          color: personalize ? "#166534" : "#475569",
                          fontWeight: 600,
                          textTransform: "capitalize",
                        }}
                      >
                        {cond}
                      </span>
                    ))}
                </div>
                <span
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--nl-text-muted)",
                    display: "block",
                  }}
                >
                  {personalize
                    ? "Cautious contextual notices enabled. General score & ranking remain unaltered."
                    : "Personalized notices paused. Showing general NutriLens evaluation."}
                </span>
              </div>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: "pointer",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: personalize ? "#15803d" : "#64748b",
                  userSelect: "none",
                  flexShrink: 0,
                }}
              >
                <input
                  type="checkbox"
                  checked={personalize}
                  onChange={(e) => setPersonalize(e.target.checked)}
                  style={{ accentColor: "var(--nl-teal)", cursor: "pointer" }}
                />
                Personalize
              </label>
            </div>
          )}

          {/* Ranked Product Cards */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            {rankingResults.map((item) => {
              const prod = item.product || {};
              const isRank1 = item.rank === 1;
              const emoji = CATEGORY_EMOJIS[prod.category_slug] || "🥗";
              const scoreNum = Math.round(item.score);

              return (
                <Card
                  key={item.productId}
                  style={{
                    border: isRank1
                      ? "2px solid var(--nl-teal)"
                      : "1px solid var(--nl-border)",
                    boxShadow: isRank1
                      ? "0 4px 16px rgba(13, 148, 136, 0.12)"
                      : "none",
                    position: "relative",
                  }}
                >
                  {/* Top Header: Rank Badge + Remove */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "10px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.82rem",
                          fontWeight: 800,
                          color: isRank1 ? "#ffffff" : "var(--nl-text-main)",
                          background: isRank1 ? "var(--nl-teal)" : "#e2e8f0",
                          padding: "4px 12px",
                          borderRadius: "var(--nl-radius-full)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          letterSpacing: "0.3px",
                        }}
                      >
                        <span>{getMedalEmoji(item.rank)}</span>
                        <span>Rank {item.rank}</span>
                      </span>
                      {isRank1 && (
                        <span
                          style={{
                            fontSize: "0.74rem",
                            fontWeight: 700,
                            color: "var(--nl-teal-dark)",
                            background: "var(--nl-teal-light)",
                            padding: "3px 8px",
                            borderRadius: "var(--nl-radius-full)",
                          }}
                        >
                          ★ Better choice among selected
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeProductFromCompare(item.productId)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--nl-text-muted)",
                        fontSize: "1.1rem",
                        padding: "2px 6px",
                      }}
                      title="Remove from comparison"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Product Header & Score */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "14px",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "center",
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "12px",
                          background: "#f1f5f9",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.5rem",
                          flexShrink: 0,
                        }}
                      >
                        {prod.image_url ? (
                          <img
                            src={prod.image_url}
                            alt={prod.name}
                            style={{
                              width: "100%",
                              height: "100%",
                              borderRadius: "12px",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          emoji
                        )}
                      </div>

                      <div>
                        <h3
                          style={{
                            fontSize: "1.05rem",
                            fontWeight: 800,
                            margin: 0,
                            color: "var(--nl-text-main)",
                            lineHeight: 1.25,
                          }}
                        >
                          {prod.name}
                        </h3>
                        <span
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--nl-text-sub)",
                          }}
                        >
                          {prod.brand} • {prod.category_name || "General"}
                        </span>
                      </div>
                    </div>

                    {/* NutriLens Health Score Display */}
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          justifyContent: "flex-end",
                        }}
                      >
                        <div style={{ textAlign: "right" }}>
                          <span
                            style={{
                              fontSize: "1.35rem",
                              fontWeight: 900,
                              color:
                                scoreNum >= 70
                                  ? "#0d9488"
                                  : scoreNum >= 45
                                    ? "#eab308"
                                    : "#ef4444",
                              lineHeight: 1,
                            }}
                          >
                            {scoreNum}
                          </span>
                          <span
                            style={{
                              fontSize: "0.78rem",
                              color: "var(--nl-text-muted)",
                            }}
                          >
                            /100
                          </span>
                        </div>
                        <ScoreBadge score={scoreNum} />
                      </div>
                      <span
                        style={{
                          display: "block",
                          fontSize: "0.68rem",
                          color: "var(--nl-text-muted)",
                          marginTop: "2px",
                        }}
                      >
                        NutriLens Health Score
                      </span>
                    </div>
                  </div>

                  {/* Factor Explanations: Why it scored well & Areas of concern */}
                  <div
                    style={{
                      background: "#fafafa",
                      borderRadius: "var(--nl-radius-md)",
                      padding: "10px 12px",
                      marginBottom: "12px",
                      fontSize: "0.8rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    {/* Why it scored well */}
                    {item.positives && item.positives.length > 0 && (
                      <div>
                        <strong
                          style={{
                            color: "#0f766e",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            marginBottom: "4px",
                            fontSize: "0.78rem",
                          }}
                        >
                          <span>✓</span> Why it scored well:
                        </strong>
                        <ul
                          style={{
                            margin: 0,
                            paddingLeft: "18px",
                            color: "var(--nl-text-main)",
                            lineHeight: 1.4,
                          }}
                        >
                          {item.positives.map((pos, idx) => (
                            <li key={idx}>{pos}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Areas of concern */}
                    {((item.negatives && item.negatives.length > 0) ||
                      (item.warnings && item.warnings.length > 0)) && (
                      <div>
                        <strong
                          style={{
                            color: "#b45309",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            marginBottom: "4px",
                            fontSize: "0.78rem",
                          }}
                        >
                          <span>⚠</span> Areas of concern:
                        </strong>
                        <ul
                          style={{
                            margin: 0,
                            paddingLeft: "18px",
                            color: "var(--nl-text-main)",
                            lineHeight: 1.4,
                          }}
                        >
                          {(item.negatives || []).map((neg, idx) => (
                            <li key={idx}>{neg}</li>
                          ))}
                          {(item.warnings || []).map((warn, idx) => (
                            <li
                              key={`w-${idx}`}
                              style={{ color: "var(--nl-text-muted)" }}
                            >
                              {warn}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Personalized Insights Section */}
                  {personalize && item.personalizedInsight?.hasInsight && (
                    <div
                      style={{
                        background: "#eff6ff",
                        border: "1px solid #bfdbfe",
                        borderRadius: "var(--nl-radius-md)",
                        padding: "10px 12px",
                        marginBottom: "12px",
                        fontSize: "0.8rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "6px",
                        }}
                      >
                        <strong
                          style={{
                            color: "#1d4ed8",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            fontSize: "0.78rem",
                          }}
                        >
                          <span>🎯</span> Personalized Insights
                        </strong>
                        {item.personalizedInsight.profileFactors?.length >
                          0 && (
                          <span
                            style={{
                              fontSize: "0.68rem",
                              color: "#1d4ed8",
                              background: "#dbeafe",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontWeight: 600,
                            }}
                          >
                            {item.personalizedInsight.profileFactors[0]}
                          </span>
                        )}
                      </div>

                      {/* Notices */}
                      {item.personalizedInsight.notices?.map((notice, nIdx) => (
                        <p
                          key={`n-${nIdx}`}
                          style={{
                            margin: "0 0 6px 0",
                            color: "#1e3a8a",
                            lineHeight: 1.4,
                            fontWeight: 500,
                          }}
                        >
                          {notice}
                        </p>
                      ))}

                      {/* Recommendations */}
                      {item.personalizedInsight.recommendations?.map(
                        (rec, rIdx) => (
                          <p
                            key={`r-${rIdx}`}
                            style={{
                              margin: "0 0 6px 0",
                              color: "#1e40af",
                              fontStyle: "italic",
                              lineHeight: 1.4,
                            }}
                          >
                            "{rec}"
                          </p>
                        ),
                      )}

                      {/* Transparent reason */}
                      {item.personalizedInsight.transparentReason && (
                        <span
                          style={{
                            display: "block",
                            fontSize: "0.7rem",
                            color: "#64748b",
                            marginBottom: "4px",
                          }}
                        >
                          {item.personalizedInsight.transparentReason}
                        </span>
                      )}

                      {/* Non-Medical Disclaimer */}
                      <div
                        style={{
                          fontSize: "0.68rem",
                          color: "#64748b",
                          borderTop: "1px solid #dbeafe",
                          paddingTop: "5px",
                          marginTop: "4px",
                        }}
                      >
                        ℹ️ {item.personalizedInsight.disclaimer}
                      </div>
                    </div>
                  )}

                  {/* Nutrition Breakdown Grid */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: "6px",
                      fontSize: "0.78rem",
                      background: "#f8fafc",
                      padding: "8px 10px",
                      borderRadius: "var(--nl-radius-md)",
                      textAlign: "center",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: "0.66rem",
                          color: "var(--nl-text-muted)",
                          display: "block",
                        }}
                      >
                        Calories
                      </span>
                      <strong>
                        {prod.calories !== undefined
                          ? `${Math.round(prod.calories)}`
                          : "—"}
                      </strong>
                    </div>

                    <div>
                      <span
                        style={{
                          fontSize: "0.66rem",
                          color: "var(--nl-text-muted)",
                          display: "block",
                        }}
                      >
                        Sugar
                      </span>
                      <strong>
                        {prod.total_sugar !== undefined
                          ? `${prod.total_sugar}g`
                          : "—"}
                      </strong>
                    </div>

                    <div>
                      <span
                        style={{
                          fontSize: "0.66rem",
                          color: "var(--nl-text-muted)",
                          display: "block",
                        }}
                      >
                        Sodium
                      </span>
                      <strong>
                        {prod.sodium !== undefined
                          ? `${Math.round(prod.sodium)}mg`
                          : "—"}
                      </strong>
                    </div>

                    <div>
                      <span
                        style={{
                          fontSize: "0.66rem",
                          color: "var(--nl-text-muted)",
                          display: "block",
                        }}
                      >
                        Fiber
                      </span>
                      <strong>
                        {prod.fiber !== undefined ? `${prod.fiber}g` : "—"}
                      </strong>
                    </div>
                  </div>

                  {/* Link to detail */}
                  <div style={{ marginTop: "10px", textAlign: "right" }}>
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
                      onClick={() => {
                        if (
                          prod.is_scanned ||
                          String(item.productId).startsWith("scanned-")
                        ) {
                          navigate(`/product/${item.productId}`, {
                            state: { scannedProduct: prod },
                          });
                        } else {
                          navigate(`/product/${item.productId}`);
                        }
                      }}
                    >
                      View Full Ingredients →
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={() => navigate("/search")}
            >
              + Add Another Product to Compare
            </Button>

            {rankingResults.length >= 2 && !savedComparisonId && (
              <Button
                variant="outline"
                size="md"
                fullWidth
                onClick={handleSaveComparison}
                disabled={saving}
              >
                {saving ? "Saving Comparison..." : "Save Comparison to History"}
              </Button>
            )}

            {rankingResults.length >= 2 && savedComparisonId && (
              <Button
                variant="outline"
                size="md"
                fullWidth
                onClick={() => navigate("/history")}
                style={{
                  borderColor: "var(--nl-teal)",
                  color: "var(--nl-teal-dark)",
                  fontWeight: 700,
                }}
              >
                ✓ Saved to History (View in History →)
              </Button>
            )}

            <Button
              variant="outline"
              size="md"
              fullWidth
              onClick={() => navigate("/home")}
            >
              Back to Home Dashboard
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
