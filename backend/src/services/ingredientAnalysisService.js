/**
 * NutriLens Ingredient Analysis and Normalization Service (Phase 8)
 *
 * Deterministic, explainable engine for converting raw ingredient text into
 * normalized ingredients, categorizing them across 13 defined categories,
 * and generating transparent nutritional positives, negatives, and warnings.
 *
 * ZERO random or non-deterministic logic:
 * All evaluations are rule-based, dictionary-driven, and fully explainable.
 */

// 1. The 13 required categories
const CATEGORIES = Object.freeze({
  SUGAR: "sugar",
  REFINED_GRAIN: "refined_grain",
  WHOLE_GRAIN: "whole_grain",
  PROTEIN_SOURCE: "protein_source",
  FIBER_SOURCE: "fiber_source",
  SATURATED_FAT_SOURCE: "saturated_fat_source",
  TRANS_FAT_SOURCE: "trans_fat_source",
  PRESERVATIVE: "preservative",
  ARTIFICIAL_SWEETENER: "artificial_sweetener",
  COLORING: "coloring",
  FLAVORING: "flavoring",
  EMULSIFIER: "emulsifier",
  OTHER_ADDITIVE: "other_additive",
});

const CATEGORY_LIST = Object.freeze(Object.values(CATEGORIES));

// 2. Exact Normalization Dictionary (direct string key -> normalized string)
const EXACT_NORMALIZATION_MAP = {
  // Sugar & sweetening agents
  sucrose: "sugar",
  "table sugar": "sugar",
  "white sugar": "sugar",
  "cane sugar": "sugar",
  "granulated sugar": "sugar",
  "beet sugar": "sugar",
  "invert sugar": "sugar",
  "golden syrup": "sugar",
  "brown sugar": "brown sugar",
  jaggery: "jaggery",
  gur: "jaggery",
  dextrose: "dextrose",
  glucose: "glucose",
  "glucose syrup": "glucose syrup",
  "liquid glucose": "glucose syrup",
  fructose: "fructose",
  "high fructose corn syrup": "high fructose corn syrup",
  hfcs: "high fructose corn syrup",
  "corn syrup": "corn syrup",
  maltose: "maltose",
  molasses: "molasses",
  honey: "honey",
  "maple syrup": "maple syrup",
  "agave nectar": "agave nectar",

  // Salt & mineral seasonings
  "sodium chloride": "salt",
  salt: "salt",
  "table salt": "salt",
  "iodized salt": "salt",
  "iodised salt": "salt",
  "sea salt": "salt",
  "rock salt": "salt",
  "black salt": "salt",
  "pink salt": "salt",
  "himalayan salt": "salt",

  // Refined flours & refined grains
  "refined wheat flour": "refined flour",
  maida: "refined flour",
  "all purpose flour": "refined flour",
  "all-purpose flour": "refined flour",
  "enriched wheat flour": "refined flour",
  "bleached wheat flour": "refined flour",
  "bleached flour": "refined flour",
  "white flour": "refined flour",
  "plain flour": "refined flour",
  "refined flour": "refined flour",
  semolina: "semolina",
  suji: "semolina",
  sooji: "semolina",
  rava: "semolina",
  "corn starch": "corn starch",
  cornstarch: "corn starch",
  "corn flour": "corn starch",
  "tapioca starch": "tapioca starch",
  "potato starch": "potato starch",
  "modified starch": "modified starch",
  "modified food starch": "modified starch",

  // Whole grains
  "whole wheat flour": "whole wheat flour",
  "whole wheat": "whole wheat flour",
  atta: "whole wheat flour",
  "whole grain wheat": "whole wheat flour",
  "rolled oats": "rolled oats",
  "whole oats": "oats",
  "whole oat": "oats",
  oats: "oats",
  "oat flakes": "rolled oats",
  "oat flour": "oat flour",
  "brown rice": "brown rice",
  "brown rice flour": "brown rice flour",
  quinoa: "quinoa",
  millet: "millet",
  "finger millet": "millet",
  ragi: "millet",
  "foxtail millet": "millet",
  "pearl millet": "millet",
  bajra: "millet",
  jowar: "sorghum",
  sorghum: "sorghum",
  barley: "barley",
  "whole barley": "barley",
  rye: "rye",
  buckwheat: "buckwheat",
  amaranth: "amaranth",

  // Proteins
  "whey protein": "whey protein",
  "whey protein isolate": "whey protein",
  "whey protein concentrate": "whey protein",
  "milk protein": "milk protein",
  "milk protein isolate": "milk protein",
  "soy protein": "soy protein",
  "soy protein isolate": "soy protein",
  "pea protein": "pea protein",
  "pea protein isolate": "pea protein",
  casein: "casein",
  "egg white": "egg whites",
  "egg whites": "egg whites",
  almonds: "almonds",
  peanuts: "peanuts",
  walnuts: "walnuts",
  cashews: "cashews",
  lentils: "lentils",
  chickpeas: "chickpeas",

  // Fibers
  "chia seeds": "chia seeds",
  chia: "chia seeds",
  "flax seeds": "flax seeds",
  flaxseed: "flax seeds",
  "flax seed": "flax seeds",
  "psyllium husk": "psyllium husk",
  isabgol: "psyllium husk",
  "oat fiber": "oat fiber",
  "oat fibre": "oat fiber",
  "chicory root fiber": "chicory root fiber",
  inulin: "chicory root fiber",
  "apple fiber": "apple fiber",
  "wheat bran": "wheat bran",
  "oat bran": "oat bran",

  // Saturated Fats & Oils
  "palm oil": "palm oil",
  "palm kernel oil": "palm kernel oil",
  "palm fat": "palm oil",
  palmolein: "palm oil",
  "fractionated palm oil": "palm oil",
  "coconut oil": "coconut oil",
  "cocoa butter": "cocoa butter",
  "milk fat": "milk fat",
  "butter fat": "milk fat",
  butter: "butter",
  ghee: "ghee",
  lard: "lard",
  tallow: "tallow",

  // Trans Fats & Hydrogenated Oils
  "partially hydrogenated vegetable oil":
    "partially hydrogenated vegetable oil",
  "partially hydrogenated palm oil": "partially hydrogenated vegetable oil",
  "partially hydrogenated soybean oil": "partially hydrogenated vegetable oil",
  "partially hydrogenated cottonseed oil":
    "partially hydrogenated vegetable oil",
  "partially hydrogenated oil": "partially hydrogenated vegetable oil",
  "hydrogenated vegetable oil": "hydrogenated vegetable fat",
  "hydrogenated vegetable fat": "hydrogenated vegetable fat",
  "hydrogenated palm oil": "hydrogenated vegetable fat",
  vanaspati: "vanaspati",
  shortening: "shortening",
  "vegetable shortening": "shortening",
  margarine: "margarine",

  // Preservatives & INS codes
  "sodium benzoate": "sodium benzoate",
  "ins 211": "sodium benzoate",
  e211: "sodium benzoate",
  "potassium sorbate": "potassium sorbate",
  "ins 202": "potassium sorbate",
  e202: "potassium sorbate",
  "sodium nitrite": "sodium nitrite",
  "ins 250": "sodium nitrite",
  e250: "sodium nitrite",
  "sodium nitrate": "sodium nitrate",
  "ins 251": "sodium nitrate",
  e251: "sodium nitrate",
  "calcium propionate": "calcium propionate",
  "ins 282": "calcium propionate",
  e282: "calcium propionate",
  tbhq: "tbhq",
  "ins 319": "tbhq",
  e319: "tbhq",
  bht: "bht",
  "ins 321": "bht",
  e321: "bht",
  bha: "bha",
  "ins 320": "bha",
  e320: "bha",
  "potassium metabisulphite": "potassium metabisulphite",
  "ins 224": "potassium metabisulphite",
  e224: "potassium metabisulphite",
  "sodium metabisulphite": "sodium metabisulphite",
  "ins 223": "sodium metabisulphite",
  e223: "sodium metabisulphite",

  // Artificial Sweeteners
  sucralose: "sucralose",
  "ins 955": "sucralose",
  e955: "sucralose",
  aspartame: "aspartame",
  "ins 951": "aspartame",
  e951: "aspartame",
  "acesulfame potassium": "acesulfame potassium",
  "acesulfame k": "acesulfame potassium",
  "ins 950": "acesulfame potassium",
  e950: "acesulfame potassium",
  saccharin: "saccharin",
  "ins 954": "saccharin",
  e954: "saccharin",
  neotame: "neotame",
  "ins 961": "neotame",
  e961: "neotame",
  cyclamate: "cyclamate",
  "ins 952": "cyclamate",
  e952: "cyclamate",

  // Colorings
  tartrazine: "tartrazine",
  "ins 102": "tartrazine",
  e102: "tartrazine",
  "yellow 5": "tartrazine",
  "sunset yellow": "sunset yellow",
  "sunset yellow fcf": "sunset yellow",
  "ins 110": "sunset yellow",
  e110: "sunset yellow",
  "yellow 6": "sunset yellow",
  "allura red": "allura red",
  "ins 129": "allura red",
  e129: "allura red",
  "red 40": "allura red",
  "brilliant blue": "brilliant blue",
  "brilliant blue fcf": "brilliant blue",
  "ins 133": "brilliant blue",
  e133: "brilliant blue",
  "blue 1": "brilliant blue",
  "titanium dioxide": "titanium dioxide",
  "ins 171": "titanium dioxide",
  e171: "titanium dioxide",
  "caramel color": "caramel color",
  "caramel colour": "caramel color",
  "ins 150d": "caramel color",
  "ins 150a": "caramel color",
  e150d: "caramel color",
  e150a: "caramel color",
  "artificial color": "artificial color",
  "artificial colour": "artificial color",

  // Flavorings
  "monosodium glutamate": "monosodium glutamate",
  msg: "monosodium glutamate",
  "ins 621": "monosodium glutamate",
  e621: "monosodium glutamate",
  "disodium inosinate": "disodium inosinate",
  "ins 631": "disodium inosinate",
  e631: "disodium inosinate",
  "disodium guanylate": "disodium guanylate",
  "ins 627": "disodium guanylate",
  e627: "disodium guanylate",
  vanillin: "vanillin",
  "ethyl vanillin": "vanillin",
  "artificial flavor": "artificial flavor",
  "artificial flavour": "artificial flavor",
  "artificial flavoring": "artificial flavor",
  "artificial flavouring": "artificial flavor",
  "nature identical flavor": "nature identical flavor",
  "nature identical flavour": "nature identical flavor",
  "nature identical flavoring substances": "nature identical flavor",

  // Emulsifiers
  "soy lecithin": "soy lecithin",
  lecithin: "soy lecithin",
  "ins 322": "soy lecithin",
  e322: "soy lecithin",
  "mono and diglycerides": "mono- and diglycerides",
  "mono- and diglycerides": "mono- and diglycerides",
  "mono and diglycerides of fatty acids": "mono- and diglycerides",
  "ins 471": "mono- and diglycerides",
  e471: "mono- and diglycerides",
  pgpr: "pgpr",
  "polyglycerol polyricinoleate": "pgpr",
  "ins 476": "pgpr",
  e476: "pgpr",
  "polysorbate 80": "polysorbate 80",
  "ins 433": "polysorbate 80",
  e433: "polysorbate 80",
  "sodium stearoyl lactylate": "sodium stearoyl lactylate",
  "ins 481": "sodium stearoyl lactylate",
  e481: "sodium stearoyl lactylate",

  // Other Additives
  "citric acid": "citric acid",
  "ins 330": "citric acid",
  e330: "citric acid",
  "sodium bicarbonate": "sodium bicarbonate",
  "baking soda": "sodium bicarbonate",
  "ins 500": "sodium bicarbonate",
  "ins 500ii": "sodium bicarbonate",
  e500: "sodium bicarbonate",
  "baking powder": "baking powder",
  "xanthan gum": "xanthan gum",
  "ins 415": "xanthan gum",
  e415: "xanthan gum",
  "guar gum": "guar gum",
  "ins 412": "guar gum",
  e412: "guar gum",
  maltodextrin: "maltodextrin",
  "silicon dioxide": "silicon dioxide",
  "ins 551": "silicon dioxide",
  e551: "silicon dioxide",
  pectin: "pectin",
  "ins 440": "pectin",
  "ascorbic acid": "ascorbic acid",
  "vitamin c": "ascorbic acid",
  "ins 300": "ascorbic acid",
};

// 3. Pattern-based categorizers (evaluated deterministically)
const CATEGORY_RULES = [
  // TRANS FAT (Highest priority warning)
  {
    category: CATEGORIES.TRANS_FAT_SOURCE,
    impact: "negative",
    weight: -15,
    patterns: [
      /partially\s*hydrogenated/i,
      /vanaspati/i,
      /shortening/i,
      /trans\s*fat/i,
      /\bhydrogenated\s*(vegetable|palm|soybean|cottonseed|oil|fat)/i,
    ],
    explain: "Contains industrial trans fat or hydrogenated oil",
    warning:
      "Industrial trans fats are associated with adverse cardiovascular effects",
  },
  // ARTIFICIAL SWEETENER
  {
    category: CATEGORIES.ARTIFICIAL_SWEETENER,
    impact: "negative",
    weight: -10,
    patterns: [
      /sucralose/i,
      /aspartame/i,
      /acesulfame/i,
      /saccharin/i,
      /neotame/i,
      /cyclamate/i,
      /ins\s*95[01245]/i,
      /e\s*95[01245]/i,
    ],
    explain: "Contains intense non-nutritive artificial sweetener",
    warning:
      "Contains artificial sweeteners used to simulate sweetness without sugar calories",
  },
  // PRESERVATIVE
  {
    category: CATEGORIES.PRESERVATIVE,
    impact: "negative",
    weight: -6,
    patterns: [
      /sodium\s*benzoate/i,
      /potassium\s*sorbate/i,
      /sodium\s*nitr[ia]te/i,
      /calcium\s*propionate/i,
      /tbhq/i,
      /\bbht\b/i,
      /\bbha\b/i,
      /metabisulphite/i,
      /ins\s*(20[02]|211|22[34]|25[01]|282|319|32[01])/i,
      /e\s*(20[02]|211|22[34]|25[01]|282|319|32[01])/i,
    ],
    explain: "Contains chemical preservative to extend shelf life",
    warning: "Contains synthetic preservatives",
  },
  // COLORING
  {
    category: CATEGORIES.COLORING,
    impact: "negative",
    weight: -5,
    patterns: [
      /tartrazine/i,
      /sunset\s*yellow/i,
      /allura\s*red/i,
      /brilliant\s*blue/i,
      /titanium\s*dioxide/i,
      /caramel\s*colou?r/i,
      /artificial\s*colou?r/i,
      /ins\s*(102|110|129|133|150[a-d]?|171)/i,
      /e\s*(102|110|129|133|150[a-d]?|171)/i,
    ],
    explain: "Contains synthetic food coloring",
    warning: "Contains synthetic color additives added for cosmetic appearance",
  },
  // FLAVORING
  {
    category: CATEGORIES.FLAVORING,
    impact: "negative",
    weight: -4,
    patterns: [
      /artificial\s*flavo?ur/i,
      /nature\s*identical\s*flavo?ur/i,
      /monosodium\s*glutamate/i,
      /\bmsg\b/i,
      /disodium\s*(inosinate|guanylate)/i,
      /vanillin/i,
      /ins\s*(621|627|631)/i,
      /e\s*(621|627|631)/i,
    ],
    explain: "Contains synthetic flavor enhancer or artificial flavoring",
  },
  // EMULSIFIER
  {
    category: CATEGORIES.EMULSIFIER,
    impact: "negative",
    weight: -3,
    patterns: [
      /lecithin/i,
      /mono[- ]and\s*diglycerides/i,
      /polysorbate/i,
      /pgpr/i,
      /polyglycerol\s*polyricinoleate/i,
      /stearoyl\s*lactylate/i,
      /ins\s*(322|433|471|476|481)/i,
      /e\s*(322|433|471|476|481)/i,
    ],
    explain: "Contains emulsifier for structural consistency",
  },
  // SATURATED FAT SOURCE
  {
    category: CATEGORIES.SATURATED_FAT_SOURCE,
    impact: "negative",
    weight: -8,
    patterns: [
      /\bpalm\s*(oil|fat|kernel|olein)/i,
      /coconut\s*oil/i,
      /cocoa\s*butter/i,
      /milk\s*fat/i,
      /butter\s*fat/i,
      /\bbutter\b/i,
      /\bghee\b/i,
      /\blard\b/i,
      /\btallow\b/i,
    ],
    explain: "Contains high saturated fat source",
  },
  // SUGAR
  {
    category: CATEGORIES.SUGAR,
    impact: "negative",
    weight: -8,
    patterns: [
      /\bsugar\b/i,
      /sucrose/i,
      /cane\s*sugar/i,
      /beet\s*sugar/i,
      /corn\s*syrup/i,
      /high\s*fructose/i,
      /\bglucose\b/i,
      /\bfructose\b/i,
      /\bdextrose\b/i,
      /jaggery/i,
      /\bgur\b/i,
      /\bmolasses\b/i,
      /golden\s*syrup/i,
      /invert\s*sugar/i,
      /\bhoney\b/i,
      /maple\s*syrup/i,
      /\bmaltose\b/i,
    ],
    explain: "Contains refined sugar or high-glycemic caloric sweetener",
  },
  // REFINED GRAIN
  {
    category: CATEGORIES.REFINED_GRAIN,
    impact: "negative",
    weight: -7,
    patterns: [
      /refined\s*(wheat\s*)?flour/i,
      /\bmaida\b/i,
      /all[- ]purpose\s*flour/i,
      /enriched\s*(wheat\s*)?flour/i,
      /bleached\s*(wheat\s*)?flour/i,
      /white\s*flour/i,
      /semolina/i,
      /\bsuji\b/i,
      /\bsooji\b/i,
      /corn\s*starch/i,
      /cornstarch/i,
      /modified\s*starch/i,
      /tapioca\s*starch/i,
    ],
    explain: "Contains refined grain stripped of bran and germ",
  },
  // WHOLE GRAIN
  {
    category: CATEGORIES.WHOLE_GRAIN,
    impact: "positive",
    weight: 10,
    patterns: [
      /whole\s*wheat/i,
      /whole\s*grain/i,
      /whole\s*oat/i,
      /rolled\s*oat/i,
      /\boats?\b/i,
      /oat\s*flakes/i,
      /oat\s*flour/i,
      /brown\s*rice/i,
      /quinoa/i,
      /multigrain/i,
      /\bmillet\b/i,
      /\bragi\b/i,
      /barley/i,
      /\brye\b/i,
      /buckwheat/i,
      /sorghum/i,
      /\bflax\s*seed/i,
      /\bchia\b/i,
      /amaranth/i,
      /\batta\b/i,
    ],
    explain:
      "Contains whole grain ingredients providing dietary fiber and minerals",
  },
  // FIBER SOURCE
  {
    category: CATEGORIES.FIBER_SOURCE,
    impact: "positive",
    weight: 8,
    patterns: [
      /chia\s*seed/i,
      /flax\s*seed/i,
      /psyllium/i,
      /isabgol/i,
      /oat\s*fib[er]{2}/i,
      /chicory\s*root/i,
      /inulin/i,
      /wheat\s*bran/i,
      /oat\s*bran/i,
      /dietary\s*fib[er]{2}/i,
    ],
    explain: "Contains dietary fiber source promoting digestive health",
  },
  // PROTEIN SOURCE
  {
    category: CATEGORIES.PROTEIN_SOURCE,
    impact: "positive",
    weight: 8,
    patterns: [
      /whey\s*protein/i,
      /soy\s*protein/i,
      /pea\s*protein/i,
      /milk\s*protein/i,
      /casein/i,
      /egg\s*whites?/i,
      /almonds?/i,
      /peanuts?/i,
      /walnuts?/i,
      /cashews?/i,
      /lentils?/i,
      /chickpeas?/i,
    ],
    explain: "Contains quality protein source",
  },
  // OTHER ADDITIVE
  {
    category: CATEGORIES.OTHER_ADDITIVE,
    impact: "neutral",
    weight: 0,
    patterns: [
      /citric\s*acid/i,
      /sodium\s*bicarbonate/i,
      /baking\s*soda/i,
      /baking\s*powder/i,
      /xanthan\s*gum/i,
      /guar\s*gum/i,
      /maltodextrin/i,
      /silicon\s*dioxide/i,
      /pectin/i,
      /ascorbic\s*acid/i,
      /ins\s*(300|330|412|415|440|500|551)/i,
      /e\s*(300|330|412|415|440|500|551)/i,
    ],
    explain: "Contains functional food additive",
  },
];

class IngredientAnalysisService {
  constructor() {
    this.categories = CATEGORIES;
    this.categoryList = CATEGORY_LIST;
  }

  /**
   * Deterministic check flag
   */
  isDeterministic() {
    return true;
  }

  /**
   * Normalizes a single ingredient name string.
   *
   * Exact prompt mappings guaranteed:
   * - "sucrose" -> "sugar"
   * - "table sugar" -> "sugar"
   * - "sodium chloride" -> "salt"
   * - "refined wheat flour" -> "refined flour"
   * - "maida" -> "refined flour"
   *
   * @param {string} raw - raw ingredient text
   * @returns {string} normalized ingredient name
   */
  normalizeIngredient(raw = "") {
    if (!raw || typeof raw !== "string") return "";

    // 1. Clean formatting: lowercase, remove brackets/percentages/special punctuation
    let cleaned = raw
      .toLowerCase()
      // Remove percentages like (45%) or 70%
      .replace(/\(?\b\d+(\.\d+)?%\)?/g, "")
      // Remove trailing and leading punctuation/bullets
      .replace(/^[•*#_\-\s]+|[•*#_\-\s,;.:]+$/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleaned) return "";

    // 2. Direct exact dictionary lookup
    if (EXACT_NORMALIZATION_MAP[cleaned]) {
      return EXACT_NORMALIZATION_MAP[cleaned];
    }

    // 3. Secondary match: strip common parenthetical details e.g. "maida (flour)" -> "maida"
    const withoutParens = cleaned.replace(/\s*\([^)]*\)/g, "").trim();
    if (EXACT_NORMALIZATION_MAP[withoutParens]) {
      return EXACT_NORMALIZATION_MAP[withoutParens];
    }

    // 4. Core prompt regex transforms
    if (/^sucrose$/i.test(cleaned) || /^table\s*sugar$/i.test(cleaned)) {
      return "sugar";
    }
    if (/^sodium\s*chloride$/i.test(cleaned)) {
      return "salt";
    }
    if (/^(refined\s*wheat\s*flour|maida(\s*flour)?)$/i.test(cleaned)) {
      return "refined flour";
    }

    // 5. Pattern-based fallback normalizations for broad coverage
    if (/\b(partially\s*hydrogenated|vanaspati)\b/i.test(cleaned)) {
      return "partially hydrogenated vegetable oil";
    }
    if (/\bhydrogenated\s*(vegetable|palm|fat|oil)\b/i.test(cleaned)) {
      return "hydrogenated vegetable fat";
    }
    if (/^palm\s*(oil|fat|kernel|olein)/i.test(cleaned)) {
      return "palm oil";
    }
    if (
      /^whole\s*(wheat|grain\s*wheat)/i.test(cleaned) ||
      /^atta$/i.test(cleaned)
    ) {
      return "whole wheat flour";
    }
    if (/^rolled\s*oats?$/i.test(cleaned) || /^oats?$/i.test(cleaned)) {
      return "rolled oats";
    }
    if (/^refined\s*(wheat\s*)?flour$/i.test(cleaned)) {
      return "refined flour";
    }

    // If no specific dictionary replacement matched, return clean simplified text
    return withoutParens || cleaned;
  }

  /**
   * Categorizes a normalized or raw ingredient into matching categories from the 13 categories.
   *
   * @param {string} normalizedName
   * @param {string} rawName
   * @returns {Array<string>} list of matched category strings
   */
  categorizeIngredient(normalizedName = "", rawName = "") {
    const combined = `${normalizedName} ${rawName}`.trim().toLowerCase();
    const matchedCategories = new Set();

    for (const rule of CATEGORY_RULES) {
      for (const pattern of rule.patterns) {
        if (pattern.test(combined)) {
          matchedCategories.add(rule.category);
          break;
        }
      }
    }

    return Array.from(matchedCategories);
  }

  /**
   * Parses raw ingredient input (string, array of strings, or array of objects)
   * into a clean array of raw ingredient strings.
   *
   * @param {string|Array} rawInput
   * @returns {Array<string>}
   */
  parseRawIngredients(rawInput) {
    if (!rawInput) return [];

    let items = [];

    if (Array.isArray(rawInput)) {
      for (const entry of rawInput) {
        if (typeof entry === "string") {
          items.push(entry);
        } else if (entry && typeof entry === "object") {
          items.push(entry.name || entry.normalized_name || entry.raw || "");
        }
      }
    } else if (typeof rawInput === "string") {
      // Strip leading "Ingredients:" header if present
      let text = rawInput.replace(/^(?:Ingredients?|INGREDIENTS?)[:\s|]*/i, "");
      // Split by comma, semicolon, bullet points, newlines
      items = text.split(/[,;\n•|]/);
    }

    return items
      .map((item) => item.replace(/^[•*#_\-\s]+|[•*#_\-\s,;.:]+$/g, "").trim())
      .filter((item) => {
        if (item.length <= 1) return false;
        const lower = item.toLowerCase();
        // Ignore allergen / packaging disclaimer tails
        if (
          lower.startsWith("contains") ||
          lower.startsWith("may contain") ||
          lower.startsWith("manufactured") ||
          lower.startsWith("allergen")
        ) {
          return false;
        }
        return true;
      });
  }

  /**
   * Main analysis entrypoint.
   * Converts raw ingredients into normalized ingredients, categorizes them,
   * and produces explainable positives, negatives, and warnings.
   *
   * Output schema:
   * {
   *   normalizedIngredients: [],
   *   categories: [],
   *   positives: [],
   *   negatives: [],
   *   warnings: []
   * }
   *
   * @param {string|Array} rawInput
   * @returns {Object} Structured analysis output
   */
  analyze(rawInput) {
    const rawList = this.parseRawIngredients(rawInput);

    const normalizedIngredients = [];
    const detectedCategorySet = new Set();
    const details = [];

    const categoryItemMap = {};
    for (const cat of CATEGORY_LIST) {
      categoryItemMap[cat] = [];
    }

    const positives = [];
    const negatives = [];
    const warnings = [];

    // 1. Process each ingredient deterministically
    for (const raw of rawList) {
      const normalized = this.normalizeIngredient(raw);
      if (!normalized) continue;

      normalizedIngredients.push(normalized);

      const matchedCategories = this.categorizeIngredient(normalized, raw);
      for (const cat of matchedCategories) {
        detectedCategorySet.add(cat);
        if (!categoryItemMap[cat].includes(normalized)) {
          categoryItemMap[cat].push(normalized);
        }
      }

      details.push({
        raw,
        normalized,
        categories: matchedCategories,
      });
    }

    // 2. Generate Deterministic & Explainable Positives
    if (categoryItemMap[CATEGORIES.WHOLE_GRAIN].length > 0) {
      const items = categoryItemMap[CATEGORIES.WHOLE_GRAIN];
      positives.push(
        `Contains whole grain ingredients (${items.slice(0, 3).join(", ")})`,
      );
    }

    if (categoryItemMap[CATEGORIES.FIBER_SOURCE].length > 0) {
      const items = categoryItemMap[CATEGORIES.FIBER_SOURCE];
      positives.push(
        `Contains natural fiber sources (${items.slice(0, 3).join(", ")})`,
      );
    }

    if (categoryItemMap[CATEGORIES.PROTEIN_SOURCE].length > 0) {
      const items = categoryItemMap[CATEGORIES.PROTEIN_SOURCE];
      positives.push(
        `Contains quality protein sources (${items.slice(0, 3).join(", ")})`,
      );
    }

    // 3. Generate Deterministic & Explainable Negatives
    if (categoryItemMap[CATEGORIES.TRANS_FAT_SOURCE].length > 0) {
      const items = categoryItemMap[CATEGORIES.TRANS_FAT_SOURCE];
      negatives.push(
        `Contains industrial trans fats or hydrogenated oils (${items.join(", ")})`,
      );
    }

    if (categoryItemMap[CATEGORIES.SATURATED_FAT_SOURCE].length > 0) {
      const items = categoryItemMap[CATEGORIES.SATURATED_FAT_SOURCE];
      negatives.push(
        `Contains refined fats or high saturated fat sources (${items.slice(0, 2).join(", ")})`,
      );
    }

    if (categoryItemMap[CATEGORIES.REFINED_GRAIN].length > 0) {
      const items = categoryItemMap[CATEGORIES.REFINED_GRAIN];
      negatives.push(
        `Contains refined grain ingredients with reduced nutritional density (${items.slice(0, 2).join(", ")})`,
      );
    }

    if (categoryItemMap[CATEGORIES.SUGAR].length > 0) {
      const items = categoryItemMap[CATEGORIES.SUGAR];
      negatives.push(
        `Contains added sugar or high-glycemic caloric sweeteners (${items.slice(0, 2).join(", ")})`,
      );
    }

    // Refined additive collective notice (for backwards compatibility with existing engine)
    const additiveItems = [
      ...categoryItemMap[CATEGORIES.TRANS_FAT_SOURCE],
      ...categoryItemMap[CATEGORIES.SATURATED_FAT_SOURCE],
      ...categoryItemMap[CATEGORIES.ARTIFICIAL_SWEETENER],
      ...categoryItemMap[CATEGORIES.PRESERVATIVE],
      ...categoryItemMap[CATEGORIES.COLORING],
      ...categoryItemMap[CATEGORIES.FLAVORING],
    ];
    if (additiveItems.length > 0) {
      negatives.push(
        `Contains refined fats or artificial additives (${additiveItems.slice(0, 2).join(", ")})`,
      );
    }

    // 4. Generate Deterministic & Explainable Warnings
    if (categoryItemMap[CATEGORIES.TRANS_FAT_SOURCE].length > 0) {
      warnings.push(
        `Contains industrial trans fats (${categoryItemMap[CATEGORIES.TRANS_FAT_SOURCE].join(", ")}); zero intake is recommended for cardiovascular health.`,
      );
    }

    if (categoryItemMap[CATEGORIES.ARTIFICIAL_SWEETENER].length > 0) {
      warnings.push(
        `Contains non-nutritive artificial sweeteners (${categoryItemMap[CATEGORIES.ARTIFICIAL_SWEETENER].join(", ")}).`,
      );
    }

    if (categoryItemMap[CATEGORIES.PRESERVATIVE].length > 0) {
      warnings.push(
        `Contains synthetic chemical preservatives (${categoryItemMap[CATEGORIES.PRESERVATIVE].join(", ")}).`,
      );
    }

    if (categoryItemMap[CATEGORIES.COLORING].length > 0) {
      warnings.push(
        `Contains artificial food coloring (${categoryItemMap[CATEGORIES.COLORING].join(", ")}).`,
      );
    }

    // Ensure category list order is deterministic
    const categories = CATEGORY_LIST.filter((cat) =>
      detectedCategorySet.has(cat),
    );

    return {
      normalizedIngredients,
      categories,
      positives,
      negatives,
      warnings,
      // Supplemental structured details for rich API/UI consumption
      details,
      categorizedIngredients: categoryItemMap,
    };
  }
}

// Singleton export
const defaultService = new IngredientAnalysisService();

module.exports = defaultService;
module.exports.IngredientAnalysisService = IngredientAnalysisService;
module.exports.CATEGORIES = CATEGORIES;
module.exports.CATEGORY_LIST = CATEGORY_LIST;
