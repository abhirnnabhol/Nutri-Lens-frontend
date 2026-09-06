const comparisonService = require("../services/comparisonService");

const comparisonController = {
  /**
   * POST /api/comparisons
   * Body: { products?: Array, productIds?: Array, title?: string, mode?: string, sessionId?: string }
   */
  async createComparison(req, res, next) {
    try {
      const { productIds, products, title, sessionId, mode } = req.body || {};
      const userId = req.user ? req.user.id : req.body.userId || null;
      const items =
        Array.isArray(products) && products.length > 0 ? products : productIds;

      if (!items || !Array.isArray(items) || items.length < 2) {
        return res.status(400).json({
          success: false,
          error: "At least 2 products are required to create a comparison",
        });
      }

      const comparison = await comparisonService.createComparison({
        productIds,
        products,
        userId,
        sessionId,
        title: title || "Food Comparison",
        mode,
      });

      return res.status(201).json({
        success: true,
        data: comparison,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/comparisons/history
   * Retrieves comparison history for the user.
   */
  async getComparisonHistory(req, res, next) {
    try {
      const userId = req.user ? req.user.id : req.query.userId || null;
      const limit = parseInt(req.query.limit, 10) || 20;
      const offset = parseInt(req.query.offset, 10) || 0;

      const comparisons = await comparisonService.getComparisonHistory({
        userId,
        limit,
        offset,
      });

      return res.status(200).json({
        success: true,
        data: comparisons,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/comparisons/:id
   * Retrieves single comparison with ranked products and side-by-side comparison table.
   */
  async getComparisonById(req, res, next) {
    try {
      const comparison = await comparisonService.getComparisonById(
        req.params.id,
      );

      return res.status(200).json({
        success: true,
        data: comparison,
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = comparisonController;
