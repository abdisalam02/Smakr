/**
 * filter-contact-sheet.mjs — master proof sheet for the 13 filter icons.
 *
 * Renders every deployed public/icons/filters/*.webp at 192 / 44 (drawer
 * tile) / 20 (top pill) px on warm paper, plus a section for the raw
 * reference photos found in public/filters/.
 *
 * Usage (from frontend/):
 *   node scripts/filter-contact-sheet.mjs
 *
 * Output:
 *   public/icons/filters/contact-sheet.png
 */

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const DIR = "public/icons/filters";
const REF_DIR = "public/filters";
const OUT = path.join(DIR, "contact-sheet.png");
const STYLE_REF = "inspo-for-style.jpg";

const CATS = [
  "pastries_bakery", "breads", "coffee_tea", "noodles_soup", "dumplings_buns",
  "sandwiches_handhelds", "pizza_pasta", "chicken_grill", "rice_bowls",
  "seafood", "sweets_frozen", "drinks_bars", "brunch",
];

const PAPER = "#FAF7F2";
const INK = "#6B6459";
const ACCENT = "#E84A27";
const PAD = 24;
const COLS = 4;
const CELL = 192;
const COLW = 250;
const ROWH = CELL + 26;

const text = (str, x, y, { size = 13, color = INK, weight = 700, spacing = 1.2, w = 240 } = {}) => ({
  input: Buffer.from(
    `<svg width="${w}" height="${size + 8}" xmlns="http://www.w3.org/2000/svg"><text x="0" y="${size}" font-family="Arial, Helvetica, sans-serif" font-size="${size}" font-weight="${weight}" letter-spacing="${spacing}" fill="${color}">${str}</text></svg>`
  ),
  top: y,
  left: x,
});

async function meta(file) {
  try {
    const m = await sharp(file).metadata();
    return `${m.width}x${m.height} ${(fs.statSync(file).size / 1024).toFixed(1)}KB`;
  } catch {
    return "unreadable";
  }
}

async function main() {
  // collect deployed icons
  const icons = [];
  for (const c of CATS) {
    const f = path.join(DIR, `${c}.webp`);
    if (fs.existsSync(f)) icons.push({ name: c, file: f, deployed: true });
    else icons.push({ name: c, file: null, deployed: false });
  }

  // collect raw reference photos (skip the style ref and non-images)
  const refs = [];
  if (fs.existsSync(REF_DIR)) {
    for (const e of fs.readdirSync(REF_DIR)) {
      if (e === STYLE_REF || !/\.(png|jpe?g|webp|avif)$/i.test(e)) continue;
      refs.push({ name: e, file: path.join(REF_DIR, e) });
    }
  }

  const sheetW = PAD + COLS * COLW;
  const titleRow = 40;
  const iconBlock = Math.ceil(icons.length / COLS) * ROWH + 30;
  const stripBlock = 2 * (52 + 40) + 20; // 44px + 20px ladder rows with headers
  const refCols = 6;
  const refBlock = refs.length
    ? 34 + Math.ceil(refs.length / refCols) * (140 + 30) + PAD
    : 0;
  const styleRefBlock = 34 + 200 + PAD;
  const sheetH = titleRow + iconBlock + stripBlock + styleRefBlock + refBlock + PAD;

  const bg = await sharp({
    create: { width: sheetW, height: sheetH, channels: 4, background: PAPER },
  })
    .png()
    .toBuffer();

  const comps = [text("SMAKR FILTER ICON SET — 13 CATEGORIES", PAD, 12, { size: 16, color: ACCENT })];

  // ── 192px grid ──────────────────────────────────────────────────────────────
  let y = titleRow;
  for (let i = 0; i < icons.length; i++) {
    const ic = icons[i];
    const x = PAD + (i % COLS) * COLW;
    const ry = y + Math.floor(i / COLS) * ROWH;
    if (ic.file) {
      const img = await sharp(ic.file)
        .resize(CELL, CELL, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
      comps.push({ input: img, top: ry, left: x });
      comps.push(text(ic.name, x, ry + CELL + 4, { size: 12 }));
      comps.push(text(await meta(ic.file), x, ry + CELL + 20, { size: 10, weight: 400 }));
    } else {
      comps.push(text(`${ic.name} — MISSING`, x, ry + CELL / 2, { size: 12, color: ACCENT }));
    }
  }

  // ── size ladders: 44px drawer tiles, 20px top pills ────────────────────────
  y += Math.ceil(icons.length / COLS) * ROWH + 30;
  comps.push(text("44px — drawer tiles", PAD, y, { size: 12, color: ACCENT }));
  y += 22;
  {
    let x = PAD;
    for (const ic of icons) {
      if (!ic.file) continue;
      const img = await sharp(ic.file)
        .resize(44, 44, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
      comps.push({ input: img, top: y, left: x });
      x += 60;
    }
  }
  y += 52;
  comps.push(text("20px — top pills", PAD, y, { size: 12, color: ACCENT }));
  y += 22;
  {
    let x = PAD;
    for (const ic of icons) {
      if (!ic.file) continue;
      const img = await sharp(ic.file)
        .resize(20, 20, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
      comps.push({ input: img, top: y, left: x });
      x += 36;
    }
  }
  y += 52;

  // ── style lock reference ───────────────────────────────────────────────────
  const styleFile = path.join(REF_DIR, STYLE_REF);
  if (fs.existsSync(styleFile)) {
    comps.push(
      text("STYLE LOCK — public/filters/inspo-for-style.jpg", PAD, y, { size: 12, color: ACCENT, w: 700 })
    );
    const img = await sharp(styleFile)
      .resize(240, 160, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    comps.push({ input: img, top: y + 22, left: PAD });
    y += 22 + 168 + PAD;
  }

  // ── raw subject reference photos ──────────────────────────────────────────
  if (refs.length) {
    comps.push(
      text(
        `RAW SUBJECT REFERENCES IN public/filters/ (${refs.length} found)`,
        PAD,
        y,
        { size: 12, color: ACCENT, w: 700 }
      )
    );
    y += 24;
    const refW = Math.floor((sheetW - 2 * PAD - (refCols - 1) * 16) / refCols);
    for (let i = 0; i < refs.length; i++) {
      const r = refs[i];
      const x = Math.round(PAD + (i % refCols) * (refW + 16));
      const ry = Math.round(y + Math.floor(i / refCols) * (140 + 30));
      const img = await sharp(r.file)
        .resize(Math.round(refW), 120, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
      comps.push({ input: img, top: ry, left: x });
      comps.push(text(r.name.slice(0, 30), x, ry + 122, { size: 10, weight: 400 }));
      comps.push(text(await meta(r.file), x, ry + 136, { size: 9, weight: 400, color: "#9A938A" }));
    }
  }

  await sharp(bg).composite(comps).png().toFile(OUT);
  console.log(`wrote ${OUT}`);
  console.log(`deployed icons: ${icons.filter((i) => i.file).length}/13 | raw refs: ${refs.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
