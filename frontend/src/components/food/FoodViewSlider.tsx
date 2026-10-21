"use client";

import React from "react";
import { Utensils, Store, Plus } from "lucide-react";
import { motion } from "motion/react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { TicketStubIcon } from "@/components/food/FoodIcons";

interface FoodViewSliderProps {
  dishesCount: number;
  spotsCount: number;
  popupsCount?: number;
  className?: string;
}

const SPRING = { type: "spring", stiffness: 260, damping: 26, mass: 0.7 } as const;

export function FoodViewSlider({
  dishesCount,
  spotsCount,
  popupsCount = 0,
  className = "",
}: FoodViewSliderProps) {
  const feedMode = useCityPulseStore((state) => state.feedMode);
  const setFeedMode = useCityPulseStore((state) => state.setFeedMode);
  const mobileSheet = useCityPulseStore((state) => state.mobileSheetState);
  const setMobileSheet = useCityPulseStore((state) => state.setMobileSheetState);
  const openCreateDish = useCityPulseStore((state) => state.openCreateDish);

  const handleSelectMode = (mode: "food" | "places" | "popups") => {
    setFeedMode(mode);
    if (mobileSheet === "peek") {
      setMobileSheet("half");
    }
  };

  const isFeedActive = feedMode === "food";
  const isSpotsActive = feedMode === "places";
  const isPopupsActive = feedMode === "popups";

  const tabClass = (active: boolean) =>
    `relative flex items-center justify-center rounded-full text-xs font-semibold cursor-pointer outline-none border-0 select-none transition-colors duration-200 ${
      active
        ? "bg-[#e84a27] text-white px-3.5 py-2 h-9 shadow-sm"
        : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white w-9 h-9"
    }`;

  return (
    <motion.nav
      layout
      aria-label="Feed mode navigation"
      transition={SPRING}
      className={`pointer-events-auto select-none bg-white/85 dark:bg-stone-900/85 backdrop-blur-md border border-black/10 dark:border-white/10 rounded-full px-2 py-1.5 shadow-xl flex items-center gap-1.5 ${className}`}
      style={{
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
        touchAction: "manipulation",
      }}
    >
      {/* 1. Dishes Tab */}
      <motion.button
        layout
        type="button"
        onClick={() => handleSelectMode("food")}
        aria-label="View Dishes Feed"
        aria-pressed={isFeedActive}
        transition={SPRING}
        className={tabClass(isFeedActive)}
      >
        <span className="flex items-center gap-1.5 shrink-0">
          <Utensils className="w-3.5 h-3.5 shrink-0" />
          {isFeedActive && (
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="tracking-tight">Dishes</span>
              {dishesCount > 0 && (
                <span className="text-[10px] tabular-nums font-normal opacity-85">
                  {dishesCount}
                </span>
              )}
            </span>
          )}
        </span>
      </motion.button>

      {/* Prominent Add (+) Button (Centered) */}
      <motion.button
        layout
        type="button"
        onClick={openCreateDish}
        title="Log a Dish"
        aria-label="Log a Dish"
        transition={SPRING}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-9 h-9 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shadow-md cursor-pointer shrink-0 outline-none border-0"
      >
        <Plus className="w-4 h-4 stroke-[2.2]" />
      </motion.button>

      {/* 2. Spots Tab */}
      <motion.button
        layout
        type="button"
        onClick={() => handleSelectMode("places")}
        aria-label="View Food Spots"
        aria-pressed={isSpotsActive}
        transition={SPRING}
        className={tabClass(isSpotsActive)}
      >
        <span className="flex items-center gap-1.5 shrink-0">
          <Store className="w-3.5 h-3.5 shrink-0" />
          {isSpotsActive && (
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="tracking-tight">Spots</span>
              {spotsCount > 0 && (
                <span className="text-[10px] tabular-nums font-normal opacity-85">
                  {spotsCount}
                </span>
              )}
            </span>
          )}
        </span>
      </motion.button>
    </motion.nav>
  );
}
