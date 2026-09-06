"use client";

import React from "react";
import { Navigation, Plus, Minus, Compass, Layers } from "lucide-react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { useGeolocation } from "@/hooks/useGeolocation";

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggleTheme?: () => void;
  isDarkTheme?: boolean;
}

export function MapControls({
  onZoomIn,
  onZoomOut,
  onToggleTheme,
}: MapControlsProps) {
  const { requestLocation, loading } = useGeolocation();
  const setMapCenter = useCityPulseStore((state) => state.setMapCenter);

  return (
    <div className="absolute right-3.5 top-20 z-20 flex flex-col items-end gap-2 pointer-events-auto select-none">
      {/* Cute 'Find Me' Location Button */}
      <button
        onClick={requestLocation}
        disabled={loading}
        title="Find My Location"
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/95 hover:bg-white text-zinc-900 text-xs font-bold border border-zinc-200 shadow-md transition-all active:scale-95 backdrop-blur-md"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="shrink-0">
          <circle cx="12" cy="12" r="10" fill="#fed7aa" stroke="#ea580c" strokeWidth="2" />
          <circle cx="9" cy="10.5" r="1.8" fill="#18181b" />
          <circle cx="15" cy="10.5" r="1.8" fill="#18181b" />
          <path d="M10 15 C11 16.5 13 16.5 14 15" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span>{loading ? "Locating..." : "Find Me"}</span>
      </button>

      {/* Center Oslo */}
      <button
        onClick={() => setMapCenter([10.7522, 59.9139], 13.5)}
        title="Reset to Oslo Center"
        className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/95 hover:bg-white text-zinc-700 border border-zinc-200 shadow-md transition-colors backdrop-blur-md"
      >
        <Compass className="w-4 h-4 text-zinc-600" />
      </button>

      {/* Zoom Controls */}
      <div className="flex flex-col rounded-xl bg-white/95 border border-zinc-200 shadow-md overflow-hidden backdrop-blur-md">
        <button
          onClick={onZoomIn}
          title="Zoom In"
          className="w-9 h-9 flex items-center justify-center text-zinc-700 hover:bg-zinc-50 transition-colors border-b border-zinc-100"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={onZoomOut}
          title="Zoom Out"
          className="w-9 h-9 flex items-center justify-center text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* Cycle Theme */}
      {onToggleTheme && (
        <button
          onClick={onToggleTheme}
          title="Switch Map Theme"
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/95 hover:bg-white text-zinc-700 border border-zinc-200 shadow-md transition-colors backdrop-blur-md"
        >
          <Layers className="w-4 h-4 text-orange-600" />
        </button>
      )}
    </div>
  );
}
