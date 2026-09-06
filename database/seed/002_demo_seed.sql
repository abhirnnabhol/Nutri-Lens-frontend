-- ==========================================================
-- NutriLens Seed Data: Clearly Labelled Demonstration Data
-- Note: These are synthetic benchmark products for testing and
-- do not represent proprietary commercial food formulas.
-- ==========================================================

-- 1. Categories
INSERT INTO categories (name, slug, description) VALUES
('Snacks', 'snacks', 'Savory crisps, chips, nuts, and crackers'),
('Chocolates', 'chocolates', 'Dark, milk, and specialty chocolate confectionery'),
('Soft Drinks', 'soft-drinks', 'Carbonated and flavored sparkling beverages'),
('Dairy', 'dairy', 'Milk, yogurt, cheese, and dairy alternatives'),
('Packaged Food', 'packaged-food', 'Instant meals, noodles, soups, and ready-to-cook items'),
('Beverages', 'beverages', 'Fruit juices, iced teas, and non-carbonated drinks')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- 2. Demo Products
INSERT INTO products (category_id, brand, name, description, image_url, serving_size) VALUES
-- Snacks
((SELECT id FROM categories WHERE slug = 'snacks'), '[Demo] NutriChoice', '[Demo] Baked Multigrain Crisps', 'Demonstration sample of baked savory crisps made with whole wheat and oats.', NULL, '30g'),
((SELECT id FROM categories WHERE slug = 'snacks'), '[Demo] CrispCo', '[Demo] Classic Salted Potato Chips', 'Demonstration sample of deep-fried thin potato crisps seasoned with salt.', NULL, '30g'),

-- Chocolates
((SELECT id FROM categories WHERE slug = 'chocolates'), '[Demo] CocoaArt', '[Demo] 70% Dark Chocolate Bar', 'Demonstration sample of 70% cocoa solid dark confectionery bar.', NULL, '25g'),
((SELECT id FROM categories WHERE slug = 'chocolates'), '[Demo] SweetTreat', '[Demo] Creamy Milk Chocolate', 'Demonstration sample of high-milk solid confectionery chocolate bar.', NULL, '25g'),

-- Soft Drinks
((SELECT id FROM categories WHERE slug = 'soft-drinks'), '[Demo] FizzLab', '[Demo] Sparkling Lemon Cola', 'Demonstration sample of sweetened carbonated soft drink.', NULL, '250ml'),
((SELECT id FROM categories WHERE slug = 'soft-drinks'), '[Demo] FizzLab', '[Demo] Zero Sugar Lime Fizz', 'Demonstration sample of calorie-free artificially sweetened carbonated drink.', NULL, '250ml'),

-- Dairy
((SELECT id FROM categories WHERE slug = 'dairy'), '[Demo] PureFarm', '[Demo] Probiotic Plain Yogurt', 'Demonstration sample of low-fat cultured dairy yogurt with live cultures.', NULL, '150g'),
((SELECT id FROM categories WHERE slug = 'dairy'), '[Demo] PureFarm', '[Demo] Salted Table Butter', 'Demonstration sample of pasteurized dairy cream churned butter.', NULL, '15g'),

-- Packaged Food
((SELECT id FROM categories WHERE slug = 'packaged-food'), '[Demo] QuickBowl', '[Demo] Whole Wheat Instant Noodles', 'Demonstration sample of packaged noodles with dehydrated seasoning mix.', NULL, '70g'),
((SELECT id FROM categories WHERE slug = 'packaged-food'), '[Demo] QuickBowl', '[Demo] Masala Rolled Oats', 'Demonstration sample of savory flavored breakfast oats with spices.', NULL, '40g'),

-- Beverages
((SELECT id FROM categories WHERE slug = 'beverages'), '[Demo] OrchardGrove', '[Demo] 100% Apple & Berry Juice', 'Demonstration sample of pasteurized fruit juice blend with no added sugar.', NULL, '200ml'),
((SELECT id FROM categories WHERE slug = 'beverages'), '[Demo] OrchardGrove', '[Demo] Fresh Orange Pulp Juice', 'Demonstration sample of citrus fruit juice with added vitamin C.', NULL, '200ml');

-- 3. Nutrition Facts (referenced by product name)
INSERT INTO nutrition_facts (product_id, calories, protein, carbohydrates, total_sugar, added_sugar, total_fat, saturated_fat, trans_fat, sodium, fiber) VALUES
-- Baked Multigrain Crisps (Health Score ~78)
((SELECT id FROM products WHERE name = '[Demo] Baked Multigrain Crisps'), 130.00, 3.00, 21.00, 1.50, 0.50, 4.00, 0.80, 0.00, 160.00, 2.50),
-- Classic Salted Potato Chips (Health Score ~38)
((SELECT id FROM products WHERE name = '[Demo] Classic Salted Potato Chips'), 165.00, 2.00, 16.00, 0.20, 0.00, 10.50, 4.50, 0.10, 210.00, 1.00),

-- 70% Dark Chocolate Bar (Health Score ~68)
((SELECT id FROM products WHERE name = '[Demo] 70% Dark Chocolate Bar'), 145.00, 2.20, 12.00, 7.00, 6.50, 10.00, 6.00, 0.00, 5.00, 2.80),
-- Creamy Milk Chocolate (Health Score ~42)
((SELECT id FROM products WHERE name = '[Demo] Creamy Milk Chocolate'), 155.00, 2.00, 15.00, 14.00, 12.50, 9.50, 5.80, 0.10, 35.00, 0.80),

-- Sparkling Lemon Cola (Health Score ~34)
((SELECT id FROM products WHERE name = '[Demo] Sparkling Lemon Cola'), 105.00, 0.00, 26.00, 26.00, 25.00, 0.00, 0.00, 0.00, 30.00, 0.00),
-- Zero Sugar Lime Fizz (Health Score ~62)
((SELECT id FROM products WHERE name = '[Demo] Zero Sugar Lime Fizz'), 2.00, 0.00, 0.50, 0.00, 0.00, 0.00, 0.00, 0.00, 40.00, 0.00),

-- Probiotic Plain Yogurt (Health Score ~86)
((SELECT id FROM products WHERE name = '[Demo] Probiotic Plain Yogurt'), 85.00, 5.50, 7.00, 5.00, 0.00, 2.00, 1.20, 0.00, 75.00, 0.00),
-- Salted Table Butter (Health Score ~48)
((SELECT id FROM products WHERE name = '[Demo] Salted Table Butter'), 108.00, 0.10, 0.10, 0.00, 0.00, 12.20, 7.80, 0.40, 125.00, 0.00),

-- Whole Wheat Instant Noodles (Health Score ~55)
((SELECT id FROM products WHERE name = '[Demo] Whole Wheat Instant Noodles'), 290.00, 7.50, 45.00, 1.80, 0.50, 9.00, 4.00, 0.00, 620.00, 3.20),
-- Masala Rolled Oats (Health Score ~74)
((SELECT id FROM products WHERE name = '[Demo] Masala Rolled Oats'), 150.00, 5.00, 26.00, 1.50, 0.00, 2.80, 0.60, 0.00, 280.00, 3.80),

-- 100% Apple & Berry Juice (Health Score ~64)
((SELECT id FROM products WHERE name = '[Demo] 100% Apple & Berry Juice'), 92.00, 0.80, 22.00, 19.00, 0.00, 0.00, 0.00, 0.00, 12.00, 0.60),
-- Fresh Orange Pulp Juice (Health Score ~60)
((SELECT id FROM products WHERE name = '[Demo] Fresh Orange Pulp Juice'), 98.00, 1.20, 23.00, 21.00, 2.00, 0.10, 0.00, 0.00, 10.00, 1.20)
ON CONFLICT (product_id) DO NOTHING;

-- 4. Ingredients
INSERT INTO ingredients (name, normalized_name, category) VALUES
('Whole Wheat Flour', 'whole wheat flour', 'Grain'),
('Oat Flour', 'oat flour', 'Grain'),
('Sunflower Oil', 'sunflower oil', 'Fat & Oil'),
('Potatoes', 'potatoes', 'Vegetable'),
('Palm Oil', 'palm oil', 'Fat & Oil'),
('Cocoa Mass', 'cocoa mass', 'Confectionery'),
('Cocoa Butter', 'cocoa butter', 'Fat & Oil'),
('Milk Solids', 'milk solids', 'Dairy'),
('Cane Sugar', 'cane sugar', 'Sweetener'),
('Carbonated Water', 'carbonated water', 'Base'),
('Lemon Juice Concentrate', 'lemon juice concentrate', 'Fruit'),
('Orange Juice Concentrate', 'orange juice concentrate', 'Fruit'),
('Sucralose', 'sucralose', 'Artificial Sweetener'),
('Pasteurized Toned Milk', 'pasteurized toned milk', 'Dairy'),
('Milk Fat', 'milk fat', 'Dairy'),
('Live Active Cultures', 'live active cultures', 'Culture'),
('Dehydrated Vegetables', 'dehydrated vegetables', 'Vegetable'),
('Rolled Oats', 'rolled oats', 'Grain'),
('Spices & Condiments', 'spices and condiments', 'Spice'),
('Apple Juice Concentrate', 'apple juice concentrate', 'Fruit'),
('Iodized Salt', 'iodized salt', 'Mineral')
ON CONFLICT (name) DO NOTHING;

-- 5. Product Ingredients Links
INSERT INTO product_ingredients (product_id, ingredient_id, position) VALUES
-- Baked Crisps
((SELECT id FROM products WHERE name = '[Demo] Baked Multigrain Crisps'), (SELECT id FROM ingredients WHERE name = 'Whole Wheat Flour'), 1),
((SELECT id FROM products WHERE name = '[Demo] Baked Multigrain Crisps'), (SELECT id FROM ingredients WHERE name = 'Oat Flour'), 2),
((SELECT id FROM products WHERE name = '[Demo] Baked Multigrain Crisps'), (SELECT id FROM ingredients WHERE name = 'Sunflower Oil'), 3),
((SELECT id FROM products WHERE name = '[Demo] Baked Multigrain Crisps'), (SELECT id FROM ingredients WHERE name = 'Iodized Salt'), 4),

-- Potato Chips
((SELECT id FROM products WHERE name = '[Demo] Classic Salted Potato Chips'), (SELECT id FROM ingredients WHERE name = 'Potatoes'), 1),
((SELECT id FROM products WHERE name = '[Demo] Classic Salted Potato Chips'), (SELECT id FROM ingredients WHERE name = 'Palm Oil'), 2),
((SELECT id FROM products WHERE name = '[Demo] Classic Salted Potato Chips'), (SELECT id FROM ingredients WHERE name = 'Iodized Salt'), 3),

-- 70% Dark Chocolate
((SELECT id FROM products WHERE name = '[Demo] 70% Dark Chocolate Bar'), (SELECT id FROM ingredients WHERE name = 'Cocoa Mass'), 1),
((SELECT id FROM products WHERE name = '[Demo] 70% Dark Chocolate Bar'), (SELECT id FROM ingredients WHERE name = 'Cocoa Butter'), 2),
((SELECT id FROM products WHERE name = '[Demo] 70% Dark Chocolate Bar'), (SELECT id FROM ingredients WHERE name = 'Cane Sugar'), 3),

-- Milk Chocolate
((SELECT id FROM products WHERE name = '[Demo] Creamy Milk Chocolate'), (SELECT id FROM ingredients WHERE name = 'Cane Sugar'), 1),
((SELECT id FROM products WHERE name = '[Demo] Creamy Milk Chocolate'), (SELECT id FROM ingredients WHERE name = 'Milk Solids'), 2),
((SELECT id FROM products WHERE name = '[Demo] Creamy Milk Chocolate'), (SELECT id FROM ingredients WHERE name = 'Cocoa Butter'), 3),

-- Lemon Cola
((SELECT id FROM products WHERE name = '[Demo] Sparkling Lemon Cola'), (SELECT id FROM ingredients WHERE name = 'Carbonated Water'), 1),
((SELECT id FROM products WHERE name = '[Demo] Sparkling Lemon Cola'), (SELECT id FROM ingredients WHERE name = 'Cane Sugar'), 2),
((SELECT id FROM products WHERE name = '[Demo] Sparkling Lemon Cola'), (SELECT id FROM ingredients WHERE name = 'Lemon Juice Concentrate'), 3),

-- Zero Sugar Lime
((SELECT id FROM products WHERE name = '[Demo] Zero Sugar Lime Fizz'), (SELECT id FROM ingredients WHERE name = 'Carbonated Water'), 1),
((SELECT id FROM products WHERE name = '[Demo] Zero Sugar Lime Fizz'), (SELECT id FROM ingredients WHERE name = 'Lemon Juice Concentrate'), 2),
((SELECT id FROM products WHERE name = '[Demo] Zero Sugar Lime Fizz'), (SELECT id FROM ingredients WHERE name = 'Sucralose'), 3),

-- Yogurt
((SELECT id FROM products WHERE name = '[Demo] Probiotic Plain Yogurt'), (SELECT id FROM ingredients WHERE name = 'Pasteurized Toned Milk'), 1),
((SELECT id FROM products WHERE name = '[Demo] Probiotic Plain Yogurt'), (SELECT id FROM ingredients WHERE name = 'Live Active Cultures'), 2),

-- Table Butter
((SELECT id FROM products WHERE name = '[Demo] Salted Table Butter'), (SELECT id FROM ingredients WHERE name = 'Milk Fat'), 1),
((SELECT id FROM products WHERE name = '[Demo] Salted Table Butter'), (SELECT id FROM ingredients WHERE name = 'Iodized Salt'), 2),

-- Whole Wheat Noodles
((SELECT id FROM products WHERE name = '[Demo] Whole Wheat Instant Noodles'), (SELECT id FROM ingredients WHERE name = 'Whole Wheat Flour'), 1),
((SELECT id FROM products WHERE name = '[Demo] Whole Wheat Instant Noodles'), (SELECT id FROM ingredients WHERE name = 'Sunflower Oil'), 2),
((SELECT id FROM products WHERE name = '[Demo] Whole Wheat Instant Noodles'), (SELECT id FROM ingredients WHERE name = 'Dehydrated Vegetables'), 3),
((SELECT id FROM products WHERE name = '[Demo] Whole Wheat Instant Noodles'), (SELECT id FROM ingredients WHERE name = 'Iodized Salt'), 4),

-- Masala Oats
((SELECT id FROM products WHERE name = '[Demo] Masala Rolled Oats'), (SELECT id FROM ingredients WHERE name = 'Rolled Oats'), 1),
((SELECT id FROM products WHERE name = '[Demo] Masala Rolled Oats'), (SELECT id FROM ingredients WHERE name = 'Spices & Condiments'), 2),
((SELECT id FROM products WHERE name = '[Demo] Masala Rolled Oats'), (SELECT id FROM ingredients WHERE name = 'Iodized Salt'), 3),

-- Apple Juice
((SELECT id FROM products WHERE name = '[Demo] 100% Apple & Berry Juice'), (SELECT id FROM ingredients WHERE name = 'Apple Juice Concentrate'), 1),
((SELECT id FROM products WHERE name = '[Demo] 100% Apple & Berry Juice'), (SELECT id FROM ingredients WHERE name = 'Carbonated Water'), 2),

-- Orange Juice
((SELECT id FROM products WHERE name = '[Demo] Fresh Orange Pulp Juice'), (SELECT id FROM ingredients WHERE name = 'Orange Juice Concentrate'), 1),
((SELECT id FROM products WHERE name = '[Demo] Fresh Orange Pulp Juice'), (SELECT id FROM ingredients WHERE name = 'Cane Sugar'), 2)
ON CONFLICT (product_id, ingredient_id) DO NOTHING;

-- 6. Product Scores
INSERT INTO product_scores (product_id, health_score, nutrition_score, ingredient_score, breakdown) VALUES
((SELECT id FROM products WHERE name = '[Demo] Baked Multigrain Crisps'), 78.00, 80.00, 75.00, '{"fiber": "positive", "sodium": "moderate", "sugar": "low"}'::jsonb),
((SELECT id FROM products WHERE name = '[Demo] Classic Salted Potato Chips'), 38.00, 32.00, 44.00, '{"sodium": "high", "sat_fat": "high", "fried": "palm_oil"}'::jsonb),

((SELECT id FROM products WHERE name = '[Demo] 70% Dark Chocolate Bar'), 68.00, 65.00, 72.00, '{"antioxidants": "high", "sat_fat": "elevated", "sugar": "moderate"}'::jsonb),
((SELECT id FROM products WHERE name = '[Demo] Creamy Milk Chocolate'), 42.00, 38.00, 46.00, '{"sugar": "high", "sat_fat": "elevated", "milk_fat": "moderate"}'::jsonb),

((SELECT id FROM products WHERE name = '[Demo] Sparkling Lemon Cola'), 34.00, 25.00, 48.00, '{"sugar": "excessive", "calories": "empty", "nutrition": "poor"}'::jsonb),
((SELECT id FROM products WHERE name = '[Demo] Zero Sugar Lime Fizz'), 62.00, 68.00, 56.00, '{"sugar": "zero", "calories": "low", "artificial": "sweetener"}'::jsonb),

((SELECT id FROM products WHERE name = '[Demo] Probiotic Plain Yogurt'), 86.00, 88.00, 84.00, '{"protein": "high", "sugar": "natural", "calcium": "good"}'::jsonb),
((SELECT id FROM products WHERE name = '[Demo] Salted Table Butter'), 48.00, 40.00, 56.00, '{"sat_fat": "high", "sodium": "moderate", "additives": "low"}'::jsonb),

((SELECT id FROM products WHERE name = '[Demo] Whole Wheat Instant Noodles'), 55.00, 52.00, 60.00, '{"sodium": "high", "fiber": "positive", "sat_fat": "moderate"}'::jsonb),
((SELECT id FROM products WHERE name = '[Demo] Masala Rolled Oats'), 74.00, 76.00, 72.00, '{"fiber": "high", "protein": "moderate", "sodium": "moderate"}'::jsonb),

((SELECT id FROM products WHERE name = '[Demo] 100% Apple & Berry Juice'), 64.00, 60.00, 70.00, '{"vitamins": "good", "added_sugar": "none", "natural_sugar": "high"}'::jsonb),
((SELECT id FROM products WHERE name = '[Demo] Fresh Orange Pulp Juice'), 60.00, 58.00, 62.00, '{"vitamins": "good", "added_sugar": "low", "natural_sugar": "high"}'::jsonb)
ON CONFLICT (product_id) DO UPDATE SET
  health_score = EXCLUDED.health_score,
  nutrition_score = EXCLUDED.nutrition_score,
  ingredient_score = EXCLUDED.ingredient_score,
  breakdown = EXCLUDED.breakdown;

-- 7. Seed Demo Scans History
INSERT INTO scans (user_id, product_name, score, mode, image_url, raw_text, product_data, created_at) VALUES
(NULL, 'Kellogg''s Corn Flakes', 72.00, 'offline', NULL, 'Ingredients: Milled Corn, Sugar, Malt Flavor, Salt.', '{"name": "Kellogg''s Corn Flakes", "brand": "Kellogg''s", "serving_size": "30g", "calories": 110, "protein": 2, "carbohydrates": 24, "total_sugar": 3, "added_sugar": 3, "total_fat": 0.5, "saturated_fat": 0.1, "trans_fat": 0, "sodium": 200, "fiber": 1, "ingredients": ["Milled Corn", "Sugar", "Malt Flavor", "Salt"], "scoreEvaluation": {"score": 72, "breakdown": {"sugar": {"score": 85, "value": 3, "impact": "positive", "message": "Low total sugar (3g)"}, "sodium": {"score": 60, "value": 200, "impact": "neutral", "message": "Moderate sodium (200mg)"}, "fiber": {"score": 40, "value": 1, "impact": "neutral", "message": "Some dietary fiber (1g)"}}, "positives": ["Low total fat (0.5g)", "Low added sugar (3g)"], "negatives": ["Low protein content (2g)"], "warnings": []}}'::jsonb, NOW() - INTERVAL '2 hours'),
(NULL, 'Classic Kettle Potato Chips', 79.00, 'offline', NULL, 'Ingredients: Potatoes, Sunflower Oil, Sea Salt.', '{"name": "Classic Kettle Potato Chips", "brand": "CrispCo", "serving_size": "28g", "calories": 150, "protein": 2, "carbohydrates": 15, "total_sugar": 1, "added_sugar": 0, "total_fat": 9, "saturated_fat": 2.5, "trans_fat": 0, "sodium": 180, "fiber": 1, "ingredients": ["Potatoes", "Sunflower Oil", "Sea Salt"], "scoreEvaluation": {"score": 79, "breakdown": {"sugar": {"score": 95, "value": 1, "impact": "positive", "message": "Very low total sugar (1g)"}, "sodium": {"score": 65, "value": 180, "impact": "neutral", "message": "Moderate sodium (180mg)"}}, "positives": ["Zero added sugar", "Simple natural ingredients"], "negatives": ["Moderate saturated fat (2.5g)"], "warnings": []}}'::jsonb, NOW() - INTERVAL '1 day'),
(NULL, '[Demo] PureFarm Probiotic Plain Yogurt', 86.00, 'online', NULL, NULL, '{"name": "[Demo] PureFarm Probiotic Plain Yogurt", "brand": "PureFarm", "serving_size": "150g", "calories": 85, "protein": 5.5, "carbohydrates": 7, "total_sugar": 5, "added_sugar": 0, "total_fat": 2, "saturated_fat": 1.2, "trans_fat": 0, "sodium": 75, "fiber": 0, "ingredients": ["Pasteurized Toned Milk", "Live Active Cultures"], "scoreEvaluation": {"score": 86, "breakdown": {"protein": {"score": 80, "value": 5.5, "impact": "positive", "message": "Good protein source (5.5g)"}}, "positives": ["High in protein", "Contains live active probiotic cultures"], "negatives": [], "warnings": []}}'::jsonb, NOW() - INTERVAL '3 days');

-- 8. Seed Demo Comparisons History
INSERT INTO comparisons (user_id, title, mode, created_at) VALUES
(NULL, 'Breakfast & Snack Comparison', 'offline', NOW() - INTERVAL '2 hours');

INSERT INTO comparison_products (comparison_id, product_name, score, rank, mode, product_data, created_at) VALUES
(1, 'Classic Kettle Potato Chips', 79.00, 1, 'offline', '{"productId": "scanned-2", "product": {"name": "Classic Kettle Potato Chips", "brand": "CrispCo", "serving_size": "28g", "calories": 150, "protein": 2, "carbohydrates": 15, "total_sugar": 1, "total_fat": 9, "sodium": 180, "fiber": 1}, "score": 79, "positives": ["Zero added sugar"], "negatives": ["Moderate saturated fat"], "breakdown": {"sugar": {"score": 95, "value": 1}}}'::jsonb, NOW() - INTERVAL '2 hours'),
(1, 'Kellogg''s Corn Flakes', 72.00, 2, 'offline', '{"productId": "scanned-1", "product": {"name": "Kellogg''s Corn Flakes", "brand": "Kellogg''s", "serving_size": "30g", "calories": 110, "protein": 2, "carbohydrates": 24, "total_sugar": 3, "total_fat": 0.5, "sodium": 200, "fiber": 1}, "score": 72, "positives": ["Low total fat"], "negatives": ["Low dietary fiber"], "breakdown": {"sugar": {"score": 85, "value": 3}}}'::jsonb, NOW() - INTERVAL '2 hours');
