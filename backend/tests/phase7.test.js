const assert = require("assert");
const request = require("supertest");
const app = require("../src/app");
const ocrService = require("../src/services/ocr/ocrService");
const DemoOCRAdapter = require("../src/services/ocr/demoOCRAdapter");
const OCRProvider = require("../src/services/ocr/ocrProvider");
const nutritionParser = require("../src/services/nutritionParser");
const rankingService = require("../src/services/rankingService");

async function runPhase7Tests() {
  console.log("🧪 Starting Phase 7 Offline Shopping Scanner Tests...\n");

  try {
    // -------------------------------------------------------------------------
    // TEST 1: OCR Provider Abstraction & Demo Adapter Labeling
    // -------------------------------------------------------------------------
    console.log(
      "1️⃣ Testing OCR Provider Abstraction & Explicit Demo Labeling...",
    );

    // Test base provider interface
    const baseProvider = new OCRProvider("TestBase");
    try {
      await baseProvider.extractText("mock-image");
      assert.fail(
        "Base OCRProvider should throw if extractText is not implemented",
      );
    } catch (e) {
      assert.ok(e.message.includes("must be implemented"));
    }

    // Test DemoOCRAdapter metadata
    const demoAdapter = new DemoOCRAdapter();
    const meta = demoAdapter.getMetadata();
    assert.strictEqual(
      meta.isDemo,
      true,
      "Demo adapter must declare isDemo = true",
    );
    assert.ok(
      meta.provider.includes("Demo"),
      "Provider name must declare demo",
    );
    assert.ok(
      meta.notice.toLowerCase().includes("demo"),
      "Notice must explicitly state demo mode",
    );

    // Test OCRService abstraction
    const currentMeta = ocrService.getProviderMetadata();
    assert.ok(currentMeta.provider, "Provider name must be present");
    console.log(
      `   ✓ OCR Abstraction verified: Provider "${currentMeta.provider}" explicitly labeled (isDemo: ${currentMeta.isDemo})`,
    );

    // -------------------------------------------------------------------------
    // TEST 2: Nutrition & Ingredients Parser Unit Tests
    // -------------------------------------------------------------------------
    console.log("2️⃣ Testing Nutrition Fact & Ingredients Parser...");

    const sampleLabelText = `
      NutriLens Organic Chia Oat Bar
      Serving Size: 40g (1 bar)
      Calories: 160
      Total Fat: 4g
      Saturated Fat: 0.5g
      Trans Fat: 0g
      Sodium: 85mg
      Total Carbohydrates: 28g
      Dietary Fiber: 5g
      Total Sugars: 6g
      Includes 3g of Added Sugars
      Protein: 6g
      Ingredients: Rolled Oats, Chia Seeds, Tapioca Syrup, Almond Flour, Cinnamon, Sea Salt.
    `;

    const parsed = nutritionParser.parse(sampleLabelText);
    assert.strictEqual(parsed.productName, "NutriLens Organic Chia Oat Bar");
    assert.ok(parsed.servingSize.includes("40g"));
    assert.strictEqual(parsed.calories, 160);
    assert.strictEqual(parsed.totalFat, 4);
    assert.strictEqual(parsed.saturatedFat, 0.5);
    assert.strictEqual(parsed.transFat, 0);
    assert.strictEqual(parsed.sodium, 85);
    assert.strictEqual(parsed.carbohydrates, 28);
    assert.strictEqual(parsed.fiber, 5);
    assert.strictEqual(parsed.totalSugar, 6);
    assert.strictEqual(parsed.addedSugar, 3);
    assert.strictEqual(parsed.protein, 6);
    assert.ok(
      Array.isArray(parsed.ingredients),
      "Ingredients must be an array",
    );
    assert.ok(
      parsed.ingredients.length >= 5,
      "Expected at least 5 ingredients",
    );
    assert.ok(
      parsed.ingredients.includes("Rolled Oats"),
      "Should extract Rolled Oats",
    );
    assert.ok(
      parsed.ingredients.includes("Chia Seeds"),
      "Should extract Chia Seeds",
    );

    console.log(
      `   ✓ Successfully parsed: ${parsed.productName} (${parsed.calories} kcal, ${parsed.protein}g protein, ${parsed.fiber}g fiber, ${parsed.ingredients.length} ingredients)`,
    );

    // Test sodium unit conversion (0.8g -> 800mg)
    const gramSodiumLabel = "Sodium: 0.8g\nCalories: 200";
    const parsedGram = nutritionParser.parse(gramSodiumLabel);
    assert.strictEqual(
      parsedGram.sodium,
      800,
      "Should convert 0.8g sodium to 800mg",
    );
    console.log("   ✓ Sodium unit conversion (0.8g -> 800mg) verified");

    // -------------------------------------------------------------------------
    // TEST 3: REST API - POST /api/analyze/image (Verification First, No Premature Scoring)
    // -------------------------------------------------------------------------
    console.log("3️⃣ Testing REST API: POST /api/analyze/image...");

    const ocrRes = await request(app)
      .post("/api/analyze/image")
      .send({ rawText: sampleLabelText })
      .expect(200);

    assert.strictEqual(ocrRes.body.success, true);
    assert.ok(ocrRes.body.data.extractedData, "Must contain extractedData");
    assert.ok(ocrRes.body.data.ocrMeta, "Must contain ocrMeta");
    assert.strictEqual(typeof ocrRes.body.data.ocrMeta.isDemo, "boolean");

    // CRITICAL: Must NOT contain health_score yet
    assert.strictEqual(
      ocrRes.body.data.health_score,
      undefined,
      "POST /api/analyze/image MUST NOT prematurely calculate health score before verification",
    );
    assert.strictEqual(
      ocrRes.body.data.scoreEvaluation,
      undefined,
      "Score evaluation must wait for user verification",
    );

    console.log(
      "   ✓ POST /api/analyze/image succeeded: returns editable extracted values without premature scoring",
    );

    // -------------------------------------------------------------------------
    // TEST 4: REST API - POST /api/analyze/confirm (Normalization & Unified Scoring)
    // -------------------------------------------------------------------------
    console.log("4️⃣ Testing REST API: POST /api/analyze/confirm...");

    const confirmRes = await request(app)
      .post("/api/analyze/confirm")
      .send({
        productName: "Verified Oat Bar",
        servingSize: "40g",
        calories: "160",
        protein: "6",
        carbohydrates: "28",
        totalSugar: "6",
        addedSugar: "3",
        totalFat: "4",
        saturatedFat: "0.5",
        transFat: "0",
        sodium: "85",
        fiber: "5",
        ingredients: ["Rolled Oats", "Chia Seeds", "Almond Butter", "Sea Salt"],
      })
      .expect(200);

    assert.strictEqual(confirmRes.body.success, true);
    const scannedProduct = confirmRes.body.data.product;
    const scoreEval = confirmRes.body.data.scoreEvaluation;

    assert.ok(scannedProduct, "Must return normalized product");
    assert.strictEqual(scannedProduct.name, "Verified Oat Bar");
    assert.strictEqual(typeof scannedProduct.health_score, "number");
    assert.ok(
      scannedProduct.health_score >= 80,
      `Expected high score for healthy oat bar, got ${scannedProduct.health_score}`,
    );
    assert.ok(
      Array.isArray(scoreEval.positives),
      "Score evaluation must include positives",
    );
    assert.ok(
      scoreEval.positives.some((p) => p.includes("fiber")),
      "Should reward high fiber",
    );
    assert.ok(
      scoreEval.positives.some((p) => p.includes("whole grain")),
      "Should reward whole grain Rolled Oats",
    );

    console.log(
      `   ✓ Verified product scored: "${scannedProduct.name}" -> ${scannedProduct.health_score}/100 with ${scoreEval.positives.length} positives`,
    );

    // -------------------------------------------------------------------------
    // TEST 5: Pipeline Continuity: Comparing Scanned Product with Online Catalog Products
    // -------------------------------------------------------------------------
    console.log(
      "5️⃣ Testing Pipeline Continuity: Ranking Scanned Product with Catalog Products...",
    );

    // Ranking catalog product (ID 2 - Potato Chips) vs newly scanned oat bar
    const multiRank = await rankingService.rankProducts([2, scannedProduct]);
    assert.strictEqual(multiRank.results.length, 2);

    // Scanned healthy oat bar (~88-95) should outrank potato chips (~67)
    const topRanked = multiRank.results[0];
    assert.strictEqual(topRanked.rank, 1);
    assert.strictEqual(topRanked.product.name, "Verified Oat Bar");
    assert.strictEqual(multiRank.results[1].rank, 2);
    assert.ok(multiRank.results[1].product.name.includes("Potato Chips"));

    console.log(
      `   ✓ Pipeline Unified: Scanned product ranked seamlessly against catalog product!`,
    );
    console.log(
      `     Rank #1: ${topRanked.product.name} (${topRanked.score}/100)`,
    );
    console.log(
      `     Rank #2: ${multiRank.results[1].product.name} (${multiRank.results[1].score}/100)`,
    );

    console.log(
      "\n🎉 ALL PHASE 7 OFFLINE SCANNER TESTS PASSED SUCCESSFULLY!\n",
    );
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Phase 7 test failed:", err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  }
}

runPhase7Tests();
