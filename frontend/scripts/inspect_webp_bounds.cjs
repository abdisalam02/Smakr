const sharp = require('../node_modules/sharp');
const fs = require('fs');
const path = require('path');

async function run() {
  const dir = path.join(__dirname, '../public/icons/food');
  const files = fs.readdirSync(dir).filter(x => x.endsWith('.webp'));
  for (const f of files) {
    const { data, info } = await sharp(path.join(dir, f)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let minX = info.width, maxX = 0, minY = info.height, maxY = 0;
    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width; x++) {
        if (data[(y * info.width + x) * 4 + 3] > 25) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    // Also check bottom 20% of the object's height
    const botStart = Math.floor(maxY - (maxY - minY) * 0.2);
    let bMinX = info.width, bMaxX = 0;
    for (let y = botStart; y <= maxY; y++) {
      for (let x = 0; x < info.width; x++) {
        if (data[(y * info.width + x) * 4 + 3] > 25) {
          if (x < bMinX) bMinX = x;
          if (x > bMaxX) bMaxX = x;
        }
      }
    }
    const cx = ((minX + maxX) / 2 / info.width * 100).toFixed(1);
    const bcx = ((bMinX + bMaxX) / 2 / info.width * 100).toFixed(1);
    if (Math.abs( Number(bcx) - 50 ) > 3) {
      console.log(f.padEnd(22), `overallCX: ${cx}%`, `bottomBaseCX: ${bcx}%`);
    }
  }
}
run();
