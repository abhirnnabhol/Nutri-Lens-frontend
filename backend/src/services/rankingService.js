const productModel = require("../models/productModel");
const healthScoreService = require("./healthScoreService");

/**
 * RankingService
 *
 * Core service for multi-product nutritional comparison and ranking.
 *
 * Pipeline:
 * Normalized Product Data
 *  → HealthScoreService
 *  → RankingService (sort descending by score, assign rank 1..N)
 */
class RankingService {
  constructor(scoringService = healthScoreService) {
    this.scoringService = scoringService;
  }

  /**
   * Ranks an array of products by their NutriLens Health Score.
   *
   * @param {Array<number|Object>} productsOrIds - Array of product IDs or product objects
   * @returns {Promise<Object>} Object containing ranked results array
   */
  async rankProducts(productsOrIds = []) {
    if (!Array.isArray(productsOrIds) || productsOrIds.length === 0) {
      const err = new Error("productIds must be a non-empty array");
      err.statusCode = 400;
      throw err;
    }

    // 1. Resolve full product data with nutrition facts and ingredients
    const products = [];
    for (const item of productsOrIds) {
      if (typeof item === "number" || typeof item === "string") {
        const id = parseInt(item, 10);
        if (isNaN(id) || id <= 0) {
          const err = new Error(`Invalid product ID: ${item}`);
          err.statusCode = 400;
          throw err;
        }
        const fullProd = await productModel.findById(id);
        if (!fullProd) {
          const err = new Error(`Product not found with ID ${id}`);
          err.statusCode = 404;
          throw err;
        }
        products.push(fullProd);
      } else if (item && typeof item === "object" && item.id) {
        // If product has non-numeric ID (e.g. scanned-...) or already has ingredients array, use it directly
        const isNumericId =
          typeof item.id === "number" ||
          (!isNaN(Number(item.id)) && !String(item.id).startsWith("scanned-"));

        if (Array.isArray(item.ingredients) || !isNumericId) {
          products.push({
            ...item,
            ingredients: Array.isArray(item.ingredients)
              ? item.ingredients
              : typeof item.ingredients === "string"
                ? item.ingredients
                    .split(/[,;\n]/)
                    .map((s) => s.trim())
                    .filter(Boolean)
                : [],
          });
        } else {
          const fullProd = await productModel.findById(parseInt(item.id, 10));
          products.push(fullProd || item);
        }
      }
    }

    if (products.length === 0) {
      const err = new Error("No valid products found for ranking");
      err.statusCode = 400;
      throw err;
    }

    // 2. Score each product using HealthScoreService
    const evaluatedItems = products.map((prod) => {
      const ingredientNames = (prod.ingredients || [])
        .map((ing) =>
          typeof ing === "string" ? ing : ing.name || ing.normalized_name || "",
        )
        .filter(Boolean);

      const evaluation = this.scoringService.calculateHealthScore(
        prod,
        ingredientNames,
      );

      return {
        productId: prod.id,
        score: evaluation.score !== null ? evaluation.score : 0,
        product: {
          id: prod.id,
          name: prod.name,
          brand: prod.brand,
          category_id: prod.category_id,
          category_name: prod.category_name,
          category_slug: prod.category_slug,
          image_url: prod.image_url,
          serving_size: prod.serving_size,
          calories: prod.calories,
          protein: prod.protein,
          carbohydrates: prod.carbohydrates,
          total_sugar: prod.total_sugar,
          added_sugar: prod.added_sugar,
          total_fat: prod.total_fat,
          saturated_fat: prod.saturated_fat,
          trans_fat: prod.trans_fat,
          sodium: prod.sodium,
          fiber: prod.fiber,
        },
        breakdown: evaluation.breakdown,
        positives: evaluation.positives,
        negatives: evaluation.negatives,
        warnings: evaluation.warnings,
        dataCompleteness: evaluation.dataCompleteness,
        analysisVersion: evaluation.analysisVersion,
      };
    });

    // 3. Sort descending by score (with deterministic tie-breaking: lower sugar, higher fiber, or ID)
    evaluatedItems.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // Tie breaker 1: lower total sugar
      const sugarA =
        a.product.total_sugar !== undefined
          ? Number(a.product.total_sugar)
          : 999;
      const sugarB =
        b.product.total_sugar !== undefined
          ? Number(b.product.total_sugar)
          : 999;
      if (sugarA !== sugarB) return sugarA - sugarB;

      // Tie breaker 2: higher fiber
      const fiberA =
        a.product.fiber !== undefined ? Number(a.product.fiber) : 0;
      const fiberB =
        b.product.fiber !== undefined ? Number(b.product.fiber) : 0;
      if (fiberA !== fiberB) return fiberB - fiberA;

      // Tie breaker 3: product ID
      if (typeof a.productId === "number" && typeof b.productId === "number") {
        return a.productId - b.productId;
      }
      return String(a.productId).localeCompare(String(b.productId));
    });

    // 4. Assign rank 1..N
    const results = evaluatedItems.map((item, index) => ({
      productId: item.productId,
      rank: index + 1,
      score: item.score,
      product: item.product,
      breakdown: item.breakdown,
      positives: item.positives,
      negatives: item.negatives,
      warnings: item.warnings,
      dataCompleteness: item.dataCompleteness,
      analysisVersion: item.analysisVersion,
    }));

    return { results };
  }
}

const defaultRankingService = new RankingService();

module.exports = defaultRankingService;
module.exports.RankingService = RankingService;
