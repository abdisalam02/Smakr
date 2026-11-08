import sharp from 'sharp';

async function inspectSourceBackground(file, name) {
  const img = sharp(file);
  const meta = await img.metadata();
  const { data } = await img.raw().toBuffer({ resolveWithObject: true });
  const w = meta.width;
  const h = meta.height;

  console.log(`\n=== SOURCE BG ANALYSIS: ${name} (${w}x${h}) ===`);
  // Downsample to 32x32 grid and print average RGB
  const stepX = Math.floor(w / 24);
  const stepY = Math.floor(h / 24);

  for (let gy = 0; gy < 24; gy++) {
    let line = '';
    const y = gy * stepY;
    for (let gx = 0; gx < 24; gx++) {
      const x = gx * stepX;
      const idx = (y * w + x) * meta.channels;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
      const brightness = (r + g + b) / 3;

      // In real background: it's neutral (low chroma, maxDiff < 15) and light (brightness > 160 or > 180)
      if (brightness > 245) {
        line += ' '; // Pure white
      } else if (brightness > 200 && maxDiff < 18) {
        line += '.'; // Light gray/neutral background shadow
      } else if (brightness > 160 && maxDiff < 25) {
        line += 's'; // Darker shadow
      } else {
        line += '#'; // Food object
      }
    }
    console.log(line);
  }
}

const brainDir = 'C:\\Users\\abdis\\.gemini\\antigravity\\brain\\aa12b53b-04fa-4259-8560-24d7f40dbfbd';
await inspectSourceBackground(brainDir + '\\edited_pizza_slice_1793834827954.jpg', 'Pizza');
await inspectSourceBackground(brainDir + '\\pistachio_latte_terracotta_tulip_1793834825770.jpg', 'Coffee');
