import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const brain = 'C:/Users/abdis/.gemini/antigravity/brain/aa12b53b-04fa-4259-8560-24d7f40dbfbd';
const iconsFoodDir = path.resolve('public/icons/food');

const ACTIVE_MAP_ICONS = [
  { id: 'coffee', label: 'Coffee (Latte Art Mug)', issue: 'Right edge cut off (Handle trimmed at col 191)' },
  { id: 'croissant', label: 'Croissant (Bakery)', issue: 'Slightly tight left tip' },
  { id: 'cinnamon_roll', label: 'Cinnamon Roll (Kanelbolle)', issue: 'Clean rounded bounds' },
  { id: 'tacos', label: 'Taco (Mexican)', issue: 'Top shell touches top boundary' },
  { id: 'fried_chicken', label: 'Chicken & Grill', issue: 'Left meat touches border' },
  { id: 'banh_mi', label: 'Banh Mi (Sandwich)', issue: 'Left baguette tip touches edge' },
  { id: 'ramen', label: 'Ramen Bowl (Noodles)', issue: 'Bottom bowl curve near boundary' },
  { id: 'pizza', label: 'Pizza Slice', issue: 'Crust top touches border' },
  { id: 'naan', label: 'Naan (Flatbread)', issue: 'Well centered' },
  { id: 'curry', label: 'Curry / Rice Bowl', issue: 'Top steam touches border' },
  { id: 'burger', label: 'Smash Burger', issue: 'Top bun touches border' },
  { id: 'dessert', label: 'Gelato / Dessert', issue: 'Waffle cone tip near border' },
];

/**
 * Creates an 8-way solid die-cut stroke around any transparent PNG/WebP buffer
 */
async function createDieCutStroked(buf, size = 110, strokeColor = '#FAF7F2', strokeRadius = 4) {
  // 1. Resize original buffer with safe padding
  const pad = strokeRadius * 4;
  const innerSize = size - pad * 2;
  const innerImg = await sharp(buf)
    .resize(innerSize, innerSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const paddedImg = await sharp(innerImg)
    .extend({
      top: pad,
      bottom: pad,
      left: pad,
      right: pad,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();

  // 2. Extract alpha channel and create 8-directional offsets
  const alphaMask = await sharp(paddedImg).extractChannel(3).toBuffer();
  
  // Create solid color image matching strokeColor
  const r = parseInt(strokeColor.slice(1, 3), 16);
  const g = parseInt(strokeColor.slice(3, 5), 16);
  const b = parseInt(strokeColor.slice(5, 7), 16);

  const offsets = [
    { x: -strokeRadius, y: 0 },
    { x: strokeRadius, y: 0 },
    { x: 0, y: -strokeRadius },
    { x: 0, y: strokeRadius },
    { x: -Math.round(strokeRadius * 0.7), y: -Math.round(strokeRadius * 0.7) },
    { x: Math.round(strokeRadius * 0.7), y: -Math.round(strokeRadius * 0.7) },
    { x: -Math.round(strokeRadius * 0.7), y: Math.round(strokeRadius * 0.7) },
    { x: Math.round(strokeRadius * 0.7), y: Math.round(strokeRadius * 0.7) },
  ];

  // Composite multi-directional stroke layers
  const strokeComposites = offsets.map(off => ({
    input: Buffer.from(`
      <svg width="${size}" height="${size}">
        <rect width="${size}" height="${size}" fill="${strokeColor}"/>
      </svg>
    `),
    blend: 'over'
  }));

  // Create an SVG filter for dilation
  const svgFilter = Buffer.from(`
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="dilate" x="-20%" y="-20%" width="140%" height="140%">
          <feMorphology in="SourceAlpha" operator="dilate" radius="${strokeRadius}" result="dilated"/>
          <feFlood flood-color="${strokeColor}" result="color"/>
          <feComposite in="color" in2="dilated" operator="in" result="outline"/>
          <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#000000" flood-opacity="0.38"/>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <image href="data:image/png;base64,${paddedImg.toString('base64')}" width="${size}" height="${size}" filter="url(#dilate)"/>
      <!-- Downward pointer arrow beneath floating icon -->
      <polygon points="${size/2 - 6},${size - pad + 4} ${size/2 + 6},${size - pad + 4} ${size/2},${size - pad + 11}" fill="${strokeColor}"/>
    </svg>
  `);

  return await sharp(svgFilter).png().toBuffer();
}

async function buildComparisonSheet() {
  const cardW = 340;
  const cardH = 190;
  const cols = 2;
  const rows = Math.ceil(ACTIVE_MAP_ICONS.length / cols);
  const totalW = cols * cardW + 60;
  const headerH = 130;
  const totalH = headerH + rows * cardH + 40;

  const composites = [];

  // Header SVG
  const headerSvg = Buffer.from(`
    <svg width="${totalW}" height="${headerH}">
      <rect width="${totalW}" height="${headerH}" fill="#181615"/>
      <text x="30" y="38" font-family="sans-serif" font-size="20" font-weight="900" fill="#FAF7F2" letter-spacing="0.5">SMAKR MAP ICONS AUDIT: RAW ILLUSTRATION VS DIE-CUT STROKE</text>
      <text x="30" y="66" font-family="sans-serif" font-size="13" font-weight="600" fill="#E84A27">Direct side-by-side comparison on dark studio contrast canvas (#221F1D)</text>
      <text x="30" y="90" font-family="sans-serif" font-size="12" fill="#A8A29E">Left: Natural unstroked WebP asset | Right: Die-cut outline (#FAF7F2) + ground elevation shadow</text>
      <line x1="30" y1="110" x2="${totalW - 30}" y2="110" stroke="#332E2A" stroke-width="1"/>
    </svg>
  `);
  composites.push({ input: headerSvg, left: 0, top: 0 });

  for (let i = 0; i < ACTIVE_MAP_ICONS.length; i++) {
    const item = ACTIVE_MAP_ICONS[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = 30 + col * cardW;
    const y = headerH + 20 + row * cardH;

    const iconPath = path.join(iconsFoodDir, item.id + '.webp');
    if (!fs.existsSync(iconPath)) {
      console.log('Missing icon:', item.id);
      continue;
    }

    const rawBuf = fs.readFileSync(iconPath);

    // Card background box
    const isCoffee = item.id === 'coffee';
    const borderCol = isCoffee ? '#E84A27' : '#38332E';
    const borderW = isCoffee ? '2' : '1';

    const cardSvg = Buffer.from(`
      <svg width="${cardW - 16}" height="${cardH - 16}">
        <rect width="${cardW - 16}" height="${cardH - 16}" rx="16" fill="#1C1917" stroke="${borderCol}" stroke-width="${borderW}"/>
        <!-- Title & Issue -->
        <text x="16" y="26" font-family="sans-serif" font-size="13" font-weight="800" fill="${isCoffee ? '#FF7A5C' : '#FAF7F2'}">${item.label.replace(/&/g, '&amp;')}</text>
        <text x="16" y="44" font-family="sans-serif" font-size="10.5" font-weight="500" fill="${isCoffee ? '#FCA5A5' : '#A8A29E'}">${item.issue.replace(/&/g, '&amp;')}</text>
        <!-- Tile Backdrops: Left = Raw, Right = Stroked -->
        <rect x="16" y="56" width="140" height="110" rx="12" fill="#292524" stroke="#44403C" stroke-width="1"/>
        <text x="86" y="74" font-family="sans-serif" font-size="9.5" font-weight="700" fill="#78716C" text-anchor="middle">RAW (NO STROKE)</text>

        <rect x="168" y="56" width="140" height="110" rx="12" fill="#292524" stroke="#44403C" stroke-width="1"/>
        <text x="238" y="74" font-family="sans-serif" font-size="9.5" font-weight="700" fill="${isCoffee ? '#E84A27' : '#D6D3D1'}" text-anchor="middle">MAP DIE-CUT STROKE</text>
      </svg>
    `);
    composites.push({ input: cardSvg, left: x + 8, top: y + 8 });

    // Left tile: Raw image without outline
    const rawPreview = await sharp(rawBuf)
      .resize(80, 80, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    composites.push({ input: rawPreview, left: x + 54, top: y + 86 });

    // Right tile: Die-cut stroked image
    const strokedPreview = await createDieCutStroked(rawBuf, 96, '#FAF7F2', 4);
    composites.push({ input: strokedPreview, left: x + 198, top: y + 78 });
  }

  const finalImg = await sharp({
    create: {
      width: totalW,
      height: totalH,
      channels: 4,
      background: { r: 28, g: 25, b: 23, alpha: 1 } // #1C1917 dark studio background
    }
  }).composite(composites).png().toBuffer();

  const outPath = path.join(brain, 'map_icons_side_by_side_audit.png');
  fs.writeFileSync(outPath, finalImg);
  console.log('Saved Side-by-Side Audit Sheet to:', outPath);
}

buildComparisonSheet();
