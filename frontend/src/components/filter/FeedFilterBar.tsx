"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { DietaryTag, FoodCategory, SpotType } from "@/types";
import { ChevronDown, ChevronUp, SlidersHorizontal, RotateCcw, Bookmark } from "lucide-react";
import {
  SmakrFoodIcon,
  TicketStubIcon,
  StorefrontIcon,
  FoodTruckIcon,
} from "@/components/food/FoodIcons";

type Pill =
  | { kind: "category"; id: FoodCategory; label: string }
  | { kind: "dietary"; id: DietaryTag; label: string };

const PILLS: Pill[] = [
  { kind: "category", id: "all", label: "All" },
  { kind: "category", id: "dumplings", label: "Dumplings" },
  { kind: "category", id: "coffee", label: "Coffee & Drinks" },
  { kind: "category", id: "matcha", label: "Matcha" },
  { kind: "category", id: "bakery", label: "Bakeries" },
  { kind: "category", id: "sourdough", label: "Sourdough" },
  { kind: "category", id: "ramen", label: "Ramen" },
  { kind: "category", id: "tacos", label: "Tacos" },
  { kind: "category", id: "boba", label: "Boba" },
  { kind: "category", id: "pasta", label: "Pasta" },
  { kind: "category", id: "burger", label: "Burgers" },
  { kind: "category", id: "fried_chicken", label: "Fried Chicken" },
  { kind: "category", id: "kbbq", label: "Korean BBQ" },
  { kind: "category", id: "kebab", label: "Kebab" },
  { kind: "category", id: "vietnamese", label: "Vietnamese" },
  { kind: "category", id: "indian", label: "Indian" },
  { kind: "dietary", id: "vegan", label: "Vegan" },
  { kind: "dietary", id: "halal", label: "Halal" },
  { kind: "dietary", id: "gluten_free", label: "Gluten-Free" },
  { kind: "category", id: "pizza", label: "Pizza" },
  { kind: "category", id: "nordic_seafood", label: "Nordic Seafood" },
  { kind: "category", id: "street_food", label: "Street Food" },
  { kind: "category", id: "sushi", label: "Sushi" },
  { kind: "category", id: "brunch", label: "Brunch" },
  { kind: "category", id: "gelato", label: "Gelato" },
  { kind: "category", id: "dessert", label: "Sweets" },
  { kind: "category", id: "drinks", label: "Bars" },
  { kind: "category", id: "natural_wine", label: "Natural Wine" },
];

const CUISINES: { id: FoodCategory; label: string }[] = [
  { id: "dumplings", label: "Dumplings" },
  { id: "bao", label: "Bao" },
  { id: "ramen", label: "Ramen" },
  { id: "tacos", label: "Tacos" },
  { id: "pizza", label: "Pizza" },
  { id: "burger", label: "Burgers" },
  { id: "fried_chicken", label: "Fried Chicken" },
  { id: "kbbq", label: "Korean BBQ" },
  { id: "kebab", label: "Kebab" },
  { id: "vietnamese", label: "Vietnamese" },
  { id: "indian", label: "Indian" },
  { id: "bakery", label: "Bakery" },
  { id: "sourdough", label: "Sourdough" },
  { id: "coffee", label: "Coffee" },
  { id: "matcha", label: "Matcha" },
  { id: "boba", label: "Boba" },
  { id: "sushi", label: "Sushi" },
  { id: "nordic_seafood", label: "Nordic Seafood" },
  { id: "pasta", label: "Pasta" },
  { id: "brunch", label: "Brunch" },
  { id: "gelato", label: "Gelato" },
  { id: "dessert", label: "Dessert" },
  { id: "drinks", label: "Bars" },
  { id: "natural_wine", label: "Natural Wine" },
];

interface FeedFilterBarProps {
  compact?: boolean;
}

export function FeedFilterBar({ compact = false }: FeedFilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const filterScrollRef = React.useRef<HTMLDivElement>(null);
  const isUserTouchingRef = React.useRef<boolean>(false);
  const touchStartXRef = React.useRef<number>(0);
  const touchStartYRef = React.useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    isUserTouchingRef.current = true;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    isUserTouchingRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const el = filterScrollRef.current;
    if (!el) return;
    const deltaX = e.touches[0].clientX - touchStartXRef.current;
    const deltaY = Math.abs(e.touches[0].clientY - touchStartYRef.current);
    // User pulls/flings to the right while at the left boundary -> open filters accordion
    if (el.scrollLeft <= 5 && deltaX > 30 && deltaY < 30) {
      if (!isExpanded) setIsExpanded(true);
    }
  };

  const handleFilterScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (isUserTouchingRef.current && el.scrollLeft <= 4 && !isExpanded) {
      setIsExpanded(true);
    }
  };

  // Collapse the drawer once the feed scrolls, same behaviour as the Smakr Pick capsule.
  React.useEffect(() => {
    if (!isExpanded) return;
    const onScroll = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (t && t.hasAttribute && t.hasAttribute("data-feed-scroll") && t.scrollTop > 40) {
        setIsExpanded(false);
      }
    };
    document.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => document.removeEventListener("scroll", onScroll, { capture: true });
  }, [isExpanded]);

  const currentCategory = useCityPulseStore((state) => state.feedCategory);
  const setFeedCategory = useCityPulseStore((state) => state.setFeedCategory);
  const selectedDietary = useCityPulseStore((state) => state.selectedDietary);
  const toggleDietary = useCityPulseStore((state) => state.toggleDietary);

  const spotTypeFilter = useCityPulseStore((state) => state.filters.spot_type);
  const setSpotTypeFilter = useCityPulseStore((state) => state.setSpotTypeFilter);

  const priceTierFilter = useCityPulseStore((state) => state.filters.price_tier);
  const setPriceTierFilter = useCityPulseStore((state) => state.setPriceTierFilter);

  const staffPicksOnly = useCityPulseStore((state) => state.filters.staff_picks_only);
  const toggleStaffPicksOnly = useCityPulseStore((state) => state.toggleStaffPicksOnly);

  const savedOnly = useCityPulseStore((state) => state.filters.saved_only);
  const toggleSavedOnly = useCityPulseStore((state) => state.toggleSavedOnly);
  const savedPostIds = useCityPulseStore((state) => state.savedPostIds);

  const openNow = useCityPulseStore((state) => state.filters.open_now);
  const setFilters = useCityPulseStore((state) => state.setFilters);
  const resetFilters = useCityPulseStore((state) => state.resetFilters);

  // Active filters count (excluding category all)
  const activeExtraFiltersCount =
    (spotTypeFilter && spotTypeFilter !== "all" ? 1 : 0) +
    (priceTierFilter ? 1 : 0) +
    (staffPicksOnly ? 1 : 0) +
    (savedOnly ? 1 : 0) +
    (openNow ? 1 : 0) +
    selectedDietary.length;

  const hasAnyActiveFilter =
    activeExtraFiltersCount > 0 || currentCategory !== "all";

  const handleResetAll = () => {
    resetFilters();
    setFeedCategory("all");
    setSpotTypeFilter("all");
    setPriceTierFilter(null);
  };

  return (
    <div className="w-full max-w-full min-w-0 bg-transparent border-b border-black/[0.06] dark:border-white/[0.08]">
      {/* Horizontal Pill Row with Inline Trigger */}
      <div
        ref={filterScrollRef}
        onScroll={handleFilterScroll}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`w-full max-w-full overflow-x-auto no-scrollbar px-3 snap-x snap-mandatory flex items-center gap-1.5 ${
          compact ? "py-1.5" : "py-2"
        }`}
      >
        {/* [ ⚡ Filters ▾ ] Accordion Toggle Pill with snap-start */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          className={`snap-start shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all select-none active:scale-95 ${
            isExpanded || activeExtraFiltersCount > 0
              ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-zinc-950 dark:border-white shadow-xs"
              : "bg-white dark:bg-white/10 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-white/15 hover:bg-zinc-100 dark:hover:bg-white/15"
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filters</span>
          {activeExtraFiltersCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#e84a27] text-white text-[10px] font-bold flex items-center justify-center">
              {activeExtraFiltersCount}
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 opacity-70" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          )}
        </button>

        {/* Horizontal Category & Dietary Pills */}
        <div className="flex items-center gap-1.5 min-w-max">
          {/* Functional Saved (N) Hit-List Filter Pill */}
          <button
            type="button"
            onClick={() => {
              if (spotTypeFilter === "popup") setSpotTypeFilter("all");
              toggleSavedOnly();
            }}
            aria-pressed={Boolean(savedOnly)}
            className={`snap-start shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors duration-100 select-none active:scale-95 ${
              savedOnly
                ? "text-white border-transparent font-semibold shadow-xs bg-[#e84a27]"
                : "bg-white/80 dark:bg-white/5 text-zinc-600 dark:text-zinc-300 border-zinc-200/70 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 hover:text-zinc-900 dark:hover:text-white font-medium"
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${savedOnly ? "fill-white text-white" : "text-amber-500 fill-amber-500/20"}`} />
            <span className="tracking-tight whitespace-nowrap">
              Saved{savedPostIds.size > 0 ? ` (${savedPostIds.size})` : ""}
            </span>
          </button>

          {/* First-Class Pop-ups & Residencies Channel Pill */}
          <button
            type="button"
            onClick={() => {
              if (savedOnly) toggleSavedOnly();
              if (spotTypeFilter === "popup") {
                setSpotTypeFilter("all");
              } else {
                // Clear any specific category when turning Pop-ups on
                setFeedCategory("all");
                setSpotTypeFilter("popup");
              }
            }}
            aria-pressed={spotTypeFilter === "popup"}
            className={`snap-start shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors duration-100 select-none active:scale-95 ${
              spotTypeFilter === "popup"
                ? "text-white border-transparent font-bold shadow-xs bg-[#e84a27]"
                : "bg-white/80 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 border-zinc-200/70 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 hover:text-zinc-900 dark:hover:text-white font-medium"
            }`}
          >
            <TicketStubIcon className={`w-3.5 h-3.5 ${spotTypeFilter === "popup" ? "text-white" : "text-[#e84a27]"}`} />
            <span className="tracking-tight whitespace-nowrap font-comico text-[11px] tracking-wide">Pop-ups</span>
          </button>

          {PILLS.map((pill) => {
            const isActive =
              !savedOnly &&
              (pill.kind === "category"
                ? currentCategory === pill.id
                : selectedDietary.includes(pill.id));

            return (
              <button
                key={`${pill.kind}-${pill.id}`}
                onClick={() => {
                  if (savedOnly) toggleSavedOnly();
                  // When clicking any category, clear the popup filter
                  if (spotTypeFilter === "popup") {
                    setSpotTypeFilter("all");
                  }
                  if (pill.kind === "category") {
                    if (pill.id === "all") {
                      setFeedCategory("all");
                    } else {
                      setFeedCategory(currentCategory === pill.id ? "all" : pill.id);
                    }
                  } else {
                    toggleDietary(pill.id);
                  }
                }}
                aria-pressed={isActive}
                className={`snap-start shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors duration-100 select-none active:scale-95 ${
                  isActive
                    ? "text-white border-transparent font-semibold shadow-xs"
                    : "bg-white/80 dark:bg-white/5 text-zinc-600 dark:text-zinc-300 border-zinc-200/70 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 hover:text-zinc-900 dark:hover:text-white font-medium"
                }`}
                style={isActive ? { backgroundColor: "#e84a27" } : undefined}
              >
                <SmakrFoodIcon
                  name={pill.id}
                  className="w-3.5 h-3.5 shrink-0"
                  monochrome={isActive}
                />
                <span className="tracking-tight whitespace-nowrap">{pill.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Compact Animated Inline Filter Drawer (<155px height, never hidden by bottom nav) */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="w-full overflow-hidden border-t border-black/[0.06] dark:border-white/[0.08] bg-[#f7f4ed]/98 dark:bg-[#151413]/98"
          >
            <div className="px-3.5 py-2.5 space-y-2">
              {/* Row 1: Quick Status & Price Tier + Reset */}
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFilters({ open_now: !openNow })}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border flex items-center gap-1 transition-all active:scale-95 ${
                      openNow
                        ? "bg-[#4E8752] text-white border-[#4E8752] font-bold shadow-xs"
                        : "bg-white dark:bg-white/5 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/10"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    <span>Open Now</span>
                  </button>

                  <button
                    type="button"
                    onClick={toggleStaffPicksOnly}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border flex items-center gap-1 transition-all active:scale-95 ${
                      staffPicksOnly
                        ? "bg-[#e84a27] text-white border-[#e84a27] font-bold shadow-xs"
                        : "bg-white dark:bg-white/5 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/10"
                    }`}
                  >
                    <span>✦</span>
                    <span>Smakr Picks</span>
                  </button>

                  {/* Price Tier Segmented Pill */}
                  <div className="flex items-center gap-0.5 bg-white dark:bg-white/5 p-0.5 rounded-full border border-zinc-200 dark:border-white/10">
                    {(["$", "$$", "$$$"] as const).map((tier) => {
                      const isActive = priceTierFilter === tier;
                      return (
                        <button
                          key={tier}
                          type="button"
                          onClick={() => setPriceTierFilter(isActive ? null : tier)}
                          className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold transition-all ${
                            isActive
                              ? "bg-[#181615] dark:bg-white text-white dark:text-zinc-950 shadow-xs"
                              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                          }`}
                          title={`Price range ${tier}`}
                        >
                          {tier}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {hasAnyActiveFilter && (
                  <button
                    type="button"
                    onClick={handleResetAll}
                    className="flex items-center gap-1 text-[11px] text-[#e84a27] hover:underline font-bold transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              {/* Row 2: Spot Format */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 shrink-0 mr-0.5">
                  Spot
                </span>
                {[
                  { id: "all" as const, label: "All", icon: "all" },
                  { id: "restaurant" as const, label: "Sit-down", icon: "storefront" },
                  { id: "food_truck" as const, label: "Food Truck", icon: "food_truck" },
                  { id: "popup" as const, label: "Pop-ups", icon: "popup" },
                ].map((st) => {
                  const isActive = (spotTypeFilter || "all") === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setSpotTypeFilter(isActive && st.id !== "all" ? "all" : st.id)}
                      className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium border flex items-center gap-1 transition-all active:scale-95 ${
                        isActive
                          ? "bg-[#e84a27] text-white border-[#e84a27] font-bold shadow-xs"
                          : "bg-white dark:bg-white/5 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/10"
                      }`}
                    >
                      <SmakrFoodIcon name={st.icon} className="w-3 h-3 shrink-0" monochrome={isActive} />
                      <span>{st.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Row 3: Dietary Tags */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 shrink-0 mr-0.5">
                  Diet
                </span>
                {[
                  { id: "halal" as const, label: "Halal" },
                  { id: "vegan" as const, label: "Vegan" },
                  { id: "vegetarian" as const, label: "Vegetarian" },
                  { id: "gluten_free" as const, label: "Gluten-Free" },
                ].map((d) => {
                  const isActive = selectedDietary.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDietary(d.id)}
                      className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium border flex items-center gap-1 transition-all active:scale-95 ${
                        isActive
                          ? "bg-[#4E8752] text-white border-[#4E8752] font-bold shadow-xs"
                          : "bg-white dark:bg-white/5 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/10"
                      }`}
                    >
                      <SmakrFoodIcon name={d.id} className="w-3 h-3 shrink-0" monochrome={isActive} />
                      <span>{d.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
