import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { execSync } from 'child_process';

const artifactDir = 'C:/Users/abdis/.gemini/antigravity/brain/aa12b53b-04fa-4259-8560-24d7f40dbfbd';
const inputPath = path.join(artifactDir, 'bao_buns_illustration_png_1793886655960.jpg');

async function processBao(removeShadow = false, suffix = '') {
  const image = sharp(inputPath);
  const meta = await image.metadata();
  const w = meta.width;
  const h = meta.height;

  const { data } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  const visited = new Uint8Array(w * h);
  const queue = [];

  function isBackground(x, y) {
    const idx = (y * w + x) * 4;
    const r = data[idx], g = data[idx + 1], b = data[idx + 2];
    if (removeShadow) {
      // Treat white AND light lavender shadow as background
      const isWhite = r > 240 && g > 240 && b > 240;
      const isLightLavender = r > 185 && g > 175 && b > 200 && (b - g >= 8 || r - g >= 8);
      return isWhite || isLightLavender;
    } else {
      // Only treat white background as transparent, keep the watercolor shadow
      return r > 242 && g > 242 && b > 242;
    }
  }

  // Push border pixels
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
          if (data[idx] > 236 && data[idx + 1] > 236 && data[idx + 2] > 236) {
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

  const outWebp = path.join(artifactDir, `bao_test_${suffix}.webp`);
  await sharp(centeredPng)
    .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 92, alphaQuality: 100 })
    .toFile(outWebp);

  console.log(`Saved: ${outWebp} (${(fs.statSync(outWebp).size / 1024).toFixed(1)} KB)`);

  // Vectorize to SVG with VTracer
  const quantPng = path.join(artifactDir, `bao_quant_${suffix}.png`);
  await sharp(centeredPng)
    .resize(384, 384, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ palette: true, colors: 36, dither: 0 })
    .toFile(quantPng);

  const outSvg = path.join(artifactDir, `bao_test_${suffix}.svg`);
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
  const scratchPy = path.join(artifactDir, 'scratch', 'vtrace_temp.py');
  fs.mkdirSync(path.dirname(scratchPy), { recursive: true });
  fs.writeFileSync(scratchPy, pyCode);
  execSync(`python "${scratchPy}"`);
  console.log(`Saved SVG: ${outSvg} (${(fs.statSync(outSvg).size / 1024).toFixed(1)} KB)`);

  return { webp: outWebp, svg: outSvg };
}

async function main() {
  console.log('--- Processing Version 1: With Watercolor Shadow ---');
  await processBao(false, 'with_shadow');

  console.log('--- Processing Version 2: Clean Cutout (Food Only) ---');
  await processBao(true, 'clean');
}

main().catch(console.error);
