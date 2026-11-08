import sharp from 'sharp';

const brainDir = 'C:\\Users\\abdis\\.gemini\\antigravity\\brain\\aa12b53b-04fa-4259-8560-24d7f40dbfbd';

const ITEMS = [
  { name: 'Pizza', file: `${brainDir}\\edited_pizza_slice_1793834827954.jpg`, seeds: [] },
  { name: 'Coffee', file: `${brainDir}\\pistachio_latte_terracotta_tulip_1793834825770.jpg`, seeds: [{ xRel: 745/1024, yRel: 650/1024 }] },
  { name: 'Ramen', file: `${brainDir}\\ramen_photographic_edited_1793834837856.jpg`, seeds: [] },
  { name: 'Cinnamon_Roll', file: `${brainDir}\\edited_cinnamon_roll_1793834832363.jpg`, seeds: [] },
  { name: 'Banh_Mi', file: `${brainDir}\\banh_mi_edited_dslr_1793834837370.jpg`, seeds: [] },
  { name: 'Croissant', file: `${brainDir}\\edited_hero_croissant_1793834841283.jpg`, seeds: [] },
];

async function testAll() {
  for (const item of ITEMS) {
    const img = sharp(item.file);
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
      if (brightness > 135 && chroma <= 24) return true;
      return false;
    }

    const visited = new Uint8Array(w * h);
    const queue = [];

    // Outer border
    for (let x = 0; x < w; x++) {
      if (isBg(x * 4)) queue.push(x, 0);
      if (isBg(((h - 1) * w + x) * 4)) queue.push(x, h - 1);
    }
    for (let y = 0; y < h; y++) {
      if (isBg((y * w) * 4)) queue.push(0, y);
      if (isBg((y * w + w - 1) * 4)) queue.push(w - 1, y);
    }

    // Additional seeds (e.g. handle hole)
    for (const seed of item.seeds) {
      const sx = Math.round(w * seed.xRel);
      const sy = Math.round(h * seed.yRel);
      const sidx = (sy * w + sx) * 4;
      if (isBg(sidx)) {
        queue.push(sx, sy);
      }
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

    // Defringe 1px border
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

    let foodPixels = 0;
    for (let i = 0; i < w * h; i++) {
      if (data[i * 4 + 3] > 0) foodPixels++;
    }

    const trimmed = await sharp(data, { raw: { width: w, height: h, channels: 4 } }).trim().png().toBuffer();
    const tmeta = await sharp(trimmed).metadata();
    console.log(`[${item.name}] Initial: ${w}x${h} -> Trimmed: ${tmeta.width}x${tmeta.height}, Food pixels: ${foodPixels} (${(foodPixels / (w * h) * 100).toFixed(1)}%)`);
  }
}

await testAll();
