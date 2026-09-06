const db = require("../config/db");

/**
 * ScanService
 * Manages scan history persistence and retrieval.
 * Tables used: `scans`
 */
const scanService = {
  /**
   * Creates and stores a new scan record.
   */
  async createScan({
    userId = null,
    productId = null,
    productName,
    score = null,
    mode = "offline",
    imageUrl = null,
    rawText = null,
    productData = null,
  }) {
    const query = `
      INSERT INTO scans (user_id, product_id, product_name, score, mode, image_url, raw_text, product_data, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING id, user_id, product_id, product_name, score, mode, image_url, raw_text, product_data, created_at
    `;

    const numericScore =
      score !== null && score !== undefined && !isNaN(Number(score))
        ? Number(score)
        : null;

    const values = [
      userId,
      productId,
      productName || "Scanned Food Product",
      numericScore,
      mode || "offline",
      imageUrl,
      rawText,
      productData ? JSON.stringify(productData) : null,
    ];

    const res = await db.query(query, values);
    const row = res.rows[0];

    return {
      id: row.id,
      userId: row.user_id,
      productId: row.product_id,
      productName: row.product_name,
      score: row.score !== null ? Number(row.score) : null,
      mode: row.mode,
      imageUrl: row.image_url,
      rawText: row.raw_text,
      productData:
        typeof row.product_data === "string"
          ? JSON.parse(row.product_data)
          : row.product_data,
      createdAt: row.created_at,
    };
  },

  /**
   * Retrieves scan history for a user (or public scans if unauthenticated).
   */
  async getScanHistory({ userId = null, limit = 50, offset = 0 } = {}) {
    let query;
    let params = [];

    if (userId) {
      query = `
        SELECT id, user_id, product_id, product_name, score, mode, image_url, raw_text, product_data, created_at
        FROM scans
        WHERE user_id = $1 OR user_id IS NULL
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `;
      params = [userId, limit, offset];
    } else {
      query = `
        SELECT id, user_id, product_id, product_name, score, mode, image_url, raw_text, product_data, created_at
        FROM scans
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `;
      params = [limit, offset];
    }

    const res = await db.query(query, params);

    return res.rows.map((row) => {
      const parsedData =
        typeof row.product_data === "string"
          ? JSON.parse(row.product_data)
          : row.product_data || {};

      return {
        id: row.id,
        userId: row.user_id,
        productId: row.product_id,
        productName: row.product_name || parsedData.name || "Scanned Product",
        score:
          row.score !== null
            ? Number(row.score)
            : parsedData.health_score || null,
        mode: row.mode || parsedData.mode || "offline",
        imageUrl: row.image_url || parsedData.image_url || null,
        createdAt: row.created_at,
        brand: parsedData.brand || null,
        servingSize: parsedData.serving_size || null,
        ingredients: parsedData.ingredients || [],
        positives:
          parsedData.scoreEvaluation?.positives || parsedData.positives || [],
        negatives:
          parsedData.scoreEvaluation?.negatives || parsedData.negatives || [],
        warnings:
          parsedData.scoreEvaluation?.warnings || parsedData.warnings || [],
      };
    });
  },

  /**
   * Retrieves full details for a single scan by ID.
   */
  async getScanById(id) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || numericId <= 0) {
      const err = new Error(`Invalid scan ID: ${id}`);
      err.statusCode = 400;
      throw err;
    }

    const query = `
      SELECT id, user_id, product_id, product_name, score, mode, image_url, raw_text, product_data, created_at
      FROM scans
      WHERE id = $1
    `;

    const res = await db.query(query, [numericId]);
    if (!res.rows || res.rows.length === 0) {
      const err = new Error(`Scan not found with ID ${id}`);
      err.statusCode = 404;
      throw err;
    }

    const row = res.rows[0];
    const data =
      typeof row.product_data === "string"
        ? JSON.parse(row.product_data)
        : row.product_data || {};

    const scoreEval = data.scoreEvaluation || data.score_evaluation || {};

    return {
      id: row.id,
      userId: row.user_id,
      productId: row.product_id,
      productName: row.product_name || data.name || "Scanned Food Product",
      brand: data.brand || null,
      score:
        row.score !== null
          ? Number(row.score)
          : data.health_score || scoreEval.score || null,
      mode: row.mode || data.mode || "offline",
      imageUrl: row.image_url || data.image_url || null,
      rawText: row.raw_text,
      createdAt: row.created_at,
      nutrition: {
        servingSize: data.serving_size || "30g",
        calories: data.calories !== undefined ? data.calories : null,
        protein: data.protein !== undefined ? data.protein : null,
        carbohydrates:
          data.carbohydrates !== undefined ? data.carbohydrates : null,
        totalSugar:
          data.total_sugar !== undefined ? data.total_sugar : data.totalSugar,
        addedSugar:
          data.added_sugar !== undefined ? data.added_sugar : data.addedSugar,
        totalFat: data.total_fat !== undefined ? data.total_fat : data.totalFat,
        saturatedFat:
          data.saturated_fat !== undefined
            ? data.saturated_fat
            : data.saturatedFat,
        transFat: data.trans_fat !== undefined ? data.trans_fat : data.transFat,
        sodium: data.sodium !== undefined ? data.sodium : null,
        fiber: data.fiber !== undefined ? data.fiber : null,
      },
      ingredients: Array.isArray(data.ingredients)
        ? data.ingredients.map((i) =>
            typeof i === "string" ? i : i.name || i.normalized_name || "",
          )
        : typeof data.ingredients === "string"
          ? data.ingredients
              .split(/[,;\n]/)
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
      breakdown: scoreEval.breakdown || {},
      positives: scoreEval.positives || data.positives || [],
      negatives: scoreEval.negatives || data.negatives || [],
      warnings: scoreEval.warnings || data.warnings || [],
      scoreEvaluation: {
        score: row.score !== null ? Number(row.score) : scoreEval.score || 0,
        breakdown: scoreEval.breakdown || {},
        positives: scoreEval.positives || data.positives || [],
        negatives: scoreEval.negatives || data.negatives || [],
        warnings: scoreEval.warnings || data.warnings || [],
        dataCompleteness: scoreEval.dataCompleteness || 100,
        scoreDescription:
          scoreEval.scoreDescription || "NutriLens Health Score",
      },
    };
  },
};

module.exports = scanService;
