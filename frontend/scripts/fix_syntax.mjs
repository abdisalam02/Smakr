import fs from "fs";

let content = fs.readFileSync("frontend/src/lib/taxonomy.ts", "utf8");

content = content.replace(
  /return \{\r?\n\s*spotKind,\r?\n\s*spotLabel: spotDef\.label,\r?\n\s*group: parentGroup,\r?\n\s*dishCategory,\r?\n\s*dishLabel,\r?\n\s*cuisines,\r?\n\s*diets,\r?\n\s*\}\r?\n\r?\nexport interface/g,
  `return {\r\n    spotKind,\r\n    spotLabel: spotDef.label,\r\n    group: parentGroup,\r\n    dishCategory,\r\n    dishLabel,\r\n    cuisines,\r\n    diets,\r\n  };\r\n}\r\n\r\nexport interface`
);

content = content.replace(
  /if \(!venue\) \{\r?\n\s*return \{ mainTag: "FOOD", pinIcon: "all", filterTags: \["food"\] \}\r?\n\r?\n\s*const nameLower/g,
  `if (!venue) {\r\n    return { mainTag: "FOOD", pinIcon: "all", filterTags: ["food"] };\r\n  }\r\n\r\n  const nameLower`
);

fs.writeFileSync("frontend/src/lib/taxonomy.ts", content, "utf8");
console.log("Fixed syntax cleanly.");
