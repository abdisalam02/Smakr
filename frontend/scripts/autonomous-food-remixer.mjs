#!/usr/bin/env node
/**
 * Autonomous Food Remix Engine (Stage 2 & 3)
 *
 * References Stage 1 Mutation Log (scripts/remix-mutations-log.json).
 * Runs background isolation, micro-contrast sharpening, and the 44-color VTracer vectorizer preset.
 * Exports companion .svg and vector-rasterized 192x192 .webp (< 12 KB).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const scratchDir = path.resolve(rootDir, '..', 'scratch');
fs.mkdirSync(scratchDir, { recursive: true });

const brainDir = 'C:\\Users\\abdis\\.gemini\\antigravity\\brain\\aa12b53b-04fa-4259-8560-24d7f40dbfbd';

const EDITED_ITEMS = [
  {
    category: 'pizza',
    file: path.join(brainDir, 'edited_pizza_slice_1793834827954.jpg'),
    handleSeed: null,
  },
  {
    category: 'coffee',
    file: path.join(brainDir, 'pistachio_latte_terracotta_tulip_1793834825770.jpg'),
    handleSeed: { xRel: 745 / 1024, yRel: 650 / 1024 }, // Exact interior loop coordinates
  },
  {
    category: 'ramen',
    file: path.join(brainDir, 'ramen_photographic_edited_1793834837856.jpg'),
    handleSeed: null,
  },
  {
    category: 'cinnamon_roll',
    file: path.join(brainDir, 'edited_cinnamon_roll_1793834832363.jpg'),
    handleSeed: null,
    alias: 'kanelbolle',
  },
  {
    category: 'banh_mi',
    file: path.join(brainDir, 'banh_mi_edited_dslr_1793834837370.jpg'),
    handleSeed: null,
    alias: 'vietnamese',
  },
  {
    category: 'croissant',
    file: path.join(brainDir, 'edited_hero_croissant_1793834841283.jpg'),
    handleSeed: null,
    alias: 'bakery',
  },
];

async function processItem(item) {
  const { category, file, handleSeed, alias } = item;
  console.log(`\n🎨 [Autonomous Food Remixer] Processing "${category}" from ${path.basename(file)}...`);

  if (!fs.existsSync(file)) {
    throw new Error(`Input image file not found: ${file}`);
  }

  const image = sharp(file);
  const meta = await image.metadata();
  const w = meta.width;
  const h = meta.height;

  // 1. Raw buffer with alpha for background removal
  const { data } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  // 2. Flood fill background (white + neutral contact shadows) to transparent
  const visited = new Uint8Array(w * h);
  const queue = [];

  function isBg(x, y) {
    const idx = (y * w + x) * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const chroma = max - min;
    const brightness = (r + g + b) / 3;

    // Off-white/white background
    if (r > 235 && g > 235 && b > 235) return true;
    // Neutral shadow on background surface (low chroma, high-to-mid brightness)
    if (brightness > 135 && chroma <= 24) return true;
    return false;
  }

  for (let x = 0; x < w; x++) {
    if (isBg(x, 0)) queue.push(x, 0);
    if (isBg(x, h - 1)) queue.push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    if (isBg(0, y)) queue.push(0, y);
    if (isBg(w - 1, y)) queue.push(w - 1, y);
  }

  // Seed inner handle hole if specified
  if (handleSeed) {
    const hx = Math.round(w * handleSeed.xRel);
    const hy = Math.round(h * handleSeed.yRel);
    if (isBg(hx, hy)) {
      queue.push(hx, hy);
    }
  }

  while (queue.length > 0) {
    const cy = queue.pop();
    const cx = queue.pop();
    const pos = cy * w + cx;
    if (visited[pos]) continue;
    visited[pos] = 1;

    data[pos * 4 + 3] = 0; // Alpha = 0

    if (cx > 0 && !visited[pos - 1] && isBg(cx - 1, cy)) queue.push(cx - 1, cy);
    if (cx < w - 1 && !visited[pos + 1] && isBg(cx + 1, cy)) queue.push(cx + 1, cy);
    if (cy > 0 && !visited[pos - w] && isBg(cx, cy - 1)) queue.push(cx, cy - 1);
    if (cy < h - 1 && !visited[pos + w] && isBg(cx, cy + 1)) queue.push(cx, cy + 1);
  }

  // Defringe edges (remove residual 1px background fringing)
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const pos = y * w + x;
      if (!visited[pos]) {
        if (visited[pos - 1] || visited[pos + 1] || visited[pos - w] || visited[pos + w]) {
          const idx = pos * 4;
          const r = data[idx], g = data[idx + 1], b = data[idx + 2];
          if ((r > 220 && g > 220 && b > 220) || (Math.max(r, g, b) - Math.min(r, g, b) < 16 && (r + g + b) / 3 > 140)) {
            data[idx + 3] = 0;
            visited[pos] = 1;
          }
        }
      }
    }
  }

  // 3. Trim and add 12% safe padding
  const transparentPng = await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
  const trimmed = await sharp(transparentPng).trim().png().toBuffer();
  const trimmedMeta = await sharp(trimmed).metadata();

  const maxDim = Math.max(trimmedMeta.width, trimmedMeta.height);
  const padCanvasSize = Math.round(maxDim * 1.14);

  // 4. Boost Micro-Contrast & Crispness (ZERO .median() blurring!)
  const sharpenedPng = await sharp(trimmed)
    .resize(padCanvasSize, padCanvasSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .sharpen({ sigma: 1.3, m1: 1.4, m2: 2.8 })
    .linear(1.14, -10)
    .modulate({ saturation: 1.12 })
    .png()
    .toBuffer();

  const iconsDir = path.join(rootDir, 'public', 'icons', 'food');
  const svgsDir = path.join(rootDir, 'public', 'food-svgs');
  fs.mkdirSync(iconsDir, { recursive: true });
  fs.mkdirSync(svgsDir, { recursive: true });

  // 5. Quantize with 44 real photographic colors (dither: 0) at 384x384
  const quantPng = path.join(svgsDir, `${category}-quant.png`);
  await sharp(sharpenedPng)
    .resize(384, 384, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ palette: true, colors: 44, dither: 0 })
    .toFile(quantPng);

  // 6. Run VTracer with high photographic color fidelity
  const svgDest = path.join(svgsDir, `${category}.svg`);
  const pyCode = `
import vtracer
vtracer.convert_image_to_svg_py(
    r"${quantPng}",
    r"${svgDest}",
    colormode='color',
    hierarchical='stacked',
    mode='spline',
    filter_speckle=4,
    color_precision=7,
    layer_difference=12,
    corner_threshold=60,
    length_threshold=3.5,
    max_iterations=10,
    splice_threshold=45,
    path_precision=2
)
`;
  const scratchPy = path.join(scratchDir, `vtrace_${category}.py`);
  fs.writeFileSync(scratchPy, pyCode);
  execSync(`python "${scratchPy}"`);

  const svgTxt = fs.readFileSync(svgDest, 'utf8');
  const pathCount = (svgTxt.match(/<path/g) || []).length;
  const svgKb = (fs.statSync(svgDest).size / 1024).toFixed(2);
  console.log(`✅ High-Contrast SVG exported: public/food-svgs/${category}.svg (${svgKb} KB, ${pathCount} paths)`);

  // 7. Export 192x192 transparent WebP (< 12 KB) DIRECTLY FROM THE VECTORIZED SVG
  const webpDest = path.join(iconsDir, `${category}.webp`);
  let quality = 86;
  let webpBuf = await sharp(svgDest)
    .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality, effort: 6 })
    .toBuffer();

  while (webpBuf.length > 12 * 1024 && quality > 64) {
    quality -= 4;
    webpBuf = await sharp(svgDest)
      .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality, effort: 6 })
      .toBuffer();
  }
  fs.writeFileSync(webpDest, webpBuf);

  const webpKb = (webpBuf.length / 1024).toFixed(2);
  console.log(`✅ Vectorized WebP exported: public/icons/food/${category}.webp (${webpKb} KB, q=${quality})`);

  // Copy to aliases if defined
  if (alias) {
    fs.copyFileSync(svgDest, path.join(svgsDir, `${alias}.svg`));
    fs.copyFileSync(webpDest, path.join(iconsDir, `${alias}.webp`));
    console.log(`🔗 Aliased to ${alias}.svg & ${alias}.webp`);
  }
}

async function main() {
  console.log('🚀 Running Autonomous Food Remixer on surgical edited photos...');
  for (const item of EDITED_ITEMS) {
    await processItem(item);
  }
  console.log('\n✨ All 6 surgically edited food items vectorized & exported successfully!');
}

main().catch((err) => {
  console.error('Pipeline failed:', err);
  process.exit(1);
});
