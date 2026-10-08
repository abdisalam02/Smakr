"use client";

import React from "react";
import { Utensils, MapPin } from "lucide-react";
import { useCityPulseStore } from "@/store/useCityPulseStore";

interface FoodViewSliderProps {
  dishesCount: number;
  spotsCount: number;
  className?: string;
}

export function FoodViewSlider({
  dishesCount,
  spotsCount,
  className = "",
}: FoodViewSliderProps) {
  const feedMode = useCityPulseStore((state) => state.feedMode);
  const setFeedMode = useCityPulseStore((state) => state.setFeedMode);
  const mobileSheet = useCityPulseStore((state) => state.mobileSheetState);
  const setMobileSheet = useCityPulseStore((state) => state.setMobileSheetState);

  const handleSelectMode = (mode: "food" | "places") => {
    setFeedMode(mode);
    // If mobile sheet is in collapsed peek state, smoothly open to half so user can view the list!
    if (mobileSheet === "peek") {
      setMobileSheet("half");
    }
  };

  return (
    <nav
      aria-label="Feed or Locations toggle"
      className={`pointer-events-auto select-none ${className}`}
      style={{
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
        touchAction: "manipulation",
      }}
    >
      <div className="relative flex items-center p-[3px] rounded-full w-[208px] sm:w-[218px] h-9 bg-white/95 backdrop-blur-md border border-black/[0.08] shadow-md shadow-black/5">
        {/* Physical Sliding Active Pill (Hardware-accelerated 60/120fps translate3d) */}
        <div
          className="absolute top-[3px] bottom-[3px] left-[3px] rounded-full bg-zinc-900 shadow-xs pointer-events-none will-change-transform"
          style={{
            width: "calc(50% - 3px)",
            transform:
              feedMode === "food"
                ? "translate3d(0, 0, 0)"
                : "translate3d(100%, 0, 0)",
            transition: "transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />

        {/* Feed / Food Toggle */}
        <button
          onClick={() => handleSelectMode("food")}
          type="button"
          aria-label="View Food Feed"
          aria-pressed={feedMode === "food"}
          className={`relative z-10 flex-1 h-full flex items-center justify-center gap-1.5 rounded-full text-xs font-bold transition-colors duration-150 active:scale-[0.98] cursor-pointer bg-transparent border-0 outline-none ${
            feedMode === "food"
              ? "text-white"
              : "text-zinc-600 hover:text-zinc-950"
          }`}
        >
          <Utensils
            className={`w-3 h-3 shrink-0 transition-colors duration-150 ${
              feedMode === "food"
                ? "text-[#e84a27]"
                : "text-zinc-400"
            }`}
          />
          <span className="tracking-tight">Feed</span>
          <span
            className={`text-[10px] tabular-nums font-semibold transition-colors duration-150 ${
              feedMode === "food"
                ? "text-white/70"
                : "text-zinc-400"
            }`}
          >
            {dishesCount}
          </span>
        </button>

        {/* Locations / Restaurants Toggle */}
        <button
          onClick={() => handleSelectMode("places")}
          type="button"
          aria-label="View Food Locations"
          aria-pressed={feedMode === "places"}
          className={`relative z-10 flex-1 h-full flex items-center justify-center gap-1.5 rounded-full text-xs font-bold transition-colors duration-150 active:scale-[0.98] cursor-pointer bg-transparent border-0 outline-none ${
            feedMode === "places"
              ? "text-white"
              : "text-zinc-600 hover:text-zinc-950"
          }`}
        >
          <MapPin
            className={`w-3 h-3 shrink-0 transition-colors duration-150 ${
              feedMode === "places"
                ? "text-[#e84a27]"
                : "text-zinc-400"
            }`}
          />
          <span className="tracking-tight">Locations</span>
          <span
            className={`text-[10px] tabular-nums font-semibold transition-colors duration-150 ${
              feedMode === "places"
                ? "text-white/70"
                : "text-zinc-400"
            }`}
          >
            {spotsCount}
          </span>
        </button>
      </div>
    </nav>
  );
}
