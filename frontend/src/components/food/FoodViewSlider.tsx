"use client";

import React from "react";
import { Utensils, Store, Plus } from "lucide-react";
import { motion } from "motion/react";
import { useCityPulseStore } from "@/store/useCityPulseStore";

interface FoodViewSliderProps {
  dishesCount: number;
  spotsCount: number;
  popupsCount?: number;
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
  const openCreateDish = useCityPulseStore((state) => state.openCreateDish);

  const handleSelectMode = (mode: "food" | "places" | "popups") => {
    if (feedMode === mode) return;
    setFeedMode(mode);
    if (mobileSheet === "peek") {
      setMobileSheet("half");
    }
  };

  const isFeedActive = feedMode === "food";
  const isSpotsActive = feedMode === "places";

  return (
    <nav
      aria-label="Feed mode navigation"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      className={`pointer-events-auto select-none bg-[#FAF7F2] dark:bg-[#181615] border border-[#181615]/12 dark:border-white/15 shadow-[0_8px_24px_rgba(24,22,21,0.18)] rounded-full p-1.5 flex items-center gap-1 ${className}`}
      style={{
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
        touchAction: "manipulation",
      }}
    >
      {/* 1. Dishes Tab — expanding accordion pill */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          handleSelectMode("food");
        }}
        aria-label="View Dishes Feed"
        aria-pressed={isFeedActive}
        className={`relative z-10 flex items-center justify-center rounded-full text-[13px] font-bold cursor-pointer outline-none border-0 select-none transition-all duration-200 active:scale-95 h-10 ${
          isFeedActive
            ? "text-white px-3.5"
            : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white w-10 px-0"
        }`}
      >
        {isFeedActive && (
          <motion.div
            layoutId="activeFeedTabPill"
            className="absolute inset-0 bg-[#e84a27] rounded-full shadow-xs -z-10 pointer-events-none"
            transition={{ type: "spring", stiffness: 360, damping: 30, mass: 0.8 }}
          />
        )}
        <span className="flex items-center gap-1.5 shrink-0 pointer-events-none">
          <Utensils className="w-4 h-4 shrink-0" />
          <span
            className={`flex items-center gap-1.5 whitespace-nowrap overflow-hidden transition-[max-width,opacity] duration-220 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isFeedActive ? "max-w-[120px] opacity-100" : "max-w-0 opacity-0"
            }`}
          >
            <span className="tracking-tight">Dishes</span>
            {dishesCount > 0 && (
              <span className="text-[10px] tabular-nums font-semibold px-1.5 py-0.2 rounded-full bg-black/15 text-white">
                {dishesCount}
              </span>
            )}
          </span>
        </span>
      </button>

      {/* Prominent Add (+) Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          openCreateDish();
        }}
        title="Log a Dish"
        aria-label="Log a Dish"
        className="relative z-20 w-10 h-10 rounded-full bg-[#181615] dark:bg-white text-white dark:text-[#181615] flex items-center justify-center shadow-md cursor-pointer shrink-0 outline-none border-0 transition-transform duration-75 active:scale-90 hover:scale-105"
      >
        <Plus className="w-4 h-4 stroke-[2.4] pointer-events-none" />
      </button>

      {/* 2. Spots Tab — expanding accordion pill */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          handleSelectMode("places");
        }}
        aria-label="View Food Spots"
        aria-pressed={isSpotsActive}
        className={`relative z-10 flex items-center justify-center rounded-full text-[13px] font-bold cursor-pointer outline-none border-0 select-none transition-all duration-200 active:scale-95 h-10 ${
          isSpotsActive
            ? "text-white px-3.5"
            : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white w-10 px-0"
        }`}
      >
        {isSpotsActive && (
          <motion.div
            layoutId="activeFeedTabPill"
            className="absolute inset-0 bg-[#e84a27] rounded-full shadow-xs -z-10 pointer-events-none"
            transition={{ type: "spring", stiffness: 360, damping: 30, mass: 0.8 }}
          />
        )}
        <span className="flex items-center gap-1.5 shrink-0 pointer-events-none">
          <Store className="w-4 h-4 shrink-0" />
          <span
            className={`flex items-center gap-1.5 whitespace-nowrap overflow-hidden transition-[max-width,opacity] duration-220 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isSpotsActive ? "max-w-[120px] opacity-100" : "max-w-0 opacity-0"
            }`}
          >
            <span className="tracking-tight">Spots</span>
            {spotsCount > 0 && (
              <span className="text-[10px] tabular-nums font-semibold px-1.5 py-0.2 rounded-full bg-black/15 text-white">
                {spotsCount}
              </span>
            )}
          </span>
        </span>
      </button>
    </nav>
  );
}
