"use client";

import React, { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  const drawerCategoriesScrollRef = useRef<HTMLDivElement>(null);

  // Exact Top-Strip "Left Yoink" dual-trigger glitch (both open and close)
  const lastYoinkAtRef = useRef<number>(0);
  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);
  const touchStartScrollLeftRef = useRef<number>(0);
  const isTouchingStripRef = useRef<boolean>(false);
  const hasYoinkedThisTouchRef = useRef<boolean>(false);

  const triggerYoinkToggle = useCallback(() => {
    const now = Date.now();
    if (now - lastYoinkAtRef.current < 420) return; // debounce so it toggles cleanly once per gesture
    lastYoinkAtRef.current = now;
    hasYoinkedThisTouchRef.current = true;
    setIsExpanded((prev) => !prev);
  }, []);

  const handleStripTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    isTouchingStripRef.current = true;
    hasYoinkedThisTouchRef.current = false;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    touchStartScrollLeftRef.current = el.scrollLeft;
  };

  const handleStripTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isTouchingStripRef.current || hasYoinkedThisTouchRef.current) return;
    const el = e.currentTarget;
    const deltaX = e.touches[0].clientX - touchStartXRef.current;
    const deltaY = Math.abs(e.touches[0].clientY - touchStartYRef.current);

    // Trigger if user pulls rightward (deltaX > 18) while at/near the left edge (scrollLeft <= 10)
    if (el.scrollLeft <= 10 && deltaX > 18 && deltaY < 30) {
      triggerYoinkToggle();
    }
  };

  const handleStripScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    // Original "glitch" behavior: if user was scrolled right (touchStartScrollLeft > 12)
    // and drags/scrolls all the way back into the left edge (scrollLeft <= 3) while touching:
    if (
      isTouchingStripRef.current &&
      !hasYoinkedThisTouchRef.current &&
      touchStartScrollLeftRef.current > 12 &&
      el.scrollLeft <= 3
    ) {
      triggerYoinkToggle();
    }
  };

  const handleStripTouchEnd = () => {
    isTouchingStripRef.current = false;
    hasYoinkedThisTouchRef.current = false;
  };

  // Imperative 120fps drag-to-close engine (0 React re-renders during drag, 1:1 feed pull)
  const drawerClipRef = useRef<HTMLDivElement>(null);
  const drawerSheetRef = useRef<HTMLDivElement>(null);
  const drawerNaturalHeightRef = useRef<number>(240);
  const drawerStartYRef = useRef<number>(0);
  const drawerStartXRef = useRef<number>(0);
  const drawerStartTimeRef = useRef<number>(0);
  const currentOffsetYRef = useRef<number>(0);
  const isVerticalDragRef = useRef<boolean>(false);
  const isSuppressingClickRef = useRef<boolean>(false);
  const rafIdRef = useRef<number>(0);

  const applyDrawerDragTransform = useCallback((offsetY: number, animate = false) => {
    const clipEl = drawerClipRef.current;
    const sheetEl = drawerSheetRef.current;
    if (!clipEl || !sheetEl) return;

    const h = drawerNaturalHeightRef.current || sheetEl.offsetHeight || 240;
    const transition = animate
      ? "height 200ms cubic-bezier(0.22,1,0.36,1), transform 200ms cubic-bezier(0.22,1,0.36,1)"
      : "none";

    clipEl.style.transition = transition;
    sheetEl.style.transition = transition;

    // Resizing clipEl.style.height in document flow pulls the feed below it 1:1 at 120fps
    const nextHeight = Math.max(0, h + offsetY);
    clipEl.style.height = `${nextHeight}px`;
    sheetEl.style.transform = `translate3d(0, ${offsetY}px, 0)`;
  }, []);

  const resetDrawerInlineStyles = useCallback(() => {
    const clipEl = drawerClipRef.current;
    const sheetEl = drawerSheetRef.current;
    if (clipEl) {
      clipEl.style.transition = "";
      clipEl.style.height = "";
    }
    if (sheetEl) {
      sheetEl.style.transition = "";
      sheetEl.style.transform = "";
    }
    currentOffsetYRef.current = 0;
  }, []);

  useEffect(() => {
    resetDrawerInlineStyles();
  }, [isExpanded, resetDrawerInlineStyles]);

  const handleDrawerTouchStartCapture = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isExpanded) return;
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = 0;
    }
    drawerNaturalHeightRef.current = drawerSheetRef.current?.offsetHeight || 240;
    drawerStartYRef.current = e.touches[0].clientY;
    drawerStartXRef.current = e.touches[0].clientX;
    drawerStartTimeRef.current = Date.now();
    currentOffsetYRef.current = 0;
    isVerticalDragRef.current = false;
  };

  const handleDrawerTouchMoveCapture = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isExpanded) return;
    const touch = e.touches[0];
    const dy = touch.clientY - drawerStartYRef.current;
    const dx = touch.clientX - drawerStartXRef.current;

    if (!isVerticalDragRef.current) {
      // If horizontal row scrolling dominates, let the horizontal strip scroll naturally
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 6) {
        return;
      }
      // Lock into vertical sheet drag as soon as vertical movement exceeds 5px
      if (Math.abs(dy) > 5 && Math.abs(dy) > Math.abs(dx)) {
        isVerticalDragRef.current = true;
      }
    }

    if (isVerticalDragRef.current) {
      e.stopPropagation();
      const maxUpward = drawerNaturalHeightRef.current || 240;
      const offset = dy < 0 ? Math.max(-maxUpward, dy) : Math.min(24, dy * 0.2);
      currentOffsetYRef.current = offset;

      if (!rafIdRef.current) {
        rafIdRef.current = requestAnimationFrame(() => {
          rafIdRef.current = 0;
          applyDrawerDragTransform(currentOffsetYRef.current, false);
        });
      }
    }
  };

  const finishDrawerDrag = () => {
    if (!isVerticalDragRef.current) return;
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = 0;
    }
    isVerticalDragRef.current = false;
    isSuppressingClickRef.current = true;
    setTimeout(() => {
      isSuppressingClickRef.current = false;
    }, 150);

    const offset = currentOffsetYRef.current;
    const duration = Math.max(1, Date.now() - drawerStartTimeRef.current);
    const velocityY = offset / duration;
    const h = drawerNaturalHeightRef.current || 240;

    if (offset < -32 || velocityY < -0.22) {
      applyDrawerDragTransform(-h, true);
      setTimeout(() => {
        setIsExpanded(false);
        resetDrawerInlineStyles();
      }, 190);
    } else {
      applyDrawerDragTransform(0, true);
      setTimeout(() => {
        resetDrawerInlineStyles();
      }, 210);
    }
  };

  const handleDrawerTouchEndCapture = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isVerticalDragRef.current) {
      e.stopPropagation();
      finishDrawerDrag();
    }
  };

  const handleDrawerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isExpanded || e.button !== 0) return;
    drawerNaturalHeightRef.current = drawerSheetRef.current?.offsetHeight || 240;
    drawerStartYRef.current = e.clientY;
    drawerStartXRef.current = e.clientX;
    drawerStartTimeRef.current = Date.now();
    currentOffsetYRef.current = 0;
    isVerticalDragRef.current = false;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dy = moveEvent.clientY - drawerStartYRef.current;
      const dx = moveEvent.clientX - drawerStartXRef.current;
      if (!isVerticalDragRef.current) {
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 6) return;
        if (Math.abs(dy) > 5 && Math.abs(dy) > Math.abs(dx)) {
          isVerticalDragRef.current = true;
        }
      }
      if (isVerticalDragRef.current) {
        const maxUpward = drawerNaturalHeightRef.current || 240;
        const offset = dy < 0 ? Math.max(-maxUpward, dy) : Math.min(24, dy * 0.2);
        currentOffsetYRef.current = offset;
        applyDrawerDragTransform(offset, false);
      }
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      if (isVerticalDragRef.current) {
        finishDrawerDrag();
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
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

  // Derive counts per parent group and child dish categories on full dataset
  const { groupCounts, childCategoryCounts } = useMemo(() => {
    const gCounts: Record<string, number> = {};
    const cCounts: Record<string, number> = {};
    for (const group of FOOD_GROUPS) {
      gCounts[group.id] = 0;
      for (const child of group.childCategories) {
        cCounts[child] = 0;
      }
    }

    if (feedMode === "places") {
      for (const venue of venues) {
        if (!isVisibleInFeed(venue)) continue;
        const tax = resolveEntityTaxonomy(venue);
        gCounts[tax.group.id] = (gCounts[tax.group.id] || 0) + 1;
        if (tax.dishCategory) {
          cCounts[tax.dishCategory] = (cCounts[tax.dishCategory] || 0) + 1;
        }
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
        gCounts[tax.group.id] = (gCounts[tax.group.id] || 0) + 1;
        if (tax.dishCategory) {
          cCounts[tax.dishCategory] = (cCounts[tax.dishCategory] || 0) + 1;
        }
      }
    }

    return { groupCounts: gCounts, childCategoryCounts: cCounts };
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
    useCityPulseStore.setState((state) => ({
      selectedGroup: null,
      selectedDishCategory: null,
      selectedSpotKind: null,
      selectedCuisine: null,
      selectedDietary: [],
      feedCategory: "all",
      filters: {
        ...state.filters,
        spot_type: "all",
        price_tier: null,
        staff_picks_only: false,
        saved_only: false,
        open_now: false,
      },
    }));
    filterScrollRef.current?.scrollTo({ left: 0, behavior: "smooth" });
  };

  const handleSelectSaved = () => {
    if (savedOnly) {
      handleSelectAll();
    } else {
      useCityPulseStore.setState((state) => ({
        selectedGroup: null,
        selectedDishCategory: null,
        selectedSpotKind: null,
        selectedCuisine: null,
        feedCategory: "all",
        filters: {
          ...state.filters,
          spot_type: "all",
          saved_only: true,
        },
      }));
    }
  };

  const handleSelectGroup = (groupId: FoodGroupId | null) => {
    if (selectedGroup === groupId) {
      handleSelectAll();
    } else {
      // Single atomic Zustand update (eliminates 6-dispatch filter click stutter)
      useCityPulseStore.setState((state) => ({
        selectedSpotKind: null,
        selectedGroup: groupId,
        selectedDishCategory: null,
        feedCategory: "all",
        filters: {
          ...state.filters,
          spot_type: "all",
          saved_only: false,
        },
      }));
    }
  };

  const handleSelectChildCategory = (childCat: string) => {
    if (selectedDishCategory === childCat) {
      useCityPulseStore.setState({
        selectedDishCategory: null,
        feedCategory: "all",
      });
    } else {
      useCityPulseStore.setState({
        selectedDishCategory: childCat,
        feedCategory: "all",
      });
      setTimeout(() => {
        setIsExpanded(false);
      }, 160);
    }
  };

  const handleSelectSpotKind = (kind: SpotKind) => {
    if (selectedSpotKind === kind) {
      handleSelectAll();
    } else {
      useCityPulseStore.setState((state) => ({
        selectedGroup: null,
        selectedDishCategory: null,
        feedCategory: "all",
        selectedSpotKind: kind,
        filters: {
          ...state.filters,
          saved_only: false,
          spot_type: kind === "popup" ? "popup" : kind === "food_truck" ? "food_truck" : "restaurant",
        },
      }));
    }
  };

  const handleSelectCuisine = (cuisineId: CuisineId) => {
    setSelectedCuisine(selectedCuisine === cuisineId ? null : cuisineId);
  };

  // Find currently selected group definition
  const activeGroupDef = useMemo(() => {
    return FOOD_GROUPS.find((g) => g.id === selectedGroup) || null;
  }, [selectedGroup]);

  // Non-empty child categories for active group
  const activeChildren = useMemo(() => {
    if (!activeGroupDef) return [];
    return activeGroupDef.childCategories.filter(
      (child) => (childCategoryCounts[child] || 0) > 0 || selectedDishCategory === child
    );
  }, [activeGroupDef, childCategoryCounts, selectedDishCategory]);

  return (
    <div data-filter-bar className="w-full max-w-full min-w-0 bg-transparent border-b border-black/[0.06] dark:border-white/[0.08]">
      {/* ── TOP HORIZONTAL STRIP (W1–W3: Non-empty only, count desc, short & honest) ── */}
      <div
        ref={filterScrollRef}
        onTouchStart={handleStripTouchStart}
        onTouchMove={handleStripTouchMove}
        onTouchEnd={handleStripTouchEnd}
        onScroll={handleStripScroll}
        style={{ touchAction: "pan-x" }}
        className={`w-full max-w-full overflow-x-auto no-scrollbar px-3 flex items-center gap-1.5 ${
          compact ? "py-1.5" : "py-2"
        }`}
      >
        {/* [ ⚡ Filters ▾ ] Trigger with active badge (stays clean neutral; never turns black) */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-label="Toggle filter drawer"
          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors select-none active:scale-95 cursor-pointer ${
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
              className="relative shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-zinc-200/70 dark:border-white/10 select-none active:scale-95 cursor-pointer bg-white/80 dark:bg-white/5 text-zinc-700 dark:text-zinc-200 transition-colors duration-200"
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
            className="relative shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-zinc-200/70 dark:border-white/10 select-none active:scale-95 cursor-pointer bg-white/80 dark:bg-white/5 text-zinc-700 dark:text-zinc-200 transition-colors duration-200"
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
              className="relative shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border border-zinc-200/70 dark:border-white/10 select-none active:scale-95 cursor-pointer bg-white/80 dark:bg-white/5 text-zinc-700 dark:text-zinc-200 transition-colors duration-200"
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
              className="relative shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border border-zinc-200/70 dark:border-white/10 select-none active:scale-95 cursor-pointer bg-white/80 dark:bg-white/5 text-zinc-700 dark:text-zinc-200 transition-colors duration-200"
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
                  className="w-3.5 h-3.5 shrink-0"
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

      {/* ── EXPANDED FILTER DRAWER (120fps CSS Grid Accordion + Imperative 1:1 Feed-Pull Drag-Up) ── */}
      <div
        data-filter-drawer="true"
        className={`grid transition-[grid-template-rows,opacity] duration-240 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none"
        }`}
      >
        <div ref={drawerClipRef} className="overflow-hidden min-h-0">
          <div
            ref={drawerSheetRef}
            onTouchStartCapture={handleDrawerTouchStartCapture}
            onTouchMoveCapture={handleDrawerTouchMoveCapture}
            onTouchEndCapture={handleDrawerTouchEndCapture}
            onTouchCancelCapture={handleDrawerTouchEndCapture}
            onMouseDown={handleDrawerMouseDown}
            onClickCapture={(e) => {
              if (isSuppressingClickRef.current) {
                e.stopPropagation();
                e.preventDefault();
              }
            }}
            className="w-full border-t border-black/[0.06] dark:border-white/[0.08] bg-[#FAF7F2] dark:bg-[#151413] px-3.5 pt-2 pb-2.5 space-y-2.5 select-none touch-pan-x cursor-grab active:cursor-grabbing"
          >
                {/* Header: Compact Row (Categories + active on left, Reset on right) */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-comico uppercase tracking-wider text-[#181615] dark:text-white">
                      Categories
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

                {/* ── SECTION 1: Floating Enlarged Category Icons ── */}
                <div>
                  <div
                    ref={drawerCategoriesScrollRef}
                    className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1 snap-x"
                  >
                    {FOOD_GROUPS.map((group) => {
                      const isSelected = selectedGroup === group.id;
                      const count = groupCounts[group.id] || 0;

                      return (
                        <button
                          key={group.id}
                          type="button"
                          onClick={() => handleSelectGroup(group.id)}
                          className={`snap-start shrink-0 flex flex-col items-center justify-start gap-1 p-1 select-none active:scale-95 cursor-pointer transition-all ${
                            count === 0 && !isSelected ? "opacity-40" : ""
                          }`}
                        >
                          <div
                            className={`w-11 h-11 relative rounded-full flex items-center justify-center transition-all duration-200 ${
                              isSelected
                                ? "bg-[#e84a27]/12 ring-2 ring-[#e84a27]/25 scale-108"
                                : "hover:scale-105"
                            }`}
                          >
                            <SmakrFoodIcon
                              name={group.id}
                              className="w-11 h-11 object-contain drop-shadow-xs"
                            />
                          </div>
                          <span
                            className={`text-[10.5px] font-bold text-center leading-tight line-clamp-1 transition-colors ${
                              isSelected ? "text-[#e84a27]" : "text-zinc-800 dark:text-zinc-200"
                            }`}
                          >
                            {group.shortLabel}
                          </span>
                          <span
                            className={`text-[9.5px] font-mono px-1.5 py-0.2 rounded-full transition-colors ${
                              isSelected
                                ? "bg-[#e84a27]/15 text-[#e84a27] font-bold"
                                : "text-zinc-400"
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── SECTION 2: Single-Row Non-Empty Sub-Categories (Zero-Reflow CSS Grid Transition) ── */}
                <div
                  className={`grid transition-[grid-template-rows,opacity] duration-180 ease-out ${
                    activeGroupDef && (activeChildren.length > 1 || (activeChildren.length > 0 && selectedDishCategory))
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0 pointer-events-none"
                  }`}
                >
                  <div className="overflow-hidden min-h-0">
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                      {activeChildren.map((child) => {
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
                            className={`shrink-0 px-2.5 py-1 rounded-xl text-[11px] font-bold border flex items-center gap-1 transition-all active:scale-95 cursor-pointer ${
                              isChildActive
                                ? "bg-[#e84a27] text-white border-[#e84a27] shadow-xs"
                                : "bg-white dark:bg-stone-800 text-zinc-700 dark:text-zinc-200 border-zinc-200/80 dark:border-white/10 hover:border-[#e84a27]/40"
                            }`}
                          >
                            <SmakrFoodIcon name={child} className="w-3.5 h-3.5 shrink-0" />
                            <span>{label}</span>
                            {childCategoryCounts[child] > 0 && (
                              <span className={`text-[10px] font-mono ${isChildActive ? "text-white/80" : "text-zinc-400"}`}>
                                ({childCategoryCounts[child]})
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* ── SECTION 3: Dietary Badges (Inline "Diet" Label) ── */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 pr-1 shrink-0 select-none">
                    Diet
                  </span>
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
                        className={`shrink-0 px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
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

                {/* ── SECTION 4 & 5: Compact Side-by-Side Dropdowns (Solid Orange When Active) ── */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Spot Type Pill Trigger */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSpotTypeOpen(!isSpotTypeOpen);
                      if (!isSpotTypeOpen) setIsCuisinesOpen(false);
                    }}
                    className={`h-8 px-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all cursor-pointer select-none active:scale-95 ${
                      isSpotTypeOpen || selectedSpotKind
                        ? "bg-[#E84A27] text-white border-[#E84A27] shadow-xs"
                        : "bg-white/70 dark:bg-white/5 border-zinc-200/80 dark:border-white/10 text-zinc-700 dark:text-zinc-200"
                    }`}
                  >
                    <span className="truncate">
                      {selectedSpotKind
                        ? SPOT_KINDS.find((s) => s.id === selectedSpotKind)?.shortLabel || selectedSpotKind
                        : "Spot Type"}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                        isSpotTypeOpen ? "rotate-180 text-white" : selectedSpotKind ? "text-white" : "text-zinc-400"
                      }`}
                    />
                  </button>

                  {/* Cuisines Pill Trigger */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsCuisinesOpen(!isCuisinesOpen);
                      if (!isCuisinesOpen) setIsSpotTypeOpen(false);
                    }}
                    className={`h-8 px-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all cursor-pointer select-none active:scale-95 ${
                      isCuisinesOpen || selectedCuisine
                        ? "bg-[#E84A27] text-white border-[#E84A27] shadow-xs"
                        : "bg-white/70 dark:bg-white/5 border-zinc-200/80 dark:border-white/10 text-zinc-700 dark:text-zinc-200"
                    }`}
                  >
                    <span className="truncate">
                      {selectedCuisine
                        ? CUISINES.find((c) => c.id === selectedCuisine)?.label || selectedCuisine
                        : "Cuisines"}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                        isCuisinesOpen ? "rotate-180 text-white" : selectedCuisine ? "text-white" : "text-zinc-400"
                      }`}
                    />
                  </button>
                </div>

                {/* Revealed horizontal strips directly underneath */}
                <AnimatePresence>
                  {isSpotTypeOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                        {SPOT_KINDS.filter((spot) => spot.id !== "street_stall").map((spot) => {
                          const isActive = selectedSpotKind === spot.id;
                          return (
                            <button
                              key={spot.id}
                              type="button"
                              onClick={() => handleSelectSpotKind(spot.id)}
                              className={`shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                                isActive
                                  ? "bg-[#E84A27] text-white border-[#E84A27] shadow-xs"
                                  : "bg-white dark:bg-white/5 text-zinc-700 dark:text-zinc-200 border-zinc-200/80 dark:border-white/10 hover:border-zinc-400"
                              }`}
                            >
                              <SmakrFoodIcon name={spot.id} className="w-3.5 h-3.5 shrink-0" monochrome={false} />
                              <span>{spot.shortLabel}</span>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                  {isCuisinesOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                        {CUISINES.map((cuisine) => {
                          const isActive = selectedCuisine === cuisine.id;
                          return (
                            <button
                              key={cuisine.id}
                              type="button"
                              onClick={() => handleSelectCuisine(cuisine.id)}
                              className={`shrink-0 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                                isActive
                                  ? "bg-[#E84A27] text-white border-[#E84A27] font-bold shadow-xs"
                                  : "bg-white dark:bg-white/5 text-zinc-700 dark:text-zinc-200 border-zinc-200/80 dark:border-white/10 hover:border-[#e84a27]/30"
                              }`}
                            >
                              <SmakrFoodIcon name={cuisine.glyph} className="w-3.5 h-3.5 shrink-0" monochrome={false} />
                              <span>{cuisine.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

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

                {/* Bottom Tap & Drag-to-Close Handle */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setIsExpanded(false)}
                  aria-label="Tap or drag up to close filters"
                  className="w-full pt-1.5 pb-1 flex flex-col items-center justify-center cursor-pointer active:opacity-60 transition-opacity select-none"
                >
                  <div className="w-10 h-1.5 rounded-full bg-stone-300/90 dark:bg-stone-600/90 hover:bg-[#E84A27] transition-colors" />
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
