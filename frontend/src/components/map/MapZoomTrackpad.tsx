"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";

interface MapZoomTrackpadProps {
  currentZoom: number;
  onZoomDelta: (delta: number) => void;
  className?: string;
}

/**
 * Glasslike rectangle bar trackpad placed right above the closed bottom sheet.
 * Acts like a laptop trackpad: scrolling or swiping vertically smoothly glides
 * the map zoom in and out without panning the map canvas.
 */
export function MapZoomTrackpad({
  currentZoom,
  onZoomDelta,
  className = "",
}: MapZoomTrackpadProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const lastYRef = useRef(0);
  const activeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    return () => {
      if (activeTimeoutRef.current) clearTimeout(activeTimeoutRef.current);
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    isDraggingRef.current = true;
    lastYRef.current = e.clientY;
    setIsActive(true);
  };

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current) return;
      e.stopPropagation();
      e.preventDefault();

      // Swipe up = positive dy = zoom in; swipe down = negative dy = zoom out
      const dy = lastYRef.current - e.clientY;
      lastYRef.current = e.clientY;
      if (Math.abs(dy) > 0.1) {
        onZoomDelta(dy * 0.028);
      }
    },
    [onZoomDelta]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current) return;
      e.stopPropagation();
      e.preventDefault();
      try {
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {}
      isDraggingRef.current = false;
      if (activeTimeoutRef.current) clearTimeout(activeTimeoutRef.current);
      activeTimeoutRef.current = setTimeout(() => setIsActive(false), 500);
    },
    []
  );

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    // Wheel up (negative deltaY) zooms in; wheel down (positive deltaY) zooms out
    const delta = -e.deltaY * 0.0035;
    onZoomDelta(delta);

    setIsActive(true);
    if (activeTimeoutRef.current) clearTimeout(activeTimeoutRef.current);
    activeTimeoutRef.current = setTimeout(() => setIsActive(false), 600);
  };

  return (
    <div
      ref={trackRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="Scroll trackpad — swipe or scroll up/down to zoom"
      aria-label="Map Zoom Trackpad"
      className={`relative flex flex-col items-center justify-between w-9 h-28 rounded-2xl bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border shadow-md select-none touch-none cursor-ns-resize transition-all p-2 ${
        isActive
          ? "border-[#e84a27]/50 shadow-lg ring-1 ring-[#e84a27]/25 bg-white/95 dark:bg-stone-900/95"
          : "border-white/60 dark:border-white/15 hover:border-zinc-300 dark:hover:border-zinc-700"
      } ${className}`}
      style={{ touchAction: "none" }}
    >
      {/* Top subtle zoom-in cue */}
      <span className="text-[10px] font-bold text-zinc-400/80 dark:text-zinc-500 select-none leading-none">
        +
      </span>

      {/* Tactile trackpad center grooves */}
      <div className="flex flex-col items-center justify-center gap-1.5 w-full py-1">
        <span
          className={`w-3.5 h-0.5 rounded-full transition-colors ${
            isActive ? "bg-[#e84a27]/70" : "bg-zinc-400/40 dark:bg-zinc-500/40"
          }`}
        />
        <span
          className={`w-3.5 h-0.5 rounded-full transition-colors ${
            isActive ? "bg-[#e84a27]/70" : "bg-zinc-400/40 dark:bg-zinc-500/40"
          }`}
        />
        <span
          className={`w-3.5 h-0.5 rounded-full transition-colors ${
            isActive ? "bg-[#e84a27]/70" : "bg-zinc-400/40 dark:bg-zinc-500/40"
          }`}
        />
      </div>

      {/* Bottom subtle zoom-out cue */}
      <span className="text-[10px] font-bold text-zinc-400/80 dark:text-zinc-500 select-none leading-none">
        −
      </span>

      {/* Floating Zoom Value Tooltip while interacting */}
      {(isHovered || isActive) && (
        <div className="absolute right-full mr-2.5 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-lg bg-zinc-900/90 text-white font-mono text-[10px] font-bold shadow-md whitespace-nowrap pointer-events-none animate-in fade-in duration-100">
          {currentZoom.toFixed(1)}z
        </div>
      )}
    </div>
  );
}
