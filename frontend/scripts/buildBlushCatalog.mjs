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

// Add Beanie from react-peeps
if (fs.existsSync(path.join(reactPeepsHairDir, 'Beanie.js'))) {
  const code = fs.readFileSync(path.join(reactPeepsHairDir, 'Beanie.js'), 'utf8');
  const dMatches = [...code.matchAll(/d:\s*'([^']+)'/g)].map(m => m[1]);
  if (dMatches.length >= 2) {
    blushHeads['beanie'] = {
      id: 'beanie',
      name: 'Knitted Beanie',
      markup: `${baseSkinPath}<g transform="translate(-7.992421, 58.70615)"><path d="${dMatches[0]}" id="Hat" fill="#e84a27"/></g><g transform="translate(-14.99996, 50.99953)"><path d="${dMatches[1]}" id="Ink" fill="#181615" fill-rule="evenodd"/></g>`,
    };
  }
}

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
      markup: `${baseSkinPath}<g transform="translate(45.99902, 88.99984)"><path d="${dMatches[0]}" id="Hat" fill="#e84a27"/></g><g transform="translate(-62.00126, 16.99961)"><path d="${dMatches[1]}" id="Ink" fill="#181615" fill-rule="evenodd"/></g>`,
    };
  }
}

// Add Hijab from react-peeps
if (fs.existsSync(path.join(reactPeepsHairDir, 'Hijab.js'))) {
  const code = fs.readFileSync(path.join(reactPeepsHairDir, 'Hijab.js'), 'utf8');
  const dMatches = [...code.matchAll(/d:\s*'([^']+)'/g)].map(m => m[1]);
  if (dMatches.length >= 2) {
    blushHeads['hijab'] = {
      id: 'hijab',
      name: 'Hijab Wrap',
      markup: `${baseSkinPath}<g transform="translate(89.07787, 105.0979)"><path d="${dMatches[0]}" id="Hat" fill="#e84a27"/></g><g transform="translate(3.00046, 36.99949)"><path d="${dMatches[1]}" id="Ink" fill="#181615" fill-rule="evenodd"/></g>`,
    };
  }
}

// Add Turban from react-peeps
if (fs.existsSync(path.join(reactPeepsHairDir, 'Turban.js'))) {
  const code = fs.readFileSync(path.join(reactPeepsHairDir, 'Turban.js'), 'utf8');
  const dMatches = [...code.matchAll(/d:\s*'([^']+)'/g)].map(m => m[1]);
  if (dMatches.length >= 2) {
    blushHeads['turban'] = {
      id: 'turban',
      name: 'Turban Wrap',
      markup: `${baseSkinPath}<g transform="translate(17.99997, 10.99906)"><path d="${dMatches[0]}" id="Hat" fill="#e84a27"/></g><g transform="translate(13.00033, 1.000502)"><path d="${dMatches[1]}" id="Ink" fill="#181615" fill-rule="evenodd"/></g>`,
    };
  }
}

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

// 4.2 Awe (stripped of built-in spectacles [2,3,4,5], keeping Awe eyebrows [0,1], starry wide eyes [6,7], nose, and open mouth [8])
const aweFace = readReactPeepsFace('Awe.js');
// Nose from Smile.js shifted by (53-36, 52-36) = (+17, +16) into Awe's local coordinate space
const aweNoseD = 'M145.748 135.039C153.872 123.66 142.366 112.957 134.814 108.367C132.836 106.947 134.406 102.243 138.634 102.97C177.031 109.567 157.136 175.708 108.112 139.413C102.275 134.704 109.343 124.334 115.634 128.366C115.953 128.611 116.288 128.869 116.636 129.139C123.704 134.603 136.636 144.601 145.748 135.039Z';
const aweCleanD = [aweFace.subs[0], aweFace.subs[1], aweFace.subs[6], aweFace.subs[7], aweNoseD, aweFace.subs[8]].join(' ');
blushFaces['awe'] = {
  id: 'awe',
  name: 'Awe',
  markup: `<g transform="${aweFace.transform}"><path id="Ink" fill="#181615" fill-rule="evenodd" d="${aweCleanD}"/></g>`,
};

// 4.3 Loving Grin (heart eyes + open grin + exact tongue fill for cutout hole [6])
const loveGrinFace = readReactPeepsFace('LoveGrin.js');
blushFaces['loving-grin'] = {
  id: 'loving-grin',
  name: 'Loving Grin',
  markup: `<g transform="${loveGrinFace.transform}"><path id="tongue" fill="#E84A27" fill-rule="evenodd" d="${loveGrinFace.subs[6]}"/><path id="Ink" fill="#181615" fill-rule="evenodd" d="${loveGrinFace.d}"/></g>`,
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
  markup: `<g transform="${hecticFace.transform}"><path id="teeth" fill="#FFFFFF" fill-rule="evenodd" d="${hecticFace.subs.slice(10, 18).join(' ')}"/><path id="Ink" fill="#181615" fill-rule="evenodd" d="${hecticFace.d}"/></g>`,
};

// 4.13 Monster (exact white fangs + white eye sclera holes [2, 3])
const monsterFace = readReactPeepsFace('Monster.js');
const monsterLeftFangD = 'M57.3202,175.92 C60.3852,179.646 61.3122,185.421 62.6362,189.994 C64.1102,195.082 66.2452,200.639 67.0112,205.917 L67.2252,205.545 C67.9797,204.112 68.7494,202.686 69.5229,201.262 L71.8432,196.991 C73.9242,193.135 76.0432,189.303 78.1812,185.48 C75.7398,184.563 73.3212,183.578 70.9121,182.576 L65.4449,180.29 C62.322,178.971 59.1377,177.482 56.7902,175.082 Z';
blushFaces['monster'] = {
  id: 'monster',
  name: 'Monster',
  markup: `<g transform="${monsterFace.transform}"><path id="teeth" fill="#FFFFFF" fill-rule="evenodd" d="${monsterLeftFangD} ${monsterFace.subs[9]}"/><path id="Ink" fill="#181615" fill-rule="evenodd" d="${monsterFace.d}"/></g>`,
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
