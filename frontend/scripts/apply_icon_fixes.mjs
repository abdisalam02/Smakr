import fs from "fs";

// 1. MapRadarView.tsx
let mapFile = fs.readFileSync("frontend/src/components/map/MapRadarView.tsx", "utf8");
mapFile = mapFile.replace(
  "explicitVenueIcon ||\r\n    badgePinKey ||",
  "badgePinKey ||\r\n    explicitVenueIcon ||"
);
mapFile = mapFile.replace(
  "const categoryKey = overrideIconKey || explicitVenueIcon || badgePinKey ||",
  "const categoryKey = overrideIconKey || badgePinKey || explicitVenueIcon ||"
);
mapFile = mapFile.replace(
  "const dishKey = resolveCustomIconKey(venueTax.dishCategory) || venueTax.dishCategory;\r\n      const pinKey = `v3|${venue.icon ?? \"\"}|${dishKey}",
  "const venueBadge = resolveVenueDisplayBadge(venue);\r\n      const badgePinKey = resolveCustomIconKey(venueBadge.pinIcon) || \"\";\r\n      const dishKey = resolveCustomIconKey(venueTax.dishCategory) || venueTax.dishCategory;\r\n      const pinKey = `v4|${badgePinKey}|${venue.icon ?? \"\"}|${dishKey}"
);
fs.writeFileSync("frontend/src/components/map/MapRadarView.tsx", mapFile, "utf8");
console.log("MapRadarView.tsx updated.");

// 2. FoodSpotCard.tsx
let cardFile = fs.readFileSync("frontend/src/components/food/FoodSpotCard.tsx", "utf8");
cardFile = cardFile.replace(
  "  const spotIconKey =\r\n    resolveCustomIconKey(venue.icon) ||\r\n    resolveCustomIconKey(venue.food_category) ||\r\n    displayBadge.pinIcon ||",
  "  const spotIconKey =\r\n    displayBadge.pinIcon ||\r\n    resolveCustomIconKey(venue.icon) ||\r\n    resolveCustomIconKey(venue.food_category) ||"
);
fs.writeFileSync("frontend/src/components/food/FoodSpotCard.tsx", cardFile, "utf8");
console.log("FoodSpotCard.tsx updated.");

// 3. VenueDetailPane.tsx
let paneFile = fs.readFileSync("frontend/src/components/venue/VenueDetailPane.tsx", "utf8");
paneFile = paneFile.replace(
  "const customKey = resolveCustomIconKey(venue.icon) || resolveCustomIconKey(venue.food_category);",
  "const venueBadge = resolveVenueDisplayBadge(venue);\r\n                const customKey = resolveCustomIconKey(venueBadge.pinIcon) || resolveCustomIconKey(venue.icon) || resolveCustomIconKey(venue.food_category);"
);
fs.writeFileSync("frontend/src/components/venue/VenueDetailPane.tsx", paneFile, "utf8");
console.log("VenueDetailPane.tsx updated.");

// 4. taxonomy.ts
let taxFile = fs.readFileSync("frontend/src/lib/taxonomy.ts", "utf8");
taxFile = taxFile.replace(
  'if (nameLower.includes("farine")) {\r\n    return { mainTag: "BAKERY", pinIcon: "croissant", filterTags: ["bakery", "sourdough", "pastries"] };',
  'if (nameLower.includes("farine")) {\r\n    return { mainTag: "BAKERY", pinIcon: "cinnamon_roll", filterTags: ["bakery", "cinnamon_roll", "sourdough", "pastries"] };'
);
taxFile = taxFile.replace(
  'if (nameLower.includes("mandi house")) {',
  'if (nameLower.includes("mandi house") || nameLower.includes("mandi") || nameLower.includes("madi")) {'
);
taxFile = taxFile.replace(
  '  if (nameLower.includes("silin bakeri")) {\r\n    return { mainTag: "BAKERY", pinIcon: "croissant", filterTags: ["bakery", "flatbread", "halal"] };\r\n  }\r\n',
  ""
);
fs.writeFileSync("frontend/src/lib/taxonomy.ts", taxFile, "utf8");
console.log("taxonomy.ts updated.");
