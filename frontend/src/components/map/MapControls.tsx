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
      <style>{`
        @keyframes gentleLocatePulse {
          0%, 100% {
            box-shadow: 0 2px 6px -1px rgba(0, 0, 0, 0.08), 0 0 0 0 rgba(232, 74, 39, 0);
            border-color: rgba(228, 228, 231, 0.9);
          }
          50% {
            box-shadow: 0 4px 12px -1px rgba(0, 0, 0, 0.1), 0 0 0 3px rgba(232, 74, 39, 0.16);
            border-color: rgba(232, 74, 39, 0.35);
          }
        }
        @keyframes gentleIconBreath {
          0%, 100% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.12);
            opacity: 1;
          }
        }
        .locating-pulse {
          animation: gentleLocatePulse 1.8s ease-in-out infinite;
        }
        .locating-icon {
          animation: gentleIconBreath 1.8s ease-in-out infinite;
        }
      `}</style>

      {/* Locate Me button — clean white glass pill with smooth, light ambient pulsing */}
      <button
        onClick={handleLocateClick}
        disabled={locating}
        title="Find my location"
        aria-label="Find my location"
        className={`inline-flex items-center gap-1.5 h-9 px-2.5 rounded-xl bg-white/95 hover:bg-white text-zinc-700 border shadow-md transition-all duration-300 select-none active:scale-95 backdrop-blur-md ${
          locating
            ? "locating-pulse text-zinc-900 cursor-wait"
            : "border-zinc-200 hover:border-zinc-300 hover:text-zinc-900"
        }`}
      >
        <Navigation
          className={`w-3.5 h-3.5 text-[#e84a27] transition-transform duration-300 ${
            locating ? "locating-icon" : ""
          }`}
        />
        <span className="text-[10px] font-semibold leading-none tracking-tight">
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
