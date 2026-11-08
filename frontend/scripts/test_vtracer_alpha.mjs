import sharp from 'sharp';
import fs from 'fs';
import { execSync } from 'child_process';

async function testVtracerAlpha() {
  const brainDir = 'C:\\Users\\abdis\\.gemini\\antigravity\\brain\\aa12b53b-04fa-4259-8560-24d7f40dbfbd';
  const testPng = `${brainDir}\\test_cutout_pizza.png`;
  const testSvg = `${brainDir}\\test_vtracer_pizza.svg`;

  // Quantize test cutout
  const quantPng = `${brainDir}\\test_quant_pizza.png`;
  await sharp(testPng)
    .resize(384, 384, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ palette: true, colors: 44, dither: 0 })
    .toFile(quantPng);

  const pyCode = `
import vtracer
vtracer.convert_image_to_svg_py(
    r"${quantPng}",
    r"${testSvg}",
    colormode='color',
    hierarchical='stacked',
    mode='spline',
    filter_speckle=4,
    color_precision=7,
    layer_difference=12,
    corner_threshold=60,
    length_threshold=3.5,
    max_iterations=10,
    splice_threshold=45,
    path_precision=2
)
`;
  const scratchPy = 'scratch/test_vtrace.py';
  fs.writeFileSync(scratchPy, pyCode);
  execSync(`python "${scratchPy}"`);

  const svgTxt = fs.readFileSync(testSvg, 'utf8');
  console.log('SVG total length:', svgTxt.length);
  const paths = [...svgTxt.matchAll(/<path[^>]*d="([^"]+)"[^>]*fill="([^"]+)"/g)].map(m => ({
    d: m[1],
    fill: m[2]
  }));
  console.log('Total paths:', paths.length);
  // Check if any path covers the corners (0,0) or (384,384)
  const cornerPaths00 = paths.filter(p => p.d.startsWith('M0 0') || p.d.startsWith('M 0 0'));
  console.log('Corner (0,0) paths count:', cornerPaths00.length);
  for (const cp of cornerPaths00.slice(0, 5)) {
    console.log('  Fill:', cp.fill, 'length:', cp.d.length);
  }

  // Also rasterize to WebP and check corner pixels
  const webpBuf = await sharp(testSvg)
    .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 86 })
    .toBuffer();
  const wimg = sharp(webpBuf);
  const { data, info } = await wimg.raw().toBuffer({ resolveWithObject: true });
  console.log('WebP (0,0):', [data[0], data[1], data[2], data[3]]);
  console.log('WebP (191,0):', [data[191*4], data[191*4+1], data[191*4+2], data[191*4+3]]);
  console.log('WebP (191,191):', [data[(191*192+191)*4], data[(191*192+191)*4+1], data[(191*192+191)*4+2], data[(191*192+191)*4+3]]);
  console.log('WebP (0,191):', [data[(191*192)*4], data[(191*192)*4+1], data[(191*192)*4+2], data[(191*192)*4+3]]);
}

await testVtracerAlpha();
