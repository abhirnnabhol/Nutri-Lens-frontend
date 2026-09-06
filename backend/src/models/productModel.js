const db = require("../config/db");

/**
 * Product Model - Data Access Layer
 */
const productModel = {
  async findAll({
    categoryId,
    categorySlug,
    search,
    limit = 50,
    offset = 0,
  } = {}) {
    const conditions = [];
    const params = [];

    let query = `
      SELECT 
        p.id,
        p.category_id,
        c.name AS category_name,
        c.slug AS category_slug,
        p.brand,
        p.name,
        p.description,
        p.image_url,
        p.serving_size,
        p.created_at,
        nf.calories,
        nf.protein,
        nf.carbohydrates,
        nf.total_sugar,
        nf.added_sugar,
        nf.total_fat,
        nf.saturated_fat,
        nf.trans_fat,
        nf.sodium,
        nf.fiber,
        ps.health_score,
        ps.nutrition_score,
        ps.ingredient_score
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN nutrition_facts nf ON p.id = nf.product_id
      LEFT JOIN product_scores ps ON p.id = ps.product_id
    `;

    const catFilter = categoryId || categorySlug;
    if (catFilter && catFilter !== "all") {
      const numericCatId = parseInt(catFilter, 10);
      if (
        !isNaN(numericCatId) &&
        String(numericCatId) === String(catFilter).trim()
      ) {
        params.push(numericCatId);
        conditions.push(`(p.category_id = $${params.length})`);
      } else {
        params.push(String(catFilter).trim().toLowerCase());
        conditions.push(
          `(LOWER(c.slug) = $${params.length} OR LOWER(c.name) = $${params.length})`,
        );
      }
    }

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      conditions.push(
        `(LOWER(p.name) LIKE $${params.length} OR LOWER(p.brand) LIKE $${params.length} OR LOWER(c.name) LIKE $${params.length} OR LOWER(c.slug) LIKE $${params.length})`,
      );
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += ` ORDER BY p.id ASC`;

    params.push(limit);
    query += ` LIMIT $${params.length}`;

    params.push(offset);
    query += ` OFFSET $${params.length}`;

    const res = await db.query(query, params);
    return res.rows;
  },

  async findById(id) {
    const query = `
      SELECT 
        p.id,
        p.category_id,
        c.name AS category_name,
        c.slug AS category_slug,
        p.brand,
        p.name,
        p.description,
        p.image_url,
        p.serving_size,
        p.created_at,
        nf.calories,
        nf.protein,
        nf.carbohydrates,
        nf.total_sugar,
        nf.added_sugar,
        nf.total_fat,
        nf.saturated_fat,
        nf.trans_fat,
        nf.sodium,
        nf.fiber,
        ps.health_score,
        ps.nutrition_score,
        ps.ingredient_score,
        ps.breakdown AS score_breakdown
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN nutrition_facts nf ON p.id = nf.product_id
      LEFT JOIN product_scores ps ON p.id = ps.product_id
      WHERE p.id = $1
    `;

    const res = await db.query(query, [id]);
    if (!res.rows || res.rows.length === 0) {
      return null;
    }

    const product = res.rows[0];

    // Fetch associated ingredients ordered by position
    const ingQuery = `
      SELECT 
        i.id,
        i.name,
        i.normalized_name,
        i.category,
        pi.position
      FROM product_ingredients pi
      JOIN ingredients i ON pi.ingredient_id = i.id
      WHERE pi.product_id = $1
      ORDER BY pi.position ASC
    `;
    const ingRes = await db.query(ingQuery, [id]);
    product.ingredients = ingRes.rows || [];

    return product;
  },
};

module.exports = productModel;
