const OCRProvider = require("./ocrProvider");

/**
 * Demo OCR Adapter
 *
 * Clearly labeled demo provider for offline scanner development and testing
 * when no third-party cloud OCR API (e.g. Google Cloud Vision) is provisioned.
 */
class DemoOCRAdapter extends OCRProvider {
  constructor() {
    super("DemoOCRAdapter");
  }

  getMetadata() {
    return {
      provider: "DemoOCRAdapter",
      isDemo: true,
      label: "DEMO OCR Adapter (Simulated Extraction)",
      notice:
        "No live cloud OCR engine is configured. Running in explicit DEMO mode. Extracted text is simulated or derived from label templates.",
      isReady: true,
    };
  }

  /**
   * Extracts text from the given image input.
   *
   * @param {string|Object} imageInput - Base64 data URL, raw text object, or preset label key
   * @param {Object} options
   * @returns {Promise<{ text: string, metadata: Object }>}
   */
  async extractText(imageInput, options = {}) {
    // 1. Direct raw text pass-through for testing or manual simulation
    if (
      typeof imageInput === "string" &&
      imageInput.includes("Nutrition Facts")
    ) {
      return {
        text: imageInput,
        metadata: this.getMetadata(),
      };
    }

    if (options.rawText && typeof options.rawText === "string") {
      return {
        text: options.rawText,
        metadata: this.getMetadata(),
      };
    }

    // 2. Preset sample labels
    const preset =
      options.preset ||
      (typeof imageInput === "object" ? imageInput.preset : null);
    if (
      preset === "soda" ||
      (typeof imageInput === "string" && imageInput.includes("preset=soda"))
    ) {
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
        metadata: this.getMetadata(),
      };
    }

    if (
      preset === "chips" ||
      (typeof imageInput === "string" && imageInput.includes("preset=chips"))
    ) {
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
        metadata: this.getMetadata(),
      };
    }

    // 3. Default realistic demo label (Whole Grain Oat Bar)
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
      metadata: this.getMetadata(),
    };
  }
}

module.exports = DemoOCRAdapter;
