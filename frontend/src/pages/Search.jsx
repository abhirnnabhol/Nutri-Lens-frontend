import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import ProductCard from "../components/common/ProductCard";
import { useApp } from "../context/AppContext";
import apiClient from "../services/api";

const POPULAR_SEARCH_TAGS = [
  "Crisps",
  "Chocolate",
  "Cola",
  "Yogurt",
  "Noodles",
  "Juice",
];

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const urlCategory = searchParams.get("category") || "all";
  const urlQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(urlQuery);
  const [activeCategory, setActiveCategory] = useState(urlCategory);
  const [categories, setCategories] = useState([{ name: "All", slug: "all" }]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const {
    selectedProducts,
    toggleProductSelection,
    isProductSelected,
    clearSelectedProducts,
  } = useApp();

  // Fetch real categories
  useEffect(() => {
    apiClient
      .get("/categories")
      .then((res) => {
        if (res.data && Array.isArray(res.data)) {
          setCategories([{ name: "All", slug: "all" }, ...res.data]);
        }
      })
      .catch(() => {});
  }, []);

  // Synchronize with URL params
  useEffect(() => {
    if (urlCategory !== activeCategory) {
      setActiveCategory(urlCategory);
    }
  }, [urlCategory]);

  // Fetch products based on search query and category
  const fetchProducts = useCallback(async (searchTerm, categorySlug) => {
    setLoading(true);
    try {
      let endpoint = "/products";
      const params = new URLSearchParams();

      if (searchTerm && searchTerm.trim()) {
        endpoint = "/products/search";
        params.set("q", searchTerm.trim());
      }

      if (categorySlug && categorySlug !== "all") {
        params.set("category", categorySlug);
      }

      const queryString = params.toString();
      const url = queryString ? `${endpoint}?${queryString}` : endpoint;

      const res = await apiClient.get(url);
      setProducts(res.data || []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(query, activeCategory);
    }, 200);

    return () => clearTimeout(timer);
  }, [query, activeCategory, fetchProducts]);

  const handleCategorySelect = (slug) => {
    setActiveCategory(slug);
    const newParams = new URLSearchParams(searchParams);
    if (slug === "all") {
      newParams.delete("category");
    } else {
      newParams.set("category", slug);
    }
    setSearchParams(newParams);
  };

  const handleTagClick = (tag) => {
    setQuery(tag);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("q", tag);
    setSearchParams(newParams);
  };

  const handleCompareClick = () => {
    navigate("/compare");
  };

  return (
    <div
      className="nl-search-page"
      style={{
        paddingBottom: selectedProducts.length > 0 ? "130px" : "90px",
      }}
    >
      {/* Search Input Bar (Mockup 5) */}
      <div className="nl-search-input-wrap">
        <svg
          className="nl-search-icon"
          width="20"
          height="20"
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
        <input
          type="text"
          className="nl-search-input"
          placeholder="Search food by name, brand, or category..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            style={{
              background: "none",
              border: "none",
              padding: "0 8px",
              cursor: "pointer",
              color: "var(--nl-text-muted)",
              fontSize: "1rem",
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Category Filter Chips */}
      <div className="nl-filter-chips">
        {categories.map((cat) => (
          <button
            key={cat.slug}
            type="button"
            className={`nl-chip ${activeCategory === cat.slug ? "nl-chip--active" : ""}`}
            onClick={() => handleCategorySelect(cat.slug)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Popular / Recent Searches Tags */}
      {!query && (
        <div className="nl-recent-searches" style={{ marginBottom: "20px" }}>
          <h3 className="nl-recent-searches__title">Popular Searches</h3>
          <div className="nl-recent-chips">
            {POPULAR_SEARCH_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                className="nl-recent-tag"
                onClick={() => handleTagClick(tag)}
              >
                <svg
                  width="13"
                  height="13"
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
                <span>{tag}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <h3 className="nl-recent-searches__title" style={{ margin: 0 }}>
          {query ? `Results for "${query}"` : "Packaged Foods Catalog"}
        </h3>
        <span style={{ fontSize: "0.78rem", color: "var(--nl-text-muted)" }}>
          {products.length} product{products.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Product Results List */}
      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px 16px",
            color: "var(--nl-text-muted)",
          }}
        >
          Searching food database...
        </div>
      ) : products.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "36px 16px",
            background: "var(--nl-white)",
            borderRadius: "var(--nl-radius-md)",
            border: "1px solid var(--nl-border)",
            color: "var(--nl-text-muted)",
          }}
        >
          <div style={{ fontSize: "1.8rem", marginBottom: "8px" }}>🔍</div>
          <p
            style={{
              fontWeight: 700,
              color: "var(--nl-text-main)",
              marginBottom: "4px",
            }}
          >
            No products found
          </p>
          <p style={{ fontSize: "0.85rem" }}>
            Try searching for "Crisps", "Chocolate", "PureFarm", or "Noodles"
          </p>
        </div>
      ) : (
        <div className="nl-product-list">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isSelected={isProductSelected(product.id)}
              onSelect={() => toggleProductSelection(product)}
            />
          ))}
        </div>
      )}

      {/* Floating Compare Action Bar when products are selected */}
      {selectedProducts.length > 0 && (
        <div className="nl-floating-compare-bar">
          <div className="nl-floating-compare-bar__count">
            <span className="nl-floating-compare-bar__badge">
              {selectedProducts.length}
            </span>
            <span>Selected for Compare</span>
            <button
              type="button"
              onClick={clearSelectedProducts}
              style={{
                background: "none",
                border: "none",
                color: "#94a3b8",
                textDecoration: "underline",
                fontSize: "0.78rem",
                cursor: "pointer",
                marginLeft: "4px",
              }}
            >
              Clear
            </button>
          </div>

          <button
            type="button"
            className="nl-floating-compare-bar__btn"
            onClick={handleCompareClick}
          >
            <span>Compare ({selectedProducts.length})</span>
            <span>→</span>
          </button>
        </div>
      )}
    </div>
  );
}
