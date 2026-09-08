-- ==========================================================
-- NutriLens Database Schema
-- Migration 002: Users, Profiles, and Activity History
-- ==========================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  profile_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User health and physical profile
CREATE TABLE IF NOT EXISTS user_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  age INTEGER,
  gender VARCHAR(20),
  height NUMERIC(6,2),
  height_unit VARCHAR(10) DEFAULT 'cm',
  weight NUMERIC(6,2),
  weight_unit VARCHAR(10) DEFAULT 'kg',
  dietary_preference VARCHAR(50),
  health_goals TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Health conditions tagged to user
CREATE TABLE IF NOT EXISTS user_health_conditions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  condition VARCHAR(100) NOT NULL,
  UNIQUE(user_id, condition)
);

-- Allergies tagged to user
CREATE TABLE IF NOT EXISTS user_allergies (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  allergy VARCHAR(100) NOT NULL,
  UNIQUE(user_id, allergy)
);

-- User scan history
CREATE TABLE IF NOT EXISTS scan_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  health_score NUMERIC(5,2),
  custom_product_data JSONB,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User search history
CREATE TABLE IF NOT EXISTS search_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  query VARCHAR(255) NOT NULL,
  searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_history_user ON scan_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id);

