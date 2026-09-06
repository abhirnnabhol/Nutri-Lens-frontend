const assert = require("assert");
const request = require("supertest");
const app = require("../src/app");
const rankingService = require("../src/services/rankingService");
const healthScoreService = require("../src/services/healthScoreService");
const ingredientAnalysisService = require("../src/services/ingredientAnalysisService");

async function runPhase9Tests() {
  console.log(
    "🧪 Starting Phase 9 Offline Multi-Product Comparison Tests...\n",
  );

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Scan & Verify 3 Distinct Products via POST /api/analyze/confirm
    // (Simulates User verifying 13 editable fields for Product A, B, and C)
    // -------------------------------------------------------------------------
    console.log(
      "1️⃣ Testing Verification & Normalization for 3 Scanned Products (13 Fields)...",
    );

    // Product A: High-fiber Organic Sprouted Granola (Healthiest)
    const productAData = {
      productName: "Organic Sprouted Granola",
      servingSize: "45g",
      calories: "180",
      protein: "7",
      carbohydrates: "26",
      totalSugar: "4",
      addedSugar: "2",
      totalFat: "5",
      saturatedFat: "0.8",
      transFat: "0",
      sodium: "45",
      fiber: "6",
      ingredients: [
        "Sprouted Rolled Oats",
        "Flaxseed",
        "Almonds",
        "Chia Seeds",
        "Sea Salt",
      ],
    };

    const resA = await request(app)
      .post("/api/analyze/confirm")
      .send(productAData)
      .expect(200);

    assert.strictEqual(resA.body.success, true);
    const prodA = resA.body.data.product;
    const evalA = resA.body.data.scoreEvaluation;
    assert.strictEqual(prodA.name, "Organic Sprouted Granola");
    assert.strictEqual(prodA.is_scanned, true);
    assert.ok(typeof prodA.health_score === "number");
    assert.ok(
      prodA.health_score >= 80,
      `Granola should score >= 80, got ${prodA.health_score}`,
    );
    console.log(
      `   ✓ Product A Verified: "${prodA.name}" -> Score: ${prodA.health_score}/100`,
    );

    // Product B: Salted Potato Chips (Moderate)
    const productBData = {
      productName: "Classic Kettle Potato Chips",
      servingSize: "28g",
      calories: "150",
      protein: "2",
      carbohydrates: "15",
      totalSugar: "1",
      addedSugar: "0",
      totalFat: "9",
      saturatedFat: "2.5",
      transFat: "0",
      sodium: "180",
      fiber: "1",
      ingredients: ["Potatoes", "Sunflower Oil", "Sea Salt"],
    };

    const resB = await request(app)
      .post("/api/analyze/confirm")
      .send(productBData)
      .expect(200);

    assert.strictEqual(resB.body.success, true);
    const prodB = resB.body.data.product;
    const evalB = resB.body.data.scoreEvaluation;
    assert.strictEqual(prodB.name, "Classic Kettle Potato Chips");
    assert.strictEqual(prodB.is_scanned, true);
    assert.ok(typeof prodB.health_score === "number");
    assert.ok(
      prodB.health_score < prodA.health_score,
      `Chips (${prodB.health_score}) should score lower than Granola (${prodA.health_score})`,
    );
    console.log(
      `   ✓ Product B Verified: "${prodB.name}" -> Score: ${prodB.health_score}/100`,
    );

    // Product C: High-Sugar Cola Soda (Unhealthy)
    const productCData = {
      productName: "Mega Fizzy Cola",
      servingSize: "330ml",
      calories: "140",
      protein: "0",
      carbohydrates: "38",
      totalSugar: "35",
      addedSugar: "35",
      totalFat: "0",
      saturatedFat: "0",
      transFat: "0",
      sodium: "40",
      fiber: "0",
      ingredients: [
        "Carbonated Water",
        "High Fructose Corn Syrup",
        "Caramel Color",
        "Phosphoric Acid",
        "Caffeine",
      ],
    };

    const resC = await request(app)
      .post("/api/analyze/confirm")
      .send(productCData)
      .expect(200);

    assert.strictEqual(resC.body.success, true);
    const prodC = resC.body.data.product;
    const evalC = resC.body.data.scoreEvaluation;
    assert.strictEqual(prodC.name, "Mega Fizzy Cola");
    assert.strictEqual(prodC.is_scanned, true);
    assert.ok(typeof prodC.health_score === "number");
    assert.ok(
      prodC.health_score < prodB.health_score,
      `Cola (${prodC.health_score}) should score lower than Chips (${prodB.health_score})`,
    );
    console.log(
      `   ✓ Product C Verified: "${prodC.name}" -> Score: ${prodC.health_score}/100`,
    );

    // -------------------------------------------------------------------------
    // TEST 2: Multi-Product Comparison via POST /api/ranking
    // (Compares Product A, B, and C using unified RankingService)
    // -------------------------------------------------------------------------
    console.log(
      "\n2️⃣ Testing Offline Multi-Product Ranking (3 Scanned Products)...",
    );

    // Pass items in non-sorted order (B, C, A) to ensure RankingService sorts properly
    const rankingRes = await request(app)
      .post("/api/ranking")
      .send({ products: [prodB, prodC, prodA] })
      .expect(200);

    assert.strictEqual(rankingRes.body.success, true);
    const results = rankingRes.body.results;
    assert.strictEqual(results.length, 3, "Must rank exactly 3 products");

    // Rank 1: Product A (Granola)
    assert.strictEqual(results[0].rank, 1);
    assert.strictEqual(results[0].product.name, "Organic Sprouted Granola");
    assert.strictEqual(results[0].score, prodA.health_score);

    // Rank 2: Product B (Chips)
    assert.strictEqual(results[1].rank, 2);
    assert.strictEqual(results[1].product.name, "Classic Kettle Potato Chips");
    assert.strictEqual(results[1].score, prodB.health_score);

    // Rank 3: Product C (Cola)
    assert.strictEqual(results[2].rank, 3);
    assert.strictEqual(results[2].product.name, "Mega Fizzy Cola");
    assert.strictEqual(results[2].score, prodC.health_score);

    // Verify scores strictly descending
    assert.ok(results[0].score >= results[1].score, "Rank 1 >= Rank 2");
    assert.ok(results[1].score >= results[2].score, "Rank 2 >= Rank 3");

    console.log("   ✓ Multi-product comparison ranking verified:");
    console.log(
      `     🥇 Rank 1: ${results[0].product.name} — Score: ${results[0].score}/100`,
    );
    console.log(
      `     🥈 Rank 2: ${results[1].product.name} — Score: ${results[1].score}/100`,
    );
    console.log(
      `     🥉 Rank 3: ${results[2].product.name} — Score: ${results[2].score}/100`,
    );

    // -------------------------------------------------------------------------
    // TEST 3: Score Breakdown & Factor Explanations Preservation
    // -------------------------------------------------------------------------
    console.log(
      "\n3️⃣ Testing Score Breakdown & Factor Explanations in Comparison Results...",
    );

    for (const item of results) {
      assert.ok(
        item.breakdown,
        `Result for ${item.product.name} must include breakdown`,
      );
      assert.ok(item.breakdown.calories, "Must include calories breakdown");
      assert.ok(item.breakdown.sugar, "Must include sugar breakdown");
      assert.ok(typeof item.breakdown.sugar.score === "number");
      assert.ok(Array.isArray(item.positives), "Must include positives array");
      assert.ok(Array.isArray(item.negatives), "Must include negatives array");
      assert.ok(Array.isArray(item.warnings), "Must include warnings array");
    }

    // Granola should have whole grain / fiber positives
    assert.ok(
      results[0].positives.some(
        (p) =>
          p.toLowerCase().includes("whole grain") ||
          p.toLowerCase().includes("fiber"),
      ),
      "Granola must have whole grain or fiber positive",
    );

    // Cola should have high sugar negative
    assert.ok(
      results[2].negatives.some((n) => n.toLowerCase().includes("sugar")),
      "Cola must have high sugar negative",
    );

    console.log(
      "   ✓ All score breakdowns and factor explanations preserved through ranking.",
    );

    // -------------------------------------------------------------------------
    // TEST 4: Mixed Comparison (Offline Scanned Product + Online Catalog Product)
    // -------------------------------------------------------------------------
    console.log(
      "\n4️⃣ Testing Hybrid Comparison (Offline Scanned + Online Catalog)...",
    );

    // Catalog Product ID 2 is Potato Chips (around ~67)
    // Compare Product A (Granola ~88) with Catalog Product 2
    const hybridRes = await request(app)
      .post("/api/ranking")
      .send({ products: [prodA, 2] })
      .expect(200);

    assert.strictEqual(hybridRes.body.success, true);
    assert.strictEqual(hybridRes.body.results.length, 2);
    assert.strictEqual(hybridRes.body.results[0].rank, 1);
    assert.strictEqual(
      hybridRes.body.results[0].product.name,
      "Organic Sprouted Granola",
    );
    assert.strictEqual(hybridRes.body.results[1].rank, 2);
    console.log(
      `   ✓ Hybrid Comparison verified: Scanned "${prodA.name}" ranked seamlessly against Catalog product ID 2.`,
    );

    // -------------------------------------------------------------------------
    // TEST 5: Terminology Safety Assertions (Health Score, No "% healthy")
    // -------------------------------------------------------------------------
    console.log("\n5️⃣ Testing Terminology Safety Assertions...");

    const forbiddenPhrases = [
      "% healthy",
      "percent healthy",
      "% cure",
      "disease free",
      "100% healthy",
    ];

    const stringifiedPayload = JSON.stringify(rankingRes.body);
    for (const phrase of forbiddenPhrases) {
      assert.strictEqual(
        stringifiedPayload.toLowerCase().includes(phrase),
        false,
        `Response must not contain forbidden phrase "${phrase}"`,
      );
    }
    console.log(
      "   ✓ Safe terminology verified: 'NutriLens Health Score' used, no misleading percentage health claims.",
    );

    // -------------------------------------------------------------------------
    // TEST 6: Validation & Error Handling
    // -------------------------------------------------------------------------
    console.log("\n6️⃣ Testing Ranking Error Handling & Edge Cases...");

    // Empty products array
    const emptyRes = await request(app)
      .post("/api/ranking")
      .send({ products: [] })
      .expect(400);
    assert.strictEqual(emptyRes.body.success, false);

    // Missing body
    const missingRes = await request(app)
      .post("/api/ranking")
      .send({})
      .expect(400);
    assert.strictEqual(missingRes.body.success, false);

    console.log(
      "   ✓ Error handling verified for empty and invalid ranking requests.",
    );

    console.log(
      "\n🎉 ALL PHASE 9 OFFLINE MULTI-PRODUCT COMPARISON TESTS PASSED SUCCESSFULLY!\n",
    );
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Phase 9 test failed:", err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  }
}

runPhase9Tests();
