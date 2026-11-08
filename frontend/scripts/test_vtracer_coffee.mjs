import sharp from 'sharp';
import fs from 'fs';
import { execSync } from 'child_process';

async function testVtracerCoffee() {
  const brainDir = 'C:\\Users\\abdis\\.gemini\\antigravity\\brain\\aa12b53b-04fa-4259-8560-24d7f40dbfbd';
  const testPng = `${brainDir}\\test_cutout_coffee.png`;
  const testSvg = `${brainDir}\\test_vtracer_coffee.svg`;

  // Quantize test cutout
  const quantPng = `${brainDir}\\test_quant_coffee.png`;
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
  const scratchPy = 'scratch/test_vtrace_coffee.py';
  fs.writeFileSync(scratchPy, pyCode);
  execSync(`python "${scratchPy}"`);

  const svgTxt = fs.readFileSync(testSvg, 'utf8');
  console.log('Coffee SVG total length:', svgTxt.length);

  // Rasterize to WebP and check corner and handle pixels
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
  console.log('WebP bottom-mid (96,187):', [data[(187*192+96)*4], data[(187*192+96)*4+1], data[(187*192+96)*4+2], data[(187*192+96)*4+3]]);

  // Count border alpha
  let borderAlpha = 0;
  for (let y = 0; y < 192; y++) {
    for (let x = 0; x < 192; x++) {
      if (x < 15 || x > 176 || y < 15 || y > 176) {
        if (data[(y * 192 + x) * 4 + 3] > 10) borderAlpha++;
      }
    }
  }
  console.log('Border alpha (>10 in outer 15px):', borderAlpha, '(previously was 2573!)');
}

await testVtracerCoffee();
