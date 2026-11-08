import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generateProof() {
  const artifactsDir = 'C:/Users/abdis/.gemini/antigravity/brain/aa12b53b-04fa-4259-8560-24d7f40dbfbd';
  const foodDir = './public/icons/food';
  
  const showcase = [
    { id: 'pizza', name: 'Pizza', file: 'pizza.webp' },
    { id: 'pasta', name: 'Pasta', file: 'pasta.webp' },
    { id: 'coffee', name: 'Coffee', file: 'coffee.webp' },
    { id: 'burger', name: 'Burger', file: 'burger.webp' },
    { id: 'chicken_grill', name: 'Grill', file: 'chicken_grill.webp' },
    { id: 'ramen', name: 'Ramen', file: 'ramen.webp' },
  ];
  
  const cardW = 180;
  const cardH = 220;
  const totalW = showcase.length * cardW + 40;
  const totalH = cardH + 120;
  
  const svgMarkup = `
    <svg width="${totalW}" height="${totalH}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#F5EFE6"/>
      <path d="M0,60 L${totalW},60 M0,160 L${totalW},160 M0,260 L${totalW},260" stroke="#E6DDD0" stroke-width="2"/>
      <path d="M140,0 L140,${totalH} M320,0 L320,${totalH} M500,0 L500,${totalH} M680,0 L680,${totalH} M860,0 L860,${totalH} M1040,0 L1040,${totalH}" stroke="#E6DDD0" stroke-width="2"/>
      <text x="24" y="38" font-family="system-ui, sans-serif" font-size="16" font-weight="900" fill="#181615" letter-spacing="1">
        SMAKR MAP ICONS — SIZING &amp; OUTLINE NORMALIZATION PROOF
      </text>
      <text x="24" y="58" font-family="system-ui, sans-serif" font-size="12" fill="#716A60">
        Left 3: Default (#FAF7F2 Cream Die-Cut) · Right 3: Selected (Cream Inner + Delicate #E84A27 Orange Rim + Warm Glow)
      </text>
    </svg>
  `;
  
  const baseImg = await sharp(Buffer.from(svgMarkup)).png().toBuffer();
  const composites = [];
  
  for (let i = 0; i < showcase.length; i++) {
    const item = showcase[i];
    const isSelected = i >= 3;
    const x = 30 + i * cardW;
    const y = 80;
    
    // Convert WebP to PNG buffer for librsvg
    const pngBuf = await sharp(path.join(foodDir, item.file)).png().toBuffer();
    
    const iconSvg = `
      <svg width="150" height="150" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="puck-default" x="-40%" y="-40%" width="180%" height="180%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="3" result="dilated" />
            <feFlood flood-color="#FAF7F2" result="strokeColor" />
            <feComposite in="strokeColor" in2="dilated" operator="in" result="stroke" />
            <feDropShadow in="stroke" dx="0" dy="4" stdDeviation="3" flood-color="#181615" flood-opacity="0.28" result="shadow" />
            <feMerge>
              <feMergeNode in="shadow" />
              <feMergeNode in="stroke" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="puck-selected" x="-45%" y="-45%" width="190%" height="190%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="4.2" result="dilatedOuter" />
            <feFlood flood-color="#E84A27" flood-opacity="0.88" result="orangeColor" />
            <feComposite in="orangeColor" in2="dilatedOuter" operator="in" result="orangeRim" />
            <feDropShadow in="orangeRim" dx="0" dy="4.5" stdDeviation="3.8" flood-color="#E84A27" flood-opacity="0.48" result="orangeGlow" />
            <feMorphology in="SourceAlpha" operator="dilate" radius="2.4" result="dilatedInner" />
            <feFlood flood-color="#FAF7F2" result="whiteColor" />
            <feComposite in="whiteColor" in2="dilatedInner" operator="in" result="whiteStroke" />
            <feMerge>
              <feMergeNode in="orangeGlow" />
              <feMergeNode in="orangeRim" />
              <feMergeNode in="whiteStroke" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g filter="${isSelected ? 'url(#puck-selected)' : 'url(#puck-default)'}">
          <image href="data:image/png;base64,${pngBuf.toString('base64')}" x="15" y="15" width="120" height="120" preserveAspectRatio="xMidYMid meet"/>
        </g>
      </svg>
    `;
    
    const renderedPuck = await sharp(Buffer.from(iconSvg)).png().toBuffer();
    composites.push({ input: renderedPuck, left: x, top: y });
    
    const labelSvg = `
      <svg width="${cardW}" height="60" xmlns="http://www.w3.org/2000/svg">
        <text x="${cardW / 2}" y="20" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" fill="#181615" text-anchor="middle">
          ${item.name}
        </text>
        <text x="${cardW / 2}" y="38" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="${isSelected ? '#E84A27' : '#716A60'}" text-anchor="middle">
          ${isSelected ? '● Selected (Thin Orange Rim)' : '○ Default (Cream Die-Cut)'}
        </text>
      </svg>
    `;
    composites.push({ input: await sharp(Buffer.from(labelSvg)).png().toBuffer(), left: x, top: y + 155 });
  }
  
  const finalProof = await sharp(baseImg).composite(composites).png().toBuffer();
  const outputPath = path.join(artifactsDir, 'map_icons_normalized_proof.png');
  fs.writeFileSync(outputPath, finalProof);
  console.log(`Proof written to ${outputPath}`);
}

generateProof().catch(err => {
  console.error(err);
  process.exit(1);
});
