const ocrService = require("../services/ocr/ocrService");
const nutritionParser = require("../services/nutritionParser");
const healthScoreService = require("../services/healthScoreService");
const ingredientAnalysisService = require("../services/ingredientAnalysisService");
const scanService = require("../services/scanService");
const db = require("../config/db");

const analyzeController = {
  /**
   * POST /api/analyze/image
   * Extracts text via OCR abstraction and parses nutrition facts.
   * DOES NOT calculate health score (Verification Step comes next).
   */
  async analyzeImage(req, res, next) {
    try {
      const { image, rawText, preset } = req.body || {};

      // 1. Extract text using OCR Service abstraction
      const { text, metadata } = await ocrService.extractText(image, {
        rawText,
        preset,
      });

      // 2. Parse extracted text into structured nutrition fields
      const parsedData = nutritionParser.parse(text);

      return res.status(200).json({
        success: true,
        data: {
          rawText: text,
          extractedData: {
            productName: parsedData.productName,
            servingSize: parsedData.servingSize,
            calories: parsedData.calories,
            protein: parsedData.protein,
            carbohydrates: parsedData.carbohydrates,
            totalSugar: parsedData.totalSugar,
            addedSugar: parsedData.addedSugar,
            totalFat: parsedData.totalFat,
            saturatedFat: parsedData.saturatedFat,
            transFat: parsedData.transFat,
            sodium: parsedData.sodium,
            fiber: parsedData.fiber,
            ingredients: parsedData.ingredients,
            normalizedIngredients: ingredientAnalysisService.analyze(
              parsedData.ingredients,
            ).normalizedIngredients,
          },
          ocrMeta: metadata,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/analyze/confirm
   * Receives verified/edited values from the user, normalizes into the unified
   * product schema, and calculates the NutriLens Health Score.
   */
  async confirmAndAnalyze(req, res, next) {
    try {
      const body = req.body || {};
      const {
        productName,
        servingSize,
        calories,
        protein,
        carbohydrates,
        totalSugar,
        addedSugar,
        totalFat,
        saturatedFat,
        transFat,
        sodium,
        fiber,
        ingredients,
        rawText,
      } = body;

      const userId = req.user ? req.user.id : body.userId || null;

      // Clean ingredients
      let normalizedIngredients = [];
      if (Array.isArray(ingredients)) {
        normalizedIngredients = ingredients
          .map((i) => (typeof i === "string" ? i.trim() : String(i)))
          .filter(Boolean);
      } else if (typeof ingredients === "string") {
        normalizedIngredients = ingredients
          .split(/[,;\n]/)
          .map((i) => i.trim())
          .filter(Boolean);
      }

      // Convert into the EXACT same normalized product format used by Online Mode
      const normalizedProduct = {
        id: `scanned-${Date.now()}`,
        name:
          productName && productName.trim()
            ? productName.trim()
            : "Scanned Food Product",
        brand: "Scanned Label",
        category_id: 5,
        category_name: "Packaged Food",
        category_slug: "packaged-food",
        image_url: null,
        serving_size:
          servingSize && servingSize.trim() ? servingSize.trim() : "30g",
        calories:
          calories !== undefined && calories !== null && calories !== ""
            ? parseFloat(calories)
            : null,
        protein:
          protein !== undefined && protein !== null && protein !== ""
            ? parseFloat(protein)
            : null,
        carbohydrates:
          carbohydrates !== undefined &&
          carbohydrates !== null &&
          carbohydrates !== ""
            ? parseFloat(carbohydrates)
            : null,
        total_sugar:
          totalSugar !== undefined && totalSugar !== null && totalSugar !== ""
            ? parseFloat(totalSugar)
            : null,
        added_sugar:
          addedSugar !== undefined && addedSugar !== null && addedSugar !== ""
            ? parseFloat(addedSugar)
            : null,
        total_fat:
          totalFat !== undefined && totalFat !== null && totalFat !== ""
            ? parseFloat(totalFat)
            : null,
        saturated_fat:
          saturatedFat !== undefined &&
          saturatedFat !== null &&
          saturatedFat !== ""
            ? parseFloat(saturatedFat)
            : null,
        trans_fat:
          transFat !== undefined && transFat !== null && transFat !== ""
            ? parseFloat(transFat)
            : null,
        sodium:
          sodium !== undefined && sodium !== null && sodium !== ""
            ? parseFloat(sodium)
            : null,
        fiber:
          fiber !== undefined && fiber !== null && fiber !== ""
            ? parseFloat(fiber)
            : null,
        ingredients: normalizedIngredients,
        is_scanned: true,
      };

      // Feed directly through HealthScoreService (NO duplicate scoring logic)
      const scoreEvaluation = healthScoreService.calculateHealthScore(
        normalizedProduct,
        normalizedIngredients,
      );

      normalizedProduct.health_score = scoreEvaluation.score;
      normalizedProduct.score_evaluation = scoreEvaluation;
      normalizedProduct.ingredient_analysis =
        scoreEvaluation.ingredientAnalysis;
      normalizedProduct.normalized_ingredients =
        scoreEvaluation.normalizedIngredients;

      // Persist full verified scan in database via scanService
      let scanRecord = null;
      try {
        scanRecord = await scanService.createScan({
          userId,
          productName: normalizedProduct.name,
          score: normalizedProduct.health_score,
          mode: body.mode || "offline",
          imageUrl: body.imageUrl || body.imageSrc || null,
          rawText: rawText || null,
          productData: {
            ...normalizedProduct,
            scoreEvaluation,
          },
        });
      } catch (dbErr) {
        console.warn("Scan history logging warning:", dbErr.message);
      }

      return res.status(200).json({
        success: true,
        data: {
          product: normalizedProduct,
          scoreEvaluation,
          scanId: scanRecord ? scanRecord.id : null,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/analyze/ingredients
   * Direct ingredient analysis and normalization endpoint.
   * Converts raw ingredient text or list into normalized ingredients and 13 categories.
   */
  async analyzeIngredients(req, res, next) {
    try {
      const { text, ingredients, rawText } = req.body || {};
      const input =
        text !== undefined
          ? text
          : ingredients !== undefined
            ? ingredients
            : rawText;
      const analysis = ingredientAnalysisService.analyze(input);

      return res.status(200).json({
        success: true,
        data: analysis,
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = analyzeController;
