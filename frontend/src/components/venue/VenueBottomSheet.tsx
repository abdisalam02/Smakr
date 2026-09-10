"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  X,
  MapPin,
  ExternalLink,
  ChevronRight,
  Plus,
  Sparkles,
  Flame,
  Star,
  CheckCircle2,
  Bookmark,
  Share2,
} from "lucide-react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { formatDistance } from "@/lib/math";
import { FoodPost } from "@/types";

export function VenueBottomSheet() {
  const selectedVenue = useCityPulseStore((state) => state.selectedVenue);
  const setSelectedVenue = useCityPulseStore((state) => state.setSelectedVenue);
  const bottomSheetOpen = useCityPulseStore((state) => state.bottomSheetOpen);
  const setBottomSheetOpen = useCityPulseStore((state) => state.setBottomSheetOpen);
  const setIsCreateBiteModalOpen = useCityPulseStore((state) => state.setIsCreateBiteModalOpen);
  const currentUser = useCityPulseStore((state) => state.currentUser);
  const setIsAuthModalOpen = useCityPulseStore((state) => state.setIsAuthModalOpen);
  const foodPosts = useCityPulseStore((state) => state.foodPosts);
  const mobileSheetState = useCityPulseStore((state) => state.mobileSheetState);
  const savedPostIds = useCityPulseStore((state) => state.savedPostIds);
  const toggleSavePost = useCityPulseStore((state) => state.toggleSavePost);
  const showToast = useCityPulseStore((state) => state.showToast);

  // Expanded detailed slidable card state on mobile
  const [isExpandedModalOpen, setIsExpandedModalOpen] = useState(false);
  const [detailsDragOffset, setDetailsDragOffset] = useState(0);
  const [isDraggingDetails, setIsDraggingDetails] = useState(false);
  const detailsTouchStartY = React.useRef<number | null>(null);

  // Local interactive food discovery reactions (Craving, Must Order, Ate Here)
  const [reactions, setReactions] = useState<Record<string, "craving" | "must_try" | "ate_here" | null>>({});

  const handleDetailsTouchStart = (e: React.TouchEvent) => {
    detailsTouchStartY.current = e.touches[0].clientY;
    setIsDraggingDetails(true);
  };

  const handleDetailsTouchMove = (e: React.TouchEvent) => {
    if (detailsTouchStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - detailsTouchStartY.current;
    if (deltaY > 0) {
      setDetailsDragOffset(deltaY);
    }
  };

  const handleDetailsTouchEnd = (e: React.TouchEvent) => {
    if (detailsTouchStartY.current === null) return;
    const endY = e.changedTouches[0].clientY;
    const deltaY = endY - detailsTouchStartY.current;
    detailsTouchStartY.current = null;
    setIsDraggingDetails(false);

    if (deltaY > 90) {
      setIsExpandedModalOpen(false);
      setDetailsDragOffset(0);
    } else {
      setDetailsDragOffset(0);
    }
  };

  if (!bottomSheetOpen || !selectedVenue) return null;

  // Filter posts matching this spot
  const venuePosts = foodPosts.filter(
    (p) =>
      p.spot_id === selectedVenue.id ||
      p.spot_name.toLowerCase() === selectedVenue.name.toLowerCase()
  );

  // Build a recommended dishes array combining community posts & signature dishes
  const fallbackImages = [
    "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80",
  ];

  const recommendedMeals = [
    ...venuePosts,
    ...(selectedVenue.signature_dishes || [])
      .filter((dish) => !venuePosts.some((p) => p.dish_name.toLowerCase().includes(dish.toLowerCase())))
      .map((dish, i) => ({
        id: `sig-${selectedVenue.id}-${i}`,
        spot_id: selectedVenue.id,
        spot_name: selectedVenue.name,
        spot_address: selectedVenue.address,
        spot_neighborhood: selectedVenue.city,
        spot_coords: [selectedVenue.longitude, selectedVenue.latitude] as [number, number],
        dish_name: dish,
        category: selectedVenue.food_category || "coffee",
        image_url: fallbackImages[i % fallbackImages.length],
        price_nok: 85 + (i * 25),
        rating: 9.6 - (i * 0.2),
        taste_tags: ["Chef Signature", "Must Order"],
        review_text: `Signature house specialty recommended by foodies visiting ${selectedVenue.name}.`,
        author: {
          name: "Oslo Foodie Radar",
          handle: "@smakr_radar",
          avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80",
          badge: "Verified Foodie" as const,
        },
        likes_count: 85 + (i * 18),
        saves_count: 42 + (i * 9),
      })),
  ];

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    selectedVenue.name + ", " + selectedVenue.address + ", Oslo"
  )}`;

  const handleAddDish = () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
    } else {
      setIsCreateBiteModalOpen(true);
    }
  };

  const handleClose = () => {
    setBottomSheetOpen(false);
    setSelectedVenue(null);
    setIsExpandedModalOpen(false);
  };

  const handleReaction = (dishId: string, type: "craving" | "must_try" | "ate_here") => {
    const current = reactions[dishId];
    const next = current === type ? null : type;
    setReactions((prev) => ({ ...prev, [dishId]: next }));

    if (next === "craving") showToast("Added to your cravings list 🔥");
    else if (next === "must_try") showToast("Marked as Must-Order ⭐");
    else if (next === "ate_here") showToast("Marked as tried! 🍽️");
  };

  return (
    <>
      {/* ======================================================================= */}
      {/* 1. MOBILE FLOATING CARD WITH RECOMMENDED MEALS MINI-FEED                */}
      {/* ======================================================================= */}
      {mobileSheetState === "peek" && (
        <div className="sm:hidden fixed bottom-[148px] left-3 right-3 z-40 bg-white/98 backdrop-blur-xl rounded-3xl border border-zinc-200/90 shadow-2xl p-3.5 flex flex-col space-y-3 animate-in slide-in-from-bottom-4 duration-200">
          {/* Header row */}
          <div className="flex items-center gap-3">
            {selectedVenue.cover_image_url && (
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-zinc-100 shrink-0 border border-zinc-200 shadow-xs">
                <Image
                  src={selectedVenue.cover_image_url}
                  alt={selectedVenue.name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
            )}

            <div className="flex-1 min-w-0 pr-5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-sm font-extrabold text-zinc-950 truncate tracking-tight">
                  {selectedVenue.name}
                </h3>
                {selectedVenue.price_level && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-700">
                    {selectedVenue.price_level}
                  </span>
                )}
              </div>

              <p className="text-[11px] text-zinc-500 truncate flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-[#ff5500] shrink-0" />
                <span className="truncate">{selectedVenue.address}, {selectedVenue.city}</span>
              </p>

              {selectedVenue.distance_meters && (
                <p className="text-[10px] font-semibold text-emerald-600 mt-0.5">
                  {formatDistance(selectedVenue.distance_meters)} away
                </p>
              )}
            </div>

            <button
              onClick={handleClose}
              className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-700 p-1.5 rounded-full hover:bg-zinc-100 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Recommended Meals Mini-Feed (Horizontal scrollable cards) */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-zinc-900 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#ff5500]" />
                <span>Recommended Meals ({recommendedMeals.length})</span>
              </span>
              <button
                onClick={() => setIsExpandedModalOpen(true)}
                className="text-[10px] text-[#ff5500] font-semibold hover:underline"
              >
                View all
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 -mx-1 px-1">
              {recommendedMeals.slice(0, 4).map((dish) => (
                <div
                  key={dish.id}
                  onClick={() => setIsExpandedModalOpen(true)}
                  className="w-44 shrink-0 rounded-2xl bg-zinc-50 border border-zinc-200/80 p-2 cursor-pointer hover:border-zinc-300 transition-all active:scale-98"
                >
                  <div className="relative w-full h-20 rounded-xl overflow-hidden mb-1.5 bg-zinc-200">
                    <Image
                      src={dish.image_url}
                      alt={dish.dish_name}
                      fill
                      className="object-cover"
                      sizes="176px"
                      unoptimized
                    />
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white text-[9px] font-mono font-bold">
                      {dish.price_nok} NOK
                    </span>
                  </div>
                  <h4 className="font-bold text-zinc-900 text-[11px] truncate leading-tight">
                    {dish.dish_name}
                  </h4>
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-1">
                    <span className="text-amber-500 font-bold">★ {dish.rating}</span>
                    <span className="truncate text-zinc-400">
                      {dish.taste_tags?.[0] || "Signature"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-2 text-xs">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold text-[11px] transition-colors"
            >
              <span>Directions</span>
              <ExternalLink className="w-3 h-3 text-zinc-500" />
            </a>

            <button
              onClick={() => {
                handleAddDish();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-[11px] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log a Dish</span>
            </button>

            <button
              onClick={() => setIsExpandedModalOpen(true)}
              className="flex items-center justify-center p-2 rounded-xl bg-orange-50 text-[#ff5500] border border-orange-200 hover:bg-orange-100 transition-colors"
              title="More details"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* 2. DESKTOP FLOATING CARD WITH RECOMMENDED MEALS MINI-FEED               */}
      {/* ======================================================================= */}
      <div className="hidden sm:flex fixed bottom-6 right-6 z-40 w-[420px] bg-white/98 backdrop-blur-md rounded-3xl border border-zinc-200/90 shadow-2xl p-4 flex-col space-y-3.5 animate-in slide-in-from-bottom-5 duration-200">
        {/* Header */}
        <div className="flex items-start gap-3.5">
          {selectedVenue.cover_image_url && (
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-zinc-100 shrink-0 border border-zinc-200 shadow-xs">
              <Image
                src={selectedVenue.cover_image_url}
                alt={selectedVenue.name}
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
          )}

          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-base font-extrabold text-zinc-950 truncate tracking-tight">
                {selectedVenue.name}
              </h3>
              {selectedVenue.price_level && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600">
                  {selectedVenue.price_level}
                </span>
              )}
            </div>

            <p className="text-[11px] text-zinc-500 truncate mt-0.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#ff5500] shrink-0" />
              <span className="truncate">{selectedVenue.address}, {selectedVenue.city}</span>
            </p>

            {selectedVenue.distance_meters && (
              <p className="text-[10px] font-medium text-emerald-600 mt-0.5">
                {formatDistance(selectedVenue.distance_meters)} away
              </p>
            )}

            {/* Foodie community signal */}
            <div className="flex items-center gap-1.5 mt-1 text-[10px] font-medium text-zinc-600">
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-orange-50 text-[#ff5500] font-semibold border border-orange-200/60">
                🔥 16 foodies visited
              </span>
              <span className="text-zinc-400">·</span>
              <span className="text-zinc-500">Fast service</span>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="absolute top-3.5 right-3.5 text-zinc-400 hover:text-zinc-700 p-1.5 rounded-full hover:bg-zinc-100 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Recommended Meals Mini-Feed */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-zinc-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#ff5500]" />
              <span>Recommended Meals ({recommendedMeals.length})</span>
            </span>
            <button
              onClick={() => setIsExpandedModalOpen(true)}
              className="text-[11px] text-[#ff5500] font-semibold hover:underline"
            >
              See all
            </button>
          </div>

          <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1 -mx-1 px-1">
            {recommendedMeals.slice(0, 4).map((dish) => (
              <div
                key={dish.id}
                onClick={() => setIsExpandedModalOpen(true)}
                className="w-44 shrink-0 rounded-2xl bg-zinc-50/80 border border-zinc-200/80 p-2 cursor-pointer hover:border-zinc-300 hover:bg-zinc-100/60 transition-all active:scale-98"
              >
                <div className="relative w-full h-20 rounded-xl overflow-hidden mb-1.5 bg-zinc-200">
                  <Image
                    src={dish.image_url}
                    alt={dish.dish_name}
                    fill
                    className="object-cover"
                    sizes="176px"
                  />
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white text-[9px] font-mono font-bold">
                    {dish.price_nok} NOK
                  </span>
                </div>
                <h4 className="font-bold text-zinc-900 text-[11.5px] truncate leading-tight">
                  {dish.dish_name}
                </h4>
                <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-1">
                  <span className="text-amber-500 font-bold">★ {dish.rating}</span>
                  <span className="truncate text-zinc-400 font-mono text-[9px]">
                    {dish.taste_tags?.[0] || "Signature"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Row */}
        <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-2 text-xs">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-700 font-semibold text-[11px] border border-zinc-200 transition-colors shadow-xs"
          >
            <span>Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
          </a>

          <button
            onClick={() => handleAddDish()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold text-[11px] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log a Dish</span>
          </button>

          <button
            onClick={() => setIsExpandedModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 font-semibold text-[11px] shadow-xs transition-colors"
          >
            <span>Full Radar</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* 3. SLIDABLE EXPANDED FULL DETAILS CARD WITH DISCOVERY SPOTLIGHT         */}
      {/* ======================================================================= */}
      {isExpandedModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end pointer-events-auto">
          {/* Top gap: slightly shows map at top (~14vh) with dismiss on tap */}
          <div
            onClick={() => setIsExpandedModalOpen(false)}
            className="w-full h-[14vh] bg-black/35 backdrop-blur-[2px] cursor-pointer flex items-center justify-center transition-opacity"
          >
            <div className="px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-zinc-800 text-[11px] font-bold shadow-md">
              Slide down or tap map to close
            </div>
          </div>

          {/* Slidable Card container */}
          <div
            style={{
              transform: `translate3d(0, ${detailsDragOffset}px, 0)`,
              transition: isDraggingDetails
                ? "none"
                : "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            className="w-full h-[86vh] max-h-[86vh] bg-white rounded-t-3xl border-t border-zinc-200/90 shadow-2xl flex flex-col overflow-hidden will-change-transform"
          >
            {/* Grab Handle Header for dragging */}
            <div
              onTouchStart={handleDetailsTouchStart}
              onTouchMove={handleDetailsTouchMove}
              onTouchEnd={handleDetailsTouchEnd}
              className="w-full flex flex-col items-center pt-2.5 pb-2 px-5 cursor-grab active:cursor-grabbing bg-white border-b border-zinc-100 shrink-0 touch-none select-none"
            >
              {/* Pill grab bar */}
              <div className="w-12 h-1.5 rounded-full bg-zinc-300 hover:bg-zinc-400 transition-colors mb-2" />

              <div className="w-full flex items-center justify-between">
                <div className="min-w-0 pr-4">
                  <h3 className="text-base font-extrabold text-zinc-950 truncate tracking-tight">
                    {selectedVenue.name}
                  </h3>
                  <p className="text-xs text-zinc-500 truncate">
                    {selectedVenue.address}, {selectedVenue.city}
                  </p>
                </div>
                <button
                  onClick={() => setIsExpandedModalOpen(false)}
                  className="p-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 transition-colors shrink-0"
                  title="Close details"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs no-scrollbar">
              {/* Cover Photo */}
              {selectedVenue.cover_image_url && (
                <div className="relative w-full h-52 rounded-3xl overflow-hidden border border-zinc-200 bg-zinc-100 shadow-xs">
                  <Image
                    src={selectedVenue.cover_image_url}
                    alt={selectedVenue.name}
                    fill
                    className="object-cover"
                    sizes="600px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                    <span className="font-bold text-sm tracking-tight drop-shadow-sm">
                      {selectedVenue.live_food_status || "Oslo Culinary Hotspot"}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-mono font-bold border border-white/20">
                      {selectedVenue.price_level || "$$"}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2.5">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-800 font-semibold"
                >
                  <span>Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                </a>

                <button
                  onClick={() => {
                    setIsExpandedModalOpen(false);
                    handleAddDish();
                  }}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-[#ff5500] hover:bg-[#e04b00] text-white font-semibold shadow-md shadow-[#ff5500]/25 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log a Dish Here</span>
                </button>
              </div>

              {/* Food Discovery Signals (Not Social Media, Just Food Utility) */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-zinc-50 border border-zinc-100 text-center">
                <div>
                  <div className="text-[10px] text-zinc-400 uppercase font-mono">Live Vibe</div>
                  <div className="font-extrabold text-zinc-900 text-xs mt-0.5 text-emerald-600">
                    Optimal
                  </div>
                </div>
                <div className="border-x border-zinc-200/80">
                  <div className="text-[10px] text-zinc-400 uppercase font-mono">Check-Ins</div>
                  <div className="font-extrabold text-zinc-900 text-xs mt-0.5">
                    16 today
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-400 uppercase font-mono">Queue</div>
                  <div className="font-extrabold text-zinc-900 text-xs mt-0.5">
                    &lt; 5 mins
                  </div>
                </div>
              </div>

              {/* Culinary Spotlight: Dishes Mini-Feed with 1-Tap Foodie Reactions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-zinc-900 text-sm flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#ff5500]" />
                    <span>Dishes You Can't Miss ({recommendedMeals.length})</span>
                  </h4>
                  <span className="text-[10px] font-mono text-zinc-400">
                    Foodie Radar Verified
                  </span>
                </div>

                <div className="space-y-3">
                  {recommendedMeals.map((dish) => {
                    const activeReaction = reactions[dish.id];
                    const isSaved = savedPostIds.has(dish.id);

                    return (
                      <div
                        key={dish.id}
                        className="p-3.5 rounded-2xl bg-white border border-zinc-200/80 shadow-xs flex flex-col sm:flex-row gap-3.5"
                      >
                        {/* Dish Photo */}
                        <div className="relative w-full sm:w-28 h-32 sm:h-28 rounded-xl overflow-hidden bg-zinc-100 shrink-0 border border-zinc-100">
                          <Image
                            src={dish.image_url}
                            alt={dish.dish_name}
                            fill
                            className="object-cover"
                            sizes="120px"
                          />
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-white font-mono font-bold text-[10px]">
                            {dish.price_nok} NOK
                          </span>
                        </div>

                        {/* Details */}
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="font-extrabold text-zinc-900 text-xs leading-snug">
                                {dish.dish_name}
                              </h5>
                              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-bold text-[10px] shrink-0 border border-amber-200/60">
                                <span>★</span>
                                <span className="font-mono">{dish.rating}</span>
                              </div>
                            </div>

                            {dish.review_text && (
                              <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2 italic leading-relaxed">
                                "{dish.review_text}"
                              </p>
                            )}

                            {dish.taste_tags && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {dish.taste_tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 text-[9px] font-medium"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* 1-Tap Foodie Reactions */}
                          <div className="pt-2 mt-2 border-t border-zinc-100 flex items-center justify-between gap-1.5 text-[10px]">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleReaction(dish.id, "craving")}
                                className={`flex items-center gap-1 px-2 py-1 rounded-lg border font-semibold transition-all ${
                                  activeReaction === "craving"
                                    ? "bg-orange-500 text-white border-orange-500"
                                    : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100"
                                }`}
                              >
                                <Flame className="w-3 h-3" />
                                <span>Craving</span>
                              </button>

                              <button
                                onClick={() => handleReaction(dish.id, "must_try")}
                                className={`flex items-center gap-1 px-2 py-1 rounded-lg border font-semibold transition-all ${
                                  activeReaction === "must_try"
                                    ? "bg-amber-500 text-white border-amber-500"
                                    : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100"
                                }`}
                              >
                                <Star className="w-3 h-3" />
                                <span>Must Try</span>
                              </button>

                              <button
                                onClick={() => handleReaction(dish.id, "ate_here")}
                                className={`flex items-center gap-1 px-2 py-1 rounded-lg border font-semibold transition-all ${
                                  activeReaction === "ate_here"
                                    ? "bg-emerald-600 text-white border-emerald-600"
                                    : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100"
                                }`}
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Tried</span>
                              </button>
                            </div>

                            <button
                              onClick={() => toggleSavePost(dish.id)}
                              className={`p-1.5 rounded-lg border transition-all ${
                                isSaved
                                  ? "bg-zinc-900 text-white border-zinc-900"
                                  : "bg-zinc-50 text-zinc-500 border-zinc-200 hover:bg-zinc-100"
                              }`}
                              title={isSaved ? "Saved to your list" : "Save dish"}
                            >
                              <Bookmark className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* About description */}
              {selectedVenue.description && (
                <div className="space-y-1.5 pt-2">
                  <h4 className="font-bold text-zinc-700 uppercase text-[10px] tracking-wider">
                    Culinary Story & Ambiance
                  </h4>
                  <p className="text-zinc-600 leading-relaxed bg-zinc-50 p-3.5 rounded-2xl border border-zinc-100 text-xs">
                    {selectedVenue.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
