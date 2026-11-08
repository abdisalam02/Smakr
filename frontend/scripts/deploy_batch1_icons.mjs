import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { execSync } from 'child_process';

const brain = 'C:/Users/abdis/.gemini/antigravity/brain/aa12b53b-04fa-4259-8560-24d7f40dbfbd';
const publicIconsDir = path.resolve('public/icons/food');
const publicSvgDir = path.resolve('public/food-svgs');

fs.mkdirSync(publicIconsDir, { recursive: true });
fs.mkdirSync(publicSvgDir, { recursive: true });

const BATCH = [
  {
    name: 'pastries',
    src: path.join(brain, 'handdrawn_pastries_sketchbook_1793887811115.jpg'),
    targetsWebp: ['croissant.webp', 'bakery.webp', 'pastries.webp'],
    targetsSvg: ['croissant.svg', 'bakery.svg', 'pastries.svg'],
  },
  {
    name: 'breads',
    src: path.join(brain, 'breads_basket_sketchbook_v3_1793887873367.jpg'),
    targetsWebp: ['breads.webp', 'naan.webp'],
    targetsSvg: ['breads.svg', 'naan.svg'],
  },
  {
    name: 'coffee',
    src: path.join(brain, 'coffee_tea_sketchbook_final_1793887890606.jpg'),
    targetsWebp: ['coffee.webp', 'coffee_tea.webp'],
    targetsSvg: ['coffee.svg', 'coffee_tea.svg'],
  },
  {
    name: 'noodles',
    src: path.join(brain, 'sketchbook_noodles_illustration_centered_1793887913248.jpg'),
    targetsWebp: ['ramen.webp', 'noodles.webp', 'noodles_soup.webp'],
    targetsSvg: ['ramen.svg', 'noodles.svg'],
  },
  {
    name: 'bao',
    src: path.join(brain, 'bao_buns_illustration_png_1793886655960.jpg'),
    targetsWebp: ['dumplings.webp', 'bao.webp', 'dumplings_buns.webp'],
    targetsSvg: ['dumplings.svg', 'bao.svg'],
  },
];

async function processIcon(item) {
  console.log(`\n=== Processing ${item.name} from ${path.basename(item.src)} ===`);
  const image = sharp(item.src);
  const meta = await image.metadata();
  const w = meta.width;
  const h = meta.height;

  const { data } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  const visited = new Uint8Array(w * h);
  const queue = [];

  function isBackground(x, y) {
    const idx = (y * w + x) * 4;
    const r = data[idx], g = data[idx + 1], b = data[idx + 2];
    // Background is white/off-white paper: keep soft watercolor shadows (which have b-g > 4 or r > 200 with g < 220)
    return r > 240 && g > 240 && b > 240;
  }

  // Seed borders
  for (let x = 0; x < w; x++) {
    if (isBackground(x, 0)) queue.push(x, 0);
    if (isBackground(x, h - 1)) queue.push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    if (isBackground(0, y)) queue.push(0, y);
    if (isBackground(w - 1, y)) queue.push(w - 1, y);
  }

  while (queue.length > 0) {
    const cy = queue.pop();
    const cx = queue.pop();
    const pos = cy * w + cx;
    if (visited[pos]) continue;
    visited[pos] = 1;

    data[pos * 4 + 3] = 0; // Alpha = 0

    if (cx > 0 && !visited[pos - 1] && isBackground(cx - 1, cy)) queue.push(cx - 1, cy);
    if (cx < w - 1 && !visited[pos + 1] && isBackground(cx + 1, cy)) queue.push(cx + 1, cy);
    if (cy > 0 && !visited[pos - w] && isBackground(cx, cy - 1)) queue.push(cx, cy - 1);
    if (cy < h - 1 && !visited[pos + w] && isBackground(cx, cy + 1)) queue.push(cx, cy + 1);
  }

  // Defringe 1px edge halo
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

  const rawPng = await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
  const trimmed = await sharp(rawPng).trim().png().toBuffer();
  const trimmedMeta = await sharp(trimmed).metadata();

  const maxDim = Math.max(trimmedMeta.width, trimmedMeta.height);
  const padSize = Math.round(maxDim * 1.10);

  const centeredPng = await sharp(trimmed)
    .resize(padSize, padSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // Export 192x192 WebP
  const webpBuffer = await sharp(centeredPng)
    .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 92, alphaQuality: 100 })
    .toBuffer();

  for (const targetName of item.targetsWebp) {
    const outPath = path.join(publicIconsDir, targetName);
    fs.writeFileSync(outPath, webpBuffer);
    console.log(`Saved WebP: ${targetName} (${(webpBuffer.length / 1024).toFixed(1)} KB)`);
  }

  // Vectorize to SVG with VTracer
  const quantPng = path.join(brain, 'scratch', `${item.name}_quant.png`);
  fs.mkdirSync(path.dirname(quantPng), { recursive: true });
  await sharp(centeredPng)
    .resize(384, 384, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ palette: true, colors: 36, dither: 0 })
    .toFile(quantPng);

  const primarySvgName = item.targetsSvg[0];
  const outSvg = path.join(publicSvgDir, primarySvgName);
  const pyCode = `import vtracer
vtracer.convert_image_to_svg_py(
    r"${quantPng.replace(/\\/g, '/')}",
    r"${outSvg.replace(/\\/g, '/')}",
    colormode='color',
    hierarchical='stacked',
    mode='spline',
    filter_speckle=4,
    color_precision=7,
    layer_difference=14,
    corner_threshold=50,
    length_threshold=4.0,
    max_iterations=10,
    splice_threshold=45
)
`;
  const scratchPy = path.join(brain, 'scratch', `vtrace_${item.name}.py`);
  fs.writeFileSync(scratchPy, pyCode);
  try {
    execSync(`python "${scratchPy}"`);
    const svgContent = fs.readFileSync(outSvg);
    console.log(`Saved SVG: ${primarySvgName} (${(svgContent.length / 1024).toFixed(1)} KB)`);
    for (let i = 1; i < item.targetsSvg.length; i++) {
      fs.writeFileSync(path.join(publicSvgDir, item.targetsSvg[i]), svgContent);
    }
  } catch (err) {
    console.error(`VTracer error for ${item.name}:`, err.message);
  }
}

async function main() {
  for (const item of BATCH) {
    await processIcon(item);
  }
  console.log('\nAll 5 batch-1 icons deployed successfully!');
}

main().catch(console.error);
