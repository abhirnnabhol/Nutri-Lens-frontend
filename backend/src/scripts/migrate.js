const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
const env = require("../config/env");

async function runMigration() {
  console.log("🚀 Starting database migration...");
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

    // Locate schema file (supports backend/database or root database/)
    const candidatePaths = [
      path.resolve(
        __dirname,
        "../../database/migrations/001_phase2_schema.sql",
      ),
      path.resolve(
        __dirname,
        "../../../database/migrations/001_phase2_schema.sql",
      ),
    ];
    const schemaPath = candidatePaths.find((p) => fs.existsSync(p));

    if (!schemaPath) {
      throw new Error("Could not find 001_phase2_schema.sql");
    }

    console.log(`📄 Applying schema from: ${schemaPath}`);
    const schemaSql = fs.readFileSync(schemaPath, "utf8");
    await client.query(schemaSql);

    // Apply incremental schema alterations
    await client.query(`
      ALTER TABLE scans ADD COLUMN IF NOT EXISTS product_name VARCHAR(255);
      ALTER TABLE scans ADD COLUMN IF NOT EXISTS score NUMERIC(5,2);
      ALTER TABLE scans ADD COLUMN IF NOT EXISTS mode VARCHAR(20) DEFAULT 'offline';
      ALTER TABLE scans ADD COLUMN IF NOT EXISTS image_url TEXT;
      ALTER TABLE scans ADD COLUMN IF NOT EXISTS product_data JSONB;

      ALTER TABLE comparisons ADD COLUMN IF NOT EXISTS mode VARCHAR(20) DEFAULT 'offline';

      ALTER TABLE comparison_products ADD COLUMN IF NOT EXISTS product_name VARCHAR(255);
      ALTER TABLE comparison_products ADD COLUMN IF NOT EXISTS score NUMERIC(5,2);
      ALTER TABLE comparison_products ADD COLUMN IF NOT EXISTS rank INTEGER;
      ALTER TABLE comparison_products ADD COLUMN IF NOT EXISTS mode VARCHAR(20) DEFAULT 'offline';
      ALTER TABLE comparison_products ADD COLUMN IF NOT EXISTS product_data JSONB;
    `);

    console.log("🎉 Database schema migration completed successfully!");
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
