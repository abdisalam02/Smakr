#!/usr/bin/env node
/**
 * Free Local Recraft-Style Food Icon Factory
 *
 * Stage 2: Alpha background strip (flood fill #FFFFFF), trim borders, 8% safe padding, .median(3)
 * Stage 3: Dual export:
 *   - 192x192 transparent WebP (< 10 KB) -> public/icons/food/{category}.webp
 *   - Quantized spline SVG (< 35 KB) -> public/food-svgs/{category}.svg
 *
 * Usage:
 *   node scripts/generate-food-icon.mjs <path-to-input-image> <category-name>
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const inputArg = process.argv[2];
const categoryArg = process.argv[3];

if (!inputArg || !categoryArg) {
  console.log('Usage: node scripts/generate-food-icon.mjs <input-image-path> <category-name>');
  console.log('Example: node scripts/generate-food-icon.mjs ./croissant.jpg bakery');
  process.exit(1);
}

const inputPath = path.resolve(process.cwd(), inputArg);
const category = categoryArg.toLowerCase().trim().replace(/[\s-]/g, '_');

if (!fs.existsSync(inputPath)) {
  console.error(`Error: Input file not found: ${inputPath}`);
  process.exit(1);
}

async function run() {
  console.log(`\n🎨 Stage 2 & 3: Processing "${category}" from ${path.basename(inputPath)}...`);

  const image = sharp(inputPath);
  const meta = await image.metadata();
  const w = meta.width;
  const h = meta.height;

  // 1. Raw buffer with alpha for background removal
  const { data } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  // 2. Flood fill #FFFFFF background to transparent
  const visited = new Uint8Array(w * h);
  const queue = [];

  function isWhite(x, y) {
    const idx = (y * w + x) * 4;
    return data[idx] > 238 && data[idx + 1] > 238 && data[idx + 2] > 238;
  }

  // Push borders
  for (let x = 0; x < w; x++) {
    if (isWhite(x, 0)) queue.push(x, 0);
    if (isWhite(x, h - 1)) queue.push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    if (isWhite(0, y)) queue.push(0, y);
    if (isWhite(w - 1, y)) queue.push(w - 1);
  }

  while (queue.length > 0) {
    const cy = queue.pop();
    const cx = queue.pop();
    const pos = cy * w + cx;
    if (visited[pos]) continue;
    visited[pos] = 1;

    data[pos * 4 + 3] = 0; // Alpha = 0

    if (cx > 0 && !visited[pos - 1] && isWhite(cx - 1, cy)) queue.push(cx - 1, cy);
    if (cx < w - 1 && !visited[pos + 1] && isWhite(cx + 1, cy)) queue.push(cx + 1, cy);
    if (cy > 0 && !visited[pos - w] && isWhite(cx, cy - 1)) queue.push(cx, cy - 1);
    if (cy < h - 1 && !visited[pos + w] && isWhite(cx, cy + 1)) queue.push(cx, cy + 1);
  }

  // Defringe edges
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const pos = y * w + x;
      if (!visited[pos]) {
        if (visited[pos - 1] || visited[pos + 1] || visited[pos - w] || visited[pos + w]) {
          const idx = pos * 4;
          if (data[idx] > 235 && data[idx + 1] > 235 && data[idx + 2] > 235) {
            data[idx + 3] = 0;
            visited[pos] = 1;
          }
        }
      }
    }
  }

  // 3. Trim and add 8% safe padding
  const transparentPng = await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
  const trimmed = await sharp(transparentPng).trim().png().toBuffer();
  const trimmedMeta = await sharp(trimmed).metadata();

  const maxDim = Math.max(trimmedMeta.width, trimmedMeta.height);
  const padCanvasSize = Math.round(maxDim * 1.16);

  const paddedPng = await sharp(trimmed)
    .resize(padCanvasSize, padCanvasSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // Destination folders
  const iconsDir = path.join(rootDir, 'public', 'icons', 'food');
  const svgsDir = path.join(rootDir, 'public', 'food-svgs');
  fs.mkdirSync(iconsDir, { recursive: true });
  fs.mkdirSync(svgsDir, { recursive: true });

  // 4. Export WebP (< 10 KB)
  const webpDest = path.join(iconsDir, `${category}.webp`);
  await sharp(paddedPng)
    .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .median(3)
    .webp({ quality: 90 })
    .toFile(webpDest);

  const webpKb = (fs.statSync(webpDest).size / 1024).toFixed(2);
  console.log(`✅ WebP exported: public/icons/food/${category}.webp (${webpKb} KB)`);

  // 5. Quantize for VTracer (< 35 KB)
  const quantPng = path.join(svgsDir, `${category}-quant.png`);
  await sharp(paddedPng)
    .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .median(4)
    .png({ palette: true, colors: 12 })
    .toFile(quantPng);

  const svgDest = path.join(svgsDir, `${category}.svg`);
  const pyCode = `
import vtracer
vtracer.convert_image_to_svg_py(
    r"${quantPng}",
    r"${svgDest}",
    colormode='color',
    hierarchical='stacked',
    mode='spline',
    filter_speckle=16,
    color_precision=5,
    layer_difference=32,
    corner_threshold=60,
    length_threshold=4.0,
    max_iterations=10,
    splice_threshold=45,
    path_precision=2
)
`;
  const scratchPy = path.join(rootDir, '..', 'scratch', 'vtrace_temp.py');
  fs.writeFileSync(scratchPy, pyCode);
  execSync(`python "${scratchPy}"`);

  const svgTxt = fs.readFileSync(svgDest, 'utf8');
  const pathCount = (svgTxt.match(/<path/g) || []).length;
  const svgKb = (fs.statSync(svgDest).size / 1024).toFixed(2);
  console.log(`✅ Lightweight SVG exported: public/food-svgs/${category}.svg (${svgKb} KB, ${pathCount} paths)`);
}

run().catch((err) => {
  console.error('Pipeline failed:', err);
  process.exit(1);
});
