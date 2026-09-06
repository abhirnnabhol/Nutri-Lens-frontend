const categoryModel = require("../models/categoryModel");

const categoryService = {
  async getAllCategories() {
    return categoryModel.findAll();
  },

  async getCategoryBySlug(slug) {
    const category = await categoryModel.findBySlug(slug);
    if (!category) {
      const err = new Error(`Category not found with slug: ${slug}`);
      err.statusCode = 404;
      throw err;
    }
    return category;
  },
};

module.exports = categoryService;
