#!/usr/bin/env node
/**
 * Smakr Real-Photo De-Identification & High-Contrast Vectorizer Pipeline
 *
 * RULE 1: Never use AI-slop cartoon/gouache prompts. Start from real optical photography.
 * RULE 2: De-identify & transform real food cutouts in sharp:
 *   - Flip horizontally (.flop()) and rotate slightly (-8deg to +12deg)
 *   - For coffee: shift recognizable crimson double-saucer hue to warm roasted terracotta/espresso & crop tighter
 *   - Boost micro-contrast and crispness: .sharpen({ sigma: 1.4, m1: 1.5, m2: 3.0 }).linear(1.18, -14).modulate({ saturation: 1.15 })
 * RULE 3: Apply the K-Chicken / Garlic Naan Vectorizer Preset:
 *   - ZERO .median() blurring
 *   - Quantize with 44 real photographic colors (dither: 0)
 *   - VTracer: color_precision: 7, layer_difference: 12, filter_speckle: 4, mode: 'spline'
 *   - Export both .svg and 192x192 .webp (< 12 KB) directly from the vectorized output
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
const angleArg = process.argv[4] ? parseFloat(process.argv[4]) : 8;

if (!inputArg || !categoryArg) {
  console.log('Usage: node scripts/generate-food-icon.mjs <input-image-path> <category-name> [rotate-deg]');
  process.exit(1);
}

const inputPath = path.resolve(process.cwd(), inputArg);
const category = categoryArg.toLowerCase().trim().replace(/[\s-]/g, '_');

if (!fs.existsSync(inputPath)) {
  console.error(`Error: Input file not found: ${inputPath}`);
  process.exit(1);
}

const ROTATION_BY_CATEGORY = {
  pizza: 10,
  coffee: -8,
  banh_mi: -7,
  vietnamese: -7,
  ramen: 12,
  croissant: -9,
  bakery: -9,
  cinnamon_roll: 9,
  kanelbolle: 9,
};

async function run() {
  const rotateDeg = ROTATION_BY_CATEGORY[category] ?? angleArg;
  console.log(`\n🎨 Processing "${category}" from ${path.basename(inputPath)} (flop + rotate ${rotateDeg}deg)...`);

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

  for (let x = 0; x < w; x++) {
    if (isWhite(x, 0)) queue.push(x, 0);
    if (isWhite(x, h - 1)) queue.push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    if (isWhite(0, y)) queue.push(0, y);
    if (isWhite(w - 1, y)) queue.push(w - 1, y);
  }

  while (queue.length > 0) {
    const cy = queue.pop();
    const cx = queue.pop();
    const pos = cy * w + cx;
    if (visited[pos]) continue;
    visited[pos] = 1;

    data[pos * 4 + 3] = 0;

    if (cx > 0 && !visited[pos - 1] && isWhite(cx - 1, cy)) queue.push(cx - 1, cy);
    if (cx < w - 1 && !visited[pos + 1] && isWhite(cx + 1, cy)) queue.push(cx + 1, cy);
    if (cy > 0 && !visited[pos - w] && isWhite(cx, cy - 1)) queue.push(cx, cy - 1);
    if (cy < h - 1 && !visited[pos + w] && isWhite(cx, cy + 1)) queue.push(cx, cy + 1);
  }

  // Defringe 1px border halo
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const pos = y * w + x;
      if (!visited[pos]) {
        if (visited[pos - 1] || visited[pos + 1] || visited[pos - w] || visited[pos + w]) {
          const idx = pos * 4;
          if (data[idx] > 234 && data[idx + 1] > 234 && data[idx + 2] > 234) {
            data[idx + 3] = 0;
            visited[pos] = 1;
          }
        }
      }
    }
  }

  // Special de-identification for coffee:
  // 1) Remove the recognizable outer double-saucer ring using an elliptical mask around the cup + handle
  // 2) Shift crimson-red ceramic pixels to warm roasted espresso-terracotta bronze while preserving green pistachio & cream latte art
  if (category === 'coffee') {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        if (data[idx + 3] === 0) continue;

        // Union of top foam rim ellipse, tapered cup bowl ellipse, and right handle ellipse
        const tx = (x - w * 0.50) / (w * 0.265);
        const ty = (y - h * 0.39) / (h * 0.165);
        const inTopRim = tx * tx + ty * ty <= 1.0;

        const bx = (x - w * 0.50) / (w * 0.235);
        const by = (y - h * 0.46) / (h * 0.202);
        const inCupBowl = bx * bx + by * by <= 1.0;

        const hx = (x - w * 0.675) / (w * 0.115);
        const hy = (y - h * 0.575) / (h * 0.125);
        const inHandle = hx * hx + hy * hy <= 1.0;

        if (!inTopRim && !inCupBowl && !inHandle) {
          // Strip outer saucer completely
          data[idx + 3] = 0;
          continue;
        }

        // Shift crimson/pinkish ceramic pixels to rich warm terracotta-espresso (never grey!)
        const r = data[idx], g = data[idx + 1], b = data[idx + 2];
        if (r > g * 1.25 && r > b * 1.12 && r > 60) {
          data[idx] = Math.min(255, Math.round(r * 1.04));
          data[idx + 1] = Math.min(255, Math.round(r * 0.36 + g * 0.24));
          data[idx + 2] = Math.min(255, Math.round(r * 0.15 + b * 0.14));
        }
      }
    }
  }

  // 3. Structural Transform: Horizontal Flip (.flop()) + Rotation + Trim + 8% Safe Padding
  const transparentPng = await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
  const transformed = await sharp(transparentPng)
    .flop()
    .rotate(rotateDeg, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const trimmed = await sharp(transformed).trim().png().toBuffer();
  const trimmedMeta = await sharp(trimmed).metadata();

  const maxDim = Math.max(trimmedMeta.width, trimmedMeta.height);
  const padCanvasSize = Math.round(maxDim * 1.14);

  // 4. Boost Micro-Contrast & Crispness (ZERO .median() blurring!)
  const sharpenedPng = await sharp(trimmed)
    .resize(padCanvasSize, padCanvasSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .sharpen({ sigma: 1.4, m1: 1.5, m2: 3.0 })
    .linear(1.18, -14)
    .modulate({ saturation: 1.15 })
    .png()
    .toBuffer();

  const iconsDir = path.join(rootDir, 'public', 'icons', 'food');
  const svgsDir = path.join(rootDir, 'public', 'food-svgs');
  fs.mkdirSync(iconsDir, { recursive: true });
  fs.mkdirSync(svgsDir, { recursive: true });

  // 5. Quantize with 44 real photographic colors (dither: 0 so zero stipple noise!) at 384x384
  const quantPng = path.join(svgsDir, `${category}-quant.png`);
  await sharp(sharpenedPng)
    .resize(384, 384, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ palette: true, colors: 44, dither: 0 })
    .toFile(quantPng);

  // 6. Run VTracer with the K-Chicken / Garlic Naan High-Detail Preset
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
  const scratchDir = path.join(rootDir, '..', 'scratch');
  fs.mkdirSync(scratchDir, { recursive: true });
  const scratchPy = path.join(scratchDir, 'vtrace_temp.py');
  fs.writeFileSync(scratchPy, pyCode);
  execSync(`python "${scratchPy}"`);

  const svgTxt = fs.readFileSync(svgDest, 'utf8');
  const pathCount = (svgTxt.match(/<path/g) || []).length;
  const svgKb = (fs.statSync(svgDest).size / 1024).toFixed(2);
  console.log(`✅ High-Contrast SVG exported: public/food-svgs/${category}.svg (${svgKb} KB, ${pathCount} paths)`);

  // 7. Export 192x192 transparent WebP (< 12 KB) DIRECTLY FROM THE VECTORIZED SVG
  // so the WebP is a 100% stylized vector render, never a raw copy-pasted photo!
  const webpDest = path.join(iconsDir, `${category}.webp`);
  let quality = 86;
  let webpBuf = await sharp(svgDest)
    .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality, effort: 6 })
    .toBuffer();

  while (webpBuf.length > 12 * 1024 && quality > 68) {
    quality -= 4;
    webpBuf = await sharp(svgDest)
      .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality, effort: 6 })
      .toBuffer();
  }
  fs.writeFileSync(webpDest, webpBuf);

  const webpKb = (webpBuf.length / 1024).toFixed(2);
  console.log(`✅ Vectorized WebP exported: public/icons/food/${category}.webp (${webpKb} KB, q=${quality})`);
}

run().catch((err) => {
  console.error('Pipeline failed:', err);
  process.exit(1);
});
