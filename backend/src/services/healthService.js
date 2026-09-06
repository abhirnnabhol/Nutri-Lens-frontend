const db = require("../config/db");

const healthService = {
  async getHealthStatus() {
    const startTime = Date.now();
    const dbStatus = await db.checkConnection();
    const latency = Date.now() - startTime;

    return {
      status: dbStatus.connected ? "healthy" : "degraded",
      service: "NutriLens API",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      latencyMs: latency,
      database: {
        connected: dbStatus.connected,
        mode: dbStatus.mode,
        serverTime: dbStatus.serverTime || null,
        totalProducts: dbStatus.totalProducts || 0,
        error: dbStatus.error || null,
      },
    };
  },
};

module.exports = healthService;
