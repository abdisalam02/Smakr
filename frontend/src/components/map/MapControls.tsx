"use client";

import React from "react";
import { Navigation, Plus, Minus } from "lucide-react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { useGeolocation } from "@/hooks/useGeolocation";

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocate?: () => void;
  onToggleTheme?: () => void;
  isDarkTheme?: boolean;
}

export function MapControls({
  onZoomIn,
  onZoomOut,
  onLocate,
  onToggleTheme,
}: MapControlsProps) {
  const { requestLocation, loading } = useGeolocation();
  const setMapCenter = useCityPulseStore((state) => state.setMapCenter);

  const handleLocateClick = () => {
    if (onLocate) {
      onLocate();
    } else {
      requestLocation();
    }
  };

  return (
    <div className="absolute right-3.5 top-20 z-20 flex flex-col items-end gap-2 pointer-events-auto select-none">
      {/* Locate Me button — brand-coloured + labelled so it's easy to spot */}
      <button
        onClick={handleLocateClick}
        disabled={loading}
        title="Find my location"
        aria-label="Find my location"
        className="inline-flex items-center gap-1.5 h-11 px-3.5 rounded-2xl bg-[#e84a27] hover:bg-[#d23e1d] disabled:opacity-70 text-white border border-white/40 shadow-lg shadow-[#e84a27]/35 transition-all active:scale-95"
      >
        <Navigation className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        <span className="text-[11px] font-bold leading-none">
          {loading ? "Finding…" : "Find me"}
        </span>
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
