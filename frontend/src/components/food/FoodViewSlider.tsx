"use client";

import React, { useRef } from "react";
import { Utensils, Compass, Plus } from "lucide-react";
import { motion } from "motion/react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { trackEvent } from "@/lib/analytics";

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
  const viewMode = useCityPulseStore((state) => state.viewMode);
  const setViewMode = useCityPulseStore((state) => state.setViewMode);
  const setFeedMode = useCityPulseStore((state) => state.setFeedMode);
  const mobileSheet = useCityPulseStore((state) => state.mobileSheetState);
  const setMobileSheet = useCityPulseStore((state) => state.setMobileSheetState);
  const openCreateDish = useCityPulseStore((state) => state.openCreateDish);

  const isMapActive = viewMode === "map";
  const isFeedActive = !isMapActive;

  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const handledPointerRef = useRef(false);

  const haltFeedMomentum = () => {
    if (typeof document === "undefined") return;
    document.querySelectorAll<HTMLElement>("[data-feed-scroll]").forEach((el) => {
      el.scrollTop = el.scrollTop;
    });
  };

  const handleSelectFeed = () => {
    if (viewMode === "map") {
      trackEvent("tab_switched", { from: "map", to: "feed" });
    }
    setViewMode("split");
    setFeedMode("food");
    if (mobileSheet === "peek") {
      setMobileSheet("half");
    }
  };

  const handleSelectMap = () => {
    if (viewMode !== "map") {
      trackEvent("tab_switched", { from: "feed", to: "map" });
    }
    setViewMode("map");
    setMobileSheet("peek");
  };

  const makeTapHandlers = (action: () => void) => ({
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (e.pointerType === "mouse") return;
      pointerStartRef.current = { x: e.clientX, y: e.clientY };
      handledPointerRef.current = false;
      haltFeedMomentum();
    },
    onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (e.pointerType === "mouse") return;
      const start = pointerStartRef.current;
      pointerStartRef.current = null;
      if (!start) return;
      if (Math.hypot(e.clientX - start.x, e.clientY - start.y) < 12) {
        handledPointerRef.current = true;
        if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
          navigator.vibrate(8);
        }
        action();
        window.setTimeout(() => {
          handledPointerRef.current = false;
        }, 350);
      }
    },
    onPointerCancel: () => {
      pointerStartRef.current = null;
      handledPointerRef.current = false;
    },
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      e.preventDefault();
      if (handledPointerRef.current) {
        handledPointerRef.current = false;
        return;
      }
      if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
        navigator.vibrate(8);
      }
      action();
    },
  });

  return (
    <nav
      aria-label="Feed and Map navigation"
      data-bottom-dock="true"
      onClick={(e) => e.stopPropagation()}
      className={`pointer-events-auto select-none bg-[#FAF7F2] dark:bg-[#181615] border border-[#E4D9C8] dark:border-white/15 shadow-lg rounded-full h-11 px-1.5 py-1 flex items-center gap-1.5 ${className}`}
      style={{
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
        touchAction: "manipulation",
      }}
    >
      {/* 1. Feed Tab — expanding accordion pill */}
      <button
        type="button"
        {...makeTapHandlers(handleSelectFeed)}
        aria-label="View Food Feed"
        aria-pressed={isFeedActive}
        className={`relative z-10 flex items-center justify-center rounded-full text-[12.5px] font-display font-bold cursor-pointer outline-none border-0 select-none transition-[transform,color,background-color] duration-150 ease-out active:scale-[0.93] touch-manipulation h-8 ${
          isFeedActive
            ? "text-white px-2.5"
            : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white px-2"
        }`}
      >
        {isFeedActive && (
          <motion.div
            layoutId="activeFeedTabPill"
            className="absolute inset-0 bg-[#e84a27] rounded-full shadow-xs -z-10 pointer-events-none"
            transition={{ type: "spring", stiffness: 520, damping: 34, mass: 0.5 }}
          />
        )}
        <span className="flex items-center gap-1.5 shrink-0 pointer-events-none">
          <Utensils className="w-4 h-4 shrink-0" />
          <span
            className={`flex items-center gap-1.5 whitespace-nowrap overflow-hidden max-w-[120px] opacity-100`}
          >
            <span className="tracking-tight font-display font-bold">Feed</span>
            {dishesCount > 0 && (
              <span
                className={`text-[10.5px] font-display font-bold tabular-nums px-1.5 py-0.2 rounded-full ${
                  isFeedActive ? "bg-black/15 text-white" : "bg-black/10 text-zinc-600 dark:bg-white/10 dark:text-zinc-300"
                }`}
              >
                {dishesCount}
              </span>
            )}
          </span>
        </span>
      </button>

      {/* Prominent Add (+) Button */}
      <button
        type="button"
        {...makeTapHandlers(openCreateDish)}
        title="Log a Dish"
        aria-label="Log a Dish"
        className="relative z-20 w-8 h-8 rounded-full bg-[#181615] dark:bg-white text-white dark:text-[#181615] flex items-center justify-center shadow-md cursor-pointer shrink-0 outline-none border-0 transition-transform duration-150 ease-out active:scale-90 hover:scale-105 touch-manipulation"
      >
        <Plus className="w-3.5 h-3.5 stroke-[2.4] pointer-events-none" />
      </button>

      {/* 2. Map Tab — expanding accordion pill */}
      <button
        type="button"
        {...makeTapHandlers(handleSelectMap)}
        aria-label="View Map Radar"
        aria-pressed={isMapActive}
        className={`relative z-10 flex items-center justify-center rounded-full text-[12.5px] font-display font-bold cursor-pointer outline-none border-0 select-none transition-[transform,color,background-color] duration-150 ease-out active:scale-[0.93] touch-manipulation h-8 ${
          isMapActive
            ? "text-white px-2.5"
            : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white px-2"
        }`}
      >
        {isMapActive && (
          <motion.div
            layoutId="activeFeedTabPill"
            className="absolute inset-0 bg-[#e84a27] rounded-full shadow-xs -z-10 pointer-events-none"
            transition={{ type: "spring", stiffness: 520, damping: 34, mass: 0.5 }}
          />
        )}
        <span className="flex items-center gap-1.5 shrink-0 pointer-events-none">
          <Compass className="w-4 h-4 shrink-0" />
          <span
            className={`flex items-center gap-1.5 whitespace-nowrap overflow-hidden max-w-[120px] opacity-100`}
          >
            <span className="tracking-tight font-display font-bold">Map</span>
            {spotsCount > 0 && (
              <span
                className={`text-[10.5px] font-display font-bold tabular-nums px-1.5 py-0.2 rounded-full ${
                  isMapActive ? "bg-black/15 text-white" : "bg-black/10 text-zinc-600 dark:bg-white/10 dark:text-zinc-300"
                }`}
              >
                {spotsCount}
              </span>
            )}
          </span>
        </span>
      </button>
    </nav>
  );
}
