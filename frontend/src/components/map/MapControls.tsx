"use client";

import React from "react";
import { Navigation, Plus, Minus } from "lucide-react";
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
      {/* Sleek Minimalist Locate Me Button */}
      <button
        onClick={requestLocation}
        disabled={loading}
        title="Locate Me"
        aria-label="Locate Me"
        className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/95 hover:bg-white text-zinc-700 hover:text-[#e84a27] border border-zinc-200 shadow-md transition-all active:scale-95 backdrop-blur-md"
      >
        <Navigation
          className={`w-4 h-4 text-zinc-700 transition-transform ${
            loading ? "animate-spin text-[#e84a27]" : ""
          }`}
        />
      </button>

      {/* Zoom Controls (Plus & Minus only) */}
      <div className="flex flex-col rounded-xl bg-white/95 border border-zinc-200 shadow-md overflow-hidden backdrop-blur-md">
        <button
          onClick={onZoomIn}
          title="Zoom In"
          aria-label="Zoom In"
          className="w-9 h-9 flex items-center justify-center text-zinc-700 hover:bg-zinc-50 transition-colors border-b border-zinc-100"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={onZoomOut}
          title="Zoom Out"
          aria-label="Zoom Out"
          className="w-9 h-9 flex items-center justify-center text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
