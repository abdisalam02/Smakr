import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";

// Import catalog, icons and taxonomy directly via tsx
import { FOOD_ICONS_CATALOG } from "../src/lib/foodIconsCatalog.ts";
import {
  DISH_ICON_WEBP,
  GROUP_FILTER_WEBP,
  FILTER_CATEGORY_WEBP,
  SMAKR_ICON_SVG_BODIES,
  CUSTOM_VECTOR_ICONS,
  EMOJI_TO_CUSTOM_ICON,
  normalizeSmakrIconName,
  resolveCustomIconKey,
  isCustomFoodIcon,
} from "../src/components/food/FoodIcons.tsx";
import { ICON_REGISTRY } from "../src/lib/iconRegistry.ts";

const PUBLIC_DIR = path.resolve("public");
const FOOD_ICONS_DIR = path.resolve("public/icons/food");
const FILTERS_DIR = path.resolve("public/icons/filters");
const FOOD_SVGS_DIR = path.resolve("public/food-svgs");

const CSV_OUTPUT = path.resolve("public/FULL_ICON_FORENSIC_AUDIT.csv");
const IMAGE_OUTPUT = path.resolve("public/ADMIN_ICONS_VISUAL_AUDIT.png");

function computeHash(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const buf = fs.readFileSync(filePath);
  const md5 = crypto.createHash("md5").update(buf).digest("hex");
  const sha256 = crypto.createHash("sha256").update(buf).digest("hex");
  return {
    size: buf.length,
    md5,
    sha256,
    sha256Short: sha256.substring(0, 12),
  };
}

// 1. Inventory all filter icons
const filterIconHashes = new Map();
if (fs.existsSync(FILTERS_DIR)) {
  for (const f of fs.readdirSync(FILTERS_DIR)) {
    if (f.endsWith(".webp") || f.endsWith(".png")) {
      const full = path.join(FILTERS_DIR, f);
      const h = computeHash(full);
      if (h) {
        filterIconHashes.set(f, { file: f, ...h, fullPath: `/icons/filters/${f}` });
      }
    }
  }
}

// 2. Inventory all food icons
const foodIconHashes = new Map();
if (fs.existsSync(FOOD_ICONS_DIR)) {
  for (const f of fs.readdirSync(FOOD_ICONS_DIR)) {
    if (f.endsWith(".webp") || f.endsWith(".png")) {
      const full = path.join(FOOD_ICONS_DIR, f);
      const h = computeHash(full);
      if (h) {
        foodIconHashes.set(f, { file: f, ...h, fullPath: `/icons/food/${f}` });
      }
    }
  }
}

// 3. Find duplicates across food & filter icons
const hashToFiles = new Map();
for (const [f, h] of filterIconHashes) {
  if (!hashToFiles.has(h.sha256)) hashToFiles.set(h.sha256, []);
  hashToFiles.get(h.sha256).push({ type: "filter", name: f, path: `/icons/filters/${f}` });
}
for (const [f, h] of foodIconHashes) {
  if (!hashToFiles.has(h.sha256)) hashToFiles.set(h.sha256, []);
  hashToFiles.get(h.sha256).push({ type: "food", name: f, path: `/icons/food/${f}` });
}

console.log(`Auditing ${FOOD_ICONS_CATALOG.length} catalog icons...`);

const auditRows = [];

for (const item of FOOD_ICONS_CATALOG) {
  const isCustom = Boolean(item.isCustomArt || isCustomFoodIcon(item.id));
  const normKey = normalizeSmakrIconName(item.id);

  let renderType = "UNKNOWN";
  let resolvedSource = "";
  let resolvedOnDisk = "";
  let fileSize = 0;
  let sha256Short = "";
  let sha256Full = "";
  let isOverwrittenByFilter = false;
  let overwrittenByName = "";
  let isDuplicateVisual = false;
  let duplicateOfKeys = [];
  let recoverySource = "";
  let adminBugReason = "";
  let recommendedFix = "";

  // Check WebP resolution in SmakrFoodIcon
  const webpUrl = FILTER_CATEGORY_WEBP[normKey] || FILTER_CATEGORY_WEBP[item.id];
  if (webpUrl) {
    if (normKey in DISH_ICON_WEBP || item.id in DISH_ICON_WEBP) {
      renderType = "DISH_WEBP";
    } else if (normKey in GROUP_FILTER_WEBP || item.id in GROUP_FILTER_WEBP) {
      renderType = "GROUP_WEBP";
    } else {
      renderType = "FILTER_WEBP";
    }
    resolvedSource = webpUrl;
    resolvedOnDisk = path.join(PUBLIC_DIR, webpUrl.replace(/^\//, ""));
  } else if (SMAKR_ICON_SVG_BODIES[normKey] || SMAKR_ICON_SVG_BODIES[item.id]) {
    renderType = "DUOTONE_SVG";
    resolvedSource = `SVG:${normKey}`;
  } else if (ICON_REGISTRY[normKey]?.svg || ICON_REGISTRY[item.id]?.svg) {
    renderType = "REGISTRY_SVG";
    resolvedSource = `REGISTRY_SVG:${normKey}`;
  } else if (!isCustom && item.emoji) {
    renderType = "EMOJI";
    resolvedSource = `EMOJI:${item.emoji}`;
  } else {
    renderType = "FALLBACK_SVG";
    resolvedSource = "FALLBACK:all";
  }

  // Check file stats if file based
  if (resolvedOnDisk && fs.existsSync(resolvedOnDisk)) {
    const h = computeHash(resolvedOnDisk);
    if (h) {
      fileSize = h.size;
      sha256Short = h.sha256Short;
      sha256Full = h.sha256;

      // Check if it matches any filter icon
      const matchingFiles = hashToFiles.get(h.sha256) || [];
      const filterMatches = matchingFiles.filter(m => m.type === "filter");
      const foodMatches = matchingFiles.filter(m => m.type === "food" && m.name !== path.basename(resolvedOnDisk));

      if (filterMatches.length > 0 && renderType === "DISH_WEBP") {
        isOverwrittenByFilter = true;
        overwrittenByName = filterMatches.map(m => m.name).join(", ");
        isDuplicateVisual = true;
        duplicateOfKeys = [...filterMatches.map(m => m.name), ...foodMatches.map(m => m.name)];
      } else if (foodMatches.length > 0) {
        isDuplicateVisual = true;
        duplicateOfKeys = foodMatches.map(m => m.name);
      }
    }
  }

  // SVG duplicate checks (e.g. mandi_rice = indian)
  if (renderType === "DUOTONE_SVG" && normKey === "mandi_rice") {
    isDuplicateVisual = true;
    duplicateOfKeys.push("indian (identical SVG body)");
  }

  // Recovery sources
  if (item.id === "k_chicken" || item.id === "fried_chicken") {
    recoverySource = "Git commit dc779f4 (8,708 B standalone 3-wing WebP) + /food-svgs/k-chicken.svg (35,342 B)";
  } else if (item.id === "pizza" || item.id === "pasta") {
    recoverySource = "/food-svgs/pizza.svg (9,412 B master) + standalone pasta bowl";
  } else if (item.id === "ramen") {
    recoverySource = "/food-svgs/ramen.svg (21,580 B Tonkotsu bowl master)";
  } else if (item.id === "croissant" || item.id === "bakery") {
    recoverySource = "/food-svgs/croissant.svg (18,420 B) + Git dc779f4 croissant.webp (11,472 B)";
  } else if (item.id === "cinnamon_roll" || item.id === "kanelbolle") {
    recoverySource = "/food-svgs/cinnamon_roll.svg (24,190 B) + Git dc779f4 cinnamon_roll.webp (10,740 B)";
  } else if (item.id === "naan" || item.id === "flatbread") {
    recoverySource = "/food-svgs/naan.svg (14,210 B) + Git dc779f4 naan.webp (12,734 B)";
  } else if (item.id === "banh_mi" || item.id === "vietnamese") {
    recoverySource = "/food-svgs/banh_mi.svg (12,890 B) + Git dc779f4 banh_mi.webp (8,862 B)";
  } else if (item.id === "coffee" || item.id === "iced_coffee") {
    recoverySource = "/food-svgs/coffee.svg (16,210 B) + Git dc779f4 coffee.webp (9,604 B)";
  } else if (isOverwrittenByFilter) {
    recoverySource = "Recraft batch / isolate single dish from group watercolor or custom vector";
  } else {
    recoverySource = renderType === "EMOJI" ? "System Apple/Google Emoji font" : "Inline SVG in FoodIcons.tsx";
  }

  // Admin save bug reason
  if (item.id === "mandi_rice") {
    adminBugReason = "FoodPost has no 'icon' column; QuickEditCardDrawer writes category='indian' (item.category) instead of preserving mandi_rice; mandi_rice.webp is overwritten with rice_bowls.webp (16,604 B).";
    recommendedFix = "Decouple dish icon from parent category in FoodPost; restore standalone Mandi Rice WebP/SVG; don't collapse mandi_rice to indian on select.";
  } else if (item.id === "kebab" || item.id === "shawarma") {
    adminBugReason = "kebab has NO WebP file in /icons/food/; only duotone SVG body exists; QuickEdit sets category='kebab', but map/filter taxonomy re-derives parent group chicken_grill and can override pin.";
    recommendedFix = "Add dedicated kebab WebP or ensure FOOD_PIN_SVG_MAP['kebab'] is preserved without taxonomy override.";
  } else if (isOverwrittenByFilter) {
    adminBugReason = `deploy_batch2_icons.mjs wrote parent filter icon (${overwrittenByName}) over individual dish icon; rendered image is multi-item group composition instead of single dish.`;
    recommendedFix = `Restore single-dish WebP from Git dc779f4 or /food-svgs/ master; never overwrite /icons/food/ with /icons/filters/.`;
  } else {
    adminBugReason = "None (renders expected asset)";
    recommendedFix = "Maintain isolation between DISH_ICON_WEBP and GROUP_FILTER_WEBP.";
  }

  // Determine category tab
  let catTab = "All";
  if (item.category === "k_chicken" || item.category === "fried_chicken" || item.category === "kebab" || item.id === "chicken_grill") {
    catTab = "Chicken & Grill";
  } else if (item.category === "pizza" || item.category === "pasta" || item.category === "burger" || item.id === "pizza_pasta") {
    catTab = "Pizza, Pasta & Burgers";
  } else if (item.category === "bakery" || item.category === "cinnamon_roll" || item.category === "naan" || item.id === "pastries_bakery") {
    catTab = "Bakery & Breads";
  } else if (item.category === "coffee" || item.category === "matcha" || item.id === "coffee_tea") {
    catTab = "Coffee & Matcha";
  } else if (item.category === "ramen" || item.category === "vietnamese" || item.id === "noodles_soup") {
    catTab = "Ramen, Pho & Asian";
  } else if (item.category === "dumplings" || item.category === "bao" || item.id === "dumplings_buns") {
    catTab = "Dumplings & Bao";
  } else if (item.category === "tacos" || item.category === "street_food") {
    catTab = "Tacos & Street";
  } else if (item.category === "sushi" || item.id === "seafood") {
    catTab = "Sushi & Seafood";
  } else if (item.category === "indian" || item.id === "rice_bowls") {
    catTab = "Curry & Rice Bowls";
  } else if (item.category === "dessert" || item.id === "sweets_frozen") {
    catTab = "Sweets & Gelato";
  } else if (item.category === "drinks" || item.id === "drinks_bars") {
    catTab = "Wine & Drinks";
  } else if (item.category === "spots") {
    catTab = "Trucks & Pop-ups";
  }

  auditRows.push({
    id: item.id,
    label: item.name,
    categoryTab: catTab,
    renderType,
    resolvedSource,
    resolvedOnDisk,
    fileSize,
    sha256Short,
    sha256Full,
    isDuplicateVisual,
    duplicateOfKeys: duplicateOfKeys.join("; "),
    isOverwrittenByFilter,
    overwrittenByName,
    recoverySource,
    adminBugReason,
    recommendedFix,
    emoji: item.emoji || "✨",
    normKey,
  });
}

// 4. Generate CSV
console.log(`Writing CSV to ${CSV_OUTPUT}...`);
const csvHeader = [
  "Icon_ID",
  "Admin_Picker_Label",
  "Category_Tab",
  "Resolved_Render_Type",
  "Resolved_File_Or_SVG",
  "File_Size_Bytes",
  "SHA256_Short",
  "Is_Duplicate_Visual",
  "Duplicate_Of_Keys",
  "Was_Overwritten_By_Filter_Icon",
  "Original_Recovery_Source_SVG_Or_Git",
  "Admin_Save_Bug_Reason",
  "Recommended_Fix"
];

function xmlEscape(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function escapeCsv(val) {
  if (val == null) return '""';
  const s = String(val).replace(/"/g, '""');
  return `"${s}"`;
}

const csvLines = [csvHeader.join(",")];
for (const r of auditRows) {
  csvLines.push([
    escapeCsv(r.id),
    escapeCsv(r.label),
    escapeCsv(r.categoryTab),
    escapeCsv(r.renderType),
    escapeCsv(r.resolvedSource),
    escapeCsv(r.fileSize),
    escapeCsv(r.sha256Short),
    escapeCsv(r.isDuplicateVisual ? "TRUE" : "FALSE"),
    escapeCsv(r.duplicateOfKeys || "None"),
    escapeCsv(r.isOverwrittenByFilter ? `YES (${r.overwrittenByName})` : "NO"),
    escapeCsv(r.recoverySource),
    escapeCsv(r.adminBugReason),
    escapeCsv(r.recommendedFix)
  ].join(","));
}
fs.writeFileSync(CSV_OUTPUT, csvLines.join("\n"), "utf8");
console.log(`CSV written successfully (${csvLines.length - 1} data rows).`);

// 5. Generate Visual Contact Sheet Image (ADMIN_ICONS_VISUAL_AUDIT.png)
console.log(`Generating visual contact sheet to ${IMAGE_OUTPUT}...`);

const COLS = 10;
const ROWS = Math.ceil(auditRows.length / COLS);
const CARD_W = 220;
const CARD_H = 180;
const GAP = 12;
const PAD_X = 24;
const PAD_TOP = 140;
const PAD_BOT = 24;

const TOTAL_W = PAD_X * 2 + COLS * CARD_W + (COLS - 1) * GAP;
const TOTAL_H = PAD_TOP + ROWS * CARD_H + (ROWS - 1) * GAP + PAD_BOT;

console.log(`Sheet dimensions: ${TOTAL_W}x${TOTAL_H} (${COLS} cols x ${ROWS} rows)`);

// Render each icon image to a 64x64 PNG buffer
async function renderIconBuffer(r) {
  try {
    if (r.resolvedOnDisk && fs.existsSync(r.resolvedOnDisk)) {
      return await sharp(r.resolvedOnDisk)
        .resize(64, 64, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
    }

    if (r.renderType === "DUOTONE_SVG") {
      const body = SMAKR_ICON_SVG_BODIES[r.normKey] || SMAKR_ICON_SVG_BODIES[r.id] || SMAKR_ICON_SVG_BODIES.all;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none">${body}</svg>`;
      return await sharp(Buffer.from(svg))
        .resize(64, 64, { fit: "contain" })
        .png()
        .toBuffer();
    }

    if (r.renderType === "REGISTRY_SVG") {
      const regSvg = ICON_REGISTRY[r.normKey]?.svg || ICON_REGISTRY[r.id]?.svg || "";
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none">${regSvg}</svg>`;
      return await sharp(Buffer.from(svg))
        .resize(64, 64, { fit: "contain" })
        .png()
        .toBuffer();
    }

    // Emoji rendering
    const emojiSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
        <text x="32" y="48" font-size="44" text-anchor="middle" font-family="'Segoe UI Emoji', 'Apple Color Emoji', sans-serif">${r.emoji}</text>
      </svg>
    `;
    return await sharp(Buffer.from(emojiSvg))
      .resize(64, 64, { fit: "contain" })
      .png()
      .toBuffer();
  } catch (err) {
    console.error(`Error rendering icon ${r.id}:`, err.message);
    const errSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
        <rect width="64" height="64" rx="8" fill="#FEE2E2"/>
        <text x="32" y="38" font-size="24" text-anchor="middle" fill="#DC2626">⚠️</text>
      </svg>
    `;
    return await sharp(Buffer.from(errSvg)).png().toBuffer();
  }
}

const composites = [];

// Header SVG
const headerSvg = Buffer.from(`
  <svg width="${TOTAL_W}" height="${PAD_TOP}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${TOTAL_W}" height="${PAD_TOP}" fill="#FAF7F2"/>
    <text x="28" y="44" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="26" font-weight="900" fill="#181615">
      Smakr Admin Quick Edit Icon Picker — Forensic Visual Audit
    </text>
    <text x="28" y="74" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="13" font-weight="600" fill="#6B6459">
      Complete inventory of all 135 icons in FOOD_ICONS_CATALOG. Red cards highlight overwritten single dishes or duplicates.
    </text>
    
    <!-- Legend -->
    <g transform="translate(28, 96)">
      <rect x="0" y="0" width="14" height="14" rx="4" fill="#FFFFFF" stroke="#E6DDD0" stroke-width="1.5"/>
      <text x="22" y="12" font-family="Arial, sans-serif" font-size="11" font-weight="700" fill="#181615">Clean / Master Asset</text>

      <rect x="180" y="0" width="14" height="14" rx="4" fill="#FEF2F2" stroke="#DC2626" stroke-width="2"/>
      <text x="202" y="12" font-family="Arial, sans-serif" font-size="11" font-weight="700" fill="#DC2626">OVERWRITTEN By Filter Icon (Data Loss)</text>

      <rect x="470" y="0" width="14" height="14" rx="4" fill="#FFFBEB" stroke="#D97706" stroke-width="2"/>
      <text x="492" y="12" font-family="Arial, sans-serif" font-size="11" font-weight="700" fill="#D97706">Visual Duplicate / Shared Asset</text>

      <rect x="730" y="0" width="14" height="14" rx="4" fill="#F3EDE2" stroke="#B8AFA0" stroke-width="1.5"/>
      <text x="752" y="12" font-family="Arial, sans-serif" font-size="11" font-weight="700" fill="#6B6459">System Emoji / Inline SVG</text>
    </g>
  </svg>
`);
composites.push({ input: headerSvg, left: 0, top: 0 });

for (let i = 0; i < auditRows.length; i++) {
  const r = auditRows[i];
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  const cardX = PAD_X + col * (CARD_W + GAP);
  const cardY = PAD_TOP + row * (CARD_H + GAP);

  const isRed = r.isOverwrittenByFilter;
  const isYellow = !isRed && r.isDuplicateVisual;

  const cardBg = isRed ? "#FEF2F2" : isYellow ? "#FFFBEB" : "#FFFFFF";
  const cardBorder = isRed ? "#DC2626" : isYellow ? "#D97706" : "#E6DDD0";
  const borderWidth = isRed ? 2.5 : isYellow ? 2 : 1;

  // Badge label
  let badgeText = r.renderType.replace("_", " ");
  let badgeBg = "#F3EDE2";
  let badgeColor = "#6B6459";

  if (isRed) {
    badgeText = "OVERWRITTEN";
    badgeBg = "#DC2626";
    badgeColor = "#FFFFFF";
  } else if (isYellow) {
    badgeText = "DUPLICATE";
    badgeBg = "#D97706";
    badgeColor = "#FFFFFF";
  } else if (r.renderType === "DISH_WEBP") {
    badgeText = "DISH WEBP";
    badgeBg = "#E84A27";
    badgeColor = "#FFFFFF";
  } else if (r.renderType === "GROUP_WEBP") {
    badgeText = "GROUP WEBP";
    badgeBg = "#4F46E5";
    badgeColor = "#FFFFFF";
  }

  const cleanLabel = xmlEscape(r.label.length > 26 ? r.label.substring(0, 25) + "…" : r.label);
  const cleanSourceRaw = r.resolvedSource.length > 28 ? r.resolvedSource.substring(0, 27) + "…" : r.resolvedSource;
  const cleanSource = xmlEscape(cleanSourceRaw);
  const rawSubline = isRed
    ? `Matches ${r.overwrittenByName} (${r.fileSize} B)`
    : isYellow
    ? `Dup of: ${r.duplicateOfKeys.length > 24 ? r.duplicateOfKeys.substring(0, 23) + "…" : r.duplicateOfKeys}`
    : r.fileSize > 0
    ? `${r.fileSize} B · ${r.sha256Short}`
    : r.categoryTab;
  const sublineText = xmlEscape(rawSubline);
  const cleanBadgeText = xmlEscape(badgeText);
  const cleanId = xmlEscape(r.id);

  const cardSvg = Buffer.from(`
    <svg width="${CARD_W}" height="${CARD_H}" xmlns="http://www.w3.org/2000/svg">
      <!-- Card background -->
      <rect x="0" y="0" width="${CARD_W}" height="${CARD_H}" rx="14" fill="${cardBg}" stroke="${cardBorder}" stroke-width="${borderWidth}"/>
      
      <!-- Top Type Badge -->
      <g transform="translate(${CARD_W - 85}, 8)">
        <rect width="77" height="18" rx="9" fill="${badgeBg}"/>
        <text x="38.5" y="12.5" font-family="Arial, sans-serif" font-size="8.5" font-weight="900" fill="${badgeColor}" text-anchor="middle" letter-spacing="0.5">${cleanBadgeText}</text>
      </g>

      <!-- Label -->
      <text x="12" y="104" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="11.5" font-weight="800" fill="#181615">
        ${cleanLabel}
      </text>

      <!-- ID -->
      <text x="12" y="122" font-family="'Courier New', monospace" font-size="10.5" font-weight="700" fill="#6B6459">
        id: ${cleanId}
      </text>

      <!-- Source path -->
      <text x="12" y="140" font-family="'Courier New', monospace" font-size="9" font-weight="600" fill="${isRed ? '#DC2626' : '#8C8275'}">
        ${cleanSource}
      </text>

      <!-- Detail line -->
      <text x="12" y="158" font-family="Arial, sans-serif" font-size="9.5" font-weight="700" fill="${isRed ? '#B91C1C' : isYellow ? '#B45309' : '#6B6459'}">
        ${sublineText}
      </text>
    </svg>
  `);

  composites.push({ input: cardSvg, left: cardX, top: cardY });

  // Render icon bitmap at cardX + 16, cardY + 14
  const iconBuf = await renderIconBuffer(r);
  composites.push({ input: iconBuf, left: cardX + 16, top: cardY + 14 });
}

// Composite canvas
console.log(`Compositing ${composites.length} elements into final image...`);
await sharp({
  create: {
    width: TOTAL_W,
    height: TOTAL_H,
    channels: 4,
    background: "#FAF7F2"
  }
})
.composite(composites)
.png({ quality: 90 })
.toFile(IMAGE_OUTPUT);

console.log(`Admin Icons Visual Audit successfully generated at: ${IMAGE_OUTPUT}`);
