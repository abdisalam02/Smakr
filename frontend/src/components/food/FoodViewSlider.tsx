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

  return (
    <div className={`pointer-events-auto select-none ${className}`}>
      <div className="flex items-center p-1 rounded-full bg-white/85 dark:bg-zinc-900/85 backdrop-blur-xl border border-white/60 dark:border-zinc-800/60 shadow-xl shadow-black/10 ring-1 ring-zinc-900/5">
        {/* Food / Dishes Toggle */}
        <button
          onClick={() => setFeedMode("food")}
          className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
            feedMode === "food"
              ? "bg-zinc-950 text-white shadow-sm scale-100"
              : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70 scale-95"
          }`}
        >
          <Utensils className={`w-3.5 h-3.5 ${feedMode === "food" ? "text-[#ff5500]" : "text-zinc-500"}`} />
          <span>Food</span>
          <span
            className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
              feedMode === "food"
                ? "bg-zinc-800 text-zinc-200"
                : "bg-zinc-200/70 text-zinc-600"
            }`}
          >
            {dishesCount}
          </span>
        </button>

        {/* Locations / Restaurants Toggle */}
        <button
          onClick={() => setFeedMode("places")}
          className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
            feedMode === "places"
              ? "bg-zinc-950 text-white shadow-sm scale-100"
              : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70 scale-95"
          }`}
        >
          <MapPin className={`w-3.5 h-3.5 ${feedMode === "places" ? "text-[#ff5500]" : "text-zinc-500"}`} />
          <span>Locations</span>
          <span
            className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
              feedMode === "places"
                ? "bg-zinc-800 text-zinc-200"
                : "bg-zinc-200/70 text-zinc-600"
            }`}
          >
            {spotsCount}
          </span>
        </button>
      </div>
    </div>
  );
}
