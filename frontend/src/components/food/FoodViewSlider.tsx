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
    // If mobile sheet is in collapsed peek state, smoothly open to half so user can view list!
    if (mobileSheet === "peek") {
      setMobileSheet("half");
    }
  };

  return (
    <div className={`pointer-events-auto select-none ${className}`}>
      <div
        className="smakr-glass-slider flex items-center p-1.5 rounded-full transition-all duration-300"
        style={{
          fontFamily: "var(--font-main, inherit)",
        }}
      >
        {/* Food / Dishes Toggle */}
        <button
          onClick={() => handleSelectMode("food")}
          type="button"
          aria-label="View Food Dishes"
          className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer"
          style={
            feedMode === "food"
              ? {
                  backgroundColor: "var(--btn-primary-bg, #18181b)",
                  color: "var(--btn-primary-text, #ffffff)",
                  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.18)",
                }
              : {
                  color: "var(--muted, #71717a)",
                  backgroundColor: "transparent",
                }
          }
        >
          <Utensils
            className="w-3.5 h-3.5 shrink-0 transition-colors"
            style={{
              color: feedMode === "food" ? "var(--accent, #ff5500)" : "currentColor",
            }}
          />
          <span className="tracking-tight">Food</span>
          <span
            className="text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold transition-colors"
            style={
              feedMode === "food"
                ? {
                    backgroundColor: "color-mix(in srgb, var(--btn-primary-text, #ffffff) 20%, transparent)",
                    color: "var(--btn-primary-text, #ffffff)",
                  }
                : {
                    backgroundColor: "var(--surface-raised, #f4f4f5)",
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
          className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer"
          style={
            feedMode === "places"
              ? {
                  backgroundColor: "var(--btn-primary-bg, #18181b)",
                  color: "var(--btn-primary-text, #ffffff)",
                  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.18)",
                }
              : {
                  color: "var(--muted, #71717a)",
                  backgroundColor: "transparent",
                }
          }
        >
          <MapPin
            className="w-3.5 h-3.5 shrink-0 transition-colors"
            style={{
              color: feedMode === "places" ? "var(--accent, #ff5500)" : "currentColor",
            }}
          />
          <span className="tracking-tight">Locations</span>
          <span
            className="text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold transition-colors"
            style={
              feedMode === "places"
                ? {
                    backgroundColor: "color-mix(in srgb, var(--btn-primary-text, #ffffff) 20%, transparent)",
                    color: "var(--btn-primary-text, #ffffff)",
                  }
                : {
                    backgroundColor: "var(--surface-raised, #f4f4f5)",
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
