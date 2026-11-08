import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const brainDir = 'C:\\Users\\abdis\\.gemini\\antigravity\\brain\\aa12b53b-04fa-4259-8560-24d7f40dbfbd';
const iconsDir = 'public/icons/food';

const ICONS = [
  { name: 'K-Chicken (Standard)', file: 'k_chicken.webp', tag: 'LOCKED GOLD STANDARD' },
  { name: 'Garlic Naan (Standard)', file: 'naan.webp', tag: 'LOCKED GOLD STANDARD' },
  { name: 'Specialty Coffee', file: 'coffee.webp', tag: 'SURGICALLY REMIXED' },
  { name: 'Neapolitan Pizza', file: 'pizza.webp', tag: 'SURGICALLY REMIXED' },
  { name: 'Tonkotsu Ramen', file: 'ramen.webp', tag: 'SURGICALLY REMIXED' },
  { name: 'Cinnamon Roll', file: 'cinnamon_roll.webp', tag: 'SURGICALLY REMIXED' },
  { name: 'Bánh Mì', file: 'banh_mi.webp', tag: 'SURGICALLY REMIXED' },
  { name: 'Hero Croissant', file: 'croissant.webp', tag: 'SURGICALLY REMIXED' },
];

async function generateProof() {
  const cardW = 280;
  const cardH = 320;
  const cols = 4;
  const rows = 2;
  const gap = 24;
  const pad = 36;
  const totalW = pad * 2 + cols * cardW + (cols - 1) * gap;
  const totalH = pad * 2 + rows * cardH + (rows - 1) * gap + 80;

  // Render SVG cards
  let cardsSvg = '';
  for (let i = 0; i < ICONS.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = pad + col * (cardW + gap);
    const y = pad + 80 + row * (cardH + gap);
    const item = ICONS[i];

    const isGold = item.tag.includes('LOCKED');
    const badgeBg = isGold ? '#10B981' : '#E84A27';
    const borderCol = isGold ? '#059669' : '#333333';

    // Checkerboard pattern for transparency verification
    cardsSvg += `
      <g transform="translate(${x}, ${y})">
        <rect width="${cardW}" height="${cardH}" rx="16" fill="#141414" stroke="${borderCol}" stroke-width="1.5" />
        <pattern id="chk_${i}" width="16" height="16" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill="#1e1e1e" />
          <rect x="8" width="8" height="8" fill="#282828" />
          <rect y="8" width="8" height="8" fill="#282828" />
          <rect x="8" y="8" width="8" height="8" fill="#1e1e1e" />
        </pattern>
        <rect x="16" y="56" width="${cardW - 32}" height="180" rx="10" fill="url(#chk_${i})" />
        
        <rect x="16" y="16" width="${isGold ? 170 : 160}" height="24" rx="12" fill="${badgeBg}" />
        <text x="24" y="32" fill="#FFFFFF" font-family="sans-serif" font-size="10" font-weight="bold" letter-spacing="0.5">${item.tag}</text>

        <text x="16" y="262" fill="#FFFFFF" font-family="sans-serif" font-size="16" font-weight="bold">${item.name}</text>
        <text x="16" y="284" fill="#9CA3AF" font-family="sans-serif" font-size="12">192×192 WebP (Zero White BG)</text>
      </g>
    `;
  }

  const bgSvg = `
    <svg width="${totalW}" height="${totalH}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${totalW}" height="${totalH}" fill="#0A0A0A" />
      <text x="${pad}" y="${pad + 36}" fill="#FFFFFF" font-family="sans-serif" font-size="28" font-weight="bold">Smakr 8-Icon Gastronomy Suite (Background Inspection)</text>
      <text x="${pad}" y="${pad + 64}" fill="#9CA3AF" font-family="sans-serif" font-size="14">All icons rendered over dark checkerboard to verify 100% clean transparent alpha cutout</text>
      ${cardsSvg}
    </svg>
  `;

  // Composite individual WebP icons onto the card checkerboard
  const composites = [{ input: Buffer.from(bgSvg), top: 0, left: 0 }];

  for (let i = 0; i < ICONS.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = pad + col * (cardW + gap) + 16 + (cardW - 32 - 160) / 2;
    const y = pad + 80 + row * (cardH + gap) + 56 + (180 - 160) / 2;
    const item = ICONS[i];

    const iconPath = path.resolve(iconsDir, item.file);
    const iconBuf = await sharp(iconPath).resize(160, 160, { fit: 'contain' }).png().toBuffer();
    composites.push({
      input: iconBuf,
      left: Math.round(x),
      top: Math.round(y),
    });
  }

  const outProof = path.join(brainDir, 'remixed_8icons_showcase.png');
  await sharp({
    create: {
      width: totalW,
      height: totalH,
      channels: 4,
      background: { r: 10, g: 10, b: 10, alpha: 1 },
    },
  })
    .composite(composites)
    .png()
    .toFile(outProof);

  console.log(`✅ Showcase proof sheet written to: ${outProof}`);
}

generateProof().catch(console.error);
