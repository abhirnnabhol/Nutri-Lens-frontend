const assert = require("assert");
const request = require("supertest");
const app = require("../src/app");

async function runPhase2Tests() {
  console.log("🧪 Starting Phase 2 Backend & Database Tests...\n");

  try {
    // 1. GET /api/health
    console.log("1️⃣ Testing GET /api/health...");
    const healthRes = await request(app)
      .get("/api/health")
      .expect("Content-Type", /json/)
      .expect(200);

    assert.ok(healthRes.body.status, "Should have status field");
    assert.strictEqual(healthRes.body.service, "NutriLens API");
    assert.ok(healthRes.body.database, "Should have database details");
    assert.strictEqual(
      healthRes.body.database.connected,
      true,
      "Database should be connected",
    );
    assert.ok(
      healthRes.body.database.totalProducts >= 6,
      "Should have at least 6 demo products seeded",
    );
    console.log(
      `   ✓ Health OK (DB Mode: ${healthRes.body.database.mode}, Products: ${healthRes.body.database.totalProducts})`,
    );

    // 2. GET /api/categories
    console.log("2️⃣ Testing GET /api/categories...");
    const catRes = await request(app)
      .get("/api/categories")
      .expect("Content-Type", /json/)
      .expect(200);

    assert.strictEqual(catRes.body.success, true);
    assert.ok(
      Array.isArray(catRes.body.data),
      "Categories data should be array",
    );
    assert.strictEqual(catRes.body.count, 6, "Should have 6 demo categories");
    const slugs = catRes.body.data.map((c) => c.slug);
    assert.ok(slugs.includes("snacks"), "Should include snacks");
    assert.ok(slugs.includes("chocolates"), "Should include chocolates");
    assert.ok(slugs.includes("soft-drinks"), "Should include soft-drinks");
    assert.ok(slugs.includes("dairy"), "Should include dairy");
    assert.ok(slugs.includes("packaged-food"), "Should include packaged-food");
    assert.ok(slugs.includes("beverages"), "Should include beverages");
    console.log(`   ✓ 6 Categories verified: ${slugs.join(", ")}`);

    // 3. GET /api/products (all demo products)
    console.log("3️⃣ Testing GET /api/products...");
    const prodRes = await request(app)
      .get("/api/products")
      .expect("Content-Type", /json/)
      .expect(200);

    assert.strictEqual(prodRes.body.success, true);
    assert.ok(prodRes.body.count >= 6, "Should return all 6 demo products");
    const sample = prodRes.body.data[0];
    assert.ok(
      sample.brand.startsWith("[Demo]"),
      "Product brand should be clearly labeled [Demo]",
    );
    assert.ok(
      sample.name.startsWith("[Demo]"),
      "Product name should be clearly labeled [Demo]",
    );
    assert.ok(
      sample.calories !== undefined,
      "Product should have nutrition facts (calories)",
    );
    assert.ok(
      sample.protein !== undefined,
      "Product should have nutrition facts (protein)",
    );
    assert.ok(
      sample.health_score !== undefined,
      "Product should have health score",
    );
    console.log(
      `   ✓ ${prodRes.body.count} Products loaded with nutrition facts and health scores`,
    );

    // 4. GET /api/products?category=snacks
    console.log(
      "4️⃣ Testing Category Filtering (GET /api/products?category=snacks)...",
    );
    const filterRes = await request(app)
      .get("/api/products?category=snacks")
      .expect(200);

    assert.strictEqual(filterRes.body.success, true);
    assert.ok(filterRes.body.data.length > 0, "Should find snack products");
    assert.ok(
      filterRes.body.data.every((p) => p.category_slug === "snacks"),
      "All items should belong to snacks",
    );
    console.log(
      `   ✓ Category filtering returned ${filterRes.body.data.length} snacks`,
    );

    // 5. GET /api/products?search=chocolate
    console.log(
      "5️⃣ Testing Product Search (GET /api/products?search=chocolate)...",
    );
    const searchRes = await request(app)
      .get("/api/products?search=chocolate")
      .expect(200);

    assert.strictEqual(searchRes.body.success, true);
    assert.ok(
      searchRes.body.data.length > 0,
      "Search should find matching items",
    );
    assert.ok(
      searchRes.body.data[0].name.toLowerCase().includes("chocolate"),
      "Result should match search term",
    );
    console.log(`   ✓ Search verified (${searchRes.body.data[0].name})`);

    // 6. GET /api/products/:id (Product Detail with Ingredients)
    console.log("6️⃣ Testing Product Detail (GET /api/products/1)...");
    const detailRes = await request(app).get("/api/products/1").expect(200);

    assert.strictEqual(detailRes.body.success, true);
    assert.strictEqual(detailRes.body.data.id, 1);
    assert.ok(detailRes.body.data.serving_size, "Should have serving size");
    assert.ok(
      Array.isArray(detailRes.body.data.ingredients),
      "Should have ingredients list",
    );
    assert.ok(
      detailRes.body.data.ingredients.length > 0,
      "Should have associated ingredients",
    );
    console.log(
      `   ✓ Product #1 details loaded with ${detailRes.body.data.ingredients.length} ingredients`,
    );

    // 7. GET /api/products/9999 (404 Error Handling)
    console.log("7️⃣ Testing 404 Error Handling (GET /api/products/9999)...");
    await request(app).get("/api/products/9999").expect(404);
    console.log("   ✓ 404 handled cleanly");

    console.log("\n🎉 ALL PHASE 2 BACKEND & DATABASE TESTS PASSED!\n");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Phase 2 test failed:", err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  }
}

runPhase2Tests();
