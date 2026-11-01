"use client";

import React, { startTransition } from "react";
import { Utensils, Store, Plus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useCityPulseStore } from "@/store/useCityPulseStore";

interface FoodViewSliderProps {
  dishesCount: number;
  spotsCount: number;
  popupsCount?: number;
  className?: string;
}

const SPRING = { type: "spring", stiffness: 440, damping: 30, mass: 0.6 } as const;

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
    startTransition(() => {
      setFeedMode(mode);
      if (mobileSheet === "peek") {
        setMobileSheet("half");
      }
    });
  };

  const isFeedActive = feedMode === "food";
  const isSpotsActive = feedMode === "places";

  const tabClass = (active: boolean) =>
    `relative z-10 flex items-center justify-center rounded-full text-xs font-bold cursor-pointer outline-none border-0 select-none transition-colors duration-200 h-8 ${
      active
        ? "text-white px-3"
        : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white w-8 px-0"
    }`;

  return (
    <motion.nav
      layout
      aria-label="Feed mode navigation"
      transition={SPRING}
      className={`pointer-events-auto select-none bg-[#FAF7F2] dark:bg-[#181615] border border-[#181615]/15 dark:border-white/15 rounded-full p-1 shadow-xl shadow-black/10 flex items-center gap-1 ${className}`}
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
        whileTap={{ scale: 0.94 }}
        className={tabClass(isFeedActive)}
      >
        {isFeedActive && (
          <motion.div
            layoutId="activeFeedTabPill"
            className="absolute inset-0 bg-[#e84a27] rounded-full shadow-xs -z-10 pointer-events-none"
            transition={{ type: "spring", stiffness: 450, damping: 32 }}
          />
        )}
        <motion.span layout className="flex items-center gap-1.5 shrink-0">
          <Utensils className="w-3.5 h-3.5 shrink-0" />
          <AnimatePresence initial={false}>
            {isFeedActive && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-1.5 whitespace-nowrap overflow-hidden"
              >
                <span className="tracking-tight">Dishes</span>
                {dishesCount > 0 && (
                  <span className="text-[10px] tabular-nums font-semibold px-1.5 py-0.2 rounded-full bg-black/15 text-white">
                    {dishesCount}
                  </span>
                )}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.span>
      </motion.button>

      {/* Prominent Add (+) Button (Centered) */}
      <motion.button
        layout
        type="button"
        onClick={openCreateDish}
        title="Log a Dish"
        aria-label="Log a Dish"
        transition={SPRING}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.92 }}
        className="relative z-20 w-8 h-8 rounded-full bg-[#181615] dark:bg-white text-white dark:text-[#181615] flex items-center justify-center shadow-md cursor-pointer shrink-0 outline-none border-0"
      >
        <Plus className="w-3.5 h-3.5 stroke-[2.4]" />
      </motion.button>

      {/* 2. Spots Tab */}
      <motion.button
        layout
        type="button"
        onClick={() => handleSelectMode("places")}
        aria-label="View Food Spots"
        aria-pressed={isSpotsActive}
        transition={SPRING}
        whileTap={{ scale: 0.94 }}
        className={tabClass(isSpotsActive)}
      >
        {isSpotsActive && (
          <motion.div
            layoutId="activeFeedTabPill"
            className="absolute inset-0 bg-[#e84a27] rounded-full shadow-xs -z-10 pointer-events-none"
            transition={{ type: "spring", stiffness: 450, damping: 32 }}
          />
        )}
        <motion.span layout className="flex items-center gap-1.5 shrink-0">
          <Store className="w-3.5 h-3.5 shrink-0" />
          <AnimatePresence initial={false}>
            {isSpotsActive && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-1.5 whitespace-nowrap overflow-hidden"
              >
                <span className="tracking-tight">Spots</span>
                {spotsCount > 0 && (
                  <span className="text-[10px] tabular-nums font-semibold px-1.5 py-0.2 rounded-full bg-black/15 text-white">
                    {spotsCount}
                  </span>
                )}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.span>
      </motion.button>
    </motion.nav>
  );
}
