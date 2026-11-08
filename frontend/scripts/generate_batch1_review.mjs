import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const artifactDir = 'C:/Users/abdis/.gemini/antigravity/brain/aa12b53b-04fa-4259-8560-24d7f40dbfbd';
const styleInspoPath = 'C:/xampp/htdocs/CityPulse/frontend/public/filters/inspo-for-style.jpg';

const items = [
  { name: 'STYLE REFERENCE (Bánh Mì)', path: styleInspoPath, isSource: true },
  { name: '1. BAO BUNS (The Test Run)', path: path.join(artifactDir, 'bao_buns_illustration_png_1793886655960.jpg') },
  { name: '2. PASTRIES (From pastries.jpg)', path: path.join(artifactDir, 'artisan_pastries_illustration_1793887530004.jpg') },
  { name: '3. BREAD BASKET (From breads.jpg)', path: path.join(artifactDir, 'artisan_bread_basket_illustration_1793887553071.jpg') },
  { name: '4. COFFEE & TEA (From coffe and tea.jpg)', path: path.join(artifactDir, 'coffee_tea_stylized_illustration_1793887563989.jpg') },
  { name: '5. NOODLE BOWL (From noodles.jpg)', path: path.join(artifactDir, 'asian_noodle_soup_illustration_1793887577303.jpg') },
];

async function createReviewSheet() {
  const width = 1200;
  const height = 820;

  const b64 = items.map(item => {
    return {
      name: item.name,
      isSource: item.isSource,
      data: fs.readFileSync(item.path).toString('base64')
    };
  });

  const svg = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#FAF7F2"/>
    
    <!-- Header -->
    <rect x="0" y="0" width="${width}" height="68" fill="#181615"/>
    <text x="36" y="42" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="900" fill="#FFFFFF" letter-spacing="0.5">SMAKR STYLE VERIFICATION · 100% SAME PIPELINE AS BAO BUNS</text>
    <rect x="1000" y="20" width="164" height="28" rx="14" fill="#E84A27"/>
    <text x="1082" y="38" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="800" fill="#FFFFFF" text-anchor="middle" letter-spacing="0.5">BATCH 1 REVIEW</text>

    <!-- Top Row (3 items) -->
    <!-- Card 1: Source Inspo -->
    <rect x="36" y="90" width="360" height="340" rx="18" fill="#FFFFFF" stroke="#E84A27" stroke-width="2"/>
    <rect x="36" y="90" width="360" height="38" rx="18" fill="#E84A27"/>
    <rect x="36" y="112" width="360" height="16" fill="#E84A27"/>
    <text x="52" y="115" font-family="system-ui, sans-serif" font-size="12" font-weight="900" fill="#FFFFFF">⭐ ORIGINAL STYLE INSPO (inspo-for-style.jpg)</text>
    <image href="data:image/jpeg;base64,${b64[0].data}" x="48" y="136" width="336" height="280" preserveAspectRatio="xMidYMid meet"/>

    <!-- Card 2: Bao Buns (Approved) -->
    <rect x="420" y="90" width="360" height="340" rx="18" fill="#FFFFFF" stroke="#22C55E" stroke-width="2"/>
    <rect x="420" y="90" width="360" height="38" rx="18" fill="#22C55E"/>
    <rect x="420" y="112" width="360" height="16" fill="#22C55E"/>
    <text x="436" y="115" font-family="system-ui, sans-serif" font-size="12" font-weight="900" fill="#FFFFFF">✔ 1. BAO BUNS (The Approved Test Run)</text>
    <image href="data:image/jpeg;base64,${b64[1].data}" x="432" y="136" width="336" height="280" preserveAspectRatio="xMidYMid meet"/>

    <!-- Card 3: Pastries -->
    <rect x="804" y="90" width="360" height="340" rx="18" fill="#FFFFFF" stroke="#E5E0D8" stroke-width="1.5"/>
    <rect x="804" y="90" width="360" height="38" rx="18" fill="#F4EFE6"/>
    <rect x="804" y="112" width="360" height="16" fill="#F4EFE6"/>
    <text x="820" y="115" font-family="system-ui, sans-serif" font-size="12" font-weight="900" fill="#181615">2. PASTRIES (Stacked Varied Selection)</text>
    <image href="data:image/jpeg;base64,${b64[2].data}" x="816" y="136" width="336" height="280" preserveAspectRatio="xMidYMid meet"/>

    <!-- Bottom Row (3 items) -->
    <!-- Card 4: Bread Basket -->
    <rect x="36" y="454" width="360" height="340" rx="18" fill="#FFFFFF" stroke="#E5E0D8" stroke-width="1.5"/>
    <rect x="36" y="454" width="360" height="38" rx="18" fill="#F4EFE6"/>
    <rect x="36" y="476" width="360" height="16" fill="#F4EFE6"/>
    <text x="52" y="479" font-family="system-ui, sans-serif" font-size="12" font-weight="900" fill="#181615">3. BREADS (Artisan Woven Basket)</text>
    <image href="data:image/jpeg;base64,${b64[3].data}" x="48" y="500" width="336" height="280" preserveAspectRatio="xMidYMid meet"/>

    <!-- Card 5: Coffee & Tea -->
    <rect x="420" y="454" width="360" height="340" rx="18" fill="#FFFFFF" stroke="#E5E0D8" stroke-width="1.5"/>
    <rect x="420" y="454" width="360" height="38" rx="18" fill="#F4EFE6"/>
    <rect x="420" y="476" width="360" height="16" fill="#F4EFE6"/>
    <text x="436" y="479" font-family="system-ui, sans-serif" font-size="12" font-weight="900" fill="#181615">4. COFFEE &amp; TEA (Beans + Green Leaves)</text>
    <image href="data:image/jpeg;base64,${b64[4].data}" x="432" y="500" width="336" height="280" preserveAspectRatio="xMidYMid meet"/>

    <!-- Card 6: Noodle Bowl -->
    <rect x="804" y="454" width="360" height="340" rx="18" fill="#FFFFFF" stroke="#E5E0D8" stroke-width="1.5"/>
    <rect x="804" y="454" width="360" height="38" rx="18" fill="#F4EFE6"/>
    <rect x="804" y="476" width="360" height="16" fill="#F4EFE6"/>
    <text x="820" y="479" font-family="system-ui, sans-serif" font-size="12" font-weight="900" fill="#181615">5. NOODLES &amp; SOUP (Full Ceramic Bowl)</text>
    <image href="data:image/jpeg;base64,${b64[5].data}" x="816" y="500" width="336" height="280" preserveAspectRatio="xMidYMid meet"/>
  </svg>
  `;

  const outPath = path.join(artifactDir, 'batch_1_review_sheet.png');
  await sharp(Buffer.from(svg)).png().toFile(outPath);
  console.log(`Saved review sheet: ${outPath}`);
}

createReviewSheet().catch(console.error);
