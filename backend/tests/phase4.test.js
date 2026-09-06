const assert = require("assert");
const request = require("supertest");
const app = require("../src/app");

async function runPhase4Tests() {
  console.log("🧪 Starting Phase 4 Online Shopping Mode Tests...\n");

  try {
    // 1. GET /api/categories
    console.log("1️⃣ Testing GET /api/categories...");
    const catRes = await request(app).get("/api/categories").expect(200);
    assert.strictEqual(catRes.body.success, true);
    assert.ok(catRes.body.data.length >= 6, "Should have 6 categories");
    const categorySlugs = catRes.body.data.map((c) => c.slug);
    assert.ok(categorySlugs.includes("snacks"));
    assert.ok(categorySlugs.includes("dairy"));
    assert.ok(categorySlugs.includes("chocolates"));
    console.log(
      `   ✓ ${catRes.body.data.length} categories verified: ${categorySlugs.join(", ")}`,
    );

    // 2. GET /api/products
    console.log("2️⃣ Testing GET /api/products...");
    const prodRes = await request(app).get("/api/products").expect(200);
    assert.strictEqual(prodRes.body.success, true);
    assert.ok(
      prodRes.body.count >= 12,
      `Expected >= 12 products, got ${prodRes.body.count}`,
    );
    const sample = prodRes.body.data[0];
    assert.ok(sample.name, "Product must have name");
    assert.ok(sample.brand, "Product must have brand");
    assert.ok(sample.category_name, "Product must have category");
    assert.ok(sample.calories !== undefined, "Product must have calories");
    assert.ok(
      sample.health_score !== undefined,
      "Product must have health score",
    );
    console.log(
      `   ✓ ${prodRes.body.count} products retrieved with nutrition facts and scores`,
    );

    // 3. GET /api/products/search?q= (by Name)
    console.log(
      "3️⃣ Testing Search by Product Name (GET /api/products/search?q=crisps)...",
    );
    const searchNameRes = await request(app)
      .get("/api/products/search?q=crisps")
      .expect(200);
    assert.strictEqual(searchNameRes.body.success, true);
    assert.ok(
      searchNameRes.body.data.length > 0,
      "Should find at least 1 crisp product",
    );
    assert.ok(
      searchNameRes.body.data.some((p) =>
        p.name.toLowerCase().includes("crisp"),
      ),
      "Product name should match search",
    );
    console.log(
      `   ✓ Search by name found ${searchNameRes.body.data.length} product(s)`,
    );

    // 4. GET /api/products/search?q= (by Brand)
    console.log(
      "4️⃣ Testing Search by Brand (GET /api/products/search?q=purefarm)...",
    );
    const searchBrandRes = await request(app)
      .get("/api/products/search?q=purefarm")
      .expect(200);
    assert.strictEqual(searchBrandRes.body.success, true);
    assert.ok(
      searchBrandRes.body.data.length >= 2,
      "Should find PureFarm dairy products",
    );
    assert.ok(
      searchBrandRes.body.data.every((p) =>
        p.brand.toLowerCase().includes("purefarm"),
      ),
      "All results should belong to brand PureFarm",
    );
    console.log(
      `   ✓ Search by brand found ${searchBrandRes.body.data.length} PureFarm product(s)`,
    );

    // 5. GET /api/products/search?q= (by Category Name)
    console.log(
      "5️⃣ Testing Search by Category Name (GET /api/products/search?q=dairy)...",
    );
    const searchCatRes = await request(app)
      .get("/api/products/search?q=dairy")
      .expect(200);
    assert.strictEqual(searchCatRes.body.success, true);
    assert.ok(searchCatRes.body.data.length >= 2, "Should find dairy products");
    assert.ok(
      searchCatRes.body.data.some((p) => p.category_slug === "dairy"),
      "Should match category dairy",
    );
    console.log(
      `   ✓ Search by category name found ${searchCatRes.body.data.length} product(s)`,
    );

    // 6. GET /api/products/category/:categoryId (by Slug)
    console.log(
      "6️⃣ Testing Filter by Category Slug (GET /api/products/category/snacks)...",
    );
    const catSlugRes = await request(app)
      .get("/api/products/category/snacks")
      .expect(200);
    assert.strictEqual(catSlugRes.body.success, true);
    assert.ok(
      catSlugRes.body.data.length >= 2,
      "Should have 2 snacks in demo seed",
    );
    assert.ok(catSlugRes.body.data.every((p) => p.category_slug === "snacks"));
    console.log(
      `   ✓ Category slug filter returned ${catSlugRes.body.data.length} snack(s)`,
    );

    // 7. GET /api/products/category/:categoryId (by numeric ID)
    console.log(
      "7️⃣ Testing Filter by Category ID (GET /api/products/category/1)...",
    );
    const catIdRes = await request(app)
      .get("/api/products/category/1")
      .expect(200);
    assert.strictEqual(catIdRes.body.success, true);
    assert.ok(
      catIdRes.body.data.length > 0,
      "Should return items for category 1",
    );
    console.log(
      `   ✓ Category numeric ID filter returned ${catIdRes.body.data.length} item(s)`,
    );

    // 8. GET /api/products/:id
    console.log("8️⃣ Testing Product Detail (GET /api/products/1)...");
    const detailRes = await request(app).get("/api/products/1").expect(200);
    assert.strictEqual(detailRes.body.success, true);
    assert.strictEqual(detailRes.body.data.id, 1);
    assert.ok(
      Array.isArray(detailRes.body.data.ingredients),
      "Ingredients array present",
    );
    assert.ok(detailRes.body.data.ingredients.length > 0, "Ingredients loaded");
    assert.ok(detailRes.body.data.calories !== undefined, "Calories present");
    assert.ok(
      detailRes.body.data.health_score !== undefined,
      "Health score present",
    );
    console.log(
      `   ✓ Product #1 details loaded: "${detailRes.body.data.name}" with ${detailRes.body.data.ingredients.length} ingredients`,
    );

    // 9. Error handling: GET /api/products/99999
    console.log("9️⃣ Testing 404 Handling for Missing Product...");
    await request(app).get("/api/products/99999").expect(404);
    console.log("   ✓ 404 properly handled");

    console.log(
      "\n🎉 ALL PHASE 4 BACKEND & ONLINE SHOPPING SEARCH TESTS PASSED!\n",
    );
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Phase 4 test failed:", err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  }
}

runPhase4Tests();
