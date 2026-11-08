import sharp from 'sharp';

async function checkNonTransparent(name) {
  const file = `public/icons/food/${name}.webp`;
  const img = sharp(file);
  const meta = await img.metadata();
  const { data } = await img.raw().toBuffer({ resolveWithObject: true });
  const w = meta.width;
  const h = meta.height;

  console.log(`\n=== Checking ${name}.webp (${w}x${h}) ===`);
  // Let's count how many non-transparent pixels exist in the outer 10% margin
  let borderAlphaCount = 0;
  let whitePixelsCount = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const a = data[idx + 3];
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      if (a > 10) {
        if (x < 15 || x > w - 15 || y < 15 || y > h - 15) {
          borderAlphaCount++;
        }
        if (r > 210 && g > 210 && b > 210) {
          whitePixelsCount++;
        }
      }
    }
  }
  console.log(`Border alpha pixels (>10 alpha in outer 15px): ${borderAlphaCount}`);
  console.log(`Light/white pixels total: ${whitePixelsCount}`);

  // Let's also check the corners
  for (const [cx, cy, label] of [
    [5, 5, 'top-left'],
    [w - 5, 5, 'top-right'],
    [5, h - 5, 'bottom-left'],
    [w - 5, h - 5, 'bottom-right'],
    [Math.floor(w / 2), 5, 'top-mid'],
    [Math.floor(w / 2), h - 5, 'bottom-mid'],
    [5, Math.floor(h / 2), 'left-mid'],
    [w - 5, Math.floor(h / 2), 'right-mid'],
  ]) {
    const idx = (cy * w + cx) * 4;
    console.log(`${label} (${cx}, ${cy}): [${data[idx]}, ${data[idx+1]}, ${data[idx+2]}, ${data[idx+3]}]`);
  }
}

await checkNonTransparent('coffee');
await checkNonTransparent('pizza');
await checkNonTransparent('ramen');
await checkNonTransparent('croissant');
await checkNonTransparent('cinnamon_roll');
await checkNonTransparent('banh_mi');
