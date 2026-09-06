/**
 * PersonalizationService
 *
 * Implements optional, cautious personalization using the user's saved health profile.
 *
 * CRITICAL SAFETY & COMPLIANCE REQUIREMENTS:
 * 1. This is NOT a medical diagnosis system.
 * 2. Strictly DO NOT claim:
 *    - "This food is safe for diabetes"
 *    - "This food will prevent disease"
 *    - "This product is medically recommended"
 * 3. Base NutriLens Health Score and core product ranking MUST NOT be modified.
 * 4. Generates an additional "Personalized Insights" section providing cautious,
 *    transparent informational notices comparing selected products.
 */

const MEDICAL_DISCLAIMER =
  "Non-medical informational notice only. This is not medical advice or diagnosis. The NutriLens Health Score and rankings are objective nutritional benchmarks. Personalized insights provide optional, cautious informational context based on saved preferences. Consult a qualified healthcare professional for personalized dietary guidance.";

class PersonalizationService {
  /**
   * Normalizes condition strings for matching.
   */
  normalizeCondition(cond = "") {
    return String(cond).trim().toLowerCase();
  }

  /**
   * Checks if user health conditions match a target category.
   */
  hasConditionCategory(conditions = [], keywords = []) {
    if (!Array.isArray(conditions) || conditions.length === 0) return false;
    return conditions.some((c) => {
      const normalized = this.normalizeCondition(c);
      if (normalized === "none") return false;
      return keywords.some((kw) => normalized.includes(kw.toLowerCase()));
    });
  }

  /**
   * Generates cautious personalized insights for an array of ranked comparison results.
   *
   * @param {Array} results - Array of ranked product evaluation objects
   * @param {Object} healthProfile - User's health profile
   * @returns {Array} Results array with `personalizedInsight` attached to each item
   */
  enrichResultsWithInsights(results = [], healthProfile = null) {
    if (!Array.isArray(results) || results.length === 0) {
      return results;
    }

    if (!healthProfile) {
      return results.map((item) => ({
        ...item,
        personalizedInsight: null,
      }));
    }

    const conditions = [
      ...(Array.isArray(healthProfile?.conditions)
        ? healthProfile.conditions
        : []),
      ...(Array.isArray(healthProfile?.healthConditions)
        ? healthProfile.healthConditions
        : []),
      ...(Array.isArray(healthProfile?.health_conditions)
        ? healthProfile.health_conditions
        : []),
      ...(Array.isArray(healthProfile?.healthProfile?.healthConditions)
        ? healthProfile.healthProfile.healthConditions
        : []),
      ...(Array.isArray(healthProfile?.allergies)
        ? healthProfile.allergies
        : []),
      ...(Array.isArray(healthProfile?.dietary_preferences)
        ? healthProfile.dietary_preferences
        : []),
      ...(Array.isArray(healthProfile?.dietaryPreferences)
        ? healthProfile.dietaryPreferences
        : []),
    ];

    const activeConditions = Array.from(
      new Set(
        conditions
          .map((c) => String(c).trim())
          .filter((c) => c && c.toLowerCase() !== "none"),
      ),
    );

    // If no active conditions, return results with empty/default personalization
    if (activeConditions.length === 0) {
      return results.map((item) => ({
        ...item,
        personalizedInsight: {
          hasInsight: false,
          title: "Personalized Insights",
          notices: [],
          recommendations: [],
          profileFactors: [],
          transparentReason:
            "No specific health profile conditions configured.",
          disclaimer: MEDICAL_DISCLAIMER,
        },
      }));
    }

    // Determine comparative statistics across the compared group
    const sugars = results
      .map((r) =>
        r.product?.total_sugar !== undefined && r.product?.total_sugar !== null
          ? Number(r.product.total_sugar)
          : null,
      )
      .filter((v) => v !== null && !isNaN(v));

    const sodiums = results
      .map((r) =>
        r.product?.sodium !== undefined && r.product?.sodium !== null
          ? Number(r.product.sodium)
          : null,
      )
      .filter((v) => v !== null && !isNaN(v));

    const satFats = results
      .map((r) =>
        r.product?.saturated_fat !== undefined &&
        r.product?.saturated_fat !== null
          ? Number(r.product.saturated_fat)
          : null,
      )
      .filter((v) => v !== null && !isNaN(v));

    const minSugar = sugars.length > 0 ? Math.min(...sugars) : 0;
    const avgSugar =
      sugars.length > 0 ? sugars.reduce((a, b) => a + b, 0) / sugars.length : 0;
    const hasMultipleSugarOptions =
      sugars.length > 1 && Math.max(...sugars) > minSugar;

    const minSodium = sodiums.length > 0 ? Math.min(...sodiums) : 0;
    const avgSodium =
      sodiums.length > 0
        ? sodiums.reduce((a, b) => a + b, 0) / sodiums.length
        : 0;
    const hasMultipleSodiumOptions =
      sodiums.length > 1 && Math.max(...sodiums) > minSodium;

    const minSatFat = satFats.length > 0 ? Math.min(...satFats) : 0;
    const avgSatFat =
      satFats.length > 0
        ? satFats.reduce((a, b) => a + b, 0) / satFats.length
        : 0;
    const hasMultipleSatFatOptions =
      satFats.length > 1 && Math.max(...satFats) > minSatFat;

    // Condition flags
    const isMonitoringSugar = this.hasConditionCategory(activeConditions, [
      "diabetes",
      "sugar",
      "prediabetes",
      "glucose",
      "insulin",
    ]);

    const isMonitoringSodium = this.hasConditionCategory(activeConditions, [
      "hypertension",
      "blood pressure",
      "sodium",
      "salt",
    ]);

    const isMonitoringSatFat = this.hasConditionCategory(activeConditions, [
      "cholesterol",
      "heart",
      "cardiac",
      "lipid",
      "saturated fat",
    ]);

    const isThyroidConscious = this.hasConditionCategory(activeConditions, [
      "thyroid",
      "goiter",
    ]);

    // Generate insights for each product without touching score or rank
    return results.map((item) => {
      const prod = item.product || {};
      const prodSugar =
        prod.total_sugar !== undefined && prod.total_sugar !== null
          ? Number(prod.total_sugar)
          : null;
      const prodSodium =
        prod.sodium !== undefined && prod.sodium !== null
          ? Number(prod.sodium)
          : null;
      const prodSatFat =
        prod.saturated_fat !== undefined && prod.saturated_fat !== null
          ? Number(prod.saturated_fat)
          : null;

      const notices = [];
      const recommendations = [];
      const profileFactors = [];

      // 1. Sugar Monitoring Context (e.g. Diabetes)
      if (isMonitoringSugar && prodSugar !== null) {
        profileFactors.push("Monitoring sugar intake (from Health Profile)");

        if (hasMultipleSugarOptions && prodSugar > avgSugar) {
          // Exact required prompt example:
          notices.push(
            "Your profile indicates that you are monitoring sugar intake. This product contains relatively high sugar compared with the selected products.",
          );
          // Exact required recommendation example:
          recommendations.push(
            "Lower sugar options may better align with your selected preferences.",
          );
        } else if (
          hasMultipleSugarOptions &&
          prodSugar === minSugar &&
          prodSugar <= 5
        ) {
          notices.push(
            "Your profile indicates that you are monitoring sugar intake. This product has the lowest sugar content compared with the selected products.",
          );
          recommendations.push(
            "This lower sugar option may better align with your selected preferences.",
          );
        } else if (prodSugar >= 15) {
          notices.push(
            `Your profile indicates that you are monitoring sugar intake. This product contains relatively high sugar content (${prodSugar}g per serving).`,
          );
          recommendations.push(
            "Lower sugar options may better align with your selected preferences.",
          );
        } else if (prodSugar <= 3) {
          notices.push(
            "This product is low in total sugar, which aligns with your sugar monitoring preferences.",
          );
        }
      }

      // 2. Sodium Monitoring Context (e.g. Hypertension)
      if (isMonitoringSodium && prodSodium !== null) {
        profileFactors.push("Monitoring sodium intake (from Health Profile)");

        if (
          hasMultipleSodiumOptions &&
          (prodSodium > avgSodium || prodSodium >= 300)
        ) {
          // Exact required prompt example:
          notices.push(
            "This product has relatively high sodium compared with the selected products.",
          );
          recommendations.push(
            "Lower sodium options among the selected products may better align with your preferences.",
          );
        } else if (
          hasMultipleSodiumOptions &&
          prodSodium === minSodium &&
          prodSodium <= 120
        ) {
          notices.push(
            "This product provides a lower sodium option compared with the selected products.",
          );
          recommendations.push(
            "Lower sodium options may better align with your selected preferences.",
          );
        } else if (prodSodium >= 400) {
          notices.push(
            "This product contains elevated sodium relative to general nutritional benchmarks.",
          );
          recommendations.push(
            "Lower sodium options among the selected products may better align with your preferences.",
          );
        } else if (prodSodium <= 100) {
          notices.push(
            "This product is low in sodium, which aligns with your sodium monitoring preferences.",
          );
        }
      }

      // 3. Saturated Fat Monitoring Context (e.g. High Cholesterol)
      if (isMonitoringSatFat && prodSatFat !== null) {
        profileFactors.push("Monitoring saturated fat (from Health Profile)");

        if (
          hasMultipleSatFatOptions &&
          (prodSatFat > avgSatFat || prodSatFat >= 3.0)
        ) {
          notices.push(
            "Your profile indicates you are monitoring saturated fat. This product contains relatively elevated saturated fat compared with the selected products.",
          );
          recommendations.push(
            "Options with lower saturated fat may better align with your selected preferences.",
          );
        } else if (prodSatFat <= 1.0) {
          notices.push(
            "Low saturated fat content aligns with your heart-conscious preferences.",
          );
        }
      }

      // 4. Thyroid Health Awareness
      if (isThyroidConscious && prodSodium !== null) {
        profileFactors.push("Thyroid health awareness (from Health Profile)");
        notices.push(
          "Review overall sodium and mineral balance across selected products to align with your personal preferences.",
        );
      }

      const hasInsight = notices.length > 0 || recommendations.length > 0;

      return {
        // Base score & rank strictly unmodified
        productId: item.productId,
        rank: item.rank,
        score: item.score,
        product: item.product,
        breakdown: item.breakdown,
        positives: item.positives,
        negatives: item.negatives,
        warnings: item.warnings,
        dataCompleteness: item.dataCompleteness,
        analysisVersion: item.analysisVersion,

        // Transparent Personalized Insights section
        personalizedInsight: {
          hasInsight,
          title: "Personalized Insights",
          notices,
          recommendations,
          profileFactors,
          activeConditions,
          transparentReason: hasInsight
            ? `Generated based on your saved health profile (${activeConditions.join(", ")}).`
            : "No specific nutritional alerts for your saved profile.",
          disclaimer: MEDICAL_DISCLAIMER,
        },
      };
    });
  }

  /**
   * Generates single-product personalized insight (for ProductDetail page or Scan Detail).
   *
   * @param {Object} product - Product with nutrition facts
   * @param {Object} healthProfile - User's health profile
   * @returns {Object} Personalized insight object
   */
  generateProductInsight(product = {}, healthProfile = null) {
    const singleResult = [
      {
        productId: product.id || 1,
        rank: 1,
        score: product.health_score || 0,
        product,
      },
    ];

    const enriched = this.enrichResultsWithInsights(
      singleResult,
      healthProfile,
    );
    return enriched[0]?.personalizedInsight || null;
  }
}

const defaultPersonalizationService = new PersonalizationService();

module.exports = defaultPersonalizationService;
module.exports.PersonalizationService = PersonalizationService;
module.exports.MEDICAL_DISCLAIMER = MEDICAL_DISCLAIMER;
