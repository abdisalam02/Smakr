/**
 * prepare-filter-icon.mjs — turn a dual-reference generated icon (or any
 * raw image) into a production-ready sketchbook filter icon.
 *
 * Usage (from frontend/):
 *   node scripts/prepare-filter-icon.mjs <input name or path> [--out <path>] [--force]
 *   node scripts/prepare-filter-icon.mjs my_cake.png
 *   node scripts/prepare-filter-icon.mjs "public/filters/gelato.jpg" --out C:/tmp/test.webp
 *
 * What it does:
 *   1. Border-seeded BFS flood-fill: strips outer near-white background
 *      (lum > 246 && sat < 0.06) starting ONLY from the 4 canvas edges.
 *      Internal raw-white paper gaps inside the artwork stay 100% opaque.
 *   2. 1px anti-aliased edge defringe: dissolves residual white halo.
 *   3. Trims transparent margins, fits the art to 88% of a 192x192 canvas
 *      (6% safe margin each side), writes <= 16 KB WebP to
 *      public/icons/filters/<name>.webp.
 */

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const DIR = "public/icons/filters";
const SIZE = 192;
const FILL = 0.88; // art fills 88% of canvas
const MAX_BYTES = 16 * 1024;

const CATS = [
  "pastries_bakery", "breads", "coffee_tea", "noodles_soup", "dumplings_buns",
  "sandwiches_handhelds", "pizza_pasta", "chicken_grill", "rice_bowls",
  "seafood", "sweets_frozen", "drinks_bars", "brunch",
];

const argv = process.argv.slice(2);
const outFlag = argv.indexOf("--out");
const force = argv.includes("--force");
const posArgs = argv.filter((a, i) => !a.startsWith("--") && (outFlag < 0 || i !== outFlag + 1));
const inputArg = posArgs[0];
const nameArg = posArgs[1];
if (!inputArg) {
  console.error("usage: node scripts/prepare-filter-icon.mjs <input image> [category-name] [--out <path>] [--force]");
  process.exit(1);
}

// Resolve the input from a few sensible places.
const exts = ["", ".png", ".jpg", ".jpeg", ".webp", ".avif"];
const bases = [
  inputArg,
  path.join(DIR, inputArg),
  path.join(DIR, "incoming", inputArg),
  path.join("public", inputArg),
  path.join("public", "filters", inputArg),
  path.join("public", "food-svgs", inputArg),
];
let input = null;
for (const b of bases) {
  for (const e of exts) {
    if (fs.existsSync(b + e) && fs.statSync(b + e).isFile()) {
      input = b + e;
      break;
    }
  }
  if (input) break;
}
if (!input) {
  console.error(`input not found: ${inputArg} (tried filters/, public/, public/filters/)`);
  process.exit(1);
}

const rawName = path.basename(input).replace(/\.[^.]+$/, "").replace(/_raw$/i, "");
const name = nameArg ? nameArg.replace(/\.webp$/i, "") : rawName;
const outPath =
  outFlag >= 0
    ? argv[outFlag + 1]
    : nameArg && (nameArg.includes("/") || nameArg.includes("\\") || nameArg.endsWith(".webp"))
      ? nameArg
      : path.join(DIR, `${name}.webp`);
if (
  outFlag < 0 &&
  CATS.includes(name) &&
  fs.existsSync(outPath) &&
  !force
) {
  console.error(
    `${outPath} is one of the 13 deployed icons. Pass --force to replace it, or --out to write elsewhere.`
  );
  process.exit(1);
}

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

async function main() {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;
  const N = W * H;

  // ── 1. border-seeded BFS flood-fill of the outer white background ─────────
  // Adaptive threshold: sample the 4 border edges and strip pixels close to
  // their median color (handles cream paper backgrounds, not just #FFFFFF).
  let bgLum = 246;
  let bgSat = 0.06;
  {
    const lums = [];
    const sats = [];
    const step = Math.max(1, Math.floor(Math.max(W, H) / 120));
    const sample = (i) => {
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      lums.push(0.299 * r + 0.587 * g + 0.114 * b);
      const max = Math.max(r, g, b);
      sats.push(max === 0 ? 0 : (max - Math.min(r, g, b)) / max);
    };
    for (let x = 0; x < W; x += step) {
      sample(x);
      sample((H - 1) * W + x);
    }
    for (let y = 0; y < H; y += step) {
      sample(y * W);
      sample(y * W + W - 1);
    }
    lums.sort((a, b) => a - b);
    sats.sort((a, b) => a - b);
    const medLum = lums[lums.length >> 1];
    const medSat = sats[sats.length >> 1];
    if (medLum > 200 && medSat < 0.12) {
      bgLum = Math.min(246, medLum - 12);
      bgSat = Math.max(0.06, medSat + 0.04);
    }
  }

  const removed = new Uint8Array(N);
  const queue = new Int32Array(N);
  let head = 0;
  let tail = 0;
  const push = (i) => {
    removed[i] = 1;
    queue[tail++] = i;
  };
  const nearWhite = (i) => {
    const a = data[i * 4 + 3];
    if (a < 8) return true; // already transparent counts as background
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const max = Math.max(r, g, b);
    const sat = max === 0 ? 0 : (max - Math.min(r, g, b)) / max;
    return lum > bgLum && sat < bgSat;
  };
  // seed ONLY the 4 outer border edges
  for (let x = 0; x < W; x++) {
    for (const y of [0, H - 1]) if (nearWhite(y * W + x) && !removed[y * W + x]) push(y * W + x);
  }
  for (let y = 0; y < H; y++) {
    for (const x of [0, W - 1]) if (nearWhite(y * W + x) && !removed[y * W + x]) push(y * W + x);
  }
  // breadth-first expand, 8-connectivity (won't leak through diagonal pinholes
  // into enclosed internal paper gaps)
  while (head < tail) {
    const i = queue[head++];
    const x = i % W;
    const y = (i / W) | 0;
    for (let dy = -1; dy <= 1; dy++) {
      const ny = y + dy;
      if (ny < 0 || ny >= H) continue;
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx;
        if (nx < 0 || nx >= W) continue;
        const j = ny * W + nx;
        if (!removed[j] && nearWhite(j)) push(j);
      }
    }
  }

  // ── 2. 1px anti-aliased edge defringe ──────────────────────────────────────
  // a) one ring: opaque pixels touching the stripped zone that are still
  //    near-white (sub-threshold JPEG halo) go fully transparent
  const snap = Uint8Array.from(removed);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (snap[i] || data[i * 4 + 3] < 8) continue;
      let touches = false;
      for (let dy = -1; dy <= 1 && !touches; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= H) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= W) continue;
          if (snap[ny * W + nx]) {
            touches = true;
            break;
          }
        }
      }
      if (!touches) continue;
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const max = Math.max(r, g, b);
      const sat = max === 0 ? 0 : (max - Math.min(r, g, b)) / max;
      if (lum > bgLum - 14 && sat < bgSat + 0.02) removed[i] = 1;
    }
  }
  // b) softening: pixels left beside the cut get alpha scaled by the share of
  //    their 8-neighbours that survived — a smooth AA edge, not a staircase
  const alphaSnap = new Uint8Array(N);
  for (let i = 0; i < N; i++) alphaSnap[i] = !removed[i] && data[i * 4 + 3] >= 8 ? 1 : 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (!alphaSnap[i]) {
        data[i * 4 + 3] = 0;
        continue;
      }
      let alive = 0;
      let total = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= H) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= W || (dx === 0 && dy === 0)) continue;
          total++;
          if (alphaSnap[ny * W + nx]) alive++;
        }
      }
      if (alive < total) {
        const keep = 0.35 + 0.65 * (alive / total);
        data[i * 4 + 3] = Math.round(data[i * 4 + 3] * keep);
      }
    }
  }

  // ── 3. trim transparent margins ────────────────────────────────────────────
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (data[(y * W + x) * 4 + 3] >= 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < x0) throw new Error("everything was stripped — the image is pure background?");
  const bw = x1 - x0 + 1;
  const bh = y1 - y0 + 1;

  // fit the cluster to 88% of the 192 canvas, centred (6% margin each side)
  const s = (FILL * SIZE) / Math.max(bw, bh);
  const tw = Math.max(1, Math.round(bw * s));
  const th = Math.max(1, Math.round(bh * s));
  const ox = Math.round((SIZE - tw) / 2);
  const oy = Math.round((SIZE - th) / 2);

  const cut = await sharp(data, { raw: { width: W, height: H, channels: 4 } })
    .extract({ left: x0, top: y0, width: bw, height: bh })
    .resize(tw, th, { kernel: "lanczos3" })
    .png()
    .toBuffer();

  const canvas = await sharp({
    create: { width: SIZE, height: SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: cut, top: oy, left: ox }])
    .png()
    .toBuffer();

  // encode under budget
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  let buf = null;
  let quality = 90;
  for (; quality >= 55; quality -= 6) {
    buf = await sharp(canvas)
      .webp({ quality, alphaQuality: Math.min(quality + 2, 92), effort: 6 })
      .toBuffer();
    if (buf.length <= MAX_BYTES) break;
  }
  if (!buf) throw new Error("encoding failed");
  if (buf.length > MAX_BYTES)
    console.warn(`warning: ${(buf.length / 1024).toFixed(1)} KB exceeds the 16 KB budget`);
  fs.writeFileSync(outPath, buf);

  const stripped = removed.reduce((a, v) => a + v, 0);
  console.log(
    `wrote ${outPath} ${SIZE}x${SIZE} ${(buf.length / 1024).toFixed(1)} KB q${quality} | ` +
      `src ${W}x${H} trim ${bw}x${bh} -> ${tw}x${th} centred | bg ${(100 * stripped) / N | 0}%`
  );
}

main().catch((e) => {
  console.error(e.message || e);
  process.exitCode = 1;
});
