import sharp from 'sharp';

async function inspectSource(file, name) {
  const img = sharp(file);
  const meta = await img.metadata();
  const { data } = await img.raw().toBuffer({ resolveWithObject: true });
  const w = meta.width;
  const h = meta.height;
  console.log(`\n=== SOURCE: ${name} (${w}x${h}) ===`);
  const get = (x, y) => {
    const idx = (y * w + x) * meta.channels;
    return [data[idx], data[idx+1], data[idx+2]];
  };

  console.log('(0,0):', get(0, 0));
  console.log('(w/2, 0):', get(Math.floor(w/2), 0));
  console.log('(w-1, 0):', get(w-1, 0));
  console.log('(0, h/2):', get(0, Math.floor(h/2)));
  console.log('(w-1, h/2):', get(w-1, Math.floor(h/2)));
  console.log('(0, h-1):', get(0, h-1));
  console.log('(w/2, h-1):', get(Math.floor(w/2), h-1));
  console.log('(w-1, h-1):', get(w-1, h-1));

  // Find min/max values on the borders
  let minVal = 255;
  let maxVal = 0;
  for (let x = 0; x < w; x++) {
    for (let y of [0, h - 1]) {
      const idx = (y * w + x) * meta.channels;
      minVal = Math.min(minVal, data[idx], data[idx+1], data[idx+2]);
      maxVal = Math.max(maxVal, data[idx], data[idx+1], data[idx+2]);
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x of [0, w - 1]) {
      const idx = (y * w + x) * meta.channels;
      minVal = Math.min(minVal, data[idx], data[idx+1], data[idx+2]);
      maxVal = Math.max(maxVal, data[idx], data[idx+1], data[idx+2]);
    }
  }
  console.log(`Border range: min=${minVal}, max=${maxVal}`);
}

const brainDir = 'C:\\Users\\abdis\\.gemini\\antigravity\\brain\\aa12b53b-04fa-4259-8560-24d7f40dbfbd';
await inspectSource(brainDir + '\\edited_pizza_slice_1793834827954.jpg', 'Pizza');
await inspectSource(brainDir + '\\pistachio_latte_terracotta_tulip_1793834825770.jpg', 'Coffee');
await inspectSource(brainDir + '\\ramen_photographic_edited_1793834837856.jpg', 'Ramen');
await inspectSource(brainDir + '\\edited_cinnamon_roll_1793834832363.jpg', 'Cinnamon Roll');
await inspectSource(brainDir + '\\banh_mi_edited_dslr_1793834837370.jpg', 'Banh Mi');
await inspectSource(brainDir + '\\edited_hero_croissant_1793834841283.jpg', 'Croissant');
