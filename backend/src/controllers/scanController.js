const scanService = require("../services/scanService");

const scanController = {
  /**
   * GET /api/scans/history
   * Retrieves scan history for the user.
   */
  async getScanHistory(req, res, next) {
    try {
      const userId = req.user ? req.user.id : req.query.userId || null;
      const limit = parseInt(req.query.limit, 10) || 50;
      const offset = parseInt(req.query.offset, 10) || 0;

      const scans = await scanService.getScanHistory({ userId, limit, offset });

      return res.status(200).json({
        success: true,
        data: scans,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/scans/:id
   * Retrieves single scan by ID with full nutrition, ingredients, score breakdown, and factor explanations.
   */
  async getScanById(req, res, next) {
    try {
      const scan = await scanService.getScanById(req.params.id);

      return res.status(200).json({
        success: true,
        data: scan,
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = scanController;
