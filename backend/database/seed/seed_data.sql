-- ==========================================================
-- NutriLens Seed Data
-- ==========================================================

-- Categories
INSERT INTO categories (name, slug, description) VALUES
('Snacks', 'snacks', 'Chips, namkeen, crisps, and savory snacks'),
('Beverages', 'beverages', 'Juices, cold drinks, tea, and packaged beverages'),
('Dairy', 'dairy', 'Milk, butter, yogurt, and dairy products'),
('Instant Foods', 'instant-foods', 'Instant noodles, ready-to-eat meals, soups'),
('Biscuits & Cookies', 'biscuits-cookies', 'Biscuits, cookies, crackers, and rusks'),
('Chocolates & Sweets', 'chocolates-sweets', 'Chocolates, confectionery, and candies')
ON CONFLICT (slug) DO NOTHING;

-- Ingredients
INSERT INTO ingredients (name, description, safety_level, category) VALUES
('Whole Wheat Flour', 'Ground whole wheat grain with bran and germ intact', 'green', 'Grain'),
('Water', 'Purified potable water', 'green', 'Base'),
('Oats', 'Rolled or whole grain oats', 'green', 'Grain'),
('Milk Solids', 'Dehydrated dairy solids', 'green', 'Dairy'),
('Salt', 'Common edible salt', 'green', 'Mineral'),
('Tomato Paste', 'Concentrated tomato puree', 'green', 'Vegetable'),
('Sugar', 'Refined sucrose sweetener', 'yellow', 'Sweetener'),
('Palm Oil', 'Refined palm cooking fat', 'yellow', 'Fat & Oil'),
('Maltodextrin', 'Processed polysaccharide filler and carrier', 'yellow', 'Additive'),
('Monosodium Glutamate', 'MSG flavor enhancer E621', 'yellow', 'Flavor Enhancer'),
('TBHQ', 'Tertiary butylhydroquinone synthetic antioxidant E319', 'red', 'Preservative'),
('Tartrazine', 'Synthetic yellow azo food dye E102', 'red', 'Artificial Color'),
('Sunset Yellow FCF', 'Synthetic orange food dye E110', 'red', 'Artificial Color')
ON CONFLICT (name) DO NOTHING;

-- Products
INSERT INTO products (name, brand, category_id, serving_size, serving_unit, servings_per_container, calories, total_fat, saturated_fat, trans_fat, cholesterol, sodium, total_carbohydrates, dietary_fiber, total_sugars, added_sugars, protein)
VALUES
('Classic Salted Potato Chips', 'Lays', (SELECT id FROM categories WHERE slug = 'snacks'), 28, 'g', 3, 152, 9.5, 3.0, 0, 0, 170, 15.0, 1.0, 0.5, 0, 2.0),
('Masala Munch Corn Puffs', 'Kurkure', (SELECT id FROM categories WHERE slug = 'snacks'), 30, 'g', 3, 156, 9.0, 4.2, 0, 0, 280, 16.5, 0.9, 1.5, 1.0, 2.1),
('2-Minute Masala Noodles', 'Maggi', (SELECT id FROM categories WHERE slug = 'instant-foods'), 70, 'g', 1, 312, 13.0, 6.2, 0, 0, 860, 42.0, 1.5, 1.0, 0.5, 7.0),
('100% Orange Juice', 'Tropicana', (SELECT id FROM categories WHERE slug = 'beverages'), 200, 'ml', 1, 88, 0, 0, 0, 0, 10, 20.0, 0.4, 18.0, 8.0, 1.4)
ON CONFLICT DO NOTHING;

