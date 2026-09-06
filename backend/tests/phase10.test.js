const assert = require("assert");
const request = require("supertest");
const app = require("../src/app");
const scanService = require("../src/services/scanService");
const comparisonService = require("../src/services/comparisonService");

async function runPhase10Tests() {
  console.log("🧪 Starting Phase 10 Scan and Comparison History Tests...\n");

  try {
    // -------------------------------------------------------------------------
    // TEST 1: GET /api/scans/history
    // -------------------------------------------------------------------------
    console.log("1️⃣ Testing GET /api/scans/history...");

    const historyRes = await request(app).get("/api/scans/history").expect(200);

    assert.strictEqual(historyRes.body.success, true);
    assert.ok(Array.isArray(historyRes.body.data), "History must be an array");
    assert.ok(
      historyRes.body.data.length > 0,
      "Must contain seeded/existing scans",
    );

    const firstScan = historyRes.body.data[0];
    assert.ok(firstScan.id, "Scan must have id");
    assert.ok(firstScan.productName, "Scan must have productName");
    assert.ok(
      typeof firstScan.score === "number" || firstScan.score === null,
      "Scan must have numeric or null score",
    );
    assert.ok(
      firstScan.mode === "offline" || firstScan.mode === "online",
      "Scan mode must be offline or online",
    );
    assert.ok(firstScan.createdAt, "Scan must have createdAt date");

    // Check for Kellogg's Corn Flakes seeded example
    const cornFlakes = historyRes.body.data.find((s) =>
      s.productName.includes("Kellogg's Corn Flakes"),
    );
    assert.ok(
      cornFlakes,
      "Seeded 'Kellogg\\'s Corn Flakes' must be present in scan history",
    );
    assert.strictEqual(
      cornFlakes.score,
      72,
      "Kellogg's Corn Flakes score must be 72/100",
    );
    assert.strictEqual(
      cornFlakes.mode,
      "offline",
      "Kellogg's Corn Flakes mode must be offline",
    );

    console.log(
      `   ✓ GET /api/scans/history verified (${historyRes.body.data.length} scans found)`,
    );
    console.log(
      `     Example: ${cornFlakes.productName} | Score: ${cornFlakes.score}/100 | Mode: ${cornFlakes.mode}`,
    );

    // -------------------------------------------------------------------------
    // TEST 2: POST /api/analyze/confirm (Persists verified scan in DB)
    // -------------------------------------------------------------------------
    console.log(
      "\n2️⃣ Testing Offline Scan Persistence via POST /api/analyze/confirm...",
    );

    const newScanPayload = {
      productName: "Sprouted Ancient Grain Toast",
      servingSize: "40g",
      calories: "110",
      protein: "5",
      carbohydrates: "20",
      totalSugar: "2",
      addedSugar: "0",
      totalFat: "1.5",
      saturatedFat: "0.2",
      transFat: "0",
      sodium: "90",
      fiber: "4",
      ingredients: [
        "Organic Sprouted Wheat",
        "Organic Sprouted Barley",
        "Sea Salt",
        "Yeast",
      ],
      mode: "offline",
    };

    const confirmRes = await request(app)
      .post("/api/analyze/confirm")
      .send(newScanPayload)
      .expect(200);

    assert.strictEqual(confirmRes.body.success, true);
    assert.ok(
      confirmRes.body.data.scanId,
      "Must return scanId of persisted scan",
    );
    const createdScanId = confirmRes.body.data.scanId;
    const scoredProduct = confirmRes.body.data.product;
    console.log(
      `   ✓ New scan persisted in database with scan ID: ${createdScanId} (Score: ${scoredProduct.health_score}/100)`,
    );

    // -------------------------------------------------------------------------
    // TEST 3: GET /api/scans/:id (Scan Detail View)
    // -------------------------------------------------------------------------
    console.log("\n3️⃣ Testing GET /api/scans/:id (Scan Details)...");

    const detailRes = await request(app)
      .get(`/api/scans/${createdScanId}`)
      .expect(200);

    assert.strictEqual(detailRes.body.success, true);
    const detail = detailRes.body.data;

    // Check all required detail fields from prompt
    assert.strictEqual(detail.id, createdScanId);
    assert.strictEqual(detail.productName, "Sprouted Ancient Grain Toast");
    assert.strictEqual(detail.mode, "offline");
    assert.ok(typeof detail.score === "number");

    // 1. Nutrition Data
    assert.ok(detail.nutrition, "Must include nutrition data");
    assert.strictEqual(Number(detail.nutrition.calories), 110);
    assert.strictEqual(Number(detail.nutrition.protein), 5);
    assert.strictEqual(Number(detail.nutrition.carbohydrates), 20);
    assert.strictEqual(Number(detail.nutrition.totalSugar), 2);
    assert.strictEqual(Number(detail.nutrition.sodium), 90);
    assert.strictEqual(Number(detail.nutrition.fiber), 4);

    // 2. Ingredients
    assert.ok(
      Array.isArray(detail.ingredients),
      "Must include ingredients array",
    );
    assert.ok(detail.ingredients.length >= 3);

    // 3. Health Score & Score Breakdown
    assert.ok(detail.scoreEvaluation, "Must include score evaluation");
    assert.ok(detail.scoreEvaluation.breakdown, "Must include score breakdown");
    assert.ok(
      detail.scoreEvaluation.breakdown.sugar,
      "Must include sugar breakdown",
    );

    // 4. Positives, Negatives, Warnings
    assert.ok(
      Array.isArray(detail.scoreEvaluation.positives),
      "Must include positives array",
    );
    assert.ok(
      Array.isArray(detail.scoreEvaluation.negatives),
      "Must include negatives array",
    );
    assert.ok(
      Array.isArray(detail.scoreEvaluation.warnings),
      "Must include warnings array",
    );

    console.log(`   ✓ Scan details verified for ID ${createdScanId}:`);
    console.log(`     Product: ${detail.productName} (${detail.mode})`);
    console.log(`     Health Score: ${detail.score}/100`);
    console.log(
      `     Positives (${detail.scoreEvaluation.positives.length}): ${detail.scoreEvaluation.positives[0] || "None"}`,
    );
    console.log(`     Ingredients: ${detail.ingredients.join(", ")}`);

    // -------------------------------------------------------------------------
    // TEST 4: POST /api/comparisons (Comparison Persistence)
    // -------------------------------------------------------------------------
    console.log("\n4️⃣ Testing POST /api/comparisons...");

    const compPayload = {
      products: [
        {
          id: "scanned-bar-1",
          name: "Organic Chia Granola Bar",
          brand: "NatureCraft",
          serving_size: "35g",
          calories: 140,
          protein: 4,
          carbohydrates: 22,
          total_sugar: 4,
          added_sugar: 2,
          total_fat: 4,
          saturated_fat: 0.5,
          trans_fat: 0,
          sodium: 50,
          fiber: 5,
          ingredients: ["Whole Oats", "Chia Seeds", "Almond Butter"],
          is_scanned: true,
        },
        2, // Catalog product ID 2 (Classic Salted Potato Chips)
      ],
      title: "Granola Bar vs Potato Chips",
      mode: "hybrid",
    };

    const createCompRes = await request(app)
      .post("/api/comparisons")
      .send(compPayload)
      .expect(201);

    assert.strictEqual(createCompRes.body.success, true);
    const createdComp = createCompRes.body.data;
    assert.ok(createdComp.comparisonId, "Must return comparisonId");
    assert.strictEqual(createdComp.title, "Granola Bar vs Potato Chips");
    assert.strictEqual(createdComp.results.length, 2);
    const newCompId = createdComp.comparisonId;
    console.log(`   ✓ Comparison created and persisted with ID: ${newCompId}`);

    // -------------------------------------------------------------------------
    // TEST 5: GET /api/comparisons/history
    // -------------------------------------------------------------------------
    console.log("\n5️⃣ Testing GET /api/comparisons/history...");

    const compHistoryRes = await request(app)
      .get("/api/comparisons/history")
      .expect(200);

    assert.strictEqual(compHistoryRes.body.success, true);
    assert.ok(
      Array.isArray(compHistoryRes.body.data),
      "Comparison history must be an array",
    );
    assert.ok(compHistoryRes.body.data.length > 0, "Must contain comparisons");

    const foundComp = compHistoryRes.body.data.find((c) => c.id === newCompId);
    assert.ok(
      foundComp,
      `Newly created comparison #${newCompId} must be in history`,
    );
    assert.strictEqual(foundComp.title, "Granola Bar vs Potato Chips");
    assert.strictEqual(foundComp.productCount, 2);
    assert.ok(foundComp.createdAt, "Must have createdAt");
    assert.ok(foundComp.winner, "Must identify winner");

    console.log(
      `   ✓ GET /api/comparisons/history verified (${compHistoryRes.body.data.length} comparisons found)`,
    );
    console.log(
      `     Comparison #${foundComp.id}: "${foundComp.title}" | Winner: ${foundComp.winner.name} (${foundComp.winner.score}/100)`,
    );

    // -------------------------------------------------------------------------
    // TEST 6: GET /api/comparisons/:id (Comparison Detail View & Table)
    // -------------------------------------------------------------------------
    console.log(
      "\n6️⃣ Testing GET /api/comparisons/:id (Comparison Detail & Table)...",
    );

    const compDetailRes = await request(app)
      .get(`/api/comparisons/${newCompId}`)
      .expect(200);

    assert.strictEqual(compDetailRes.body.success, true);
    const compDetail = compDetailRes.body.data;

    // Check products, scores, ranking
    assert.strictEqual(compDetail.comparisonId, newCompId);
    assert.strictEqual(compDetail.results.length, 2);
    assert.strictEqual(compDetail.results[0].rank, 1);
    assert.strictEqual(compDetail.results[1].rank, 2);
    assert.ok(compDetail.results[0].score >= compDetail.results[1].score);

    // Check comparison table
    assert.ok(
      compDetail.comparisonTable,
      "Must include side-by-side comparisonTable",
    );
    assert.strictEqual(compDetail.comparisonTable.columns.length, 2);
    assert.ok(
      compDetail.comparisonTable.rows.length >= 6,
      "Must contain at least 6 nutrition rows",
    );

    const caloriesRow = compDetail.comparisonTable.rows.find(
      (r) => r.metric === "Calories",
    );
    assert.ok(caloriesRow, "Comparison table must include Calories row");
    assert.strictEqual(caloriesRow.values.length, 2);

    const sugarRow = compDetail.comparisonTable.rows.find((r) =>
      r.metric.includes("Sugar"),
    );
    assert.ok(sugarRow, "Comparison table must include Sugar row");

    console.log(
      `   ✓ Comparison details & comparison table verified for ID ${newCompId}:`,
    );
    console.log(
      `     Rank 1 🥇: ${compDetail.results[0].product.name} (${compDetail.results[0].score}/100)`,
    );
    console.log(
      `     Rank 2 🥈: ${compDetail.results[1].product.name} (${compDetail.results[1].score}/100)`,
    );
    console.log(
      `     Table Rows: ${compDetail.comparisonTable.rows.map((r) => r.metric).join(", ")}`,
    );

    // -------------------------------------------------------------------------
    // TEST 7: Terminology Safety Assertions
    // -------------------------------------------------------------------------
    console.log("\n7️⃣ Testing Terminology Safety Assertions...");

    const forbiddenPhrases = [
      "% healthy",
      "percent healthy",
      "% cure",
      "disease free",
      "100% healthy",
    ];

    const stringifiedScan = JSON.stringify(detailRes.body);
    const stringifiedComp = JSON.stringify(compDetailRes.body);

    for (const phrase of forbiddenPhrases) {
      assert.strictEqual(
        stringifiedScan.toLowerCase().includes(phrase),
        false,
        `Scan detail response must not contain forbidden phrase "${phrase}"`,
      );
      assert.strictEqual(
        stringifiedComp.toLowerCase().includes(phrase),
        false,
        `Comparison detail response must not contain forbidden phrase "${phrase}"`,
      );
    }
    console.log(
      "   ✓ Safe terminology verified: 'NutriLens Health Score' used, no misleading percentage health claims.",
    );

    // -------------------------------------------------------------------------
    // TEST 8: Error Handling & Validation
    // -------------------------------------------------------------------------
    console.log("\n8️⃣ Testing Error Handling for Scans & Comparisons...");

    // Scan not found
    await request(app).get("/api/scans/999999").expect(404);

    // Invalid scan ID
    await request(app).get("/api/scans/abc").expect(400);

    // Comparison not found
    await request(app).get("/api/comparisons/999999").expect(404);

    // Comparison < 2 products
    await request(app)
      .post("/api/comparisons")
      .send({ products: [1] })
      .expect(400);

    console.log("   ✓ Proper HTTP 400 and 404 error handling verified.");

    console.log(
      "\n🎉 ALL PHASE 10 SCAN AND COMPARISON HISTORY TESTS PASSED SUCCESSFULLY!\n",
    );
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Phase 10 test failed:", err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  }
}

runPhase10Tests();
