"use client";

import React, { useEffect, useRef } from "react";
import { useCityPulseStore } from "@/store/useCityPulseStore";

const BAKED_ATLAS_SRC = "/boot/peeps-atlas-baked.webp";
const BAKED_ATLAS_COLS = 8;
const BAKED_ATLAS_ROWS = 6;
const BAKED_ATLAS_COUNT = 48;
const PEEP_ASPECT = 240 / 324;

const Y_DURATION = 0.3;
const WALK_SPEED_PX = 115;
const SWAY_RADIANS = 0.038;

let bakedWalkwayImgPromise: Promise<HTMLImageElement> | null = null;
function loadWalkwayAtlas(): Promise<HTMLImageElement> {
  if (!bakedWalkwayImgPromise) {
    bakedWalkwayImgPromise = new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = async () => {
        try {
          if (typeof img.decode === "function") await img.decode();
        } catch {
          // Image is loaded even if decode rejects
        }
        resolve(img);
      };
      img.onerror = () => {
        bakedWalkwayImgPromise = null;
        reject(new Error(`Failed to load baked atlas: ${BAKED_ATLAS_SRC}`));
      };
      img.src = BAKED_ATLAS_SRC;
    });
  }
  return bakedWalkwayImgPromise;
}

interface WalkwayPeep {
  spriteIndex: number;
  peepWidth: number;
  peepHeight: number;
  startX: number;
  endX: number;
  anchorY: number;
  scaleX: 1 | -1;
  walkTime: number;
  xDuration: number;
  timeScale: number;
  phaseOffset: number;
}

function peepHeightFor(stageH: number): number {
  // Size busts slightly taller than the canvas so heads reach near the top
  // while cut-off torso bottoms always stay tucked below the bottom edge.
  return Math.round(stageH * 1.24);
}

function crowdCountFor(stageW: number): number {
  if (stageW < 640) return 15;
  if (stageW >= 1024) return 20;
  return 17;
}

function xDurationFor(stageW: number, peepWidth: number): number {
  return Math.max(4.6, Math.min(11.5, (stageW + peepWidth * 2) / WALK_SPEED_PX));
}

export type WalkwayDirection = "mixed" | "ltr" | "rtl";

interface FeedPeepsWalkwayProps {
  direction?: WalkwayDirection;
  className?: string;
}

function resetWalkwayPeep(
  peep: WalkwayPeep,
  stageW: number,
  stageH: number,
  flow: WalkwayDirection
) {
  const peepHeight = peepHeightFor(stageH);
  const peepWidth = Math.round(peepHeight * PEEP_ASPECT);
  const direction: 1 | -1 =
    flow === "ltr" ? 1 : flow === "rtl" ? -1 : Math.random() > 0.5 ? 1 : -1;

  // Keep every torso bottom strictly below stageH even at peak stride bounce.
  const bounceAmp = Math.max(4, Math.round(peepHeight * 0.032));
  const minSink = Math.round(peepHeight * 0.09) + bounceAmp;
  const maxSink = Math.round(peepHeight * 0.21) + bounceAmp;
  const offsetY = minSink + (maxSink - minSink) * Math.pow(Math.random(), 1.25);

  peep.peepWidth = peepWidth;
  peep.peepHeight = peepHeight;
  peep.anchorY = stageH - peepHeight + offsetY;
  peep.startX = direction === 1 ? -peepWidth : stageW;
  peep.endX = direction === 1 ? stageW : -peepWidth;
  peep.scaleX = direction;
  peep.walkTime = 0;
  peep.xDuration = xDurationFor(stageW, peepWidth);
  peep.timeScale = 0.65 + Math.random() * 0.75;
}

/**
 * Edge-to-edge mid-feed Open Peeps walkway reusing the pre-baked boot WebP atlas.
 * Pauses rAF automatically when off-screen, hidden, or in mobile map mode (0% idle CPU).
 */
export function FeedPeepsWalkway({
  direction = "mixed",
  className = "",
}: FeedPeepsWalkwayProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const syncLoopRef = useRef<(() => void) | null>(null);
  const isFeedHidden = useCityPulseStore((s) => s.viewMode === "map");
  const isFeedHiddenRef = useRef(isFeedHidden);
  isFeedHiddenRef.current = isFeedHidden;

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let disposed = false;
    let animId: number | null = null;
    let inView = false;
    let bakedImg: HTMLImageElement | null = null;
    let stageW = 0;
    let stageH = 0;
    let stageDpr = 1;
    let lastTs = performance.now();
    const members: WalkwayPeep[] = [];

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const seedCrowd = () => {
      const target = crowdCountFor(stageW);
      if (members.length === 0) {
        const deck = Array.from({ length: BAKED_ATLAS_COUNT }, (_, i) => i);
        let s = (direction === "rtl" ? 1597334677 : 2654435761) >>> 0;
        for (let i = deck.length - 1; i > 0; i--) {
          s = (s * 1664525 + 1013904223) >>> 0;
          const j = s % (i + 1);
          [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        for (let i = 0; i < target; i++) {
          const p: WalkwayPeep = {
            spriteIndex: deck[i % deck.length],
            peepWidth: 72,
            peepHeight: 98,
            startX: 0,
            endX: stageW,
            anchorY: 0,
            scaleX: 1,
            walkTime: 0,
            xDuration: 6,
            timeScale: 1,
            phaseOffset: Math.random() * Math.PI * 2,
          };
          resetWalkwayPeep(p, stageW, stageH, direction);
          // Pre-populate across the entire width so sprites are already mid-stride when scrolled into view.
          p.walkTime = Math.random() * p.xDuration;
          members.push(p);
        }
        members.sort((a, b) => a.anchorY - b.anchorY);
      } else {
        for (const p of members) {
          const prevProgress = p.xDuration > 0 ? p.walkTime / p.xDuration : 0;
          resetWalkwayPeep(p, stageW, stageH, direction);
          p.walkTime = prevProgress * p.xDuration;
        }
        members.sort((a, b) => a.anchorY - b.anchorY);
      }
    };

    const drawFrame = (dt: number) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!bakedImg || stageW <= 0 || stageH <= 0) return;

      const cellW = bakedImg.naturalWidth / BAKED_ATLAS_COLS;
      const cellH = bakedImg.naturalHeight / BAKED_ATLAS_ROWS;
      let needsSort = false;

      for (let i = 0; i < members.length; i++) {
        const peep = members[i];
        if (dt > 0) {
          peep.walkTime += dt * peep.timeScale;
          if (peep.walkTime >= peep.xDuration) {
            resetWalkwayPeep(peep, stageW, stageH, direction);
            needsSort = true;
          }
        }

        const progress = peep.walkTime / peep.xDuration;
        const x = peep.startX + (peep.endX - peep.startX) * progress;
        const phase = (peep.walkTime / Y_DURATION) * Math.PI + peep.phaseOffset;
        const bounceAmp = Math.max(4, Math.round(peep.peepHeight * 0.032));
        const bounce = dt > 0 ? Math.abs(Math.sin(phase)) * bounceAmp : 0;
        const swayAngle = dt > 0 ? Math.sin(phase) * SWAY_RADIANS * peep.scaleX : 0;
        const y = peep.anchorY - bounce;

        const idx = peep.spriteIndex % BAKED_ATLAS_COUNT;
        const col = idx % BAKED_ATLAS_COLS;
        const row = (idx / BAKED_ATLAS_COLS) | 0;

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
          bakedImg,
          col * cellW,
          row * cellH,
          cellW,
          cellH,
          -peep.peepWidth * 0.5,
          -peep.peepHeight,
          peep.peepWidth,
          peep.peepHeight
        );
      }

      if (needsSort) {
        members.sort((a, b) => a.anchorY - b.anchorY);
      }
    };

    const stopLoop = () => {
      if (animId !== null) {
        cancelAnimationFrame(animId);
        animId = null;
      }
    };

    const tick = (now: number) => {
      if (disposed || !inView || document.hidden || isFeedHiddenRef.current) {
        animId = null;
        return;
      }
      const dt = Math.min(0.05, (now - lastTs) / 1000);
      lastTs = now;
      drawFrame(dt);
      animId = requestAnimationFrame(tick);
    };

    const syncLoop = () => {
      if (disposed || !bakedImg || stageW <= 0 || stageH <= 0) return;
      if (reducedMotion) {
        stopLoop();
        drawFrame(0);
        return;
      }
      const shouldRun = inView && !document.hidden && !isFeedHiddenRef.current;
      if (shouldRun && animId === null) {
        lastTs = performance.now();
        animId = requestAnimationFrame(tick);
      } else if (!shouldRun) {
        stopLoop();
      }
    };

    syncLoopRef.current = syncLoop;

    const applySize = () => {
      const rect = section.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      stageW = rect.width;
      stageH = rect.height;
      stageDpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(stageW * stageDpr);
      canvas.height = Math.round(stageH * stageDpr);
      seedCrowd();
      drawFrame(0);
      syncLoop();
    };

    const io = new IntersectionObserver(
      (entries) => {
        inView = entries.some((e) => e.isIntersecting);
        syncLoop();
      },
      { rootMargin: "120px" }
    );
    io.observe(section);

    const ro = new ResizeObserver(applySize);
    ro.observe(section);

    const onVisChange = () => syncLoop();
    document.addEventListener("visibilitychange", onVisChange);

    applySize();
    loadWalkwayAtlas()
      .then((img) => {
        if (disposed) return;
        bakedImg = img;
        drawFrame(0);
        syncLoop();
      })
      .catch(() => {
        // Silently skip if atlas unavailable
      });

    return () => {
      disposed = true;
      syncLoopRef.current = null;
      stopLoop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisChange);
    };
  }, [direction]);

  // Immediately pause/resume rAF when switching between mobile Map and Feed view.
  useEffect(() => {
    syncLoopRef.current?.();
  }, [isFeedHidden]);

  return (
    <section
      ref={sectionRef}
      aria-hidden="true"
      className={`col-span-full -mx-3 lg:-mx-3.5 w-[calc(100%+24px)] lg:w-[calc(100%+28px)] h-[144px] sm:h-[164px] overflow-hidden relative select-none pointer-events-none my-1 ${className}`}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </section>
  );
}
