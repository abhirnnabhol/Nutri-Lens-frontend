import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../services/api";
import { useApp } from "../context/AppContext";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import ScoreBadge from "../components/common/ScoreBadge";
import Modal from "../components/common/Modal";

export default function History() {
  const navigate = useNavigate();
  const { toggleProductSelection, setSelectedProducts } = useApp();

  const [activeTab, setActiveTab] = useState("scans"); // 'scans' | 'comparisons'
  const [scans, setScans] = useState([]);
  const [comparisons, setComparisons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected scan for detail modal
  const [selectedScan, setSelectedScan] = useState(null);
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [scanDetailLoading, setScanDetailLoading] = useState(false);

  // Selected comparison for detail modal
  const [selectedComparison, setSelectedComparison] = useState(null);
  const [compModalOpen, setCompModalOpen] = useState(false);
  const [compDetailLoading, setCompDetailLoading] = useState(false);

  // Fetch scan and comparison history on mount
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    Promise.all([
      apiClient.get("/scans/history").catch(() => ({ data: [] })),
      apiClient.get("/comparisons/history").catch(() => ({ data: [] })),
    ])
      .then(([scansRes, compsRes]) => {
        if (!isMounted) return;
        if (scansRes && Array.isArray(scansRes.data)) {
          setScans(scansRes.data);
        }
        if (compsRes && Array.isArray(compsRes.data)) {
          setComparisons(compsRes.data);
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || "Failed to load history.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return "Recent";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch (e) {
      return String(dateStr);
    }
  };

  // Open scan detail
  const handleOpenScanDetail = async (scanId) => {
    setScanDetailLoading(true);
    setScanModalOpen(true);
    try {
      const res = await apiClient.get(`/scans/${scanId}`);
      if (res && res.data) {
        setSelectedScan(res.data);
      }
    } catch (err) {
      console.error("Failed to load scan details:", err);
    } finally {
      setScanDetailLoading(false);
    }
  };

  // Open comparison detail
  const handleOpenComparisonDetail = async (compId) => {
    setCompDetailLoading(true);
    setCompModalOpen(true);
    try {
      const res = await apiClient.get(`/comparisons/${compId}`);
      if (res && res.data) {
        setSelectedComparison(res.data);
      }
    } catch (err) {
      console.error("Failed to load comparison details:", err);
    } finally {
      setCompDetailLoading(false);
    }
  };

  // Re-open comparison in Compare page
  const handleLoadComparisonToTray = (comp) => {
    if (comp && Array.isArray(comp.results)) {
      const prods = comp.results.map((r) => r.product).filter(Boolean);
      setSelectedProducts(prods);
      setCompModalOpen(false);
      navigate("/compare");
    }
  };

  return (
    <div className="nl-search-page" style={{ paddingBottom: "100px" }}>
      {/* Page Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "14px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.35rem", fontWeight: 800, margin: 0 }}>
            My History
          </h1>
          <span style={{ fontSize: "0.82rem", color: "var(--nl-text-sub)" }}>
            Past food package scans and multi-product comparisons
          </span>
        </div>

        <div style={{ display: "flex", gap: "6px" }}>
          <button
            type="button"
            className="nl-chip nl-chip--active"
            style={{ fontSize: "0.78rem", padding: "0 10px", height: "34px" }}
            onClick={() => navigate("/scan")}
          >
            + Scan
          </button>
          <button
            type="button"
            className="nl-chip"
            style={{ fontSize: "0.78rem", padding: "0 10px", height: "34px" }}
            onClick={() => navigate("/compare")}
          >
            + Compare
          </button>
        </div>
      </div>

      {/* Tabs: Scans vs Comparisons */}
      <div
        style={{
          display: "flex",
          background: "#f1f5f9",
          borderRadius: "var(--nl-radius-full)",
          padding: "4px",
          marginBottom: "16px",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("scans")}
          style={{
            flex: 1,
            padding: "8px 12px",
            border: "none",
            borderRadius: "var(--nl-radius-full)",
            background: activeTab === "scans" ? "#ffffff" : "transparent",
            color:
              activeTab === "scans"
                ? "var(--nl-teal-dark)"
                : "var(--nl-text-sub)",
            fontWeight: activeTab === "scans" ? 700 : 500,
            fontSize: "0.85rem",
            boxShadow:
              activeTab === "scans" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          📷 Scans ({scans.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("comparisons")}
          style={{
            flex: 1,
            padding: "8px 12px",
            border: "none",
            borderRadius: "var(--nl-radius-full)",
            background: activeTab === "comparisons" ? "#ffffff" : "transparent",
            color:
              activeTab === "comparisons"
                ? "var(--nl-teal-dark)"
                : "var(--nl-text-sub)",
            fontWeight: activeTab === "comparisons" ? 700 : 500,
            fontSize: "0.85rem",
            boxShadow:
              activeTab === "comparisons"
                ? "0 1px 3px rgba(0,0,0,0.08)"
                : "none",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          ⚖️ Comparisons ({comparisons.length})
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div
          style={{
            textAlign: "center",
            padding: "40px 16px",
            color: "var(--nl-text-muted)",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              border: "3px solid #ccfbf1",
              borderTopColor: "var(--nl-teal)",
              borderRadius: "50%",
              margin: "0 auto 12px",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <span>Loading history...</span>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <Card
          style={{ padding: "20px", textAlign: "center", color: "#ef4444" }}
        >
          <p style={{ margin: "0 0 10px 0" }}>{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </Card>
      )}

      {/* TAB 1: SCANS LIST */}
      {!loading && !error && activeTab === "scans" && (
        <div className="nl-scans-list">
          {scans.length === 0 ? (
            <Card style={{ textAlign: "center", padding: "36px 16px" }}>
              <div style={{ fontSize: "2.4rem", marginBottom: "8px" }}>📷</div>
              <h3
                style={{
                  fontSize: "1rem",
                  fontWeight: 700,
                  margin: "0 0 6px 0",
                }}
              >
                No food scans yet
              </h3>
              <p
                style={{
                  fontSize: "0.82rem",
                  color: "var(--nl-text-muted)",
                  marginBottom: "16px",
                }}
              >
                Scan nutrition labels in Offline Mode to analyze ingredients and
                health scores.
              </p>
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate("/scan")}
              >
                Start a New Scan
              </Button>
            </Card>
          ) : (
            scans.map((item) => {
              const isOffline = item.mode === "offline";
              return (
                <div
                  key={item.id}
                  className="nl-scan-card nl-scan-card--interactive"
                  onClick={() => handleOpenScanDetail(item.id)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="nl-scan-card__icon">
                    <span style={{ fontSize: "1.3rem" }}>
                      {isOffline ? "📷" : "🥗"}
                    </span>
                  </div>

                  <div className="nl-scan-card__info" style={{ flex: 1 }}>
                    <div
                      className="nl-scan-card__name"
                      style={{ fontSize: "0.95rem" }}
                    >
                      {item.productName}
                    </div>

                    <div
                      className="nl-scan-card__score"
                      style={{
                        fontWeight: 700,
                        color: "var(--nl-teal-dark)",
                        margin: "2px 0",
                      }}
                    >
                      {item.brand ? `${item.brand} • ` : ""}
                      Score:{" "}
                      {item.score !== null ? `${item.score}/100` : "Pending"}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "0.72rem",
                        color: "var(--nl-text-muted)",
                      }}
                    >
                      <span>{formatDate(item.createdAt)}</span>
                      <span>•</span>
                      <span
                        style={{
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          color: isOffline ? "#0f766e" : "#1d4ed8",
                          background: isOffline ? "#ccfbf1" : "#dbeafe",
                          padding: "1px 6px",
                          borderRadius: "4px",
                          textTransform: "uppercase",
                        }}
                      >
                        {isOffline ? "Offline Scan" : "Online Analysis"}
                      </span>
                    </div>
                  </div>

                  <ScoreBadge score={item.score} />
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: COMPARISONS LIST */}
      {!loading && !error && activeTab === "comparisons" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {comparisons.length === 0 ? (
            <Card style={{ textAlign: "center", padding: "36px 16px" }}>
              <div style={{ fontSize: "2.4rem", marginBottom: "8px" }}>⚖️</div>
              <h3
                style={{
                  fontSize: "1rem",
                  fontWeight: 700,
                  margin: "0 0 6px 0",
                }}
              >
                No comparisons saved yet
              </h3>
              <p
                style={{
                  fontSize: "0.82rem",
                  color: "var(--nl-text-muted)",
                  marginBottom: "16px",
                }}
              >
                Compare two or more scanned or catalog products side-by-side.
              </p>
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate("/compare")}
              >
                Create a Comparison
              </Button>
            </Card>
          ) : (
            comparisons.map((item) => (
              <Card
                key={item.id}
                className="nl-scan-card--interactive"
                style={{
                  padding: "16px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
                onClick={() => handleOpenComparisonDetail(item.id)}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <h3
                      style={{
                        fontSize: "0.95rem",
                        fontWeight: 800,
                        margin: "0 0 2px 0",
                        color: "var(--nl-text-main)",
                      }}
                    >
                      {item.title}
                    </h3>
                    <span
                      style={{
                        fontSize: "0.74rem",
                        color: "var(--nl-text-muted)",
                      }}
                    >
                      {formatDate(item.createdAt)} • {item.productCount}{" "}
                      Products
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      color: item.mode === "offline" ? "#0f766e" : "#1d4ed8",
                      background:
                        item.mode === "offline" ? "#ccfbf1" : "#dbeafe",
                      padding: "2px 7px",
                      borderRadius: "4px",
                      textTransform: "uppercase",
                    }}
                  >
                    {item.mode === "offline"
                      ? "Offline"
                      : item.mode === "online"
                        ? "Online"
                        : "Hybrid"}
                  </span>
                </div>

                {/* Ranked product summary chips */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {item.products &&
                    item.products.map((p, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: "0.74rem",
                          background: idx === 0 ? "#f0fdf9" : "#f8fafc",
                          border:
                            idx === 0
                              ? "1px solid #ccfbf1"
                              : "1px solid #e2e8f0",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <span>
                          {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                        </span>
                        <strong style={{ color: "var(--nl-text-main)" }}>
                          {p.productName}
                        </strong>
                        <span
                          style={{
                            color: "var(--nl-teal-dark)",
                            fontWeight: 700,
                          }}
                        >
                          ({p.score}/100)
                        </span>
                      </span>
                    ))}
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* MODAL 1: SCAN DETAIL VIEW */}
      <Modal
        isOpen={scanModalOpen}
        onClose={() => setScanModalOpen(false)}
        title={selectedScan ? selectedScan.productName : "Scan Details"}
        maxWidth="520px"
      >
        {scanDetailLoading || !selectedScan ? (
          <div style={{ textAlign: "center", padding: "30px 0" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                border: "3px solid #ccfbf1",
                borderTopColor: "var(--nl-teal)",
                borderRadius: "50%",
                margin: "0 auto 8px",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <span
              style={{ fontSize: "0.85rem", color: "var(--nl-text-muted)" }}
            >
              Loading scan details...
            </span>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              maxHeight: "75vh",
              overflowY: "auto",
            }}
          >
            {/* Header: Score & Mode */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#f8fafc",
                padding: "12px 14px",
                borderRadius: "var(--nl-radius-md)",
              }}
            >
              <div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <span
                    style={{
                      fontSize: "1.6rem",
                      fontWeight: 900,
                      color: "var(--nl-teal-dark)",
                    }}
                  >
                    {selectedScan.score !== null ? selectedScan.score : "—"}
                  </span>
                  <span
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--nl-text-muted)",
                    }}
                  >
                    /100
                  </span>
                  <ScoreBadge score={selectedScan.score} />
                </div>
                <span
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--nl-text-muted)",
                    display: "block",
                  }}
                >
                  NutriLens Health Score
                </span>
              </div>

              <div style={{ textAlign: "right" }}>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color:
                      selectedScan.mode === "offline" ? "#0f766e" : "#1d4ed8",
                    background:
                      selectedScan.mode === "offline" ? "#ccfbf1" : "#dbeafe",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    textTransform: "uppercase",
                  }}
                >
                  {selectedScan.mode === "offline" ? "Offline Scan" : "Online"}
                </span>
                <span
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--nl-text-muted)",
                    display: "block",
                    marginTop: "3px",
                  }}
                >
                  {formatDate(selectedScan.createdAt)}
                </span>
              </div>
            </div>

            {/* 1. Nutrition Data Grid */}
            <div>
              <h4
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 800,
                  margin: "0 0 6px 0",
                  color: "var(--nl-text-main)",
                }}
              >
                Nutrition Data (per{" "}
                {selectedScan.nutrition?.servingSize || "serving"})
              </h4>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "6px",
                  fontSize: "0.76rem",
                  background: "#f1f5f9",
                  padding: "10px",
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
                    {selectedScan.nutrition?.calories ?? "—"} kcal
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
                    Total Sugar
                  </span>
                  <strong>
                    {selectedScan.nutrition?.totalSugar !== null &&
                    selectedScan.nutrition?.totalSugar !== undefined
                      ? `${selectedScan.nutrition.totalSugar}g`
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
                    Added Sugar
                  </span>
                  <strong>
                    {selectedScan.nutrition?.addedSugar !== null &&
                    selectedScan.nutrition?.addedSugar !== undefined
                      ? `${selectedScan.nutrition.addedSugar}g`
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
                    Total Fat
                  </span>
                  <strong>
                    {selectedScan.nutrition?.totalFat !== null &&
                    selectedScan.nutrition?.totalFat !== undefined
                      ? `${selectedScan.nutrition.totalFat}g`
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
                    Saturated Fat
                  </span>
                  <strong>
                    {selectedScan.nutrition?.saturatedFat !== null &&
                    selectedScan.nutrition?.saturatedFat !== undefined
                      ? `${selectedScan.nutrition.saturatedFat}g`
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
                    Trans Fat
                  </span>
                  <strong>
                    {selectedScan.nutrition?.transFat !== null &&
                    selectedScan.nutrition?.transFat !== undefined
                      ? `${selectedScan.nutrition.transFat}g`
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
                    {selectedScan.nutrition?.sodium !== null &&
                    selectedScan.nutrition?.sodium !== undefined
                      ? `${selectedScan.nutrition.sodium}mg`
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
                    {selectedScan.nutrition?.fiber !== null &&
                    selectedScan.nutrition?.fiber !== undefined
                      ? `${selectedScan.nutrition.fiber}g`
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
                    Protein
                  </span>
                  <strong>
                    {selectedScan.nutrition?.protein !== null &&
                    selectedScan.nutrition?.protein !== undefined
                      ? `${selectedScan.nutrition.protein}g`
                      : "—"}
                  </strong>
                </div>
              </div>
            </div>

            {/* 2. Ingredients */}
            <div>
              <h4
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 800,
                  margin: "0 0 6px 0",
                  color: "var(--nl-text-main)",
                }}
              >
                Ingredients
              </h4>
              {selectedScan.ingredients &&
              selectedScan.ingredients.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                  {selectedScan.ingredients.map((ing, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: "0.74rem",
                        background: "#f1f5f9",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        color: "var(--nl-text-main)",
                      }}
                    >
                      {ing}
                    </span>
                  ))}
                </div>
              ) : (
                <span
                  style={{ fontSize: "0.8rem", color: "var(--nl-text-muted)" }}
                >
                  No ingredient text recorded.
                </span>
              )}
            </div>

            {/* 3. Positives */}
            {selectedScan.scoreEvaluation?.positives?.length > 0 && (
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  padding: "10px 12px",
                  borderRadius: "8px",
                }}
              >
                <h5
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 800,
                    color: "#166534",
                    margin: "0 0 4px 0",
                  }}
                >
                  ✓ Positive Nutritional Factors
                </h5>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: "16px",
                    fontSize: "0.76rem",
                    color: "#166534",
                  }}
                >
                  {selectedScan.scoreEvaluation.positives.map((pos, idx) => (
                    <li key={idx}>{pos}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 4. Negatives */}
            {selectedScan.scoreEvaluation?.negatives?.length > 0 && (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  padding: "10px 12px",
                  borderRadius: "8px",
                }}
              >
                <h5
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 800,
                    color: "#991b1b",
                    margin: "0 0 4px 0",
                  }}
                >
                  ⚠ Factors to Limit
                </h5>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: "16px",
                    fontSize: "0.76rem",
                    color: "#991b1b",
                  }}
                >
                  {selectedScan.scoreEvaluation.negatives.map((neg, idx) => (
                    <li key={idx}>{neg}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 5. Warnings */}
            {selectedScan.scoreEvaluation?.warnings?.length > 0 && (
              <div
                style={{
                  background: "#fffbeb",
                  border: "1px solid #fef3c7",
                  padding: "10px 12px",
                  borderRadius: "8px",
                }}
              >
                <h5
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 800,
                    color: "#92400e",
                    margin: "0 0 4px 0",
                  }}
                >
                  Notice / Ingredient Warnings
                </h5>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: "16px",
                    fontSize: "0.76rem",
                    color: "#92400e",
                  }}
                >
                  {selectedScan.scoreEvaluation.warnings.map((warn, idx) => (
                    <li key={idx}>{warn}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
              <Button
                variant="primary"
                size="sm"
                fullWidth
                onClick={() => {
                  toggleProductSelection({
                    id: selectedScan.id,
                    name: selectedScan.productName,
                    brand: selectedScan.brand,
                    health_score: selectedScan.score,
                    calories: selectedScan.nutrition?.calories,
                    total_sugar: selectedScan.nutrition?.totalSugar,
                    sodium: selectedScan.nutrition?.sodium,
                    fiber: selectedScan.nutrition?.fiber,
                    ingredients: selectedScan.ingredients,
                    is_scanned: true,
                  });
                  setScanModalOpen(false);
                }}
              >
                ＋ Add to Compare Tray
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setScanModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 2: COMPARISON DETAIL VIEW */}
      <Modal
        isOpen={compModalOpen}
        onClose={() => setCompModalOpen(false)}
        title={
          selectedComparison ? selectedComparison.title : "Comparison Details"
        }
        maxWidth="600px"
      >
        {compDetailLoading || !selectedComparison ? (
          <div style={{ textAlign: "center", padding: "30px 0" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                border: "3px solid #ccfbf1",
                borderTopColor: "var(--nl-teal)",
                borderRadius: "50%",
                margin: "0 auto 8px",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <span
              style={{ fontSize: "0.85rem", color: "var(--nl-text-muted)" }}
            >
              Loading comparison...
            </span>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              maxHeight: "75vh",
              overflowY: "auto",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#f8fafc",
                padding: "10px 14px",
                borderRadius: "var(--nl-radius-md)",
              }}
            >
              <div>
                <strong
                  style={{
                    fontSize: "0.9rem",
                    color: "var(--nl-text-main)",
                    display: "block",
                  }}
                >
                  {selectedComparison.results?.length || 0} Products Compared
                </strong>
                <span
                  style={{ fontSize: "0.74rem", color: "var(--nl-text-muted)" }}
                >
                  {formatDate(selectedComparison.createdAt)}
                </span>
              </div>

              <span
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color:
                    selectedComparison.mode === "offline"
                      ? "#0f766e"
                      : "#1d4ed8",
                  background:
                    selectedComparison.mode === "offline"
                      ? "#ccfbf1"
                      : "#dbeafe",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  textTransform: "uppercase",
                }}
              >
                {selectedComparison.mode === "offline"
                  ? "Offline Scan"
                  : selectedComparison.mode}
              </span>
            </div>

            {/* 1. Products & Rankings (🥇, 🥈, 🥉) */}
            <div>
              <h4
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 800,
                  margin: "0 0 8px 0",
                  color: "var(--nl-text-main)",
                }}
              >
                Ranked Results
              </h4>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                {selectedComparison.results?.map((item) => {
                  const medal =
                    item.rank === 1
                      ? "🥇"
                      : item.rank === 2
                        ? "🥈"
                        : item.rank === 3
                          ? "🥉"
                          : `#${item.rank}`;
                  return (
                    <div
                      key={item.rank}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        background: item.rank === 1 ? "#f0fdf9" : "#ffffff",
                        border:
                          item.rank === 1
                            ? "1.5px solid var(--nl-teal)"
                            : "1px solid #e2e8f0",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <span style={{ fontSize: "1.3rem" }}>{medal}</span>
                        <div>
                          <strong
                            style={{
                              fontSize: "0.88rem",
                              display: "block",
                              color: "var(--nl-text-main)",
                            }}
                          >
                            {item.product?.name || `Product #${item.rank}`}
                          </strong>
                          <span
                            style={{
                              fontSize: "0.72rem",
                              color: "var(--nl-text-muted)",
                            }}
                          >
                            {item.product?.brand
                              ? `${item.product.brand} • `
                              : ""}
                            Serving: {item.product?.serving_size || "30g"}
                          </span>
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <span
                          style={{
                            fontSize: "1.1rem",
                            fontWeight: 900,
                            color: "var(--nl-teal-dark)",
                          }}
                        >
                          {item.score}
                        </span>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--nl-text-muted)",
                          }}
                        >
                          /100
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Side-by-Side Comparison Table */}
            {selectedComparison.comparisonTable && (
              <div>
                <h4
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 800,
                    margin: "0 0 8px 0",
                    color: "var(--nl-text-main)",
                  }}
                >
                  Nutritional Comparison Table
                </h4>
                <div
                  style={{
                    overflowX: "auto",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                  }}
                >
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "0.76rem",
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          background: "#f8fafc",
                          borderBottom: "1px solid #e2e8f0",
                        }}
                      >
                        <th
                          style={{
                            padding: "8px 10px",
                            textAlign: "left",
                            color: "var(--nl-text-muted)",
                            fontWeight: 600,
                          }}
                        >
                          Metric
                        </th>
                        {selectedComparison.comparisonTable.columns?.map(
                          (col, idx) => (
                            <th
                              key={idx}
                              style={{
                                padding: "8px 10px",
                                textAlign: "center",
                                fontWeight: 700,
                                color: "var(--nl-text-main)",
                              }}
                            >
                              <div>
                                {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                              </div>
                              <div
                                style={{
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  maxWidth: "100px",
                                }}
                              >
                                {col.name}
                              </div>
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedComparison.comparisonTable.rows?.map(
                        (row, rIdx) => (
                          <tr
                            key={rIdx}
                            style={{
                              borderBottom: "1px solid #f1f5f9",
                              background:
                                row.metric === "NutriLens Health Score"
                                  ? "#f0fdf9"
                                  : "transparent",
                            }}
                          >
                            <td
                              style={{
                                padding: "8px 10px",
                                fontWeight:
                                  row.metric === "NutriLens Health Score"
                                    ? 800
                                    : 500,
                              }}
                            >
                              {row.metric}{" "}
                              {row.unit && (
                                <span
                                  style={{
                                    color: "var(--nl-text-muted)",
                                    fontSize: "0.68rem",
                                  }}
                                >
                                  ({row.unit})
                                </span>
                              )}
                            </td>
                            {row.values?.map((val, vIdx) => (
                              <td
                                key={vIdx}
                                style={{
                                  padding: "8px 10px",
                                  textAlign: "center",
                                  fontWeight:
                                    row.metric === "NutriLens Health Score"
                                      ? 800
                                      : 500,
                                  color:
                                    row.metric === "NutriLens Health Score"
                                      ? "var(--nl-teal-dark)"
                                      : "var(--nl-text-main)",
                                }}
                              >
                                {val}
                              </td>
                            ))}
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
              <Button
                variant="primary"
                size="sm"
                fullWidth
                onClick={() => handleLoadComparisonToTray(selectedComparison)}
              >
                Load into Comparison Tray & View in Compare →
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCompModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
