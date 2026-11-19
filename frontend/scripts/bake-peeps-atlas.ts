import fs from "fs";
import path from "path";
import sharp, { type OverlayOptions } from "sharp";
import {
  SHEET_COLS,
  SHEET_CELL_W,
  SHEET_CELL_H,
  SPRITE_INSET,
  buildSpriteDeck,
  colorizeCell,
} from "../src/lib/bustCrowdPeep";

const BAKE_COUNT = 48;
const BAKE_COLS = 8;
const BAKE_ROWS = 6;
const BAKE_SEED = 1;

async function main() {
  const srcPath = path.join(process.cwd(), "public", "images", "peeps", "open-peeps-sheet.png");
  const outDir = path.join(process.cwd(), "public", "boot");
  fs.mkdirSync(outDir, { recursive: true });

  const outWebp = path.join(outDir, "peeps-atlas-baked.webp");
  const outManifest = path.join(outDir, "peeps-atlas-baked.json");

  const deck = buildSpriteDeck(BAKE_SEED, BAKE_COUNT);
  const srcBuf = fs.readFileSync(srcPath);

  const composites: OverlayOptions[] = [];
  const cells: Array<{
    slot: number;
    spriteIndex: number;
    col: number;
    row: number;
    sx: number;
    sy: number;
    sw: number;
    sh: number;
  }> = [];

  for (let slot = 0; slot < deck.length; slot++) {
    const spriteIdx = deck[slot];
    const srcCol = spriteIdx % SHEET_COLS;
    const srcRow = Math.floor(spriteIdx / SHEET_COLS);

    const raw = await sharp(srcBuf)
      .extract({
        left: srcCol * SHEET_CELL_W,
        top: srcRow * SHEET_CELL_H,
        width: SHEET_CELL_W,
        height: SHEET_CELL_H,
      })
      .ensureAlpha()
      .raw()
      .toBuffer();

    const rgba = new Uint8ClampedArray(raw.buffer, raw.byteOffset, raw.byteLength);
    colorizeCell(rgba, SHEET_CELL_W, SHEET_CELL_H, spriteIdx, "colorized");

    const cellPng = await sharp(Buffer.from(rgba.buffer, rgba.byteOffset, rgba.byteLength), {
      raw: {
        width: SHEET_CELL_W,
        height: SHEET_CELL_H,
        channels: 4,
      },
    })
      .png()
      .toBuffer();

    const dstCol = slot % BAKE_COLS;
    const dstRow = Math.floor(slot / BAKE_COLS);

    composites.push({
      input: cellPng,
      left: dstCol * SHEET_CELL_W,
      top: dstRow * SHEET_CELL_H,
    });

    cells.push({
      slot,
      spriteIndex: spriteIdx,
      col: dstCol,
      row: dstRow,
      sx: dstCol * SHEET_CELL_W + SPRITE_INSET,
      sy: dstRow * SHEET_CELL_H + SPRITE_INSET,
      sw: SHEET_CELL_W - SPRITE_INSET * 2,
      sh: SHEET_CELL_H - SPRITE_INSET * 2,
    });
  }

  const atlasW = BAKE_COLS * SHEET_CELL_W;
  const atlasH = BAKE_ROWS * SHEET_CELL_H;

  await sharp({
    create: {
      width: atlasW,
      height: atlasH,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .webp({ quality: 80, alphaQuality: 90, effort: 6 })
    .toFile(outWebp);

  const manifest = {
    src: "/boot/peeps-atlas-baked.webp",
    cols: BAKE_COLS,
    rows: BAKE_ROWS,
    cellW: SHEET_CELL_W,
    cellH: SHEET_CELL_H,
    inset: SPRITE_INSET,
    count: cells.length,
    cells,
  };
  fs.writeFileSync(outManifest, JSON.stringify(manifest, null, 2), "utf8");

  const sizeKb = (fs.statSync(outWebp).size / 1024).toFixed(1);
  console.log(`Baked ${cells.length} peeps -> ${outWebp} (${atlasW}x${atlasH}, ${sizeKb} KB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
