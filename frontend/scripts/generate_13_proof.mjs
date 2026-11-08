import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const filtersDir = path.resolve('public/icons/filters');
const brain = 'C:/Users/abdis/.gemini/antigravity/brain/aa12b53b-04fa-4259-8560-24d7f40dbfbd';

const icons = [
  { id: 'pastries_bakery', name: 'Pastries & Bakery' },
  { id: 'breads', name: 'Breads & Flatbreads' },
  { id: 'coffee_tea', name: 'Coffee & Tea' },
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

async function makeSheet() {
  const cardW = 160;
  const cardH = 170;
  const cols = 5;
  const rows = Math.ceil(icons.length / cols);
  const totalW = cols * cardW + 40;
  const totalH = rows * cardH + 80;

  const composites = [];

  for (let i = 0; i < icons.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = 20 + col * cardW;
    const y = 60 + row * cardH;

    const iconPath = path.join(filtersDir, icons[i].id + '.webp');
    if (fs.existsSync(iconPath)) {
      const iconBuf = await sharp(iconPath).resize(110, 110, { fit: 'contain' }).png().toBuffer();
      composites.push({
        input: iconBuf,
        left: x + 25,
        top: y + 10,
      });
    }

    const labelText = icons[i].name.replace(/&/g, '&amp;');
    const labelSvg = Buffer.from(
      `<svg width="${cardW}" height="40"><text x="${cardW / 2}" y="24" font-family="sans-serif" font-size="11.5" font-weight="bold" fill="#181615" text-anchor="middle">${labelText}</text></svg>`
    );
    composites.push({
      input: labelSvg,
      left: x,
      top: y + 120,
    });
  }

  const titleSvg = Buffer.from(
    `<svg width="${totalW}" height="50"><text x="${totalW / 2}" y="34" font-family="sans-serif" font-size="18" font-weight="bold" fill="#e84a27" text-anchor="middle">Smakr 13 Sketchbook Food Filter Icons (100% Deployed)</text></svg>`
  );
  composites.push({
    input: titleSvg,
    left: 0,
    top: 10,
  });

  const outPath = path.join(brain, 'all_13_sketchbook_icons_proof.png');
  await sharp({
    create: {
      width: totalW,
      height: totalH,
      channels: 4,
      background: { r: 250, g: 247, b: 242, alpha: 1 },
    },
  })
    .composite(composites)
    .png()
    .toFile(outPath);

  console.log('Proof sheet saved to:', outPath);
}

makeSheet().catch(console.error);
