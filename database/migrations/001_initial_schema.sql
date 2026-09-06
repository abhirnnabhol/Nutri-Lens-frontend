-- ==========================================================
-- NutriLens Database Schema
-- Migration 001: Initial Core Schema
-- ==========================================================

-- Product categories (e.g. Snacks, Beverages, Dairy, etc.)
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Master products table with nutrition facts per serving
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(255) NOT NULL,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  serving_size NUMERIC(10,2) NOT NULL,
  serving_unit VARCHAR(20) NOT NULL DEFAULT 'g',
  servings_per_container NUMERIC(10,2),
  
  -- Macronutrients (per serving)
  calories NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_fat NUMERIC(10,2) NOT NULL DEFAULT 0,
  saturated_fat NUMERIC(10,2) NOT NULL DEFAULT 0,
  trans_fat NUMERIC(10,2) NOT NULL DEFAULT 0,
  cholesterol NUMERIC(10,2) NOT NULL DEFAULT 0,
  sodium NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_carbohydrates NUMERIC(10,2) NOT NULL DEFAULT 0,
  dietary_fiber NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_sugars NUMERIC(10,2) NOT NULL DEFAULT 0,
  added_sugars NUMERIC(10,2) NOT NULL DEFAULT 0,
  protein NUMERIC(10,2) NOT NULL DEFAULT 0,
  
  -- Metadata
  barcode VARCHAR(50),
  image_url VARCHAR(512),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ingredients master catalog with safety classification
CREATE TABLE IF NOT EXISTS ingredients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  safety_level VARCHAR(20) NOT NULL DEFAULT 'green'
    CHECK (safety_level IN ('green', 'yellow', 'red')),
  category VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Many-to-many link between products and ingredients with ingredient rank/position
CREATE TABLE IF NOT EXISTS product_ingredients (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  ingredient_id INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  UNIQUE(product_id, ingredient_id)
);

-- Comparisons session table
CREATE TABLE IF NOT EXISTS comparisons (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(100),
  title VARCHAR(255) DEFAULT 'Food Comparison',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comparison items
CREATE TABLE IF NOT EXISTS comparison_items (
  id SERIAL PRIMARY KEY,
  comparison_id INTEGER NOT NULL REFERENCES comparisons(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  custom_product_data JSONB,
  health_score NUMERIC(5,2),
  nutrition_score NUMERIC(5,2),
  ingredient_score NUMERIC(5,2),
  ranking INTEGER,
  explanation JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_product_ingredients_product ON product_ingredients(product_id);
CREATE INDEX IF NOT EXISTS idx_product_ingredients_ingredient ON product_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_comparison_items_comparison ON comparison_items(comparison_id);

