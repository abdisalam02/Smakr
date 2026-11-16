import fs from "fs";
import path from "path";

const taxPath = path.resolve("frontend/src/lib/taxonomy.ts");
let content = fs.readFileSync(taxPath, "utf8");

// Clean up any "};\r\n  }" patterns
content = content.replace(/\};\r?\n\s*\}/g, "}");

// Also clean up any candidate spots flags
content = content.replace(
  /if \(nameLower\.includes\("farine"\)\) \{\r?\n\s*return \{ flag: "🇳🇴", mainTag: "BAKERY", pinIcon: "croissant", filterTags: \["bakery", "sourdough", "pastries", "nordic", "morning"\] \};\r?\n\s*\}/g,
  `if (nameLower.includes("farine")) {\r\n    return { mainTag: "BAKERY", pinIcon: "croissant", filterTags: ["bakery", "sourdough", "pastries"] };\r\n  }`
);

content = content.replace(
  /if \(nameLower\.includes\("crantz cookies"\) \|\| nameLower\.includes\("sukkerbakeriet"\)\) \{\r?\n\s*return \{ flag: "🍪", mainTag: "COOKIES", pinIcon: "croissant", filterTags: \["dessert", "cookies", "bakery", "popup"\] \};\r?\n\s*\}/g,
  `if (nameLower.includes("crantz cookies") || nameLower.includes("sukkerbakeriet")) {\r\n    return { mainTag: "COOKIES", pinIcon: "croissant", filterTags: ["dessert", "cookies", "bakery", "popup"] };\r\n  }`
);

content = content.replace(
  /if \(nameLower\.includes\("dæsj"\) \|\| nameLower\.includes\("daesj"\)\) \{\r?\n\s*return \{ flag: "🍨", mainTag: "GELATO", pinIcon: "gelato", filterTags: \["gelato", "dessert", "popup"\] \};\r?\n\s*\}/g,
  `if (nameLower.includes("dæsj") || nameLower.includes("daesj")) {\r\n    return { mainTag: "GELATO", pinIcon: "gelato", filterTags: ["gelato", "dessert", "popup"] };\r\n  }`
);

content = content.replace(
  /if \(nameLower\.includes\("vinoteket"\)\) \{\r?\n\s*return \{ flag: "🇮🇹", mainTag: "PIZZA", pinIcon: "pizza", filterTags: \["pizza", "gourmet_pizza", "natural_wine", "italian"\] \};\r?\n\s*\}/g,
  `if (nameLower.includes("vinoteket")) {\r\n    return { mainTag: "PIZZA & WINE", pinIcon: "pizza", filterTags: ["pizza", "natural_wine"] };\r\n  }`
);

content = content.replace(
  /if \(nameLower\.includes\("syverkiosken"\)\) \{\r?\n\s*return \{ flag: "🇳🇴", mainTag: "STREET FOOD", pinIcon: "street_food", filterTags: \["street_food", "heritage", "sausage", "kiosk"\] \};\r?\n\s*\}/g,
  `if (nameLower.includes("syverkiosken")) {\r\n    return { mainTag: "STREET FOOD", pinIcon: "street_food", filterTags: ["street_food", "heritage", "sausage", "kiosk"] };\r\n  }`
);

content = content.replace(
  /if \(nameLower\.includes\("the little pickle"\)\) \{\r?\n\s*return \{ flag: "🇬🇧", mainTag: "BISTRO", pinIcon: "natural_wine", filterTags: \["natural_wine", "bistro", "seasonal", "dinner"\] \};\r?\n\s*\}/g,
  `if (nameLower.includes("the little pickle")) {\r\n    return { mainTag: "BISTRO", pinIcon: "natural_wine", filterTags: ["natural_wine", "bistro", "seasonal", "dinner"] };\r\n  }`
);

content = content.replace(
  /if \(nameLower\.includes\("silin bakeri"\)\) \{\r?\n\s*return \{ flag: "🇸🇾", mainTag: "BAKERY", pinIcon: "dessert", filterTags: \["bakery", "syrian", "baklava", "halal", "sweet"\] \};\r?\n\s*\}/g,
  `if (nameLower.includes("silin bakeri")) {\r\n    return { mainTag: "BAKERY", pinIcon: "croissant", filterTags: ["bakery", "flatbread", "halal"] };\r\n  }`
);

content = content.replace(
  /if \(nameLower\.includes\("becco"\)\) \{\r?\n\s*return \{ flag: "🍷", mainTag: "NATURAL WINE", pinIcon: "natural_wine", filterTags: \["natural_wine", "wine_bar", "popup", "drinks"\] \};\r?\n\s*\}/g,
  `if (nameLower.includes("becco")) {\r\n    return { mainTag: "NATURAL WINE", pinIcon: "natural_wine", filterTags: ["natural_wine", "wine_bar", "popup", "drinks"] };\r\n  }`
);

content = content.replace(
  /if \(nameLower\.includes\("lasarett"\)\) \{\r?\n\s*return \{ flag: "🍷", mainTag: "WINE & BITES", pinIcon: "natural_wine", filterTags: \["natural_wine", "wine_bar", "popup", "guest_chef"\] \};\r?\n\s*\}/g,
  `if (nameLower.includes("lasarett")) {\r\n    return { mainTag: "WINE & BITES", pinIcon: "natural_wine", filterTags: ["natural_wine", "wine_bar", "popup", "guest_chef"] };\r\n  }`
);

fs.writeFileSync(taxPath, content, "utf8");
console.log("Cleaned up taxonomy.ts syntax.");
