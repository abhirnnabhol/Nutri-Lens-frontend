const assert = require("assert");
const request = require("supertest");
const app = require("../src/app");
const ingredientAnalysisService = require("../src/services/ingredientAnalysisService");
const {
  IngredientAnalysisService,
  CATEGORIES,
  CATEGORY_LIST,
} = require("../src/services/ingredientAnalysisService");
const healthScoreService = require("../src/services/healthScoreService");
const productService = require("../src/services/productService");

async function runPhase8Tests() {
  console.log(
    "🧪 Starting Phase 8 Ingredient Analysis and Normalization Tests...\n",
  );

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Exact Prompt Normalization Examples
    // -------------------------------------------------------------------------
    console.log("1️⃣ Testing Exact Prompt Normalization Examples...");

    // "sucrose" -> "sugar"
    assert.strictEqual(
      ingredientAnalysisService.normalizeIngredient("sucrose"),
      "sugar",
      "sucrose must normalize to sugar",
    );
    assert.strictEqual(
      ingredientAnalysisService.normalizeIngredient("SUCROSE"),
      "sugar",
      "Case insensitivity must work for sucrose",
    );

    // "table sugar" -> "sugar"
    assert.strictEqual(
      ingredientAnalysisService.normalizeIngredient("table sugar"),
      "sugar",
      "table sugar must normalize to sugar",
    );
    assert.strictEqual(
      ingredientAnalysisService.normalizeIngredient("Table  Sugar"),
      "sugar",
      "Whitespace insensitivity must work for table sugar",
    );

    // "sodium chloride" -> "salt"
    assert.strictEqual(
      ingredientAnalysisService.normalizeIngredient("sodium chloride"),
      "salt",
      "sodium chloride must normalize to salt",
    );
    assert.strictEqual(
      ingredientAnalysisService.normalizeIngredient("Sodium Chloride"),
      "salt",
      "Case insensitivity must work for sodium chloride",
    );

    // "refined wheat flour" -> "refined flour"
    assert.strictEqual(
      ingredientAnalysisService.normalizeIngredient("refined wheat flour"),
      "refined flour",
      "refined wheat flour must normalize to refined flour",
    );

    // "maida" -> "refined flour"
    assert.strictEqual(
      ingredientAnalysisService.normalizeIngredient("maida"),
      "refined flour",
      "maida must normalize to refined flour",
    );
    assert.strictEqual(
      ingredientAnalysisService.normalizeIngredient(
        "Maida (All Purpose Flour)",
      ),
      "refined flour",
      "Parenthetical notes on maida must normalize to refined flour",
    );

    console.log("   ✓ All 5 prompt examples normalized accurately:");
    console.log('     "sucrose" → "sugar"');
    console.log('     "table sugar" → "sugar"');
    console.log('     "sodium chloride" → "salt"');
    console.log('     "refined wheat flour" → "refined flour"');
    console.log('     "maida" → "refined flour"');

    // -------------------------------------------------------------------------
    // TEST 2: Multi-format Parsing (String, Multiline, Bullets, Object Arrays)
    // -------------------------------------------------------------------------
    console.log("2️⃣ Testing Multi-format Raw Ingredient Input Parsing...");

    // Comma string with prefix & percentages
    const rawString =
      "Ingredients: Whole Wheat Flour (60%), Palm Oil, Sucrose, INS 211, Salt.";
    const parsedFromString =
      ingredientAnalysisService.parseRawIngredients(rawString);
    assert.ok(parsedFromString.length >= 4);
    assert.ok(parsedFromString.some((i) => i.includes("Whole Wheat Flour")));

    // Bullet-separated string
    const bulletString = "• Rolled Oats\n• Chia Seeds\n• Sea Salt\n• Honey";
    const parsedFromBullets =
      ingredientAnalysisService.parseRawIngredients(bulletString);
    assert.strictEqual(parsedFromBullets.length, 4);
    assert.strictEqual(parsedFromBullets[0], "Rolled Oats");

    // Object array (database catalog style)
    const objectArray = [
      { name: "Maida" },
      { name: "Sodium Chloride" },
      { name: "Partially Hydrogenated Palm Oil" },
    ];
    const parsedFromObjects =
      ingredientAnalysisService.parseRawIngredients(objectArray);
    assert.strictEqual(parsedFromObjects.length, 3);
    assert.strictEqual(parsedFromObjects[0], "Maida");

    console.log(
      "   ✓ Successfully parsed raw strings, bulleted lists, and catalog object arrays",
    );

    // -------------------------------------------------------------------------
    // TEST 3: All 13 Categories Verification
    // -------------------------------------------------------------------------
    console.log("3️⃣ Testing Verification of All 13 Categories...");

    const testCategoriesMap = [
      { raw: "Cane Sugar", expectedCategory: CATEGORIES.SUGAR },
      { raw: "Maida", expectedCategory: CATEGORIES.REFINED_GRAIN },
      {
        raw: "Whole Grain Rolled Oats",
        expectedCategory: CATEGORIES.WHOLE_GRAIN,
      },
      {
        raw: "Whey Protein Isolate",
        expectedCategory: CATEGORIES.PROTEIN_SOURCE,
      },
      { raw: "Psyllium Husk", expectedCategory: CATEGORIES.FIBER_SOURCE },
      { raw: "Palm Oil", expectedCategory: CATEGORIES.SATURATED_FAT_SOURCE },
      {
        raw: "Partially Hydrogenated Vegetable Oil",
        expectedCategory: CATEGORIES.TRANS_FAT_SOURCE,
      },
      { raw: "Sodium Benzoate", expectedCategory: CATEGORIES.PRESERVATIVE },
      { raw: "Sucralose", expectedCategory: CATEGORIES.ARTIFICIAL_SWEETENER },
      { raw: "Tartrazine", expectedCategory: CATEGORIES.COLORING },
      { raw: "Monosodium Glutamate", expectedCategory: CATEGORIES.FLAVORING },
      { raw: "Soy Lecithin", expectedCategory: CATEGORIES.EMULSIFIER },
      { raw: "Citric Acid", expectedCategory: CATEGORIES.OTHER_ADDITIVE },
    ];

    assert.strictEqual(
      CATEGORY_LIST.length,
      13,
      "Must have exactly 13 defined categories",
    );

    for (const testCase of testCategoriesMap) {
      const normalized = ingredientAnalysisService.normalizeIngredient(
        testCase.raw,
      );
      const categories = ingredientAnalysisService.categorizeIngredient(
        normalized,
        testCase.raw,
      );
      assert.ok(
        categories.includes(testCase.expectedCategory),
        `Ingredient "${testCase.raw}" (norm: "${normalized}") must map to category "${testCase.expectedCategory}". Got: [${categories.join(", ")}]`,
      );
      console.log(
        `   ✓ Category [${testCase.expectedCategory}]: "${testCase.raw}" → "${normalized}"`,
      );
    }

    // -------------------------------------------------------------------------
    // TEST 4: Output Schema Conformance
    // -------------------------------------------------------------------------
    console.log("4️⃣ Testing Output Schema Specification Conformance...");

    const sampleAnalysis = ingredientAnalysisService.analyze(
      "Maida, sucrose, sodium chloride, palm oil, ins 211, sucralose, rolled oats",
    );

    // Required schema keys:
    // { normalizedIngredients: [], categories: [], positives: [], negatives: [], warnings: [] }
    assert.ok(
      Array.isArray(sampleAnalysis.normalizedIngredients),
      "normalizedIngredients must be an array",
    );
    assert.ok(
      Array.isArray(sampleAnalysis.categories),
      "categories must be an array",
    );
    assert.ok(
      Array.isArray(sampleAnalysis.positives),
      "positives must be an array",
    );
    assert.ok(
      Array.isArray(sampleAnalysis.negatives),
      "negatives must be an array",
    );
    assert.ok(
      Array.isArray(sampleAnalysis.warnings),
      "warnings must be an array",
    );

    // Check normalization array contents
    assert.ok(sampleAnalysis.normalizedIngredients.includes("refined flour"));
    assert.ok(sampleAnalysis.normalizedIngredients.includes("sugar"));
    assert.ok(sampleAnalysis.normalizedIngredients.includes("salt"));
    assert.ok(sampleAnalysis.normalizedIngredients.includes("palm oil"));
    assert.ok(sampleAnalysis.normalizedIngredients.includes("rolled oats"));

    // Check categories array contents
    assert.ok(sampleAnalysis.categories.includes("refined_grain"));
    assert.ok(sampleAnalysis.categories.includes("sugar"));
    assert.ok(sampleAnalysis.categories.includes("whole_grain"));
    assert.ok(sampleAnalysis.categories.includes("saturated_fat_source"));
    assert.ok(sampleAnalysis.categories.includes("preservative"));
    assert.ok(sampleAnalysis.categories.includes("artificial_sweetener"));

    // Check positives and negatives
    assert.ok(sampleAnalysis.positives.some((p) => p.includes("whole grain")));
    assert.ok(
      sampleAnalysis.negatives.some(
        (n) => n.includes("refined flour") || n.includes("refined grain"),
      ),
    );
    assert.ok(sampleAnalysis.negatives.some((n) => n.includes("sugar")));

    // Check warnings
    assert.ok(
      sampleAnalysis.warnings.some((w) => w.includes("artificial sweetener")),
    );
    assert.ok(sampleAnalysis.warnings.some((w) => w.includes("preservative")));

    console.log("   ✓ Output schema perfectly matches required specifications");

    // -------------------------------------------------------------------------
    // TEST 5: Determinism & Explainability (Zero Randomness)
    // -------------------------------------------------------------------------
    console.log("5️⃣ Testing Determinism & Explainability...");

    assert.strictEqual(
      ingredientAnalysisService.isDeterministic(),
      true,
      "Service must declare deterministic operation",
    );

    const run1 = ingredientAnalysisService.analyze(
      "Whole Wheat Flour, Partially Hydrogenated Soybean Oil, Sucralose, INS 102",
    );

    // Run 50 iterations to ensure 100% determinism (zero variance)
    for (let i = 0; i < 50; i++) {
      const runIter = ingredientAnalysisService.analyze(
        "Whole Wheat Flour, Partially Hydrogenated Soybean Oil, Sucralose, INS 102",
      );
      assert.deepStrictEqual(
        runIter.normalizedIngredients,
        run1.normalizedIngredients,
        "normalizedIngredients must be completely identical across runs",
      );
      assert.deepStrictEqual(
        runIter.categories,
        run1.categories,
        "categories must be completely identical across runs",
      );
      assert.deepStrictEqual(
        runIter.positives,
        run1.positives,
        "positives must be completely identical across runs",
      );
      assert.deepStrictEqual(
        runIter.negatives,
        run1.negatives,
        "negatives must be completely identical across runs",
      );
      assert.deepStrictEqual(
        runIter.warnings,
        run1.warnings,
        "warnings must be completely identical across runs",
      );
    }
    console.log(
      "   ✓ Verified 100% deterministic reproducibility over 50 iterations (no LLM randomness)",
    );

    // -------------------------------------------------------------------------
    // TEST 6: Integration: IngredientAnalysisService → HealthScoreService
    // -------------------------------------------------------------------------
    console.log(
      "6️⃣ Testing Integration: IngredientAnalysisService → HealthScoreService...",
    );

    const healthEval = healthScoreService.calculateHealthScore(
      {
        calories: 180,
        protein: 8,
        carbohydrates: 25,
        totalSugar: 3,
        addedSugar: 0,
        totalFat: 3,
        saturatedFat: 0.5,
        transFat: 0,
        sodium: 90,
        fiber: 6,
      },
      ["Rolled Oats", "Chia Seeds", "Almond Butter", "Sea Salt"],
    );

    assert.ok(
      healthEval.ingredientAnalysis,
      "HealthScoreService must attach ingredientAnalysis",
    );
    assert.ok(
      Array.isArray(healthEval.normalizedIngredients),
      "HealthScoreService must attach normalizedIngredients",
    );
    assert.ok(
      Array.isArray(healthEval.ingredientCategories),
      "HealthScoreService must attach ingredientCategories",
    );
    assert.ok(
      healthEval.ingredientCategories.includes("whole_grain"),
      "Should identify whole_grain category in health score evaluation",
    );
    assert.ok(
      healthEval.positives.some((p) => p.includes("whole grain")),
      "Health score positives must include whole grain benefits",
    );

    console.log(
      `   ✓ HealthScoreService successfully integrated with IngredientAnalysisService (Score: ${healthEval.score}/100)`,
    );

    // -------------------------------------------------------------------------
    // TEST 7: Online Catalog Products Integration
    // -------------------------------------------------------------------------
    console.log("7️⃣ Testing Online Products Pipeline Integration...");

    const catalogProduct = await productService.getProductById(1);
    assert.ok(catalogProduct, "Must retrieve catalog product 1");
    assert.ok(
      catalogProduct.score_evaluation,
      "Catalog product must have score_evaluation",
    );
    assert.ok(
      catalogProduct.ingredient_analysis,
      "Online catalog product must have ingredient_analysis attached",
    );
    assert.ok(
      Array.isArray(catalogProduct.normalized_ingredients),
      "Online catalog product must have normalized_ingredients attached",
    );
    assert.ok(
      catalogProduct.ingredient_analysis.categories.length > 0,
      "Online catalog product must have categorized ingredients",
    );
    console.log(
      `   ✓ Online product #1 ("${catalogProduct.name}") analyzed: [${catalogProduct.normalized_ingredients.join(", ")}]`,
    );

    // -------------------------------------------------------------------------
    // TEST 8: Offline Scanned Products Integration (POST /api/analyze/confirm)
    // -------------------------------------------------------------------------
    console.log("8️⃣ Testing Offline Scanned Products Integration...");

    const confirmRes = await request(app)
      .post("/api/analyze/confirm")
      .send({
        productName: "Offline Scanned Breakfast Cookie",
        servingSize: "45g",
        calories: 210,
        protein: 6,
        carbohydrates: 28,
        totalSugar: 8,
        addedSugar: 4,
        totalFat: 7,
        saturatedFat: 1.5,
        transFat: 0,
        sodium: 120,
        fiber: 4,
        ingredients: [
          "Whole Wheat Flour",
          "Rolled Oats",
          "Brown Sugar",
          "Palm Oil",
          "Baking Soda",
        ],
      })
      .expect(200);

    assert.strictEqual(confirmRes.body.success, true);
    const scannedProduct = confirmRes.body.data.product;
    assert.ok(
      scannedProduct.ingredient_analysis,
      "Scanned product must have ingredient_analysis attached",
    );
    assert.ok(
      scannedProduct.normalized_ingredients,
      "Scanned product must have normalized_ingredients attached",
    );
    assert.ok(
      scannedProduct.normalized_ingredients.includes("whole wheat flour"),
      "Must normalize Whole Wheat Flour",
    );
    assert.ok(
      scannedProduct.normalized_ingredients.includes("rolled oats"),
      "Must normalize Rolled Oats",
    );
    assert.ok(
      scannedProduct.ingredient_analysis.categories.includes("whole_grain"),
      "Scanned product categories must contain whole_grain",
    );
    console.log(
      `   ✓ Offline scanned product analyzed: [${scannedProduct.normalized_ingredients.join(", ")}]`,
    );

    // -------------------------------------------------------------------------
    // TEST 9: REST API: POST /api/analyze/ingredients
    // -------------------------------------------------------------------------
    console.log("9️⃣ Testing REST API: POST /api/analyze/ingredients...");

    // Test with raw text string
    const apiTextRes = await request(app)
      .post("/api/analyze/ingredients")
      .send({
        text: "Maida, sucrose, sodium chloride, partially hydrogenated palm oil, INS 211, sucralose",
      })
      .expect(200);

    assert.strictEqual(apiTextRes.body.success, true);
    const textData = apiTextRes.body.data;
    assert.strictEqual(textData.normalizedIngredients[0], "refined flour");
    assert.strictEqual(textData.normalizedIngredients[1], "sugar");
    assert.strictEqual(textData.normalizedIngredients[2], "salt");
    assert.ok(textData.categories.includes("refined_grain"));
    assert.ok(textData.categories.includes("sugar"));
    assert.ok(textData.categories.includes("trans_fat_source"));
    assert.ok(textData.categories.includes("preservative"));
    assert.ok(textData.categories.includes("artificial_sweetener"));
    assert.ok(
      textData.warnings.some((w) => w.includes("industrial trans fats")),
    );
    assert.ok(
      textData.warnings.some((w) => w.includes("artificial sweeteners")),
    );

    // Test with array of strings
    const apiArrayRes = await request(app)
      .post("/api/analyze/ingredients")
      .send({
        ingredients: ["Table sugar", "Refined wheat flour", "Sodium chloride"],
      })
      .expect(200);

    assert.strictEqual(apiArrayRes.body.success, true);
    const arrayData = apiArrayRes.body.data;
    assert.deepStrictEqual(arrayData.normalizedIngredients, [
      "sugar",
      "refined flour",
      "salt",
    ]);
    assert.ok(arrayData.categories.includes("sugar"));
    assert.ok(arrayData.categories.includes("refined_grain"));

    console.log(
      "   ✓ REST API POST /api/analyze/ingredients verified with both text and array inputs",
    );

    console.log(
      "\n🎉 ALL 9 PHASE 8 INGREDIENT ANALYSIS & NORMALIZATION TESTS PASSED!\n",
    );
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Phase 8 test failed:", err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  }
}

runPhase8Tests();
