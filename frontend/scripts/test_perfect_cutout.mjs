import sharp from 'sharp';

async function testThreshold() {
  const img = sharp('C:/Users/abdis/.gemini/antigravity/brain/aa12b53b-04fa-4259-8560-24d7f40dbfbd/var_15_togo_scandi_realism.png');
  const meta = await img.metadata();
  const { data } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = meta.width;
  const h = meta.height;

  function isBg(idx) {
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    // Background in var_15 is pure white: r >= 252, g >= 251, b >= 251
    return r >= 252 && g >= 251 && b >= 251;
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

  // Check the alpha map now!
  const stepX = Math.floor(w / 32);
  const stepY = Math.floor(h / 32);
  console.log('New alpha map (threshold 252):');
  for (let gy = 0; gy < 32; gy++) {
    let row = '';
    const y = gy * stepY;
    for (let gx = 0; gx < 32; gx++) {
      const x = gx * stepX;
      const idx = (y * w + x) * 4;
      const a = data[idx + 3];
      row += a > 128 ? 'X' : ' ';
    }
    console.log(row);
  }

  // Also trim the bottom contact shadow:
  // Let's inspect the bottom 10% of rows
  await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .trim()
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 95 })
    .toFile('public/icons/food/matcha.webp');

  console.log('Saved fixed matcha.webp!');
}

testThreshold();
