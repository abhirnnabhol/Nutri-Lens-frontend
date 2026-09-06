const db = require("../config/db");

/**
 * Category Model - Data Access Layer
 */
const categoryModel = {
  async findAll() {
    const res = await db.query(
      "SELECT id, name, slug, description, created_at FROM categories ORDER BY id ASC",
    );
    return res.rows;
  },

  async findBySlug(slug) {
    const res = await db.query(
      "SELECT id, name, slug, description, created_at FROM categories WHERE slug = $1",
      [slug],
    );
    return res.rows[0] || null;
  },

  async findById(id) {
    const res = await db.query(
      "SELECT id, name, slug, description, created_at FROM categories WHERE id = $1",
      [id],
    );
    return res.rows[0] || null;
  },
};

module.exports = categoryModel;
