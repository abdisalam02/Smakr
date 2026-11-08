import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function check(name) {
  const svgPath = path.resolve('public/food-svgs', name + '.svg');
  const webpPath = path.resolve('public/icons/food', name + '.webp');

  const svg = fs.readFileSync(svgPath, 'utf8');
  console.log(`\n=== ${name}.svg ===`);
  const match = svg.match(/<path[^>]+fill="([^"]+)"/);
  console.log('First path fill:', match ? match[1] : 'none');

  // Find all paths with fill
  const fills = [...svg.matchAll(/<path\s+d="([^"]+)"\s+fill="([^"]+)"/g)].map(m => ({ d: m[1], fill: m[2] }));
  console.log('Total paths:', fills.length);
  if (fills.length > 0) {
    console.log('Path 0 d start:', fills[0].d.slice(0, 100), 'fill:', fills[0].fill);
    console.log('Path 1 d start:', fills[1]?.d.slice(0, 100), 'fill:', fills[1]?.fill);
  }

  // Check quantPng
  const quantPng = path.resolve('public/food-svgs', name + '-quant.png');
  if (fs.existsSync(quantPng)) {
    const qimg = sharp(quantPng);
    const { data, info } = await qimg.raw().toBuffer({ resolveWithObject: true });
    console.log(`Quant PNG channels: ${info.channels}, size: ${info.width}x${info.height}`);
    const getPx = (x, y) => {
      const i = (y * info.width + x) * info.channels;
      return [data[i], data[i+1], data[i+2], data[i+3]];
    };
    console.log('Quant Top-left (0,0):', getPx(0, 0));
    console.log('Quant (10,10):', getPx(10, 10));
    console.log('Quant (370,10):', getPx(370, 10));
    console.log('Quant (370,370):', getPx(370, 370));
    console.log('Quant (10,370):', getPx(10, 370));
  }
}

await check('coffee');
await check('pizza');
