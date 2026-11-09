#!/usr/bin/env node
/**
 * High-fidelity food icon cutout (no vectorizing, no palette quantization).
 * Why: VTracer at 192px/44 colours produced grainy icons, and grey-shadow
 * thresholds ate light food (whipped cream, glass). This keeps every pixel of
 * the render and only removes background connected to the image border.
 *
 * Usage: node scripts/cutout-food-icon.mjs <input> <name> [tolerance=26] [size=512]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [inputArg, name, tolArg, sizeArg] = process.argv.slice(2);
if (!inputArg || !name) {
  console.log('Usage: node scripts/cutout-food-icon.mjs <input> <name> [tolerance] [size]');
  process.exit(1);
}
const TOL = tolArg ? parseFloat(tolArg) : 26;
const SIZE = sizeArg ? parseInt(sizeArg, 10) : 512;

const { data, info } = await sharp(path.resolve(inputArg)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const w = info.width;
const h = info.height;

// Background colour = average of the four corner patches.
let br = 0, bg = 0, bb = 0, n = 0;
for (const [cx, cy] of [[0, 0], [w - 12, 0], [0, h - 12], [w - 12, h - 12]]) {
  for (let y = cy; y < cy + 12; y++) for (let x = cx; x < cx + 12; x++) {
    const i = (y * w + x) * 4;
    br += data[i]; bg += data[i + 1]; bb += data[i + 2]; n++;
  }
}
br /= n; bg /= n; bb /= n;

const dist = (i) => Math.max(Math.abs(data[i] - br), Math.abs(data[i + 1] - bg), Math.abs(data[i + 2] - bb));

const bgMask = new Uint8Array(w * h);
const stack = [];
const tryPush = (x, y) => {
  const p = y * w + x;
  if (!bgMask[p] && dist(p * 4) <= TOL) { bgMask[p] = 1; stack.push(p); }
};
for (let x = 0; x < w; x++) { tryPush(x, 0); tryPush(x, h - 1); }
for (let y = 0; y < h; y++) { tryPush(0, y); tryPush(w - 1, y); }
const flood = () => {
  while (stack.length) {
    const p = stack.pop();
    const x = p % w, y = (p - x) / w;
    if (x > 0) tryPush(x - 1, y);
    if (x < w - 1) tryPush(x + 1, y);
    if (y > 0) tryPush(x, y - 1);
    if (y < h - 1) tryPush(x, y + 1);
  }
};
flood();

// Pass 2: soft contact shadows are light AND colourless; food edges carry colour, so a
// neutral-only test removes the shadow without eating cream, glass or sesame.
const isShadow = (i) => {
  const r = data[i], g = data[i + 1], b = data[i + 2];
  return Math.min(r, g, b) > 172 && Math.max(r, g, b) - Math.min(r, g, b) <= 17;
};
for (let p = 0; p < w * h; p++) {
  if (bgMask[p]) {
    const x = p % w, y = (p - x) / w;
    for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1]) {
      if (q >= 0 && !bgMask[q] && isShadow(q * 4)) { bgMask[q] = 1; stack.push(q); }
    }
  }
}
const floodShadow = () => {
  while (stack.length) {
    const p = stack.pop();
    const x = p % w, y = (p - x) / w;
    for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1]) {
      if (q >= 0 && !bgMask[q] && isShadow(q * 4)) { bgMask[q] = 1; stack.push(q); }
    }
  }
};
floodShadow();

// Enclosed background (mug handle hole, gap under a bun) is not border-connected: clear any
// background-coloured region big enough to be a hole rather than a highlight.
{
  const seen = new Uint8Array(w * h);
  for (let s = 0; s < w * h; s++) {
    if (bgMask[s] || seen[s] || dist(s * 4) > TOL) continue;
    const comp = [s];
    seen[s] = 1;
    for (let k = 0; k < comp.length; k++) {
      const p = comp[k];
      const x = p % w, y = (p - x) / w;
      for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1]) {
        if (q >= 0 && !bgMask[q] && !seen[q] && dist(q * 4) <= TOL) { seen[q] = 1; comp.push(q); }
      }
    }
    if (comp.length > w * h * 0.004) for (const p of comp) bgMask[p] = 1;
  }
}

// Drop detached specks/blobs (floating shadow remnants) smaller than 4% of the main subject.
const label = new Int32Array(w * h);
const sizes = [0];
for (let s = 0; s < w * h; s++) {
  if (bgMask[s] || label[s]) continue;
  const id = sizes.length;
  let count = 0;
  const st = [s];
  label[s] = id;
  while (st.length) {
    const p = st.pop();
    count++;
    const x = p % w, y = (p - x) / w;
    for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1]) {
      if (q >= 0 && !bgMask[q] && !label[q]) { label[q] = id; st.push(q); }
    }
  }
  sizes.push(count);
}
const biggest = Math.max(...sizes);
for (let p = 0; p < w * h; p++) {
  if (!bgMask[p] && sizes[label[p]] < biggest * 0.04) bgMask[p] = 1;
}

// Soft edge: object pixels touching background fade by colour distance so no white halo remains.
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
  const p = y * w + x;
  const i = p * 4;
  if (bgMask[p]) { data[i + 3] = 0; continue; }
  const touches =
    (x > 0 && bgMask[p - 1]) || (x < w - 1 && bgMask[p + 1]) ||
    (y > 0 && bgMask[p - w]) || (y < h - 1 && bgMask[p + w]);
  if (touches) {
    const d = dist(i);
    data[i + 3] = Math.max(0, Math.min(255, Math.round(((d - TOL * 0.4) / (TOL * 2.2)) * 255)));
  }
}

const cut = await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
const trimmed = await sharp(cut).trim({ threshold: 8 }).toBuffer();
const tm = await sharp(trimmed).metadata();
const inner = Math.round(SIZE * 0.92);
const fitted = await sharp(trimmed)
  .resize(inner, inner, { fit: 'inside', kernel: 'lanczos3', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .toBuffer();

const out = path.join(rootDir, 'public', 'icons', 'food', `${name}.webp`);
const webp = await sharp(fitted)
  .extend({
    top: Math.floor((SIZE - (await sharp(fitted).metadata()).height) / 2),
    bottom: Math.ceil((SIZE - (await sharp(fitted).metadata()).height) / 2),
    left: Math.floor((SIZE - (await sharp(fitted).metadata()).width) / 2),
    right: Math.ceil((SIZE - (await sharp(fitted).metadata()).width) / 2),
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .webp({ quality: 92, alphaQuality: 100, effort: 6 })
  .toBuffer();
fs.writeFileSync(out, webp);
console.log(`ok ${name}: crop ${tm.width}x${tm.height} -> ${SIZE}px webp ${(webp.length / 1024).toFixed(1)} KB (bg ${Math.round(br)},${Math.round(bg)},${Math.round(bb)})`);
