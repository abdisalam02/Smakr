import sharp from 'sharp';

async function testFloodFill(file, name) {
  const img = sharp(file);
  const meta = await img.metadata();
  const { data } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = meta.width;
  const h = meta.height;

  function isBg(idx) {
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const chroma = max - min;
    const brightness = (r + g + b) / 3;

    // 1. Off-white or white
    if (r > 235 && g > 235 && b > 235) return true;
    // 2. Neutral shadow on white background (low chroma, high-to-mid brightness)
    if (brightness > 140 && chroma <= 22) return true;
    return false;
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

    data[pos * 4 + 3] = 0; // Alpha = 0

    if (cx > 0 && !visited[pos - 1] && isBg((pos - 1) * 4)) queue.push(cx - 1, cy);
    if (cx < w - 1 && !visited[pos + 1] && isBg((pos + 1) * 4)) queue.push(cx + 1, cy);
    if (cy > 0 && !visited[pos - w] && isBg((pos - w) * 4)) queue.push(cx, cy - 1);
    if (cy < h - 1 && !visited[pos + w] && isBg((pos + w) * 4)) queue.push(cx, cy + 1);
  }

  // Count remaining non-transparent pixels
  let foodPixels = 0;
  for (let i = 0; i < w * h; i++) {
    if (data[i * 4 + 3] > 0) foodPixels++;
  }

  console.log(`\n=== Flood Fill Test: ${name} ===`);
  console.log(`Initial pixels: ${w * h}, Remaining food pixels: ${foodPixels} (${(foodPixels / (w * h) * 100).toFixed(1)}%)`);

  // Save preview image to brain directory for inspection
  const brainDir = 'C:\\Users\\abdis\\.gemini\\antigravity\\brain\\aa12b53b-04fa-4259-8560-24d7f40dbfbd';
  const outPng = `${brainDir}\\test_cutout_${name.toLowerCase()}.png`;
  await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toFile(outPng);
  console.log(`Saved test cutout: ${outPng}`);

  // Print 24x24 ASCII map of the cutout
  const step = Math.floor(w / 24);
  for (let gy = 0; gy < 24; gy++) {
    let line = '';
    const y = gy * step;
    for (let gx = 0; gx < 24; gx++) {
      const x = gx * step;
      const idx = (y * w + x) * 4;
      line += data[idx + 3] > 0 ? '#' : ' ';
    }
    console.log(line);
  }
}

const brainDir = 'C:\\Users\\abdis\\.gemini\\antigravity\\brain\\aa12b53b-04fa-4259-8560-24d7f40dbfbd';
await testFloodFill(brainDir + '\\edited_pizza_slice_1793834827954.jpg', 'Pizza');
await testFloodFill(brainDir + '\\pistachio_latte_terracotta_tulip_1793834825770.jpg', 'Coffee');
