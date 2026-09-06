const healthService = require("../services/healthService");

const healthController = {
  async checkHealth(_req, res, next) {
    try {
      const health = await healthService.getHealthStatus();
      res.status(200).json(health);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = healthController;
