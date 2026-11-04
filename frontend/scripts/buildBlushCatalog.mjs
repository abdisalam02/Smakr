import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'public/mascot');
const catalogFile = path.join(rootDir, 'src/lib/blushMascotCatalog.ts');
const harvestedFacesPath = path.join(rootDir, 'src/lib/harvestedFaces.json');
const reactPeepsFaceDir = path.join(rootDir, 'node_modules/react-peeps/lib/peeps/face');
const reactPeepsHairDir = path.join(rootDir, 'node_modules/react-peeps/lib/peeps/hair');
const reactPeepsAccDir = path.join(rootDir, 'node_modules/react-peeps/lib/peeps/accessories');
const reactPeepsFacialHairDir = path.join(rootDir, 'node_modules/react-peeps/lib/peeps/facialHair');

// Padded viewBox helper (+60px all sides)
function getPaddedViewBox(vbString) {
  const parts = vbString.trim().split(/\s+/).map(Number);
  if (parts.length !== 4) return vbString;
  const [minX, minY, width, height] = parts;
  const pad = 60;
  return `${(minX - pad).toFixed(3)} ${(minY - pad).toFixed(3)} ${(width + pad * 2).toFixed(3)} ${(height + pad * 2).toFixed(3)}`;
}

// Detect color slots from markup
function detectColorSlots(markup, category) {
  const slots = ['skin'];
  if (markup.includes('id="Top"') || markup.includes('id="Jacket"') || markup.includes('id="Clothes"')) {
    slots.push('top');
  }
  if (
    (markup.includes('id="Jacket"') && markup.includes('id="Top"')) ||
    markup.includes('id="Pants"') ||
    markup.includes('id="Bottom"') ||
    markup.includes('id="Squiggles"')
  ) {
    slots.push('bottom');
  }
  if (markup.includes('id="Shoes"') || markup.includes('id="Footwear"') || markup.includes('id="Sneakers"')) {
    slots.push('shoes');
  }
  if (markup.includes('id="Cup"') || markup.includes('id="Mug"')) {
    slots.push('cup');
  }
  if (markup.includes('id="Computer"')) {
    slots.push('computer');
  }
  return slots;
}

// 1. Read existing catalog for verified zero-bleed bust pose markups
const existingCatalogContent = fs.existsSync(catalogFile) ? fs.readFileSync(catalogFile, 'utf8') : '';
function getExistingBodyMarkup(id) {
  const match = existingCatalogContent.match(new RegExp(`"${id}":\\s*\\{[\\s\\S]*?"markup":\\s*"([\\s\\S]*?)"\\s*\\}`, 'm'));
  if (match) {
    return JSON.parse(`"${match[1]}"`);
  }
  return null;
}

// 2. Read SVG files in public/mascot
const svgFiles = fs.readdirSync(outDir).filter(f => f.endsWith('.svg'));
console.log(`Found ${svgFiles.length} SVGs in ${outDir}`);

const blushBodies = {};
const blushPresets = [];

// Base Head Afro markup for face contour
let baseSkinPath = '';
let baseAfroInk = '';

for (const file of svgFiles) {
  const filePath = path.join(outDir, file);
  const content = fs.readFileSync(filePath, 'utf8');

  // Match category & pose
  const bodyGroupMatch = content.match(/<g\s+id="(Body|Sitting|Standing)"\s+transform="([^"]+)"/);
  const poseMatch = content.match(/<g\s+id="(Body|Sitting|Standing)\/([^"]+)"[^>]*>([\s\S]*?)<\/g>\s*<\/g>/);
  const headGroupMatch = content.match(/<g\s+id="Head"\s+transform="translate\(([^,]+),\s*([^)]+)\)[^"]*"/);
  const vbMatch = content.match(/viewBox="([^"]+)"/);

  if (!poseMatch || !bodyGroupMatch || !headGroupMatch || !vbMatch) continue;

  const rawCategory = bodyGroupMatch[1].toLowerCase();
  const category = rawCategory === 'sitting' ? 'sitting' : rawCategory === 'standing' ? 'standing' : 'bust';
  const poseName = poseMatch[2];
  
  // Clean slug
  let bodyId = poseName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  if (category === 'sitting' && !bodyId.startsWith('sitting-')) {
    bodyId = `sitting-${bodyId}`;
  } else if (category === 'standing' && !bodyId.startsWith('standing-')) {
    bodyId = `standing-${bodyId}`;
  }
  if (bodyId.includes('doctor') || bodyId.includes('nurse')) {
    bodyId = 'standing-doctor-nurse-3';
  }

  // Label
  let label = poseName;
  if (bodyId === 'jacket-1') label = 'Jacket 1 (Two Layers)';
  else if (bodyId === 'jacket-2') label = 'Jacket 2';
  else if (bodyId === 'coffee') label = 'Coffee / Matcha';
  else if (bodyId === 'shrug') label = 'Shrug';
  else if (bodyId === 'striped-pocket-tee') label = 'Striped Pocket Tee';
  else if (bodyId === 'sitting-one-leg-up-2') label = 'Sitting One Leg Up';
  else if (bodyId === 'sitting-mid-1') label = 'Sitting Relaxed';
  else if (bodyId === 'standing-walking-3') label = 'Walking';
  else if (bodyId === 'standing-doctor-nurse-3') label = 'Standing Pose';

  const rawViewBox = vbMatch[1];
  const paddedViewBox = getPaddedViewBox(rawViewBox);
  const bodyTransform = bodyGroupMatch[2];
  const headAnchor = [parseFloat(headGroupMatch[1]), parseFloat(headGroupMatch[2])];

  // Helper to get subpaths from d attribute
  function getSubpaths(d) {
    return d.split(/(?=[M][0-9.-])/i).filter(s => s.trim().length > 0);
  }

  // Topological closed-subpath builders for sitting and standing poses (zero bleed)
  function buildSittingOneLegUp2(inner) {
    const paths = inner.match(/<path[^>]+>/g);
    const skinD = paths[0].match(/d="([^"]+)"/)[1];
    const shoesD = paths[1].match(/d="([^"]+)"/)[1];
    const topD = paths[2].match(/d="([^"]+)"/)[1];
    const inkD = paths[3].match(/d="([^"]+)"/)[1];
    const inkSubs = getSubpaths(inkD);

    // Ink[1, 9, 11] are the 3 thin trouser-crease slits that caused evenodd seam artifacts
    const seamIndices = [1, 9, 11];
    const inkNoSeamsD = inkSubs.filter((_, i) => !seamIndices.includes(i)).join(' ');
    const seamsD = seamIndices.map(i => inkSubs[i]).join(' ');
    const collarDetailD = inkSubs[15];

    return [
      `<defs><clipPath id="clip-oneleg-ink"><path clip-rule="evenodd" d="${inkNoSeamsD}" /></clipPath></defs>`,
      `<path id="Skin" fill="#d08b5b" fill-rule="evenodd" d="${skinD}" />`,
      `<path id="Top" fill="#FFCF77" fill-rule="evenodd" d="${topD}" />`,
      `<path id="Bottom" fill="#8FA7DF" fill-rule="evenodd" d="${inkNoSeamsD}" />`,
      `<g clip-path="url(#clip-oneleg-ink)"><path id="OutlineStroke" d="${inkNoSeamsD}" fill="none" stroke="#181615" stroke-width="26" stroke-linejoin="round" stroke-linecap="round" /></g>`,
      `<path id="Shoes" fill="#FFFFFF" fill-rule="evenodd" d="${shoesD}" />`,
      `<path id="OutlineStroke" d="${shoesD} ${inkSubs[3]} ${inkSubs[7]}" fill="none" stroke="#181615" stroke-width="14" stroke-linejoin="round" stroke-linecap="round" />`,
      `<path id="Seams" fill="#FAF7F2" fill-rule="evenodd" d="${seamsD}" />`,
      `<path id="Ink" fill="#181615" fill-rule="evenodd" d="${collarDetailD}" />`,
    ].join('');
  }

  function buildSittingMid1(inner) {
    const paths = inner.match(/<path[^>]+>/g);
    const skinD = paths[0].match(/d="([^"]+)"/)[1];
    const shoesD = paths[1].match(/d="([^"]+)"/)[1];
    const pantsD = paths[2].match(/d="([^"]+)"/)[1];
    const inkD = paths[3].match(/d="([^"]+)"/)[1];
    const inkSubs = getSubpaths(inkD);

    // Interior detail subpaths (shoe soles, collar, sleeve cuffs, pant fly/hem lines)
    // Note: index 11 is excluded because Ink[11] is the bare right ankle skin cutout hole
    const detailIndices = [1, 4, 5, 6, 7, 10, 12, 14, 15, 16, 17, 18, 20, 21];
    const detailInkD = detailIndices.map(i => inkSubs[i]).join(' ');

    return [
      `<defs><clipPath id="clip-mid-ink"><path clip-rule="evenodd" d="${inkD}" /></clipPath></defs>`,
      `<path id="Skin" fill="#d08b5b" fill-rule="evenodd" d="${skinD}" />`,
      `<path id="Shoes" fill="#FFFFFF" fill-rule="evenodd" d="${shoesD}" />`,
      `<path id="Bottom" fill="#8FA7DF" fill-rule="evenodd" d="${pantsD}" />`,
      `<path id="Top" fill="#FFCF77" fill-rule="evenodd" d="${inkD}" />`,
      `<g clip-path="url(#clip-mid-ink)"><path id="OutlineStroke" d="${inkD}" fill="none" stroke="#181615" stroke-width="26" stroke-linejoin="round" stroke-linecap="round" /></g>`,
      `<path id="Ink" fill="#181615" fill-rule="evenodd" d="${detailInkD}" />`,
    ].join('');
  }

  function buildStandingWalking3(inner) {
    const paths = inner.match(/<path[^>]+>/g);
    const skinD = paths[0].match(/d="([^"]+)"/)[1];
    const shoesD = paths[1].match(/d="([^"]+)"/)[1];
    const inkD = paths[2].match(/d="([^"]+)"/)[1];
    const inkSubs = getSubpaths(inkD);

    // Remove waist seam slits Ink[3] & Ink[6] so Top & Bottom are solid inside Ink[11]
    const inkSolidD = inkSubs.filter((_, i) => ![3, 6].includes(i)).join(' ');
    const waistSeamsAndCollarD = [3, 6, 10].map(i => inkSubs[i]).join(' ');

    // Waistline polygon passing cleanly through the bare right forearm cutout (Ink[5])
    const waistPointsTop = '0,-60 1500,-60 1500,957 832,952 775,985 486,989 0,1004';
    const waistPointsBottom = '0,1004 486,989 775,985 832,952 1500,957 1500,2500 0,2500';

    return [
      `<defs>`,
      `<clipPath id="clip-walk-ink"><path clip-rule="evenodd" d="${inkSolidD}" /></clipPath>`,
      `<clipPath id="clip-walk-top"><polygon points="${waistPointsTop}" /></clipPath>`,
      `<clipPath id="clip-walk-bottom"><polygon points="${waistPointsBottom}" /></clipPath>`,
      `<clipPath id="clip-walk-shoes"><path fill-rule="evenodd" d="${shoesD}" /></clipPath>`,
      `</defs>`,
      `<path id="Skin" fill="#d08b5b" fill-rule="evenodd" d="${skinD}" />`,
      `<path id="Shoes" fill="#FFFFFF" fill-rule="evenodd" d="${shoesD}" />`,
      `<g clip-path="url(#clip-walk-bottom)"><path id="Bottom" fill="#8FA7DF" fill-rule="evenodd" d="${inkSolidD}" /></g>`,
      `<g clip-path="url(#clip-walk-top)"><path id="Top" fill="#FFCF77" fill-rule="evenodd" d="${inkSolidD}" /></g>`,
      `<g clip-path="url(#clip-walk-ink)"><path id="OutlineStroke" d="${inkSolidD}" fill="none" stroke="#181615" stroke-width="26" stroke-linejoin="round" stroke-linecap="round" /></g>`,
      `<g clip-path="url(#clip-walk-shoes)"><path id="Ink" fill="#181615" fill-rule="evenodd" d="${inkD}" /></g>`,
      `<path id="Ink" fill="#181615" fill-rule="evenodd" d="${waistSeamsAndCollarD}" />`,
    ].join('');
  }

  function buildStandingDoctorNurse3(inner) {
    const paths = inner.match(/<path[^>]+>/g);
    const clothesD = paths[0].match(/d="([^"]+)"/)[1];
    const skinD = paths[1].match(/d="([^"]+)"/)[1];
    const shoesD = paths[2].match(/d="([^"]+)"/)[1];
    const inkD = paths[3].match(/d="([^"]+)"/)[1];

    // Exact polygon tracing the sweater waist hem (y=913..965) and sleeve cuffs (y=1035)
    const sweaterClipPoints = '0,-60 1300,-60 1300,1030 1091,1035 1083,995 1071,928 1005,926 928,913 867,950 767,958 675,965 596,930 581,985 558,1035 0,1055';

    return [
      `<defs><clipPath id="clip-doc-top"><polygon points="${sweaterClipPoints}" /></clipPath></defs>`,
      `<path id="Bottom" fill="#3B82F6" fill-rule="evenodd" d="${clothesD}" />`,
      `<g clip-path="url(#clip-doc-top)"><path id="Top" fill="#8FA7DF" fill-rule="evenodd" d="${clothesD}" /></g>`,
      `<path id="Skin" fill="#d08b5b" fill-rule="evenodd" d="${skinD}" />`,
      `<path id="Shoes" fill="#FFFFFF" fill-rule="evenodd" d="${shoesD}" />`,
      `<path id="Ink" fill="#181615" fill-rule="evenodd" d="${inkD}" />`,
    ].join('');
  }

  function buildJacket1(inner) {
    const paths = inner.match(/<path[^>]+>/g);
    const skinD = paths[0].match(/d="([^"]+)"/)[1];
    const collarD = paths[1].match(/d="([^"]+)"/)[1];
    const teeD = paths[2].match(/d="([^"]+)"/)[1];
    const inkD = paths[3].match(/d="([^"]+)"/)[1];
    const inkSubs = getSubpaths(inkD);
    const coatD = inkSubs[6];
    const detailsD = inkSubs.slice(0, 6).join(' ');

    return [
      `<defs><clipPath id="clip-j1-coat"><path clip-rule="evenodd" d="${coatD}" /></clipPath></defs>`,
      `<path id="Skin" fill="#d08b5b" fill-rule="evenodd" d="${skinD}" />`,
      `<path id="Jacket" fill="#FFCF77" fill-rule="evenodd" d="${coatD}" />`,
      `<path id="Top" fill="#8FA7DF" fill-rule="evenodd" d="${teeD}" />`,
      `<path id="Seams" fill="#FAF7F2" fill-rule="evenodd" d="${collarD}" />`,
      `<g clip-path="url(#clip-j1-coat)"><path id="OutlineStroke" d="${coatD}" fill="none" stroke="#181615" stroke-width="26" stroke-linejoin="round" stroke-linecap="round" /></g>`,
      `<path id="Ink" fill="#181615" fill-rule="evenodd" d="${detailsD}" />`,
    ].join('');
  }

  function buildJacket2(inner) {
    const paths = inner.match(/<path[^>]+>/g);
    const skinD = paths[0].match(/d="([^"]+)"/)[1];
    const cardiganD = paths[1].match(/d="([^"]+)"/)[1];
    const inkD = paths[2].match(/d="([^"]+)"/)[1];
    const inkSubs = getSubpaths(inkD);
    const cmds0 = inkSubs[0].match(/[A-Za-z][^A-Za-z]*/g).map(c => c.trim());
    const cmds1 = inkSubs[1].match(/[A-Za-z][^A-Za-z]*/g).map(c => c.trim());

    // Smooth out the 9 half-polka-dot bumps fused into Ink[0] along the cardigan edges
    const skip0 = new Set([36, 38, 47, 48, 49, 91, 96, 97, 102, 104, 105, 108, 110]);
    const cleanInk0 = cmds0.map((c, i) => {
      if (skip0.has(i)) {
        if (i === 36) return 'L684.463176,649.700009';
        if (i === 38) return 'L681.303176,566.391009';
        if (i === 47) return 'L808.332176,609.221009';
        if (i === 91) return 'L313.893176,547.901009';
        if (i === 96) return 'L266.284176,218.530009';
        if (i === 102) return 'L269.713176,93.3310091';
        if (i === 104) return 'L119.893176,249.431009';
        if (i === 108) return 'L66.7521756,423.661009';
        if (i === 110) return 'L60.9131756,576.601009';
        return '';
      }
      return c;
    }).filter(Boolean).join(' ');

    // Smooth out the half-polka-dot bump fused into Ink[1] (cmds 5..17)
    const cleanInk1 = [
      ...cmds1.slice(0, 5),
      'L200.383276,558.491009',
      ...cmds1.slice(18)
    ].join(' ');

    // Exact inner T-shirt contour extracted from Ink[0] commands (collar cmds[4..6] + lapel/hem cmds[76..83])
    const innerTeeD = [
      'M350.393176,69.5610091',
      ...cmds0.slice(4, 7),
      'L561.372176,82.5290091',
      ...cmds0.slice(76, 84),
      'Z'
    ].join(' ');

    const teeCollarAndHemD = [
      'M340,105',
      ...cmds0.slice(5, 7),
      'M566,695',
      ...cmds0.slice(78, 82)
    ].join(' ');

    const lineworkIndices = [0, 1, 15, 20, 29];
    const lineworkD = [cleanInk0, cleanInk1, inkSubs[15], inkSubs[20], inkSubs[29]].join(' ');
    const dotsD = inkSubs.filter((_, i) => !lineworkIndices.includes(i)).join(' ');

    return [
      `<defs><clipPath id="clip-j2-tee"><path clip-rule="evenodd" d="${innerTeeD}" /></clipPath></defs>`,
      `<path id="Skin" fill="#d08b5b" fill-rule="evenodd" d="${skinD}" />`,
      `<path id="Jacket" fill="#FFCF77" fill-rule="evenodd" d="${cardiganD}" />`,
      `<path id="Ink" fill="#181615" fill-rule="evenodd" d="${lineworkD}" />`,
      `<path id="Top" fill="#8FA7DF" fill-rule="evenodd" d="${innerTeeD}" />`,
      `<g clip-path="url(#clip-j2-tee)"><path id="OutlineStroke" d="${teeCollarAndHemD}" fill="none" stroke="#181615" stroke-width="24" stroke-linejoin="round" stroke-linecap="round" /></g>`,
      `<path id="Seams" fill="#FAF7F2" fill-rule="evenodd" d="${dotsD}" />`,
    ].join('');
  }

  function buildSweater(inner) {
    const paths = inner.match(/<path[^>]+>/g);
    const skinD = paths[0].match(/d="([^"]+)"/)[1];
    const topD = paths[1].match(/d="([^"]+)"/)[1];
    const inkD = paths[2].match(/d="([^"]+)"/)[1];
    const inkSubs = getSubpaths(inkD);
    // Preserve all structural cutout holes in Ink: outer [0], sweater hole [4], seam [9], hand holes [10, 14],
    // right cuff rib holes [15, 16, 20], left cuff/forearm holes [18, 19, 22, 24], collar rib holes [38, 39, 40, 41, 43]
    const holeIndices = [0, 4, 9, 10, 14, 15, 16, 18, 19, 20, 22, 24, 38, 39, 40, 41, 43];
    const squigglesD = inkSubs.filter((_, i) => !holeIndices.includes(i)).join(' ');
    const lineworkD = holeIndices.map(i => inkSubs[i]).join(' ');

    return [
      `<path id="Skin" fill="#d08b5b" fill-rule="evenodd" d="${skinD}" />`,
      `<path id="Top" fill="#FFCF77" fill-rule="evenodd" d="${topD}" />`,
      `<path id="Squiggles" fill="#FAF7F2" fill-rule="evenodd" d="${squigglesD}" />`,
      `<path id="Ink" fill="#181615" fill-rule="evenodd" d="${lineworkD}" />`,
    ].join('');
  }

  function buildPointingUp(inner) {
    const paths = inner.match(/<path[^>]+>/g);
    const skinD = paths[0].match(/d="([^"]+)"/)[1];
    const inkD = paths[2].match(/d="([^"]+)"/)[1];
    const inkSubs = getSubpaths(inkD);
    const cmds = inkSubs[0].match(/[A-Za-z][^A-Za-z]*/g).map(c => c.trim());

    // Un-merge the bottom-edge squiggle (cmds[33..57]) and left sleeve seam (cmds[60..63]) from Ink[0]
    const bottomSquiggleD = `M421.158599,689.462886 ${cmds.slice(33, 58).join(' ')} Z`;
    const leftSeamD = `M219.352599,688.470886 ${cmds.slice(60, 64).join(' ')} Z`;

    const sweaterD = [
      'M866.040599,258.321886',
      ...cmds.slice(16, 33),
      'L411.511599,689.106886',
      ...cmds.slice(58, 60),
      'L211.425599,689.081886',
      ...cmds.slice(64, 102),
      'L735,165 L756,204 L767,255 Z'
    ].join(' ');

    const outlineIndices = [0, 5, 12, 15, 16];
    const squigglesD = inkSubs.filter((_, i) => !outlineIndices.includes(i)).join(' ') + ' ' + bottomSquiggleD;
    const handSkinD = `${inkSubs[12]} ${inkSubs[15]} ${inkSubs[16]}`;
    const handOuterD = [
      'M713.680599,115.302886',
      ...cmds.slice(102, 115),
      ...cmds.slice(1, 16),
      'L767,255 L765,228 L756,204 L744,183 L730,165 L719,138 Z'
    ].join(' ');

    return [
      `<defs>`,
      `<clipPath id="clip-pu-neck"><rect x="250" y="-80" width="350" height="250" /></clipPath>`,
      `<clipPath id="clip-pu-sweater"><path clip-rule="evenodd" d="${sweaterD}" /></clipPath>`,
      `</defs>`,
      `<g clip-path="url(#clip-pu-neck)"><path id="Skin" fill="#d08b5b" fill-rule="evenodd" d="${skinD}" /></g>`,
      `<path id="Top" fill="#FFCF77" fill-rule="evenodd" d="${sweaterD}" />`,
      `<g clip-path="url(#clip-pu-sweater)"><path id="OutlineStroke" d="${sweaterD}" fill="none" stroke="#181615" stroke-width="26" stroke-linejoin="round" stroke-linecap="round" /></g>`,
      `<path id="Squiggles" fill="#FAF7F2" fill-rule="evenodd" d="${squigglesD}" />`,
      `<path id="Ink" fill="#181615" fill-rule="evenodd" d="${leftSeamD} ${inkSubs[5]}" />`,
      `<path id="Ink" fill="#181615" fill-rule="evenodd" d="${handOuterD} ${handSkinD}" />`,
      `<path id="Skin" fill="#d08b5b" fill-rule="evenodd" d="${handSkinD}" />`,
    ].join('');
  }

  function buildStripedPocketTee(inner) {
    const paths = inner.match(/<path[^>]+>/g);
    const skinD = paths[0].match(/d="([^"]+)"/)[1];
    const skinSubs = getSubpaths(skinD);
    const onlySkinD = `${skinSubs[0]} ${skinSubs[1]}`;
    const pocketBackingD = skinSubs[2];
    const inkD = paths[1].match(/d="([^"]+)"/)[1];
    const inkSubs = getSubpaths(inkD);
    const stripesD = inkSubs.slice(2, 10).join(' ');
    const teeOutlineD = inkSubs[1];
    const armOutlineD = inkSubs[0];

    return [
      `<defs>`,
      `<clipPath id="clip-pt-tee"><path clip-rule="evenodd" d="${teeOutlineD}" /></clipPath>`,
      `<clipPath id="clip-pt-skin"><polygon points="-300,-100 1200,-100 1200,695 -300,695" /></clipPath>`,
      `</defs>`,
      `<g clip-path="url(#clip-pt-skin)"><path id="Skin" fill="#d08b5b" fill-rule="evenodd" d="${onlySkinD}" /></g>`,
      `<path id="Top" fill="#FFCF77" fill-rule="evenodd" d="${teeOutlineD}" />`,
      `<g clip-path="url(#clip-pt-tee)"><path id="OutlineStroke" d="${teeOutlineD}" fill="none" stroke="#181615" stroke-width="26" stroke-linejoin="round" stroke-linecap="round" /></g>`,
      `<path id="Bottom" fill="#8FA7DF" fill-rule="evenodd" d="${pocketBackingD}" />`,
      `<path id="Seams" fill="#FAF7F2" fill-rule="evenodd" d="${stripesD}" />`,
      `<path id="Ink" fill="#181615" fill-rule="evenodd" d="${armOutlineD}" />`,
    ].join('');
  }

  // Use pre-tuned zero-bleed markup if available (e.g. for shrug, hoodie, etc.)
  let markup = bodyId === 'hoodie' ? poseMatch[3].trim() : (getExistingBodyMarkup(bodyId) || poseMatch[3].trim());

  // Inject verified topological closed-subpath markups for all multi-layer and compound garments
  if (bodyId === 'sitting-one-leg-up-2') {
    markup = buildSittingOneLegUp2(poseMatch[3].trim());
  } else if (bodyId === 'sitting-mid-1') {
    markup = buildSittingMid1(poseMatch[3].trim());
  } else if (bodyId === 'standing-doctor-nurse-3') {
    markup = buildStandingDoctorNurse3(poseMatch[3].trim());
  } else if (bodyId === 'standing-walking-3') {
    markup = buildStandingWalking3(poseMatch[3].trim());
  } else if (bodyId === 'jacket-1') {
    markup = buildJacket1(poseMatch[3].trim());
  } else if (bodyId === 'jacket-2') {
    markup = buildJacket2(poseMatch[3].trim());
  } else if (bodyId === 'sweater') {
    markup = buildSweater(poseMatch[3].trim());
  } else if (bodyId === 'pointing-up') {
    markup = buildPointingUp(poseMatch[3].trim());
  } else if (bodyId === 'striped-pocket-tee') {
    markup = buildStripedPocketTee(poseMatch[3].trim());
  }

  const detectedColorSlots = detectColorSlots(markup, category);

  blushBodies[bodyId] = {
    id: bodyId,
    name: poseName,
    label,
    category,
    viewBox: paddedViewBox,
    bodyTransform,
    headAnchor,
    detectedColorSlots,
    markup,
  };

  blushPresets.push({
    id: `preset-${bodyId}`,
    label: `${label} (Afro)`,
    bodyId,
    headId: 'afro',
    faceId: 'smile-big',
    accessoryId: 'glasses-2',
    beardId: 'none',
    fileName: file,
    publicUrl: `/mascot/${file}`,
  });

  // Extract base skin path from Afro if found
  const afroMatch = content.match(/<g\s+id="Head\/Afro"[^>]*>([\s\S]*?)<\/g>\s*<\/g>/);
  if (afroMatch && !baseSkinPath) {
    const skinTag = afroMatch[1].match(/<path[^>]*id="Skin"[^>]*>/);
    if (skinTag) baseSkinPath = skinTag[0];
    const inkTag = afroMatch[1].match(/<path[^>]*id="Ink"[^>]*>/);
    if (inkTag) baseAfroInk = inkTag[0];
  }
}

console.log(`Harvested ${Object.keys(blushBodies).length} bodies.`);

// 3. Harvest Heads (Afro + Hats/Hair)
const blushHeads = {
  afro: {
    id: 'afro',
    name: 'Afro (Smakr Signature)',
    markup: `${baseSkinPath}${baseAfroInk}`,
  },
};

// Add Beanie from Open Peeps (clean separated Skin, Hat, Ink paths)
blushHeads['beanie'] = {
  id: 'beanie',
  name: 'Knitted Beanie',
  markup: `<path fill-rule="evenodd" clip-rule="evenodd" d="M244.8 58.7c44.8 0 98.5 21.7 103 22.1h.2c2.4 0 11.8 7.2 28.1 21.5L358.4 137l1.4 1.4c7 6.6 12.8 12.6 17.4 17.3 37.8 38.6 44.6 190.3 35.7 243.2-9 53-25.4 104.7-102.2 104.7-76.8 0-162.3-46.2-175.4-60.6a37.4 37.4 0 0 0-29.6-13.8c-.4-.5-.9-1-1.3-1.7l-1.6-.2a99.6 99.6 0 0 1-32.6-8.8C57.4 411 43.4 373 43.4 364.7c0-8.3-21-68.8-21.5-75.2v-.1c0-5.4-27.4-30-27.4-37.7 0-7.8-5.6-7.4 0-34.9l1.6-8C2 179.5 13.5 131 57.4 109.9c48.3-23 142.2-51.2 187.4-51.2Z" id="Skin" fill="#ae5d29"/><path d="M117.7 298.3s-20.2 9.6-40.4 25.2c-20.1 15.5-10.2 16-10.2 16s-.8 33.5 5.4 46.7c6.2 13.3 43 15.6 43 15.6l6.2 21-.8 9.6a33.5 33.5 0 0 0-15.2-3c-.4-.5-.9-1-1.3-1.7l-1.6-.2a99.6 99.6 0 0 1-32.6-8.8c-12.8-7.3-26.9-45.4-26.9-53.7 0-4.7-6.6-25.8-12.5-44.6-4.6-14.6-8.7-27.8-8.9-30.6v-.1c0-2.5-5.6-8.8-11.8-15.8-7.4-8.4-15.6-17.7-15.6-22 0-2.2-.5-3.8-1-5.6-1.3-4.3-3-9.7 1-29.2l1.6-8c5.9-29.3 17.4-77.8 61.3-98.9C105.7 87.1 199.6 59 244.8 59c35.3 0 76 13.5 94 19.4 4.9 1.6 8 2.6 9 2.7h.2c2.4 0 11.8 7.2 28.1 21.5l-4.1 8.1c-54.1 1.6-143 6.4-181.9 21.2-57.7 21.9-72.4 166.4-72.4 166.4Z" id="Hat" fill="#e84a27"/><path fill-rule="evenodd" clip-rule="evenodd" d="M50 108.9C74 83.3 210.8 43.8 280 52l2 .3c5.5.7 11 1.8 16.4 3.2 17.3 4 35.2 10.2 49.6 20.5 12 8.3 49.7 22 38.6 44a32.5 32.5 0 0 1 2.9 25.2c-.4 2.6-1.2 5-2.3 7.6 8.9 13 15.8 27.7 21.5 41.7 9.9 35.2 16 71.9 17 107.8 2.9 68.3-4.6 149.9-64 194-36 28-92.2 29-132.6-5.8-2.3-2.7-13-10-9.5-11.3a102.7 102.7 0 0 0 3.3 3l-1-1c-2-1.8-4.6-4.5-1.7-4l.4.5 1.5 1h.1c-1.7-1.8-2.7-3.6-.2-2.4l.3.1 3.5 3.4v-.4l-1-1c-1.1-1-1-1-.4-1.9-2.3-3.1 2-1.3 2.2 0 2.6-.6 5 4.3 6.6 4.9 74 56.9 181.4 6.4 179.7-152.1v-3.1c-.6-50.7-4.8-102.8-25.8-148.7a132 132 0 0 0-6.8-12.9c-1.8-3.1-3.6-6.2-5.6-9.1a82.5 82.5 0 0 1-22-4.7l-80.1 4.6-8.5.5c-22.8 1.5-46.4 3.8-64.8 18-18.1 12.8-18.2 38.2-33.7 52.3-22 15-22.2 28.5-26.5 50.6.4 16.6 11.9 40.8-9.3 47.8 3.6 5-1.4 2.6-1.8.8 3.1 6-1.6 2.3-2 .4l-.7-.5c3.2 5.1-2 1.5-1.7.6-6.2-9.6-19-11-28-8.5 0 .3-.5.4-.7.2-38.2 8.3-28.4 87.4 10.8 79.7 1.7-.3 1.6.5 2 .6-1-2.4 1.6-1.4 1.6-1H109.6c-.9-4.8 4 2.3 3.7 2.5l.4-.1-.1-.5c-.8-2.2-.8-1.2-.8-2.5-.6-1.5-.6-.9-.5-1.9 2.2-1.6 2.8 3.4 3.5 3.8-1.2-1.7-.2-3.1 1-2.2 8.8 18.6 20.2 36 34.9 49.7 1.6 1.3 3.2 2.6 5 3.7 6.2 5.5 15.8 9 21.7 13.8l-.1.3v.1l.2.2 2 1c.7.5 1.2 1 1.7 1.7.5.6 1 1.2 1.3 1.9.2.8-.2 1.2-1 .8-.4 0-.7-.2-1-.4v.1c.1.2.9 2 0 1.7h-.1l-1.5-.6 1.6 2.1c.5.5.8 1.1.9 1.8 0 .4-.2.5-.6.5l-1.7-.6.1.3c.4.8 1 2.1 0 1.7a32 32 0 0 1-2.6-1c0 .2-.2.2-.5.1-2.6-1-5.2-2-7.7-3.5l-6.5-4.7c-2-1.2-4-2.6-6-4.1a129 129 0 0 1-32.4-30.1c-14.7 12.7-44.1.6-62.3-9.4-16-8.9-22.4-25.4-24-43-3.4-24-23-32.2-21.5-84.6h-.1c-.8-.2-1.4-.4-2-.8-.8-.3-1.4-.7-2-1.2l-.7-1-1-.6-.1.1c-.5.6-.2-.2-.1-.4L9.4 290l-9-12.4v.2l-.2.2a79.2 79.2 0 0 1-14-31c-2-8.3-1.2-16.8.5-24.5C-6 195.6 18.2 134.9 50 108.9ZM223.5 480l-.4-.3.4.4c.2.2.3.4.7.6v-.2l-.7-.5Zm56.1-414.5c-46.9-4-93 6.3-137.8 18.8l-3 1c-25.5 7.2-52.4 13.7-74 29.3-30 23-45.5 59.6-59 93.4a62.3 62.3 0 0 0 12 71c1.9-17.4 5-34.4 10-51.1 1-2.7.2-3.5 2.4-3.9 3.4 45.3-13.1 78.7 19.6 132.3 14.2 25.3-2.3 43.8 37.8 57l1 .5a47.3 47.3 0 0 0 25.7 3.9l-.7-1.2c-.7-1.2-1-1.8.1-2.4v-.1c-1-1.7-1.8-3.4-2.6-5l-1 .2c.2.4.2.8-.4 1-2.2.7-4.5 1-6.8.9h-.5a23 23 0 0 1-5.7-1.1l-1.5-.3c-4.7-1-9.7-3.7-13-6.4-37-21-33.2-92.7 12.5-99.5.9-45 22.4-121.2 58-164.2 32.1-39.5 120-56.6 181.2-50.6l2.6.9c9.5.8 18.5 5 27.9 7A85 85 0 0 0 342 85.6a161.7 161.7 0 0 0-62.4-20Zm-187 274.6c2.4-1.4 2.1 0 2.7-.4 17.7-1.5 36.7 14 46.6 26.9-.8.8-2.9-1.6-3.3-2l-.1.1.2.4c4 5.8-3.9-1-4.6-2.4-.2 0-.3.1-.4 0 .6.7 2.5 2.3 2.8 3.5l.5.4c4.8 4 4.4 7.2-1 1.3.1.3.2.6 0 .8h.3c2.7 2 4.9 7.2-.7 1.8.5 4-5.6-3.6-5.8-3.6a82.3 82.3 0 0 0-39.6-17.5h-.4c-2.5-.4-3.6-1-2.8-2.7-3-.7-2.3-2.2-.8-2.1-2.2-1.4-.3-2.8 1-2.3-.9-2.3 2.5-.7 2.8-1 1.8-2.8 2.3-.5 2.6-1.2Zm-37-145.4c8.4-3 33.5 6.2 31.5 18.6-1.2 2.8-5.1 4.4-8 2.8l-3.5-2.4c-6.3-4.2-12-8-18.7-11.6-3.7-1.8-5.3-5.7-1.4-7.4Zm48.2-18.3-3.3-2.1c-17.6-11.6-42.6-29.1 1.7-11 5 2.2 11.8 3.5 14.5 8.3 4.3 8.9-7 9.4-12.9 4.8Zm2-52c-1.4-5.3 16.2 1 21.4 2.7l.8.3c5 1.9 10.7 3.6 13.7 7.9 3.5 6-3.6 7.2-8 4.5-9-5.9-18.9-10.3-28-15.3Zm44.9-25c-10-10.8 16.7-.4 20.6 2.4l.2.1c3 2.1 2.3 6.6-.5 8-8 0-13.8-6.5-20.3-10.5Zm45.2-11.9c-15.8-11.3 5-6 12.3-1.5 4.9 4.4-.2 11.7-12.3 1.5Z" id="Ink" fill="#181615"/>`,
};

// Add Bun from react-peeps (pure hairstyle, path 1 with exact translate)
if (fs.existsSync(path.join(reactPeepsHairDir, 'Bun.js'))) {
  const code = fs.readFileSync(path.join(reactPeepsHairDir, 'Bun.js'), 'utf8');
  const dMatches = [...code.matchAll(/d:\s*'([^']+)'/g)].map(m => m[1]);
  if (dMatches.length >= 2) {
    blushHeads['bun'] = {
      id: 'bun',
      name: 'High Top Bun',
      markup: `${baseSkinPath}<g transform="translate(-65.99968, -34.00051)"><path d="${dMatches[1]}" id="Ink" fill="#181615" fill-rule="evenodd"/></g>`,
    };
  }
}

// Add HatHip (Hipster Cap) from react-peeps
if (fs.existsSync(path.join(reactPeepsHairDir, 'HatHip.js'))) {
  const code = fs.readFileSync(path.join(reactPeepsHairDir, 'HatHip.js'), 'utf8');
  const dMatches = [...code.matchAll(/d:\s*'([^']+)'/g)].map(m => m[1]);
  if (dMatches.length >= 2) {
    blushHeads['hat-hip'] = {
      id: 'hat-hip',
      name: 'Hipster Cap',
      markup: `<g transform="translate(45.99902, 88.99984)"><path d="${dMatches[0]}" id="Skin" fill="#ae5d29"/></g><g transform="translate(-62.00126, 16.99961)"><path d="${dMatches[1]}" id="Ink" fill="#181615" fill-rule="evenodd"/></g>`,
    };
  }
}

// Add Hijab from Open Peeps (clean separated face opening and scarf wrap)
blushHeads['hijab'] = {
  id: 'hijab',
  name: 'Hijab Wrap',
  markup: `<path d="M260.3 105.2c150.5 4.7 159.6 76.2 159.6 196.1 0 120-78.1 195.5-106.9 208.7-28.7 13.2-104.4 69.8-172.7 43.7C72 527.6 91.7 417.3 91.7 370c0-47.4 18-269.5 168.6-264.7Z" id="Skin" fill="#ae5d29"/><path d="M114.8 295.4c31.1-126.9 88-188.8 170.4-185.7C409 114.3 407.7 240.5 400 229c-5-7.5-40.6-33.7-106.5-78.7l-4-2.8-174.6 148Z" id="Hat" fill="#e84a27"/><path d="M321.3 470.6c-27.6 15.4-59.2 16-89 6.3a187.5 187.5 0 0 1-49.5-25.5 341 341 0 0 1-37-30.8 272.6 272.6 0 0 1-22.3-66c-3.6-20.8-4-42.4.1-63.3 31-25.5 62-51.3 92.8-77.1 15.7-13.2 31.4-26.3 47.4-39.2l24.1-19.7 4-3.2c16.6 12.1 34.5 22.6 51 35a349.4 349.4 0 0 1 37.4 32.4c3.6 3.7 7.2 9 12.3 10.3a5 5 0 0 0 2 .2c7 60.7 12 126.4-17.8 181.5-13 24.1-31.4 45.6-55.5 59Zm-179.8 22.3c-3.8-3.5 1.9-9.1 5.7-5.6 23.8 21.8 55 33.3 86.4 38.7 5 .8 2.9 8.5-2.2 7.7-32.8-5.6-65-18-89.9-40.8ZM113 526.4c-4.6-2.5-.5-9.4 4-7 18.6 10 38.9 15.2 59.5 18.7 5.1.8 3 8.5-2 7.7a198.6 198.6 0 0 1-61.5-19.4Zm75.5-337c15.3-13.9 31.9-27 49.4-38 17.6-11.3 37-18 57.8-18.2l-4.2 3.7-11.8 10.1c-8 6.8-15.8 13.6-23.5 20.4-15.3 13.6-30.7 27-46 40.7-29.2 26.1-57.9 52.8-86 80.3l.5-2c9.3-38.9 34.6-70.9 63.8-97ZM309 134.8l.2-.9c40 5.3 73.5 34.7 84.6 73.5-1 1.4-1.5 3-1.3 4.6 0 .9.2 1.8.3 2.6l-4-3.8a325.7 325.7 0 0 0-39.2-33.8 178.2 178.2 0 0 0-53.5-28.5l3.8-3.2c3.9-3 7.4-5.7 9-10.5Zm71.8-41.5A175.2 175.2 0 0 0 286.4 40a185 185 0 0 0-102 10.5c-67.7 26.6-121.1 85-146.2 152.9a278.3 278.3 0 0 0-15 124.6c4.4 41.6 17 84.5 39.8 120 2 3.2 4.3 6.3 6.7 9.3a79.7 79.7 0 0 1-11.5 34.6l-1.1 1.7c-6.6 4.9-13.4 9.5-20 14.3-5.8 4.1-11.5 8.4-17 13-5 4.3-11 9-14.5 14.9-2.8 4.8-4 11.3-.1 15.8 4.7 5.5 12.6 3.6 19 3.6H26l5.8 3.3 57.7 30.2c38.3 20 76.5 40.6 115.7 59 18.1 8.5 37.5 16 57.8 16 19.1-.1 36.3-7.7 51.2-19.2 17-13.1 31.2-29.8 45-46 5.4-6.6 10.8-13.2 16-20 10.3-3.3 20.3-4.3 29.4 2.2 7.3 5.3 16.8-1.8 17-9.7 0-2.8 0-5.6-.3-8.3-1.9-16.8-10-32-19.3-46.1a694.1 694.1 0 0 0-19.5-28.1 363.6 363.6 0 0 0 49.1-103.6A353 353 0 0 0 444 266c-3.7-61.4-20.6-126.3-63-172.7Z" id="Ink" fill="#181615"/>`,
};

// Add Turban from Open Peeps (clean separated face and turban wrap)
blushHeads['turban'] = {
  id: 'turban',
  name: 'Turban Wrap',
  markup: `<path d="M463.9 255.6A268.4 268.4 0 0 0 397.5 121c-4-4.4-7.6-11.3-13.7-12.5-6.1-12.4-17.8-21.3-27.1-31.3-20.4-20.3-39.9-43-66.2-55.9-121.8-50-239.1 92.8-264 200.3C1.8 308 28.8 427.3 136 430.8c15.2 20 36 33.9 57.6 46.3 29.3 18.8 61.3 26.4 95.2 16 33.8 8.8 68.9-19.6 89.2-44.4 16-19.3 27-42.8 41.7-62.7a37.5 37.5 0 0 0 34.7-32.3c16.2-29.8 15.4-65.4 9.6-98.1Z" id="Skin" fill="#ae5d29"/><path d="M26.5 221.6c24.9-107.5 142.2-250.4 264-200.3 26.3 12.9 45.8 35.6 66.2 55.9 9.3 10 21 18.9 27.1 31.3 6.1 1.2 9.7 8.1 13.7 12.5A268.4 268.4 0 0 1 464 255.6c5.8 32.7 6.6 68.3-9.6 98a37.5 37.5 0 0 1-34.7 32.4c-3.2 4.3-6.2 8.8-9 13.4l-.8.2v-5c-1.5-82-6.2-131.5-14.2-148.5-8-17.2-42.8-48.6-104-94.3l-2-1.4-14.3-11.8-11.2 12.6c-42 47.4-74.9 84-98.7 109.7-25.5 27.7-47.2 69.8-64.9 126.4l-.5 1.8 31.3 41.4C28 423.8 2 306.8 26.5 221.6Z" id="Hat" fill="#e84a27"/><path d="M198.4 4.3c22.2-5.1 45.4-4 67.4 1.6 43.5 11.3 79.4 40.7 109 73.4a405 405 0 0 1 70.4 108l.9 2c12.3 28 23 57.2 23.5 88.2a239 239 0 0 1-11 79.7c-7.6 22.5-21.7 45.3-46 50.7a155.4 155.4 0 0 1-75.7 82.8 129.7 129.7 0 0 1-68.5 12.5 128.4 128.4 0 0 1-65.5-28.7c-.5-.4.2-1.2.7-.9a142 142 0 0 0 75.5 17 128.2 128.2 0 0 0 104.4-60.8 185 185 0 0 0 14.5-28.4 9.1 9.1 0 0 1 3.7-10.1 133.5 133.5 0 0 0 6.5-35.2c.5-6.8.2-14 .9-20.8-.3-5.6-.6-11-1.1-16.6a199.9 199.9 0 0 0-11.2-52.2c-6.3-17-16.4-32-29-44.8-27.3-27.6-61.1-47.8-87.6-76.2l-1.4-1.5-10 10-15 15.4c-30.6 31.3-61 63-87.7 97.8a461.4 461.4 0 0 0-41 63.4 382 382 0 0 0-15.4 32.4l-1.9 4.4a105 105 0 0 0-5.7 17.1c3.8 3.9 6.6 9.5 9.8 13.8a130.4 130.4 0 0 0 25.7 26.4l.6.4c5.6 4 12.2 6.8 13 14.5.4 3.3-2.6 6-5.4 7-7.5 2.9-15.3-5.3-20.4-10-3.1-2.9-6-6-8.7-9.4-2.6.4-5.2.6-7.8.3-4-.5-8-1.2-12-2.2-32.4-8.6-56.4-35.5-69.4-65.6-17.4-40.3-17-86.8-9.8-129.4 13.2-78 56-150.7 120.7-196.8 18.1-13 38.2-24 60-29.2Zm35 10.5C191.6 12.6 153.6 34 123 60.9a296.6 296.6 0 0 0-96.8 193.7c-3.7 39-1 81 19.4 115.5a131 131 0 0 0 30 34.9 97.4 97.4 0 0 0 38 18.2 79.4 79.4 0 0 1-9.7-17.5c-.2.2-.5.2-.7 0-8.7-12-6-26.3-1.9-39.4 4.4-13.7 9.9-27.1 16.2-40.1 22.9-47.3 57-88.6 92.3-127 18-19.7 36.7-38.8 55.3-58A2691.7 2691.7 0 0 0 306.4 98c4.4-4.9 8.4-10 14-13.6 4.3-3 8.7 2.6 6.7 6.7-3.2 6.3-8.6 11.3-13.5 16.5l-.5.5a1443.4 1443.4 0 0 1-30.7 32.2c4.7-.5 9.5-.8 14.2-1.6 6.4-1 12.7-2.3 19-3.9 6.5-1.6 13-3.7 19.3-6.3 6-2.4 11.5-6.3 18-6.7 5.5-.3 7.2 6.5 4.2 10-4.2 5-11.8 7-18 8.8l-.8.2c-6.8 2-13.7 3.6-20.7 4.7-9.3 1.3-20 2-29.8.6 19.7 11.5 37.9 25.9 56 39.9l3.2 2.4a210 210 0 0 1 47.6 47 156.7 156.7 0 0 1 22.8 58.1c2 10.1 3.3 20.4 4.2 30.6 3.2 9.1 2.7 20 1.9 30l-.3 3.4v1c.1 6.3 2.7 20.3-3.3 25l-.3 1.5 2.2-1.4 1-.6.7-.7h.1a61.4 61.4 0 0 0 13.9-17.8c6-10.8 9.8-22.6 12.7-34.8a204 204 0 0 0 5.2-69c-.4-3.2-1-7.2-2.2-11.3A388.6 388.6 0 0 0 345.4 67.9c-30.4-28.3-69.8-51-112-53.1Zm-58.9 115.1c1.5-.9 3 .9 2.3 2.3-3.6 7-9.7 13-14.7 18.9l-15.6 18.6a973.5 973.5 0 0 0-30.8 38.9l-2.6 3.5A484.4 484.4 0 0 0 88.2 248c-4 6.5-7.4 13.2-10.6 20.1-3 6.6-4.4 14.5-8 20.7-.3.4-1 .4-1.1-.1-1.2-6.7 1.7-14.7 3.8-21a128 128 0 0 1 9.9-21.2c7.9-14.2 17.4-27.6 27-40.7a747.8 747.8 0 0 1 45.4-56.7l2-2.2c5.5-5.9 11-12.7 18-17Zm-25.3-20.6c2.5-1.9 4.6 1.9 3 3.9-9.4 11.8-20.2 22.5-30.5 33.6a381.7 381.7 0 0 0-73.6 109c-.2.5-1 .2-.8-.3C53.8 226.4 69 200 86.6 176l.6-.9c17.7-24 38-48.1 62-66Z" id="Ink" fill="#181615"/>`,
};

// Add Short Crop from react-peeps
let shortCropD = '';
if (fs.existsSync(path.join(reactPeepsHairDir, 'Short.js'))) {
  const code = fs.readFileSync(path.join(reactPeepsHairDir, 'Short.js'), 'utf8');
  const dMatches = [...code.matchAll(/d:\s*'([^']+)'/g)].map(m => m[1]);
  if (dMatches.length >= 1) {
    shortCropD = dMatches[dMatches.length - 1];
    blushHeads['short'] = {
      id: 'short',
      name: 'Short Crop',
      markup: `${baseSkinPath}<g transform="translate(45.00021, 64.99994)"><path d="${shortCropD}" id="Ink" fill="#181615" fill-rule="evenodd"/></g>`,
    };
  }
}

// Add Medium Locks from react-peeps
if (fs.existsSync(path.join(reactPeepsHairDir, 'Medium.js'))) {
  const code = fs.readFileSync(path.join(reactPeepsHairDir, 'Medium.js'), 'utf8');
  const dMatches = [...code.matchAll(/d:\s*'([^']+)'/g)].map(m => m[1]);
  if (dMatches.length >= 1) {
    blushHeads['medium'] = {
      id: 'medium',
      name: 'Medium Locks',
      markup: `${baseSkinPath}<g transform="translate(-75.99979, 62.00021)"><path d="${dMatches[dMatches.length - 1]}" id="Ink" fill="#181615" fill-rule="evenodd"/></g>`,
    };
  }
}

// Add Witch Hat (Pointed Halloween/Festive Hat + short under-hair)
blushHeads['witch'] = {
  id: 'witch',
  name: 'Witch Hat',
  markup: `${baseSkinPath}${shortCropD ? `<g transform="translate(45.00021, 64.99994)"><path d="${shortCropD}" id="Ink" fill="#181615" fill-rule="evenodd"/></g>` : ''}<g transform="translate(40, -40)"><path d="M70,180 C110,170 320,170 360,180 C390,190 380,210 350,212 C290,215 130,215 70,212 C40,210 30,190 70,180 Z" id="HatBrim" fill="#181615"/><path d="M120,180 C150,110 200,20 220,-30 C235,10 260,100 290,180 Z" id="Hat" fill="#2E1065"/><path d="M128,155 C160,150 250,150 282,155 L286,178 C250,174 160,174 124,178 Z" id="HatBand" fill="#F59E0B"/><rect x="188" y="152" width="28" height="28" rx="4" fill="none" stroke="#FDE68A" stroke-width="6"/><path d="M70,180 C110,170 320,170 360,180 C390,190 380,210 350,212 C290,215 130,215 70,212 C40,210 30,190 70,180 Z M120,180 C150,110 200,20 220,-30 C235,10 260,100 290,180 Z" fill="none" stroke="#181615" stroke-width="8" id="Ink"/></g>`,
};

console.log(`Harvested ${Object.keys(blushHeads).length} heads.`);

// 4. Harvest the 16 Curated, Visually Verified Facial Expressions
const blushFaces = {};

function splitFaceSubpaths(d) {
  return d.split(/(?=[M]\s*[0-9.-])/i).filter(s => s.trim().length > 0);
}

function readNativeBlushFace(svgFileName, faceGroupName) {
  const content = fs.readFileSync(path.join(outDir, svgFileName), 'utf8');
  const re = new RegExp(`<g\\s+id="Face\\/${faceGroupName}"[^>]*>([\\s\\S]*?)<\\/g>\\s*<\\/g>`);
  const m = content.match(re);
  if (!m) return '';
  return m[1]
    .trim()
    .replace(/fill="#000"/g, 'fill="#181615"')
    .replace(/fill="#FFF"/g, 'fill="#FFFFFF"')
    .replace(/<path\s+d=/g, '<path fill-rule="evenodd" d=');
}

function readReactPeepsFace(fileName) {
  const code = fs.readFileSync(path.join(reactPeepsFaceDir, fileName), 'utf8');
  const d = code.match(/d:\s*['"]([^'"]+)['"]/)[1];
  const transform = (code.match(/transform:\s*['"]([^'"]+)['"]/) || ['', ''])[1];
  return { d, transform, subs: splitFaceSubpaths(d) };
}

// 4.1 Native Blush Faces (4)
blushFaces['smile-big'] = {
  id: 'smile-big',
  name: 'Smile Big',
  markup: readNativeBlushFace('blush-coffee.svg', 'Smile Big'),
};

const smileFace = readReactPeepsFace('Smile.js');
blushFaces['smile'] = {
  id: 'smile',
  name: 'Smile',
  markup: `<g transform="${smileFace.transform}"><path id="Ink" fill="#181615" fill-rule="evenodd" d="${smileFace.d}"/></g>`,
};

blushFaces['eating-happy'] = {
  id: 'eating-happy',
  name: 'Eating Happy',
  markup: readNativeBlushFace('blush-standing-doctor-nurse-3.svg', 'Eating Happy'),
};

blushFaces['contempt'] = {
  id: 'contempt',
  name: 'Contempt',
  markup: readNativeBlushFace('blush-sitting-one-leg-up-2.svg', 'Contempt'),
};

// 4.2 Awe (stripped of built-in spectacles [2,3,4,5], keeping Awe eyebrows [0,1], starry wide eyes [6,7], nose, open mouth [8], plus white eye scleras [4,5])
const aweFace = readReactPeepsFace('Awe.js');
// Nose from Smile.js shifted by (53-36, 52-36) = (+17, +16) into Awe's local coordinate space
const aweNoseD = 'M145.748 135.039C153.872 123.66 142.366 112.957 134.814 108.367C132.836 106.947 134.406 102.243 138.634 102.97C177.031 109.567 157.136 175.708 108.112 139.413C102.275 134.704 109.343 124.334 115.634 128.366C115.953 128.611 116.288 128.869 116.636 129.139C123.704 134.603 136.636 144.601 145.748 135.039Z';
const aweCleanD = [aweFace.subs[0], aweFace.subs[1], aweFace.subs[6], aweFace.subs[7], aweNoseD, aweFace.subs[8]].join(' ');
blushFaces['awe'] = {
  id: 'awe',
  name: 'Awe',
  markup: `<g transform="${aweFace.transform}"><path id="sclera" fill="#FFFFFF" fill-rule="evenodd" d="${aweFace.subs[4]} ${aweFace.subs[5]}"/><path id="Ink" fill="#181615" fill-rule="evenodd" d="${aweCleanD}"/></g>`,
};

// 4.3 Loving Grin (heart eyes in Burnt Paprika Red + open grin + red tongue)
const loveGrinFace = readReactPeepsFace('LoveGrin.js');
const loveHeartEyesD = [loveGrinFace.subs[2], loveGrinFace.subs[3]].join(' ');
const loveInkWithoutHearts = [loveGrinFace.subs[0], loveGrinFace.subs[1], loveGrinFace.subs[4], loveGrinFace.subs[5]].join(' ');
blushFaces['loving-grin'] = {
  id: 'loving-grin',
  name: 'Loving Grin',
  markup: `<g transform="${loveGrinFace.transform}"><path id="Ink" fill="#181615" fill-rule="evenodd" d="${loveInkWithoutHearts}"/><path id="heart-eyes" fill="#E84A27" stroke="#181615" stroke-width="2" fill-rule="evenodd" d="${loveHeartEyesD}"/><path id="tongue" fill="#E84A27" stroke="#181615" stroke-width="1.5" fill-rule="evenodd" d="${loveGrinFace.subs[6]}"/></g>`,
};

// 4.4 Cheeky (exact inner tongue fill bounded by the black tongue loop)
const cheekyFace = readReactPeepsFace('Cheeky.js');
const cheekyTongueFillD = 'M85.2583,163.058 C88.6703,167.027 88.8043,172.986 91.7913,177.405 C94.5693,181.515 98.8853,184.909 103.941,185.433 C107.717,185.825 111.537,184.463 113.014,181.073 C113.813,179.239 113.722,178.244 113.422,176.982 L113.149,175.885 C112.203,172.044 111.779,169.119 113.944,165.352 Z';
blushFaces['cheeky'] = {
  id: 'cheeky',
  name: 'Cheeky',
  markup: `<g transform="${cheekyFace.transform}"><path id="tongue" fill="#E84A27" fill-rule="evenodd" d="${cheekyTongueFillD}"/><path id="Ink" fill="#181615" fill-rule="evenodd" d="${cheekyFace.d}"/></g>`,
};

// 4.5 Cute (Native Blush Face/Cute + soft rosy cheek blush)
blushFaces['cute'] = {
  id: 'cute',
  name: 'Cute',
  markup: `<ellipse cx="88" cy="158" rx="16" ry="10" fill="#FF8A8A" opacity="0.45"/><ellipse cx="222" cy="154" rx="16" ry="10" fill="#FF8A8A" opacity="0.45"/>${readNativeBlushFace('blush-sitting-mid-1.svg', 'Cute')}`,
};

// 4.6 Smile LOL (exact teeth hole [10], exact tear holes [7, 8], plus red tongue interior)
const smileLolFace = readReactPeepsFace('SmileLol.js');
blushFaces['smile-lol'] = {
  id: 'smile-lol',
  name: 'Smile LOL',
  markup: `<g transform="${smileLolFace.transform}"><path id="tears" fill="#38BDF8" fill-rule="evenodd" d="${smileLolFace.subs[7]} ${smileLolFace.subs[8]}"/><path id="teeth" fill="#FFFFFF" fill-rule="evenodd" d="${smileLolFace.subs[10]}"/><path id="Ink" fill="#181615" fill-rule="evenodd" d="${smileLolFace.d}"/></g>`,
};

// 4.7 Driven
const drivenFace = readReactPeepsFace('Driven.js');
blushFaces['driven'] = {
  id: 'driven',
  name: 'Driven',
  markup: `<g transform="${drivenFace.transform}"><path id="Ink" fill="#181615" fill-rule="evenodd" d="${drivenFace.d}"/></g>`,
};

// 4.8 Explaining (exact upper teeth hole [7] + exact lower tongue hole [8])
const explainingFace = readReactPeepsFace('Explaining.js');
blushFaces['explaining'] = {
  id: 'explaining',
  name: 'Explaining',
  markup: `<g transform="${explainingFace.transform}"><path id="teeth" fill="#FFFFFF" fill-rule="evenodd" d="${explainingFace.subs[7]}"/><path id="tongue" fill="#E84A27" fill-rule="evenodd" d="${explainingFace.subs[8]}"/><path id="Ink" fill="#181615" fill-rule="evenodd" d="${explainingFace.d}"/></g>`,
};

// 4.9 Eyes Closed
const eyesClosedFace = readReactPeepsFace('EyesClosed.js');
blushFaces['eyes-closed'] = {
  id: 'eyes-closed',
  name: 'Eyes Closed',
  markup: `<g transform="${eyesClosedFace.transform}"><path id="Ink" fill="#181615" fill-rule="evenodd" d="${eyesClosedFace.d}"/></g>`,
};

// 4.10 Calm
const calmFace = readReactPeepsFace('Calm.js');
blushFaces['calm'] = {
  id: 'calm',
  name: 'Calm',
  markup: `<g transform="${calmFace.transform}"><path id="Ink" fill="#181615" fill-rule="evenodd" d="${calmFace.d}"/></g>`,
};

// 4.11 Suspicious
const suspiciousFace = readReactPeepsFace('Suspicious.js');
blushFaces['suspicious'] = {
  id: 'suspicious',
  name: 'Suspicious',
  markup: `<g transform="${suspiciousFace.transform}"><path id="Ink" fill="#181615" fill-rule="evenodd" d="${suspiciousFace.d}"/></g>`,
};

// 4.12 Hectic (exact 8 individual teeth holes [10..17] + white eye sclera holes [4, 5])
const hecticFace = readReactPeepsFace('Hectic.js');
blushFaces['hectic'] = {
  id: 'hectic',
  name: 'Hectic',
  markup: `<g transform="${hecticFace.transform}"><path id="sclera" fill="#FFFFFF" fill-rule="evenodd" d="${hecticFace.subs[4]} ${hecticFace.subs[5]}"/><path id="teeth" fill="#FFFFFF" fill-rule="evenodd" d="${hecticFace.subs.slice(10, 18).join(' ')}"/><path id="Ink" fill="#181615" fill-rule="evenodd" d="${hecticFace.d}"/></g>`,
};

// 4.13 Monster (exact white fangs + all 3 white eye scleras [circle + subs 2, 3])
const monsterFace = readReactPeepsFace('Monster.js');
const monsterLeftFangD = 'M57.3202,175.92 C60.3852,179.646 61.3122,185.421 62.6362,189.994 C64.1102,195.082 66.2452,200.639 67.0112,205.917 L67.2252,205.545 C67.9797,204.112 68.7494,202.686 69.5229,201.262 L71.8432,196.991 C73.9242,193.135 76.0432,189.303 78.1812,185.48 C75.7398,184.563 73.3212,183.578 70.9121,182.576 L65.4449,180.29 C62.322,178.971 59.1377,177.482 56.7902,175.082 Z';
blushFaces['monster'] = {
  id: 'monster',
  name: 'Monster',
  markup: `<g transform="${monsterFace.transform}"><ellipse cx="114" cy="38" rx="22" ry="22" id="top-sclera" fill="#FFFFFF"/><path id="sclera" fill="#FFFFFF" fill-rule="evenodd" d="${monsterFace.subs[2]} ${monsterFace.subs[3]}"/><path id="teeth" fill="#FFFFFF" fill-rule="evenodd" d="${monsterLeftFangD} ${monsterFace.subs[9]}"/><path id="Ink" fill="#181615" fill-rule="evenodd" d="${monsterFace.d}"/></g>`,
};

console.log(`Harvested ${Object.keys(blushFaces).length} face expressions.`);

// 5. Harvest Masks (None, Medical, Catrina)
const blushMasks = {
  none: {
    id: 'none',
    name: 'No Mask',
    markup: '<path d="" id="Ink" fill="#000"/>',
  },
  medical: {
    id: 'medical',
    name: 'Medical Mask',
    // Mounts at translate(headX + 28, headY + 300)
    markup: `<g id="MedicalMask">
      <path d="M30,55 C45,15 195,15 210,55 L220,120 C200,165 40,165 20,120 Z" id="MaskFabric" fill="#E0F2FE" />
      <path d="M35,75 C80,68 160,68 205,75 M38,98 C80,90 160,90 202,98 M42,120 C80,114 160,114 198,120" stroke="#BAE6FD" stroke-width="3" stroke-linecap="round" fill="none" />
      <path d="M30,55 C45,15 195,15 210,55 L220,120 C200,165 40,165 20,120 Z" fill="none" stroke="#181615" stroke-width="8" stroke-linejoin="round" id="Ink" />
      <path d="M25,65 C5,50 -10,35 -2,75 C2,95 20,110 22,118 M215,65 C235,50 250,35 242,75 C238,95 220,110 218,118" fill="none" stroke="#181615" stroke-width="5" stroke-linecap="round" id="Ink" />
    </g>`,
  },
  catrina: {
    id: 'catrina',
    name: 'Catrina (Sugar Skull)',
    // Sugar Skull face paint mounted at translate(headX + 28, headY + 300)
    markup: `<g id="CatrinaMask">
      <!-- Petal eye sockets -->
      <circle cx="68" cy="40" r="32" fill="#F43F5E" opacity="0.35" />
      <circle cx="172" cy="40" r="32" fill="#F43F5E" opacity="0.35" />
      <circle cx="68" cy="40" r="26" fill="none" stroke="#FBBF24" stroke-width="4" stroke-dasharray="6,4" />
      <circle cx="172" cy="40" r="26" fill="none" stroke="#FBBF24" stroke-width="4" stroke-dasharray="6,4" />
      <!-- Heart/inverted triangle nose -->
      <path d="M120,68 C115,58 110,65 116,74 L120,80 L124,74 C130,65 125,58 120,68 Z" fill="#181615" id="Ink" />
      <!-- Cheek floral swirls -->
      <path d="M42,95 C50,110 65,110 68,95 C62,85 48,85 42,95" fill="none" stroke="#38BDF8" stroke-width="4" stroke-linecap="round" />
      <path d="M198,95 C190,110 175,110 172,95 C178,85 192,85 198,95" fill="none" stroke="#38BDF8" stroke-width="4" stroke-linecap="round" />
      <!-- Sugar skull stitch smile -->
      <path d="M72,130 Q120,145 168,130" fill="none" stroke="#181615" stroke-width="6" stroke-linecap="round" id="Ink" />
      <path d="M85,122 L85,138 M102,125 L102,143 M120,126 L120,145 M138,125 L138,143 M155,122 L155,138" stroke="#181615" stroke-width="4" stroke-linecap="round" id="Ink" />
      <!-- Forehead Spiderweb / Diamond -->
      <path d="M120,10 L110,24 L120,38 L130,24 Z" fill="#F59E0B" opacity="0.8" />
    </g>`,
  },
};

console.log(`Harvested ${Object.keys(blushMasks).length} masks.`);

// 6. Harvest Accessories (Strictly Native Blush Glasses 2 + None — zero shifted react-peeps eyewear)
const blushCoffeeSvg = fs.readFileSync(path.join(outDir, 'blush-coffee.svg'), 'utf8');
const nativeGlasses2Match = blushCoffeeSvg.match(/<g\s+id="Accessories\/Glasses 2"[^>]*>([\s\S]*?)<\/g>\s*<\/g>/);
const nativeGlasses2Markup = nativeGlasses2Match
  ? nativeGlasses2Match[1].trim().replace(/fill="#000"/g, 'fill="#181615" fill-rule="evenodd"')
  : `<path d="M372.3111,95.4577 C360.1701,108.0027 339.9021,111.6027 323.7491,104.8747 C282.2731,87.5457 302.5741,33.4957 334.5611,18.9807 C338.5571,17.9847 343.8941,15.6217 348.7611,15.0857 C349.2011,14.8697 350.1591,15.4947 351.3201,14.9037 C386.5911,18.8417 394.6231,73.5937 372.3111,95.4577 M238.5331,98.6687 C224.9161,116.7297 199.6001,122.3017 178.9161,113.9057 C138.0541,97.8137 152.5471,49.8847 180.5041,31.0947 C239.5611,8.9037 263.9481,65.3677 238.5331,98.6687 M149.9531,58.6507 C149.9151,58.6327 149.8771,58.6237 149.8381,58.6057 C150.0541,58.5107 150.2701,58.4157 150.4851,58.3187 C150.4151,58.5017 150.3391,58.6827 150.2711,58.8657 C150.1651,58.7927 150.0721,58.7077 149.9531,58.6507 M400.4231,39.1277 C397.0891,39.1347 392.2731,39.6827 389.5131,41.9957 C382.7071,19.0427 357.5851,-2.2003 335.7371,13.2897 C318.5321,18.8227 305.7651,31.0937 298.5091,47.4077 C285.4261,39.6257 264.8541,42.9487 253.5091,53.2397 C246.0791,28.6887 227.7931,20.0917 206.0281,18.8227 C182.2721,14.9317 158.5941,38.0027 151.2061,56.5107 C145.0631,55.8117 135.8841,53.8567 130.1051,57.6477 C92.5981,47.8117 27.0231,42.3887 19.3981,47.8537 C13.9641,49.9387 10.9821,62.7647 18.5721,63.4567 C25.1861,62.5177 17.8001,54.0587 24.4671,53.1357 C59.9901,50.9337 94.4751,58.0877 129.6221,61.0897 C132.7601,65.3107 142.8991,66.7227 148.3081,65.0267 C139.7891,96.4227 158.1791,117.7827 185.7341,124.1807 C228.4011,133.9817 265.5221,95.8137 254.3651,56.1137 C267.2901,49.6837 282.1571,49.9597 296.2371,53.3467 C272.7091,139.9367 412.1661,136.0517 390.3851,44.9627 C404.8801,52.1727 408.0281,40.5827 400.4231,39.1277" id="Ink" fill="#181615" fill-rule="evenodd"/>`;

const blushAccessories = {
  'glasses-2': {
    id: 'glasses-2',
    name: 'Round Glasses',
    markup: nativeGlasses2Markup,
  },
  none: {
    id: 'none',
    name: 'No Glasses',
    markup: '<path d="" id="Ink" fill="#000"/>',
  },
};

console.log(`Harvested ${Object.keys(blushAccessories).length} accessories.`);

// 7. Harvest Beards (None + Facial Hair)
const blushBeards = {
  none: {
    id: 'none',
    name: 'No Facial Hair',
    markup: '<path d="" id="Ink" fill="#000"/>',
  },
};

const facialHairItems = [
  { file: 'Full.js', id: 'full', name: 'Full Beard' },
  { file: 'Goatee.js', id: 'goatee', name: 'Goatee' },
  { file: 'Chin.js', id: 'chin', name: 'Chin Strap' },
  { file: 'Handlebars.js', id: 'handlebars', name: 'Handlebars Moustache' },
  { file: 'MoustacheThin.js', id: 'moustache-thin', name: 'Thin Moustache' },
];

facialHairItems.forEach(item => {
  const p = path.join(reactPeepsFacialHairDir, item.file);
  if (fs.existsSync(p)) {
    const code = fs.readFileSync(p, 'utf8');
    const dMatch = code.match(/d:\s*'([^']+)'/);
    if (dMatch) {
      blushBeards[item.id] = {
        id: item.id,
        name: item.name,
        markup: `<path d="${dMatch[1]}" id="Ink" fill="#181615"/>`,
      };
    }
  }
});

console.log(`Harvested ${Object.keys(blushBeards).length} facial hair styles.`);

// Generate the TypeScript file content
const tsContent = `// Automatically harvested from Blush Pro Open Peeps SVGs

export interface BlushBody {
  id: string;
  name: string;
  label: string;
  category: 'bust' | 'sitting' | 'standing';
  viewBox: string;
  bodyTransform: string;
  headAnchor: [number, number];
  detectedColorSlots: string[];
  markup: string;
}

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

export const BLUSH_BODIES: Record<string, BlushBody> = ${JSON.stringify(blushBodies, null, 2)};

export const BLUSH_HEADS: Record<string, BlushComponent> = ${JSON.stringify(blushHeads, null, 2)};

export const BLUSH_FACES: Record<string, BlushComponent> = ${JSON.stringify(blushFaces, null, 2)};

export const BLUSH_MASKS: Record<string, BlushComponent> = ${JSON.stringify(blushMasks, null, 2)};

export const BLUSH_ACCESSORIES: Record<string, BlushComponent> = ${JSON.stringify(blushAccessories, null, 2)};

export const BLUSH_BEARDS: Record<string, BlushComponent> = ${JSON.stringify(blushBeards, null, 2)};
`;

fs.writeFileSync(catalogFile, tsContent, 'utf8');
console.log(`Successfully generated ${catalogFile}!`);
