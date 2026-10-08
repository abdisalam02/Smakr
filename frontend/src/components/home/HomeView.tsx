"use client";

import React, { useEffect, useLayoutEffect, useState, useRef, useMemo } from "react";
import { FeedFilterBar } from "@/components/filter/FeedFilterBar";
import { MascotWeeklyDrop } from "@/components/food/MascotWeeklyDrop";
import { FoodPostCard } from "@/components/food/FoodPostCard";
import { FeedEmptyState } from "@/components/food/FeedEmptyState";
import { FoodPostCardSkeleton, FoodSpotCardSkeleton } from "@/components/food/CardSkeletons";
import { FoodSpotCard } from "@/components/food/FoodSpotCard";
import { FoodViewSlider } from "@/components/food/FoodViewSlider";
import dynamic from "next/dynamic";
import { VenueBottomSheet } from "@/components/venue/VenueBottomSheet";
import { VenueDetailPane } from "@/components/venue/VenueDetailPane";
import { QuickCheckInModal } from "@/components/checkin/QuickCheckInModal";
import { SpeedTestWidget } from "@/components/checkin/SpeedTestWidget";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { useLiveVibeSync } from "@/hooks/useLiveVibeSync";
import { useSyncAppData } from "@/hooks/useSyncAppData";
import { FOOD_CATEGORIES } from "@/lib/foodSeeds";
import { SmakrSIcon } from "@/components/ui/SmakrSIcon";
import { UtensilsCrossed, Plus, Map as MapIcon, LayoutGrid } from "lucide-react";
import type { FoodPost, Venue, WeeklyPick } from "@/types";

/**
 * MapLibre is a large dependency — load it lazily (client-only) so it never
 * blocks the first paint / store hydration. The feed & user render immediately
 * while the map chunks in behind the skeleton.
 */
const MapRadarView = dynamic(
  () => import("@/components/map/MapRadarView").then((m) => m.MapRadarView),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[var(--surface-raised,#F5EFE3)]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full border-2 border-[#e84a27] border-t-transparent animate-spin" />
          <span className="text-[11px] font-semibold text-zinc-500">Loading Oslo radar…</span>
        </div>
      </div>
    ),
  }
);

export interface HomeInitialData {
  venues: Venue[];
  foodPosts: FoodPost[];
  weeklyPick: WeeklyPick;
}

export function HomeView({ initialData }: { initialData: HomeInitialData }) {
  // Seed the store from the server-prefetched payload in a layout effect: it
  // runs once, before the browser paints the hydrated tree, so the dish feed /
  // map pins appear on the first painted frame with NO client fetch and no
  // skeleton flash. (Zustand's SSR snapshot is its creation state, so the server
  // HTML paints the light skeletons; the RSC payload then fills them in on
  // hydration without any network round-trip.)
  const seededRef = useRef(false);
  useLayoutEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;
    const store = useCityPulseStore.getState();
    store.setVenues(initialData.venues);
    store.setFoodPosts(initialData.foodPosts);
    store.setWeeklyPick(initialData.weeklyPick);
    store.markServerDataApplied();
    if (initialData.venues.length > 0 || initialData.foodPosts.length > 0) {
      store.setIsHydratingData(false);
    }
  }, [initialData]);

  const hasServerData =
    initialData.venues.length > 0 || initialData.foodPosts.length > 0;

  // Activate real-time stream
  useLiveVibeSync();

  // Only fall back to a browser fetch when the server had nothing to send
  // (e.g. a transient DB hiccup). With SSR data present this is skipped
  // entirely, eliminating the client-side waterfall.
  useSyncAppData(!hasServerData);

  // Only ONE MapLibre instance should mount. The desktop and mobile layouts are
  // both in the React tree (CSS just hides one), so rendering a map in each
  // initialized two maps on every load — doubling map/marker work and stalling
  // hydration. Gate them on the actual breakpoint.
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const venues = useCityPulseStore((state) => state.venues);
  const selectedVenue = useCityPulseStore((state) => state.selectedVenue);
  const setSelectedVenue = useCityPulseStore((state) => state.setSelectedVenue);
  const viewMode = useCityPulseStore((state) => state.viewMode);
  const foodPosts = useCityPulseStore((state) => state.foodPosts);
  const isHydratingData = useCityPulseStore((state) => state.isHydratingData);
  const currentCategory = useCityPulseStore((state) => state.feedCategory);
  const feedMode = useCityPulseStore((state) => state.feedMode);
  const setFeedMode = useCityPulseStore((state) => state.setFeedMode);
  const selectedDietary = useCityPulseStore((state) => state.selectedDietary);
  const mapNeighborhood = useCityPulseStore((state) => state.mapNeighborhood);
  const openNow = useCityPulseStore((state) => state.filters.open_now);
  const searchQuery = useCityPulseStore((state) => state.filters.search_query);
  const setFeedCategory = useCityPulseStore((state) => state.setFeedCategory);
  const setIsCreateBiteModalOpen = useCityPulseStore((state) => state.setIsCreateBiteModalOpen);

  // Mobile Slide-up Bottom Sheet State (peek = 142px, half = 58vh, full = 92vh)
  const mobileSheet = useCityPulseStore((state) => state.mobileSheetState);
  const setMobileSheet = useCityPulseStore((state) => state.setMobileSheetState);

  // Memoized food posts filtering to prevent unnecessary re-renders during mobile drag
  const filteredPosts = useMemo(() => {
    return foodPosts.filter((post) => {
      if (currentCategory !== "all" && post.category !== currentCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = post.dish_name.toLowerCase().includes(q);
        const matchSpot = post.spot_name.toLowerCase().includes(q);
        const matchTags = post.taste_tags.some((t) => t.toLowerCase().includes(q));
        if (!matchName && !matchSpot && !matchTags) return false;
      }

      const linkedVenue = venues.find((v) => v.id === post.spot_id);

      // Dietary inclusion (all selected tags must be present)
      if (selectedDietary.length > 0) {
        const tags = post.dietary_tags ?? linkedVenue?.dietary_tags ?? [];
        if (!selectedDietary.every((tag) => tags.includes(tag))) return false;
      }

      // Neighborhood match
      if (
        mapNeighborhood !== "all" &&
        linkedVenue?.neighborhood !== mapNeighborhood
      ) {
        return false;
      }

      // Open Now
      if (openNow && !linkedVenue?.open_now) return false;

      return true;
    });
  }, [
    foodPosts,
    currentCategory,
    searchQuery,
    selectedDietary,
    mapNeighborhood,
    openNow,
    venues,
  ]);

  // Memoized food spots / venues filtering
  const filteredVenues = useMemo(() => {
    return venues
      .filter((venue) => {
        if (currentCategory !== "all") {
          if (currentCategory === "coffee" && venue.place_type === "cafe") {
            // match coffee
          } else if (venue.food_category !== currentCategory) {
            return false;
          }
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = venue.name.toLowerCase().includes(q);
          const matchAddress = venue.address.toLowerCase().includes(q);
          const matchCity = venue.city.toLowerCase().includes(q);
          const matchDishes = venue.signature_dishes?.some((d) =>
            d.toLowerCase().includes(q)
          );
          if (!matchName && !matchAddress && !matchCity && !matchDishes)
            return false;
        }

        // Dietary inclusion (all selected tags must be present)
        if (selectedDietary.length > 0) {
          const tags = venue.dietary_tags ?? [];
          if (!selectedDietary.every((tag) => tags.includes(tag))) return false;
        }

        // Neighborhood match
        if (
          mapNeighborhood !== "all" &&
          venue.neighborhood !== mapNeighborhood
        ) {
          return false;
        }

        // Open Now
        if (openNow && !venue.open_now) return false;

        return true;
      })
      .sort((a, b) => (a.distance_meters || 9999) - (b.distance_meters || 9999));
  }, [
    venues,
    currentCategory,
    searchQuery,
    selectedDietary,
    mapNeighborhood,
    openNow,
  ]);

  const activeCategoryDef = FOOD_CATEGORIES.find((c) => c.id === currentCategory) || FOOD_CATEGORIES[0];

  // Screen height tracker for accurate bottom sheet snap points
  const [sheetHeight, setSheetHeight] = useState<number>(700);

  useEffect(() => {
    const updateH = () => {
      if (typeof window !== "undefined") {
        setSheetHeight(Math.max(450, window.innerHeight - 58));
      }
    };
    updateH();
    window.addEventListener("resize", updateH);
    return () => window.removeEventListener("resize", updateH);
  }, []);

  const getSnapTranslateY = (snap: "peek" | "half" | "full") => {
    if (snap === "full") return 0;
    if (snap === "half") return Math.round(sheetHeight * 0.20);
    return Math.round(sheetHeight * 0.65);
  };

  // Direct GPU-accelerated Sheet Ref (Zero React re-renders during touch drag = pure 60/120fps)
  const sheetRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const hasDraggedRef = useRef<boolean>(false);
  const dragStartYRef = useRef<number>(0);
  const dragStartTranslateYRef = useRef<number>(0);
  const lastTouchYRef = useRef<number>(0);
  const lastTouchTimeRef = useRef<number>(0);
  const currentVelocityRef = useRef<number>(0);
  const currentYRef = useRef<number>(0);

  // Content scroll container ref & pull-to-minimize tracker
  const feedScrollRef = useRef<HTMLDivElement>(null);
  const contentTouchStartY = useRef<number | null>(null);
  const isContentPulling = useRef<boolean>(false);
  // When the sheet is in "peek", a touch anywhere on the content drags the sheet.
  const contentDelegatedDrag = useRef<boolean>(false);

  // Synchronize external sheet changes (buttons, pin clicks) to the DOM ref
  useEffect(() => {
    if (sheetRef.current && !isDraggingRef.current) {
      const targetY = getSnapTranslateY(mobileSheet);
      sheetRef.current.style.transition = "transform 0.38s cubic-bezier(0.16, 1, 0.3, 1)";
      sheetRef.current.style.transform = `translate3d(0, ${targetY}px, 0)`;
      currentYRef.current = targetY;
    }
  }, [mobileSheet, sheetHeight]);

  // 1. Header Grab Bar Handlers (Direct GPU transform with zero thread blocking)
  const handleHeaderTouchStart = (e: React.TouchEvent) => {
    const startY = e.touches[0].clientY;
    const currentTranslateY = getSnapTranslateY(mobileSheet);
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    dragStartYRef.current = startY;
    dragStartTranslateYRef.current = currentTranslateY;
    lastTouchYRef.current = startY;
    lastTouchTimeRef.current = Date.now();
    currentVelocityRef.current = 0;
    currentYRef.current = currentTranslateY;

    if (sheetRef.current) {
      sheetRef.current.style.transition = "none";
    }
  };

  const handleHeaderTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    const currentTouchY = e.touches[0].clientY;
    const delta = currentTouchY - dragStartYRef.current;
    if (Math.abs(delta) > 4) {
      hasDraggedRef.current = true;
    }
    let nextY = dragStartTranslateYRef.current + delta;

    const now = Date.now();
    const timeDelta = Math.max(1, now - lastTouchTimeRef.current);
    currentVelocityRef.current = (currentTouchY - lastTouchYRef.current) / timeDelta;
    lastTouchYRef.current = currentTouchY;
    lastTouchTimeRef.current = now;

    const peekY = Math.round(sheetHeight * 0.65);
    // Apply smooth rubber-band resistance beyond limits
    if (nextY < 0) {
      nextY = nextY * 0.22;
    } else if (nextY > peekY) {
      const overflow = nextY - peekY;
      nextY = peekY + overflow * 0.22;
    }

    currentYRef.current = nextY;
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translate3d(0, ${nextY}px, 0)`;
    }
  };

  const handleHeaderTouchEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    const finalY = currentYRef.current;
    const velocity = currentVelocityRef.current;

    const halfY = Math.round(sheetHeight * 0.20);
    const peekY = Math.round(sheetHeight * 0.65);

    let nextSnap: "peek" | "half" | "full" = "peek";

    // Fast flick UP (negative velocity)
    if (velocity < -0.28) {
      if (mobileSheet === "peek") {
        nextSnap = velocity < -0.65 || finalY < halfY ? "full" : "half";
      } else {
        nextSnap = "full";
      }
    }
    // Fast flick DOWN (positive velocity)
    else if (velocity > 0.28) {
      if (mobileSheet === "full") {
        nextSnap = velocity > 0.65 || finalY > halfY ? "peek" : "half";
      } else {
        nextSnap = "peek";
      }
    }
    // Position-based snapping
    else {
      const midFullHalf = halfY * 0.55;
      const midHalfPeek = halfY + (peekY - halfY) * 0.5;

      if (finalY < midFullHalf) {
        nextSnap = "full";
      } else if (finalY < midHalfPeek) {
        nextSnap = "half";
      } else {
        nextSnap = "peek";
      }
    }

    const targetY = getSnapTranslateY(nextSnap);
    currentYRef.current = targetY;
    if (sheetRef.current) {
      sheetRef.current.style.transition = "transform 0.38s cubic-bezier(0.16, 1, 0.3, 1)";
      sheetRef.current.style.transform = `translate3d(0, ${targetY}px, 0)`;
    }
    setMobileSheet(nextSnap);
  };

  // 2. Scrollable Content Pull-down to minimize when at top
  const handleContentTouchStart = (e: React.TouchEvent) => {
    // In "peek" the feed is barely visible — a touch anywhere should drag the
    // sheet (up to open, down to dismiss), mirroring the header grab handle.
    if (mobileSheet === "peek") {
      contentDelegatedDrag.current = true;
      handleHeaderTouchStart(e);
      return;
    }
    contentDelegatedDrag.current = false;

    const scrollTop = feedScrollRef.current ? feedScrollRef.current.scrollTop : 0;
    if (scrollTop <= 1) {
      contentTouchStartY.current = e.touches[0].clientY;
      dragStartTranslateYRef.current = currentYRef.current || getSnapTranslateY(mobileSheet);
      lastTouchTimeRef.current = Date.now();
      isContentPulling.current = false;
    }
  };

  const handleContentTouchMove = (e: React.TouchEvent) => {
    if (contentDelegatedDrag.current) {
      handleHeaderTouchMove(e);
      return;
    }
    if (contentTouchStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    const scrollTop = feedScrollRef.current ? feedScrollRef.current.scrollTop : 0;

    if (scrollTop <= 1) {
      const pullDown = currentY - contentTouchStartY.current;
      if (pullDown > 6) {
        isContentPulling.current = true;
        isDraggingRef.current = true;
        if (sheetRef.current) {
          sheetRef.current.style.transition = "none";
        }
        const peekY = Math.round(sheetHeight * 0.65);
        const nextY = Math.min(peekY + 20, dragStartTranslateYRef.current + pullDown * 0.85);
        currentYRef.current = nextY;
        if (sheetRef.current) {
          sheetRef.current.style.transform = `translate3d(0, ${nextY}px, 0)`;
        }
      }
    } else {
      if (isContentPulling.current) {
        isContentPulling.current = false;
        isDraggingRef.current = false;
      }
    }
  };

  const handleContentTouchEnd = (e: React.TouchEvent) => {
    if (contentDelegatedDrag.current) {
      contentDelegatedDrag.current = false;
      handleHeaderTouchEnd();
      return;
    }
    if (isContentPulling.current && contentTouchStartY.current !== null) {
      const endY = e.changedTouches[0].clientY;
      const pullDown = endY - contentTouchStartY.current;
      const deltaTime = Math.max(1, Date.now() - lastTouchTimeRef.current);
      const velocityY = pullDown / deltaTime;

      let nextSnap = mobileSheet;
      if (pullDown > 55 || velocityY > 0.32) {
        if (mobileSheet === "full") {
          nextSnap = pullDown > 180 || velocityY > 0.75 ? "peek" : "half";
        } else if (mobileSheet === "half") {
          nextSnap = "peek";
        }
      }

      const targetY = getSnapTranslateY(nextSnap);
      currentYRef.current = targetY;
      if (sheetRef.current) {
        sheetRef.current.style.transition = "transform 0.38s cubic-bezier(0.16, 1, 0.3, 1)";
        sheetRef.current.style.transform = `translate3d(0, ${targetY}px, 0)`;
      }
      setMobileSheet(nextSnap);
    }

    contentTouchStartY.current = null;
    isContentPulling.current = false;
    isDraggingRef.current = false;
  };

  const toggleSheetState = () => {
    if (hasDraggedRef.current) return;
    const next = mobileSheet === "peek" ? "half" : mobileSheet === "half" ? "full" : "half";
    setMobileSheet(next);
  };

  return (
    <div className="relative flex-1 w-full h-screen h-[100dvh] min-h-[100dvh] max-h-[100dvh] overflow-hidden bg-zinc-100">
      {/* ========================================================================= */}
      {/* DESKTOP SPLIT VIEW (Visible on lg screens) */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex w-full h-full pt-[57px]">
        {/* Left: Feed Stream */}
        <div
          className={`${
            selectedVenue
              ? "w-[46%] xl:w-[42%] opacity-100 border-r border-zinc-200/80"
              : viewMode === "map"
              ? "w-0 max-w-0 opacity-0 pointer-events-none p-0 border-r-0"
              : viewMode === "feed"
              ? "w-full max-w-5xl mx-auto opacity-100 border-r-0"
              : "w-[46%] xl:w-[42%] opacity-100 border-r border-zinc-200/80"
          } h-full bg-[#FAF7F2] dark:bg-[#181615] flex flex-col overflow-hidden transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[width,opacity] relative`}
        >
          {selectedVenue ? (
            <VenueDetailPane
              venue={selectedVenue}
              onBack={() => setSelectedVenue(null)}
            />
          ) : (
            <>
              <div className="sticky top-0 z-20 bg-[#FAF7F2]/65 dark:bg-[#181615]/65 backdrop-blur-xl border-b border-black/[0.06]">
                <MascotWeeklyDrop feedCount={filteredPosts.length} />
                <FeedFilterBar />
              </div>
              <div data-feed-scroll className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar pb-24">
            {feedMode === "food" ? (
              foodPosts.length === 0 && isHydratingData ? (
                <div
                  className={`grid ${
                    viewMode === "feed"
                      ? "grid-cols-2 xl:grid-cols-3"
                      : "grid-cols-1 xl:grid-cols-2"
                  } gap-4`}
                >
                  {Array.from({ length: 4 }).map((_, i) => (
                    <FoodPostCardSkeleton key={`post-skeleton-${i}`} />
                  ))}
                </div>
              ) : filteredPosts.length === 0 ? (
                <FeedEmptyState />
              ) : (
                <div
                  className={`grid ${
                    viewMode === "feed"
                      ? "grid-cols-2 xl:grid-cols-3"
                      : "grid-cols-1 xl:grid-cols-2"
                  } gap-4`}
                >
                  {filteredPosts.map((post, index) => (
                    <FoodPostCard key={post.id} post={post} priority={isDesktop && index === 0} />
                  ))}
                </div>
              )
            ) : (
              venues.length === 0 && isHydratingData ? (
                <div
                  className={`grid ${
                    viewMode === "feed"
                      ? "grid-cols-2 xl:grid-cols-3"
                      : "grid-cols-1 xl:grid-cols-2"
                  } gap-4`}
                >
                  {Array.from({ length: 4 }).map((_, i) => (
                    <FoodSpotCardSkeleton key={`spot-skeleton-${i}`} />
                  ))}
                </div>
              ) : filteredVenues.length === 0 ? (
                <div className="py-16 text-center text-xs text-zinc-500">
                  No spots found in this category.
                </div>
              ) : (
                <div
                  className={`grid ${
                    viewMode === "feed"
                      ? "grid-cols-2 xl:grid-cols-3"
                      : "grid-cols-1 xl:grid-cols-2"
                  } gap-4`}
                >
                  {filteredVenues.map((venue, index) => (
                    <FoodSpotCard key={venue.id} venue={venue} priority={isDesktop && index === 0} />
                  ))}
                </div>
              )
            )}
          </div>

          {/* Floating Glassmorphism Slider Toggle at bottom of feed */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center z-20 pointer-events-none">
            <FoodViewSlider
              dishesCount={filteredPosts.length}
              spotsCount={filteredVenues.length}
            />
          </div>
            </>
          )}
        </div>

        {/* Right: Map with Pins */}
        <div
          className={`${
            selectedVenue
              ? "w-[54%] xl:w-[58%] opacity-100"
              : viewMode === "feed"
              ? "w-0 max-w-0 opacity-0 pointer-events-none"
              : viewMode === "map"
              ? "w-full opacity-100"
              : "w-[54%] xl:w-[58%] opacity-100"
          } h-full relative transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[width,opacity]`}
        >
          {isDesktop && <MapRadarView />}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE AIRBNB-STYLE HOTEL/RADAR SLIDE-UP VIEW (< lg screens) */}
      {/* ========================================================================= */}
      <div className="flex lg:hidden w-full h-full relative overflow-hidden">
        {/* Full-bleed Map in Background (flows right under the translucent nav) */}
        <div className="absolute inset-0 w-full h-full z-0">
          {!isDesktop && <MapRadarView />}
        </div>

        {/* Slide-Up Feed Sheet with 0 Gap Continuous Fluid Expansion */}
        <div
          ref={sheetRef}
          style={{
            height: `calc(100dvh - 57px + 140px)`,
            transform: `translate3d(0, ${getSnapTranslateY(mobileSheet)}px, 0)`,
            transition: "transform 0.38s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          className="absolute left-0 right-0 top-[57px] z-20 bg-[#FAF7F2] dark:bg-[#181615] rounded-t-3xl border-t border-black/[0.08] shadow-2xl flex flex-col will-change-transform pb-[140px]"
        >
          {/* Sticky Sheet Header: Grab Handle + Mascot Drop Pill + Category Filter Bar */}
          <div className="sticky top-0 z-20 bg-[#FAF7F2] dark:bg-[#181615] border-b border-black/[0.06] rounded-t-3xl shrink-0">
            <div
              onTouchStart={handleHeaderTouchStart}
              onTouchMove={handleHeaderTouchMove}
              onTouchEnd={handleHeaderTouchEnd}
              onClick={toggleSheetState}
              className="w-full pt-2 pb-1 cursor-pointer select-none rounded-t-3xl active:bg-black/[0.02] transition-colors touch-none"
            >
              {/* Grab pill */}
              <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600 mx-auto mb-1 hover:bg-zinc-400 transition-colors" />

              {/* Smakr Feed header + Weekly Drop capsule */}
              <div
                onClick={(e) => e.stopPropagation()}
                className="cursor-default"
              >
                <MascotWeeklyDrop
                  compact
                  feedCount={filteredPosts.length}
                  isPeek={mobileSheet === "peek"}
                  onOpen={() => {
                    if (mobileSheet === "peek") setMobileSheet("half");
                  }}
                />
              </div>
            </div>

            {/* Cravings Category Filter Bar */}
            <FeedFilterBar compact />
          </div>

          {/* Scrollable Feed Dishes or Spots with tap-to-expand peek interaction */}
          <div
            ref={feedScrollRef}
            data-feed-scroll
            onTouchStart={handleContentTouchStart}
            onTouchMove={handleContentTouchMove}
            onTouchEnd={handleContentTouchEnd}
            onClick={() => {
              if (hasDraggedRef.current) return;
              if (mobileSheet === "peek") {
                setMobileSheet("half");
              }
            }}
            className={`flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar overscroll-contain pb-28 ${
              mobileSheet === "peek"
                ? "cursor-pointer active:opacity-90 transition-opacity touch-none"
                : ""
            }`}
          >
            {feedMode === "food" ? (
              foodPosts.length === 0 && isHydratingData ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <FoodPostCardSkeleton key={`m-post-skeleton-${i}`} />
                  ))}
                </div>
              ) : filteredPosts.length === 0 ? (
                <FeedEmptyState />
              ) : (
                <div
                  className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${
                    mobileSheet === "peek" ? "pointer-events-none" : ""
                  }`}
                >
                  {filteredPosts.map((post, index) => (
                    <FoodPostCard key={post.id} post={post} priority={!isDesktop && index === 0} />
                  ))}
                </div>
              )
            ) : (
              venues.length === 0 && isHydratingData ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <FoodSpotCardSkeleton key={`m-spot-skeleton-${i}`} />
                  ))}
                </div>
              ) : filteredVenues.length === 0 ? (
                <div className="py-12 text-center text-xs text-zinc-500 space-y-2">
                  <p>No food spots found for this category.</p>
                  <button
                    onClick={() => setFeedCategory("all")}
                    className="px-3 py-1 rounded-lg bg-zinc-100 text-zinc-800 text-xs font-medium"
                  >
                    Show all
                  </button>
                </div>
              ) : (
                <div
                  className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${
                    mobileSheet === "peek" ? "pointer-events-none" : ""
                  }`}
                >
                  {filteredVenues.map((venue, index) => (
                    <FoodSpotCard key={venue.id} venue={venue} priority={!isDesktop && index === 0} />
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE FLOATING GLASSMORPHIC FOOD VS LOCATIONS TOGGLE                    */}
      {/* Elevated at root level (z-[45]), 100% visible across all mobile browsers  */}
      {/* ========================================================================= */}
      <div
        className={`lg:hidden fixed left-1/2 -translate-x-1/2 z-[45] pointer-events-auto flex items-center justify-center transition-all duration-300 ease-out ${
          selectedVenue
            ? "opacity-0 pointer-events-none translate-y-8 scale-90"
            : "opacity-100 translate-y-0 scale-100"
        }`}
        style={{
          bottom: "max(calc(env(safe-area-inset-bottom, 0px) + 20px), 24px)",
        }}
      >
        <FoodViewSlider
          dishesCount={filteredPosts.length}
          spotsCount={filteredVenues.length}
        />
      </div>

      {/* Modals & Floating Spot Cards (auth + log-a-dish mount globally in layout) */}
      <VenueBottomSheet />
      <QuickCheckInModal />
      <SpeedTestWidget />
    </div>
  );
}
