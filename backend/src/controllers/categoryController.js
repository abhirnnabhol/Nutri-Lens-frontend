const categoryService = require("../services/categoryService");

const categoryController = {
  async getCategories(_req, res, next) {
    try {
      const categories = await categoryService.getAllCategories();
      res.status(200).json({
        success: true,
        count: categories.length,
        data: categories,
      });
    } catch (err) {
      next(err);
    }
  },

  async getCategoryBySlug(req, res, next) {
    try {
      const category = await categoryService.getCategoryBySlug(req.params.slug);
      res.status(200).json({
        success: true,
        data: category,
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = categoryController;
