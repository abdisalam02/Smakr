"use client";

import React, { useMemo, useState, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import {
  FOOD_GROUPS,
  SPOT_KINDS,
  CUISINES,
  resolveEntityTaxonomy,
  type FoodGroupId,
  type SpotKind,
  type CuisineId,
} from "@/lib/taxonomy";
import { SmakrFoodIcon } from "@/components/food/FoodIcons";
import { useCollapseOnFeedScroll } from "@/hooks/useCollapseOnFeedScroll";
import { isVisibleInFeed } from "@/lib/popupUtils";
import type { DietaryTag } from "@/types";
import {
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Bookmark,
  Sparkles,
} from "lucide-react";

interface FeedFilterBarProps {
  compact?: boolean;
}

export function FeedFilterBar({ compact = false }: FeedFilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSpotTypeOpen, setIsSpotTypeOpen] = useState(false);
  const [isCuisinesOpen, setIsCuisinesOpen] = useState(false);

  // Auto-collapse drawer on feed scroll anywhere
  useCollapseOnFeedScroll({
    threshold: 24,
    isExpanded,
    ignoreSelector: "[data-filter-drawer], [data-filter-bar]",
    onCollapse: () => setIsExpanded(false),
  });

  const filterScrollRef = useRef<HTMLDivElement>(null);
  const isUserTouchingRef = useRef<boolean>(false);
  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);

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
    // User pulls toward the right at the left boundary -> open filters drawer
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

  // Store selections
  const venues = useCityPulseStore((state) => state.venues);
  const foodPosts = useCityPulseStore((state) => state.foodPosts);
  const feedMode = useCityPulseStore((state) => state.feedMode);

  const currentCategory = useCityPulseStore((state) => state.feedCategory);
  const setFeedCategory = useCityPulseStore((state) => state.setFeedCategory);

  const selectedGroup = useCityPulseStore((state) => state.selectedGroup);
  const setSelectedGroup = useCityPulseStore((state) => state.setSelectedGroup);

  const selectedDishCategory = useCityPulseStore((state) => state.selectedDishCategory);
  const setSelectedDishCategory = useCityPulseStore((state) => state.setSelectedDishCategory);

  const selectedSpotKind = useCityPulseStore((state) => state.selectedSpotKind);
  const setSelectedSpotKind = useCityPulseStore((state) => state.setSelectedSpotKind);

  const selectedCuisine = useCityPulseStore((state) => state.selectedCuisine);
  const setSelectedCuisine = useCityPulseStore((state) => state.setSelectedCuisine);

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
  const currentUser = useCityPulseStore((state) => state.currentUser);
  const setFilters = useCityPulseStore((state) => state.setFilters);
  const resetAllFilters = useCityPulseStore((state) => state.resetAllFilters);

  // Derive counts per parent group on full dataset (venues in places mode, posts in food mode)
  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const group of FOOD_GROUPS) {
      counts[group.id] = 0;
    }

    if (feedMode === "places") {
      for (const venue of venues) {
        if (!isVisibleInFeed(venue)) continue;
        const tax = resolveEntityTaxonomy(venue);
        counts[tax.group.id] = (counts[tax.group.id] || 0) + 1;
      }
    } else {
      const venueMap = new Map(venues.map((v) => [v.id, v]));
      for (const post of foodPosts) {
        if (currentUser?.role !== "admin") {
          if (post.is_published === false || post.is_archived === true) continue;
        }
        const linkedVenue = venueMap.get(post.spot_id);
        if (!isVisibleInFeed(linkedVenue)) continue;
        const tax = resolveEntityTaxonomy(linkedVenue, post);
        counts[tax.group.id] = (counts[tax.group.id] || 0) + 1;
      }
    }

    return counts;
  }, [venues, foodPosts, feedMode, currentUser]);

  // Total items count
  const totalItemCount = useMemo(() => {
    if (feedMode === "places") {
      return venues.filter((v) => isVisibleInFeed(v)).length;
    }
    const venueMap = new Map(venues.map((v) => [v.id, v]));
    return foodPosts.filter((p) => {
      if (currentUser?.role !== "admin") {
        if (p.is_published === false || p.is_archived === true) return false;
      }
      return isVisibleInFeed(venueMap.get(p.spot_id));
    }).length;
  }, [venues, foodPosts, feedMode, currentUser]);

  // Non-empty parent groups sorted by count descending, then alphabetical
  const nonZeroGroups = useMemo(() => {
    return FOOD_GROUPS.filter((g) => (groupCounts[g.id] || 0) > 0).sort((a, b) => {
      const diff = (groupCounts[b.id] || 0) - (groupCounts[a.id] || 0);
      if (diff !== 0) return diff;
      return a.label.localeCompare(b.label);
    });
  }, [groupCounts]);

  // Active filter count
  const activeExtraFiltersCount = useMemo(() => {
    return (
      (selectedGroup ? 1 : 0) +
      (selectedDishCategory ? 1 : 0) +
      (selectedSpotKind ? 1 : 0) +
      (selectedCuisine ? 1 : 0) +
      (spotTypeFilter && spotTypeFilter !== "all" ? 1 : 0) +
      (priceTierFilter ? 1 : 0) +
      (staffPicksOnly ? 1 : 0) +
      (savedOnly ? 1 : 0) +
      (openNow ? 1 : 0) +
      selectedDietary.length
    );
  }, [
    selectedGroup,
    selectedDishCategory,
    selectedSpotKind,
    selectedCuisine,
    spotTypeFilter,
    priceTierFilter,
    staffPicksOnly,
    savedOnly,
    openNow,
    selectedDietary,
  ]);

  const hasAnyActiveFilter =
    activeExtraFiltersCount > 0 || currentCategory !== "all";

  const handleSelectAll = () => {
    resetAllFilters();
    setSelectedGroup(null);
    setSelectedDishCategory(null);
    setSelectedSpotKind(null);
    setSelectedCuisine(null);
    setFeedCategory("all");
    setSpotTypeFilter("all");
    setFilters({ saved_only: false });
    filterScrollRef.current?.scrollTo({ left: 0, behavior: "smooth" });
  };

  const handleSelectSaved = () => {
    if (savedOnly) {
      handleSelectAll();
    } else {
      setSelectedGroup(null);
      setSelectedDishCategory(null);
      setSelectedSpotKind(null);
      setSelectedCuisine(null);
      setFeedCategory("all");
      setSpotTypeFilter("all");
      setFilters({ saved_only: true });
    }
  };

  const handleSelectGroup = (groupId: FoodGroupId | null) => {
    if (selectedGroup === groupId) {
      handleSelectAll();
    } else {
      // Clear spot kind (e.g. Pop-up) and saved filter when switching to a category group
      setSelectedSpotKind(null);
      setSpotTypeFilter("all");
      setFilters({ saved_only: false });
      setSelectedGroup(groupId);
      setSelectedDishCategory(null);
      setFeedCategory("all");
    }
  };

  const handleSelectChildCategory = (childCat: string) => {
    if (selectedDishCategory === childCat) {
      setSelectedDishCategory(null);
      setFeedCategory("all");
    } else {
      setSelectedDishCategory(childCat);
      setFeedCategory("all");
    }
  };

  const handleSelectSpotKind = (kind: SpotKind) => {
    if (selectedSpotKind === kind) {
      handleSelectAll();
    } else {
      // Clear category groups and saved filter when selecting a quick spot-kind pill like Pop-ups
      setSelectedGroup(null);
      setSelectedDishCategory(null);
      setFeedCategory("all");
      setFilters({ saved_only: false });
      setSelectedSpotKind(kind);
      setSpotTypeFilter(kind === "popup" ? "popup" : kind === "food_truck" ? "food_truck" : "restaurant");
    }
  };

  const handleSelectCuisine = (cuisineId: CuisineId) => {
    setSelectedCuisine(selectedCuisine === cuisineId ? null : cuisineId);
  };

  // Find currently selected group definition
  const activeGroupDef = useMemo(() => {
    return FOOD_GROUPS.find((g) => g.id === selectedGroup) || null;
  }, [selectedGroup]);

  return (
    <div data-filter-bar className="w-full max-w-full min-w-0 bg-transparent border-b border-black/[0.06] dark:border-white/[0.08]">
      {/* ── TOP HORIZONTAL STRIP (W1–W3: Non-empty only, count desc, short & honest) ── */}
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
        {/* [ ⚡ Filters ▾ ] Trigger with active badge (stays clean neutral; never turns black) */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-label="Toggle filter drawer"
          className={`snap-start shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors select-none active:scale-95 cursor-pointer ${
            isExpanded
              ? "bg-zinc-100 dark:bg-white/15 text-zinc-900 dark:text-white border-zinc-300 dark:border-white/30 shadow-xs"
              : "bg-white dark:bg-white/10 text-zinc-800 dark:text-zinc-200 border-zinc-200/80 dark:border-white/15 hover:bg-zinc-100 dark:hover:bg-white/15"
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filters</span>
          {activeExtraFiltersCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#e84a27] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
              {activeExtraFiltersCount}
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 opacity-70" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          )}
        </button>

        {/* 'All' Base Pill (Shares smooth active layoutId sliding pill) */}
        {(() => {
          const isAllActive =
            !selectedGroup &&
            (currentCategory === "all" || !currentCategory) &&
            !selectedSpotKind &&
            !savedOnly &&
            selectedDietary.length === 0;
          return (
            <button
              key="filter-pill-all"
              type="button"
              onClick={handleSelectAll}
              className="relative snap-start shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-zinc-200/70 dark:border-white/10 select-none active:scale-95 cursor-pointer bg-white/80 dark:bg-white/5 text-zinc-700 dark:text-zinc-200 transition-colors duration-200"
            >
              {isAllActive && (
                <motion.div
                  layoutId="feed-filter-active-pill"
                  className="absolute inset-0 rounded-full bg-[#e84a27] shadow-xs"
                  transition={{ type: "spring", stiffness: 320, damping: 28, mass: 0.8 }}
                />
              )}
              <span className={`relative z-10 flex items-center gap-1.5 transition-colors duration-200 ${isAllActive ? "text-white font-bold" : "font-medium text-zinc-700 dark:text-zinc-200"}`}>
                <SmakrFoodIcon name="all" className="w-3.5 h-3.5 shrink-0" monochrome={isAllActive} />
                <span>All</span>
                <span className={`text-[10px] font-mono ${isAllActive ? "text-white/90" : "text-zinc-400"}`}>
                  ({totalItemCount})
                </span>
              </span>
            </button>
          );
        })()}

        {/* Saved (N) Pill (Visible only when user has saved spots) */}
        {savedPostIds.size > 0 && (
          <button
            key="filter-pill-saved"
            type="button"
            onClick={handleSelectSaved}
            className="relative snap-start shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-zinc-200/70 dark:border-white/10 select-none active:scale-95 cursor-pointer bg-white/80 dark:bg-white/5 text-zinc-700 dark:text-zinc-200 transition-colors duration-200"
          >
            {savedOnly && (
              <motion.div
                layoutId="feed-filter-active-pill"
                className="absolute inset-0 rounded-full bg-[#e84a27] shadow-xs"
                transition={{ type: "spring", stiffness: 320, damping: 28, mass: 0.8 }}
              />
            )}
            <span
              className={`relative z-10 flex items-center gap-1.5 transition-colors duration-200 ${
                savedOnly ? "text-white font-bold" : "font-medium text-zinc-700 dark:text-zinc-200"
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${savedOnly ? "fill-white" : ""}`} />
              <span>Saved</span>
              <span className={`text-[10px] font-mono ${savedOnly ? "text-white/90" : "text-zinc-400"}`}>
                ({savedPostIds.size})
              </span>
            </span>
          </button>
        )}

        {/* Pop-ups Quick Pill (Only if popup items exist) */}
        {venues.some((v) => v.spot_type === "popup" || v.spot_type === "pop_up") && (() => {
          const isPopupActive = selectedSpotKind === "popup";
          return (
            <button
              key="filter-pill-popup"
              type="button"
              onClick={() => handleSelectSpotKind("popup")}
              className="relative snap-start shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border border-zinc-200/70 dark:border-white/10 select-none active:scale-95 cursor-pointer bg-white/80 dark:bg-white/5 text-zinc-700 dark:text-zinc-200 transition-colors duration-200"
            >
              {isPopupActive && (
                <motion.div
                  layoutId="feed-filter-active-pill"
                  className="absolute inset-0 rounded-full bg-[#e84a27] shadow-xs"
                  transition={{ type: "spring", stiffness: 320, damping: 28, mass: 0.8 }}
                />
              )}
              <span className={`relative z-10 flex items-center gap-1 transition-colors duration-200 ${isPopupActive ? "text-white font-bold" : "font-medium text-zinc-700 dark:text-zinc-200"}`}>
                <SmakrFoodIcon name="popup" className="w-3.5 h-3.5 shrink-0" monochrome={isPopupActive} />
                <span>Pop-ups</span>
              </span>
            </button>
          );
        })()}

        {/* Non-empty Parent Group Pills (Shared layoutId active pill gliding smoothly) */}
        {nonZeroGroups.map((group) => {
          const isSelected = selectedGroup === group.id;
          const count = groupCounts[group.id] || 0;

          return (
            <button
              key={group.id}
              type="button"
              onClick={() => handleSelectGroup(group.id)}
              className="relative snap-start shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border border-zinc-200/70 dark:border-white/10 select-none active:scale-95 cursor-pointer bg-white/80 dark:bg-white/5 text-zinc-700 dark:text-zinc-200 transition-colors duration-200"
            >
              {isSelected && (
                <motion.div
                  layoutId="feed-filter-active-pill"
                  className="absolute inset-0 rounded-full bg-[#e84a27] shadow-xs"
                  transition={{ type: "spring", stiffness: 320, damping: 28, mass: 0.8 }}
                />
              )}
              <span className={`relative z-10 flex items-center gap-1.5 transition-colors duration-200 ${isSelected ? "text-white font-bold" : "font-medium text-zinc-700 dark:text-zinc-200"}`}>
                <SmakrFoodIcon
                  name={group.id}
                  className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "brightness-0 invert" : ""}`}
                />
                <span className="tracking-tight whitespace-nowrap">{group.shortLabel}</span>
                <span className={`text-[10px] font-mono ${isSelected ? "text-white/90" : "text-zinc-400"}`}>
                  ({count})
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* ── EXPANDED FILTER DRAWER (W4–W8: Large icon slider, subcategories, diet & spot kinds) ── */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="smakr-filter-drawer"
            data-filter-drawer="true"
            initial={{ height: 0, opacity: 0, y: -4 }}
            animate={{ height: "auto", opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -4 }}
            transition={{ type: "spring", stiffness: 380, damping: 32, mass: 0.65 }}
            className="w-full overflow-hidden border-t border-black/[0.06] dark:border-white/[0.08] bg-[#FAF7F2] dark:bg-[#151413]"
          >
            <div className="px-3.5 py-3 space-y-3.5">
              {/* Header: Title, Active Count & Reset */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-comico uppercase tracking-wider text-[#181615] dark:text-white">
                    Filter by Craving & Spot
                  </span>
                  {activeExtraFiltersCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#e84a27] text-white text-[10px] font-bold">
                      {activeExtraFiltersCount} active
                    </span>
                  )}
                </div>

                {hasAnyActiveFilter && (
                  <button
                    type="button"
                    onClick={() => {
                      resetAllFilters();
                      setSelectedGroup(null);
                      setSelectedDishCategory(null);
                      setSelectedSpotKind(null);
                      setSelectedCuisine(null);
                    }}
                    className="flex items-center gap-1 text-[11px] text-[#e84a27] hover:underline font-bold transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              {/* ── SECTION 1: Large Parent Group Slider (W4 & W6) ── */}
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Food Categories (Tap to explore dishes)
                </div>
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 snap-x">
                  {FOOD_GROUPS.map((group) => {
                    const isSelected = selectedGroup === group.id;
                    const count = groupCounts[group.id] || 0;

                    return (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => handleSelectGroup(group.id)}
                        className={`snap-start shrink-0 w-[68px] sm:w-[74px] p-2 rounded-2xl flex flex-col items-center justify-center gap-1 border transition-all active:scale-95 cursor-pointer ${
                          isSelected
                            ? "bg-[#e84a27] text-white border-[#e84a27] shadow-md ring-2 ring-[#e84a27]/30"
                            : count > 0
                            ? "bg-white dark:bg-white/5 text-zinc-800 dark:text-zinc-200 border-zinc-200/80 dark:border-white/10 hover:border-[#e84a27]/50"
                            : "bg-zinc-100/60 dark:bg-white/5 text-zinc-400 border-zinc-200/40 opacity-50"
                        }`}
                      >
                        <div className="w-10 h-10 flex items-center justify-center">
                          <SmakrFoodIcon
                            name={group.id}
                            className={`w-9 h-9 object-contain ${isSelected ? "brightness-0 invert" : ""}`}
                          />
                        </div>
                        <span className="text-[10.5px] font-bold text-center leading-tight line-clamp-1">
                          {group.shortLabel}
                        </span>
                        <span
                          className={`text-[9.5px] font-mono ${
                            isSelected ? "text-white/90" : "text-zinc-400"
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── SECTION 2: Sub-Categories Reveal (W13) ── */}
              <AnimatePresence>
                {activeGroupDef && activeGroupDef.childCategories.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden bg-white/70 dark:bg-white/5 p-2.5 rounded-2xl border border-[#e84a27]/20"
                  >
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#e84a27] mb-1.5 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>{activeGroupDef.label} Dishes:</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {activeGroupDef.childCategories.map((child) => {
                        const isChildActive = selectedDishCategory === child;
                        const label = child
                          .split("_")
                          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                          .join(" ");

                        return (
                          <button
                            key={child}
                            type="button"
                            onClick={() => handleSelectChildCategory(child)}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border flex items-center gap-1 transition-all active:scale-95 cursor-pointer ${
                              isChildActive
                                ? "bg-[#e84a27] text-white border-[#e84a27] shadow-xs"
                                : "bg-white dark:bg-stone-800 text-zinc-700 dark:text-zinc-200 border-zinc-200/80 dark:border-white/10 hover:border-[#e84a27]/40"
                            }`}
                          >
                            <SmakrFoodIcon name={child} className={`w-3.5 h-3.5 shrink-0 ${isChildActive ? "brightness-0 invert" : ""}`} />
                            <span>{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── SECTION 3: Dietary Badges (Directly Visible) ── */}
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Dietary Preferences
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                  {(["halal", "vegan", "vegetarian", "gluten_free", "spicy"] as const).map((diet) => {
                    const isActive = selectedDietary.includes(diet);
                    const dietLabels: Record<DietaryTag, string> = {
                      halal: "Halal",
                      vegan: "Vegan",
                      vegetarian: "Vegetarian",
                      gluten_free: "Gluten-Free",
                      spicy: "Spicy",
                    };

                    return (
                      <button
                        key={diet}
                        type="button"
                        onClick={() => toggleDietary(diet)}
                        className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                          isActive
                            ? "bg-[#4E8752] text-white border-[#4E8752] shadow-xs"
                            : "bg-white dark:bg-white/5 text-zinc-700 dark:text-zinc-200 border-zinc-200/80 dark:border-white/10 hover:border-[#4E8752]/40"
                        }`}
                      >
                        <SmakrFoodIcon name={diet} className="w-3.5 h-3.5 shrink-0" monochrome={isActive} />
                        <span>{dietLabels[diet]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── SECTION 4: Spot Type Dropdown (Toggles Horizontal Slider) ── */}
              <div className="rounded-2xl border border-zinc-200/70 dark:border-white/10 bg-white/60 dark:bg-white/5 overflow-hidden transition-all">
                <button
                  type="button"
                  onClick={() => setIsSpotTypeOpen(!isSpotTypeOpen)}
                  className="w-full px-3 py-2 flex items-center justify-between text-left cursor-pointer active:scale-[0.99] transition-transform select-none"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Spot Type (Venue Kind)
                    </span>
                    {selectedSpotKind && (
                      <span className="px-2 py-0.5 rounded-full bg-[#e84a27] text-white text-[10px] font-bold">
                        {SPOT_KINDS.find((s) => s.id === selectedSpotKind)?.shortLabel || selectedSpotKind}
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
                      isSpotTypeOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isSpotTypeOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="overflow-hidden border-t border-zinc-200/60 dark:border-white/10 p-2.5 pt-2"
                    >
                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                        {SPOT_KINDS.filter((spot) => spot.id !== "street_stall").map((spot) => {
                          const isActive = selectedSpotKind === spot.id;
                          return (
                            <button
                              key={spot.id}
                              type="button"
                              onClick={() => handleSelectSpotKind(spot.id)}
                              className={`shrink-0 min-h-[42px] px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                                isActive
                                  ? "bg-[#181615] dark:bg-white text-white dark:text-[#181615] border-[#181615] dark:border-white shadow-xs"
                                  : "bg-white dark:bg-white/5 text-zinc-700 dark:text-zinc-200 border-zinc-200/80 dark:border-white/10 hover:border-zinc-400"
                              }`}
                            >
                              <SmakrFoodIcon name={spot.id} className="w-4 h-4 shrink-0" monochrome={isActive} />
                              <span>{spot.shortLabel}</span>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── SECTION 5: Regional Cuisines Dropdown (Toggles Horizontal Slider) ── */}
              <div className="rounded-2xl border border-zinc-200/70 dark:border-white/10 bg-white/60 dark:bg-white/5 overflow-hidden transition-all">
                <button
                  type="button"
                  onClick={() => setIsCuisinesOpen(!isCuisinesOpen)}
                  className="w-full px-3 py-2 flex items-center justify-between text-left cursor-pointer active:scale-[0.99] transition-transform select-none"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Regional Cuisines
                    </span>
                    {selectedCuisine && (
                      <span className="px-2 py-0.5 rounded-full bg-[#e84a27] text-white text-[10px] font-bold">
                        {CUISINES.find((c) => c.id === selectedCuisine)?.label || selectedCuisine}
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
                      isCuisinesOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isCuisinesOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="overflow-hidden border-t border-zinc-200/60 dark:border-white/10 p-2.5 pt-2"
                    >
                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                        {CUISINES.map((cuisine) => {
                          const isActive = selectedCuisine === cuisine.id;
                          return (
                            <button
                              key={cuisine.id}
                              type="button"
                              onClick={() => handleSelectCuisine(cuisine.id)}
                              className={`shrink-0 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                                isActive
                                  ? "bg-[#e84a27] text-white border-[#e84a27] font-bold shadow-xs"
                                  : "bg-white dark:bg-white/5 text-zinc-700 dark:text-zinc-200 border-zinc-200/80 dark:border-white/10 hover:border-[#e84a27]/30"
                              }`}
                            >
                              <SmakrFoodIcon name={cuisine.glyph} className="w-3.5 h-3.5 shrink-0" monochrome={isActive} />
                              <span>{cuisine.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── SECTION 6: Quick Status & Price Tiers ── */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-black/[0.06] dark:border-white/[0.08]">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFilters({ open_now: !openNow })}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                      openNow
                        ? "bg-[#4E8752] text-white border-[#4E8752] font-bold shadow-xs"
                        : "bg-white dark:bg-white/5 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/10"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-current" />
                    <span>Open Now</span>
                  </button>

                  <button
                    type="button"
                    onClick={toggleStaffPicksOnly}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
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
                          className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
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
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
