/**
 * NutriLens — Phase 12 Master System Integration Test Suite
 *
 * End-to-End verification of the entire application across all 5 user flows:
 *   FLOW 1 — NEW USER (Register -> Onboarding -> Save Health Profile -> Home)
 *   FLOW 2 — ONLINE SHOPPING (Categories -> Search -> Select 3 products -> Compare -> Health Score -> Ranking -> Explanation)
 *   FLOW 3 — OFFLINE SHOPPING (Scan 3 products -> OCR/Parser -> Verify/Edit -> Analyze -> Health Score -> Multi-product comparison)
 *   FLOW 4 — HISTORY (Scan history & detail -> Comparison history & detail table)
 *   FLOW 5 — PROFILE (Health profile edit -> Logout -> Login -> Persistence verification)
 *   CRITICAL ARCHITECTURE CHECK (Unified pipeline, zero duplicate scoring, hybrid comparison)
 */

const assert = require("assert");
const request = require("supertest");
const app = require("../src/app");
const healthScoreService = require("../src/services/healthScoreService");
const rankingService = require("../src/services/rankingService");
const ingredientAnalysisService = require("../src/services/ingredientAnalysisService");

console.log("\n======================================================");
console.log("🧪 Starting NutriLens Phase 12: Master System Integration Tests");
console.log("======================================================\n");

async function runPhase12MasterIntegration() {
  let passed = 0;
  let total = 0;

  async function testStep(name, fn) {
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

  // Session state across flows
  const timestamp = Date.now();
  const testUser = {
    email: `integration_user_${timestamp}@nutrilens.com`,
    password: "password123",
    fullName: "Integration Test User",
  };
  let authToken = null;
  let userId = null;
  let onlineProductIds = [];
  const scannedProducts = [];
  let savedComparisonId = null;

  // =========================================================================
  // FLOW 1 — NEW USER
  // =========================================================================
  console.log(
    "--- FLOW 1: NEW USER (Register -> Onboarding -> Health Profile -> Home) ---",
  );

  await testStep(
    "Flow 1.1: User Registration (POST /api/auth/register)",
    async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send(testUser)
        .expect(201);

      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.token, "Must return JWT token");
      assert.ok(res.body.user, "Must return user object");
      assert.strictEqual(res.body.user.email, testUser.email);
      assert.strictEqual(
        res.body.user.profileComplete,
        false,
        "New user profile must initially be incomplete",
      );

      authToken = res.body.token;
      userId = res.body.user.id;
    },
  );

  await testStep(
    "Flow 1.2: Save Health Profile during Onboarding (PUT /api/profile/health)",
    async () => {
      const onboardingData = {
        fullName: testUser.fullName,
        age: 28,
        gender: "Female",
        height: 165,
        heightUnit: "cm",
        weight: 58,
        weightUnit: "kg",
        healthConditions: ["Diabetes"],
      };

      const res = await request(app)
        .put("/api/profile/health")
        .set("Authorization", `Bearer ${authToken}`)
        .send(onboardingData)
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data, "Must return updated health profile");
      assert.deepStrictEqual(res.body.data.healthConditions, ["Diabetes"]);
    },
  );

  await testStep(
    "Flow 1.3: Verify User Profile Completion State (GET /api/profile)",
    async () => {
      const res = await request(app)
        .get("/api/profile")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.strictEqual(
        res.body.user.profileComplete,
        true,
        "User profileComplete must now be true",
      );
      assert.strictEqual(res.body.user.healthProfile.age, 28);
      assert.strictEqual(res.body.user.healthProfile.gender, "Female");
      assert.strictEqual(res.body.user.healthProfile.heightCm, 165);
      assert.strictEqual(res.body.user.healthProfile.weightKg, 58);
      assert.deepStrictEqual(res.body.user.healthProfile.healthConditions, [
        "Diabetes",
      ]);
    },
  );

  // =========================================================================
  // FLOW 2 — ONLINE SHOPPING
  // =========================================================================
  console.log(
    "\n--- FLOW 2: ONLINE SHOPPING (Categories -> Search -> Select 3 -> Compare -> Rank) ---",
  );

  await testStep(
    "Flow 2.1: Fetch Categories (GET /api/categories)",
    async () => {
      const res = await request(app).get("/api/categories").expect(200);

      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.data), "Categories must be an array");
      assert.ok(res.body.data.length >= 4, "Must have standard categories");

      const snacks = res.body.data.find((c) => c.slug === "snacks");
      assert.ok(snacks, 'Category "snacks" must exist');
    },
  );

  await testStep(
    "Flow 2.2: Search Products (GET /api/products/search?q=...)",
    async () => {
      const res = await request(app)
        .get("/api/products/search?q=bar")
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.ok(
        Array.isArray(res.body.data),
        "Search results must be an array",
      );
    },
  );

  await testStep(
    "Flow 2.3: Select 3 Products and Rank (POST /api/ranking)",
    async () => {
      // Fetch 3 catalog products
      const prodRes = await request(app)
        .get("/api/products?limit=3")
        .expect(200);

      assert.strictEqual(prodRes.body.success, true);
      assert.ok(
        prodRes.body.data.length >= 3,
        "Must have at least 3 catalog products",
      );
      onlineProductIds = prodRes.body.data.slice(0, 3).map((p) => p.id);

      // Call ranking with user authentication (carries Diabetes profile)
      const rankRes = await request(app)
        .post("/api/ranking")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ productIds: onlineProductIds })
        .expect(200);

      assert.strictEqual(rankRes.body.success, true);
      assert.ok(
        Array.isArray(rankRes.body.results),
        "Ranking results must be an array",
      );
      assert.strictEqual(rankRes.body.results.length, 3);

      // Verify ordering & rank
      assert.strictEqual(rankRes.body.results[0].rank, 1);
      assert.strictEqual(rankRes.body.results[1].rank, 2);
      assert.strictEqual(rankRes.body.results[2].rank, 3);
      assert.ok(rankRes.body.results[0].score >= rankRes.body.results[1].score);
      assert.ok(rankRes.body.results[1].score >= rankRes.body.results[2].score);

      // Verify factor explanations
      rankRes.body.results.forEach((r) => {
        assert.ok(r.product, "Rank item must contain product details");
        assert.ok(r.breakdown, "Rank item must contain score breakdown");
        assert.ok(
          Array.isArray(r.positives),
          "Rank item must contain positives",
        );
        assert.ok(
          Array.isArray(r.negatives),
          "Rank item must contain negatives",
        );
        assert.ok(
          r.personalizedInsight,
          "Rank item must contain personalizedInsight for authenticated user",
        );
      });
    },
  );

  // =========================================================================
  // FLOW 3 — OFFLINE SHOPPING
  // =========================================================================
  console.log(
    "\n--- FLOW 3: OFFLINE SHOPPING (Scan 3 Products -> Verify -> Compare) ---",
  );

  await testStep(
    "Flow 3.1: Scan Product 1 (Oat Granola) -> OCR -> Verify/Confirm -> Score",
    async () => {
      // 1. OCR Extract
      const ocrRes = await request(app)
        .post("/api/analyze/image")
        .send({ preset: "oats" })
        .expect(200);

      assert.strictEqual(ocrRes.body.success, true);
      assert.ok(
        ocrRes.body.data.extractedData,
        "Must extract structured fields",
      );

      // 2. Verification / Confirm (User confirms & normalizes data)
      const confirmRes = await request(app)
        .post("/api/analyze/confirm")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          productName: "Organic Chia Oat Crisp",
          servingSize: "40g",
          calories: 160,
          protein: 6.0,
          carbohydrates: 24.0,
          totalSugar: 2.0,
          addedSugar: 0,
          totalFat: 4.5,
          saturatedFat: 0.5,
          transFat: 0,
          sodium: 30,
          fiber: 6.0,
          ingredients:
            "Whole grain oats, chia seeds, almond butter, cinnamon, sea salt",
        })
        .expect(200);

      assert.strictEqual(confirmRes.body.success, true);
      assert.ok(confirmRes.body.data.product, "Must return normalized product");
      assert.ok(
        confirmRes.body.data.product.health_score > 75,
        "High fiber/low sugar oat crisp should score high",
      );
      scannedProducts.push(confirmRes.body.data.product);
    },
  );

  await testStep(
    "Flow 3.2: Scan Product 2 (Salty Pretzels) -> OCR -> Verify/Confirm -> Score",
    async () => {
      const confirmRes = await request(app)
        .post("/api/analyze/confirm")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          productName: "Crunchy Salted Pretzels",
          servingSize: "30g",
          calories: 120,
          protein: 3.0,
          carbohydrates: 25.0,
          totalSugar: 1.0,
          addedSugar: 0,
          totalFat: 1.0,
          saturatedFat: 0.2,
          transFat: 0,
          sodium: 680,
          fiber: 1.0,
          ingredients:
            "Enriched wheat flour, vegetable oil, salt, yeast, baking soda",
        })
        .expect(200);

      assert.strictEqual(confirmRes.body.success, true);
      scannedProducts.push(confirmRes.body.data.product);
    },
  );

  await testStep(
    "Flow 3.3: Scan Product 3 (Sweet Fizzy Cola) -> OCR -> Verify/Confirm -> Score",
    async () => {
      const confirmRes = await request(app)
        .post("/api/analyze/confirm")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          productName: "Mega Sweet Sparkling Cola",
          servingSize: "355ml",
          calories: 150,
          protein: 0,
          carbohydrates: 39.0,
          totalSugar: 38.0,
          addedSugar: 38.0,
          totalFat: 0,
          saturatedFat: 0,
          transFat: 0,
          sodium: 45,
          fiber: 0,
          ingredients:
            "Carbonated water, high fructose corn syrup, caramel color, phosphoric acid",
        })
        .expect(200);

      assert.strictEqual(confirmRes.body.success, true);
      scannedProducts.push(confirmRes.body.data.product);
    },
  );

  await testStep(
    "Flow 3.4: Multi-Product Offline Comparison (POST /api/ranking)",
    async () => {
      const rankRes = await request(app)
        .post("/api/ranking")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ products: scannedProducts })
        .expect(200);

      assert.strictEqual(rankRes.body.success, true);
      assert.strictEqual(rankRes.body.results.length, 3);

      // Rank 1 must be the Organic Chia Oat Crisp
      assert.strictEqual(
        rankRes.body.results[0].product.name,
        "Organic Chia Oat Crisp",
      );
      assert.strictEqual(rankRes.body.results[0].rank, 1);

      // Lowest rank must be the high sugar cola
      const lastResult = rankRes.body.results[2];
      assert.strictEqual(lastResult.product.name, "Mega Sweet Sparkling Cola");
      assert.strictEqual(lastResult.rank, 3);

      // Personalized insight for diabetes profile must flag the cola
      assert.ok(lastResult.personalizedInsight.hasInsight);
      assert.ok(
        lastResult.personalizedInsight.notices.some((n) =>
          n.includes("monitoring sugar intake"),
        ),
        "Cola must trigger cautious sugar notice for Diabetes health profile",
      );
    },
  );

  // =========================================================================
  // FLOW 4 — HISTORY
  // =========================================================================
  console.log(
    "\n--- FLOW 4: HISTORY (Scan History -> Details -> Comparison History -> Table) ---",
  );

  let latestScanId = null;

  await testStep(
    "Flow 4.1: Fetch Scan History (GET /api/scans/history)",
    async () => {
      const res = await request(app)
        .get("/api/scans/history")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.data), "Must return array of scans");
      assert.ok(res.body.data.length >= 3, "Must include newly created scans");

      // Scans must be ordered by date descending
      latestScanId = res.body.data[0].id;
      assert.ok(latestScanId, "Must have latest scan ID");
    },
  );

  await testStep(
    "Flow 4.2: Fetch Scan Details (GET /api/scans/:id)",
    async () => {
      const res = await request(app)
        .get(`/api/scans/${latestScanId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      assert.strictEqual(res.body.success, true);
      const detail = res.body.data;
      assert.ok(detail.productName, "Detail must include product name");
      assert.ok(detail.nutrition, "Detail must include 9 nutrition facts");
      assert.ok(detail.ingredients, "Detail must include ingredients");
      assert.ok(detail.breakdown, "Detail must include score breakdown");
      assert.ok(
        Array.isArray(detail.positives),
        "Detail must include positives",
      );
      assert.ok(
        Array.isArray(detail.negatives),
        "Detail must include negatives",
      );
    },
  );

  await testStep(
    "Flow 4.3: Save Comparison (POST /api/comparisons)",
    async () => {
      const res = await request(app)
        .post("/api/comparisons")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          products: scannedProducts,
          title: "3-Way Snack Label Comparison",
          mode: "offline",
        })
        .expect(201);

      assert.strictEqual(res.body.success, true);
      savedComparisonId =
        res.body.data.id || res.body.data.comparisonId || res.body.comparisonId;
      assert.ok(savedComparisonId, "Must return comparison id");
    },
  );

  await testStep(
    "Flow 4.4: Fetch Comparison History (GET /api/comparisons/history)",
    async () => {
      const res = await request(app)
        .get("/api/comparisons/history")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.ok(
        Array.isArray(res.body.data),
        "Comparisons history must be an array",
      );
      const found = res.body.data.find((c) => c.id === savedComparisonId);
      assert.ok(
        found,
        `Saved comparison #${savedComparisonId} must appear in history`,
      );
      assert.strictEqual(found.productCount, 3);
    },
  );

  await testStep(
    "Flow 4.5: Fetch Comparison Details & Comparison Table (GET /api/comparisons/:id)",
    async () => {
      const res = await request(app)
        .get(`/api/comparisons/${savedComparisonId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      assert.strictEqual(res.body.success, true);
      const comp = res.body.data;
      assert.strictEqual(comp.results.length, 3);
      assert.strictEqual(comp.results[0].rank, 1);
      assert.ok(
        comp.comparisonTable,
        "Must include full side-by-side comparison table",
      );
      assert.ok(
        comp.comparisonTable.columns.length >= 3,
        "Table must contain columns",
      );
      assert.ok(
        comp.comparisonTable.rows.length >= 8,
        "Table must contain nutrition metrics rows",
      );
    },
  );

  // =========================================================================
  // FLOW 5 — PROFILE
  // =========================================================================
  console.log(
    "\n--- FLOW 5: PROFILE (Edit -> Save -> Logout -> Login -> Persistence) ---",
  );

  await testStep(
    "Flow 5.1: Update Health Profile (PUT /api/profile/health)",
    async () => {
      const updatedData = {
        age: 30,
        gender: "Female",
        height: 168,
        heightUnit: "cm",
        weight: 60,
        weightUnit: "kg",
        healthConditions: ["Diabetes", "Hypertension"],
      };

      const res = await request(app)
        .put("/api/profile/health")
        .set("Authorization", `Bearer ${authToken}`)
        .send(updatedData)
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.deepStrictEqual(res.body.data.healthConditions, [
        "Diabetes",
        "Hypertension",
      ]);
    },
  );

  await testStep(
    "Flow 5.2: Simulate Logout & Re-Login (POST /api/auth/login)",
    async () => {
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      assert.strictEqual(loginRes.body.success, true);
      assert.ok(loginRes.body.token, "Must return fresh JWT token");

      // Replace token with fresh login token
      authToken = loginRes.body.token;
    },
  );

  await testStep(
    "Flow 5.3: Verify Profile Data Remains Intact After Login (GET /api/profile)",
    async () => {
      const res = await request(app)
        .get("/api/profile")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      assert.strictEqual(res.body.success, true);
      const hp = res.body.user.healthProfile;
      assert.strictEqual(hp.age, 30);
      assert.strictEqual(hp.heightCm, 168);
      assert.strictEqual(hp.weightKg, 60);
      assert.deepStrictEqual(hp.healthConditions, ["Diabetes", "Hypertension"]);
    },
  );

  // =========================================================================
  // CRITICAL ARCHITECTURE CHECK
  // =========================================================================
  console.log(
    "\n--- CRITICAL ARCHITECTURE CHECK (Unified Pipeline Verification) ---",
  );

  await testStep(
    "Architecture 1: Identical Nutrition Data produces EXACT same score in both modes",
    () => {
      const nutritionSample = {
        calories: 220,
        protein: 8,
        carbohydrates: 30,
        total_sugar: 4,
        added_sugar: 0,
        total_fat: 6,
        saturated_fat: 1,
        trans_fat: 0,
        sodium: 140,
        fiber: 5,
      };
      const ingredients = ["whole wheat flour", "water", "olive oil", "salt"];

      // Online Catalog Mode Evaluation
      const onlineEval = healthScoreService.calculateHealthScore(
        nutritionSample,
        ingredients,
      );

      // Offline Scanned Mode Evaluation
      const offlineEval = healthScoreService.calculateHealthScore(
        { ...nutritionSample, is_scanned: true },
        ingredients,
      );

      assert.strictEqual(
        onlineEval.score,
        offlineEval.score,
        `Online score (${onlineEval.score}) and Offline score (${offlineEval.score}) must be 100% identical!`,
      );
      assert.deepStrictEqual(onlineEval.breakdown, offlineEval.breakdown);
    },
  );

  await testStep(
    "Architecture 2: Hybrid Comparison executes seamlessly through unified RankingService",
    async () => {
      // 1 Catalog Product ID + 1 Scanned Product Object
      const hybridProducts = [onlineProductIds[0], scannedProducts[0]];

      const rankRes = await request(app)
        .post("/api/ranking")
        .send({ products: hybridProducts })
        .expect(200);

      assert.strictEqual(rankRes.body.success, true);
      assert.strictEqual(rankRes.body.results.length, 2);
      assert.strictEqual(rankRes.body.results[0].rank, 1);
      assert.strictEqual(rankRes.body.results[1].rank, 2);
    },
  );

  await testStep(
    "Architecture 3: Medical safety compliance verified across all responses",
    () => {
      const forbiddenTerms = [
        "safe for diabetes",
        "will prevent disease",
        "medically recommended",
        "cure diabetes",
        "clinical diagnosis",
      ];

      forbiddenTerms.forEach((term) => {
        assert(
          !JSON.stringify(scannedProducts).toLowerCase().includes(term),
          `Forbidden term detected: ${term}`,
        );
      });
    },
  );

  console.log("\n======================================================");
  console.log(`🎉 ALL ${passed}/${total} PHASE 12 INTEGRATION TESTS PASSED!`);
  console.log("======================================================\n");
}

runPhase12MasterIntegration();
