const db = require("../config/db");
const rankingService = require("./rankingService");

/**
 * ComparisonService
 *
 * Manages comparison persistence in PostgreSQL (`comparisons` & `comparison_products` tables).
 */
const comparisonService = {
  /**
   * Evaluates product ranking and stores the comparison in PostgreSQL.
   *
   * @param {Object} params - { productIds, products, userId, sessionId, title, mode }
   * @returns {Promise<Object>} Comparison record with ranked results
   */
  async createComparison({
    productIds = [],
    products = [],
    userId = null,
    sessionId = null,
    title = "Food Comparison",
    mode = null,
  } = {}) {
    const items =
      Array.isArray(products) && products.length > 0 ? products : productIds;

    if (!Array.isArray(items) || items.length < 2) {
      const err = new Error(
        "At least 2 products are required to create a comparison",
      );
      err.statusCode = 400;
      throw err;
    }

    // 1. Calculate ranks using unified RankingService
    const { results } = await rankingService.rankProducts(items);

    // 2. Determine mode if not explicitly provided
    let comparisonMode = mode;
    if (!comparisonMode) {
      const allScanned = results.every(
        (r) =>
          r.product &&
          (r.product.is_scanned || String(r.productId).startsWith("scanned-")),
      );
      const allCatalog = results.every(
        (r) =>
          r.product && !r.product.is_scanned && typeof r.productId === "number",
      );
      comparisonMode = allScanned
        ? "offline"
        : allCatalog
          ? "online"
          : "hybrid";
    }

    // 3. Insert parent record in `comparisons`
    const insertCompQuery = `
      INSERT INTO comparisons (user_id, session_id, title, mode, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, user_id, session_id, title, mode, created_at
    `;
    const compRes = await db.query(insertCompQuery, [
      userId,
      sessionId,
      title || "Food Comparison",
      comparisonMode,
    ]);
    const comparison = compRes.rows[0];

    // 4. Insert individual ranked products into `comparison_products`
    for (const item of results) {
      const numericProdId =
        typeof item.productId === "number" ? item.productId : null;
      const prodName = item.product ? item.product.name : "Product";
      const itemScore = item.score !== undefined ? item.score : 0;
      const itemMode =
        item.product?.is_scanned ||
        String(item.productId).startsWith("scanned-")
          ? "offline"
          : "online";

      const insertProdQuery = `
        INSERT INTO comparison_products (comparison_id, product_id, product_name, score, rank, mode, product_data, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      `;
      await db.query(insertProdQuery, [
        comparison.id,
        numericProdId,
        prodName,
        itemScore,
        item.rank,
        itemMode,
        JSON.stringify(item),
      ]);
    }

    return {
      comparisonId: comparison.id,
      userId: comparison.user_id,
      sessionId: comparison.session_id,
      title: comparison.title,
      mode: comparison.mode,
      createdAt: comparison.created_at,
      results,
    };
  },

  /**
   * Retrieves comparison history for a user (or public comparisons).
   *
   * @param {Object} params - { userId, limit, offset }
   * @returns {Promise<Array>} List of past comparisons with summary products
   */
  async getComparisonHistory({ userId = null, limit = 20, offset = 0 } = {}) {
    let compQuery;
    let params = [];

    if (userId) {
      compQuery = `
        SELECT id, user_id, session_id, title, mode, created_at
        FROM comparisons
        WHERE user_id = $1 OR user_id IS NULL
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `;
      params = [userId, limit, offset];
    } else {
      compQuery = `
        SELECT id, user_id, session_id, title, mode, created_at
        FROM comparisons
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `;
      params = [limit, offset];
    }

    const compRes = await db.query(compQuery, params);
    const comparisons = compRes.rows;

    if (comparisons.length === 0) {
      return [];
    }

    const comparisonIds = comparisons
      .map((c) => parseInt(c.id, 10))
      .filter((id) => !isNaN(id));

    if (comparisonIds.length === 0) {
      return [];
    }

    // Fetch products for all these comparisons using standard SQL IN clause
    const inClause = comparisonIds.join(", ");
    const itemsQuery = `
      SELECT comparison_id, product_id, product_name, score, rank, mode, product_data
      FROM comparison_products
      WHERE comparison_id IN (${inClause})
      ORDER BY rank ASC
    `;
    const itemsRes = await db.query(itemsQuery);

    const itemsByCompId = {};
    for (const item of itemsRes.rows) {
      if (!itemsByCompId[item.comparison_id]) {
        itemsByCompId[item.comparison_id] = [];
      }
      itemsByCompId[item.comparison_id].push({
        productId: item.product_id,
        productName: item.product_name,
        score: item.score !== null ? Number(item.score) : 0,
        rank: item.rank,
        mode: item.mode || "offline",
      });
    }

    return comparisons.map((comp) => {
      const compProducts = itemsByCompId[comp.id] || [];
      const winner =
        compProducts.find((p) => p.rank === 1) || compProducts[0] || null;

      return {
        id: comp.id,
        userId: comp.user_id,
        title: comp.title,
        mode: comp.mode || "offline",
        createdAt: comp.created_at,
        productCount: compProducts.length,
        winner: winner
          ? {
              name: winner.productName,
              score: winner.score,
            }
          : null,
        products: compProducts,
      };
    });
  },

  /**
   * Retrieves an existing comparison by its ID with full product ranking and comparison table.
   *
   * @param {number|string} id - Comparison ID
   * @returns {Promise<Object>} Comparison record with ranked results and table
   */
  async getComparisonById(id) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || numericId <= 0) {
      const err = new Error("Invalid comparison ID");
      err.statusCode = 400;
      throw err;
    }

    // 1. Fetch comparison header
    const compQuery = `
      SELECT id, user_id, session_id, title, mode, created_at
      FROM comparisons
      WHERE id = $1
    `;
    const compRes = await db.query(compQuery, [numericId]);
    if (!compRes.rows || compRes.rows.length === 0) {
      const err = new Error(`Comparison not found with ID ${id}`);
      err.statusCode = 404;
      throw err;
    }
    const comparison = compRes.rows[0];

    // 2. Fetch associated products
    const itemsQuery = `
      SELECT cp.product_id, cp.product_name, cp.score, cp.rank, cp.mode, cp.product_data
      FROM comparison_products cp
      WHERE cp.comparison_id = $1
      ORDER BY cp.rank ASC
    `;
    const itemsRes = await db.query(itemsQuery, [numericId]);

    let results = [];

    // Check if stored product_data exists
    const hasStoredData = itemsRes.rows.some((r) => r.product_data);

    if (hasStoredData) {
      results = itemsRes.rows.map((r) => {
        const parsed =
          typeof r.product_data === "string"
            ? JSON.parse(r.product_data)
            : r.product_data || {};

        return {
          productId: r.product_id || parsed.productId || `prod-${r.rank}`,
          rank: r.rank,
          score: r.score !== null ? Number(r.score) : parsed.score || 0,
          product: parsed.product || {
            id: r.product_id,
            name: r.product_name,
            health_score: r.score,
          },
          breakdown: parsed.breakdown || {},
          positives: parsed.positives || [],
          negatives: parsed.negatives || [],
          warnings: parsed.warnings || [],
          dataCompleteness: parsed.dataCompleteness || 100,
          analysisVersion: parsed.analysisVersion || "1.0",
        };
      });
    } else {
      // Re-evaluate from product IDs if legacy row
      const productIds = itemsRes.rows.map((r) => r.product_id).filter(Boolean);
      if (productIds.length > 0) {
        const ranking = await rankingService.rankProducts(productIds);
        results = ranking.results;
      }
    }

    // Build comparison table data for side-by-side view
    const comparisonTable = {
      columns: results.map((r) => ({
        name: r.product?.name || "Product",
        brand: r.product?.brand || "",
        rank: r.rank,
        score: r.score,
      })),
      rows: [
        {
          metric: "NutriLens Health Score",
          unit: "/100",
          values: results.map((r) => r.score),
        },
        {
          metric: "Calories",
          unit: "kcal",
          values: results.map((r) => r.product?.calories ?? "—"),
        },
        {
          metric: "Total Sugar",
          unit: "g",
          values: results.map((r) => r.product?.total_sugar ?? "—"),
        },
        {
          metric: "Added Sugar",
          unit: "g",
          values: results.map((r) => r.product?.added_sugar ?? "—"),
        },
        {
          metric: "Total Fat",
          unit: "g",
          values: results.map((r) => r.product?.total_fat ?? "—"),
        },
        {
          metric: "Saturated Fat",
          unit: "g",
          values: results.map((r) => r.product?.saturated_fat ?? "—"),
        },
        {
          metric: "Sodium",
          unit: "mg",
          values: results.map((r) => r.product?.sodium ?? "—"),
        },
        {
          metric: "Dietary Fiber",
          unit: "g",
          values: results.map((r) => r.product?.fiber ?? "—"),
        },
        {
          metric: "Protein",
          unit: "g",
          values: results.map((r) => r.product?.protein ?? "—"),
        },
      ],
    };

    return {
      comparisonId: comparison.id,
      userId: comparison.user_id,
      sessionId: comparison.session_id,
      title: comparison.title,
      mode: comparison.mode || "offline",
      createdAt: comparison.created_at,
      results,
      comparisonTable,
    };
  },
};

module.exports = comparisonService;
