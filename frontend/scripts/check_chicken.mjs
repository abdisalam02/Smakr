import sharp from 'sharp';

async function checkChicken() {
  const f1 = 'public/icons/food/fried_chicken.webp';
  const f2 = 'public/icons/food/k_chicken.webp';
  const img1 = sharp(f1);
  const img2 = sharp(f2);
  const meta1 = await img1.metadata();
  const meta2 = await img2.metadata();
  console.log(`fried_chicken.webp: ${meta1.width}x${meta1.height}, size=${meta1.size}`);
  console.log(`k_chicken.webp: ${meta2.width}x${meta2.height}, size=${meta2.size}`);

  // Also check if there are green pixels (scallions) in fried_chicken.webp
  const { data } = await img1.raw().toBuffer({ resolveWithObject: true });
  let greenPixels = 0;
  let whitePixels = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
    if (a > 100) {
      if (g > r * 1.15 && g > b * 1.15 && g > 60) greenPixels++;
      if (r > 220 && g > 220 && b > 210) whitePixels++;
    }
  }
  console.log(`fried_chicken.webp: greenPixels (scallions)=${greenPixels}, whitePixels (sesame)=${whitePixels}`);
}

await checkChicken();
