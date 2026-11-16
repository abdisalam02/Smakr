import fs from "fs";

let content = fs.readFileSync("frontend/src/lib/taxonomy.ts", "utf8");

const startMarker = "  // 3. Fallbacks Based on food_category and icon";
const endMarker = "export function resolveDishIconKey";

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error("Could not find markers!");
  process.exit(1);
}

const cleanFallbackCode = `  // 3. Fallbacks Based on food_category and icon (Clean tags; flags ONLY for authentic cultural cuisines)
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

/**
 * Resolves a dedicated icon key for a specific dish based on its name and optional category.
 * Prevents dish chips (like "Coconut Coffee") from inheriting the venue's fallback icon.
 */
`;

content = content.slice(0, startIndex) + cleanFallbackCode + content.slice(endIndex);
fs.writeFileSync("frontend/src/lib/taxonomy.ts", content, "utf8");
console.log("Rewrote fallback badges cleanly.");
