import sharp from 'sharp';

async function mapLightPixels(name) {
  const file = `public/icons/food/${name}.webp`;
  const img = sharp(file);
  const meta = await img.metadata();
  const { data } = await img.raw().toBuffer({ resolveWithObject: true });
  const w = meta.width;
  const h = meta.height;

  console.log(`\n=== ASCII MAP of Light Pixels in ${name}.webp (192x192) ===`);
  // Downsample to 24x24 ASCII grid
  const step = 8;
  for (let y = 0; y < h; y += step) {
    let line = '';
    for (let x = 0; x < w; x += step) {
      const idx = (y * w + x) * 4;
      const a = data[idx + 3];
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      if (a < 20) {
        line += ' '; // Transparent
      } else if (r > 200 && g > 200 && b > 200) {
        line += 'W'; // White / Light gray
      } else if (r > 150 && g > 50 && b < 80) {
        line += 'T'; // Terracotta / Red
      } else {
        line += '#'; // Other food
      }
    }
    console.log(line);
  }
}

await mapLightPixels('coffee');
await mapLightPixels('pizza');
