import sharp from 'sharp';

async function analyzeSrc() {
  const img = sharp('C:/Users/abdis/.gemini/antigravity/brain/aa12b53b-04fa-4259-8560-24d7f40dbfbd/var_15_togo_scandi_realism.png');
  const meta = await img.metadata();
  const { data } = await img.raw().toBuffer({ resolveWithObject: true });
  console.log('Source size:', meta.width, 'x', meta.height);

  // Check top-left pixel (0,0)
  console.log('Top-left (0,0) RGB:', data[0], data[1], data[2]);
  console.log('Top-right RGB:', data[(meta.width - 1) * 4], data[(meta.width - 1) * 4 + 1], data[(meta.width - 1) * 4 + 2]);

  // Check where the lid is:
  // Around y = 300..450 in the 1024x1024 source
  for (let y = 340; y <= 400; y += 10) {
    let row = '';
    for (let x = 200; x <= 800; x += 15) {
      const idx = (y * meta.width + x) * 4;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      // if pure background white (>250)
      if (r >= 253 && g >= 253 && b >= 253) row += ' ';
      else if (r > 240 && g > 240 && b > 240) row += '.';
      else row += '#';
    }
    console.log(`y=${y}: ${row}`);
  }
}

analyzeSrc();
