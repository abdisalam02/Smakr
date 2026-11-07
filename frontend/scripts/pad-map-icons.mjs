import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const dirs = [
  path.resolve('public/icons/food'),
  path.resolve('public/icons/filters')
];

async function padIcon(filePath) {
  const fileBuf = fs.readFileSync(filePath);
  
  // 1. Trim to tight bounding box of non-transparent content
  const trimmedBuf = await sharp(fileBuf).trim().png().toBuffer();

  // 2. Fit to 160x160 contained within transparent box
  const resizedBuf = await sharp(trimmedBuf)
    .resize(160, 160, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();

  // 3. Extend by 16px on all 4 sides to make exact 192x192 with >= 16px safe margin
  const paddedBuf = await sharp(resizedBuf)
    .extend({
      top: 16,
      bottom: 16,
      left: 16,
      right: 16,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .webp({ quality: 92, alphaQuality: 95 })
    .toBuffer();

  fs.writeFileSync(filePath, paddedBuf);
}

async function main() {
  console.log('Padding all icons with 16px safety margin...');
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.webp'));
    for (const file of files) {
      const fullPath = path.join(dir, file);
      try {
        await padIcon(fullPath);
        console.log(`✓ Padded: ${file}`);
      } catch (err) {
        console.error(`✗ Error on ${file}:`, err.message);
      }
    }
  }
  console.log('Finished padding icons.');
}

main();
