const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
const env = require("../config/env");

async function runSeed() {
  console.log("🌱 Starting demo data seeding...");
  console.log(`📡 Target: ${env.databaseUrl.replace(/:[^:@]+@/, ":****@")}`);

  const isRemoteDb =
    env.databaseUrl &&
    !env.databaseUrl.includes("localhost") &&
    !env.databaseUrl.includes("127.0.0.1");

  const pool = new Pool({
    connectionString: env.databaseUrl,
    connectionTimeoutMillis: 15000,
    ...(isRemoteDb || env.nodeEnv === "production"
      ? { ssl: { rejectUnauthorized: false } }
      : {}),
  });

  const client = await pool.connect();
  try {
    console.log("✅ Connected to PostgreSQL database.");

    // Locate seed file
    const candidatePaths = [
      path.resolve(__dirname, "../../database/seed/002_demo_seed.sql"),
      path.resolve(__dirname, "../../../database/seed/002_demo_seed.sql"),
    ];
    const seedPath = candidatePaths.find((p) => fs.existsSync(p));

    if (!seedPath) {
      throw new Error("Could not find 002_demo_seed.sql");
    }

    console.log(`📄 Applying seed data from: ${seedPath}`);
    const seedSql = fs.readFileSync(seedPath, "utf8");
    await client.query(seedSql);

    const countRes = await client.query(
      "SELECT COUNT(*) AS count FROM products",
    );
    console.log(
      `🎉 Demo data seeded successfully! Total products: ${countRes.rows[0].count}`,
    );
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  runSeed();
}

module.exports = { runSeed };
