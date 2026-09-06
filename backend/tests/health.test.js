const assert = require("assert");
const request = require("supertest");
const app = require("../src/app");

async function runHealthTest() {
  console.log("🧪 Running Backend Health Endpoint Test...");

  try {
    const res = await request(app)
      .get("/api/health")
      .expect("Content-Type", /json/)
      .expect(200);

    console.log("📥 Response received:", JSON.stringify(res.body, null, 2));

    assert.ok(res.body.status, "Response should contain status");
    assert.strictEqual(
      res.body.service,
      "NutriLens API",
      "Service name should match",
    );
    assert.ok(res.body.timestamp, "Response should contain timestamp");
    assert.ok(typeof res.body.uptime === "number", "Uptime should be a number");
    assert.ok(res.body.database, "Response should contain database status");

    console.log(
      "\n✅ PASS: Backend health endpoint is functioning correctly!\n",
    );
    process.exit(0);
  } catch (err) {
    console.error("\n❌ FAIL: Health endpoint test failed:", err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  }
}

runHealthTest();
