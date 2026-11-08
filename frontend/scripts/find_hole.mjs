import sharp from 'sharp';

async function findHole() {
  const file = 'C:\\Users\\abdis\\.gemini\\antigravity\\brain\\aa12b53b-04fa-4259-8560-24d7f40dbfbd\\pistachio_latte_terracotta_tulip_1793834825770.jpg';
  const img = sharp(file);
  const meta = await img.metadata();
  const { data } = await img.raw().toBuffer({ resolveWithObject: true });
  const w = meta.width;
  const h = meta.height;

  // Let's print colors in the right-side area
  const minX = Math.floor(w * 0.65);
  const maxX = Math.floor(w * 0.85);
  const minY = Math.floor(h * 0.45);
  const maxY = Math.floor(h * 0.80);

  const step = 8;
  console.log(`Scanning x: ${minX}..${maxX}, y: ${minY}..${maxY}`);
  for (let y = minY; y < maxY; y += step) {
    let line = '';
    for (let x = minX; x < maxX; x += step) {
      const idx = (y * w + x) * meta.channels;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const chroma = max - min;
      const brightness = (r + g + b) / 3;

      if (brightness > 230 && chroma < 15) {
        line += ' '; // White
      } else if (chroma > 40) {
        line += 'T'; // Terracotta ceramic handle/cup
      } else {
        line += '.'; // Shadow
      }
    }
    console.log(line);
  }
}

await findHole();
