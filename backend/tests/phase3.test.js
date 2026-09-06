const assert = require("assert");
const request = require("supertest");
const app = require("../src/app");

async function runPhase3Tests() {
  console.log("🧪 Starting Phase 3 Auth & Health Profile Tests...\n");

  const testEmail = `user_${Date.now()}@nutrilens.com`;
  const testPassword = "securePassword123";
  let authToken = "";
  let userId = null;

  try {
    // 1. Validation Failures on Register
    console.log("1️⃣ Testing Register Validation Rules...");
    const badEmailRes = await request(app)
      .post("/api/auth/register")
      .send({ email: "not-an-email", password: testPassword })
      .expect(400);
    assert.strictEqual(badEmailRes.body.success, false);
    assert.ok(badEmailRes.body.error.message.includes("email"));

    const shortPassRes = await request(app)
      .post("/api/auth/register")
      .send({ email: testEmail, password: "123" })
      .expect(400);
    assert.strictEqual(shortPassRes.body.success, false);
    assert.ok(shortPassRes.body.error.message.includes("6 characters"));
    console.log("   ✓ Register input validation properly enforced");

    // 2. Successful Registration
    console.log("2️⃣ Testing Successful Registration...");
    const regRes = await request(app)
      .post("/api/auth/register")
      .send({
        email: testEmail,
        password: testPassword,
        fullName: "Priya Sharma",
      })
      .expect(201);

    assert.strictEqual(regRes.body.success, true);
    assert.ok(regRes.body.token, "Should return JWT token");
    assert.strictEqual(regRes.body.user.email, testEmail);
    assert.strictEqual(regRes.body.user.fullName, "Priya Sharma");
    assert.strictEqual(regRes.body.user.profileComplete, false);
    authToken = regRes.body.token;
    userId = regRes.body.user.id;
    console.log(`   ✓ User registered (ID: ${userId}, Token generated)`);

    // 3. Duplicate Registration (Conflict 409)
    console.log("3️⃣ Testing Duplicate Email Conflict (409)...");
    const dupRes = await request(app)
      .post("/api/auth/register")
      .send({ email: testEmail, password: testPassword })
      .expect(409);
    assert.strictEqual(dupRes.body.success, false);
    console.log("   ✓ Duplicate registration properly rejected with 409");

    // 4. Login Tests
    console.log("4️⃣ Testing Login Flow & Credentials...");
    const badLoginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: testEmail, password: "wrongpassword" })
      .expect(401);
    assert.strictEqual(badLoginRes.body.success, false);

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: testEmail, password: testPassword })
      .expect(200);
    assert.strictEqual(loginRes.body.success, true);
    assert.ok(loginRes.body.token);
    assert.strictEqual(loginRes.body.user.email, testEmail);
    console.log("   ✓ Login authentication verified");

    // 5. GET /api/auth/me
    console.log("5️⃣ Testing GET /api/auth/me...");
    // Without token -> 401
    await request(app).get("/api/auth/me").expect(401);

    // With token -> 200
    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200);
    assert.strictEqual(meRes.body.success, true);
    assert.strictEqual(meRes.body.user.email, testEmail);
    assert.strictEqual(meRes.body.user.profileComplete, false);
    console.log("   ✓ Token authenticated profile access verified");

    // 6. Health Profile Validation Rules
    console.log("6️⃣ Testing Health Profile Validation Rules...");
    // Invalid Age (130 > 120)
    await request(app)
      .put("/api/profile/health")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ age: 135 })
      .expect(400);

    // Invalid Age (0 < 1)
    await request(app)
      .put("/api/profile/health")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ age: 0 })
      .expect(400);

    // Negative Height
    await request(app)
      .put("/api/profile/health")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ height: -10 })
      .expect(400);

    // Invalid Gender
    await request(app)
      .put("/api/profile/health")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ gender: "Martian" })
      .expect(400);

    // Unsupported Health Condition
    await request(app)
      .put("/api/profile/health")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ healthConditions: ["Asthma", "Diabetes"] })
      .expect(400);
    console.log(
      "   ✓ Age, Height, Gender, and Conditions validations verified",
    );

    // 7. Save Health Profile with Unit Conversions (Onboarding / Update)
    console.log("7️⃣ Testing Save Health Profile & Unit Conversion...");
    // 5.8 ft height -> ~176.8 cm, 150 lb weight -> ~68.0 kg
    const saveHealthRes = await request(app)
      .put("/api/profile/health")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        fullName: "Priya S. Sharma",
        age: 28,
        gender: "Female",
        height: 5.8,
        heightUnit: "ft",
        weight: 150,
        weightUnit: "lb",
        healthConditions: ["Diabetes", "Thyroid"],
      })
      .expect(200);

    assert.strictEqual(saveHealthRes.body.success, true);
    assert.strictEqual(saveHealthRes.body.data.age, 28);
    assert.strictEqual(saveHealthRes.body.data.gender, "Female");
    assert.ok(
      Math.abs(saveHealthRes.body.data.heightCm - 176.8) < 0.5,
      `Height in cm (${saveHealthRes.body.data.heightCm}) should be ~176.8 cm`,
    );
    assert.ok(
      Math.abs(saveHealthRes.body.data.weightKg - 68.0) < 0.5,
      `Weight in kg (${saveHealthRes.body.data.weightKg}) should be ~68.0 kg`,
    );
    assert.deepStrictEqual(saveHealthRes.body.data.healthConditions, [
      "Diabetes",
      "Thyroid",
    ]);
    assert.ok(
      saveHealthRes.body.data.disclaimer.includes(
        "personalization only, not for medical diagnosis",
      ),
      "Should include medical disclaimer",
    );
    assert.strictEqual(
      saveHealthRes.body.user.profileComplete,
      true,
      "profileComplete should now be true",
    );
    console.log(
      `   ✓ Health profile saved: ${saveHealthRes.body.data.heightCm} cm, ${saveHealthRes.body.data.weightKg} kg, ${saveHealthRes.body.data.healthConditions.join(", ")}`,
    );
    console.log(
      `   ✓ Medical disclaimer included: "${saveHealthRes.body.data.disclaimer}"`,
    );

    // 8. Fetch Profile via GET /api/profile
    console.log("8️⃣ Testing GET /api/profile...");
    const profileRes = await request(app)
      .get("/api/profile")
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200);

    assert.strictEqual(profileRes.body.success, true);
    assert.strictEqual(profileRes.body.data.fullName, "Priya S. Sharma");
    assert.strictEqual(profileRes.body.data.profileComplete, true);
    assert.strictEqual(profileRes.body.data.healthProfile.age, 28);
    assert.strictEqual(profileRes.body.data.healthProfile.gender, "Female");
    console.log("   ✓ User and Health Profile retrieved cleanly");

    // 9. Update Profile: Name & Notification Preferences
    console.log("9️⃣ Testing PUT /api/profile (Notification Preferences)...");
    const notifUpdateRes = await request(app)
      .put("/api/profile")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ notificationPreferences: false })
      .expect(200);

    assert.strictEqual(notifUpdateRes.body.success, true);
    assert.strictEqual(notifUpdateRes.body.data.notificationPreferences, false);

    // Toggle back to true
    const notifOnRes = await request(app)
      .put("/api/profile")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ notificationPreferences: true })
      .expect(200);
    assert.strictEqual(notifOnRes.body.data.notificationPreferences, true);
    console.log("   ✓ Notification preferences toggle verified");

    // 10. Logout Endpoint
    console.log("🔟 Testing POST /api/auth/logout...");
    const logoutRes = await request(app).post("/api/auth/logout").expect(200);

    assert.strictEqual(logoutRes.body.success, true);
    assert.ok(logoutRes.body.message.includes("Logged out"));
    console.log("   ✓ Logout endpoint verified");

    console.log("\n🎉 ALL PHASE 3 AUTH & PROFILE TESTS PASSED SUCCESSFULLY!\n");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Phase 3 test failed:", err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  }
}

runPhase3Tests();
