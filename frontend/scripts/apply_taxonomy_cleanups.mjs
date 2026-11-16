import fs from "fs";
import path from "path";

// 1. Update frontend/src/components/map/MapRadarView.tsx
const mapRadarPath = path.resolve("frontend/src/components/map/MapRadarView.tsx");
let mapRadarContent = fs.readFileSync(mapRadarPath, "utf8");

// Target block in MapRadarView.tsx
const targetSpanOld = `<span style="display:inline-flex;align-items:center;justify-content:center;font-size:15px;line-height:1;flex-shrink:0;">
            \${venueBadge.flag}
          </span>`;

const targetSpanNew = `\${venueBadge.flag ? \`
            <span style="display:inline-flex;align-items:center;justify-content:center;font-size:14px;line-height:1;flex-shrink:0;">
              \${venueBadge.flag}
            </span>
          \` : ""}`;

if (mapRadarContent.includes(targetSpanOld)) {
  mapRadarContent = mapRadarContent.replace(targetSpanOld, targetSpanNew);
  fs.writeFileSync(mapRadarPath, mapRadarContent, "utf8");
  console.log("Updated MapRadarView.tsx successfully (only render flag if present).");
} else {
  // Try CRLF / LF flexible replacement
  const regex = /<span style="display:inline-flex;align-items:center;justify-content:center;font-size:15px;line-height:1;flex-shrink:0;">\r?\n\s*\$\{venueBadge\.flag\}\r?\n\s*<\/span>/;
  if (regex.test(mapRadarContent)) {
    mapRadarContent = mapRadarContent.replace(
      regex,
      `\${venueBadge.flag ? \`\n            <span style="display:inline-flex;align-items:center;justify-content:center;font-size:14px;line-height:1;flex-shrink:0;">\n              \${venueBadge.flag}\n            </span>\n          \` : ""}`
    );
    fs.writeFileSync(mapRadarPath, mapRadarContent, "utf8");
    console.log("Updated MapRadarView.tsx via regex successfully.");
  } else {
    console.warn("Could not find target flag span in MapRadarView.tsx");
  }
}

// 2. Update frontend/src/lib/taxonomy.ts
const taxPath = path.resolve("frontend/src/lib/taxonomy.ts");
let taxContent = fs.readFileSync(taxPath, "utf8");

// Update VenueDisplayBadge interface
taxContent = taxContent.replace(
  /export interface VenueDisplayBadge \{\r?\n\s*flag: string;/g,
  `export interface VenueDisplayBadge {\r\n  flag?: string;`
);

// Update resolveVenueDisplayBadge fallback when venue is null
taxContent = taxContent.replace(
  /return \{ flag: "[^"]*", mainTag: "FOOD", pinIcon: "all", filterTags: \["food"\] \};/g,
  `return { mainTag: "FOOD", pinIcon: "all", filterTags: ["food"] };`
);

// Update specific spots in resolveVenueDisplayBadge
// 1. Masala Politics
taxContent = taxContent.replace(
  /if \(nameLower\.includes\("masala politics"\)[^}]+\}/,
  `if (nameLower.includes("masala politics") || catLower === "naan") {\r\n    return { flag: "🇮🇳", mainTag: "INDIAN", pinIcon: "naan", filterTags: ["indian", "curry", "halal", "dinner"] };\r\n  }`
);

// 2. Daglig Brød
taxContent = taxContent.replace(
  /if \(nameLower\.includes\("daglig brød"\)[^}]+\}/,
  `if (nameLower.includes("daglig brød") || nameLower.includes("daglig brod")) {\r\n    return { mainTag: "BAKERY", pinIcon: "croissant", filterTags: ["bakery", "sourdough", "bread", "pastries"] };\r\n  }`
);

// 3. Håndbakt
taxContent = taxContent.replace(
  /if \(nameLower\.includes\("håndbakt"\)[^}]+\}/,
  `if (nameLower.includes("håndbakt") || nameLower.includes("handbakt")) {\r\n    return { mainTag: "BAKERY", pinIcon: "croissant", filterTags: ["bakery", "sourdough", "brunch", "organic", "pastries"] };\r\n  }`
);

// 4. Kveitemjøl
taxContent = taxContent.replace(
  /if \(nameLower\.includes\("kveitemjøl"\)[^}]+\}/,
  `if (nameLower.includes("kveitemjøl") || nameLower.includes("kveitemjol")) {\r\n    return { mainTag: "BAKERY", pinIcon: "croissant", filterTags: ["bakery", "pastries", "croissant"] };\r\n  }`
);

// 5. Fuglen
taxContent = taxContent.replace(
  /if \(nameLower\.includes\("fuglen"\)[^}]+\}/,
  `if (nameLower.includes("fuglen")) {\r\n    return { mainTag: "COFFEE", pinIcon: "coffee", filterTags: ["coffee", "specialty_coffee", "roastery"] };\r\n  }`
);

// 6. Digg Pizza
taxContent = taxContent.replace(
  /if \(nameLower\.includes\("digg pizza"\)[^}]+\}/,
  `if (nameLower.includes("digg pizza")) {\r\n    return { mainTag: "PIZZA", pinIcon: "pizza", filterTags: ["pizza", "roman_pizza", "dinner"] };\r\n  }`
);

// 7. Stykke
taxContent = taxContent.replace(
  /if \(nameLower\.includes\("stykke"\)[^}]+\}/,
  `if (nameLower.includes("stykke")) {\r\n    return { mainTag: "PIZZA", pinIcon: "pizza", filterTags: ["pizza", "roman_pizza", "slices"] };\r\n  }`
);

// 8. Zam Zam
taxContent = taxContent.replace(
  /if \(nameLower\.includes\("zam zam"\)[^}]+\}/,
  `if (nameLower.includes("zam zam") || nameLower.includes("zamzam")) {\r\n    return { mainTag: "CHEESESTEAK", pinIcon: "cheesesteak", filterTags: ["cheesesteak", "halal", "street_food"] };\r\n  }`
);

// 9. Dirty Taco
taxContent = taxContent.replace(
  /if \(nameLower\.includes\("dirty taco"\)[^}]+\}/,
  `if (nameLower.includes("dirty taco")) {\r\n    return { mainTag: "TACOS", pinIcon: "tacos", filterTags: ["tacos", "street_food", "late_night"] };\r\n  }`
);

// 10. Cocoa
taxContent = taxContent.replace(
  /if \(nameLower\.includes\("cocoa"\)[^}]+\}/,
  `if (nameLower.includes("cocoa")) {\r\n    return { mainTag: "COCOA BAR", pinIcon: "coffee", filterTags: ["dessert", "cocoa", "chocolate", "drinks"] };\r\n  }`
);

// 11. Crave
taxContent = taxContent.replace(
  /if \(nameLower\.includes\("crave"\)[^}]+\}/,
  `if (nameLower.includes("crave")) {\r\n    return { mainTag: "PANCAKES", pinIcon: "pancakes", filterTags: ["dessert", "pancakes", "toast", "sweet"] };\r\n  }`
);

// 12. U WAN SUM
taxContent = taxContent.replace(
  /if \(nameLower\.includes\("u wan sum"\)[^}]+\}/,
  `if (nameLower.includes("u wan sum")) {\r\n    return { mainTag: "DRINKS POP-UP", pinIcon: "drinks", filterTags: ["popup", "coffee", "matcha", "drinks"] };\r\n  }`
);

// 13. Kuro
taxContent = taxContent.replace(
  /if \(nameLower\.includes\("kuro"\)[^}]+\}/,
  `if (nameLower.includes("kuro")) {\r\n    return { mainTag: "COFFEE & TEA", pinIcon: "coffee", filterTags: ["coffee", "tea", "minimalist", "drinks"] };\r\n  }`
);

// Fallbacks in resolveVenueDisplayBadge: remove generic country flags from pizza, pasta, tacos, bakery, coffee
taxContent = taxContent.replace(
  /if \(catLower === "pizza" \|\| iconLower === "pizza"\) \{\r?\n\s*return \{ flag: "🇮🇹", mainTag: "PIZZA", pinIcon: "pizza", filterTags: \["pizza", "italian", "dinner"\] \};\r?\n\s*\}/g,
  `if (catLower === "pizza" || iconLower === "pizza") {\r\n    return { mainTag: "PIZZA", pinIcon: "pizza", filterTags: ["pizza", "dinner"] };\r\n  }`
);

taxContent = taxContent.replace(
  /if \(catLower === "pasta" \|\| iconLower === "pasta"\) \{\r?\n\s*return \{ flag: "🇮🇹", mainTag: "PASTA", pinIcon: "pasta", filterTags: \["pasta", "italian", "dinner"\] \};\r?\n\s*\}/g,
  `if (catLower === "pasta" || iconLower === "pasta") {\r\n    return { mainTag: "PASTA", pinIcon: "pasta", filterTags: ["pasta", "dinner"] };\r\n  }`
);

taxContent = taxContent.replace(
  /if \(catLower === "tacos" \|\| iconLower === "tacos"\) \{\r?\n\s*return \{ flag: "🇲🇽", mainTag: "TACOS", pinIcon: "tacos", filterTags: \["tacos", "mexican", "street_food"\] \};\r?\n\s*\}/g,
  `if (catLower === "tacos" || iconLower === "tacos") {\r\n    return { mainTag: "TACOS", pinIcon: "tacos", filterTags: ["tacos", "street_food"] };\r\n  }`
);

taxContent = taxContent.replace(
  /if \(catLower === "bakery" \|\| iconLower === "bakery" \|\| iconLower === "croissant"\) \{\r?\n\s*return \{ flag: "🇳🇴", mainTag: "BAKERY", pinIcon: "croissant", filterTags: \["bakery", "sourdough", "pastries"\] \};\r?\n\s*\}/g,
  `if (catLower === "bakery" || iconLower === "bakery" || iconLower === "croissant") {\r\n    return { mainTag: "BAKERY", pinIcon: "croissant", filterTags: ["bakery", "sourdough", "pastries"] };\r\n  }`
);

taxContent = taxContent.replace(
  /if \(catLower === "coffee" \|\| iconLower === "coffee"\) \{\r?\n\s*return \{ flag: "🇳🇴", mainTag: "COFFEE", pinIcon: "coffee", filterTags: \["coffee", "specialty_coffee"\] \};\r?\n\s*\}/g,
  `if (catLower === "coffee" || iconLower === "coffee") {\r\n    return { mainTag: "COFFEE", pinIcon: "coffee", filterTags: ["coffee", "specialty_coffee"] };\r\n  }`
);

// Final fallback in resolveVenueDisplayBadge:
taxContent = taxContent.replace(
  /return \{\r?\n\s*flag: "🍽",\r?\n\s*mainTag: \(venue\.food_category \|\| \(venue as any\)\.category \|\| "FOOD"\)\.toUpperCase\(\),\r?\n\s*pinIcon: venue\.icon \|\| "all",\r?\n\s*filterTags: \["food"\],\r?\n\s*\};/g,
  `return {\r\n    mainTag: (venue.food_category || (venue as any).category || "FOOD").toUpperCase(),\r\n    pinIcon: venue.icon || "all",\r\n    filterTags: ["food"],\r\n  };`
);

// 3. Update FOOD_GROUPS:
// Merge breads into pastries_bakery and naan into rice_bowls
taxContent = taxContent.replace(
  /\{\r?\n\s*id: "pastries_bakery",\r?\n\s*label: "Pastries & Bakery",\r?\n\s*shortLabel: "Pastries",\r?\n\s*heroIcon: "croissant",\r?\n\s*childCategories: \["croissant", "cinnamon_roll", "kanelbolle", "cardamom_bun", "bagel", "waffle", "bakery", "sourdough_loaf"\],\r?\n\s*\},/,
  `{\r\n    id: "pastries_bakery",\r\n    label: "Bakery & Sourdough",\r\n    shortLabel: "Bakery",\r\n    heroIcon: "croissant",\r\n    childCategories: ["croissant", "cinnamon_roll", "kanelbolle", "cardamom_bun", "bagel", "waffle", "bakery", "sourdough", "sourdough_loaf", "bread", "breads"],\r\n  },`
);

taxContent = taxContent.replace(
  /\{\r?\n\s*id: "breads",\r?\n\s*label: "Breads & Flatbreads",\r?\n\s*shortLabel: "Breads",\r?\n\s*heroIcon: "naan",\r?\n\s*childCategories: \["naan", "flatbread", "sourdough"\],\r?\n\s*\},/,
  `{\r\n    id: "breads",\r\n    label: "Breads & Flatbreads",\r\n    shortLabel: "Breads",\r\n    heroIcon: "naan",\r\n    childCategories: [],\r\n  },`
);

taxContent = taxContent.replace(
  /\{\r?\n\s*id: "rice_bowls",\r?\n\s*label: "Rice & Bowls",\r?\n\s*shortLabel: "Rice",\r?\n\s*heroIcon: "indian",\r?\n\s*childCategories: \["mandi_rice", "curry", "indian", "bibimbap", "poke"\],\r?\n\s*\},/,
  `{\r\n    id: "rice_bowls",\r\n    label: "Rice & Curry",\r\n    shortLabel: "Rice & Curry",\r\n    heroIcon: "indian",\r\n    childCategories: ["mandi_rice", "curry", "indian", "naan", "flatbread", "bibimbap", "poke"],\r\n  },`
);

// 4. Update Masala Politics dishCategory resolution in resolveEntityTaxonomy
taxContent = taxContent.replace(
  /\} else if \(candidateCat === "naan" \|\| candidateCat === "flatbread" \|\| allText\.includes\("naan"\) \|\| allText\.includes\("garlic naan"\)\) \{\r?\n\s*dishCategory = "naan";/,
  `} else if (allText.includes("masala politics")) {\r\n    dishCategory = "curry";\r\n  } else if (candidateCat === "naan" || candidateCat === "flatbread" || allText.includes("naan") || allText.includes("garlic naan")) {\r\n    dishCategory = "naan";`
);

// 5. Update Cuisines inference in resolveEntityTaxonomy to avoid lazy pizza->italian, croissant->french, etc.
const oldCuisinesBlock = `  // 3. Resolve Cuisines
  const cuisines: CuisineId[] = [];
  if (allText.includes("vietnam") || dishCategory === "pho" || dishCategory === "banh_mi" || allText.includes("em oi") || allText.includes("êm ôi")) {
    cuisines.push("vietnamese");
  }
  if (allText.includes("korean") || dishCategory === "k_chicken" || candidateCat === "kbbq") {
    cuisines.push("korean");
  }
  if (allText.includes("japan") || dishCategory === "ramen" || dishCategory === "sushi" || dishCategory === "matcha") {
    cuisines.push("japanese");
  }
  if (allText.includes("china") || allText.includes("chinese") || dishCategory === "dumplings" || dishCategory === "bao") {
    cuisines.push("chinese");
  }
  if (allText.includes("india") || allText.includes("pakistan") || dishCategory === "naan" || dishCategory === "indian") {
    cuisines.push("indian_pakistani");
  }
  if (allText.includes("italy") || allText.includes("italian") || dishCategory === "pizza" || dishCategory === "pasta" || dishCategory === "gelato") {
    cuisines.push("italian");
  }
  if (allText.includes("mexic") || dishCategory === "tacos") {
    cuisines.push("mexican");
  }
  if (allText.includes("yemen") || allText.includes("somali") || dishCategory === "mandi_rice") {
    cuisines.push("yemeni_somali");
  }
  if (allText.includes("nordic") || candidateCat === "nordic_seafood" || dishCategory === "kanelbolle") {
    cuisines.push("nordic");
  }
  if (allText.includes("france") || allText.includes("french") || dishCategory === "croissant") {
    cuisines.push("french");
  }
  if (allText.includes("middle eastern") || dishCategory === "kebab" || candidateCat === "middle_eastern") {
    cuisines.push("middle_eastern");
  }`;

const newCuisinesBlock = `  // 3. Resolve Cuisines (Only for authentic cultural cuisines, never inferred merely from generic items like pizza or croissants)
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
  }`;

taxContent = taxContent.replace(oldCuisinesBlock.replace(/\r?\n/g, "\r\n"), newCuisinesBlock.replace(/\r?\n/g, "\r\n"));
// Also try with LF
taxContent = taxContent.replace(oldCuisinesBlock.replace(/\r?\n/g, "\n"), newCuisinesBlock.replace(/\r?\n/g, "\r\n"));

fs.writeFileSync(taxPath, taxContent, "utf8");
console.log("Updated taxonomy.ts successfully.");
