import sharp from 'sharp';
import fs from 'fs';

async function check() {
  const img = sharp('public/icons/food/matcha.webp');
  const meta = await img.metadata();
  const { data } = await img.raw().toBuffer({ resolveWithObject: true });
  console.log('Matcha webp size:', meta.width, 'x', meta.height);

  // Look at the alpha channel distribution
  // Let's print a 32x32 ASCII representation of the alpha channel of matcha.webp
  const stepX = Math.floor(meta.width / 32);
  const stepY = Math.floor(meta.height / 32);

  console.log('Alpha map of matcha.webp (X = solid, . = transparent):');
  for (let gy = 0; gy < 32; gy++) {
    let row = '';
    const y = gy * stepY;
    for (let gx = 0; gx < 32; gx++) {
      const x = gx * stepX;
      const idx = (y * meta.width + x) * 4;
      const a = data[idx + 3];
      row += a > 128 ? 'X' : a > 20 ? '.' : ' ';
    }
    console.log(row);
  }
}

check();
