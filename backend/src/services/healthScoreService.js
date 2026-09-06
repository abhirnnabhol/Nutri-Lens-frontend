/**
 * NutriLens Health Score Engine (Phase 5)
 *
 * Core backend service for calculating the NutriLens Health Score (0–100).
 *
 * IMPORTANT COMPLIANCE:
 * - This is an objective nutritional comparison score ("Better choice among selected products").
 * - It is NEVER described as "percentage healthy", "medically safe", "disease preventing", or "medically recommended".
 * - Missing nutrition data is NEVER assumed to be zero. Instead, missing factors are excluded from calculation,
 *   reducing dataCompleteness and generating clear warnings.
 */

const ANALYSIS_VERSION = "1.0";
const SCORE_DISCLAIMER =
  "The NutriLens Health Score is a nutritional comparison benchmark and better choice indicator among selected products. It is not a medical diagnosis, medical recommendation, or disease prevention claim.";
const ingredientAnalysisService = require("./ingredientAnalysisService");

const DEFAULT_CONFIG = {
  weights: {
    sugar: 15,
    addedSugar: 15,
    sodium: 15,
    saturatedFat: 15,
    transFat: 15,
    fiber: 12,
    protein: 10,
    calories: 5,
  },
  wholeGrainBonus: 8,
  refinedIngredientPenalty: 8,
};

// Ingredient dictionaries for whole grains and refined/additives
const WHOLE_GRAIN_PATTERNS = [
  /whole\s*wheat/i,
  /whole\s*grain/i,
  /whole\s*oat/i,
  /rolled\s*oat/i,
  /oats?/i,
  /brown\s*rice/i,
  /quinoa/i,
  /multigrain/i,
  /millet/i,
  /barley/i,
  /rye/i,
  /buckwheat/i,
  /flax\s*seed/i,
  /chia/i,
];

const REFINED_ADDITIVE_PATTERNS = [
  /hydrogenated/i,
  /partially\s*hydrogenated/i,
  /palm\s*oil/i,
  /palm\s*fat/i,
  /high\s*fructose/i,
  /corn\s*syrup/i,
  /artificial\s*flavor/i,
  /artificial\s*colour/i,
  /artificial\s*sweetener/i,
  /aspartame/i,
  /acesulfame/i,
  /monosodium\s*glutamate/i,
  /ins\s*621/i,
];

/**
 * Normalizes input key variations (e.g. total_sugar vs totalSugar vs sugar)
 */
function normalizeNutritionData(raw = {}) {
  const getVal = (...keys) => {
    for (const k of keys) {
      if (raw[k] !== undefined && raw[k] !== null && raw[k] !== "") {
        const parsed = parseFloat(raw[k]);
        if (!isNaN(parsed)) return parsed;
      }
    }
    return null;
  };

  return {
    calories: getVal("calories", "calorie", "energy", "energy_kcal"),
    protein: getVal("protein", "proteins"),
    carbohydrates: getVal("carbohydrates", "carbs", "total_carbohydrates"),
    totalSugar: getVal("total_sugar", "totalSugar", "sugar", "sugars"),
    addedSugar: getVal("added_sugar", "addedSugar"),
    totalFat: getVal("total_fat", "totalFat", "fat"),
    saturatedFat: getVal("saturated_fat", "saturatedFat", "sat_fat"),
    transFat: getVal("trans_fat", "transFat"),
    sodium: getVal("sodium", "sodium_mg", "salt"),
    fiber: getVal("fiber", "dietary_fiber", "fibers"),
  };
}

/**
 * Normalizes ingredients list
 */
function normalizeIngredients(ingredients = []) {
  if (!Array.isArray(ingredients)) return [];
  return ingredients
    .map((ing) => {
      if (typeof ing === "string") return ing.trim();
      if (ing && typeof ing.name === "string") return ing.name.trim();
      return "";
    })
    .filter(Boolean);
}

/**
 * Subscore evaluator for Total Sugar (g)
 */
function evaluateTotalSugar(val) {
  if (val === null)
    return {
      score: null,
      impact: "missing",
      message: "Total sugar data is missing",
    };
  if (val <= 2.5)
    return {
      score: 100,
      impact: "positive",
      message: `Very low total sugar (${val}g)`,
    };
  if (val <= 5.0)
    return {
      score: 85,
      impact: "positive",
      message: `Low total sugar content (${val}g)`,
    };
  if (val <= 10.0)
    return {
      score: 65,
      impact: "neutral",
      message: `Moderate sugar content (${val}g)`,
    };
  if (val <= 18.0)
    return {
      score: 40,
      impact: "negative",
      message: `Elevated sugar content (${val}g)`,
    };
  if (val <= 25.0)
    return {
      score: 20,
      impact: "negative",
      message: `High sugar content (${val}g)`,
    };
  return {
    score: 5,
    impact: "negative",
    message: `Very high sugar content (${val}g)`,
  };
}

/**
 * Subscore evaluator for Added Sugar (g)
 */
function evaluateAddedSugar(val) {
  if (val === null)
    return {
      score: null,
      impact: "missing",
      message: "Added sugar data is missing",
    };
  if (val <= 0.5)
    return {
      score: 100,
      impact: "positive",
      message: "No significant added sugar",
    };
  if (val <= 3.0)
    return {
      score: 80,
      impact: "neutral",
      message: `Low added sugar (${val}g)`,
    };
  if (val <= 8.0)
    return {
      score: 50,
      impact: "negative",
      message: `Contains added sugars (${val}g)`,
    };
  if (val <= 15.0)
    return {
      score: 20,
      impact: "negative",
      message: `High in added sugar (${val}g)`,
    };
  return {
    score: 0,
    impact: "negative",
    message: `Excessive added sugar (${val}g)`,
  };
}

/**
 * Subscore evaluator for Sodium (mg)
 */
function evaluateSodium(val) {
  if (val === null)
    return {
      score: null,
      impact: "missing",
      message: "Sodium data is missing",
    };
  if (val <= 120)
    return { score: 100, impact: "positive", message: `Low sodium (${val}mg)` };
  if (val <= 300)
    return {
      score: 80,
      impact: "neutral",
      message: `Moderate sodium (${val}mg)`,
    };
  if (val <= 600)
    return {
      score: 55,
      impact: "neutral",
      message: `Moderate sodium content (${val}mg)`,
    };
  if (val <= 900)
    return {
      score: 25,
      impact: "negative",
      message: `Elevated sodium content (${val}mg)`,
    };
  return {
    score: 5,
    impact: "negative",
    message: `High sodium content (${val}mg)`,
  };
}

/**
 * Subscore evaluator for Saturated Fat (g)
 */
function evaluateSaturatedFat(val) {
  if (val === null)
    return {
      score: null,
      impact: "missing",
      message: "Saturated fat data is missing",
    };
  if (val <= 1.5)
    return {
      score: 100,
      impact: "positive",
      message: `Low saturated fat (${val}g)`,
    };
  if (val <= 3.5)
    return {
      score: 75,
      impact: "neutral",
      message: `Moderate saturated fat (${val}g)`,
    };
  if (val <= 6.0)
    return {
      score: 45,
      impact: "negative",
      message: `Elevated saturated fat (${val}g)`,
    };
  if (val <= 10.0)
    return {
      score: 20,
      impact: "negative",
      message: `High saturated fat (${val}g)`,
    };
  return {
    score: 5,
    impact: "negative",
    message: `Very high saturated fat (${val}g)`,
  };
}

/**
 * Subscore evaluator for Trans Fat (g)
 */
function evaluateTransFat(val) {
  if (val === null)
    return {
      score: null,
      impact: "missing",
      message: "Trans fat data is missing",
    };
  if (val <= 0.1)
    return {
      score: 100,
      impact: "positive",
      message: "Zero trans fat detected",
    };
  if (val <= 0.5)
    return {
      score: 25,
      impact: "negative",
      message: `Contains trans fat (${val}g)`,
    };
  return {
    score: 0,
    impact: "negative",
    message: `High trans fat content (${val}g)`,
  };
}

/**
 * Subscore evaluator for Dietary Fiber (g)
 */
function evaluateFiber(val) {
  if (val === null)
    return {
      score: null,
      impact: "missing",
      message: "Dietary fiber data is missing",
    };
  if (val >= 6.0)
    return {
      score: 100,
      impact: "positive",
      message: `Excellent source of dietary fiber (${val}g)`,
    };
  if (val >= 3.5)
    return {
      score: 80,
      impact: "positive",
      message: `Good source of dietary fiber (${val}g)`,
    };
  if (val >= 2.0)
    return {
      score: 60,
      impact: "neutral",
      message: `Contains dietary fiber (${val}g)`,
    };
  if (val >= 1.0)
    return {
      score: 40,
      impact: "neutral",
      message: `Some dietary fiber (${val}g)`,
    };
  return {
    score: 20,
    impact: "neutral",
    message: `Low dietary fiber (${val}g)`,
  };
}

/**
 * Subscore evaluator for Protein (g)
 */
function evaluateProtein(val) {
  if (val === null)
    return {
      score: null,
      impact: "missing",
      message: "Protein data is missing",
    };
  if (val >= 12.0)
    return {
      score: 100,
      impact: "positive",
      message: `High in protein (${val}g)`,
    };
  if (val >= 7.0)
    return {
      score: 80,
      impact: "positive",
      message: `Good protein source (${val}g)`,
    };
  if (val >= 3.0)
    return {
      score: 60,
      impact: "neutral",
      message: `Moderate protein (${val}g)`,
    };
  if (val >= 1.5)
    return { score: 40, impact: "neutral", message: `Some protein (${val}g)` };
  return {
    score: 20,
    impact: "neutral",
    message: `Low protein content (${val}g)`,
  };
}

/**
 * Subscore evaluator for Calories (kcal)
 */
function evaluateCalories(val) {
  if (val === null)
    return {
      score: null,
      impact: "missing",
      message: "Calories data is missing",
    };
  if (val <= 100)
    return {
      score: 90,
      impact: "positive",
      message: `Low calorie density (${val} kcal)`,
    };
  if (val <= 200)
    return {
      score: 75,
      impact: "neutral",
      message: `Moderate calorie content (${val} kcal)`,
    };
  if (val <= 350)
    return {
      score: 55,
      impact: "neutral",
      message: `Energy-dense product (${val} kcal)`,
    };
  if (val <= 500)
    return {
      score: 35,
      impact: "negative",
      message: `High caloric density (${val} kcal)`,
    };
  return {
    score: 15,
    impact: "negative",
    message: `Very high caloric density (${val} kcal)`,
  };
}

/**
 * Evaluates ingredients list for whole grains and refined additives using IngredientAnalysisService
 */
function evaluateIngredients(ingredients = [], config = DEFAULT_CONFIG) {
  const analysis = ingredientAnalysisService.analyze(ingredients);

  const hasWholeGrains = analysis.categories.includes("whole_grain");
  const refinedCategories = [
    "trans_fat_source",
    "saturated_fat_source",
    "artificial_sweetener",
    "preservative",
    "coloring",
    "flavoring",
    "refined_grain",
  ];
  const hasRefinedAdditives = refinedCategories.some((cat) =>
    analysis.categories.includes(cat),
  );

  const wholeGrainMatches = [];
  const refinedMatches = [];

  for (const item of analysis.details || []) {
    if (item.categories.includes("whole_grain")) {
      if (!wholeGrainMatches.includes(item.raw))
        wholeGrainMatches.push(item.raw);
    }
    if (item.categories.some((c) => refinedCategories.includes(c))) {
      if (!refinedMatches.includes(item.raw)) refinedMatches.push(item.raw);
    }
  }

  let adjustment = 0;
  if (hasWholeGrains) adjustment += config.wholeGrainBonus;
  if (hasRefinedAdditives) adjustment -= config.refinedIngredientPenalty;

  return {
    hasWholeGrains,
    hasRefinedAdditives,
    wholeGrainMatches,
    refinedMatches,
    adjustment,
    analysis,
  };
}

/**
 * HealthScoreService Class
 */
class HealthScoreService {
  constructor(customConfig = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...customConfig,
      weights: {
        ...DEFAULT_CONFIG.weights,
        ...(customConfig.weights || {}),
      },
    };
    this.analysisVersion = ANALYSIS_VERSION;
  }

  /**
   * Main calculation entrypoint
   *
   * @param {Object} rawNutrition - Product nutrition data
   * @param {Array} rawIngredients - Product ingredient list
   * @returns {Object} Structured health score evaluation
   */
  calculateHealthScore(rawNutrition = {}, rawIngredients = []) {
    const nutrition = normalizeNutritionData(rawNutrition);
    const ingredients = normalizeIngredients(rawIngredients);
    const weights = this.config.weights;

    const evaluatedFactors = {
      sugar: {
        ...evaluateTotalSugar(nutrition.totalSugar),
        unit: "g",
        value: nutrition.totalSugar,
        weight: weights.sugar,
      },
      addedSugar: {
        ...evaluateAddedSugar(nutrition.addedSugar),
        unit: "g",
        value: nutrition.addedSugar,
        weight: weights.addedSugar,
      },
      sodium: {
        ...evaluateSodium(nutrition.sodium),
        unit: "mg",
        value: nutrition.sodium,
        weight: weights.sodium,
      },
      saturatedFat: {
        ...evaluateSaturatedFat(nutrition.saturatedFat),
        unit: "g",
        value: nutrition.saturatedFat,
        weight: weights.saturatedFat,
      },
      transFat: {
        ...evaluateTransFat(nutrition.transFat),
        unit: "g",
        value: nutrition.transFat,
        weight: weights.transFat,
      },
      fiber: {
        ...evaluateFiber(nutrition.fiber),
        unit: "g",
        value: nutrition.fiber,
        weight: weights.fiber,
      },
      protein: {
        ...evaluateProtein(nutrition.protein),
        unit: "g",
        value: nutrition.protein,
        weight: weights.protein,
      },
      calories: {
        ...evaluateCalories(nutrition.calories),
        unit: "kcal",
        value: nutrition.calories,
        weight: weights.calories,
      },
    };

    const positives = [];
    const negatives = [];
    const warnings = [];
    const breakdown = {};

    let totalWeightAvailable = 0;
    let weightedScoreSum = 0;
    const trackedKeys = Object.keys(evaluatedFactors);
    let presentFactorCount = 0;

    for (const key of trackedKeys) {
      const factor = evaluatedFactors[key];
      breakdown[key] = {
        value: factor.value,
        unit: factor.unit,
        score: factor.score,
        impact: factor.impact,
        message: factor.message,
      };

      if (factor.impact === "missing") {
        // DO NOT treat missing data as zero! Exclude weight from total
        warnings.push(`${factor.message}; excluded from score calculation.`);
      } else {
        presentFactorCount++;
        totalWeightAvailable += factor.weight;
        weightedScoreSum += factor.score * factor.weight;

        if (factor.impact === "positive") {
          positives.push(factor.message);
        } else if (factor.impact === "negative") {
          negatives.push(factor.message);
        }
      }
    }

    // Evaluate Ingredients
    const ingResult = evaluateIngredients(ingredients, this.config);
    const ingredientAnalysis = ingResult.analysis;

    if (ingResult.hasWholeGrains) {
      positives.push(
        `Contains whole grain ingredients (${ingResult.wholeGrainMatches.slice(0, 2).join(", ")})`,
      );
    }
    if (ingResult.hasRefinedAdditives) {
      negatives.push(
        `Contains refined fats or artificial additives (${ingResult.refinedMatches.slice(0, 2).join(", ")})`,
      );
    }

    // Attach explainable warnings from ingredient analysis
    if (ingredientAnalysis && Array.isArray(ingredientAnalysis.warnings)) {
      for (const w of ingredientAnalysis.warnings) {
        if (!warnings.includes(w)) {
          warnings.push(w);
        }
      }
    }

    // Calculate Data Completeness (0 to 100%)
    const dataCompleteness = Math.round(
      (presentFactorCount / trackedKeys.length) * 100,
    );

    // If completely empty data, return null score with warnings
    if (presentFactorCount === 0) {
      return {
        score: null,
        breakdown,
        positives: [],
        negatives: [],
        warnings: [
          "Insufficient nutrition data to calculate a NutriLens Health Score.",
        ],
        dataCompleteness: 0,
        analysisVersion: this.analysisVersion,
        scoreDescription: "NutriLens Health Score: Score Pending",
        disclaimer: SCORE_DISCLAIMER,
        ingredientAnalysis: ingredientAnalysisService.analyze(ingredients),
        normalizedIngredients: ingredientAnalysis
          ? ingredientAnalysis.normalizedIngredients
          : [],
        ingredientCategories: ingredientAnalysis
          ? ingredientAnalysis.categories
          : [],
      };
    }

    // Normalized base score based on available weights only
    const baseScore = weightedScoreSum / totalWeightAvailable;

    // Apply ingredient adjustment
    const adjustedScore = baseScore + ingResult.adjustment;

    // Clamp strictly between 0 and 100
    const finalScore = Math.max(0, Math.min(100, Math.round(adjustedScore)));

    return {
      score: finalScore,
      breakdown,
      positives,
      negatives,
      warnings,
      dataCompleteness,
      analysisVersion: this.analysisVersion,
      scoreDescription:
        "NutriLens Health Score: Better choice among selected products",
      disclaimer: SCORE_DISCLAIMER,
      ingredientAnalysis,
      normalizedIngredients: ingredientAnalysis
        ? ingredientAnalysis.normalizedIngredients
        : [],
      ingredientCategories: ingredientAnalysis
        ? ingredientAnalysis.categories
        : [],
    };
  }
}

// Singleton default instance
const defaultService = new HealthScoreService();

module.exports = defaultService;
module.exports.HealthScoreService = HealthScoreService;
module.exports.DEFAULT_CONFIG = DEFAULT_CONFIG;
