const healthScoreService = require("../services/healthScoreService");

const healthScoreController = {
  /**
   * Evaluate health score from raw nutrition & ingredients payload
   * POST /api/score/evaluate
   */
  evaluateScore(req, res, next) {
    try {
      const { nutrition, ingredients, config } = req.body || {};

      let service = healthScoreService;
      if (config && typeof config === "object") {
        const {
          HealthScoreService,
        } = require("../services/healthScoreService");
        service = new HealthScoreService(config);
      }

      const evaluation = service.calculateHealthScore(
        nutrition || {},
        ingredients || [],
      );

      return res.status(200).json({
        success: true,
        data: evaluation,
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = healthScoreController;
