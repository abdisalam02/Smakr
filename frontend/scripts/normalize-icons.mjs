import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const foodDir = './public/icons/food';
const filterDir = './public/icons/filters';

async function processDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.webp'));
  
  for (const f of files) {
    const filePath = path.join(dir, f);
    const buf = fs.readFileSync(filePath);
    
    // 1. Trim non-transparent content
    const trimmed = await sharp(buf).trim().toBuffer({ resolveWithObject: true });
    const tw = trimmed.info.width;
    const th = trimmed.info.height;
    
    let targetW = 160;
    let targetH = 160;
    const aspect = tw / th;
    
    if (aspect > 1.35) {
      // Wide icon like pizza/pasta/sandwich (aspect ~1.6): boost width and height so it's not tiny!
      targetH = Math.min(142, Math.round(115 * Math.sqrt(aspect)));
      targetW = Math.min(208, Math.round(targetH * aspect));
    } else if (aspect < 0.75) {
      // Tall icon: boost height
      targetW = Math.min(142, Math.round(115 * Math.sqrt(1 / aspect)));
      targetH = Math.min(208, Math.round(targetW / aspect));
    } else {
      // Standard roughly square icon (160x160 box)
      if (tw >= th) {
        targetW = 160;
        targetH = Math.round(160 / aspect);
      } else {
        targetH = 160;
        targetW = Math.round(160 * aspect);
      }
    }
    
    const resized = await sharp(trimmed.data)
      .resize(targetW, targetH, {
        fit: 'fill',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toBuffer();
    
    // Canvas dimensions: ensure at least 14px safety padding on every side
    const canvasW = Math.max(192, targetW + 28);
    const canvasH = Math.max(192, targetH + 28);
    const padX = Math.round((canvasW - targetW) / 2);
    const padY = Math.round((canvasH - targetH) / 2);
    
    // Compose centered into canvas with safety padding
    const padded = await sharp({
      create: {
        width: canvasW,
        height: canvasH,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite([{ input: resized, left: padX, top: padY }])
      .webp({ quality: 94, alphaQuality: 96 })
      .toBuffer();
      
    fs.writeFileSync(filePath, padded);
    console.log(`Processed ${f}: trimmed ${tw}x${th} (aspect ${aspect.toFixed(2)}) -> scaled ${targetW}x${targetH} on canvas ${canvasW}x${canvasH}`);
  }
}

async function main() {
  console.log('--- Processing Food Icons ---');
  await processDirectory(foodDir);
  console.log('--- Processing Filter Icons ---');
  await processDirectory(filterDir);
  console.log('Normalization complete!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
