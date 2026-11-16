import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const sharp = require("../node_modules/sharp");

const code = fs.readFileSync(path.join(process.cwd(), "frontend", "src", "components", "food", "FoodIcons.tsx"), "utf8");
const bodiesMatch = code.match(/SMAKR_ICON_SVG_BODIES:\s*Record<string,\s*string>\s*=\s*{([\s\S]*?)};\s*\/\*\*/);
const lines = bodiesMatch[1].split("\n");
const icons = {};
for (const line of lines) {
  const m = line.match(/^\s*(\w+):\s*`([^`]*)`/);
  if (m) icons[m[1]] = m[2];
}

const offCenter = [];
for (const [key, body] of Object.entries(icons)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 32 32" width="128" height="128">${body}</svg>`;
  try {
    const { data, info } = await sharp(Buffer.from(svg)).raw().toBuffer({ resolveWithObject: true });
    let minX = info.width, maxX = 0;
    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width; x++) {
        const a = data[(y * info.width + x) * info.channels + 3];
        if (a > 20) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
        }
      }
    }
    const midX = (minX + maxX) / 2;
    const idealX = info.width / 2; // 64
    const diff = midX - idealX;
    if (Math.abs(diff) > 2) {
      offCenter.push({ key, diff: Number(diff.toFixed(1)), minX, maxX });
    }
  } catch (err) {
    console.error(key, err.message);
  }
}
console.log("Off-center count:", offCenter.length);
console.log(JSON.stringify(offCenter, null, 2));
