import sharp from 'sharp';

async function checkFoodBounds(file, name) {
  const img = sharp(file);
  const meta = await img.metadata();
  const { data } = await img.raw().toBuffer({ resolveWithObject: true });
  const w = meta.width;
  const h = meta.height;

  console.log(`\n=== BOUNDS: ${name} ===`);
  // Check borders for chromatic pixels (food)
  const isFood = (x, y) => {
    const idx = (y * w + x) * meta.channels;
    const r = data[idx], g = data[idx + 1], b = data[idx + 2];
    const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
    const brightness = (r + g + b) / 3;
    // Food is chromatic (maxDiff >= 20) or dark (brightness < 150)
    return maxDiff >= 20 || brightness < 150;
  };

  let minX = w, maxX = 0, minY = h, maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (isFood(x, y)) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  console.log(`Food bounding box: [${minX}, ${minY}] to [${maxX}, ${maxY}] (Image: ${w}x${h})`);
  console.log(`Margins: Left=${minX}, Top=${minY}, Right=${w - 1 - maxX}, Bottom=${h - 1 - maxY}`);
}

const brainDir = 'C:\\Users\\abdis\\.gemini\\antigravity\\brain\\aa12b53b-04fa-4259-8560-24d7f40dbfbd';
await checkFoodBounds(brainDir + '\\edited_pizza_slice_1793834827954.jpg', 'Pizza');
await checkFoodBounds(brainDir + '\\pistachio_latte_terracotta_tulip_1793834825770.jpg', 'Coffee');
