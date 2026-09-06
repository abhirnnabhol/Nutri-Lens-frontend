/**
 * Phase 11 Automated Test Suite
 * Optional Health Profile Personalization Verification
 *
 * Verifies:
 * 1. Base Score & Ranking Invariance (personalization NEVER changes general score/rank)
 * 2. Comparative Sugar Notice matching prompt exact wording
 * 3. Comparative Sodium Notice matching prompt exact wording
 * 4. Transparent Profile Factor Attribution
 * 5. Strict Non-Medical Boundary & Forbidden Claims Guard
 * 6. Single Product Detail Insight Generation
 */

const assert = require("assert");
const rankingService = require("../src/services/rankingService");
const personalizationService = require("../src/services/personalizationService");

console.log("\n======================================================");
console.log("🧪 Starting NutriLens Phase 11: Personalization Tests");
console.log("======================================================\n");

async function runPhase11Tests() {
  let passed = 0;
  let total = 0;

  async function it(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}`);
      console.error(`     Error: ${err.message}`);
      throw err;
    }
  }

  const sampleProducts = [
    {
      id: 1,
      name: "Organic Rolled Oats",
      brand: "Nature Farm",
      calories: 370,
      total_fat: 7.0,
      saturated_fat: 1.2,
      carbohydrates: 60,
      total_sugar: 1.5,
      protein: 13.0,
      sodium: 5.0,
      fiber: 10.0,
      ingredients: [
        { name: "whole grain rolled oats", category: "whole_grain" },
      ],
    },
    {
      id: 2,
      name: "Sugary Choco Cereal",
      brand: "SweetCo",
      calories: 410,
      total_fat: 5.0,
      saturated_fat: 2.5,
      carbohydrates: 82,
      total_sugar: 32.0,
      protein: 4.0,
      sodium: 480.0,
      fiber: 2.0,
      ingredients: [
        { name: "refined flour", category: "refined_grain" },
        { name: "sugar", category: "sugar" },
        { name: "cocoa powder", category: "flavoring" },
      ],
    },
    {
      id: 3,
      name: "Salty Savory Chips",
      brand: "CrunchTime",
      calories: 520,
      total_fat: 32.0,
      saturated_fat: 12.0,
      carbohydrates: 54,
      total_sugar: 3.0,
      protein: 6.0,
      sodium: 890.0,
      fiber: 3.0,
      ingredients: [
        { name: "potatoes", category: "vegetable" },
        { name: "palm oil", category: "saturated_fat_source" },
        { name: "salt", category: "additive" },
      ],
    },
  ];

  // 1. INVARIANCE TEST: Score & Rank MUST remain identical with or without health profile
  await it("Requirement 1: Base NutriLens Health Score and rank ordering must be 100% invariant", async () => {
    // Rank without profile
    const { results: baselineResults } =
      await rankingService.rankProducts(sampleProducts);

    // Enrich with a heavy condition profile (diabetes, hypertension, heart disease)
    const heavyProfile = {
      conditions: ["diabetes", "hypertension", "heart_disease"],
      allergies: ["peanuts"],
      dietary_preferences: ["low_sugar"],
    };

    const enrichedResults = personalizationService.enrichResultsWithInsights(
      baselineResults,
      heavyProfile,
    );

    assert.strictEqual(enrichedResults.length, baselineResults.length);

    enrichedResults.forEach((enriched, idx) => {
      const base = baselineResults[idx];
      assert.strictEqual(
        enriched.productId,
        base.productId,
        `Product order changed at index ${idx}`,
      );
      assert.strictEqual(
        enriched.score,
        base.score,
        `Score modified for product ${enriched.productId}! Base: ${base.score}, Enriched: ${enriched.score}`,
      );
      assert.strictEqual(
        enriched.rank,
        base.rank,
        `Rank position modified for product ${enriched.productId}!`,
      );
    });
  });

  // 2. SUGAR MONITORING COMPARATIVE NOTICE (Matches Prompt Specification)
  await it("Requirement 2: Comparative sugar notice on high sugar product matching exact prompt wording", async () => {
    const { results: baselineResults } =
      await rankingService.rankProducts(sampleProducts);
    const diabetesProfile = {
      conditions: ["diabetes"],
    };

    const enriched = personalizationService.enrichResultsWithInsights(
      baselineResults,
      diabetesProfile,
    );

    // Find the high sugar product (Sugary Choco Cereal, id: 2)
    const chocoCereal = enriched.find((r) => r.productId === 2);
    assert(chocoCereal, "Choco cereal item not found");
    assert(
      chocoCereal.personalizedInsight,
      "personalizedInsight must be attached",
    );
    assert.strictEqual(chocoCereal.personalizedInsight.hasInsight, true);

    const expectedSugarNotice =
      "Your profile indicates that you are monitoring sugar intake. This product contains relatively high sugar compared with the selected products.";
    const hasExpectedNotice =
      chocoCereal.personalizedInsight.notices.includes(expectedSugarNotice);
    assert(
      hasExpectedNotice,
      `Expected notice not found in: ${JSON.stringify(chocoCereal.personalizedInsight.notices)}`,
    );

    const expectedRecommendation =
      "Lower sugar options may better align with your selected preferences.";
    const hasExpectedRec =
      chocoCereal.personalizedInsight.recommendations.includes(
        expectedRecommendation,
      );
    assert(
      hasExpectedRec,
      `Expected recommendation not found in: ${JSON.stringify(chocoCereal.personalizedInsight.recommendations)}`,
    );
  });

  // 3. SODIUM MONITORING COMPARATIVE NOTICE (Matches Prompt Specification)
  await it("Requirement 3: Comparative sodium notice on high sodium product matching exact prompt wording", async () => {
    const { results: baselineResults } =
      await rankingService.rankProducts(sampleProducts);
    const hypertensionProfile = {
      conditions: ["hypertension"],
    };

    const enriched = personalizationService.enrichResultsWithInsights(
      baselineResults,
      hypertensionProfile,
    );

    // Find the highest sodium product (Salty Savory Chips, id: 3, sodium: 890mg)
    const chips = enriched.find((r) => r.productId === 3);
    assert(chips, "Chips item not found");
    assert(chips.personalizedInsight, "personalizedInsight must be attached");
    assert.strictEqual(chips.personalizedInsight.hasInsight, true);

    const expectedSodiumNotice =
      "This product has relatively high sodium compared with the selected products.";
    const hasExpectedSodiumNotice =
      chips.personalizedInsight.notices.includes(expectedSodiumNotice);
    assert(
      hasExpectedSodiumNotice,
      `Expected sodium notice not found in: ${JSON.stringify(chips.personalizedInsight.notices)}`,
    );
  });

  // 4. TRANSPARENT ATTRIBUTION & MEDICAL DISCLAIMER
  await it("Requirement 4: Transparent profile factor attribution and mandatory non-medical disclaimer", async () => {
    const { results: baselineResults } =
      await rankingService.rankProducts(sampleProducts);
    const profile = {
      conditions: ["diabetes", "hypertension"],
    };

    const enriched = personalizationService.enrichResultsWithInsights(
      baselineResults,
      profile,
    );

    enriched.forEach((item) => {
      const insight = item.personalizedInsight;
      assert(insight, "Personalized insight must be present");
      assert.strictEqual(insight.title, "Personalized Insights");
      assert(
        insight.disclaimer.includes("Non-medical informational notice only"),
        "Disclaimer must state non-medical informational notice only",
      );
      assert(
        insight.disclaimer.includes("not medical advice or diagnosis"),
        "Disclaimer must clearly state not medical advice or diagnosis",
      );
      assert(
        Array.isArray(insight.profileFactors) &&
          insight.profileFactors.length > 0,
        "Profile factors must be transparently listed",
      );
    });
  });

  // 5. STRICT FORBIDDEN CLAIMS GUARD
  await it("Requirement 5: Strict prevention of forbidden medical claims", async () => {
    const { results: baselineResults } =
      await rankingService.rankProducts(sampleProducts);
    const profiles = [
      {
        conditions: [
          "diabetes",
          "hypertension",
          "heart_disease",
          "cholesterol",
        ],
      },
      {
        conditions: ["thyroid", "obesity"],
        dietary_preferences: ["low_sugar", "low_sodium"],
      },
    ];

    const forbiddenPhrases = [
      "safe for diabetes",
      "will prevent disease",
      "medically recommended",
      "cure",
      "treat disease",
      "clinically proven",
    ];

    profiles.forEach((prof) => {
      const enriched = personalizationService.enrichResultsWithInsights(
        baselineResults,
        prof,
      );
      enriched.forEach((item) => {
        const textToAudit = JSON.stringify(
          item.personalizedInsight,
        ).toLowerCase();
        forbiddenPhrases.forEach((phrase) => {
          assert(
            !textToAudit.includes(phrase),
            `FORBIDDEN MEDICAL CLAIM DETECTED: "${phrase}" in ${JSON.stringify(item.personalizedInsight)}`,
          );
        });
      });
    });
  });

  // 6. SINGLE PRODUCT DETAIL INSIGHT GENERATION
  await it("Requirement 6: Single product detail insight generation against health profile", () => {
    const highSugarProduct = sampleProducts[1]; // 32g sugar
    const diabetesProfile = {
      conditions: ["diabetes"],
    };

    const insight = personalizationService.generateProductInsight(
      highSugarProduct,
      diabetesProfile,
    );
    assert(insight, "Single product insight should be returned");
    assert.strictEqual(insight.hasInsight, true);
    assert(
      insight.notices.some(
        (n) => n.includes("sugar intake") && n.includes("32g"),
      ),
      `Notice should state high sugar context: ${JSON.stringify(insight.notices)}`,
    );
    assert(
      insight.recommendations.includes(
        "Lower sugar options may better align with your selected preferences.",
      ),
    );
    assert(
      insight.disclaimer,
      "Medical disclaimer must be attached to single product insight",
    );
  });

  // 7. NULL/EMPTY PROFILE GRACEFUL HANDLING
  await it("Requirement 7: Handles empty or undefined health profile gracefully without errors", async () => {
    const { results: baselineResults } =
      await rankingService.rankProducts(sampleProducts);

    const resNull = personalizationService.enrichResultsWithInsights(
      baselineResults,
      null,
    );
    assert.strictEqual(resNull[0].personalizedInsight, null);

    const resEmpty = personalizationService.enrichResultsWithInsights(
      baselineResults,
      {},
    );
    assert.strictEqual(resEmpty[0].personalizedInsight.hasInsight, false);

    const singleNull = personalizationService.generateProductInsight(
      sampleProducts[0],
      null,
    );
    assert.strictEqual(singleNull, null);
  });

  console.log("\n======================================================");
  console.log(`🎉 ALL ${passed}/${total} PHASE 11 TESTS PASSED SUCCESSFULLY!`);
  console.log("======================================================\n");
}

runPhase11Tests();
