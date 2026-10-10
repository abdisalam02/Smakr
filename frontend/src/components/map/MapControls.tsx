"use client";

import React from "react";
import { Navigation, Plus, Minus } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useCityPulseStore } from "@/store/useCityPulseStore";

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
}: MapControlsProps) {
  const isLocating = useCityPulseStore((state) => state.isLocating);
  const { requestLocation, loading } = useGeolocation();
  const locating = isLocating || loading;

  const handleLocateClick = () => {
    useCityPulseStore.getState().setIsLocating(true);
    if (onLocate) {
      onLocate();
    } else {
      requestLocation(true);
    }
  };

  return (
    <div className="absolute right-3.5 top-20 z-20 flex flex-col items-end gap-2 pointer-events-auto select-none">
      {/* Locate Me button — immediate visual feedback & radar animation when locating */}
      <button
        onClick={handleLocateClick}
        disabled={locating}
        title="Find my location"
        aria-label="Find my location"
        className={`relative inline-flex items-center gap-1.5 h-9 px-3 rounded-xl shadow-md transition-all duration-200 select-none active:scale-95 backdrop-blur-md overflow-visible ${
          locating
            ? "bg-[#e84a27] text-white border border-[#e84a27] shadow-[#e84a27]/30 ring-2 ring-[#e84a27]/40 scale-[1.02]"
            : "bg-white/95 hover:bg-white text-[#e84a27] border border-zinc-200/90 hover:border-zinc-300 hover:shadow-lg"
        }`}
      >
        {locating && (
          <span
            aria-hidden="true"
            className="absolute -inset-1 rounded-xl bg-[#e84a27] opacity-35 animate-ping pointer-events-none"
          />
        )}
        <Navigation
          className={`w-3.5 h-3.5 transition-transform duration-300 ${
            locating ? "animate-spin text-white" : "text-[#e84a27]"
          }`}
        />
        <span className="text-[10px] font-bold leading-none tracking-tight">
          {locating ? "Locating…" : "Find me"}
        </span>
      </button>

      {/* Zoom Controls (Plus & Minus in their original spot) */}
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
