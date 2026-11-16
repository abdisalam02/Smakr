import fs from "fs";

let content = fs.readFileSync("frontend/src/lib/taxonomy.ts", "utf8");

// 1. Also update FOOD_GROUPS to eliminate the redundant 'breads' group & Masala Politics grouping
content = content.replace(
  /\{\r?\n\s*id: "pastries_bakery",\r?\n\s*label: "Pastries & Bakery",\r?\n\s*shortLabel: "Pastries",\r?\n\s*heroIcon: "croissant",\r?\n\s*childCategories: \["croissant", "cinnamon_roll", "kanelbolle", "cardamom_bun", "bagel", "waffle", "bakery", "sourdough_loaf"\],\r?\n\s*\},/,
  `{\r\n    id: "pastries_bakery",\r\n    label: "Bakery & Sourdough",\r\n    shortLabel: "Bakery",\r\n    heroIcon: "croissant",\r\n    childCategories: ["croissant", "cinnamon_roll", "kanelbolle", "cardamom_bun", "bagel", "waffle", "bakery", "sourdough", "sourdough_loaf", "bread", "breads"],\r\n  },`
);

content = content.replace(
  /\{\r?\n\s*id: "breads",\r?\n\s*label: "Breads & Flatbreads",\r?\n\s*shortLabel: "Breads",\r?\n\s*heroIcon: "naan",\r?\n\s*childCategories: \["naan", "flatbread", "sourdough"\],\r?\n\s*\},/,
  `{\r\n    id: "breads",\r\n    label: "Breads & Flatbreads",\r\n    shortLabel: "Breads",\r\n    heroIcon: "naan",\r\n    childCategories: [],\r\n  },`
);

content = content.replace(
  /\{\r?\n\s*id: "rice_bowls",\r?\n\s*label: "Rice & Bowls",\r?\n\s*shortLabel: "Rice",\r?\n\s*heroIcon: "indian",\r?\n\s*childCategories: \["mandi_rice", "curry", "indian", "bibimbap", "poke"\],\r?\n\s*\},/,
  `{\r\n    id: "rice_bowls",\r\n    label: "Rice & Curry",\r\n    shortLabel: "Rice & Curry",\r\n    heroIcon: "indian",\r\n    childCategories: ["mandi_rice", "curry", "indian", "naan", "flatbread", "bibimbap", "poke"],\r\n  },`
);

// 2. Fix Masala Politics in resolveEntityTaxonomy so dishCategory is "curry" (Rice & Curry) instead of "naan" (Breads)
content = content.replace(
  /\} else if \(candidateCat === "naan" \|\| candidateCat === "flatbread" \|\| allText\.includes\("naan"\) \|\| allText\.includes\("garlic naan"\)\) \{\r?\n\s*dishCategory = "naan";/,
  `} else if (allText.includes("masala politics")) {\r\n    dishCategory = "curry";\r\n  } else if (candidateCat === "naan" || candidateCat === "flatbread" || allText.includes("naan") || allText.includes("garlic naan")) {\r\n    dishCategory = "naan";`
);

// 3. Fix Cuisines inference in resolveEntityTaxonomy
const oldCuisinesStart = "  // 3. Resolve Cuisines";
const oldCuisinesEnd = "  // 4. Resolve Diets";

const cStartIndex = content.indexOf(oldCuisinesStart);
const cEndIndex = content.indexOf(oldCuisinesEnd);

if (cStartIndex !== -1 && cEndIndex !== -1) {
  const newCuisinesCode = `  // 3. Resolve Cuisines (Only for authentic cultural cuisines, never inferred merely from generic items like pizza or croissants)
  const cuisines: CuisineId[] = [];
  if (allText.includes("vietnam") || allText.includes("em oi") || allText.includes("êm ôi") || allText.includes("lai zai") || (allText.includes("banh mi") && !allText.includes("burger"))) {
    cuisines.push("vietnamese");
  }
  if (allText.includes("korean") || allText.includes("k-fried") || candidateCat === "kbbq" || allText.includes("175°c") || allText.includes("175 c")) {
    cuisines.push("korean");
  }
  if (allText.includes("japan") || allText.includes("miso ramen") || allText.includes("ochaya") || dishCategory === "ramen" || dishCategory === "matcha") {
    if (!allText.includes("crave")) {
      cuisines.push("japanese");
    }
  }
  if (allText.includes("china") || allText.includes("chinese") || allText.includes("canton") || allText.includes("dim sum") || allText.includes("yum cha") || allText.includes("szechuan") || allText.includes("chengdu")) {
    cuisines.push("chinese");
  }
  if (allText.includes("india") || allText.includes("pakistan") || allText.includes("masala") || dishCategory === "curry" || dishCategory === "indian") {
    cuisines.push("indian_pakistani");
  }
  if (allText.includes("italy") || allText.includes("italian") || allText.includes("trattoria") || allText.includes("osteria")) {
    cuisines.push("italian");
  }
  if (allText.includes("mexic") || allText.includes("taqueria") || allText.includes("birria")) {
    cuisines.push("mexican");
  }
  if (allText.includes("yemen") || allText.includes("somali") || dishCategory === "mandi_rice" || allText.includes("mandi house")) {
    cuisines.push("yemeni_somali");
  }
  if (allText.includes("nordic seafood") || candidateCat === "nordic_seafood") {
    cuisines.push("nordic");
  }
  if (allText.includes("french bistro") || allText.includes("creperie") || candidateCat === "french") {
    cuisines.push("french");
  }
  if (allText.includes("middle eastern") || candidateCat === "middle_eastern" || allText.includes("levantine")) {
    cuisines.push("middle_eastern");
  }

`;
  content = content.slice(0, cStartIndex) + newCuisinesCode + content.slice(cEndIndex);
}

// 4. Clean up VenueDisplayBadge section
const bStart = content.indexOf("export interface VenueDisplayBadge {");
const bEnd = content.indexOf("export function resolveDishIconKey(");

if (bStart === -1 || bEnd === -1) {
  console.error("Could not find badge markers!");
  process.exit(1);
}

const newBadgeSection = `export interface VenueDisplayBadge {
  flag?: string;
  mainTag: string;
  pinIcon: string;
  filterTags: string[];
}

/**
 * Deterministic Venue Display Badge Resolver (1 Main Tag Only for Card Header).
 * Provides clean Flag + 1 Short Main Tag (e.g. "🇮🇳 INDIAN", "🇻🇳 VIETNAMESE", "🇯🇵 MATCHA")
 * while preserving the specific pinIcon for map markers.
 * FLAGS are strictly reserved for authentic cultural/origin kitchens; bakeries, pizza spots,
 * coffee bars, and local comfort joints display clean uppercase category tags without flags.
 */
export function resolveVenueDisplayBadge(venue?: Partial<Venue> | null): VenueDisplayBadge {
  if (!venue) {
    return { mainTag: "FOOD", pinIcon: "all", filterTags: ["food"] };
  }

  const nameLower = (venue.name || "").toLowerCase().trim();
  const catLower = (venue.food_category || (venue as any).category || "").toLowerCase().trim();
  const iconLower = (venue.icon || "").toLowerCase().trim();

  // 1. Specific Curated Spot Matches (Oslo Core DB)
  if (nameLower.includes("masala politics") || catLower === "naan") {
    return { flag: "🇮🇳", mainTag: "INDIAN", pinIcon: "naan", filterTags: ["indian", "curry", "halal", "dinner"] };
  }
  if (nameLower.includes("em oi") || nameLower.includes("êm ôi")) {
    return { flag: "🇻🇳", mainTag: "VIETNAMESE", pinIcon: "banh_mi", filterTags: ["vietnamese", "banh_mi", "coffee", "street_food", "lunch"] };
  }
  if (nameLower.includes("lai zai")) {
    return { flag: "🇻🇳", mainTag: "VIETNAMESE", pinIcon: "banh_mi", filterTags: ["vietnamese", "street_food", "lunch"] };
  }
  if (nameLower.includes("ochaya")) {
    return { flag: "🇯🇵", mainTag: "MATCHA", pinIcon: "matcha", filterTags: ["matcha", "tea", "japanese", "drinks"] };
  }
  if (nameLower.includes("miso ramen")) {
    return { flag: "🇯🇵", mainTag: "RAMEN", pinIcon: "ramen", filterTags: ["ramen", "noodles", "japanese", "dinner"] };
  }
  if (nameLower.includes("kuro")) {
    return { mainTag: "COFFEE & TEA", pinIcon: "coffee", filterTags: ["coffee", "tea", "minimalist", "drinks"] };
  }
  if (nameLower.includes("daglig brød") || nameLower.includes("daglig brod")) {
    return { mainTag: "BAKERY", pinIcon: "croissant", filterTags: ["bakery", "sourdough", "bread", "pastries"] };
  }
  if (nameLower.includes("håndbakt") || nameLower.includes("handbakt")) {
    return { mainTag: "BAKERY", pinIcon: "croissant", filterTags: ["bakery", "sourdough", "brunch", "organic", "pastries"] };
  }
  if (nameLower.includes("kveitemjøl") || nameLower.includes("kveitemjol")) {
    return { mainTag: "BAKERY", pinIcon: "croissant", filterTags: ["bakery", "pastries", "croissant"] };
  }
  if (nameLower.includes("fuglen")) {
    return { mainTag: "COFFEE", pinIcon: "coffee", filterTags: ["coffee", "specialty_coffee", "roastery"] };
  }
  if (nameLower.includes("mandi house")) {
    return { flag: "🇾🇪", mainTag: "YEMENI", pinIcon: "mandi_rice", filterTags: ["mandi_rice", "yemeni", "halal", "dinner"] };
  }
  if (nameLower.includes("yum cha")) {
    return { flag: "🇭🇰", mainTag: "DIM SUM", pinIcon: "dumplings", filterTags: ["dim_sum", "dumplings", "cantonese", "asian"] };
  }
  if (nameLower.includes("175°c") || nameLower.includes("175 c") || nameLower.includes("k-fried")) {
    return { flag: "🇰🇷", mainTag: "K-CHICKEN", pinIcon: "k_chicken", filterTags: ["k_chicken", "fried_chicken", "korean", "halal"] };
  }
  if (nameLower.includes("zam zam") || nameLower.includes("zamzam")) {
    return { mainTag: "CHEESESTEAK", pinIcon: "cheesesteak", filterTags: ["cheesesteak", "halal", "street_food"] };
  }
  if (nameLower.includes("dirty taco")) {
    return { mainTag: "TACOS", pinIcon: "tacos", filterTags: ["tacos", "street_food", "late_night"] };
  }
  if (nameLower.includes("digg pizza")) {
    return { mainTag: "PIZZA", pinIcon: "pizza", filterTags: ["pizza", "roman_pizza", "dinner"] };
  }
  if (nameLower.includes("stykke")) {
    return { mainTag: "PIZZA", pinIcon: "pizza", filterTags: ["pizza", "roman_pizza", "slices"] };
  }
  if (nameLower.includes("cocoa")) {
    return { mainTag: "COCOA BAR", pinIcon: "coffee", filterTags: ["dessert", "cocoa", "chocolate", "drinks"] };
  }
  if (nameLower.includes("crave")) {
    return { mainTag: "PANCAKES", pinIcon: "pancakes", filterTags: ["dessert", "pancakes", "toast", "sweet"] };
  }
  if (nameLower.includes("u wan sum")) {
    return { mainTag: "DRINKS POP-UP", pinIcon: "drinks", filterTags: ["popup", "coffee", "matcha", "drinks"] };
  }

  // 2. Additional Known Candidates & Pop-Ups
  if (nameLower.includes("farine")) {
    return { mainTag: "BAKERY", pinIcon: "croissant", filterTags: ["bakery", "sourdough", "pastries"] };
  }
  if (nameLower.includes("tomodomo")) {
    return { flag: "🇯🇵", mainTag: "RAMEN & UDON", pinIcon: "ramen", filterTags: ["ramen", "udon", "noodle", "japanese", "popup"] };
  }
  if (nameLower.includes("waaj")) {
    return { flag: "🇲🇽", mainTag: "TACOS", pinIcon: "tacos", filterTags: ["tacos", "mexican", "street_food", "food_truck"] };
  }
  if (nameLower.includes("aleppo bahebek")) {
    return { flag: "🇸🇾", mainTag: "SHAWARMA", pinIcon: "kebab", filterTags: ["syrian", "middle_eastern", "halal", "street_food"] };
  }
  if (nameLower.includes("crantz cookies") || nameLower.includes("sukkerbakeriet")) {
    return { mainTag: "COOKIES", pinIcon: "croissant", filterTags: ["dessert", "cookies", "bakery", "popup"] };
  }
  if (nameLower.includes("mint on wheels")) {
    return { flag: "🇯🇵", mainTag: "MATCHA", pinIcon: "matcha", filterTags: ["matcha", "tea", "popup", "drinks"] };
  }
  if (nameLower.includes("dæsj") || nameLower.includes("daesj")) {
    return { mainTag: "GELATO", pinIcon: "gelato", filterTags: ["gelato", "dessert", "popup"] };
  }
  if (nameLower.includes("koie ramen")) {
    return { flag: "🇯🇵", mainTag: "RAMEN", pinIcon: "ramen", filterTags: ["ramen", "japanese", "noodles", "asian"] };
  }
  if (nameLower.includes("vinoteket")) {
    return { mainTag: "PIZZA & WINE", pinIcon: "pizza", filterTags: ["pizza", "natural_wine"] };
  }
  if (nameLower.includes("king falafel")) {
    return { flag: "🇵🇸", mainTag: "FALAFEL", pinIcon: "kebab", filterTags: ["falafel", "vegan", "street_food"] };
  }
  if (nameLower.includes("chaiwala")) {
    return { flag: "🇵🇰", mainTag: "PAKISTANI", pinIcon: "curry", filterTags: ["pakistani", "halal", "street_food", "chai"] };
  }
  if (nameLower.includes("pele pele")) {
    return { flag: "🇬🇭", mainTag: "WEST AFRICAN", pinIcon: "k_chicken", filterTags: ["african", "street_food", "grill", "spicy", "halal"] };
  }
  if (nameLower.includes("noods")) {
    return { flag: "🇨🇳", mainTag: "NOODLES", pinIcon: "ramen", filterTags: ["noodles", "chinese", "asian", "spicy"] };
  }
  if (nameLower.includes("szechuan chengdu")) {
    return { flag: "🇨🇳", mainTag: "SICHUAN", pinIcon: "curry", filterTags: ["chinese", "sichuan", "spicy", "asian"] };
  }
  if (nameLower.includes("izakaya")) {
    return { flag: "🇯🇵", mainTag: "IZAKAYA", pinIcon: "dumplings", filterTags: ["japanese", "izakaya", "asian", "drinks", "dinner"] };
  }
  if (nameLower.includes("syverkiosken")) {
    return { mainTag: "STREET FOOD", pinIcon: "street_food", filterTags: ["street_food", "heritage", "sausage", "kiosk"] };
  }
  if (nameLower.includes("the little pickle")) {
    return { mainTag: "BISTRO", pinIcon: "natural_wine", filterTags: ["natural_wine", "bistro", "seasonal", "dinner"] };
  }
  if (nameLower.includes("marani")) {
    return { flag: "🇬🇪", mainTag: "GEORGIAN", pinIcon: "dumplings", filterTags: ["georgian", "khinkali", "khachapuri", "wine"] };
  }
  if (nameLower.includes("gazakjøkken") || nameLower.includes("gazakjokken")) {
    return { flag: "🇵🇸", mainTag: "MIDDLE EASTERN", pinIcon: "kebab", filterTags: ["palestinian", "middle_eastern", "halal", "shawarma"] };
  }
  if (nameLower.includes("silin bakeri")) {
    return { mainTag: "BAKERY", pinIcon: "croissant", filterTags: ["bakery", "flatbread", "halal"] };
  }
  if (nameLower.includes("becco")) {
    return { mainTag: "NATURAL WINE", pinIcon: "natural_wine", filterTags: ["natural_wine", "wine_bar", "popup", "drinks"] };
  }
  if (nameLower.includes("lasarett")) {
    return { mainTag: "WINE & BITES", pinIcon: "natural_wine", filterTags: ["natural_wine", "wine_bar", "popup", "guest_chef"] };
  }

  // 3. Fallbacks Based on food_category and icon (Clean tags; flags ONLY for authentic cultural cuisines)
  if (catLower === "ramen" || iconLower === "ramen") {
    return { flag: "🇯🇵", mainTag: "RAMEN", pinIcon: "ramen", filterTags: ["ramen", "noodles", "japanese"] };
  }
  if (catLower === "matcha" || iconLower === "matcha") {
    return { flag: "🇯🇵", mainTag: "MATCHA", pinIcon: "matcha", filterTags: ["matcha", "tea", "japanese", "drinks"] };
  }
  if (catLower === "pizza" || iconLower === "pizza") {
    return { mainTag: "PIZZA", pinIcon: "pizza", filterTags: ["pizza", "dinner"] };
  }
  if (catLower === "pasta" || iconLower === "pasta") {
    return { mainTag: "PASTA", pinIcon: "pasta", filterTags: ["pasta", "dinner"] };
  }
  if (catLower === "tacos" || iconLower === "tacos") {
    return { mainTag: "TACOS", pinIcon: "tacos", filterTags: ["tacos", "street_food"] };
  }
  if (catLower === "k_chicken" || iconLower === "k_chicken") {
    return { flag: "🇰🇷", mainTag: "K-CHICKEN", pinIcon: "k_chicken", filterTags: ["k_chicken", "korean", "chicken"] };
  }
  if (catLower === "dumplings" || iconLower === "dumplings" || catLower === "bao") {
    return { flag: "🇭🇰", mainTag: "DUMPLINGS", pinIcon: "dumplings", filterTags: ["dumplings", "dim_sum", "asian"] };
  }
  if (catLower === "bakery" || catLower === "cinnamon_roll" || iconLower === "croissant") {
    return { mainTag: "BAKERY", pinIcon: "croissant", filterTags: ["bakery", "sourdough", "pastries"] };
  }
  if (catLower === "coffee" || iconLower === "coffee") {
    return { mainTag: "COFFEE", pinIcon: "coffee", filterTags: ["coffee", "specialty_coffee", "drinks"] };
  }
  if (catLower === "natural_wine" || catLower === "drinks" || iconLower === "natural_wine" || iconLower === "drinks") {
    return { mainTag: "NATURAL WINE", pinIcon: "natural_wine", filterTags: ["natural_wine", "wine", "drinks"] };
  }
  if (catLower === "gelato" || catLower === "dessert" || iconLower === "gelato") {
    return { mainTag: "DESSERT", pinIcon: "gelato", filterTags: ["dessert", "gelato", "sweets"] };
  }
  if (venue.spot_type === "popup") {
    return { mainTag: "POP-UP", pinIcon: "drinks", filterTags: ["popup", "seasonal"] };
  }
  if (venue.spot_type === "food_truck") {
    return { mainTag: "FOOD TRUCK", pinIcon: "street_food", filterTags: ["food_truck", "street_food"] };
  }

  return {
    mainTag: (venue.food_category || (venue as any).category || "FOOD").toUpperCase(),
    pinIcon: venue.icon || "all",
    filterTags: ["food"],
  };
}

`;

content = content.slice(0, bStart) + newBadgeSection + content.slice(bEnd);

fs.writeFileSync("frontend/src/lib/taxonomy.ts", content, "utf8");
console.log("Updated taxonomy.ts successfully!");
