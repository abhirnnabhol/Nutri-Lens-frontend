/**
 * Nutrition Parser Service
 *
 * Extracts structured nutrition facts and ingredients from raw OCR text.
 * Robust against real-world OCR text noise, table separators, and label variants.
 */
class NutritionParser {
  /**
   * Parses raw OCR label text into normalized nutrition fields and ingredients list.
   * Does NOT inject fake numbers if a nutrient is absent from the text.
   *
   * @param {string} rawText
   * @returns {Object} Parsed nutrition data and ingredients
   */
  parse(rawText = "") {
    if (typeof rawText !== "string") {
      rawText = String(rawText || "");
    }

    const lines = rawText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    // 1. Extract Product Name
    let productName = "";
    const nameMatch = rawText.match(
      /(?:Product\s*(?:Name)?|Item|Brand)[:\s|]*([^\r\n]+)/i,
    );
    if (nameMatch && nameMatch[1].trim()) {
      productName = nameMatch[1].trim();
    } else {
      // Look for the first prominent title line before nutrition headers
      for (const line of lines.slice(0, 5)) {
        const lower = line.toLowerCase();
        if (
          !lower.includes("nutrition") &&
          !lower.includes("serving") &&
          !lower.includes("amount") &&
          !lower.includes("daily") &&
          !lower.includes("facts") &&
          line.length > 2 &&
          line.length < 60
        ) {
          productName = line.replace(/^[#*|_\s]+|[#*|_\s]+$/g, "").trim();
          break;
        }
      }
    }

    if (!productName) {
      productName = "Scanned Food Product";
    }

    // 2. Extract Serving Size
    let servingSize = "30g";
    const servingMatch = rawText.match(/Serving\s*Size[:\s|]*([^\r\n,;]+)/i);
    if (servingMatch && servingMatch[1].trim()) {
      servingSize = servingMatch[1].trim();
    }

    // Helper to find numeric value for a given list of regex patterns
    const extractNumber = (...patterns) => {
      for (const pattern of patterns) {
        const match = rawText.match(pattern);
        if (match && match[1] !== undefined) {
          const val = parseFloat(match[1]);
          if (!isNaN(val)) return val;
        }
      }
      return null;
    };

    // 3. Extract Nutrition Values (Using multi-variant OCR patterns)
    const calories = extractNumber(
      /(?:Calories|Energy|CALORIES|ENERGY)[:\s|]*([\d\.]+)/i,
      /(?:[\d\.]+\s*kJ\s*[/|]\s*)?([\d\.]+)\s*kcal/i,
      /(?:Calories|Energy)\s+per\s+serving[:\s|]*([\d\.]+)/i,
      /Cal[:\s|]*([\d\.]+)/i,
    );

    const protein = extractNumber(
      /(?:Protein|PROTEIN|Proteln)[:\s|]*([\d\.]+)\s*g?/i,
      /(?:Protein|PROTEIN)\s+([\d\.]+)\s*g/i,
    );

    const carbohydrates = extractNumber(
      /(?:Total\s+)?(?:Carbohydrates?|Carbs?|CARBOHYDRATE|Carbohydrate)[:\s|]*([\d\.]+)\s*g?/i,
      /(?:Carbohydrates?|Carbs?)\s+([\d\.]+)\s*g/i,
    );

    const totalSugar = extractNumber(
      /(?:Total\s+)?(?:Sugars?|SUGARS?|Sugar)[:\s|]*([\d\.]+)\s*g?/i,
      /(?:Sugars?|Sugar)\s+([\d\.]+)\s*g/i,
    );

    // Added sugar can appear as "Added Sugars: 5g" or "Includes 5g Added Sugars"
    let addedSugar = extractNumber(
      /(?:Added\s*Sugars?|ADDED\s*SUGARS?)[:\s|]*([\d\.]+)\s*g?/i,
      /(?:Includes|Incl\.?)\s*([\d\.]+)\s*g?\s*(?:of\s+)?(?:Added\s*Sugars?|ADDED\s*SUGARS?)/i,
    );

    const totalFat = extractNumber(
      /(?:Total\s+)?(?:Fat|FAT)[:\s|]*([\d\.]+)\s*g?/i,
      /(?:Total\s+Fat)\s+([\d\.]+)\s*g/i,
    );

    const saturatedFat = extractNumber(
      /(?:Saturated\s*Fat|Sat\.?\s*Fat|SATURATED\s*FAT)[:\s|]*([\d\.]+)\s*g?/i,
      /(?:Saturated\s*Fat)\s+([\d\.]+)\s*g/i,
    );

    const transFat = extractNumber(
      /(?:Trans\s*Fat|TRANS\s*FAT)[:\s|]*([\d\.]+)\s*g?/i,
      /(?:Trans\s*Fat)\s+([\d\.]+)\s*g/i,
    );

    // Sodium extraction with mg or g conversion
    let sodium = null;
    const sodiumMatch =
      rawText.match(/(?:Sodium|SODIUM)[:\s|]*([\d\.]+)\s*(mg|g)?/i) ||
      rawText.match(/(?:Sodium|SODIUM)\s+([\d\.]+)\s*(mg|g)/i);
    if (sodiumMatch) {
      const rawNum = parseFloat(sodiumMatch[1]);
      const unit = (sodiumMatch[2] || "mg").toLowerCase();
      if (!isNaN(rawNum)) {
        sodium = unit === "g" ? Math.round(rawNum * 1000) : Math.round(rawNum);
      }
    }

    const fiber = extractNumber(
      /(?:Dietary\s*)?(?:Fiber|Fibre|DIETARY\s*FIBER|FIBRE)[:\s|]*([\d\.]+)\s*g?/i,
      /(?:Fiber|Fibre)\s+([\d\.]+)\s*g/i,
    );

    // 4. Extract Ingredients List
    let ingredients = [];
    const ingMatch = rawText.match(
      /(?:Ingredients?|INGREDIENTS?)[:\s|]*([\s\S]+?)(?:\.|\n\n|Contains|Allergen|Manufactured|Distributed|Best before|Expiry|$)/i,
    );
    if (ingMatch && ingMatch[1]) {
      ingredients = ingMatch[1]
        .split(/[,;\n•]/)
        .map((i) => i.replace(/[().*#_]/g, "").trim())
        .filter(
          (i) =>
            i.length > 1 &&
            !i.toLowerCase().startsWith("contains") &&
            !i.toLowerCase().startsWith("allergen") &&
            !i.toLowerCase().includes("may contain"),
        );
    }

    return {
      productName,
      servingSize,
      calories: calories !== null ? calories : null,
      protein: protein !== null ? protein : null,
      carbohydrates: carbohydrates !== null ? carbohydrates : null,
      totalSugar: totalSugar !== null ? totalSugar : null,
      addedSugar: addedSugar !== null ? addedSugar : null,
      totalFat: totalFat !== null ? totalFat : null,
      saturatedFat: saturatedFat !== null ? saturatedFat : null,
      transFat: transFat !== null ? transFat : null,
      sodium: sodium !== null ? sodium : null,
      fiber: fiber !== null ? fiber : null,
      ingredients,
      rawText,
    };
  }
}

const defaultNutritionParser = new NutritionParser();

module.exports = defaultNutritionParser;
module.exports.NutritionParser = NutritionParser;
