import sharp from 'sharp';

async function inspectCoffee() {
  const file = 'C:\\Users\\abdis\\.gemini\\antigravity\\brain\\aa12b53b-04fa-4259-8560-24d7f40dbfbd\\pistachio_latte_terracotta_tulip_1793834825770.jpg';
  const img = sharp(file);
  const meta = await img.metadata();
  const { data } = await img.raw().toBuffer({ resolveWithObject: true });
  const w = meta.width;
  const h = meta.height;

  console.log(`Coffee image: ${w}x${h}`);
  // Check the seed at xRel=0.70, yRel=0.60
  const hx = Math.round(w * 0.70);
  const hy = Math.round(h * 0.60);
  const idx = (hy * w + hx) * meta.channels;
  console.log(`Seed at (${hx}, ${hy}): [${data[idx]}, ${data[idx+1]}, ${data[idx+2]}]`);

  // Let's scan an area around the handle (right side: x from 0.6*w to 0.95*w, y from 0.4*h to 0.8*h)
  // Let's find any white/light pixels in the interior of the handle
  for (let y = Math.round(0.4 * h); y < Math.round(0.8 * h); y += 20) {
    let row = '';
    for (let x = Math.round(0.6 * w); x < Math.round(0.95 * w); x += 20) {
      const i = (y * w + x) * meta.channels;
      const isLt = data[i] > 230 && data[i+1] > 230 && data[i+2] > 230;
      row += isLt ? '.' : '#';
    }
    console.log(`y=${y}: ${row}`);
  }
}

await inspectCoffee();
