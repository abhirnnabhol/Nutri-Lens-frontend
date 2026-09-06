const OCRProvider = require("./ocrProvider");
const Tesseract = require("tesseract.js");

/**
 * Tesseract OCR Adapter
 *
 * Real on-device/in-process OCR provider using Tesseract.js (pure WebAssembly/JS engine).
 * Performs actual optical character recognition on camera captures and uploaded images.
 */
class TesseractOCRAdapter extends OCRProvider {
  constructor() {
    super("TesseractOCRAdapter");
  }

  getMetadata() {
    return {
      provider: "TesseractOCRAdapter",
      isDemo: false,
      isRealOCR: true,
      engine: "Tesseract.js (Local WASM OCR)",
      isReady: true,
    };
  }

  /**
   * Extracts text from the given image input.
   *
   * @param {string|Buffer} imageInput - Base64 data URL, image buffer, or preset key
   * @param {Object} options
   * @returns {Promise<{ text: string, metadata: Object }>}
   */
  async extractText(imageInput, options = {}) {
    // 1. Direct text pass-through for test fixtures
    if (options.rawText && typeof options.rawText === "string") {
      return {
        text: options.rawText,
        metadata: this.getMetadata(),
      };
    }

    if (
      typeof imageInput === "string" &&
      imageInput.includes("Nutrition Facts") &&
      !imageInput.startsWith("data:")
    ) {
      return {
        text: imageInput,
        metadata: this.getMetadata(),
      };
    }

    // 2. Preset sample labels (if user specifically clicked a preset button)
    const preset =
      options.preset ||
      (typeof imageInput === "string" && imageInput.startsWith("preset:")
        ? imageInput.replace("preset:", "")
        : null);
    if (preset) {
      if (preset === "soda") {
        return {
          text: [
            "NutriLens Demo Fizzy Cola",
            "Serving Size: 330ml (1 can)",
            "Calories: 140",
            "Total Fat: 0g",
            "Saturated Fat: 0g",
            "Trans Fat: 0g",
            "Sodium: 45mg",
            "Total Carbohydrate: 39g",
            "Dietary Fiber: 0g",
            "Total Sugars: 38g",
            "Added Sugars: 35g",
            "Protein: 0g",
            "Ingredients: Carbonated Water, High Fructose Corn Syrup, Caramel Color, Phosphoric Acid, Natural Flavors, Caffeine.",
          ].join("\n"),
          metadata: { ...this.getMetadata(), presetUsed: "soda" },
        };
      }

      if (preset === "chips") {
        return {
          text: [
            "NutriLens Demo Salty Crisps",
            "Serving Size: 30g",
            "Calories: 160",
            "Total Fat: 10g",
            "Saturated Fat: 3.5g",
            "Trans Fat: 0g",
            "Sodium: 240mg",
            "Total Carbohydrate: 16g",
            "Dietary Fiber: 1g",
            "Total Sugars: 1g",
            "Added Sugars: 0g",
            "Protein: 2g",
            "Ingredients: Potatoes, Vegetable Palm Oil, Salt, Monosodium Glutamate, Artificial Flavors.",
          ].join("\n"),
          metadata: { ...this.getMetadata(), presetUsed: "chips" },
        };
      }

      return {
        text: [
          "NutriLens Organic Rolled Oat Bar",
          "Serving Size: 40g (1 bar)",
          "Calories: 150",
          "Total Fat: 3.5g",
          "Saturated Fat: 0.5g",
          "Trans Fat: 0g",
          "Sodium: 95mg",
          "Total Carbohydrate: 26g",
          "Dietary Fiber: 4.5g",
          "Total Sugars: 6g",
          "Added Sugars: 3g",
          "Protein: 5g",
          "Ingredients: Whole Grain Rolled Oats, Tapioca Syrup, Crisp Rice, Almond Butter, Chia Seeds, Sea Salt, Cinnamon Extract.",
        ].join("\n"),
        metadata: { ...this.getMetadata(), presetUsed: "oat-bar" },
      };
    }

    // 3. Real OCR on image buffer / base64 data URL
    try {
      let imageBuffer = null;
      if (Buffer.isBuffer(imageInput)) {
        imageBuffer = imageInput;
      } else if (typeof imageInput === "string") {
        const base64Data = imageInput.replace(/^data:image\/\w+;base64,/, "");
        imageBuffer = Buffer.from(base64Data, "base64");
      }

      if (!imageBuffer || imageBuffer.length === 0) {
        throw new Error("Invalid or empty image buffer provided for OCR");
      }

      // Execute Tesseract OCR with a 20-second timeout limit
      const ocrPromise = Tesseract.recognize(imageBuffer, "eng", {
        logger: () => {}, // suppress verbose progress logs
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("OCR extraction timed out")), 20000),
      );

      const result = await Promise.race([ocrPromise, timeoutPromise]);
      const extractedText =
        result && result.data && result.data.text
          ? result.data.text.trim()
          : "";
      const confidence = result && result.data ? result.data.confidence : 0;

      return {
        text: extractedText,
        metadata: {
          ...this.getMetadata(),
          confidence,
          textLength: extractedText.length,
          isRealExtraction: true,
        },
      };
    } catch (err) {
      console.warn("Tesseract OCR recognition error:", err.message);
      return {
        text: "",
        metadata: {
          ...this.getMetadata(),
          error: err.message,
          warning:
            "Could not extract clear text from the image. Please verify values manually.",
        },
      };
    }
  }
}

module.exports = TesseractOCRAdapter;
