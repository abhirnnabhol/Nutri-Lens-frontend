const rankingService = require("../services/rankingService");
const personalizationService = require("../services/personalizationService");
const profileService = require("../services/profileService");

const rankingController = {
  /**
   * POST /api/ranking
   * Body: { products?: Array, productIds?: Array, healthProfile?: Object, userId?: number, personalize?: boolean }
   */
  async getRanking(req, res, next) {
    try {
      const items = req.body.products || req.body.productIds;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          error: "products or productIds must be a non-empty array",
        });
      }

      // 1. Compute objective ranking & scores (Base score & ranking are 100% invariant)
      const { results } = await rankingService.rankProducts(items);

      // 2. Resolve optional health profile
      let healthProfile = req.body.healthProfile || null;
      const userId = req.user ? req.user.id : req.body.userId || null;

      if (!healthProfile && userId) {
        try {
          healthProfile = await profileService.getHealthProfile(userId);
        } catch (e) {
          // Non-blocking fallback
        }
      }

      // 3. Transparently attach Personalized Insights without altering base score or rank
      let enrichedResults = results;
      const shouldPersonalize =
        req.body.personalize !== false && Boolean(healthProfile);

      if (shouldPersonalize) {
        enrichedResults = personalizationService.enrichResultsWithInsights(
          results,
          healthProfile,
        );
      }

      return res.status(200).json({
        success: true,
        results: enrichedResults,
        personalized: shouldPersonalize,
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = rankingController;
