"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  COLOR_MODE_OPTIONS,
  PEEP_ASPECT,
  SHEET_CELL_H,
  SHEET_CELL_W,
  SHEET_COLS,
  SHEET_COUNT,
  SHEET_ROWS,
  buildPeepsAtlas,
  buildSpriteDeck,
  loadPeepsSheet,
  spriteBackgroundStyle,
  spriteSourceRect,
  type PeepColorMode,
  type PeepsAtlas,
} from "@/lib/bustCrowdPeep";

if (typeof window !== "undefined") {
  void loadPeepsSheet();
}

export interface PeepsBootScreenProps {
  onComplete?: () => void;
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

/** Mobile keeps ~58% of the desktop pool so 390px screens stay packed wall-to-wall. */
function crowdCountFor(baseCount: number, stageW: number): number {
  if (stageW >= 1180) return baseCount;
  const t = Math.max(0.58, Math.min(1, 0.58 + ((stageW - 390) / (1180 - 390)) * 0.42));
  return Math.max(16, Math.round(baseCount * t));
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
  persistent = false,
  crowdCount = 90,
  speedMultiplier = 1.0,
  forceSeed = 1,
  showAtlasInspector = false,
  colorMode = "colorized",
  mobilePreview = false,
}: PeepsBootScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const atlasCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const atlasMetaRef = useRef<PeepsAtlas | null>(null);
  const crowdRef = useRef<CrowdMember[]>([]);
  const stageRef = useRef({ w: 0, h: 0 });
  // Live control values read inside the loop without tearing down rAF.
  const speedRef = useRef(speedMultiplier);
  const persistentRef = useRef(persistent);
  const onCompleteRef = useRef(onComplete);
  const dismissingRef = useRef(false);

  const [atlasReady, setAtlasReady] = useState(false);
  const [atlasBuilding, setAtlasBuilding] = useState(true);
  const [atlasVersion, setAtlasVersion] = useState(0);
  const [atlasUrl, setAtlasUrl] = useState<string | null>(null);
  const [showLogo, setShowLogo] = useState(false);
  const [showSubline, setShowSubline] = useState(false);
  const [deck, setDeck] = useState<number[]>([]);
  const [dismissing, setDismissing] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  speedRef.current = speedMultiplier;
  persistentRef.current = persistent;
  onCompleteRef.current = onComplete;

  // ── 1. Slice + colorize the official 105-cell sheet (starts walking in ~50ms) ──
  useEffect(() => {
    let active = true;
    setAtlasBuilding(true);
    buildPeepsAtlas(colorMode, (initialAtlas) => {
      if (!active) return;
      atlasMetaRef.current = initialAtlas;
      atlasCanvasRef.current = initialAtlas.canvas;
      setAtlasReady(true);
    })
      .then((atlas) => {
        if (!active) return;
        atlasMetaRef.current = atlas;
        atlasCanvasRef.current = atlas.canvas;
        setAtlasVersion((v) => v + 1);
        setAtlasBuilding(false);
        setAtlasReady(true);
      })
      .catch((err) => {
        console.error("[PeepsBootScreen] atlas build failed", err);
        if (active) setAtlasBuilding(false);
      });
    return () => {
      active = false;
    };
  }, [colorMode]);

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

    // Mobile scales down pool slightly (~58%) while staying dense wall-to-wall.
    const count = Math.min(Math.max(crowdCountFor(crowdCount, stageW), 1), SHEET_COUNT);
    const spawnDeck = buildSpriteDeck(forceSeed, count);
    const members: CrowdMember[] = [];
    for (let i = 0; i < count; i++) {
      const peep: CrowdMember = {
        id: i,
        spriteIndex: spawnDeck[i] ?? i % SHEET_COUNT,
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
  }, [atlasReady, crowdCount, forceSeed]);

  // ── 4. Staggered Smakr logo popup — fires right after peeps begin walking ─
  useEffect(() => {
    if (!atlasReady) return;
    setShowLogo(false);
    setShowSubline(false);
    const tLogo = window.setTimeout(() => setShowLogo(true), 160);
    const tSub = window.setTimeout(() => setShowSubline(true), 340);
    return () => {
      window.clearTimeout(tLogo);
      window.clearTimeout(tSub);
    };
  }, [atlasReady]);

  // ── 5. Swap one peep's sprite live (mutates the render ref, no rAF restart) ─
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

    const applyStageSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(1, Math.round(canvas.clientWidth || window.innerWidth));
      const h = Math.max(1, Math.round(canvas.clientHeight || window.innerHeight));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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
      ctx.clearRect(0, 0, w, h);

      // Auto-dismiss (non-persistent production boot): 2.0s after crowd starts
      if (!persistentRef.current && elapsed >= 2.0 && !dismissingRef.current) {
        dismissingRef.current = true;
        setDismissing(true);
        setTimeout(() => onCompleteRef.current?.(), 420);
      }

      const atlas = atlasCanvasRef.current;
      const atlasMeta = atlasMetaRef.current;
      if (atlas && atlasMeta && atlasMeta.readyList.length > 0) {
        const cellW = atlas.width / SHEET_COLS;
        const cellH = atlas.height / SHEET_ROWS;
        const speedMult = speedRef.current;
        const members = crowdRef.current;
        const readyCells = atlasMeta.readyCells;
        const readyList = atlasMeta.readyList;
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

          // Use colorized starter sprite until this member's full sprite streams in
          const activeSprite = readyCells.has(peep.spriteIndex)
            ? peep.spriteIndex
            : readyList[peep.id % readyList.length]!;

          // 2px source inset so a neighbouring cell can never bleed a line
          const { sx, sy, sw, sh } = spriteSourceRect(activeSprite, cellW, cellH);

          ctx.save();
          // Pivot from waist bottom-center so the upper body rocks naturally while marching
          ctx.translate(x + peep.peepWidth / 2, y + peep.peepHeight);
          ctx.rotate(swayAngle);
          ctx.scale(peep.scaleX, 1);
          ctx.drawImage(
            atlas,
            sx,
            sy,
            sw,
            sh,
            -peep.peepWidth / 2,
            -peep.peepHeight,
            peep.peepWidth,
            peep.peepHeight
          );
          ctx.restore();
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

  const modeOption = COLOR_MODE_OPTIONS.find((m) => m.value === colorMode) ?? COLOR_MODE_OPTIONS[1]!;

  return (
    <div
      className={`${
        mobilePreview
          ? "absolute left-1/2 top-1/2 h-[760px] max-h-[92dvh] w-[390px] max-w-[94vw] -translate-x-1/2 -translate-y-1/2 rounded-[2.5rem] border-[10px] border-[#181615] shadow-2xl"
          : "fixed inset-0"
      } z-[100] flex flex-col items-center justify-between bg-[#FAF7F2]/75 backdrop-blur-[4px] select-none overflow-hidden transition-opacity duration-[420ms] ease-out ${
        dismissing ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <style>{`
        @keyframes smakr-toon-pop {
          0% {
            opacity: 0;
            transform: translateY(34px) scale(0.32) rotate(-7deg);
          }
          55% {
            opacity: 1;
            transform: translateY(-8px) scale(1.15) rotate(2.5deg);
          }
          78% {
            opacity: 1;
            transform: translateY(3px) scale(0.95) rotate(-1.2deg);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1) rotate(0deg);
          }
        }
      `}</style>

      {/* Upper-Center Stage: Cartoonish Pop-In Smakr Brand Lockup */}
      <div
        className={`absolute inset-x-4 ${
          mobilePreview ? "top-[21%]" : "top-[24%] sm:top-[22%]"
        } z-20 flex flex-col items-center text-center pointer-events-none transition-all duration-[360ms] ease-out will-change-[opacity,transform] ${
          dismissing ? "opacity-0 -translate-y-7 scale-[1.12]" : "opacity-100 translate-y-0 scale-100"
        }`}
      >
        {/* Wordmark: font-comico all-caps Burnt Paprika + OSLO badge */}
        <div
          className="relative flex items-baseline gap-2.5 sm:gap-3 will-change-transform"
          style={
            showLogo
              ? {
                  animation: "smakr-toon-pop 560ms cubic-bezier(0.22, 1, 0.36, 1) forwards",
                }
              : { opacity: 0 }
          }
        >
          <span
            className={`font-comico ${
              mobilePreview ? "text-5xl" : "text-5xl sm:text-6xl md:text-7xl"
            } tracking-wide text-[#e84a27] drop-shadow-[0_4px_0_rgba(43,24,16,0.14)]`}
          >
            SMAKR
          </span>
          <span className="text-[10px] sm:text-xs font-sans font-bold tracking-[0.22em] uppercase text-[#181615]/55">
            OSLO
          </span>
        </div>

        {/* Staggered subtitle */}
        <p
          className={`mt-2.5 ${
            mobilePreview ? "text-xs" : "text-xs sm:text-sm"
          } font-semibold text-[#181615]/75 transition-all duration-400 ease-out`}
          style={{
            opacity: showSubline ? 1 : 0,
            transform: showSubline ? "translateY(0)" : "translateY(10px)",
          }}
        >
          The curated dish drop &amp; live food radar
        </p>
      </div>

      {/* Main Marching Crowd Canvas (Skiper 39) */}
      <canvas
        ref={canvasRef}
        className={`w-full h-full block touch-none pointer-events-none transition-all duration-[400ms] ease-in will-change-[opacity,transform] ${
          dismissing ? "opacity-0 translate-y-20" : "opacity-100 translate-y-0"
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
                {SHEET_COUNT} sprites · {SHEET_COLS} × {SHEET_ROWS} sheet · {modeOption.short}
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
