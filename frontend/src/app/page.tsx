"use client";

import React, { useEffect, useState, useRef } from "react";
import { FoodCategoryBar } from "@/components/food/FoodCategoryBar";
import { FoodFeed } from "@/components/food/FoodFeed";
import { FoodPostCard } from "@/components/food/FoodPostCard";
import { FoodSpotCard } from "@/components/food/FoodSpotCard";
import { FoodViewSlider } from "@/components/food/FoodViewSlider";
import { CreateFoodPostModal } from "@/components/food/CreateFoodPostModal";
import { MapRadarView } from "@/components/map/MapRadarView";
import { VenueBottomSheet } from "@/components/venue/VenueBottomSheet";
import { QuickCheckInModal } from "@/components/checkin/QuickCheckInModal";
import { SpeedTestWidget } from "@/components/checkin/SpeedTestWidget";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { useLiveVibeSync } from "@/hooks/useLiveVibeSync";
import { INITIAL_FOOD_SPOTS, FOOD_CATEGORIES } from "@/lib/foodSeeds";
import { AuthModal } from "@/components/auth/AuthModal";
import { SmakrSIcon } from "@/components/ui/SmakrSIcon";
import { ChevronUp, ChevronDown, UtensilsCrossed, Plus, Map as MapIcon, LayoutGrid, X } from "lucide-react";

export default function PulseFoodRadarPage() {
  // Activate real-time stream
  useLiveVibeSync();

  const venues = useCityPulseStore((state) => state.venues);
  const selectedVenue = useCityPulseStore((state) => state.selectedVenue);
  const setVenues = useCityPulseStore((state) => state.setVenues);
  const viewMode = useCityPulseStore((state) => state.viewMode);
  const foodPosts = useCityPulseStore((state) => state.foodPosts);
  const currentCategory = useCityPulseStore((state) => state.feedCategory);
  const feedMode = useCityPulseStore((state) => state.feedMode);
  const setFeedMode = useCityPulseStore((state) => state.setFeedMode);
  const searchQuery = useCityPulseStore((state) => state.filters.search_query);
  const setFeedCategory = useCityPulseStore((state) => state.setFeedCategory);
  const setIsCreateBiteModalOpen = useCityPulseStore((state) => state.setIsCreateBiteModalOpen);
  const toastMessage = useCityPulseStore((state) => state.toastMessage);
  const clearToast = useCityPulseStore((state) => state.clearToast);

  // Mobile Slide-up Bottom Sheet State (peek = 142px, half = 58vh, full = 92vh)
  const mobileSheet = useCityPulseStore((state) => state.mobileSheetState);
  const setMobileSheet = useCityPulseStore((state) => state.setMobileSheetState);

  useEffect(() => {
    // Only keep food & drink spots (no libraries or coworking spaces)
    const pureFoodSpots = venues.filter(
      (v) => v.food_category || (v.place_type !== "library" && v.place_type !== "coworking")
    );
    if (pureFoodSpots.length !== venues.length || venues.length === 0) {
      setVenues(INITIAL_FOOD_SPOTS);
    }
  }, [venues, setVenues]);

  // Filter food posts
  const filteredPosts = foodPosts.filter((post) => {
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
    return true;
  });

  // Filter food spots / venues
  const filteredVenues = venues
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
      return true;
    })
    .sort((a, b) => (a.distance_meters || 9999) - (b.distance_meters || 9999));

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
    if (snap === "half") return Math.round(sheetHeight * 0.46);
    return Math.max(0, sheetHeight - 136);
  };

  // Fluid translateY drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragCurrentY, setDragCurrentY] = useState<number | null>(null);
  const headerTouchStartY = useRef<number | null>(null);
  const headerTouchStartTranslateY = useRef<number>(0);
  const headerTouchStartTime = useRef<number>(0);

  // Content scroll container ref & pull-to-minimize tracker
  const feedScrollRef = useRef<HTMLDivElement>(null);
  const contentTouchStartY = useRef<number | null>(null);
  const contentTouchStartTime = useRef<number>(0);
  const contentStartTranslateY = useRef<number>(0);
  const isContentPulling = useRef<boolean>(false);

  // 1. Header Grab Bar Handlers (Direct 1:1 translation with spring momentum)
  const handleHeaderTouchStart = (e: React.TouchEvent) => {
    const currentTranslateY = getSnapTranslateY(mobileSheet);
    headerTouchStartY.current = e.touches[0].clientY;
    headerTouchStartTranslateY.current = currentTranslateY;
    headerTouchStartTime.current = Date.now();
    setDragCurrentY(currentTranslateY);
    setIsDragging(true);
  };

  const handleHeaderTouchMove = (e: React.TouchEvent) => {
    if (headerTouchStartY.current === null) return;
    const delta = e.touches[0].clientY - headerTouchStartY.current;
    let nextY = headerTouchStartTranslateY.current + delta;

    const peekY = sheetHeight - 136;
    // Apply elastic resistance past boundaries
    if (nextY < 0) {
      nextY = nextY * 0.25;
    } else if (nextY > peekY) {
      const overflow = nextY - peekY;
      nextY = peekY + overflow * 0.25;
    }

    setDragCurrentY(nextY);
  };

  const handleHeaderTouchEnd = (e: React.TouchEvent) => {
    if (headerTouchStartY.current === null) return;
    const endY = e.changedTouches[0].clientY;
    const deltaY = endY - headerTouchStartY.current;
    const deltaTime = Math.max(1, Date.now() - headerTouchStartTime.current);
    const velocityY = deltaY / deltaTime;
    const finalY = dragCurrentY ?? (headerTouchStartTranslateY.current + deltaY);

    headerTouchStartY.current = null;
    setIsDragging(false);
    setDragCurrentY(null);

    const halfY = Math.round(sheetHeight * 0.46);
    const peekY = sheetHeight - 136;

    // Velocity-driven momentum snapping
    if (velocityY < -0.3) {
      // Swiped UP fast
      if (mobileSheet === "peek") {
        setMobileSheet(velocityY < -0.75 || finalY < halfY ? "full" : "half");
      } else {
        setMobileSheet("full");
      }
    } else if (velocityY > 0.3) {
      // Swiped DOWN fast
      if (mobileSheet === "full") {
        setMobileSheet(velocityY > 0.75 || finalY > halfY ? "peek" : "half");
      } else {
        setMobileSheet("peek");
      }
    } else {
      // Position-based snapping
      const midFullHalf = halfY * 0.55;
      const midHalfPeek = halfY + (peekY - halfY) * 0.5;

      if (finalY < midFullHalf) {
        setMobileSheet("full");
      } else if (finalY < midHalfPeek) {
        setMobileSheet("half");
      } else {
        setMobileSheet("peek");
      }
    }
  };

  // 2. Scrollable Content Pull-down to minimize when at top
  const handleContentTouchStart = (e: React.TouchEvent) => {
    contentTouchStartY.current = e.touches[0].clientY;
    contentTouchStartTime.current = Date.now();
    contentStartTranslateY.current = getSnapTranslateY(mobileSheet);
    isContentPulling.current = false;
  };

  const handleContentTouchMove = (e: React.TouchEvent) => {
    if (contentTouchStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    const scrollTop = feedScrollRef.current ? feedScrollRef.current.scrollTop : 0;

    if (scrollTop <= 1) {
      const pullDown = currentY - contentTouchStartY.current;
      if (pullDown > 5) {
        isContentPulling.current = true;
        setIsDragging(true);
        const peekY = sheetHeight - 136;
        const nextY = Math.min(peekY, contentStartTranslateY.current + pullDown * 0.85);
        setDragCurrentY(nextY);
      }
    } else {
      if (isContentPulling.current) {
        isContentPulling.current = false;
        setIsDragging(false);
        setDragCurrentY(null);
      }
    }
  };

  const handleContentTouchEnd = (e: React.TouchEvent) => {
    if (isContentPulling.current && contentTouchStartY.current !== null) {
      const endY = e.changedTouches[0].clientY;
      const pullDown = endY - contentTouchStartY.current;
      const deltaTime = Math.max(1, Date.now() - contentTouchStartTime.current);
      const velocityY = pullDown / deltaTime;

      if (pullDown > 45 || velocityY > 0.3) {
        if (mobileSheet === "full") {
          setMobileSheet(pullDown > 180 || velocityY > 0.75 ? "peek" : "half");
        } else if (mobileSheet === "half") {
          setMobileSheet("peek");
        }
      }
    }

    contentTouchStartY.current = null;
    isContentPulling.current = false;
    setIsDragging(false);
    setDragCurrentY(null);
  };

  const toggleSheetState = () => {
    if (mobileSheet === "peek") setMobileSheet("half");
    else if (mobileSheet === "half") setMobileSheet("full");
    else setMobileSheet("half");
  };

  const minimizeSheet = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (mobileSheet === "full") setMobileSheet("half");
    else if (mobileSheet === "half") setMobileSheet("peek");
  };

  const maximizeSheet = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (mobileSheet === "peek") setMobileSheet("half");
    else if (mobileSheet === "half") setMobileSheet("full");
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
            viewMode === "map"
              ? "w-0 max-w-0 opacity-0 pointer-events-none p-0 border-r-0"
              : viewMode === "feed"
              ? "w-full max-w-5xl mx-auto opacity-100 border-r-0"
              : "w-[46%] xl:w-[42%] opacity-100 border-r border-zinc-200/80"
          } h-full bg-white flex flex-col overflow-hidden transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[width,opacity] relative`}
        >
          <FoodCategoryBar />
          <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar pb-24">
            <div className="flex items-center justify-between pb-1 border-b border-zinc-100">
              <div>
                <h2 className="text-sm font-bold text-zinc-900 tracking-tight flex items-center gap-1.5">
                  <SmakrSIcon className="w-3.5 h-3.5 text-[#ff5500] shrink-0" />
                  <span>
                    {feedMode === "food"
                      ? `${activeCategoryDef.label} in Oslo`
                      : "Oslo Food Spots & Restaurants"}
                  </span>
                </h2>
                <p className="text-xs text-zinc-500">
                  {feedMode === "food"
                    ? activeCategoryDef.shortDesc
                    : "Curated dining destinations, cafes & eateries ranked by foodies"}
                </p>
              </div>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
                {feedMode === "food"
                  ? `${filteredPosts.length} dishes`
                  : `${filteredVenues.length} spots`}
              </span>
            </div>

            {feedMode === "food" ? (
              filteredPosts.length === 0 ? (
                <div className="py-16 text-center text-xs text-zinc-500">
                  No dishes found in this category.
                </div>
              ) : (
                <div
                  className={`grid ${
                    viewMode === "feed"
                      ? "grid-cols-2 xl:grid-cols-3"
                      : "grid-cols-1 xl:grid-cols-2"
                  } gap-4`}
                >
                  {filteredPosts.map((post) => (
                    <FoodPostCard key={post.id} post={post} />
                  ))}
                </div>
              )
            ) : (
              filteredVenues.length === 0 ? (
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
                  {filteredVenues.map((venue) => (
                    <FoodSpotCard key={venue.id} venue={venue} />
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
        </div>

        {/* Right: Map with Pins */}
        <div
          className={`${
            viewMode === "feed"
              ? "w-0 max-w-0 opacity-0 pointer-events-none"
              : viewMode === "map"
              ? "w-full opacity-100"
              : "w-[54%] xl:w-[58%] opacity-100"
          } h-full relative transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[width,opacity]`}
        >
          <MapRadarView />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE AIRBNB-STYLE HOTEL/RADAR SLIDE-UP VIEW (< lg screens) */}
      {/* ========================================================================= */}
      <div className="flex lg:hidden w-full h-full relative overflow-hidden">
        {/* Full-bleed Map in Background (flows right under the translucent nav) */}
        <div className="absolute inset-0 w-full h-full z-0 pt-[57px]">
          <MapRadarView />
        </div>

        {/* Slide-Up Feed Sheet with 0 Gap Continuous Fluid Expansion */}
        <div
          style={{
            height: `calc(100dvh - 57px + 140px)`,
            transform: `translate3d(0, ${
              isDragging && dragCurrentY !== null
                ? dragCurrentY
                : getSnapTranslateY(mobileSheet)
            }px, 0)`,
            transition: isDragging
              ? "none"
              : "transform 0.35s cubic-bezier(0.2, 0.9, 0.3, 1)",
          }}
          className="absolute left-0 right-0 top-[57px] z-20 bg-white rounded-t-3xl border-t border-zinc-200/80 shadow-2xl flex flex-col will-change-transform pb-[140px]"
        >
          {/* Sheet Grab Handle & Header Bar - Touch Catch Area */}
          <div
            onTouchStart={handleHeaderTouchStart}
            onTouchMove={handleHeaderTouchMove}
            onTouchEnd={handleHeaderTouchEnd}
            onClick={toggleSheetState}
            className="w-full flex flex-col items-center pt-2.5 pb-2 px-4 cursor-pointer select-none bg-white rounded-t-3xl shrink-0 active:bg-zinc-50 transition-colors touch-none"
          >
            {/* Pill grab bar */}
            <div className="w-12 h-1.5 rounded-full bg-zinc-300 hover:bg-zinc-400 transition-colors mb-2" />

            <div className="w-full flex items-center justify-between text-xs px-1">
              <div className="flex items-center gap-1.5">
                <SmakrSIcon className="w-4 h-4 text-[#ff5500] shrink-0" />
                <span className="font-bold text-zinc-900">
                  {feedMode === "food" ? "Smakr Feed" : "Oslo Spots"}
                </span>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-orange-50 text-[#ff5500] border border-orange-200/60">
                  {feedMode === "food" ? filteredPosts.length : filteredVenues.length}
                </span>
              </div>

              {/* Action Buttons for easy 1-tap minimize / maximize */}
              <div className="flex items-center gap-1.5">
                {mobileSheet !== "peek" && (
                  <button
                    onClick={minimizeSheet}
                    className="flex items-center gap-1 text-zinc-600 hover:text-zinc-950 font-medium text-[11px] bg-zinc-100 hover:bg-zinc-200 px-2.5 py-1 rounded-full transition-colors active:scale-95"
                    title="Minimize feed"
                  >
                    <span>Minimize</span>
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-600" />
                  </button>
                )}
                {mobileSheet !== "full" && (
                  <button
                    onClick={maximizeSheet}
                    className="flex items-center gap-1 text-zinc-600 hover:text-zinc-950 font-medium text-[11px] bg-zinc-100 hover:bg-zinc-200 px-2.5 py-1 rounded-full transition-colors active:scale-95"
                    title="Expand feed"
                  >
                    <span>{mobileSheet === "peek" ? "Show feed" : "Expand"}</span>
                    <ChevronUp className="w-3.5 h-3.5 text-zinc-600" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Cravings Category Filter Bar (Visible when sheet is expanded) */}
          <div className={`shrink-0 border-b border-zinc-100 transition-opacity duration-200 ${mobileSheet === "peek" ? "hidden" : "block"}`}>
            <FoodCategoryBar compact />
          </div>

          {/* Scrollable Feed Dishes or Spots with scroll-to-top pull-down minimize */}
          <div
            ref={feedScrollRef}
            onTouchStart={handleContentTouchStart}
            onTouchMove={handleContentTouchMove}
            onTouchEnd={handleContentTouchEnd}
            className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar overscroll-contain pb-28"
          >
            {feedMode === "food" ? (
              filteredPosts.length === 0 ? (
                <div className="py-12 text-center text-xs text-zinc-500 space-y-2">
                  <p>No dishes found for this craving.</p>
                  <button
                    onClick={() => setFeedCategory("all")}
                    className="px-3 py-1 rounded-lg bg-zinc-100 text-zinc-800 text-xs font-medium"
                  >
                    Show all
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredPosts.map((post) => (
                    <FoodPostCard key={post.id} post={post} />
                  ))}
                </div>
              )
            ) : (
              filteredVenues.length === 0 ? (
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredVenues.map((venue) => (
                    <FoodSpotCard key={venue.id} venue={venue} />
                  ))}
                </div>
              )
            )}
          </div>
        </div>

        {/* Floating Glassmorphic Slider on Mobile (Cross-browser WebKit/Chromium/Gecko, Theme-Adaptive) */}
        <div
          className={`lg:hidden fixed bottom-4 left-0 right-0 z-35 flex justify-center pointer-events-none px-4 pb-[max(env(safe-area-inset-bottom,0px),8px)] transition-all duration-300 ease-out ${
            selectedVenue
              ? "opacity-0 pointer-events-none translate-y-6 scale-95"
              : "opacity-100 translate-y-0 scale-100"
          }`}
        >
          <FoodViewSlider
            dishesCount={filteredPosts.length}
            spotsCount={filteredVenues.length}
          />
        </div>
      </div>

      {/* Modals & Floating Spot Cards */}
      <VenueBottomSheet />
      <AuthModal />
      <CreateFoodPostModal />
      <QuickCheckInModal />
      <SpeedTestWidget />

      {/* Real-Time Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-auto sm:max-w-md z-50 flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-zinc-900/95 text-white text-xs font-medium shadow-2xl backdrop-blur-md border border-zinc-700/60 animate-in fade-in slide-in-from-top-3 duration-200">
          <span className="flex-1 leading-relaxed">{toastMessage}</span>
          <button
            onClick={clearToast}
            className="p-1 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors shrink-0"
            aria-label="Dismiss message"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
