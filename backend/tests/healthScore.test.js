const assert = require("assert");
const request = require("supertest");
const app = require("../src/app");
const healthScoreService = require("../src/services/healthScoreService");
const { HealthScoreService } = require("../src/services/healthScoreService");

async function runPhase5HealthScoreTests() {
  console.log("🧪 Starting Phase 5 Health Score Engine Tests...\n");

  try {
    // -------------------------------------------------------------------------
    // TEST 1: High Sugar Scenario
    // -------------------------------------------------------------------------
    console.log("1️⃣ Testing High Sugar Scenario...");
    const highSugarResult = healthScoreService.calculateHealthScore({
      calories: 250,
      protein: 2,
      carbohydrates: 45,
      totalSugar: 28,
      addedSugar: 22,
      totalFat: 5,
      saturatedFat: 2,
      transFat: 0,
      sodium: 150,
      fiber: 1,
    });

    assert.strictEqual(typeof highSugarResult.score, "number");
    assert.ok(
      highSugarResult.score <= 50,
      `Expected lower score for high sugar, got ${highSugarResult.score}`,
    );
    assert.strictEqual(highSugarResult.breakdown.sugar.impact, "negative");
    assert.strictEqual(highSugarResult.breakdown.addedSugar.impact, "negative");
    assert.ok(
      highSugarResult.negatives.some((n) => n.includes("sugar")),
      "Negatives list must contain sugar warning",
    );
    console.log(
      `   ✓ High Sugar Score: ${highSugarResult.score} | Negatives: ${highSugarResult.negatives.join("; ")}`,
    );

    // -------------------------------------------------------------------------
    // TEST 2: Low Sugar Scenario
    // -------------------------------------------------------------------------
    console.log("2️⃣ Testing Low Sugar Scenario...");
    const lowSugarResult = healthScoreService.calculateHealthScore({
      calories: 120,
      protein: 8,
      carbohydrates: 12,
      totalSugar: 2.0,
      addedSugar: 0.0,
      totalFat: 2,
      saturatedFat: 0.5,
      transFat: 0,
      sodium: 100,
      fiber: 4,
    });

    assert.ok(
      lowSugarResult.score >= 80,
      `Expected high score for low sugar healthy profile, got ${lowSugarResult.score}`,
    );
    assert.strictEqual(lowSugarResult.breakdown.sugar.impact, "positive");
    assert.strictEqual(lowSugarResult.breakdown.addedSugar.impact, "positive");
    assert.ok(
      lowSugarResult.positives.some((p) => p.toLowerCase().includes("sugar")),
      "Positives list must mention low sugar",
    );
    assert.ok(
      lowSugarResult.positives.some((p) =>
        p.toLowerCase().includes("added sugar"),
      ),
      "Positives list must mention no added sugar",
    );
    console.log(
      `   ✓ Low Sugar Score: ${lowSugarResult.score} | Positives: ${lowSugarResult.positives.slice(0, 2).join("; ")}`,
    );

    // -------------------------------------------------------------------------
    // TEST 3: High Sodium Scenario
    // -------------------------------------------------------------------------
    console.log("3️⃣ Testing High Sodium Scenario...");
    const highSodiumResult = healthScoreService.calculateHealthScore({
      calories: 180,
      protein: 4,
      carbohydrates: 20,
      totalSugar: 3,
      addedSugar: 0,
      totalFat: 4,
      saturatedFat: 1,
      transFat: 0,
      sodium: 950,
      fiber: 2,
    });

    assert.strictEqual(highSodiumResult.breakdown.sodium.impact, "negative");
    assert.ok(
      highSodiumResult.breakdown.sodium.score <= 15,
      "Sodium score should be <= 15 for 950mg",
    );
    assert.ok(
      highSodiumResult.negatives.some((n) =>
        n.toLowerCase().includes("sodium"),
      ),
      "Negatives list must flag high sodium",
    );
    console.log(
      `   ✓ High Sodium correctly flagged: ${highSodiumResult.breakdown.sodium.message}`,
    );

    // -------------------------------------------------------------------------
    // TEST 4: High Fiber Scenario
    // -------------------------------------------------------------------------
    console.log("4️⃣ Testing High Fiber Scenario...");
    const highFiberResult = healthScoreService.calculateHealthScore({
      calories: 200,
      protein: 5,
      carbohydrates: 30,
      totalSugar: 4,
      addedSugar: 1,
      totalFat: 3,
      saturatedFat: 0.5,
      transFat: 0,
      sodium: 80,
      fiber: 7.5,
    });

    assert.strictEqual(highFiberResult.breakdown.fiber.impact, "positive");
    assert.strictEqual(highFiberResult.breakdown.fiber.score, 100);
    assert.ok(
      highFiberResult.positives.some((p) => p.includes("fiber")),
      "Positives list must reward high fiber",
    );
    console.log(
      `   ✓ High Fiber rewarded: ${highFiberResult.breakdown.fiber.message}`,
    );

    // -------------------------------------------------------------------------
    // TEST 5: High Protein Scenario
    // -------------------------------------------------------------------------
    console.log("5️⃣ Testing High Protein Scenario...");
    const highProteinResult = healthScoreService.calculateHealthScore({
      calories: 190,
      protein: 16.5,
      carbohydrates: 10,
      totalSugar: 2,
      addedSugar: 0,
      totalFat: 4,
      saturatedFat: 1,
      transFat: 0,
      sodium: 150,
      fiber: 3,
    });

    assert.strictEqual(highProteinResult.breakdown.protein.impact, "positive");
    assert.strictEqual(highProteinResult.breakdown.protein.score, 100);
    assert.ok(
      highProteinResult.positives.some((p) => p.includes("High in protein")),
      "Positives list must highlight high protein",
    );
    console.log(
      `   ✓ High Protein rewarded: ${highProteinResult.breakdown.protein.message}`,
    );

    // -------------------------------------------------------------------------
    // TEST 6: High Saturated Fat Scenario
    // -------------------------------------------------------------------------
    console.log("6️⃣ Testing High Saturated Fat Scenario...");
    const highSatFatResult = healthScoreService.calculateHealthScore({
      calories: 320,
      protein: 4,
      carbohydrates: 25,
      totalSugar: 5,
      addedSugar: 2,
      totalFat: 24,
      saturatedFat: 11.5,
      transFat: 0,
      sodium: 200,
      fiber: 1,
    });

    assert.strictEqual(
      highSatFatResult.breakdown.saturatedFat.impact,
      "negative",
    );
    assert.ok(
      highSatFatResult.breakdown.saturatedFat.score <= 15,
      "Saturated fat score should be <= 15 for 11.5g",
    );
    assert.ok(
      highSatFatResult.negatives.some((n) =>
        n.toLowerCase().includes("saturated fat"),
      ),
      "Negatives must flag saturated fat",
    );
    console.log(
      `   ✓ High Saturated Fat flagged: ${highSatFatResult.breakdown.saturatedFat.message}`,
    );

    // -------------------------------------------------------------------------
    // TEST 7: Trans Fat Scenario
    // -------------------------------------------------------------------------
    console.log("7️⃣ Testing Trans Fat Scenario...");
    const transFatResult = healthScoreService.calculateHealthScore({
      calories: 220,
      protein: 3,
      carbohydrates: 20,
      totalSugar: 4,
      addedSugar: 1,
      totalFat: 12,
      saturatedFat: 3,
      transFat: 1.5,
      sodium: 180,
      fiber: 2,
    });

    assert.strictEqual(transFatResult.breakdown.transFat.impact, "negative");
    assert.strictEqual(transFatResult.breakdown.transFat.score, 0);
    assert.ok(
      transFatResult.negatives.some((n) => n.includes("trans fat")),
      "Negatives must flag trans fat",
    );
    console.log(
      `   ✓ Trans Fat penalized: ${transFatResult.breakdown.transFat.message}`,
    );

    // -------------------------------------------------------------------------
    // TEST 8: Missing Nutrition Data (Never Treated as Zero)
    // -------------------------------------------------------------------------
    console.log("8️⃣ Testing Missing Nutrition Data Scenario...");
    // Only 4 factors provided: calories, totalSugar, sodium, protein
    // Missing: addedSugar, saturatedFat, transFat, fiber
    const missingDataResult = healthScoreService.calculateHealthScore({
      calories: 150,
      totalSugar: 3,
      sodium: 120,
      protein: 6,
    });

    assert.strictEqual(typeof missingDataResult.score, "number");
    assert.strictEqual(
      missingDataResult.breakdown.addedSugar.impact,
      "missing",
    );
    assert.strictEqual(missingDataResult.breakdown.transFat.impact, "missing");
    assert.strictEqual(missingDataResult.breakdown.fiber.impact, "missing");
    assert.strictEqual(
      missingDataResult.breakdown.saturatedFat.impact,
      "missing",
    );

    // Completeness should be 4 out of 8 = 50%
    assert.strictEqual(missingDataResult.dataCompleteness, 50);

    // Warnings must be emitted for each missing item
    assert.ok(
      missingDataResult.warnings.length >= 4,
      "Must have warnings for missing factors",
    );
    assert.ok(
      missingDataResult.warnings.some((w) =>
        w.includes("Added sugar data is missing"),
      ),
      "Should warn about missing added sugar",
    );
    assert.ok(
      missingDataResult.warnings.some((w) =>
        w.includes("excluded from score calculation"),
      ),
      "Warning must specify exclusion from calculation",
    );

    // Verify it was NOT treated as zero score:
    // With 3g sugar (score 95), 120mg sodium (score 95), 6g protein (score 85), 150kcal (score 75)
    // Weighted avg is ~88. If missing was treated as 0, score would be around 40.
    assert.ok(
      missingDataResult.score >= 80,
      `Missing data must not artificially crash the score to zero! Got: ${missingDataResult.score}`,
    );
    console.log(
      `   ✓ Missing Data handled properly: dataCompleteness=${missingDataResult.dataCompleteness}%, warnings=${missingDataResult.warnings.length}, score=${missingDataResult.score}`,
    );

    // -------------------------------------------------------------------------
    // TEST 9: Whole Grain Ingredients Bonus
    // -------------------------------------------------------------------------
    console.log("9️⃣ Testing Whole Grain Ingredients Scenario...");
    const wholeGrainResult = healthScoreService.calculateHealthScore(
      {
        calories: 180,
        protein: 7,
        carbohydrates: 28,
        totalSugar: 3,
        addedSugar: 1,
        totalFat: 3,
        saturatedFat: 0.5,
        transFat: 0,
        sodium: 110,
        fiber: 5,
      },
      [
        "Whole Grain Rolled Oats",
        "Organic Chia Seeds",
        "Cinnamon",
        "Almond Milk",
      ],
    );

    const withoutWholeGrainResult = healthScoreService.calculateHealthScore(
      {
        calories: 180,
        protein: 7,
        carbohydrates: 28,
        totalSugar: 3,
        addedSugar: 1,
        totalFat: 3,
        saturatedFat: 0.5,
        transFat: 0,
        sodium: 110,
        fiber: 5,
      },
      ["Refined Wheat Flour", "Water", "Salt"],
    );

    assert.ok(
      wholeGrainResult.positives.some((p) => p.includes("whole grain")),
      "Positives must recognize whole grain ingredients",
    );
    assert.ok(
      wholeGrainResult.score > withoutWholeGrainResult.score,
      `Whole grain product (${wholeGrainResult.score}) should score higher than refined (${withoutWholeGrainResult.score})`,
    );
    console.log(
      `   ✓ Whole Grain Bonus verified: With=${wholeGrainResult.score} vs Without=${withoutWholeGrainResult.score}`,
    );

    // -------------------------------------------------------------------------
    // TEST 10: Refined Additives / Palm Oil Penalty
    // -------------------------------------------------------------------------
    console.log("🔟 Testing Refined Additives Penalty Scenario...");
    const additiveResult = healthScoreService.calculateHealthScore(
      {
        calories: 220,
        protein: 2,
        carbohydrates: 24,
        totalSugar: 5,
        addedSugar: 2,
        totalFat: 10,
        saturatedFat: 3,
        transFat: 0,
        sodium: 200,
        fiber: 1,
      },
      [
        "Potato Flakes",
        "Hydrogenated Palm Oil",
        "High Fructose Corn Syrup",
        "Monosodium Glutamate",
      ],
    );

    assert.ok(
      additiveResult.negatives.some((n) =>
        n.includes("refined fats or artificial additives"),
      ),
      "Negatives must flag hydrogenated oils or artificial additives",
    );
    console.log(
      `   ✓ Additive penalty detected: ${additiveResult.negatives[additiveResult.negatives.length - 1]}`,
    );

    // -------------------------------------------------------------------------
    // TEST 11: Configurable Weights Verification
    // -------------------------------------------------------------------------
    console.log("1️⃣1️⃣ Testing Custom Weight Configuration...");
    const customService = new HealthScoreService({
      weights: {
        sugar: 80, // heavily prioritize sugar
        sodium: 5,
        protein: 5,
      },
      wholeGrainBonus: 15,
    });

    const customResult = customService.calculateHealthScore({
      totalSugar: 35, // very high sugar
      protein: 20, // high protein
      sodium: 50, // low sodium
    });

    // In default service, protein and sodium would offset sugar.
    // In customService with 80% sugar weight, score must be dragged down heavily.
    assert.ok(
      customResult.score < 30,
      `Score with custom heavy sugar weight should be < 30, got ${customResult.score}`,
    );
    console.log(
      `   ✓ Custom weights verified: heavy sugar weight produced score ${customResult.score}`,
    );

    // -------------------------------------------------------------------------
    // TEST 12: Output Schema & Disclaimers Compliance
    // -------------------------------------------------------------------------
    console.log("1️⃣2️⃣ Testing Compliance & Schema Specifications...");
    assert.strictEqual(lowSugarResult.analysisVersion, "1.0");
    assert.ok(
      lowSugarResult.scoreDescription.includes("NutriLens Health Score"),
    );
    assert.ok(
      lowSugarResult.scoreDescription.includes(
        "Better choice among selected products",
      ),
    );
    // Prohibited medical claim checks
    const forbiddenPhrases = [
      "percentage healthy",
      "medically safe",
      "disease preventing",
      "medically recommended",
    ];
    const allText = JSON.stringify(lowSugarResult).toLowerCase();
    for (const phrase of forbiddenPhrases) {
      assert.ok(
        !allText.includes(phrase),
        `Prohibited phrase detected: "${phrase}"`,
      );
    }
    console.log(
      "   ✓ Medical claims disclaimer & neutral terminology strictly compliant",
    );

    // -------------------------------------------------------------------------
    // TEST 13: REST API Endpoint (POST /api/score/evaluate)
    // -------------------------------------------------------------------------
    console.log("1️⃣3️⃣ Testing REST API (POST /api/score/evaluate)...");
    const apiRes = await request(app)
      .post("/api/score/evaluate")
      .send({
        nutrition: {
          calories: 140,
          protein: 10,
          totalSugar: 2,
          addedSugar: 0,
          sodium: 100,
          fiber: 4,
        },
        ingredients: ["Organic Rolled Oats", "Almonds"],
      })
      .expect(200);

    assert.strictEqual(apiRes.body.success, true);
    assert.strictEqual(typeof apiRes.body.data.score, "number");
    assert.strictEqual(apiRes.body.data.analysisVersion, "1.0");
    assert.ok(Array.isArray(apiRes.body.data.positives));
    assert.ok(Array.isArray(apiRes.body.data.warnings));
    assert.ok(apiRes.body.data.dataCompleteness > 0);
    console.log(
      `   ✓ POST /api/score/evaluate returned HTTP 200 with score ${apiRes.body.data.score}`,
    );

    // -------------------------------------------------------------------------
    // TEST 14: Product Detail Integration (GET /api/products/1)
    // -------------------------------------------------------------------------
    console.log("1️⃣4️⃣ Testing Product Detail Dynamic Score Integration...");
    const prodRes = await request(app).get("/api/products/1").expect(200);
    assert.strictEqual(prodRes.body.success, true);
    assert.ok(
      prodRes.body.data.score_evaluation,
      "Product should have score_evaluation attached",
    );
    assert.strictEqual(
      prodRes.body.data.score_evaluation.analysisVersion,
      "1.0",
    );
    console.log(
      `   ✓ Product #1 dynamically scored with version: ${prodRes.body.data.score_evaluation.analysisVersion}`,
    );

    console.log("\n🎉 ALL 14 PHASE 5 HEALTH SCORE ENGINE TESTS PASSED!\n");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Phase 5 test failed:", err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  }
}

runPhase5HealthScoreTests();
