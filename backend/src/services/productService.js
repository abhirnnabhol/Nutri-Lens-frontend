const productModel = require("../models/productModel");
const healthScoreService = require("./healthScoreService");

const productService = {
  async getProducts(filters = {}) {
    return productModel.findAll(filters);
  },

  async getProductById(id) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || numericId <= 0) {
      const err = new Error("Invalid product ID");
      err.statusCode = 400;
      throw err;
    }

    const product = await productModel.findById(numericId);
    if (!product) {
      const err = new Error(`Product not found with ID ${id}`);
      err.statusCode = 404;
      throw err;
    }

    // Attach dynamic score evaluation using HealthScoreService
    try {
      const ingredientNames = (product.ingredients || []).map(
        (i) => i.name || i.normalized_name || "",
      );
      const scoreEvaluation = healthScoreService.calculateHealthScore(
        product,
        ingredientNames,
      );
      product.score_evaluation = scoreEvaluation;
      product.ingredient_analysis = scoreEvaluation.ingredientAnalysis;
      product.normalized_ingredients = scoreEvaluation.normalizedIngredients;
      // If product has no health_score stored, set it to the calculated score
      if (product.health_score === undefined || product.health_score === null) {
        product.health_score = scoreEvaluation.score;
      }
    } catch (e) {
      // Non-blocking fallback
    }

    return product;
  },
};

module.exports = productService;
