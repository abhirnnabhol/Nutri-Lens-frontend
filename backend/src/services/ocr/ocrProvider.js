/**
 * OCR Provider Base Interface
 *
 * Abstract base class defining the contract for any OCR provider
 * (e.g. Google Cloud Vision, Tesseract, AWS Textract, or Demo Adapter).
 */
class OCRProvider {
  constructor(name = "GenericOCRProvider") {
    this.name = name;
  }

  /**
   * Extracts text from an image input (base64 string, URL, buffer, or raw text payload)
   *
   * @param {string|Buffer} imageInput
   * @param {Object} options
   * @returns {Promise<{ text: string, metadata: Object }>}
   */
  async extractText(_imageInput, _options = {}) {
    throw new Error(
      `extractText() must be implemented by ${this.constructor.name}`,
    );
  }

  /**
   * Returns provider capability and configuration metadata
   */
  getMetadata() {
    return {
      provider: this.name,
      isDemo: false,
      isReady: true,
    };
  }
}

module.exports = OCRProvider;
