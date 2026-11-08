import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function makeLiveProof() {
  const icons = [
    { label: 'Pastries', file: 'croissant.webp' },
    { label: 'Breads', file: 'breads.webp' },
    { label: 'Coffee + Tea', file: 'coffee.webp' },
    { label: 'Noodles', file: 'ramen.webp' },
    { label: 'Dumplings', file: 'dumplings.webp' }
  ];

  // Base canvas SVG (without images)
  const svgParts = icons.map((ic, i) => {
    const x = 30 + i * 195;
    return `
      <!-- Pill (Default state) -->
      <g transform="translate(${x}, 65)">
        <rect width="180" height="42" rx="21" fill="#FFFFFF" stroke="rgba(0,0,0,0.08)" stroke-width="1.5"/>
        <text x="50" y="26" font-family="system-ui, -apple-system, sans-serif" font-size="12.5" font-weight="700" fill="#181615">${ic.label}</text>
      </g>
      <!-- Pill (Active Orange state) -->
      <g transform="translate(${x}, 125)">
        <rect width="180" height="42" rx="21" fill="#E84A27"/>
        <text x="50" y="26" font-family="system-ui, -apple-system, sans-serif" font-size="12.5" font-weight="700" fill="#FFFFFF">${ic.label}</text>
      </g>
      <!-- Map Puck -->
      <g transform="translate(${x + 60}, 195)">
        <circle cx="30" cy="30" r="28" fill="#FFFFFF" stroke="rgba(0,0,0,0.12)" stroke-width="2"/>
        <circle cx="30" cy="30" r="24" fill="#FAF7F2"/>
        <path d="M24 58 L30 66 L36 58 Z" fill="#181615"/>
        <text x="30" y="80" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="800" fill="#181615" text-anchor="middle">${ic.label}</text>
      </g>
    `;
  }).join('');

  const fullSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1030" height="310" viewBox="0 0 1030 310">
      <rect width="1030" height="310" fill="#FAF7F2"/>
      <text x="30" y="38" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="900" fill="#181615" letter-spacing="0.3">LIVE DEPLOYED ICONS — FEED PILLS AND MAP PUCKS</text>
      ${svgParts}
    </svg>
  `;

  const baseBuf = await sharp(Buffer.from(fullSvg)).png().toBuffer();

  const compositeList = [];
  for (let i = 0; i < icons.length; i++) {
    const ic = icons[i];
    const x = 30 + i * 195;
    const iconPath = path.join('public/icons/food', ic.file);

    // Pill small icon 32x32
    const pillIconBuf = await sharp(iconPath).resize(32, 32, { fit: 'contain' }).png().toBuffer();
    compositeList.push({ input: pillIconBuf, left: x + 10, top: 65 + 5 });
    compositeList.push({ input: pillIconBuf, left: x + 10, top: 125 + 5 });

    // Map puck larger icon 44x44
    const puckIconBuf = await sharp(iconPath).resize(44, 44, { fit: 'contain' }).png().toBuffer();
    compositeList.push({ input: puckIconBuf, left: x + 60 + 8, top: 195 + 8 });
  }

  const outProof = 'C:/Users/abdis/.gemini/antigravity/brain/aa12b53b-04fa-4259-8560-24d7f40dbfbd/live_5_icons_deployed_proof.png';
  await sharp(baseBuf).composite(compositeList).png().toFile(outProof);
  console.log('Saved live_5_icons_deployed_proof.png successfully');
}
makeLiveProof();
