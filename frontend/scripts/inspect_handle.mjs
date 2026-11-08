import sharp from 'sharp';

async function checkHole() {
  const brainDir = 'C:\\Users\\abdis\\.gemini\\antigravity\\brain\\aa12b53b-04fa-4259-8560-24d7f40dbfbd';
  const img = sharp(`${brainDir}\\test_cutout_coffee.png`);
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  for (let y = 640; y <= 660; y += 5) {
    for (let x = 735; x <= 755; x += 5) {
      const idx = (y * info.width + x) * 4;
      console.log(`(${x}, ${y}): a=${data[idx+3]} rgb=[${data[idx]}, ${data[idx+1]}, ${data[idx+2]}]`);
    }
  }
}

await checkHole();
