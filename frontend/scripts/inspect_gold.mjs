import fs from 'fs';

function inspectGold(file) {
  const content = fs.readFileSync(file, 'utf8');
  console.log(`\n=== GOLD STANDARD: ${file} ===`);
  const paths = [...content.matchAll(/<path[^>]*d="([^"]+)"[^>]*fill="([^"]+)"/g)].map(m => ({
    d: m[1],
    fill: m[2]
  }));

  console.log(`Total paths: ${paths.length}`);
  const cornerPaths = paths.filter(p => p.d.startsWith('M0 0') || p.d.startsWith('M 0 0'));
  console.log(`Corner (0,0) paths count: ${cornerPaths.length}`);
  for (const cp of cornerPaths) {
    console.log(`  Corner fill: ${cp.fill}, length: ${cp.d.length}`);
  }
}

inspectGold('public/food-svgs/k-chicken.svg');
inspectGold('public/food-svgs/naan.svg');
