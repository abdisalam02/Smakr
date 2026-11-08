import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const artifactDir = 'C:/Users/abdis/.gemini/antigravity/brain/aa12b53b-04fa-4259-8560-24d7f40dbfbd';
const styleInspoPath = 'C:/xampp/htdocs/CityPulse/frontend/public/filters/inspo-for-style.jpg';
const dishInspoPath = 'C:/xampp/htdocs/CityPulse/frontend/public/filters/buns.jpg';
const generatedArtworkPath = path.join(artifactDir, 'bao_buns_illustration_png_1793886655960.jpg');
const webpIconPath = path.join(artifactDir, 'bao_test_with_shadow.webp');

async function createProofSheet() {
  const width = 1200;
  const height = 900;

  // Convert webp to PNG buffer for librsvg SVG compatibility
  const pngIconBuffer = await sharp(webpIconPath).png().toBuffer();
  const iconBase64 = pngIconBuffer.toString('base64');
  const styleInspoBase64 = fs.readFileSync(styleInspoPath).toString('base64');
  const dishInspoBase64 = fs.readFileSync(dishInspoPath).toString('base64');
  const artBase64 = fs.readFileSync(generatedArtworkPath).toString('base64');

  const svgMock = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#FAF7F2"/>
    
    <!-- Header -->
    <rect x="0" y="0" width="${width}" height="76" fill="#181615"/>
    <text x="40" y="44" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="900" fill="#FFFFFF" letter-spacing="0.5">SMAKR ICON LAB · STYLE INSPO TEST RUN</text>
    <rect x="1000" y="24" width="160" height="28" rx="14" fill="#E84A27"/>
    <text x="1080" y="42" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="800" fill="#FFFFFF" text-anchor="middle" letter-spacing="0.5">TEST: BAO BUNS</text>

    <!-- Column 1: Source Style Inspo -->
    <rect x="40" y="106" width="350" height="260" rx="16" fill="#FFFFFF" stroke="#E5E0D8" stroke-width="1.5"/>
    <image href="data:image/jpeg;base64,${styleInspoBase64}" x="50" y="146" width="330" height="210" preserveAspectRatio="xMidYMid meet"/>
    <text x="56" y="132" font-family="system-ui, sans-serif" font-size="12" font-weight="800" fill="#E84A27" letter-spacing="0.5">1. YOUR STYLE INSPO (inspo-for-style.jpg)</text>

    <!-- Column 2: Dish Photo Inspo -->
    <rect x="420" y="106" width="350" height="260" rx="16" fill="#FFFFFF" stroke="#E5E0D8" stroke-width="1.5"/>
    <image href="data:image/jpeg;base64,${dishInspoBase64}" x="430" y="146" width="330" height="210" preserveAspectRatio="xMidYMid meet"/>
    <text x="436" y="132" font-family="system-ui, sans-serif" font-size="12" font-weight="800" fill="#71717A" letter-spacing="0.5">2. YOUR DISH INSPO (buns.jpg)</text>

    <!-- Column 3: Generated Artwork -->
    <rect x="800" y="106" width="360" height="260" rx="16" fill="#FFFFFF" stroke="#E84A27" stroke-width="2"/>
    <image href="data:image/jpeg;base64,${artBase64}" x="810" y="146" width="340" height="210" preserveAspectRatio="xMidYMid meet"/>
    <text x="816" y="132" font-family="system-ui, sans-serif" font-size="12" font-weight="900" fill="#E84A27" letter-spacing="0.5">✨ 3. RESULTING STYLIZED ARTWORK</text>

    <!-- Bottom Section Header -->
    <text x="40" y="415" font-family="system-ui, sans-serif" font-size="16" font-weight="900" fill="#181615" letter-spacing="0.5">IN-APP UI PREVIEWS: HOW THIS STYLE LOOKS ON SMAKR</text>

    <!-- Left Box: Large & Medium Icon Previews on Oat Canvas -->
    <rect x="40" y="440" width="530" height="410" rx="20" fill="#FFFFFF" stroke="#E5E0D8" stroke-width="1.5"/>
    <text x="64" y="475" font-family="system-ui, sans-serif" font-size="13" font-weight="800" fill="#181615">ICON SIZES &amp; DETAIL RENDERING</text>

    <!-- 160px Large -->
    <rect x="64" y="500" width="180" height="180" rx="16" fill="#FAF7F2" stroke="#E5E0D8"/>
    <image href="data:image/png;base64,${iconBase64}" x="74" y="510" width="160" height="160" preserveAspectRatio="xMidYMid meet"/>
    <text x="154" y="705" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#71717A" text-anchor="middle">Large Icon (160×160)</text>

    <!-- 80px Medium -->
    <rect x="274" y="500" width="110" height="110" rx="16" fill="#FAF7F2" stroke="#E5E0D8"/>
    <image href="data:image/png;base64,${iconBase64}" x="289" y="515" width="80" height="80" preserveAspectRatio="xMidYMid meet"/>
    <text x="329" y="635" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#71717A" text-anchor="middle">Medium (80×80)</text>

    <!-- 48px Small -->
    <rect x="414" y="500" width="76" height="76" rx="14" fill="#FAF7F2" stroke="#E5E0D8"/>
    <image href="data:image/png;base64,${iconBase64}" x="428" y="514" width="48" height="48" preserveAspectRatio="xMidYMid meet"/>
    <text x="452" y="600" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#71717A" text-anchor="middle">Small (48×48)</text>

    <!-- Style Traits Box -->
    <rect x="64" y="730" width="482" height="96" rx="12" fill="#F4EFE6"/>
    <text x="80" y="756" font-family="system-ui, sans-serif" font-size="11.5" font-weight="800" fill="#181615">STYLE DNA MATCHED FROM INSPO:</text>
    <text x="80" y="776" font-family="system-ui, sans-serif" font-size="11" fill="#52525B">✔ Expressive loose dark-ink brush outlines &amp; calligraphic line weight</text>
    <text x="80" y="794" font-family="system-ui, sans-serif" font-size="11" fill="#52525B">✔ Textured gouache/marker color washes (vibrant cucumber, cilantro, carrot)</text>
    <text x="80" y="812" font-family="system-ui, sans-serif" font-size="11" fill="#52525B">✔ Ceramic dipping bowl with lavender rim + subtle violet cast shadow</text>

    <!-- Right Box: Real Smakr Components (Map Puck & Filter Pills) -->
    <rect x="600" y="440" width="560" height="410" rx="20" fill="#FFFFFF" stroke="#E5E0D8" stroke-width="1.5"/>
    <text x="624" y="475" font-family="system-ui, sans-serif" font-size="13" font-weight="800" fill="#181615">SMAKR UI COMPONENT INTEGRATION</text>

    <!-- Filter Bar Pill Mock -->
    <text x="624" y="512" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#71717A">1. FEED FILTER BAR PILLS</text>
    
    <!-- Active Pill (Burnt Paprika) -->
    <rect x="624" y="525" width="138" height="34" rx="17" fill="#E84A27"/>
    <image href="data:image/png;base64,${iconBase64}" x="632" y="531" width="22" height="22" preserveAspectRatio="xMidYMid meet"/>
    <text x="660" y="547" font-family="system-ui, sans-serif" font-size="12" font-weight="800" fill="#FFFFFF">Bao Buns</text>
    <text x="735" y="547" font-family="monospace" font-size="10" font-weight="700" fill="#FFFFFF" opacity="0.85">(4)</text>

    <!-- Inactive Pill (Warm White) -->
    <rect x="772" y="525" width="138" height="34" rx="17" fill="#FAF7F2" stroke="#E5E0D8"/>
    <image href="data:image/png;base64,${iconBase64}" x="780" y="531" width="22" height="22" preserveAspectRatio="xMidYMid meet"/>
    <text x="808" y="547" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#27272A">Bao Buns</text>
    <text x="883" y="547" font-family="monospace" font-size="10" font-weight="600" fill="#A1A1AA">(4)</text>

    <!-- Drawer Big Slider Card Mock -->
    <text x="624" y="595" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#71717A">2. FILTER DRAWER DISH CARD</text>
    <rect x="624" y="610" width="84" height="96" rx="18" fill="#FAF7F2" stroke="#E5E0D8"/>
    <image href="data:image/png;base64,${iconBase64}" x="644" y="618" width="44" height="44" preserveAspectRatio="xMidYMid meet"/>
    <text x="666" y="678" font-family="system-ui, sans-serif" font-size="11" font-weight="800" fill="#181615" text-anchor="middle">Bao Buns</text>
    <text x="666" y="694" font-family="monospace" font-size="10" font-weight="600" fill="#71717A" text-anchor="middle">4 spots</text>

    <!-- Active Drawer Card -->
    <rect x="720" y="610" width="84" height="96" rx="18" fill="#E84A27"/>
    <image href="data:image/png;base64,${iconBase64}" x="740" y="618" width="44" height="44" preserveAspectRatio="xMidYMid meet"/>
    <text x="762" y="678" font-family="system-ui, sans-serif" font-size="11" font-weight="800" fill="#FFFFFF" text-anchor="middle">Bao Buns</text>
    <text x="762" y="694" font-family="monospace" font-size="10" font-weight="600" fill="#FFFFFF" opacity="0.9" text-anchor="middle">4 spots</text>

    <!-- Map Puck Simulation -->
    <text x="624" y="740" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#71717A">3. MAP PUCK (MAPLIBRE PIN)</text>
    
    <!-- Mini Map Background Tile -->
    <rect x="624" y="754" width="220" height="74" rx="14" fill="#E8E3D9"/>
    <!-- Street grid lines -->
    <line x1="624" y1="785" x2="844" y2="785" stroke="#DDD6C7" stroke-width="12"/>
    <line x1="730" y1="754" x2="730" y2="828" stroke="#DDD6C7" stroke-width="10"/>

    <!-- Map Puck Pin (34x34) -->
    <circle cx="730" cy="780" r="20" fill="rgba(255,252,247,0.9)" stroke="#FFFFFF" stroke-width="2"/>
    <image href="data:image/png;base64,${iconBase64}" x="717" y="767" width="26" height="26" preserveAspectRatio="xMidYMid meet"/>
    <!-- Puck Arrow -->
    <polygon points="726,801 734,801 730,806" fill="#181615" opacity="0.6"/>

    <text x="860" y="784" font-family="system-ui, sans-serif" font-size="12" font-weight="800" fill="#181615">Map Puck</text>
    <text x="860" y="802" font-family="system-ui, sans-serif" font-size="11" fill="#71717A">Crisp on streets</text>
  </svg>
  `;

  const outProofPath = path.join(artifactDir, 'style_inspo_test_proof.png');
  await sharp(Buffer.from(svgMock)).png().toFile(outProofPath);
  console.log(`Proof sheet created at: ${outProofPath}`);
}

createProofSheet().catch(console.error);
