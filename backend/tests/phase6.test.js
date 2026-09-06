const assert = require("assert");
const request = require("supertest");
const app = require("../src/app");
const rankingService = require("../src/services/rankingService");
const comparisonService = require("../src/services/comparisonService");

async function runPhase6Tests() {
  console.log("🧪 Starting Phase 6 Product Comparison and Ranking Tests...\n");

  try {
    // -------------------------------------------------------------------------
    // TEST 1: RankingService Direct Unit Tests
    // -------------------------------------------------------------------------
    console.log(
      "1️⃣ Testing RankingService with 3 benchmark products [1, 2, 3]...",
    );
    const rankingResult = await rankingService.rankProducts([1, 2, 3]);

    assert.ok(
      rankingResult.results,
      "Ranking response must have results array",
    );
    assert.strictEqual(
      rankingResult.results.length,
      3,
      "Expected 3 ranked products",
    );

    // Verify descending order
    for (let i = 0; i < rankingResult.results.length - 1; i++) {
      const current = rankingResult.results[i];
      const next = rankingResult.results[i + 1];
      assert.ok(
        current.score >= next.score,
        `Scores must be descending: Rank ${current.rank} (${current.score}) >= Rank ${next.rank} (${next.score})`,
      );
      assert.strictEqual(current.rank, i + 1, `Rank should be ${i + 1}`);
    }

    const rank1 = rankingResult.results[0];
    assert.strictEqual(rank1.rank, 1, "First item must be Rank 1");
    assert.ok(
      rank1.score >= 0 && rank1.score <= 100,
      "Score must be clamped 0-100",
    );
    assert.ok(rank1.product, "Product details must be attached");
    assert.ok(Array.isArray(rank1.positives), "Positives must be an array");
    assert.ok(Array.isArray(rank1.negatives), "Negatives must be an array");
    assert.ok(Array.isArray(rank1.warnings), "Warnings must be an array");
    assert.ok(rank1.breakdown, "Breakdown must be present");

    console.log(
      `   ✓ Top ranked: Rank 1 -> "${rank1.product.name}" with NutriLens Health Score ${rank1.score}/100`,
    );
    for (const r of rankingResult.results) {
      console.log(
        `     #${r.rank} Product ID ${r.productId} ("${r.product.name}") -> ${r.score}/100`,
      );
    }

    // -------------------------------------------------------------------------
    // TEST 2: Validation of RankingService Inputs
    // -------------------------------------------------------------------------
    console.log("2️⃣ Testing RankingService input validation...");
    try {
      await rankingService.rankProducts([]);
      assert.fail("Should have thrown error for empty product array");
    } catch (err) {
      assert.strictEqual(err.statusCode, 400);
      console.log("   ✓ Empty productIds rejected with 400");
    }

    try {
      await rankingService.rankProducts([99999]);
      assert.fail("Should have thrown error for non-existent product ID");
    } catch (err) {
      assert.strictEqual(err.statusCode, 404);
      console.log("   ✓ Non-existent product ID rejected with 404");
    }

    // -------------------------------------------------------------------------
    // TEST 3: REST API Endpoint - POST /api/ranking
    // -------------------------------------------------------------------------
    console.log("3️⃣ Testing REST API: POST /api/ranking...");
    const apiRankRes = await request(app)
      .post("/api/ranking")
      .send({ productIds: [1, 2, 3] })
      .expect(200);

    assert.strictEqual(apiRankRes.body.success, true);
    assert.ok(Array.isArray(apiRankRes.body.results));
    assert.strictEqual(apiRankRes.body.results.length, 3);

    const apiFirst = apiRankRes.body.results[0];
    assert.strictEqual(apiFirst.rank, 1);
    assert.strictEqual(typeof apiFirst.score, "number");
    assert.ok(apiFirst.positives !== undefined);
    assert.ok(apiFirst.negatives !== undefined);
    console.log(
      `   ✓ POST /api/ranking returned HTTP 200 with ${apiRankRes.body.results.length} ranked products`,
    );

    // Bad request validation
    const badRankRes = await request(app)
      .post("/api/ranking")
      .send({ productIds: [] })
      .expect(400);
    assert.strictEqual(badRankRes.body.success, false);
    console.log(
      "   ✓ POST /api/ranking with empty list properly returned HTTP 400",
    );

    // -------------------------------------------------------------------------
    // TEST 4: Comparison Persistence - POST /api/comparisons
    // -------------------------------------------------------------------------
    console.log("4️⃣ Testing Comparison Persistence: POST /api/comparisons...");
    const createCompRes = await request(app)
      .post("/api/comparisons")
      .send({
        productIds: [1, 2],
        title: "Snacks Benchmark Comparison",
      })
      .expect(201);

    assert.strictEqual(createCompRes.body.success, true);
    assert.ok(
      createCompRes.body.data.comparisonId,
      "Should return generated comparisonId",
    );
    assert.strictEqual(
      createCompRes.body.data.title,
      "Snacks Benchmark Comparison",
    );
    assert.strictEqual(createCompRes.body.data.results.length, 2);
    const savedId = createCompRes.body.data.comparisonId;
    console.log(`   ✓ Comparison created and persisted with ID #${savedId}`);

    // Validation: less than 2 products
    await request(app)
      .post("/api/comparisons")
      .send({ productIds: [1] })
      .expect(400);
    console.log(
      "   ✓ POST /api/comparisons properly rejected < 2 products with 400",
    );

    // -------------------------------------------------------------------------
    // TEST 5: Comparison Retrieval - GET /api/comparisons/:id
    // -------------------------------------------------------------------------
    console.log(
      `5️⃣ Testing Comparison Retrieval: GET /api/comparisons/${savedId}...`,
    );
    const getCompRes = await request(app)
      .get(`/api/comparisons/${savedId}`)
      .expect(200);

    assert.strictEqual(getCompRes.body.success, true);
    assert.strictEqual(getCompRes.body.data.comparisonId, savedId);
    assert.strictEqual(getCompRes.body.data.results.length, 2);
    assert.strictEqual(getCompRes.body.data.results[0].rank, 1);
    assert.strictEqual(getCompRes.body.data.results[1].rank, 2);
    console.log(
      `   ✓ Retrieved persisted comparison #${savedId} with ranked results`,
    );

    // 404 for non-existent comparison
    await request(app).get("/api/comparisons/99999").expect(404);
    console.log("   ✓ GET /api/comparisons/99999 properly returned 404");

    // -------------------------------------------------------------------------
    // TEST 6: Explanations Verification ("Why it scored well" & "Areas of concern")
    // -------------------------------------------------------------------------
    console.log("6️⃣ Testing Factor Explanations Content...");
    const rankResults = apiRankRes.body.results;
    for (const r of rankResults) {
      assert.ok(Array.isArray(r.positives), "positives must be array");
      assert.ok(Array.isArray(r.negatives), "negatives must be array");
      // Prohibited terminology check
      const payloadString = JSON.stringify(r).toLowerCase();
      const forbiddenPhrases = [
        "percentage healthy",
        "medically safe",
        "disease preventing",
        "medically recommended",
      ];
      for (const phrase of forbiddenPhrases) {
        assert.ok(
          !payloadString.includes(phrase),
          `Found forbidden phrase: "${phrase}"`,
        );
      }
    }
    console.log(
      "   ✓ Explanations contain objective nutritional factors without AI hallucinations",
    );

    // -------------------------------------------------------------------------
    // TEST 7: Tie Breaking Behavior
    // -------------------------------------------------------------------------
    console.log("7️⃣ Testing Deterministic Tie-Breaking...");
    const mockService = {
      calculateHealthScore: (prod) => ({
        score: 70, // identical score
        breakdown: {},
        positives: ["Standard baseline"],
        negatives: [],
        warnings: [],
        dataCompleteness: 100,
        analysisVersion: "1.0",
      }),
    };

    const { RankingService } = require("../src/services/rankingService");
    const tiedRankingService = new RankingService(mockService);

    // Product with 5g sugar vs Product with 15g sugar
    const tiedProducts = [
      {
        id: 101,
        name: "High Sugar Tied",
        total_sugar: 15,
        fiber: 2,
        ingredients: [],
      },
      {
        id: 102,
        name: "Low Sugar Tied",
        total_sugar: 5,
        fiber: 2,
        ingredients: [],
      },
    ];

    const tiedResult = await tiedRankingService.rankProducts(tiedProducts);
    assert.strictEqual(
      tiedResult.results[0].productId,
      102,
      "Lower sugar product should win tie-break",
    );
    assert.strictEqual(tiedResult.results[0].rank, 1);
    assert.strictEqual(tiedResult.results[1].productId, 101);
    assert.strictEqual(tiedResult.results[1].rank, 2);
    console.log(
      "   ✓ Tie-break resolved objectively: lower sugar product awarded Rank 1",
    );

    console.log(
      "\n🎉 ALL PHASE 6 COMPARISON & RANKING TESTS PASSED SUCCESSFULLY!\n",
    );
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Phase 6 test failed:", err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  }
}

runPhase6Tests();
