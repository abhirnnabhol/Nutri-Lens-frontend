-- ==========================================================
-- NutriLens Database Schema
-- Phase 2 Migration: Core Tables and Relations
-- ==========================================================

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255),
  full_name VARCHAR(255),
  profile_complete BOOLEAN DEFAULT FALSE,
  notification_preferences BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Categories
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Products
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  brand VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url VARCHAR(512),
  serving_size VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Nutrition Facts (per serving)
CREATE TABLE IF NOT EXISTS nutrition_facts (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  calories NUMERIC(10,2) NOT NULL DEFAULT 0,
  protein NUMERIC(10,2) NOT NULL DEFAULT 0,
  carbohydrates NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_sugar NUMERIC(10,2) NOT NULL DEFAULT 0,
  added_sugar NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_fat NUMERIC(10,2) NOT NULL DEFAULT 0,
  saturated_fat NUMERIC(10,2) NOT NULL DEFAULT 0,
  trans_fat NUMERIC(10,2) NOT NULL DEFAULT 0,
  sodium NUMERIC(10,2) NOT NULL DEFAULT 0,
  fiber NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id)
);

-- 5. Ingredients Catalog
CREATE TABLE IF NOT EXISTS ingredients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  normalized_name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Product Ingredients (linking products to ordered ingredients)
CREATE TABLE IF NOT EXISTS product_ingredients (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  ingredient_id INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  UNIQUE(product_id, ingredient_id)
);

-- 7. Product Scores
CREATE TABLE IF NOT EXISTS product_scores (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  health_score NUMERIC(5,2),
  nutrition_score NUMERIC(5,2),
  ingredient_score NUMERIC(5,2),
  breakdown JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id)
);

-- 8. Scans (OCR, food label scans, and online product analyses)
CREATE TABLE IF NOT EXISTS scans (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255),
  score NUMERIC(5,2),
  mode VARCHAR(20) DEFAULT 'offline',
  image_url TEXT,
  raw_text TEXT,
  product_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Comparisons
CREATE TABLE IF NOT EXISTS comparisons (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  session_id VARCHAR(100),
  title VARCHAR(255) DEFAULT 'Food Comparison',
  mode VARCHAR(20) DEFAULT 'offline',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Comparison Products
CREATE TABLE IF NOT EXISTS comparison_products (
  id SERIAL PRIMARY KEY,
  comparison_id INTEGER NOT NULL REFERENCES comparisons(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255),
  score NUMERIC(5,2),
  rank INTEGER,
  mode VARCHAR(20) DEFAULT 'offline',
  product_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Health Profiles (Personalization only; not for medical diagnosis)
CREATE TABLE IF NOT EXISTS health_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  age INTEGER,
  gender VARCHAR(20),
  height_cm NUMERIC(6,2),
  weight_kg NUMERIC(6,2),
  health_conditions TEXT[] DEFAULT '{}'::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Indexes for optimal querying
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_nutrition_product ON nutrition_facts(product_id);
CREATE INDEX IF NOT EXISTS idx_prod_ing_product ON product_ingredients(product_id);
CREATE INDEX IF NOT EXISTS idx_prod_ing_ingredient ON product_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_comp_prod_comparison ON comparison_products(comparison_id);

