"use client";

import React, { useEffect, useState } from "react";
import { PeepsBootScreen } from "@/components/ui/PeepsBootScreen";
import { COLOR_MODE_OPTIONS, type PeepColorMode } from "@/lib/bustCrowdPeep";

const DENSITY_OPTIONS = [45, 70, 90, 105] as const;

export default function BootLabPage() {
  const [replayKey, setReplayKey] = useState(0);
  const [seed, setSeed] = useState(1);
  const [crowdCount, setCrowdCount] = useState<number>(90);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [colorMode, setColorMode] = useState<PeepColorMode>("colorized");
  const [showAtlas, setShowAtlas] = useState(false);
  const [mobilePreview, setMobilePreview] = useState(false);
  const [testTransition, setTestTransition] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);

  // Deep links for reviews/screenshots: ?mobile=1 opens the phone-frame preview,
  // ?atlas=1 opens the sprite inspector.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mobile") === "1") setMobilePreview(true);
    if (params.get("atlas") === "1") setShowAtlas(true);
  }, []);

  const handleReplay = () => {
    setDismissed(false);
    setReplayKey((k) => k + 1);
  };

  const handleRegenerate = () => {
    setDismissed(false);
    setSeed((s) => s + 1);
    setReplayKey((k) => k + 1);
  };

  const handleTestTransition = () => {
    setDismissed(false);
    setTestTransition(true);
    setReplayKey((k) => k + 1);
  };

  return (
    <main className="relative w-full h-dvh bg-[#FAF7F2] overflow-hidden select-none">
      {/* Mock Radar View (revealed only if live transition test auto-dismisses) */}
      <section className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-[#FAF7F2] text-[#181615]">
        <div className="w-16 h-16 rounded-2xl bg-[#E84A27]/10 flex items-center justify-center text-3xl">
          🎯
        </div>
        <h2 className="mt-4 text-2xl font-black text-[#181615]">
          Oslo Food Discovery Radar
        </h2>
        <p className="mt-2 text-sm text-[#181615]/70 text-center max-w-sm">
          Boot screen successfully dismissed! In production, this transitions smoothly into the MapLibre radar and dish feed.
        </p>
        <button
          onClick={() => {
            setTestTransition(false);
            handleReplay();
          }}
          className="mt-6 px-5 py-2.5 rounded-xl bg-[#E84A27] text-white text-xs font-bold shadow-md hover:bg-[#d43f1e] active:scale-95 transition-all"
        >
          Return to Boot Lab
        </button>
      </section>

      {/* The Skiper 39 Peeps Boot Screen */}
      {mobilePreview && !dismissed && (
        <div
          aria-hidden
          className="absolute inset-0 z-[90] bg-[#181615]/30 backdrop-blur-[2px]"
        />
      )}
      {!dismissed && (
        <PeepsBootScreen
          key={`${replayKey}-${seed}-${mobilePreview ? "mobile" : "full"}`}
          persistent={!testTransition}
          crowdCount={crowdCount}
          speedMultiplier={speedMultiplier}
          forceSeed={seed}
          colorMode={colorMode}
          showAtlasInspector={showAtlas}
          mobilePreview={mobilePreview}
          onComplete={() => setDismissed(true)}
        />
      )}

      {/* Compact Mobile Controls Pill (keeps center logo unobstructed on phones) */}
      {!controlsOpen && (
        <button
          type="button"
          onClick={() => setControlsOpen(true)}
          className="sm:hidden fixed top-3 right-3 z-[120] flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAF7F2]/90 backdrop-blur-md border border-[#181615]/15 shadow-md text-[11px] font-black tracking-wider text-[#181615] uppercase active:scale-95 transition-transform"
        >
          <span className="w-2 h-2 rounded-full bg-[#E84A27]" />
          <span>Boot Lab</span>
        </button>
      )}

      {/* Floating Top-Right Lab Control Bar */}
      <nav
        aria-label="Boot Lab Controls"
        className={`fixed top-3 right-3 sm:top-4 sm:right-4 z-[120] flex-col gap-2 p-3 bg-[#FAF7F2]/90 backdrop-blur-md border border-[#181615]/15 rounded-2xl shadow-lg max-w-[calc(100vw-1.5rem)] sm:max-w-sm ${
          controlsOpen ? "flex" : "hidden sm:flex"
        }`}
      >
        <div className="flex items-center justify-between gap-3 pb-2 border-b border-[#181615]/10">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#E84A27]" />
            <h1 className="text-xs font-black tracking-wider text-[#181615] uppercase">
              Boot Lab
            </h1>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#181615]/10 text-[#181615]">
              Skiper 39 · 105 Sheet
            </span>
            <button
              type="button"
              onClick={() => setControlsOpen(false)}
              aria-label="Close Boot Lab Controls"
              className="sm:hidden w-6 h-6 rounded-full bg-[#181615]/10 text-[#181615] text-xs font-bold flex items-center justify-center active:scale-95"
            >
              ×
            </button>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="grid grid-cols-2 gap-1.5 mt-1">
          <button
            onClick={handleReplay}
            className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#181615] hover:bg-[#2C2724] active:scale-95 text-white text-[11px] font-bold transition-all shadow-xs"
          >
            <span>🔄 Replay</span>
          </button>
          <button
            onClick={handleRegenerate}
            className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#F5EFE4] active:scale-95 border border-[#181615]/20 text-[#181615] text-[11px] font-bold transition-all shadow-xs"
          >
            <span>🎲 New Crowd</span>
          </button>
        </div>

        {/* Color Mode Switcher */}
        <div className="flex flex-col gap-1 mt-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#181615]/60">
            Color Mode
          </label>
          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#181615]/5 border border-[#181615]/10">
            {COLOR_MODE_OPTIONS.map((mode) => (
              <button
                key={mode.value}
                onClick={() => setColorMode(mode.value)}
                className={`py-1 px-1 text-[9.5px] leading-tight font-bold rounded-lg transition-all ${
                  colorMode === mode.value
                    ? "bg-[#E84A27] text-white shadow-xs"
                    : "text-[#181615]/70 hover:text-[#181615]"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {/* Crowd Count Segmented Control */}
        <div className="flex flex-col gap-1 mt-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#181615]/60">
            Crowd Density: {crowdCount} Busts
          </label>
          <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-[#181615]/5 border border-[#181615]/10">
            {DENSITY_OPTIONS.map((count) => (
              <button
                key={count}
                onClick={() => setCrowdCount(count)}
                className={`py-1 text-[10.5px] font-bold rounded-lg transition-all ${
                  crowdCount === count
                    ? "bg-[#E84A27] text-white shadow-xs"
                    : "text-[#181615]/70 hover:text-[#181615]"
                }`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        {/* Speed Multiplier Segmented Control */}
        <div className="flex flex-col gap-1 mt-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#181615]/60">
            Marching Pace
          </label>
          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#181615]/5 border border-[#181615]/10">
            {[
              { val: 0.5, label: "0.5x Chill" },
              { val: 1.0, label: "1.0x Normal" },
              { val: 1.5, label: "1.5x Rush" },
            ].map(({ val, label }) => (
              <button
                key={val}
                onClick={() => setSpeedMultiplier(val)}
                className={`py-1 text-[10px] font-bold rounded-lg transition-all ${
                  speedMultiplier === val
                    ? "bg-[#181615] text-white shadow-xs"
                    : "text-[#181615]/70 hover:text-[#181615]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Toggle Atlas Inspector & Live Transition */}
        <div className="grid grid-cols-3 gap-1.5 mt-1 pt-2 border-t border-[#181615]/10">
          <button
            onClick={() => setShowAtlas((v) => !v)}
            className={`py-1.5 px-2 text-[10px] font-bold rounded-xl border transition-all ${
              showAtlas
                ? "bg-[#181615] text-white border-[#181615]"
                : "bg-white text-[#181615] border-[#181615]/20 hover:bg-[#F5EFE4]"
            }`}
          >
            {showAtlas ? "Hide Atlas" : "Inspect Atlas"}
          </button>
          <button
            onClick={() => setMobilePreview((v) => !v)}
            className={`py-1.5 px-2 text-[10px] font-bold rounded-xl border transition-all ${
              mobilePreview
                ? "bg-[#181615] text-white border-[#181615]"
                : "bg-white text-[#181615] border-[#181615]/20 hover:bg-[#F5EFE4]"
            }`}
          >
            {mobilePreview ? "Exit Mobile" : "📱 Mobile View"}
          </button>
          <button
            onClick={handleTestTransition}
            className="py-1.5 px-2 text-[10px] font-bold rounded-xl bg-[#E84A27] hover:bg-[#d43f1e] active:scale-95 text-white transition-all shadow-xs"
          >
            Test Dismiss
          </button>
        </div>
        <p className="text-[9px] leading-tight text-[#181615]/45">
          Mobile view uses denser phone-sized busts anchored low — matching the
          live mobile boot framing.
        </p>
      </nav>
    </main>
  );
}
