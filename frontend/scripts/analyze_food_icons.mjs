import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const sharp = require("../node_modules/sharp");

const iconsDir = path.join(process.cwd(), "frontend", "public", "icons", "food");
const files = fs.readdirSync(iconsDir).filter(f => f.endsWith(".webp"));

const results = [];

for (const file of files) {
  const filePath = path.join(iconsDir, file);
  const id = file.replace(".webp", "");
  
  const image = sharp(filePath);
  const metadata = await image.metadata();
  
  // Get raw RGBA to find true content bounding box and center of mass
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  
  let minX = width, maxX = 0, minY = height, maxY = 0;
  let totalAlpha = 0;
  let weightedX = 0;
  let weightedY = 0;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const alpha = channels === 4 ? data[idx + 3] : 255;
      
      if (alpha > 15) { // non-transparent
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        
        totalAlpha += alpha;
        weightedX += x * alpha;
        weightedY += y * alpha;
      }
    }
  }
  
  const contentWidth = maxX >= minX ? maxX - minX + 1 : 0;
  const contentHeight = maxY >= minY ? maxY - minY + 1 : 0;
  const aspectRatio = contentHeight > 0 ? (contentWidth / contentHeight).toFixed(2) : "1.00";
  
  const visualCenterX = totalAlpha > 0 ? (weightedX / totalAlpha).toFixed(1) : (width / 2).toFixed(1);
  const visualCenterY = totalAlpha > 0 ? (weightedY / totalAlpha).toFixed(1) : (height / 2).toFixed(1);
  const geometricCenterX = (width / 2).toFixed(1);
  const geometricCenterY = (height / 2).toFixed(1);
  
  const xOffset = (parseFloat(visualCenterX) - parseFloat(geometricCenterX)).toFixed(1);
  const yOffset = (parseFloat(visualCenterY) - parseFloat(geometricCenterY)).toFixed(1);
  
  let shapeClass = "compact_square";
  const ar = parseFloat(aspectRatio);
  if (ar >= 1.35) shapeClass = "ultra_wide_horizontal";
  else if (ar >= 1.15) shapeClass = "wide_horizontal";
  else if (ar <= 0.75) shapeClass = "ultra_tall_vertical";
  else if (ar <= 0.88) shapeClass = "tall_vertical";
  else shapeClass = "balanced_circular";
  
  results.push({
    id,
    file,
    rawDimensions: `${metadata.width}x${metadata.height}`,
    contentBounds: `${contentWidth}x${contentHeight}`,
    aspectRatio: ar,
    shapeClass,
    visualCenterX,
    visualCenterY,
    xOffset,
    yOffset,
    minX, maxX, minY, maxY
  });
}

// Group by shape class
const grouped = {};
for (const r of results) {
  if (!grouped[r.shapeClass]) grouped[r.shapeClass] = [];
  grouped[r.shapeClass].push(r);
}

console.log("=== FOOD ICONS GEOMETRIC FORENSIC AUDIT ===");
console.log(`Total icons audited: ${results.length}`);
for (const [cls, list] of Object.entries(grouped)) {
  console.log(`\n--- Shape Class: ${cls.toUpperCase()} (${list.length} icons) ---`);
  list.forEach(item => {
    console.log(` • ${item.id.padEnd(20)} | Content: ${item.contentBounds.padEnd(9)} | AR: ${item.aspectRatio} | Visual Offset (dx,dy): (${item.xOffset}, ${item.yOffset})`);
  });
}

fs.writeFileSync(
  path.join(process.cwd(), "frontend", "public", "ICON_GEOMETRY_AUDIT.json"),
  JSON.stringify({ results, grouped }, null, 2)
);
