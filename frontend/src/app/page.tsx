"use client";

import React, { useEffect, useState, useRef } from "react";
import { FoodCategoryBar } from "@/components/food/FoodCategoryBar";
import { FoodFeed } from "@/components/food/FoodFeed";
import { FoodPostCard } from "@/components/food/FoodPostCard";
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
  const setVenues = useCityPulseStore((state) => state.setVenues);
  const viewMode = useCityPulseStore((state) => state.viewMode);
  const foodPosts = useCityPulseStore((state) => state.foodPosts);
  const currentCategory = useCityPulseStore((state) => state.feedCategory);
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

  const activeCategoryDef = FOOD_CATEGORIES.find((c) => c.id === currentCategory) || FOOD_CATEGORIES[0];

  // Industry-standard dual-mode bottom sheet touch physics
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const headerTouchStartY = useRef<number | null>(null);
  const headerTouchStartTime = useRef<number>(0);

  // Content scroll container ref & pull-to-minimize tracker
  const feedScrollRef = useRef<HTMLDivElement>(null);
  const contentTouchStartY = useRef<number | null>(null);
  const contentTouchStartTime = useRef<number>(0);
  const contentTopAnchorY = useRef<number | null>(null);
  const isContentPulling = useRef<boolean>(false);

  // 1. Header Grab Bar Handlers (Direct 1:1 translation with spring momentum)
  const handleHeaderTouchStart = (e: React.TouchEvent) => {
    headerTouchStartY.current = e.touches[0].clientY;
    headerTouchStartTime.current = Date.now();
    setIsDragging(true);
  };

  const handleHeaderTouchMove = (e: React.TouchEvent) => {
    if (headerTouchStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    let delta = currentY - headerTouchStartY.current;

    // Apply elastic resistance at top and bottom limits
    if (mobileSheet === "full" && delta < 0) {
      delta = delta * 0.25;
    } else if (mobileSheet === "peek" && delta > 0) {
      delta = delta * 0.25;
    }

    setDragOffset(delta);
  };

  const handleHeaderTouchEnd = (e: React.TouchEvent) => {
    if (headerTouchStartY.current === null) return;
    const endY = e.changedTouches[0].clientY;
    const deltaY = endY - headerTouchStartY.current;
    const deltaTime = Math.max(1, Date.now() - headerTouchStartTime.current);
    const velocityY = deltaY / deltaTime;

    headerTouchStartY.current = null;
    setIsDragging(false);
    setDragOffset(0);

    // Momentum-aware snapping
    if (velocityY < -0.25 || deltaY < -45) {
      // Swiped UP
      if (mobileSheet === "peek") {
        setMobileSheet(velocityY < -0.65 || deltaY < -120 ? "full" : "half");
      } else if (mobileSheet === "half") {
        setMobileSheet("full");
      }
    } else if (velocityY > 0.25 || deltaY > 45) {
      // Swiped DOWN
      if (mobileSheet === "full") {
        setMobileSheet(velocityY > 0.65 || deltaY > 150 ? "peek" : "half");
      } else if (mobileSheet === "half") {
        setMobileSheet("peek");
      }
    }
  };

  // 2. Scrollable Dishes Content Handlers (Pull-down at top of feed minimizes sheet)
  const handleContentTouchStart = (e: React.TouchEvent) => {
    contentTouchStartY.current = e.touches[0].clientY;
    contentTouchStartTime.current = Date.now();
    contentTopAnchorY.current = null;
    isContentPulling.current = false;
  };

  const handleContentTouchMove = (e: React.TouchEvent) => {
    if (contentTouchStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    const scrollTop = feedScrollRef.current ? feedScrollRef.current.scrollTop : 0;

    // If at or above the top of the feed list
    if (scrollTop <= 1) {
      if (contentTopAnchorY.current === null) {
        contentTopAnchorY.current = currentY;
      }
      const pullDown = currentY - contentTopAnchorY.current;

      if (pullDown > 5) {
        // Active downward pull at the top of the feed list
        isContentPulling.current = true;
        setIsDragging(true);
        // Smooth damped downward sheet translation
        setDragOffset(pullDown * 0.85);
      }
    } else {
      contentTopAnchorY.current = null;
      if (isContentPulling.current) {
        isContentPulling.current = false;
        setIsDragging(false);
        setDragOffset(0);
      }
    }
  };

  const handleContentTouchEnd = (e: React.TouchEvent) => {
    if (isContentPulling.current && contentTopAnchorY.current !== null) {
      const endY = e.changedTouches[0].clientY;
      const pullDown = endY - contentTopAnchorY.current;
      const deltaTime = Math.max(1, Date.now() - contentTouchStartTime.current);
      const velocityY = pullDown / deltaTime;

      if (pullDown > 45 || velocityY > 0.3) {
        // Pull-to-minimize triggered smoothly
        if (mobileSheet === "full") {
          setMobileSheet(pullDown > 180 || velocityY > 0.75 ? "peek" : "half");
        } else if (mobileSheet === "half") {
          setMobileSheet("peek");
        }
      }
    }

    contentTouchStartY.current = null;
    contentTopAnchorY.current = null;
    isContentPulling.current = false;
    setIsDragging(false);
    setDragOffset(0);
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
          } h-full bg-white flex flex-col overflow-hidden transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[width,opacity]`}
        >
          <FoodCategoryBar />
          <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
            <div className="flex items-center justify-between pb-1 border-b border-zinc-100">
              <div>
                <h2 className="text-sm font-bold text-zinc-900 tracking-tight flex items-center gap-1.5">
                  <SmakrSIcon className="w-3.5 h-3.5 text-[#ff5500] shrink-0" />
                  <span>{activeCategoryDef.label} in Oslo</span>
                </h2>
                <p className="text-xs text-zinc-500">
                  {activeCategoryDef.shortDesc}
                </p>
              </div>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
                {filteredPosts.length} dishes
              </span>
            </div>

            {filteredPosts.length === 0 ? (
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
            )}
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

        {/* Slide-Up Feed Sheet */}
        <div
          style={{
            transform: `translate3d(0, ${dragOffset}px, 0)`,
            transition: isDragging
              ? "none"
              : "transform 0.32s cubic-bezier(0.2, 0.9, 0.3, 1), height 0.32s cubic-bezier(0.2, 0.9, 0.3, 1)",
          }}
          className={`absolute left-0 right-0 bottom-0 z-20 bg-white rounded-t-3xl border-t border-zinc-200/80 shadow-2xl flex flex-col will-change-transform ${
            mobileSheet === "peek"
              ? "h-[136px] pb-[max(env(safe-area-inset-bottom,0px),16px)]"
              : mobileSheet === "half"
              ? "h-[54dvh]"
              : "h-[calc(100dvh-64px)]"
          }`}
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
                <span className="font-bold text-zinc-900">Smakr Feed</span>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-orange-50 text-[#ff5500] border border-orange-200/60">
                  {filteredPosts.length}
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

          {/* Cravings Category Filter Bar */}
          <div className="shrink-0 border-b border-zinc-100">
            <FoodCategoryBar compact />
          </div>

          {/* Scrollable Feed Dishes with scroll-to-top pull-down minimize */}
          <div
            ref={feedScrollRef}
            onTouchStart={handleContentTouchStart}
            onTouchMove={handleContentTouchMove}
            onTouchEnd={handleContentTouchEnd}
            className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar overscroll-contain"
          >
            {filteredPosts.length === 0 ? (
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-12">
                {filteredPosts.map((post) => (
                  <FoodPostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>
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
