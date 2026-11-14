import type { CSSProperties } from "react";

/**
 * bustCrowdPeep.ts — authentic Open Peeps 15×7 sprite-sheet crowd.
 *
 * Zero DiceBear. Zero SVG surgery. The crowd is sliced straight out of Pablo
 * Stanley's official 105-character Open Peeps sheet and colorized pixel-by-
 * pixel on an offscreen canvas, so every bust keeps its real hands, phones,
 * knives, pointing fingers, hijabs, turbans and expressions.
 *
 * Color modes:
 *   "ink-paper"       1:1 Skiper 39 classic — cream paper + charcoal ink.
 *   "colorized"       island-aware skin + garment colouring; props stay paper.
 *   "duotone-accent"  80% ink crowd, 20% paprika / sun-yellow jackets.
 */

export const PEEPS_SHEET_SRC = "/images/peeps/open-peeps-sheet.png";
export const SHEET_COLS = 15;
export const SHEET_ROWS = 7;
export const SHEET_COUNT = SHEET_COLS * SHEET_ROWS; // 105
export const SHEET_CELL_W = 240;
export const SHEET_CELL_H = 324;
/** 240 / 324 — every cell is drawn at this aspect ratio (never squashed). */
export const PEEP_ASPECT = SHEET_CELL_W / SHEET_CELL_H;
/** 2px source inset so neighbour cells can never bleed a 1px line. */
export const SPRITE_INSET = 2;

export type PeepColorMode = "ink-paper" | "colorized" | "duotone-accent";

export const COLOR_MODE_OPTIONS: {
  value: PeepColorMode;
  label: string;
  short: string;
}[] = [
  { value: "colorized", label: "🎨 Colorized", short: "Colorized" },
  { value: "ink-paper", label: "✒️ 1:1 Skiper Ink", short: "Skiper Ink" },
  { value: "duotone-accent", label: "🔥 Paprika Accent", short: "Paprika" },
];

export const INK_HEX = "#181615";
export const PAPER_HEX = "#FAF7F2";

type RGB = [number, number, number];

const INK: RGB = [0x18, 0x16, 0x15];
const PAPER: RGB = [0xfa, 0xf7, 0xf2];
const WHITE: RGB = [255, 255, 255];
const ACCENT_PAPRIKA: RGB = [0xe8, 0x4a, 0x27];
const ACCENT_SUN: RGB = [0xfd, 0xea, 0x6b];

const SKIN_PALETTE_HEX = ["FFDBB4", "EDB98A", "D08B5B", "AE5D29", "694D3D", "3B2219"] as const;
const CLOTHING_PALETTE_HEX = [
  "E84A27",
  "E78276",
  "FDEA6B",
  "78E185",
  "9DDADB",
  "8FA7DF",
  "E279C7",
  "F4A261",
  "262E33",
] as const;

const HAIR_PALETTE_HEX = [
  "3D271E",
  "7D4B2B",
  "C66538",
  "E5BA63",
  "B5AFA8",
  "2B2A2C",
] as const;

function hexToRgb(hex: string): RGB {
  return [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
  ];
}

const SKIN_RGB = SKIN_PALETTE_HEX.map(hexToRgb);
const CLOTHING_RGB = CLOTHING_PALETTE_HEX.map(hexToRgb);
const HAIR_RGB = HAIR_PALETTE_HEX.map(hexToRgb);

function rgbDist(a: RGB, b: RGB): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/* ------------------------------------------------------------------ */
/* Deterministic PRNG                                                 */
/* ------------------------------------------------------------------ */

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable palette per sprite index — a peep always gets the same colours. */
function paletteFor(spriteIdx: number) {
  const rand = mulberry32(spriteIdx * 7919 + 104729);
  const skin = SKIN_RGB[Math.floor(rand() * SKIN_RGB.length)];
  const cloth = CLOTHING_RGB[Math.floor(rand() * CLOTHING_RGB.length)];
  const hairBase = Math.floor(rand() * HAIR_RGB.length);
  let hair = HAIR_RGB[hairBase];
  let bestScore = -1;
  // Pick a hair tone with clear contrast against both skin and garment.
  for (let k = 0; k < HAIR_RGB.length; k++) {
    const candidate = HAIR_RGB[(hairBase + k) % HAIR_RGB.length];
    const score = Math.min(rgbDist(candidate, skin), rgbDist(candidate, cloth));
    if (rgbDist(candidate, skin) >= 75 && rgbDist(candidate, cloth) >= 48) {
      hair = candidate;
      break;
    }
    if (score > bestScore) {
      bestScore = score;
      hair = candidate;
    }
  }
  return { skin, cloth, hair };
}

/* ------------------------------------------------------------------ */
/* Sheet loading                                                      */
/* ------------------------------------------------------------------ */

let sheetPromise: Promise<HTMLImageElement> | null = null;

/** Load + cache the 105-character Open Peeps sheet (same-origin). */
export function loadPeepsSheet(): Promise<HTMLImageElement> {
  if (!sheetPromise) {
    sheetPromise = new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => resolve(img);
      img.onerror = () => {
        sheetPromise = null;
        reject(new Error(`Failed to load Open Peeps sheet: ${PEEPS_SHEET_SRC}`));
      };
      img.src = PEEPS_SHEET_SRC;
    });
  }
  return sheetPromise;
}

/* ------------------------------------------------------------------ */
/* Pixel colorizer                                                    */
/* ------------------------------------------------------------------ */

interface IslandStat {
  id: number;
  pixels: number[];
  n: number;
  cy: number;
  top: number;
  bot: number;
  bw: number;
  bh: number;
  ar: number;
  fill: number;
  /** Median distance (px) from the island to transparent background. */
  depth: number;
}

interface CellClassification {
  labels: Int16Array;
  palette: RGB[];
  clothLabel: number;
}

function isWhiteish(d: Uint8ClampedArray, i: number): boolean {
  const p = i * 4;
  return d[p + 3] > 200 && d[p] > 235 && d[p + 1] > 235 && d[p + 2] > 235;
}

function isEdgeGray(d: Uint8ClampedArray, i: number): boolean {
  const p = i * 4;
  if (d[p + 3] <= 60) return false;
  const v = (d[p] + d[p + 1] + d[p + 2]) / 3;
  return v > 85 && v <= 235;
}

type LineSegment = readonly [number, number, number, number];

// Virtual contour seals split unclosed hair/face or shearling/neck ink gaps
// during island discovery without mutating the underlying stroke pixels.
const SEAL_SEGMENTS: Record<number, readonly LineSegment[]> = {
  0: [[115, 79, 163, 79]],
  9: [
    [89, 88, 106, 88],
    [107, 87, 117, 84],
    [117, 84, 132, 81],
    [131, 80, 164, 80],
  ],
  56: [
    [89, 88, 106, 88],
    [107, 87, 117, 84],
    [117, 84, 132, 81],
    [131, 80, 164, 80],
  ],
  47: [[114, 75, 162, 76]],
  48: [
    [102, 65, 119, 59],
    [119, 59, 134, 57],
  ],
  82: [
    [102, 65, 119, 59],
    [119, 59, 134, 57],
  ],
  23: [[113, 139, 130, 140]],
  80: [[113, 139, 130, 140]],
  95: [[113, 139, 130, 140]],
};

const COFFEE_MUG_CELLS = new Set([35, 38, 59, 79]);
const BOLT_TEE_CELLS = new Set([68, 89]);

/** Clear small opaque neighbor-cell slivers protruding from left/right margins. */
function stripEdgeSlivers(d: Uint8ClampedArray, w: number, h: number): void {
  const N = w * h;
  const visited = new Uint8Array(N);
  const stack = new Int32Array(N);

  for (const isLeft of [true, false]) {
    const edgeCols = isLeft ? [0, 1, 2, 3] : [w - 1, w - 2, w - 3, w - 4];
    for (const bx of edgeCols) {
      if (bx < 0 || bx >= w) continue;
      for (let y = 0; y < h - 8; y++) {
        const start = y * w + bx;
        if (visited[start] || d[start * 4 + 3] <= 8) continue;

        let sp = 0;
        let minX = w;
        let maxX = -1;
        const comp: number[] = [];
        stack[sp++] = start;
        visited[start] = 1;

        while (sp > 0) {
          const p = stack[--sp];
          comp.push(p);
          const x = p % w;
          const py = (p / w) | 0;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;

          if (x > 0 && !visited[p - 1] && d[(p - 1) * 4 + 3] > 8) {
            visited[p - 1] = 1;
            stack[sp++] = p - 1;
          }
          if (x < w - 1 && !visited[p + 1] && d[(p + 1) * 4 + 3] > 8) {
            visited[p + 1] = 1;
            stack[sp++] = p + 1;
          }
          if (py > 0 && !visited[p - w] && d[(p - w) * 4 + 3] > 8) {
            visited[p - w] = 1;
            stack[sp++] = p - w;
          }
          if (py < h - 1 && !visited[p + w] && d[(p + w) * 4 + 3] > 8) {
            visited[p + w] = 1;
            stack[sp++] = p + w;
          }
        }

        const nearEdgeOnly = isLeft ? maxX < 28 : minX > w - 29;
        if (nearEdgeOnly && comp.length < 800) {
          for (const p of comp) {
            const q = p * 4;
            d[q] = 0;
            d[q + 1] = 0;
            d[q + 2] = 0;
            d[q + 3] = 0;
          }
        }
      }
    }
  }
}

/** Fill enclosed transparent chest props (coffee mugs, lightning bolts) white. */
function fillPropTransparentHoles(
  d: Uint8ClampedArray,
  w: number,
  h: number,
  spriteIdx: number
): void {
  const isMugSprite = COFFEE_MUG_CELLS.has(spriteIdx);
  const isBoltSprite = BOLT_TEE_CELLS.has(spriteIdx);
  if (!isMugSprite && !isBoltSprite) return;

  const N = w * h;
  const exterior = new Uint8Array(N);
  const queue = new Int32Array(N);
  let qh = 0;
  let qt = 0;

  for (let x = 0; x < w; x++) {
    if (d[x * 4 + 3] <= 16) {
      exterior[x] = 1;
      queue[qt++] = x;
    }
  }
  for (let y = 0; y < h; y++) {
    const l = y * w;
    const r = y * w + w - 1;
    if (d[l * 4 + 3] <= 16 && !exterior[l]) {
      exterior[l] = 1;
      queue[qt++] = l;
    }
    if (d[r * 4 + 3] <= 16 && !exterior[r]) {
      exterior[r] = 1;
      queue[qt++] = r;
    }
  }
  while (qh < qt) {
    const p = queue[qh++];
    const x = p % w;
    if (x > 0 && !exterior[p - 1] && d[(p - 1) * 4 + 3] <= 16) {
      exterior[p - 1] = 1;
      queue[qt++] = p - 1;
    }
    if (x < w - 1 && !exterior[p + 1] && d[(p + 1) * 4 + 3] <= 16) {
      exterior[p + 1] = 1;
      queue[qt++] = p + 1;
    }
    if (p - w >= 0 && !exterior[p - w] && d[(p - w) * 4 + 3] <= 16) {
      exterior[p - w] = 1;
      queue[qt++] = p - w;
    }
    if (p + w < N && !exterior[p + w] && d[(p + w) * 4 + 3] <= 16) {
      exterior[p + w] = 1;
      queue[qt++] = p + w;
    }
  }

  const visited = new Uint8Array(N);
  const stack = new Int32Array(N);
  for (let i = 0; i < N; i++) {
    if (exterior[i] || visited[i] || d[i * 4 + 3] > 16) {
      visited[i] = 1;
      continue;
    }
    let sp = 0;
    let sx = 0;
    let sy = 0;
    const pixels: number[] = [];
    stack[sp++] = i;
    visited[i] = 1;

    while (sp > 0) {
      const p = stack[--sp];
      pixels.push(p);
      const x = p % w;
      sx += x;
      sy += (p / w) | 0;
      if (x > 0 && !exterior[p - 1] && !visited[p - 1] && d[(p - 1) * 4 + 3] <= 16) {
        visited[p - 1] = 1;
        stack[sp++] = p - 1;
      }
      if (x < w - 1 && !exterior[p + 1] && !visited[p + 1] && d[(p + 1) * 4 + 3] <= 16) {
        visited[p + 1] = 1;
        stack[sp++] = p + 1;
      }
      if (p - w >= 0 && !exterior[p - w] && !visited[p - w] && d[(p - w) * 4 + 3] <= 16) {
        visited[p - w] = 1;
        stack[sp++] = p - w;
      }
      if (p + w < N && !exterior[p + w] && !visited[p + w] && d[(p + w) * 4 + 3] <= 16) {
        visited[p + w] = 1;
        stack[sp++] = p + w;
      }
    }

    const cx = sx / pixels.length / w;
    const cy = sy / pixels.length / h;
    const isMug = isMugSprite && pixels.length > 200 && cx >= 0.56 && cx <= 0.74 && cy >= 0.6 && cy <= 0.76;
    const isBolt = isBoltSprite && pixels.length > 200 && cx >= 0.46 && cx <= 0.64 && cy >= 0.54 && cy <= 0.74;
    if (isMug || isBolt) {
      for (const p of pixels) {
        const q = p * 4;
        d[q] = 255;
        d[q + 1] = 255;
        d[q + 2] = 255;
        d[q + 3] = 255;
      }
      // Harden semi-transparent rim against white paper so no cream fringe survives.
      for (const p of pixels) {
        const x = p % w;
        const neighbors = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, p - w, p + w];
        for (const np of neighbors) {
          if (np >= 0 && np < N && d[np * 4 + 3] > 16 && d[np * 4 + 3] < 245) {
            d[np * 4 + 3] = 255;
          }
        }
      }
    }
  }
}

/** Clean sheet bleeding and transparent chest props consistently in all color modes. */
function preprocessCell(
  d: Uint8ClampedArray,
  w: number,
  h: number,
  spriteIdx: number
): void {
  stripEdgeSlivers(d, w, h);
  fillPropTransparentHoles(d, w, h, spriteIdx);
}

/** Build a 4-connected 1px virtual contour barrier over open white regions. */
function buildSealBarrier(
  d: Uint8ClampedArray,
  w: number,
  h: number,
  spriteIdx: number
): Uint8Array {
  const barrier = new Uint8Array(w * h);
  const segs = SEAL_SEGMENTS[spriteIdx];
  if (!segs) return barrier;

  const scaleX = w / SHEET_CELL_W;
  const scaleY = h / SHEET_CELL_H;

  for (const [rx0, ry0, rx1, ry1] of segs) {
    const x0 = rx0 * scaleX;
    const y0 = ry0 * scaleY;
    const x1 = rx1 * scaleX;
    const y1 = ry1 * scaleY;
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2 + 1;
    let pxPrev = Math.round(x0);
    let pyPrev = Math.round(y0);

    for (let s = 0; s <= steps; s++) {
      const fx = Math.round(x0 + ((x1 - x0) * s) / steps);
      const fy = Math.round(y0 + ((y1 - y0) * s) / steps);
      if (fy >= 0 && fy < h && fx >= 0 && fx < w) {
        if (isWhiteish(d, fy * w + fx)) barrier[fy * w + fx] = 1;
        if (fx !== pxPrev && fy !== pyPrev && pyPrev >= 0 && pxPrev >= 0 && pxPrev < w) {
          if (isWhiteish(d, fy * w + pxPrev)) barrier[fy * w + pxPrev] = 1;
        }
      }
      pxPrev = fx;
      pyPrev = fy;
    }
  }

  return barrier;
}

/** 4-connected flood fill of every interior white island in one cell. */
function findWhiteIslands(
  d: Uint8ClampedArray,
  w: number,
  h: number,
  barrier: Uint8Array
): IslandStat[] {
  const N = w * h;
  // Distance to transparent background — hands/arms sit near the silhouette
  // edge, torso fills sit deep inside it. Multi-source BFS.
  const depth = new Int16Array(N).fill(-1);
  const queue = new Int32Array(N);
  let qh = 0;
  let qt = 0;
  for (let i = 0; i < N; i++) {
    if (d[i * 4 + 3] <= 16) {
      depth[i] = 0;
      queue[qt++] = i;
    }
  }
  while (qh < qt) {
    const p = queue[qh++];
    const x = p % w;
    const nd = depth[p] + 1;
    const left = p - 1;
    const right = p + 1;
    const up = p - w;
    const down = p + w;
    if (x > 0 && depth[left] === -1) {
      depth[left] = nd;
      queue[qt++] = left;
    }
    if (x < w - 1 && depth[right] === -1) {
      depth[right] = nd;
      queue[qt++] = right;
    }
    if (up >= 0 && depth[up] === -1) {
      depth[up] = nd;
      queue[qt++] = up;
    }
    if (down < N && depth[down] === -1) {
      depth[down] = nd;
      queue[qt++] = down;
    }
  }

  const visited = new Uint8Array(N);
  const stack = new Int32Array(N);
  const islands: IslandStat[] = [];

  for (let i = 0; i < N; i++) {
    if (visited[i] || barrier[i] || !isWhiteish(d, i)) {
      visited[i] = 1;
      continue;
    }
    let sp = 0;
    let n = 0;
    let sumY = 0;
    let minX = w;
    let maxX = -1;
    let minY = h;
    let maxY = -1;
    const pixels: number[] = [];

    stack[sp++] = i;
    visited[i] = 1;

    while (sp > 0) {
      const p = stack[--sp];
      pixels.push(p);
      const x = p % w;
      const y = (p / w) | 0;
      n++;
      sumY += y;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;

      const left = p - 1;
      const right = p + 1;
      const up = p - w;
      const down = p + w;

      if (left >= 0 && x > 0 && !visited[left] && !barrier[left] && isWhiteish(d, left)) {
        visited[left] = 1;
        stack[sp++] = left;
      }
      if (right < N && x < w - 1 && !visited[right] && !barrier[right] && isWhiteish(d, right)) {
        visited[right] = 1;
        stack[sp++] = right;
      }
      if (up >= 0 && !visited[up] && !barrier[up] && isWhiteish(d, up)) {
        visited[up] = 1;
        stack[sp++] = up;
      }
      if (down < N && !visited[down] && !barrier[down] && isWhiteish(d, down)) {
        visited[down] = 1;
        stack[sp++] = down;
      }
    }

    const bw = (maxX - minX + 1) / w;
    const bh = (maxY - minY + 1) / h;
    // Exact median silhouette depth via a small histogram (distances are px).
    const hist = new Int32Array(256);
    for (const p of pixels) {
      const dv = depth[p];
      if (dv >= 0 && dv < 256) hist[dv]++;
    }
    let half = n >> 1;
    let depthMedian = 0;
    for (let dv = 0; dv < 256; dv++) {
      half -= hist[dv];
      if (half <= 0) {
        depthMedian = dv;
        break;
      }
    }
    islands.push({
      id: islands.length,
      pixels,
      n,
      cy: sumY / n / h,
      top: minY / h,
      bot: maxY / h,
      bw,
      bh,
      ar: n / N,
      fill: n / ((maxX - minX + 1) * (maxY - minY + 1)),
      depth: depthMedian,
    });
  }

  return islands;
}

type IslandRole = "skin" | "cloth" | "paper" | "hair" | "ink";

/**
 * Manual island corrections for sprites the geometric classifier cannot read:
 * a hand crossing the torso, a hood lining fused to the neck, a face fused
 * into a mass of light hair, etc.
 *
 * Keys are sprite indices; values map island ids (scan order from
 * findWhiteIslands) to roles. Anything not listed keeps the heuristic role.
 * Unlisted islands default to paper, so props (phones, cups, knives, blades)
 * are never tinted by accident.
 */
const SPRITE_OVERRIDES: Record<number, Record<number, IslandRole>> = {
  // Off-shoulder tops, post-seal bob/3-eye hair, eyeballs & forearms:
  0: {
    0: "hair",
    1: "hair",
    2: "skin",
    3: "paper",
    5: "skin",
    6: "paper",
    7: "paper",
    8: "hair",
    9: "skin",
    10: "skin",
    11: "skin",
    13: "skin",
    14: "hair",
    15: "paper",
    24: "skin",
  },
  // Glasses lenses, ear, neck & left hoodie kangaroo pocket:
  1: { 1: "skin", 3: "skin", 6: "skin", 8: "skin", 9: "cloth" },
  // Black cornrows/braids + tank arms + lip:
  2: {
    0: "ink",
    1: "ink",
    4: "ink",
    8: "ink",
    9: "ink",
    10: "ink",
    11: "ink",
    12: "ink",
    16: "skin",
    18: "ink",
    19: "skin",
    20: "ink",
    21: "ink",
    23: "ink",
    24: "skin",
    26: "ink",
    28: "ink",
    29: "ink",
    31: "ink",
    32: "skin",
    33: "skin",
  },
  // Tank tops & coats/collar lapels:
  3: { 0: "skin", 1: "skin", 2: "skin", 6: "skin", 8: "skin" },
  4: { 1: "skin", 2: "skin" },
  5: { 0: "skin", 2: "hair", 3: "hair", 12: "cloth", 13: "cloth" },
  // Phone, ear, neck & hair/collar fixes:
  6: { 4: "skin", 5: "skin", 6: "skin", 8: "skin", 11: "paper", 15: "skin" },
  7: { 0: "hair", 3: "hair", 4: "hair", 13: "cloth" },
  8: { 7: "paper", 10: "skin", 13: "paper" },
  9: { 0: "hair", 2: "hair", 3: "hair", 4: "hair", 23: "paper", 32: "skin" },
  10: { 29: "skin", 30: "skin", 33: "skin", 36: "skin", 40: "skin" },
  11: { 2: "skin", 3: "skin", 7: "paper", 11: "skin" },
  12: { 5: "skin", 6: "skin", 8: "skin", 10: "skin" },
  13: {
    10: "skin",
    11: "skin",
    12: "skin",
    15: "skin",
    16: "skin",
    17: "skin",
    19: "skin",
    37: "skin",
    39: "skin",
    41: "skin",
    42: "cloth",
  },
  14: {
    0: "hair",
    2: "skin",
    3: "skin",
    4: "skin",
    5: "skin",
    6: "skin",
    7: "skin",
    9: "skin",
    10: "skin",
    11: "skin",
    12: "hair",
    14: "skin",
  },
  15: { 12: "skin", 15: "cloth", 16: "skin", 18: "skin", 20: "cloth" },
  17: { 9: "skin", 11: "paper" },
  20: { 1: "cloth" },
  21: { 1: "skin", 3: "skin", 5: "skin" },
  22: { 1: "skin", 2: "skin", 3: "skin", 6: "skin", 7: "cloth" },
  23: { 6: "skin", 8: "paper", 10: "paper", 12: "paper", 13: "skin" },
  24: { 6: "skin", 7: "skin", 17: "cloth" },
  25: { 3: "skin", 4: "skin" },
  26: { 0: "ink", 3: "skin", 4: "skin", 7: "skin", 8: "cloth" },
  27: { 2: "skin", 3: "skin" },
  29: {
    0: "skin",
    1: "hair",
    2: "skin",
    3: "skin",
    4: "skin",
    7: "hair",
    8: "skin",
    9: "hair",
    10: "cloth",
  },
  30: { 2: "ink", 12: "skin", 26: "skin", 29: "skin" },
  31: {
    1: "skin",
    2: "skin",
    4: "skin",
    5: "skin",
    7: "skin",
    8: "skin",
    9: "skin",
    11: "skin",
    12: "skin",
    13: "skin",
    31: "paper",
    40: "skin",
  },
  32: { 5: "skin", 6: "skin", 7: "skin", 9: "skin", 10: "skin", 11: "skin", 18: "cloth" },
  33: { 7: "skin", 8: "skin", 9: "skin", 10: "paper", 21: "skin" },
  35: { 3: "skin", 4: "skin", 22: "paper", 23: "skin" },
  36: { 1: "skin", 5: "paper", 9: "skin" },
  37: { 6: "skin" },
  38: { 4: "skin", 5: "skin", 6: "cloth", 7: "cloth", 14: "paper", 15: "skin" },
  39: { 1: "skin", 2: "skin" },
  41: {
    0: "hair",
    1: "hair",
    4: "hair",
    8: "hair",
    9: "hair",
    10: "hair",
    11: "hair",
    14: "hair",
    15: "hair",
    16: "hair",
    18: "hair",
    19: "hair",
    21: "hair",
    22: "hair",
    24: "hair",
  },
  42: { 19: "skin", 20: "skin", 21: "skin", 22: "skin", 32: "skin" },
  43: {
    0: "ink",
    3: "skin",
    4: "skin",
    5: "skin",
    6: "skin",
    7: "skin",
    8: "skin",
    9: "skin",
    10: "skin",
    11: "skin",
  },
  44: { 0: "hair", 2: "cloth", 3: "cloth" },
  45: { 1: "skin", 2: "skin", 5: "paper", 6: "paper", 9: "skin", 12: "paper" },
  47: {
    0: "hair",
    3: "hair",
    5: "skin",
    6: "skin",
    7: "skin",
    8: "skin",
    9: "paper",
    11: "paper",
    12: "paper",
    14: "paper",
    15: "skin",
  },
  48: {
    0: "hair",
    1: "hair",
    5: "hair",
    13: "skin",
    14: "skin",
    17: "cloth",
    18: "skin",
    19: "cloth",
    20: "skin",
    22: "cloth",
  },
  49: { 0: "skin", 1: "skin", 2: "skin", 6: "skin", 7: "skin", 26: "paper", 35: "skin" },
  50: { 20: "skin", 21: "skin", 50: "paper", 59: "skin" },
  51: { 1: "cloth", 2: "cloth" },
  52: { 0: "hair", 1: "hair", 2: "hair" },
  53: { 0: "ink", 4: "skin", 5: "skin" },
  54: { 19: "paper", 28: "skin" },
  55: { 1: "hair", 2: "hair", 3: "skin", 4: "skin", 8: "skin", 11: "skin" },
  56: { 0: "hair", 2: "hair", 3: "hair", 4: "hair", 6: "cloth", 8: "cloth" },
  57: { 2: "cloth" },
  58: { 9: "paper", 13: "skin" },
  59: {
    0: "hair",
    1: "hair",
    2: "hair",
    6: "skin",
    7: "skin",
    8: "skin",
    11: "cloth",
    12: "cloth",
    19: "paper",
    20: "skin",
  },
  61: { 1: "skin", 3: "paper", 14: "skin" },
  62: { 1: "skin" },
  63: { 3: "skin", 4: "skin" },
  64: { 10: "skin", 11: "skin" },
  65: { 6: "paper", 17: "skin" },
  69: { 3: "paper", 7: "skin" },
  72: { 9: "skin", 11: "paper" },
  73: { 4: "cloth" },
  74: {
    0: "skin",
    2: "skin",
    3: "skin",
    5: "skin",
    6: "hair",
    10: "skin",
    13: "cloth",
    14: "skin",
    16: "skin",
    18: "cloth",
  },
  75: { 3: "skin", 4: "skin" },
  76: { 1: "cloth" },
  77: { 6: "skin", 11: "skin", 12: "skin", 13: "skin", 14: "skin", 16: "skin" },
  78: { 3: "skin", 6: "cloth" },
  79: { 6: "skin", 8: "cloth", 9: "cloth", 16: "paper", 17: "skin" },
  80: { 6: "skin", 8: "paper", 10: "paper", 12: "paper", 13: "skin" },
  81: { 0: "ink" },
  82: { 0: "hair", 1: "hair", 4: "hair", 5: "skin", 10: "skin", 11: "skin" },
  83: { 0: "skin", 15: "paper", 16: "paper", 19: "skin", 22: "paper" },
  85: { 3: "skin", 4: "skin", 5: "skin", 6: "skin", 7: "skin", 9: "skin", 25: "cloth" },
  86: {
    1: "skin",
    2: "skin",
    4: "skin",
    5: "skin",
    7: "skin",
    8: "skin",
    9: "skin",
    11: "skin",
    12: "skin",
    21: "cloth",
  },
  87: { 3: "skin", 4: "skin", 21: "skin", 24: "skin" },
  88: { 1: "skin", 4: "skin" },
  89: { 0: "hair", 3: "skin", 7: "skin", 8: "skin", 13: "skin", 16: "skin" },
  90: { 1: "skin", 2: "skin", 4: "skin", 5: "skin", 8: "skin" },
  91: { 2: "cloth" },
  92: { 6: "skin", 8: "paper" },
  93: { 2: "ink", 12: "skin" },
  95: {
    0: "skin",
    1: "hair",
    3: "skin",
    4: "skin",
    5: "skin",
    7: "skin",
    8: "skin",
    9: "skin",
    10: "paper",
    12: "paper",
    13: "skin",
    14: "paper",
  },
  96: {
    0: "hair",
    2: "skin",
    3: "skin",
    4: "hair",
    8: "hair",
    9: "hair",
    10: "skin",
    12: "skin",
    13: "cloth",
    15: "cloth",
  },
  97: { 0: "skin", 14: "skin" },
  98: { 17: "cloth", 19: "cloth" },
  99: { 3: "skin", 12: "skin" },
  100: {
    1: "skin",
    3: "skin",
    4: "skin",
    6: "skin",
    7: "skin",
    12: "skin",
    13: "skin",
  },
  103: { 0: "skin", 1: "skin", 2: "skin", 4: "skin", 6: "skin", 7: "skin", 8: "skin" },
  104: { 0: "hair", 1: "hair", 5: "cloth", 6: "cloth" },
};

/**
 * Classify every island of one sprite and paint a label map.
 *
 * Rules (tuned against all 105 cells of the official sheet):
 *  - big island in the head zone                 → face → skin
 *  - compact island hugging the silhouette       → hand / bare forearm → skin
 *  - large island below the neckline             → clothing
 *  - everything else (props, collars, patterns,
 *    light hair, glasses, linings)               → paper white (or override)
 */
function classifyCell(d: Uint8ClampedArray, w: number, h: number, spriteIdx: number): CellClassification {
  const N = w * h;
  const labels = new Int16Array(N).fill(-1);
  const palette: RGB[] = [INK, PAPER, WHITE];
  const pal = paletteFor(spriteIdx);

  let skinLabel = -1;
  let clothLabel = -1;
  let hairLabel = -1;

  let charMinY = h;
  for (let i = 0; i < N; i++) {
    if (d[i * 4 + 3] > 16) {
      const y = (i / w) | 0;
      if (y < charMinY) charMinY = y;
    }
  }
  const charTop = charMinY / h;

  const barrier = buildSealBarrier(d, w, h, spriteIdx);
  const islands = findWhiteIslands(d, w, h, barrier);
  const overrides = SPRITE_OVERRIDES[spriteIdx];

  for (const s of islands) {
    // Faces sit deep inside the head silhouette; light hair / turbans ring the
    // silhouette (small depth). Very large light-hair masses are handled by
    // SPRITE_OVERRIDES instead of a looser rule.
    const bigHead =
      s.cy < 0.5 && s.ar >= 0.03 && s.bh >= 0.2 && s.fill >= 0.32 && s.depth >= 16;
    const isFace =
      s.ar >= 0.006 &&
      s.bh >= 0.07 &&
      s.bw <= 0.45 &&
      (bigHead ||
        (s.depth >= 16 &&
          s.top > charTop + 0.02 &&
          (s.cy < 0.46 || (s.cy < 0.5 && s.fill >= 0.42))));

    // Crossed bare forearms form a wide, short band across the torso.
    const isArmBand =
      s.cy >= 0.55 &&
      s.bh >= 0.09 &&
      s.bh <= 0.16 &&
      s.bw >= 0.25 &&
      s.ar >= 0.012 &&
      s.fill <= 0.66;

    // Hands / bare forearms are compact and close to the silhouette edge.
    const isLimb =
      !isFace &&
      (isArmBand ||
        (s.cy >= 0.42 &&
          s.ar >= 0.002 &&
          s.ar <= 0.03 &&
          s.bw <= 0.4 &&
          s.bh <= 0.33 &&
          s.fill >= 0.3 &&
          s.depth <= 16));

    // Main garment fill: any tall, wide white area below the neckline. Flat
    // wide bands are shirt stripes / pocket details and stay paper-white.
    const isCloth =
      !isFace && !isLimb && s.cy >= 0.45 && s.ar >= 0.02 && s.bh >= 0.1;

    const role: IslandRole =
      overrides?.[s.id] ?? (isFace || isLimb ? "skin" : isCloth ? "cloth" : "paper");

    let color: number;
    if (role === "skin") {
      if (skinLabel < 0) skinLabel = palette.push(pal.skin) - 1;
      color = skinLabel;
    } else if (role === "cloth") {
      if (clothLabel < 0) clothLabel = palette.push(pal.cloth) - 1;
      color = clothLabel;
    } else if (role === "hair") {
      if (hairLabel < 0) hairLabel = palette.push(pal.hair) - 1;
      color = hairLabel;
    } else if (role === "ink") {
      color = 0;
    } else {
      color = 2; // paper white
    }

    for (const p of s.pixels) labels[p] = color;
  }

  // Propagate neighbor island labels onto virtual barrier pixels so no white
  // 1px seam divides regions split by SEAL_SEGMENTS.
  for (let pass = 0; pass < 2; pass++) {
    const pending: Array<[number, number]> = [];
    for (let i = 0; i < N; i++) {
      if (!barrier[i] || labels[i] >= 0) continue;
      const x = i % w;
      const down = i + w;
      const up = i - w;
      const left = i - 1;
      const right = i + 1;
      if (down < N && labels[down] >= 0) pending.push([i, labels[down]]);
      else if (up >= 0 && labels[up] >= 0) pending.push([i, labels[up]]);
      else if (x > 0 && labels[left] >= 0) pending.push([i, labels[left]]);
      else if (x < w - 1 && labels[right] >= 0) pending.push([i, labels[right]]);
    }
    for (const [i, c] of pending) labels[i] = c;
  }

  // Luminance-preserving edge tinting: pull the 2px anti-aliasing ring around
  // every island toward that island's colour so no white/cream halo survives.
  for (let pass = 0; pass < 2; pass++) {
    const pending: Array<[number, number]> = [];
    for (let i = 0; i < N; i++) {
      if (labels[i] >= 0 || !isEdgeGray(d, i)) continue;
      const x = i % w;
      const left = i - 1;
      const right = i + 1;
      const up = i - w;
      const down = i + w;
      if (left >= 0 && x > 0 && labels[left] >= 0) pending.push([i, labels[left]]);
      else if (right < N && x < w - 1 && labels[right] >= 0) pending.push([i, labels[right]]);
      else if (up >= 0 && labels[up] >= 0) pending.push([i, labels[up]]);
      else if (down < N && labels[down] >= 0) pending.push([i, labels[down]]);
    }
    for (const [i, c] of pending) labels[i] = c;
  }

  return { labels, palette, clothLabel };
}

/** Remap every opaque pixel onto the ink → target ramp (keeps AA crisp). */
function paintPixel(
  d: Uint8ClampedArray,
  p: number,
  target: RGB
): void {
  const v = (d[p] + d[p + 1] + d[p + 2]) / 765; // 0 = ink, 1 = paper/fill
  d[p] = INK[0] + (target[0] - INK[0]) * v;
  d[p + 1] = INK[1] + (target[1] - INK[1]) * v;
  d[p + 2] = INK[2] + (target[2] - INK[2]) * v;
}

/** Modes 1 + 3 (non-accent) — pure cream paper / charcoal ink. */
function applyInkPaper(d: Uint8ClampedArray, pixels: number): void {
  for (let i = 0; i < pixels; i++) {
    const p = i * 4;
    if (d[p + 3] === 0) continue;
    paintPixel(d, p, PAPER);
  }
}

/**
 * Colorize one cell in place.
 * `spriteIdx` fixes the palette; mode controls how much of the palette is used.
 */
export function colorizeCell(
  d: Uint8ClampedArray,
  w: number,
  h: number,
  spriteIdx: number,
  mode: PeepColorMode
): void {
  const pixels = w * h;
  preprocessCell(d, w, h, spriteIdx);

  if (mode === "ink-paper") {
    applyInkPaper(d, pixels);
    return;
  }

  const isAccent = mode === "duotone-accent" && spriteIdx % 5 === 0;
  if (mode === "duotone-accent" && !isAccent) {
    applyInkPaper(d, pixels);
    return;
  }

  const { labels, palette, clothLabel } = classifyCell(d, w, h, spriteIdx);
  const accent = spriteIdx % 10 === 0 ? ACCENT_PAPRIKA : ACCENT_SUN;

  for (let i = 0; i < pixels; i++) {
    const p = i * 4;
    if (d[p + 3] === 0) continue;

    let target: RGB = PAPER;
    const label = labels[i];
    if (label >= 0) {
      if (mode === "duotone-accent") {
        // Only the clothing islands carry the accent; face/hands stay paper.
        target = clothLabel >= 0 && label === clothLabel ? accent : PAPER;
      } else {
        target = palette[label];
      }
    }
    paintPixel(d, p, target);
  }
}

/* ------------------------------------------------------------------ */
/* Atlas builder                                                      */
/* ------------------------------------------------------------------ */

export interface PeepsAtlas {
  canvas: HTMLCanvasElement;
  mode: PeepColorMode;
  cellW: number;
  cellH: number;
  readyCells: Set<number>;
  readyList: number[];
}

const atlasCache: { current: PeepsAtlas | null } = { current: null };

function colorizeSingleCell(
  ctx: CanvasRenderingContext2D,
  cellW: number,
  cellH: number,
  cellIdx: number,
  mode: PeepColorMode
) {
  const row = Math.floor(cellIdx / SHEET_COLS);
  const col = cellIdx % SHEET_COLS;
  const x = Math.round(col * cellW);
  const y = Math.round(row * cellH);
  const w = Math.round((col + 1) * cellW) - x;
  const h = Math.round((row + 1) * cellH) - y;
  const image = ctx.getImageData(x, y, w, h);
  colorizeCell(image.data, w, h, cellIdx, mode);
  ctx.putImageData(image, x, y);
}

/**
 * Slice all 105 cells out of the sheet, colorize them, and compose one
 * offscreen atlas canvas. Colorizes a diverse 21-sprite starter batch first
 * so the crowd can start walking immediately (~50ms), then streams the
 * remaining 84 cells in the background without stalling rAF.
 */
export async function buildPeepsAtlas(
  mode: PeepColorMode,
  onInitialReady?: (atlas: PeepsAtlas) => void
): Promise<PeepsAtlas> {
  if (atlasCache.current && atlasCache.current.mode === mode) {
    onInitialReady?.(atlasCache.current);
    return atlasCache.current;
  }

  const img = await loadPeepsSheet();
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("2D canvas context unavailable");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0);

  const cellW = canvas.width / SHEET_COLS;
  const cellH = canvas.height / SHEET_ROWS;
  const readyCells = new Set<number>();
  const readyList: number[] = [];
  const atlas: PeepsAtlas = { canvas, mode, cellW, cellH, readyCells, readyList };

  // Starter batch: 21 diverse sprites spread every 5th cell across the sheet.
  for (let i = 0; i < SHEET_COUNT; i += 5) {
    colorizeSingleCell(ctx, cellW, cellH, i, mode);
    readyCells.add(i);
    readyList.push(i);
  }
  onInitialReady?.(atlas);

  // Stream the remaining 84 cells in small batches between animation frames.
  const yieldFrame = () =>
    new Promise<void>((resolve) =>
      typeof requestAnimationFrame === "function"
        ? requestAnimationFrame(() => resolve())
        : setTimeout(resolve, 0)
    );

  await yieldFrame();
  let processedInBatch = 0;
  for (let i = 0; i < SHEET_COUNT; i++) {
    if (readyCells.has(i)) continue;
    colorizeSingleCell(ctx, cellW, cellH, i, mode);
    readyCells.add(i);
    readyList.push(i);
    processedInBatch++;
    if (processedInBatch >= 12) {
      processedInBatch = 0;
      await yieldFrame();
    }
  }

  atlasCache.current = atlas;
  return atlas;
}

/* ------------------------------------------------------------------ */
/* Crowd deck                                                         */
/* ------------------------------------------------------------------ */

/**
 * Deterministic shuffle of the 105 sprites, sliced to `count`.
 * No duplicates until the whole sheet is exhausted.
 */
export function buildSpriteDeck(seed: number, count: number): number[] {
  const deck = Array.from({ length: SHEET_COUNT }, (_, i) => i);
  const rand = mulberry32(seed * 9301 + 49297);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = deck[i];
    deck[i] = deck[j];
    deck[j] = tmp;
  }
  return deck.slice(0, Math.max(0, Math.min(count, SHEET_COUNT)));
}

/** CSS sprite-sheet thumbnail style for one cell (zero extra memory). */
export function spriteBackgroundStyle(
  atlasUrl: string,
  spriteIdx: number
): CSSProperties {
  const col = spriteIdx % SHEET_COLS;
  const row = Math.floor(spriteIdx / SHEET_COLS);
  return {
    backgroundImage: `url(${atlasUrl})`,
    backgroundSize: `${SHEET_COLS * 100}% ${SHEET_ROWS * 100}%`,
    backgroundPosition: `${(col / (SHEET_COLS - 1)) * 100}% ${(row / (SHEET_ROWS - 1)) * 100}%`,
    backgroundRepeat: "no-repeat",
  };
}

/** Source rect for one cell in the atlas canvas (2px inset). */
export function spriteSourceRect(spriteIdx: number, cellW: number, cellH: number) {
  const col = spriteIdx % SHEET_COLS;
  const row = Math.floor(spriteIdx / SHEET_COLS);
  return {
    sx: col * cellW + SPRITE_INSET,
    sy: row * cellH + SPRITE_INSET,
    sw: cellW - SPRITE_INSET * 2,
    sh: cellH - SPRITE_INSET * 2,
  };
}
