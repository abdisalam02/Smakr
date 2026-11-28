"use client";

import React, { useEffect, useRef, useState } from "react";
import type { PeepColorMode, PeepsAtlas } from "@/lib/bustCrowdPeep";

const SHEET_COLS = 15;
const SHEET_ROWS = 7;
const SHEET_COUNT = SHEET_COLS * SHEET_ROWS;
const SHEET_CELL_W = 240;
const SHEET_CELL_H = 324;
const PEEP_ASPECT = SHEET_CELL_W / SHEET_CELL_H;
const SPRITE_INSET = 2;

const COLOR_MODE_LABELS: Record<PeepColorMode, string> = {
  "ink-paper": "Ink + Paper",
  colorized: "Colorized",
  "duotone-accent": "Duotone Accent",
};

function spriteBackgroundStyle(atlasUrl: string, spriteIdx: number): React.CSSProperties {
  const col = spriteIdx % SHEET_COLS;
  const row = Math.floor(spriteIdx / SHEET_COLS);
  return {
    backgroundImage: `url(${atlasUrl})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: `${SHEET_COLS * 100}% ${SHEET_ROWS * 100}%`,
    backgroundPosition: `${(col / (SHEET_COLS - 1)) * 100}% ${(row / (SHEET_ROWS - 1)) * 100}%`,
  };
}

const BAKED_ATLAS_SRC = "/boot/peeps-atlas-baked.webp";
const BAKED_ATLAS_COLS = 8;
const BAKED_ATLAS_ROWS = 6;
const BAKED_ATLAS_COUNT = 48;

let bakedImgPromise: Promise<HTMLImageElement> | null = null;
function loadBakedAtlasImage(): Promise<HTMLImageElement> {
  if (!bakedImgPromise) {
    bakedImgPromise = new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = async () => {
        try {
          if (typeof img.decode === "function") await img.decode();
        } catch {
          // Image is already loaded even if decode rejects
        }
        resolve(img);
      };
      img.onerror = () => {
        bakedImgPromise = null;
        reject(new Error(`Failed to load baked boot atlas: ${BAKED_ATLAS_SRC}`));
      };
      img.src = BAKED_ATLAS_SRC;
    });
  }
  return bakedImgPromise;
}

export interface PeepsBootScreenProps {
  onComplete?: () => void;
  onAtlasReady?: () => void;
  persistent?: boolean;
  crowdCount?: number;
  speedMultiplier?: number;
  forceSeed?: number;
  showAtlasInspector?: boolean;
  colorMode?: PeepColorMode;
  /** Render the boot screen inside a phone-sized frame (lab preview). */
  mobilePreview?: boolean;
}

/**
 * Literal Skiper 39 (Canvas Crowd) member. Every sprite is an authentic
 * upper-body Open Peeps bust sliced out of the official 105-character sheet —
 * hands, phones, knives and pointing fingers included. No SVG rigs, no legs.
 */
interface CrowdMember {
  id: number;
  spriteIndex: number;
  peepWidth: number;
  peepHeight: number;
  startX: number;
  endX: number;
  anchorY: number;
  offsetY: number;
  scaleX: 1 | -1;
  walkTime: number; // seconds of walk-clock; progress = walkTime / xDuration
  xDuration: number; // seconds to cross the current stage width
  timeScale: number; // 0.55–1.45 per-peep speed variance
  phaseOffset: number; // desynchronizes footstep bounce across the crowd
}

const Y_DURATION = 0.27; // Skiper 39 step-bounce half-cycle (seconds)
const WALK_SPEED_PX = 165; // consistent horizontal ground speed across screen widths
const SWAY_RADIANS = 0.042; // subtle ~2.4deg upper-body stride lean

// Bust heights scaled for dense, readable Skiper 39 framing on phones and desktop.
const PEEP_HEIGHT_DESKTOP = 365;
const PEEP_HEIGHT_MOBILE = 232;

function peepHeightFor(stageW: number): number {
  if (stageW >= 1180) return PEEP_HEIGHT_DESKTOP;
  if (stageW <= 420) return PEEP_HEIGHT_MOBILE;
  const t = (stageW - 420) / (1180 - 420);
  return Math.round(PEEP_HEIGHT_MOBILE + t * (PEEP_HEIGHT_DESKTOP - PEEP_HEIGHT_MOBILE));
}

/** Mobile keeps 30 busts for 60fps boot performance & rich crowd density; desktop scales up to baseCount (46). */
function crowdCountFor(baseCount: number, stageW: number): number {
  if (stageW < 640) return Math.min(baseCount, 30);
  if (stageW >= 1180) return baseCount;
  const t = (stageW - 640) / (1180 - 640);
  return Math.max(30, Math.round(30 + t * (baseCount - 30)));
}

function xDurationFor(stageW: number, peepWidth: number): number {
  return Math.max(4.8, Math.min(10.5, (stageW + peepWidth) / WALK_SPEED_PX));
}

/** resetPeep — Skiper 39 positioning scaled to peepHeight so back rows never float. */
function resetPeep(peep: CrowdMember, stageW: number, stageH: number) {
  const peepHeight = peepHeightFor(stageW);
  const peepWidth = Math.round(peepHeight * PEEP_ASPECT);

  const direction: 1 | -1 = Math.random() > 0.5 ? 1 : -1;

  // Front row dips ~24% below the bottom edge; back rows rise up to ~62% of a
  // bust height so their cut-off bottoms always tuck behind the front row.
  const maxSink = Math.round(peepHeight * 0.24);
  const liftSpan = Math.round(peepHeight * 0.62);
  const offsetY = maxSink - liftSpan * Math.pow(Math.random(), 1.85);
  const startY = stageH - peepHeight + offsetY;

  let startX: number;
  let endX: number;
  if (direction === 1) {
    startX = -peepWidth;
    endX = stageW;
    peep.scaleX = 1;
  } else {
    startX = stageW;
    endX = -peepWidth;
    peep.scaleX = -1;
  }

  peep.peepWidth = peepWidth;
  peep.peepHeight = peepHeight;
  peep.startX = startX;
  peep.endX = endX;
  peep.anchorY = startY;
  peep.offsetY = offsetY;
  peep.walkTime = 0;
  peep.xDuration = xDurationFor(stageW, peepWidth);
  peep.timeScale = 0.55 + Math.random() * 0.9;
}

export function PeepsBootScreen({
  onComplete,
  onAtlasReady,
  persistent = false,
  crowdCount = 46,
  speedMultiplier = 1.0,
  forceSeed = 1,
  showAtlasInspector = false,
  colorMode = "colorized",
  mobilePreview = false,
}: PeepsBootScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const atlasCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const atlasMetaRef = useRef<PeepsAtlas | null>(null);
  const bakedImgRef = useRef<HTMLImageElement | null>(null);
  const crowdRef = useRef<CrowdMember[]>([]);
  const stageRef = useRef({ w: 0, h: 0 });
  // Live control values read inside the loop without tearing down rAF.
  const speedRef = useRef(speedMultiplier);
  const persistentRef = useRef(persistent);
  const onCompleteRef = useRef(onComplete);
  const onAtlasReadyRef = useRef(onAtlasReady);
  const dismissingRef = useRef(false);

  const useBakedAtlas = colorMode === "colorized" && !showAtlasInspector && !persistent;

  const [atlasReady, setAtlasReady] = useState(false);
  const [atlasBuilding, setAtlasBuilding] = useState(true);
  const [atlasVersion, setAtlasVersion] = useState(0);
  const [atlasUrl, setAtlasUrl] = useState<string | null>(null);
  const [deck, setDeck] = useState<number[]>([]);
  const [dismissing, setDismissing] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  speedRef.current = speedMultiplier;
  persistentRef.current = persistent;
  onCompleteRef.current = onComplete;
  onAtlasReadyRef.current = onAtlasReady;

  // ── 1. Pre-compute exact deck and load pre-baked WebP atlas (0ms flood-fill) or lazy lab atlas ──
  const precomputedDeck = React.useMemo(() => {
    const approxW =
      typeof window !== "undefined" ? window.innerWidth : mobilePreview ? 390 : 1280;
    const maxCells = useBakedAtlas ? BAKED_ATLAS_COUNT : SHEET_COUNT;
    const targetCount = Math.min(Math.max(crowdCountFor(crowdCount, approxW), 1), maxCells);
    // Deterministic permutation of sprite indices (zero dependency on bustCrowdPeep.ts)
    const indices = Array.from({ length: maxCells }, (_, i) => i);
    let s = (forceSeed * 1664525 + 1013904223) >>> 0;
    for (let i = indices.length - 1; i > 0; i--) {
      s = (s * 1664525 + 1013904223) >>> 0;
      const j = s % (i + 1);
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices.slice(0, targetCount);
  }, [crowdCount, forceSeed, mobilePreview, useBakedAtlas]);

  useEffect(() => {
    let active = true;
    setAtlasBuilding(true);

    const loadDynamicAtlas = async () => {
      try {
        const mod = await import("@/lib/bustCrowdPeep");
        if (!active) return;
        const deckArg = showAtlasInspector
          ? undefined
          : mod.buildSpriteDeck(forceSeed, precomputedDeck.length);
        const atlas = await mod.buildPeepsAtlas(
          colorMode,
          (initialAtlas) => {
            if (!active) return;
            atlasMetaRef.current = initialAtlas;
            atlasCanvasRef.current = initialAtlas.canvas;
            setAtlasReady(true);
            onAtlasReadyRef.current?.();
          },
          deckArg
        );
        if (!active) return;
        atlasMetaRef.current = atlas;
        atlasCanvasRef.current = atlas.canvas;
        setAtlasVersion((v) => v + 1);
        setAtlasBuilding(false);
        setAtlasReady(true);
        onAtlasReadyRef.current?.();
      } catch (err) {
        console.error("[PeepsBootScreen] atlas build failed", err);
        if (active) {
          setAtlasBuilding(false);
          onAtlasReadyRef.current?.();
          if (!persistentRef.current) onCompleteRef.current?.();
        }
      }
    };

    if (useBakedAtlas) {
      loadBakedAtlasImage()
        .then((img) => {
          if (!active) return;
          bakedImgRef.current = img;
          setAtlasBuilding(false);
          setAtlasReady(true);
          onAtlasReadyRef.current?.();
        })
        .catch(() => {
          bakedImgRef.current = null;
          void loadDynamicAtlas();
        });
      return () => {
        active = false;
      };
    }

    bakedImgRef.current = null;
    void loadDynamicAtlas();
    return () => {
      active = false;
    };
  }, [colorMode, forceSeed, precomputedDeck, showAtlasInspector, useBakedAtlas]);

  // ── 2. Half-scale data URL so the inspector can CSS-crop every sprite ─────
  useEffect(() => {
    if (!showAtlasInspector || atlasVersion === 0) return;
    let active = true;
    const id = window.setTimeout(() => {
      const atlas = atlasCanvasRef.current;
      if (!active || !atlas) return;
      try {
        const preview = document.createElement("canvas");
        preview.width = Math.round(atlas.width / 2);
        preview.height = Math.round(atlas.height / 2);
        const pctx = preview.getContext("2d");
        if (!pctx) return;
        pctx.imageSmoothingEnabled = true;
        pctx.imageSmoothingQuality = "high";
        pctx.drawImage(atlas, 0, 0, preview.width, preview.height);
        setAtlasUrl(preview.toDataURL("image/png"));
      } catch (err) {
        console.error("[PeepsBootScreen] preview generation failed", err);
      }
    }, 30);
    return () => {
      active = false;
      window.clearTimeout(id);
    };
  }, [showAtlasInspector, atlasVersion]);

  // ── 3. Initialize the crowd pre-distributed across the stage (no ghost walk)
  useEffect(() => {
    if (!atlasReady) return;

    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    const stageW = Math.round(rect?.width || window.innerWidth);
    const stageH = Math.round(rect?.height || window.innerHeight);
    stageRef.current = { w: stageW, h: stageH };

    const maxCells = useBakedAtlas ? BAKED_ATLAS_COUNT : SHEET_COUNT;
    const count = Math.min(Math.max(crowdCountFor(crowdCount, stageW), 1), maxCells);
    const spawnDeck =
      precomputedDeck.length >= count
        ? precomputedDeck.slice(0, count)
        : Array.from({ length: count }, (_, i) => i % maxCells);
    const members: CrowdMember[] = [];
    for (let i = 0; i < count; i++) {
      const peep: CrowdMember = {
        id: i,
        spriteIndex: spawnDeck[i] ?? i % maxCells,
        peepWidth: 0,
        peepHeight: 0,
        startX: 0,
        endX: 0,
        anchorY: 0,
        offsetY: 0,
        scaleX: 1,
        walkTime: 0,
        xDuration: 8,
        timeScale: 1,
        phaseOffset: Math.random() * Math.PI * 2,
      };
      resetPeep(peep, stageW, stageH);
      // Start each bust mid-march (progress 0.02–0.98) so the crowd fills the
      // bottom edge from the very first frame — no blank lead-in.
      peep.walkTime = (0.02 + Math.random() * 0.96) * peep.xDuration;
      members.push(peep);
    }

    // Depth sort: lower anchorY = further back = drawn first
    members.sort((a, b) => a.anchorY - b.anchorY);
    crowdRef.current = members;
    setDeck(spawnDeck);
    dismissingRef.current = false;
    setDismissing(false);
  }, [atlasReady, crowdCount, forceSeed, precomputedDeck]);

  // ── 4. Swap one peep's sprite live (mutates the render ref, no rAF restart) ─
  const applySpriteEdit = (memberIdx: number, nextSprite: number) => {
    const member = crowdRef.current.find((p) => p.id === memberIdx);
    if (member) member.spriteIndex = nextSprite;
    setDeck((prev) => prev.map((v, j) => (j === memberIdx ? nextSprite : v)));
  };

  // ── 6. High-performance rAF loop (deps: atlasReady ONLY) ──────────────────
  useEffect(() => {
    if (!atlasReady) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let last = performance.now();
    const startTime = performance.now();

    let stageDpr = 1;
    const applyStageSize = () => {
      // Cap DPR at 1.5 so 3x Retina devices don't burn 4x fill-rate during startup.
      stageDpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.max(1, Math.round(canvas.clientWidth || window.innerWidth));
      const h = Math.max(1, Math.round(canvas.clientHeight || window.innerHeight));
      canvas.width = Math.round(w * stageDpr);
      canvas.height = Math.round(h * stageDpr);
      ctx.setTransform(stageDpr, 0, 0, stageDpr, 0, 0);
      const prev = stageRef.current;
      const prevW = prev.w || w;
      stageRef.current = { w, h };
      // Re-scale every bust to the new stage and keep it grounded.
      for (const peep of crowdRef.current) {
        const nextHeight = peepHeightFor(w);
        const ratio = peep.peepHeight > 0 ? nextHeight / peep.peepHeight : 1;
        const nextWidth = Math.round(nextHeight * PEEP_ASPECT);
        const prevDur = peep.xDuration || xDurationFor(prevW, nextWidth);
        const nextDur = xDurationFor(w, nextWidth);
        peep.peepHeight = nextHeight;
        peep.peepWidth = nextWidth;
        peep.offsetY = Math.round(peep.offsetY * ratio);
        peep.anchorY = h - nextHeight + peep.offsetY;
        peep.walkTime = (peep.walkTime / prevDur) * nextDur;
        peep.xDuration = nextDur;
        peep.endX += w - prevW;
        if (peep.scaleX === -1) peep.startX += w - prevW;
      }
    };

    applyStageSize();
    const resizeObserver = new ResizeObserver(applyStageSize);
    resizeObserver.observe(canvas);
    window.addEventListener("resize", applyStageSize);

    const render = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const elapsed = (now - startTime) / 1000;

      const { w, h } = stageRef.current;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Auto-dismiss (non-persistent production boot): 1.30s hold + 500ms synchronized fade-out
      if (!persistentRef.current && elapsed >= 1.30 && !dismissingRef.current) {
        dismissingRef.current = true;
        setDismissing(true);
        setTimeout(() => onCompleteRef.current?.(), 540);
      }

      const bakedImg = bakedImgRef.current;
      const atlas = atlasCanvasRef.current;
      const atlasMeta = atlasMetaRef.current;
      const drawSource = bakedImg ?? (atlas && atlasMeta && atlasMeta.readyList.length > 0 ? atlas : null);
      if (drawSource) {
        const cols = bakedImg ? BAKED_ATLAS_COLS : SHEET_COLS;
        const rows = bakedImg ? BAKED_ATLAS_ROWS : SHEET_ROWS;
        const srcW = bakedImg ? bakedImg.naturalWidth : atlas!.width;
        const srcH = bakedImg ? bakedImg.naturalHeight : atlas!.height;
        const cellW = srcW / cols;
        const cellH = srcH / rows;
        const inset = bakedImg ? 0 : SPRITE_INSET;
        const sw = cellW - inset * 2;
        const sh = cellH - inset * 2;
        const speedMult = speedRef.current;
        const members = crowdRef.current;
        const readyCells = bakedImg ? null : atlasMeta!.readyCells;
        let needsSort = false;

        for (let i = 0; i < members.length; i++) {
          const peep = members[i];

          peep.walkTime += dt * peep.timeScale * speedMult;
          if (peep.walkTime >= peep.xDuration) {
            resetPeep(peep, w, h);
            needsSort = true;
          }

          const progress = peep.walkTime / peep.xDuration;
          const x = peep.startX + (peep.endX - peep.startX) * progress;

          // Stride bounce + subtle waist-pivoted torso sway synced to each step
          const phase = (peep.walkTime / Y_DURATION) * Math.PI + peep.phaseOffset;
          const bounceAmp = Math.max(8, Math.round(peep.peepHeight * 0.036));
          const bounce = Math.abs(Math.sin(phase)) * bounceAmp;
          const swayAngle = Math.sin(phase) * SWAY_RADIANS * peep.scaleX;
          const y = peep.anchorY - bounce;

          // Permanently bind each peep to its assigned sprite so it never flickers or teleports mid-stride
          const activeSprite = bakedImg ? peep.spriteIndex % BAKED_ATLAS_COUNT : peep.spriteIndex;
          if (readyCells && !readyCells.has(activeSprite)) continue;

          const col = activeSprite % cols;
          const row = (activeSprite / cols) | 0;
          const sx = col * cellW + inset;
          const sy = row * cellH + inset;

          // Direct affine transform (skips save/restore stack & per-frame rect objects)
          const cos = Math.cos(swayAngle);
          const sin = Math.sin(swayAngle);
          ctx.setTransform(
            stageDpr * cos * peep.scaleX,
            stageDpr * sin * peep.scaleX,
            -stageDpr * sin,
            stageDpr * cos,
            stageDpr * (x + peep.peepWidth * 0.5),
            stageDpr * (y + peep.peepHeight)
          );
          ctx.drawImage(
            drawSource,
            sx,
            sy,
            sw,
            sh,
            -peep.peepWidth * 0.5,
            -peep.peepHeight,
            peep.peepWidth,
            peep.peepHeight
          );
        }

        // Re-sort depth whenever a bust finishes crossing and resets
        if (needsSort) {
          members.sort((a, b) => a.anchorY - b.anchorY);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", applyStageSize);
    };
  }, [atlasReady]);

  const modeLabel = COLOR_MODE_LABELS[colorMode] ?? COLOR_MODE_LABELS.colorized;

  return (
    <div
      className={`${
        mobilePreview
          ? "absolute left-1/2 top-1/2 h-[760px] max-h-[92dvh] w-[390px] max-w-[94vw] -translate-x-1/2 -translate-y-1/2 rounded-[2.5rem] border-[10px] border-[#181615] shadow-2xl"
          : "fixed inset-0"
      } bg-[#FAF7F2] z-[100] flex flex-col items-center justify-between select-none overflow-hidden transition-opacity duration-[500ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-opacity ${
        dismissing ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Static Oslo map backdrop softly visible beneath Warm Oat from frame 0 */}
      <div aria-hidden="true" className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/boot/oslo-map-backdrop.webp"
          alt=""
          decoding="sync"
          fetchPriority="high"
          className="w-full h-full object-cover opacity-[0.26]"
        />
        <div className="absolute inset-0 bg-[#FAF7F2]/55" />
      </div>

      <style>{`
        @keyframes smakr-toon-pop {
          0% {
            opacity: 0;
            transform: translateY(24px) scale(0.76) rotate(-4deg);
          }
          60% {
            opacity: 1;
            transform: translateY(-4px) scale(1.06) rotate(1.2deg);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1) rotate(0deg);
          }
        }
      `}</style>

      {/* Upper-Center Stage: Immediate Standalone Smakr Wordmark */}
      <div
        className={`relative z-20 inset-x-0 mt-[22vh] sm:mt-[20vh] flex flex-col items-center text-center pointer-events-none transition-all duration-[500ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[opacity,transform] ${
          dismissing ? "opacity-0 -translate-y-4 scale-[1.04]" : "opacity-100 translate-y-0 scale-100"
        }`}
      >
        <div
          className="relative flex items-center justify-center will-change-transform"
          style={{
            animation: "smakr-toon-pop 460ms cubic-bezier(0.22, 1, 0.36, 1) forwards",
          }}
        >
          <span
            className={`font-comico ${
              mobilePreview ? "text-6xl" : "text-6xl sm:text-7xl md:text-8xl"
            } tracking-wide text-[#e84a27] drop-shadow-[0_4px_0_rgba(43,24,16,0.14)]`}
          >
            SMAKR
          </span>
        </div>
      </div>

      {/* Main Marching Crowd Canvas (Skiper 39) with soft left/right edge fade */}
      <canvas
        ref={canvasRef}
        style={{
          maskImage:
            "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)",
        }}
        className={`relative z-10 w-full h-full block touch-none pointer-events-none transition-all duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[opacity,transform] ${
          dismissing
            ? "opacity-0 translate-y-6"
            : atlasReady
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-2"
        }`}
      />

      {/* Open Peeps Crowd Atlas Inspector + per-peep sprite picker */}
      {showAtlasInspector && (
        <aside
          aria-label="Open Peeps Crowd Atlas Inspector"
          className="absolute inset-x-4 top-20 bottom-6 z-50 bg-[#FAF7F2]/95 backdrop-blur-md border border-[#181615]/15 rounded-2xl p-4 shadow-xl overflow-y-auto"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#181615]/10">
            <div>
              <h2 className="text-sm font-bold text-[#181615]">
                Open Peeps Crowd Atlas — {deck.length} Peeps
              </h2>
              <p className="text-[10px] font-mono text-[#181615]/60">
                {SHEET_COUNT} sprites · {SHEET_COLS} × {SHEET_ROWS} sheet · {modeLabel}
              </p>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                atlasBuilding
                  ? "bg-[#FDEA6B] text-[#181615]"
                  : "bg-[#78E185]/35 text-[#181615]"
              }`}
            >
              {atlasBuilding ? "Colorizing sheet…" : "Atlas ready"}
            </span>
          </div>

          {editingIdx !== null && (
            <SpritePicker
              targetIdx={editingIdx}
              spriteIdx={deck[editingIdx] ?? 0}
              atlasUrl={atlasUrl}
              compact={mobilePreview}
              onPick={(sprite) => applySpriteEdit(editingIdx, sprite)}
              onClose={() => setEditingIdx(null)}
            />
          )}

          <p className="mt-3 text-[10px] font-semibold text-[#181615]/55">
            Tap ✏️ Edit on any peep to swap in a different sprite from the official 105–character sheet.
          </p>

          <div
            className={`grid ${
              mobilePreview
                ? "grid-cols-4"
                : "grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10"
            } gap-2.5 mt-3`}
          >
            {deck.map((spriteIdx, idx) => (
              <div
                key={idx}
                className={`flex flex-col items-center p-1.5 rounded-xl bg-white border shadow-xs transition-colors ${
                  editingIdx === idx
                    ? "border-[#E84A27] ring-2 ring-[#E84A27]/30"
                    : "border-[#181615]/10"
                }`}
              >
                <div
                  className="w-full rounded-md overflow-hidden bg-[#FAF7F2] border border-[#181615]/8"
                  style={{
                    aspectRatio: `${SHEET_CELL_W} / ${SHEET_CELL_H}`,
                    ...(atlasUrl ? spriteBackgroundStyle(atlasUrl, spriteIdx) : {}),
                  }}
                />
                <span className="mt-1 text-[9px] font-mono font-bold text-[#181615]/70 leading-none">
                  #{idx + 1} → {spriteIdx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => setEditingIdx(editingIdx === idx ? null : idx)}
                  className={`mt-1 mb-0.5 px-2 py-0.5 rounded-lg text-[9.5px] font-bold transition-all active:scale-95 cursor-pointer ${
                    editingIdx === idx
                      ? "bg-[#E84A27] text-white"
                      : "bg-[#181615]/5 text-[#181615] hover:bg-[#181615]/10 border border-[#181615]/15"
                  }`}
                >
                  {editingIdx === idx ? "Picking…" : "✏️ Edit"}
                </button>
              </div>
            ))}
          </div>
        </aside>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SpritePicker — browse all 105 authentic Open Peeps chars            */
/* ------------------------------------------------------------------ */

interface SpritePickerProps {
  targetIdx: number;
  spriteIdx: number;
  atlasUrl: string | null;
  compact?: boolean;
  onPick: (spriteIdx: number) => void;
  onClose: () => void;
}

function SpritePicker({ targetIdx, spriteIdx, atlasUrl, compact = false, onPick, onClose }: SpritePickerProps) {
  return (
    <div className="mt-3 p-3 rounded-2xl bg-white border-2 border-[#E84A27]/40 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[11px] font-black uppercase tracking-wider text-[#E84A27]">
          Peep #{targetIdx + 1} — sprite {spriteIdx + 1}
        </h3>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onPick(Math.floor(Math.random() * SHEET_COUNT))}
            className="px-2 py-1 rounded-lg bg-[#181615]/5 text-[#181615] border border-[#181615]/15 text-[10px] font-bold active:scale-95 cursor-pointer hover:bg-[#181615]/10"
          >
            🎲 Random
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 rounded-lg bg-[#181615] text-white text-[10px] font-bold active:scale-95 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>

      {atlasUrl ? (
        <div
          className={`grid ${
            compact ? "grid-cols-7" : "grid-cols-7 sm:grid-cols-10"
          } gap-1.5 max-h-56 overflow-y-auto pr-1`}
        >
          {Array.from({ length: SHEET_COUNT }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onPick(i)}
              title={`Sprite ${i + 1}`}
              className={`relative rounded-md overflow-hidden border-2 transition-all cursor-pointer hover:scale-[1.04] ${
                i === spriteIdx ? "border-[#E84A27] ring-2 ring-[#E84A27]/40" : "border-transparent"
              }`}
              style={{ aspectRatio: `${SHEET_CELL_W} / ${SHEET_CELL_H}` }}
            >
              <span
                className="absolute inset-0"
                style={spriteBackgroundStyle(atlasUrl, i)}
              />
            </button>
          ))}
        </div>
      ) : (
        <p className="text-[10px] font-mono text-[#181615]/50 py-4 text-center">
          Preparing sprite thumbnails…
        </p>
      )}
    </div>
  );
}
