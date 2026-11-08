import fs from 'fs';
import path from 'path';

function inspectSvg(file) {
  const content = fs.readFileSync(file, 'utf8');
  console.log(`\n=== SVG: ${file} ===`);
  const paths = [...content.matchAll(/<path[^>]*d="([^"]+)"[^>]*fill="([^"]+)"/g)].map(m => ({
    d: m[1],
    fill: m[2]
  }));

  // Find light fills
  const lightPaths = paths.filter(p => {
    const f = p.fill.replace('#', '');
    if (f.length === 6) {
      const r = parseInt(f.slice(0, 2), 16);
      const g = parseInt(f.slice(2, 4), 16);
      const b = parseInt(f.slice(4, 6), 16);
      return r > 200 && g > 200 && b > 200;
    }
    return false;
  });

  console.log(`Total paths: ${paths.length}, Light paths: ${lightPaths.length}`);
  for (const lp of lightPaths.slice(0, 10)) {
    console.log(`Fill: ${lp.fill}, d-length: ${lp.d.length}, d-start: ${lp.d.slice(0, 80)}`);
  }
}

inspectSvg('public/food-svgs/coffee.svg');
inspectSvg('public/food-svgs/pizza.svg');
