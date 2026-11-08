import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const brain = 'C:/Users/abdis/.gemini/antigravity/brain/aa12b53b-04fa-4259-8560-24d7f40dbfbd';
const filtersDir = path.resolve('public/icons/filters');

const icons = [
  { id: 'coffee_tea', name: 'Coffee & Tea (Clipped Handle)' },
  { id: 'pastries_bakery', name: 'Pastries & Bakery' },
  { id: 'breads', name: 'Breads & Flatbreads' },
  { id: 'noodles_soup', name: 'Noodles & Soup' },
  { id: 'dumplings_buns', name: 'Dumplings & Buns' },
  { id: 'sandwiches_handhelds', name: 'Sandwiches & Handhelds' },
  { id: 'pizza_pasta', name: 'Pizza & Pasta' },
  { id: 'chicken_grill', name: 'Chicken & Grill' },
  { id: 'rice_bowls', name: 'Rice & Bowls' },
  { id: 'seafood', name: 'Seafood & Raw Bar' },
  { id: 'sweets_frozen', name: 'Sweets & Frozen' },
  { id: 'drinks_bars', name: 'Drinks & Wine' },
  { id: 'brunch', name: 'Brunch & Toast' },
];

async function generateProof() {
  const cardW = 180;
  const cardH = 180;
  const cols = 4;
  const rows = Math.ceil(icons.length / cols);
  const totalW = cols * cardW + 40;
  const totalH = rows * cardH + 100;

  const composites = [];

  for (let i = 0; i < icons.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = 20 + col * cardW;
    const y = 80 + row * cardH;

    const iconPath = path.join(filtersDir, icons[i].id + '.webp');
    if (fs.existsSync(iconPath)) {
      const rawBuf = await sharp(iconPath).resize(90, 90, { fit: 'contain' }).png().toBuffer();
      
      const isClipped = icons[i].id === 'coffee_tea';
      const strokeColor = isClipped ? '#E84A27' : '#D5CBBF';
      const strokeW = isClipped ? 2.5 : 1;
      const tagColor = isClipped ? '#E84A27' : '#181615';

      const cardSvg = Buffer.from(`
        <svg width="${cardW - 16}" height="${cardH - 16}">
          <rect x="0" y="0" width="${cardW - 16}" height="${cardH - 16}" rx="16" fill="#FAF7F2" stroke="${strokeColor}" stroke-width="${strokeW}"/>
          <text x="${(cardW - 16)/2}" y="${cardH - 30}" font-family="sans-serif" font-size="10" font-weight="bold" fill="${tagColor}" text-anchor="middle">${icons[i].name.replace('&', '&amp;')}</text>
        </svg>
      `);
      composites.push({ input: cardSvg, left: x + 8, top: y + 8 });
      composites.push({ input: rawBuf, left: x + 41, top: y + 25 });
    }
  }

  const headerSvg = Buffer.from(`
    <svg width="${totalW}" height="70">
      <rect width="${totalW}" height="70" fill="#181615"/>
      <text x="24" y="30" font-family="sans-serif" font-size="16" font-weight="bold" fill="#FAF7F2">Smakr Map Pins &amp; Icons Audit Sheet (All 13 Categories)</text>
      <text x="24" y="52" font-family="sans-serif" font-size="11" fill="#A8A29E">Visualizing 192x192 WebP art bounding boxes, canvas clipping &amp; die-cut outlines</text>
    </svg>
  `);
  composites.push({ input: headerSvg, left: 0, top: 0 });

  const finalImg = await sharp({
    create: {
      width: totalW,
      height: totalH,
      channels: 4,
      background: { r: 236, g: 231, b: 221, alpha: 1 }
    }
  }).composite(composites).png().toBuffer();

  const outPath = path.join(brain, 'all_map_icons_audit_proof.png');
  fs.writeFileSync(outPath, finalImg);
  console.log('Saved audit sheet to:', outPath);
}
generateProof();
