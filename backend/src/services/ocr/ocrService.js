const TesseractOCRAdapter = require("./tesseractAdapter");
const DemoOCRAdapter = require("./demoOCRAdapter");

/**
 * OCR Service
 *
 * Pluggable abstraction layer for Optical Character Recognition.
 * Uses TesseractOCRAdapter by default for real character extraction from images,
 * and supports swapping with DemoOCRAdapter or third-party cloud engines.
 */
class OCRService {
  constructor(provider = new TesseractOCRAdapter()) {
    this.provider = provider;
  }

  /**
   * Sets the active OCR provider adapter
   * @param {OCRProvider} provider
   */
  setProvider(provider) {
    if (!provider || typeof provider.extractText !== "function") {
      throw new Error("Invalid OCR provider: must implement extractText");
    }
    this.provider = provider;
  }

  /**
   * Returns metadata about current active OCR provider
   */
  getProviderMetadata() {
    return this.provider.getMetadata();
  }

  /**
   * Extracts text from an image using the active provider adapter
   *
   * @param {string|Object} imageInput
   * @param {Object} options
   * @returns {Promise<{ text: string, metadata: Object }>}
   */
  async extractText(imageInput, options = {}) {
    if (!imageInput && !options.rawText && !options.preset) {
      throw new Error("No image or label data provided for OCR analysis");
    }
    return this.provider.extractText(imageInput, options);
  }
}

const defaultOCRService = new OCRService();

module.exports = defaultOCRService;
module.exports.OCRService = OCRService;
module.exports.TesseractOCRAdapter = TesseractOCRAdapter;
module.exports.DemoOCRAdapter = DemoOCRAdapter;
