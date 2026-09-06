import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiClient from "../services/api";

const CATEGORY_ICONS = {
  snacks: "🍿",
  chocolates: "🍫",
  "soft-drinks": "🥤",
  dairy: "🥛",
  "packaged-food": "🥫",
  beverages: "🧃",
};

const DEFAULT_CATEGORIES = [
  { name: "Snacks", icon: "🍿", slug: "snacks" },
  { name: "Chocolates", icon: "🍫", slug: "chocolates" },
  { name: "Soft Drinks", icon: "🥤", slug: "soft-drinks" },
  { name: "Dairy", icon: "🥛", slug: "dairy" },
];

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [recentScans, setRecentScans] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return "";
    }
  };

  // Fetch real categories, scans, and products from database API
  useEffect(() => {
    let isMounted = true;

    Promise.all([
      apiClient.get("/categories").catch(() => ({ data: [] })),
      apiClient.get("/scans/history?limit=4").catch(() => ({ data: [] })),
      apiClient.get("/products?limit=5").catch(() => ({ data: [] })),
    ]).then(([catRes, scanRes, prodRes]) => {
      if (!isMounted) return;

      if (catRes.data && Array.isArray(catRes.data) && catRes.data.length > 0) {
        const mapped = catRes.data.slice(0, 4).map((c) => ({
          name: c.name,
          slug: c.slug,
          icon: CATEGORY_ICONS[c.slug] || "🥗",
        }));
        setCategories(mapped);
      }

      if (
        scanRes.data &&
        Array.isArray(scanRes.data) &&
        scanRes.data.length > 0
      ) {
        setRecentScans(scanRes.data);
      }

      if (
        prodRes.data &&
        Array.isArray(prodRes.data) &&
        prodRes.data.length > 0
      ) {
        setRecentProducts(prodRes.data);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // User name and initials
  const fullName = user?.fullName || "Priya Sharma";
  const firstName = fullName.split(" ")[0] || "Priya";
  const initials =
    fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "PS";

  const getScoreBadgeType = (score) => {
    if (typeof score !== "number") return "moderate";
    if (score >= 80) return "good";
    if (score >= 60) return "moderate";
    if (score >= 40) return "fair";
    return "poor";
  };

  return (
    <div className="nl-home">
      {/* Top Header Card with curved bottom */}
      <div className="nl-home__hero">
        <div className="nl-home__top-row">
          <div>
            <div className="nl-home__greeting-sub">Good morning 👋</div>
            <div className="nl-home__greeting-main">
              Hi {firstName}, ready to <br />
              make a smart choice?
            </div>
          </div>
          <Link to="/profile" className="nl-home__avatar" title="View Profile">
            {initials}
          </Link>
        </div>

        {/* Search bar button */}
        <div
          className="nl-home__search-bar"
          onClick={() => navigate("/search")}
          role="button"
          tabIndex={0}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <span>Search for a product</span>
        </div>
      </div>

      {/* Main Body */}
      <div className="nl-home__body">
        {/* Quick Action Cards */}
        <div className="nl-home__actions-grid">
          <Link to="/search" className="nl-action-card">
            <div className="nl-action-card__icon nl-action-card__icon--scan">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
            <div className="nl-action-card__title">Online Shopping</div>
            <div className="nl-action-card__desc">Search & compare</div>
          </Link>

          <Link to="/compare" className="nl-action-card">
            <div className="nl-action-card__icon nl-action-card__icon--history">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <div className="nl-action-card__title">Comparisons</div>
            <div className="nl-action-card__desc">Rank food items</div>
          </Link>
        </div>

        {/* Categories Section */}
        <div>
          <div className="nl-section-head">
            <h2 className="nl-section-head__title">Categories</h2>
            <Link to="/search" className="nl-section-head__link">
              View all
            </Link>
          </div>
          <div className="nl-categories-row">
            {categories.map((cat) => (
              <Link
                key={cat.slug || cat.name}
                to={`/search?category=${cat.slug}`}
                className="nl-category-box"
              >
                <span className="nl-category-box__icon">{cat.icon}</span>
                <span className="nl-category-box__name">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Scans Section */}
        <div>
          <div className="nl-section-head">
            <h2 className="nl-section-head__title">Recent Scans</h2>
            <Link to="/history" className="nl-section-head__link">
              View all
            </Link>
          </div>
          <div className="nl-scans-list">
            {recentScans.length > 0 ? (
              recentScans.map((item) => {
                const score =
                  item.score !== null ? Math.round(Number(item.score)) : 70;
                const badgeType = getScoreBadgeType(score);
                const badgeLabel =
                  badgeType.charAt(0).toUpperCase() + badgeType.slice(1);
                const isOffline = item.mode === "offline";

                return (
                  <Link
                    key={item.id}
                    to="/history"
                    className="nl-scan-card nl-scan-card--interactive"
                  >
                    <div className="nl-scan-card__icon">
                      <span style={{ fontSize: "1.2rem" }}>
                        {isOffline ? "📷" : "🥗"}
                      </span>
                    </div>
                    <div className="nl-scan-card__info">
                      <div className="nl-scan-card__name">
                        {item.productName}
                      </div>
                      <div
                        className="nl-scan-card__score"
                        style={{
                          fontWeight: 600,
                          color: "var(--nl-teal-dark)",
                        }}
                      >
                        {item.brand ? `${item.brand} • ` : ""}Score: {score}/100
                      </div>
                      <div
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--nl-text-muted)",
                          marginTop: "2px",
                          display: "flex",
                          gap: "6px",
                          alignItems: "center",
                        }}
                      >
                        {item.createdAt && (
                          <span>{formatDate(item.createdAt)}</span>
                        )}
                        {item.createdAt && <span>•</span>}
                        <span
                          style={{
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            color: isOffline ? "#0f766e" : "#1d4ed8",
                            background: isOffline ? "#ccfbf1" : "#dbeafe",
                            padding: "1px 5px",
                            borderRadius: "4px",
                            textTransform: "uppercase",
                          }}
                        >
                          {isOffline ? "Offline Scan" : "Online Analysis"}
                        </span>
                      </div>
                    </div>
                    <span className={`nl-badge nl-badge--${badgeType}`}>
                      {badgeLabel}
                    </span>
                  </Link>
                );
              })
            ) : recentProducts.length > 0 ? (
              recentProducts.map((item) => {
                const score = item.health_score
                  ? Math.round(Number(item.health_score))
                  : 65;
                const badgeType = getScoreBadgeType(score);
                const badgeLabel =
                  badgeType.charAt(0).toUpperCase() + badgeType.slice(1);

                return (
                  <Link
                    key={item.id}
                    to={`/product/${item.id}`}
                    className="nl-scan-card nl-scan-card--interactive"
                  >
                    <div className="nl-scan-card__icon">
                      <span style={{ fontSize: "1.2rem" }}>
                        {CATEGORY_ICONS[item.category_slug] || "🥗"}
                      </span>
                    </div>
                    <div className="nl-scan-card__info">
                      <div className="nl-scan-card__name">{item.name}</div>
                      <div className="nl-scan-card__score">
                        {item.brand ? `${item.brand} • ` : ""}Score: {score}/100
                      </div>
                    </div>
                    <span className={`nl-badge nl-badge--${badgeType}`}>
                      {badgeLabel}
                    </span>
                  </Link>
                );
              })
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "20px",
                  color: "var(--nl-text-muted)",
                }}
              >
                {loading ? "Loading products..." : "No recent products found."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
