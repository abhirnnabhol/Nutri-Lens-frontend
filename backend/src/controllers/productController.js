const productService = require("../services/productService");
const personalizationService = require("../services/personalizationService");
const profileService = require("../services/profileService");

const productController = {
  async getProducts(req, res, next) {
    try {
      const { category, categoryId, search, q, limit, offset } = req.query;

      const products = await productService.getProducts({
        categoryId: categoryId || req.query.category_id,
        categorySlug: category,
        search: search || q,
        limit: limit ? parseInt(limit, 10) : 50,
        offset: offset ? parseInt(offset, 10) : 0,
      });

      res.status(200).json({
        success: true,
        count: products.length,
        data: products,
      });
    } catch (err) {
      next(err);
    }
  },

  async searchProducts(req, res, next) {
    try {
      const searchQuery =
        req.query.q || req.query.search || req.query.query || "";
      const { limit, offset, category } = req.query;

      const products = await productService.getProducts({
        search: searchQuery,
        categorySlug: category,
        limit: limit ? parseInt(limit, 10) : 50,
        offset: offset ? parseInt(offset, 10) : 0,
      });

      res.status(200).json({
        success: true,
        query: searchQuery,
        count: products.length,
        data: products,
      });
    } catch (err) {
      next(err);
    }
  },

  async getProductsByCategory(req, res, next) {
    try {
      const { categoryId } = req.params;
      const { limit, offset, search, q } = req.query;

      const products = await productService.getProducts({
        categoryId,
        search: search || q,
        limit: limit ? parseInt(limit, 10) : 50,
        offset: offset ? parseInt(offset, 10) : 0,
      });

      res.status(200).json({
        success: true,
        categoryId,
        count: products.length,
        data: products,
      });
    } catch (err) {
      next(err);
    }
  },

  async getProductById(req, res, next) {
    try {
      const product = await productService.getProductById(req.params.id);
      const userId = req.user ? req.user.id : req.query.userId || null;
      let personalizedInsight = null;

      if (userId) {
        try {
          const profile = await profileService.getHealthProfile(userId);
          personalizedInsight = personalizationService.generateProductInsight(
            product,
            profile,
          );
        } catch (e) {
          // Non-blocking
        }
      }

      res.status(200).json({
        success: true,
        data: {
          ...product,
          personalizedInsight,
        },
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = productController;
