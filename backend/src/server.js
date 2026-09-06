const app = require("./app");
const env = require("./config/env");
const db = require("./config/db");

async function startServer() {
  // Trigger initial database connection check
  await db.getPool();

  const server = app.listen(env.port, () => {
    console.log(`\n🥗 =======================================`);
    console.log(`   NutriLens API Server`);
    console.log(`   Environment: ${env.nodeEnv}`);
    console.log(`   Listening:   http://localhost:${env.port}`);
    console.log(`   Health API:  http://localhost:${env.port}/api/health`);
    console.log(`=======================================\n`);
  });

  return server;
}

if (require.main === module) {
  startServer().catch((err) => {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  });
}

module.exports = { startServer };
