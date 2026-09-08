const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
const env = require("./env");

let pool = null;
let isFallback = false;

// Standard PostgreSQL pool using DATABASE_URL
const isRemoteDb =
  env.databaseUrl &&
  !env.databaseUrl.includes("localhost") &&
  !env.databaseUrl.includes("127.0.0.1");

const pgPool = new Pool({
  connectionString: env.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ...(isRemoteDb || env.nodeEnv === "production"
    ? { ssl: { rejectUnauthorized: false } }
    : {}),
});

pgPool.on("error", (_err) => {
  // Suppress uncaught idle client error if falling back
});

function findSqlFile(filename, subfolder = "migrations") {
  const candidates = [
    path.resolve(__dirname, `../../database/${subfolder}/${filename}`),
    path.resolve(__dirname, `../../../database/${subfolder}/${filename}`),
  ];
  return candidates.find((p) => fs.existsSync(p)) || null;
}

async function runMigrationsAndSeeds(clientOrPool) {
  const schemaPath = findSqlFile("001_phase2_schema.sql", "migrations");
  if (schemaPath) {
    const schemaSql = fs.readFileSync(schemaPath, "utf8");
    await clientOrPool.query(schemaSql);
    try {
      await clientOrPool.query(`
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
    } catch (colErr) {
      // Ignore if columns exist or engine does not need ALTER
    }
  }

  const seedPath = findSqlFile("002_demo_seed.sql", "seed");
  if (seedPath) {
    const seedSql = fs.readFileSync(seedPath, "utf8");
    await clientOrPool.query(seedSql);
  }
}

async function initPool() {
  if (pool) return pool;

  try {
    const client = await pgPool.connect();
    console.log(
      `📦 [PostgreSQL] Connected successfully to ${env.databaseUrl.replace(/:[^:@]+@/, ":****@")}`,
    );
    await runMigrationsAndSeeds(client);
    client.release();
    pool = pgPool;
    isFallback = false;
    console.log(
      "✅ [PostgreSQL] Schema migrations and demo seed data verified in PostgreSQL.",
    );
    return pool;
  } catch (err) {
    console.warn(
      `⚠️ [PostgreSQL] Live connection failed (${err.message}). Initializing fallback in-memory PostgreSQL engine for development.`,
    );
    try {
      const { newDb } = require("pg-mem");
      const memDb = newDb();

      // Register standard Postgres functions
      memDb.public.registerFunction({
        name: "now",
        implementation: () => new Date(),
      });

      // Load Phase 2 schema migrations
      const schemaPath = findSqlFile("001_phase2_schema.sql", "migrations");
      if (schemaPath) {
        memDb.public.none(fs.readFileSync(schemaPath, "utf8"));
      }

      // Load demo seed data
      const seedPath = findSqlFile("002_demo_seed.sql", "seed");
      if (seedPath) {
        memDb.public.none(fs.readFileSync(seedPath, "utf8"));
      }

      const adapter = memDb.adapters.createPg();
      pool = new adapter.Pool();
      isFallback = true;
      console.log(
        "⚡ [PostgreSQL] In-memory database initialized with 6 categories, 6 demo products, and nutrition facts.",
      );
      return pool;
    } catch (memErr) {
      console.error("Failed to initialize in-memory fallback:", memErr);
      pool = pgPool;
      return pool;
    }
  }
}

const poolPromise = initPool();

async function getPool() {
  if (pool) return pool;
  return poolPromise;
}

module.exports = {
  query: async (text, params) => {
    const activePool = await getPool();
    return activePool.query(text, params);
  },
  getClient: async () => {
    const activePool = await getPool();
    return activePool.connect();
  },
  checkConnection: async () => {
    try {
      const activePool = await getPool();
      const res = await activePool.query("SELECT NOW() as server_time");
      const countRes = await activePool.query(
        "SELECT count(*) as total_products FROM products",
      );
      return {
        connected: true,
        mode: isFallback ? "in-memory-fallback" : "postgresql",
        serverTime: res.rows[0].server_time,
        totalProducts: parseInt(countRes.rows[0].total_products, 10),
      };
    } catch (err) {
      return {
        connected: false,
        mode: "disconnected",
        error: err.message,
      };
    }
  },
  get isFallback() {
    return isFallback;
  },
  getPool,
  initPool,
};
