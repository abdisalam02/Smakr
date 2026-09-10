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
    <div
      className={`pointer-events-auto select-none ${className}`}
      style={{
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
        touchAction: "manipulation",
      }}
    >
      <div
        className="smakr-glass-slider relative flex items-center p-1 rounded-full w-[240px] sm:w-[258px] h-11"
        style={{
          fontFamily: "var(--font-main, inherit)",
        }}
      >
        {/* Physical Sliding Active Pill Highlight (GPU hardware-accelerated 60/120fps translate3d) */}
        <div
          className="absolute top-1 bottom-1 left-1 rounded-full pointer-events-none will-change-transform"
          style={{
            width: "calc(50% - 4px)",
            backgroundColor: "var(--btn-primary-bg, #18181b)",
            transform:
              feedMode === "food"
                ? "translate3d(0, 0, 0)"
                : "translate3d(100%, 0, 0)",
            transition: "transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.22)",
          }}
        />

        {/* Food / Dishes Toggle */}
        <button
          onClick={() => handleSelectMode("food")}
          type="button"
          aria-label="View Food Dishes"
          className="relative z-10 flex-1 h-full flex items-center justify-center gap-1.5 px-3 rounded-full text-xs font-bold transition-colors duration-200 active:scale-95 cursor-pointer bg-transparent border-0 outline-none"
          style={{
            color:
              feedMode === "food"
                ? "var(--btn-primary-text, #ffffff)"
                : "var(--muted, #71717a)",
          }}
        >
          <Utensils
            className="w-3.5 h-3.5 shrink-0 transition-colors duration-200"
            style={{
              color:
                feedMode === "food"
                  ? "var(--accent, #ff5500)"
                  : "var(--muted, #71717a)",
            }}
          />
          <span className="tracking-tight">Food</span>
          <span
            className="text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold transition-colors duration-200"
            style={
              feedMode === "food"
                ? {
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    color: "var(--btn-primary-text, #ffffff)",
                  }
                : {
                    backgroundColor: "rgba(120, 120, 120, 0.12)",
                    color: "var(--muted, #71717a)",
                  }
            }
          >
            {dishesCount}
          </span>
        </button>

        {/* Locations / Restaurants Toggle */}
        <button
          onClick={() => handleSelectMode("places")}
          type="button"
          aria-label="View Food Locations"
          className="relative z-10 flex-1 h-full flex items-center justify-center gap-1.5 px-3 rounded-full text-xs font-bold transition-colors duration-200 active:scale-95 cursor-pointer bg-transparent border-0 outline-none"
          style={{
            color:
              feedMode === "places"
                ? "var(--btn-primary-text, #ffffff)"
                : "var(--muted, #71717a)",
          }}
        >
          <MapPin
            className="w-3.5 h-3.5 shrink-0 transition-colors duration-200"
            style={{
              color:
                feedMode === "places"
                  ? "var(--accent, #ff5500)"
                  : "var(--muted, #71717a)",
            }}
          />
          <span className="tracking-tight">Locations</span>
          <span
            className="text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold transition-colors duration-200"
            style={
              feedMode === "places"
                ? {
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    color: "var(--btn-primary-text, #ffffff)",
                  }
                : {
                    backgroundColor: "rgba(120, 120, 120, 0.12)",
                    color: "var(--muted, #71717a)",
                  }
            }
          >
            {spotsCount}
          </span>
        </button>
      </div>
    </div>
  );
}
