import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function makeCoffeeMacro() {
  const iconPath = 'public/icons/food/coffee.webp';
  const brain = 'C:/Users/abdis/.gemini/antigravity/brain/aa12b53b-04fa-4259-8560-24d7f40dbfbd';
  const rawBuf = fs.readFileSync(iconPath);

  // Zoom into right side of coffee cup where handle is cut off
  const zoomedClipped = await sharp(rawBuf)
    .extract({ left: 120, top: 90, width: 72, height: 75 })
    .resize(230, 240, { kernel: 'nearest' })
    .png()
    .toBuffer();

  const totalW = 600;
  const totalH = 360;

  const bgSvg = Buffer.from(`
    <svg width="${totalW}" height="${totalH}">
      <rect width="${totalW}" height="${totalH}" fill="#1C1917"/>
      <text x="24" y="32" font-family="sans-serif" font-size="16" font-weight="bold" fill="#FAF7F2">COFFEE CUP HANDLE CUTOFF (MACRO PIXEL AUDIT)</text>
      <text x="24" y="54" font-family="sans-serif" font-size="11.5" fill="#E84A27">Pixels on column x=191 hit texture boundary with zero transparent safety margin</text>

      <rect x="24" y="75" width="250" height="260" rx="12" fill="#262220" stroke="#DC2626" stroke-width="2"/>
      <text x="149" y="98" font-family="sans-serif" font-size="11" font-weight="bold" fill="#EF4444" text-anchor="middle">CLIPPED RIGHT EDGE (HANDLE)</text>
      <line x1="264" y1="108" x2="264" y2="320" stroke="#EF4444" stroke-width="2" stroke-dasharray="4 3"/>
      <text x="258" y="210" font-family="sans-serif" font-size="9" font-weight="bold" fill="#EF4444" text-anchor="end">CUT AT COL 191 &gt;</text>

      <rect x="295" y="75" width="280" height="260" rx="12" fill="#262220" stroke="#10B981" stroke-width="1.5"/>
      <text x="435" y="98" font-family="sans-serif" font-size="11" font-weight="bold" fill="#10B981" text-anchor="middle">SOLUTION: 12% INSET BUFFER</text>
      <text x="312" y="135" font-family="sans-serif" font-size="11" fill="#D6D3D1">1. Re-render with full ceramic handle</text>
      <text x="312" y="165" font-family="sans-serif" font-size="11" fill="#D6D3D1">2. Pad canvas with 12px margin on all sides</text>
      <text x="312" y="195" font-family="sans-serif" font-size="11" fill="#D6D3D1">3. Bounding box safe zone: [12..180]</text>
      <text x="312" y="225" font-family="sans-serif" font-size="11" fill="#D6D3D1">4. Add SVG overflow: visible</text>
      <text x="312" y="265" font-family="sans-serif" font-size="11.5" font-weight="bold" fill="#10B981">&#x2713; Full rounded die-cut contour stroke</text>
    </svg>
  `);

  const finalImg = await sharp(bgSvg)
    .composite([
      { input: zoomedClipped, left: 34, top: 110 }
    ])
    .png()
    .toBuffer();

  const outPath = path.join(brain, 'coffee_handle_macro_audit.png');
  fs.writeFileSync(outPath, finalImg);
  console.log('Saved coffee macro to:', outPath);
}
makeCoffeeMacro();
