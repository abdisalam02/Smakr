import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const brainDir = 'C:/Users/abdis/.gemini/antigravity/brain/aa12b53b-04fa-4259-8560-24d7f40dbfbd';
const publicFoodDir = path.resolve('public/icons/food');

async function cutOutAndSave(inputPath, outName) {
  const img = sharp(inputPath);
  const meta = await img.metadata();
  const { data } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = meta.width;
  const h = meta.height;

  function isBg(idx) {
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    // Solid white or near white background
    return r >= 250 && g >= 250 && b >= 250;
  }

  const visited = new Uint8Array(w * h);
  const queue = [];

  for (let x = 0; x < w; x++) {
    if (isBg(x * 4)) queue.push(x, 0);
    if (isBg(((h - 1) * w + x) * 4)) queue.push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    if (isBg((y * w) * 4)) queue.push(0, y);
    if (isBg((y * w + w - 1) * 4)) queue.push(w - 1, y);
  }

  while (queue.length > 0) {
    const cy = queue.pop();
    const cx = queue.pop();
    const pos = cy * w + cx;
    if (visited[pos]) continue;
    visited[pos] = 1;

    data[pos * 4 + 3] = 0;

    if (cx > 0 && !visited[pos - 1] && isBg((pos - 1) * 4)) queue.push(cx - 1, cy);
    if (cx < w - 1 && !visited[pos + 1] && isBg((pos + 1) * 4)) queue.push(cx + 1, cy);
    if (cy > 0 && !visited[pos - w] && isBg((pos - w) * 4)) queue.push(cx, cy - 1);
    if (cy < h - 1 && !visited[pos + w] && isBg((pos + w) * 4)) queue.push(cx, cy + 1);
  }

  const trimmed = await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .trim()
    .toBuffer();

  const outPath = path.join(publicFoodDir, `${outName}.webp`);
  await sharp(trimmed)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 95 })
    .toFile(outPath);

  console.log(`Saved ${outPath} (${fs.statSync(outPath).size} bytes)`);
}

async function run() {
  await cutOutAndSave(path.join(brainDir, 'var_21_mandi_transformed_realism.png'), 'mandi_rice');
  await cutOutAndSave(path.join(brainDir, 'var_22_cheesesteak_transformed_realism.png'), 'cheesesteak');
}

run().catch(console.error);
