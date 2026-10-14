import fs from 'fs';
import path from 'path';

const srcDir = fs.existsSync('open-peeps-b') ? 'open-peeps-b' : 'frontend/open-peeps-b';
const outDir = fs.existsSync('public') ? 'public/mascot' : 'frontend/public/mascot';
const catalogFile = fs.existsSync('src') ? 'src/lib/blushMascotCatalog.ts' : 'frontend/src/lib/blushMascotCatalog.ts';

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.svg'));
console.log(`Found ${files.length} SVGs in ${srcDir}`);

const blushBodies = {};
const blushHeads = {};
const blushFaces = {};
const blushAccessories = {};
const blushBeards = {
  none: {
    id: 'none',
    name: 'None',
    markup: '<path d="" id="Ink" fill="#000"/>'
  }
};
const blushPresets = [];

for (const file of files) {
  const content = fs.readFileSync(path.join(srcDir, file), 'utf8');

  // Match Body
  const bodyMatch = content.match(/<g id="Body\/([^"]+)"[^>]*>([\s\S]*?)<\/g>\s*<\/g>/);
  // Match Head
  const headMatch = content.match(/<g id="Head\/([^"]+)"[^>]*>([\s\S]*?)<\/g>\s*<\/g>/);
  // Match Face
  const faceMatch = content.match(/<g id="Face\/([^"]+)"[^>]*>([\s\S]*?)<\/g>\s*<\/g>/);
  // Match Accessories
  const accMatch = content.match(/<g id="Accessories\/([^"]+)"[^>]*>([\s\S]*?)<\/g>\s*<\/g>/);
  // Match Beard
  const beardMatch = content.match(/<g id="Beard\/([^"]+)"[^>]*>([\s\S]*?)<\/g>\s*<\/g>/);

  const bodyName = bodyMatch ? bodyMatch[1] : 'Unknown';
  const headName = headMatch ? headMatch[1] : 'Afro';
  const faceName = faceMatch ? faceMatch[1] : 'Smile Big';
  const accName = accMatch ? accMatch[1] : 'Glasses 2';
  const beardName = beardMatch ? beardMatch[1] : 'None';

  const bodyId = bodyName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const headId = headName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const faceId = faceName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const accId = accName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const beardId = beardName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const normalizedFileName = `blush-${bodyId}.svg`;
  fs.copyFileSync(path.join(srcDir, file), path.join(outDir, normalizedFileName));

  if (bodyMatch && !blushBodies[bodyId]) {
    blushBodies[bodyId] = {
      id: bodyId,
      name: bodyName,
      markup: bodyMatch[2].trim(),
    };
  }

  if (headMatch && !blushHeads[headId]) {
    blushHeads[headId] = {
      id: headId,
      name: headName,
      markup: headMatch[2].trim(),
    };
  }

  if (faceMatch && !blushFaces[faceId]) {
    blushFaces[faceId] = {
      id: faceId,
      name: faceName,
      markup: faceMatch[2].trim(),
    };
  }

  if (accMatch && !blushAccessories[accId]) {
    blushAccessories[accId] = {
      id: accId,
      name: accName,
      markup: accMatch[2].trim(),
    };
  }

  blushPresets.push({
    id: `preset-${bodyId}`,
    label: `${bodyName} (${headName})`,
    bodyId,
    headId,
    faceId,
    accessoryId: accId,
    beardId,
    fileName: normalizedFileName,
    publicUrl: `/mascot/${normalizedFileName}`,
  });
}

// Add 'none' accessory option
blushAccessories['none'] = {
  id: 'none',
  name: 'No Glasses',
  markup: '<path d="" id="Ink" fill="#000"/>'
};

// Also ensure 'glasses' alias points to 'glasses-2' if selected
if (blushAccessories['glasses-2']) {
  blushAccessories['glasses'] = {
    id: 'glasses',
    name: 'Round Wire Glasses',
    markup: blushAccessories['glasses-2'].markup,
  };
}

console.log('Harvested bodies:', Object.keys(blushBodies));
console.log('Harvested presets:', blushPresets.map(p => p.id));

// Generate the TypeScript file
const fileContent = `// Automatically harvested from Blush Pro Open Peeps SVGs

export interface BlushComponent {
  id: string;
  name: string;
  markup: string;
}

export interface BlushPreset {
  id: string;
  label: string;
  bodyId: string;
  headId: string;
  faceId: string;
  accessoryId: string;
  beardId: string;
  fileName: string;
  publicUrl: string;
}

export const BLUSH_PRESETS: BlushPreset[] = ${JSON.stringify(blushPresets, null, 2)};

export const BLUSH_BODIES: Record<string, BlushComponent> = ${JSON.stringify(blushBodies, null, 2)};

export const BLUSH_HEADS: Record<string, BlushComponent> = ${JSON.stringify(blushHeads, null, 2)};

export const BLUSH_FACES: Record<string, BlushComponent> = ${JSON.stringify(blushFaces, null, 2)};

export const BLUSH_ACCESSORIES: Record<string, BlushComponent> = ${JSON.stringify(blushAccessories, null, 2)};

export const BLUSH_BEARDS: Record<string, BlushComponent> = ${JSON.stringify(blushBeards, null, 2)};
`;

fs.writeFileSync(catalogFile, fileContent, 'utf8');
console.log(`Generated ${catalogFile} successfully!`);
