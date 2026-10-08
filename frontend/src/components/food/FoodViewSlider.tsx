"use client";

import React from "react";
import { Utensils, MapPin, Plus } from "lucide-react";
import { motion } from "motion/react";
import { useCityPulseStore } from "@/store/useCityPulseStore";

interface FoodViewSliderProps {
  dishesCount: number;
  spotsCount: number;
  className?: string;
}

const SPRING = { type: "spring", stiffness: 260, damping: 26, mass: 0.7 } as const;

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

  const handleSelectMode = (mode: "food" | "places") => {
    setFeedMode(mode);
    // If mobile sheet is in collapsed peek state, smoothly open to half so user can view the list
    if (mobileSheet === "peek") {
      setMobileSheet("half");
    }
  };

  const isFeedActive = feedMode === "food";
  const isRadarActive = feedMode === "places";

  // The active tab carries its own solid background (no shared-layout indicator,
  // which could detach and leave white text on a white nav).
  const tabClass = (active: boolean) =>
    `relative flex items-center justify-center rounded-full text-xs font-semibold cursor-pointer outline-none border-0 select-none transition-colors duration-200 ${
      active
        ? "bg-[#e84a27] text-white px-3.5 py-2 h-9 shadow-sm"
        : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white w-9 h-9"
    }`;

  return (
    <motion.nav
      layout
      aria-label="Feed or Radar navigation"
      transition={SPRING}
      className={`pointer-events-auto select-none bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border border-black/10 dark:border-white/10 rounded-full px-2 py-1.5 shadow-xl flex items-center gap-1.5 ${className}`}
      style={{
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
        touchAction: "manipulation",
      }}
    >
      {/* Feed Tab */}
      <motion.button
        layout
        type="button"
        onClick={() => handleSelectMode("food")}
        aria-label="View Food Feed"
        aria-pressed={isFeedActive}
        transition={SPRING}
        className={tabClass(isFeedActive)}
      >
        <span className="flex items-center gap-1.5 shrink-0">
          <Utensils className="w-3.5 h-3.5 shrink-0" />
          {isFeedActive && (
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="tracking-tight">Feed</span>
              <span className="text-[10px] tabular-nums font-normal opacity-85">
                {dishesCount}
              </span>
            </span>
          )}
        </span>
      </motion.button>

      {/* Prominent High-Contrast Add (+) Button — joins the layout animation */}
      <motion.button
        layout
        type="button"
        onClick={openCreateDish}
        title="Log a Dish / Spot"
        aria-label="Log a Dish or Spot"
        transition={SPRING}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-9 h-9 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shadow-md cursor-pointer shrink-0 outline-none border-0"
      >
        <Plus className="w-4 h-4 stroke-[2.2]" />
      </motion.button>

      {/* Radar / Places Tab */}
      <motion.button
        layout
        type="button"
        onClick={() => handleSelectMode("places")}
        aria-label="View Food Radar"
        aria-pressed={isRadarActive}
        transition={SPRING}
        className={tabClass(isRadarActive)}
      >
        <span className="flex items-center gap-1.5 shrink-0">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          {isRadarActive && (
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="tracking-tight">Radar</span>
              <span className="text-[10px] tabular-nums font-normal opacity-85">
                {spotsCount}
              </span>
            </span>
          )}
        </span>
      </motion.button>
    </motion.nav>
  );
}
