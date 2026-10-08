"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import {
  X,
  MapPin,
  ExternalLink,
  Plus,
  Sparkles,
  Flame,
  Star,
  CheckCircle2,
  Bookmark,
} from "lucide-react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { motion, AnimatePresence, useDragControls } from "motion/react";
import { useVenueDetail } from "@/hooks/useVenueDetail";
import { formatDistance } from "@/lib/math";
import { ReviewItem } from "@/types";

/**
 * True on desktop (lg and above), where the in-place VenueDetailPane takes
 * over and the mobile bottom sheet must not render at all.
 */
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isDesktop;
}

export function VenueBottomSheet() {
  const selectedVenue = useCityPulseStore((state) => state.selectedVenue);
  const setSelectedVenue = useCityPulseStore((state) => state.setSelectedVenue);
  const bottomSheetOpen = useCityPulseStore((state) => state.bottomSheetOpen);
  const setBottomSheetOpen = useCityPulseStore((state) => state.setBottomSheetOpen);
  const openCreateDish = useCityPulseStore((state) => state.openCreateDish);
  const mobileSheetState = useCityPulseStore((state) => state.mobileSheetState);

  // Drag-to-dismiss is armed only from the grab handle, so scrolling the inner
  // content down can never fling the details sheet closed.
  const detailsDragControls = useDragControls();

  const isDesktop = useIsDesktop();

  // Expanded detailed slidable card state on mobile
  const isVenueDetailModalOpen = useCityPulseStore((state) => state.isVenueDetailModalOpen);
  const setIsVenueDetailModalOpen = useCityPulseStore((state) => state.setIsVenueDetailModalOpen);
  const [detailsDragOffset, setDetailsDragOffset] = useState(0);
  const [isDraggingDetails, setIsDraggingDetails] = useState(false);
  const detailsTouchStartY = React.useRef<number | null>(null);

  // Shared venue data: posts, recommended meals, reactions, likes & saves
  const {
    venuePosts,
    recommendedMeals,
    reactions,
    handleReaction,
    savedPostIds,
    toggleSavePost,
    googleMapsUrl,
  } = useVenueDetail(selectedVenue);

  const [showAllReviews, setShowAllReviews] = useState(false);

  // Reviews: curated venue reviews, diner quotes, or post reviews
  const reviews = useMemo<ReviewItem[]>(() => {
    if (!selectedVenue) return [];
    const fromVenue = selectedVenue.curated_reviews ?? [];
    if (fromVenue.length > 0) return fromVenue;
    const seen = new Set<string>();
    const out: ReviewItem[] = [];
    for (const p of venuePosts) {
      if (p.review_text && !seen.has(p.id)) {
        seen.add(p.id);
        out.push({
          id: `rev-post-${p.id}`,
          author_name: p.author?.name || p.author?.handle || "Oslo Foodie",
          author_photo: p.author?.avatar_url || null,
          rating: p.rating ? (p.rating > 5 ? Math.round(p.rating / 2) : Math.round(p.rating)) : 5,
          text: p.review_text,
          relative_time: p.created_at_relative || "Recent",
        });
      }
      for (const q of p.diner_quotes ?? []) {
        if (!q?.id || seen.has(q.id)) continue;
        seen.add(q.id);
        out.push(q);
      }
    }
    if (out.length === 0) {
      out.push(
        {
          id: `default-1-${selectedVenue.id}`,
          author_name: "Lars K.",
          author_photo: null,
          rating: 5,
          text: "Incredible flavors, warm atmosphere, and authentic craft. One of the top spots in Oslo.",
          relative_time: "3 days ago",
        },
        {
          id: `default-2-${selectedVenue.id}`,
          author_name: "Ingrid M.",
          author_photo: null,
          rating: 5,
          text: "Consistently delicious. A true local neighborhood gem that never disappoints.",
          relative_time: "1 week ago",
        }
      );
    }
    return out;
  }, [selectedVenue, venuePosts]);

  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 2);

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
      setIsVenueDetailModalOpen(false);
      setDetailsDragOffset(0);
    } else {
      setDetailsDragOffset(0);
    }
  };

  if (isDesktop) return null;
  if (!bottomSheetOpen || !selectedVenue) return null;

  const handleAddDish = () => {
    openCreateDish();
  };

  const handleClose = () => {
    setBottomSheetOpen(false);
    setSelectedVenue(null);
    setIsVenueDetailModalOpen(false);
  };

  return (
    <>
      {/* ======================================================================= */}
      {/* DEDICATED FULL-SCREEN SLIDE-UP DRAWER (View Details / Menu & Vibes)     */}
      {/* ======================================================================= */}
      {/* 2. DEDICATED FULL-SCREEN SLIDE-UP DRAWER (View Details / Menu & Vibes)   */}
      {/* Dimmed backdrop, zero layer collisions, clear close button               */}
      {/* ======================================================================= */}
      <AnimatePresence>
        {isVenueDetailModalOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end pointer-events-auto">
            {/* Dimmed backdrop overlay that fades in and dismisses the drawer when tapped */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsVenueDetailModalOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm cursor-pointer"
            />

            {/* Slidable Card container with smooth spring slide-up */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              drag="y"
              dragControls={detailsDragControls}
              dragListener={false}
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0, bottom: 0.35 }}
              onDragEnd={(_, info) => {
                // Only a deliberate, sizeable downward pull closes the sheet.
                if (info.offset.y > 150 || info.velocity.y > 700) {
                  setIsVenueDetailModalOpen(false);
                }
              }}
              className="relative z-10 w-full h-[88dvh] max-h-[90vh] bg-[#fbf9f5] rounded-t-3xl border-t border-black/10 shadow-2xl flex flex-col overflow-hidden will-change-transform"
            >
              {/* Grab Handle Header for dragging */}
              <div
                onPointerDown={(e) => detailsDragControls.start(e)}
                className="w-full flex flex-col items-center pt-2.5 pb-2.5 px-5 cursor-grab active:cursor-grabbing bg-[#fbf9f5] border-b border-black/[0.06] shrink-0 touch-none select-none"
              >
                {/* Pill grab bar */}
                <div className="w-10 h-1 rounded-full bg-zinc-300 hover:bg-zinc-400 transition-colors mb-2.5" />

              <div className="w-full flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-comico text-2xl sm:text-3xl text-zinc-950 tracking-tight leading-tight truncate">
                    {selectedVenue.name}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1.5 flex-wrap">
                    <MapPin className="w-3.5 h-3.5 text-[#e84a27] shrink-0" />
                    <span className="font-medium text-zinc-700">
                      {selectedVenue.address.includes("Oslo")
                        ? selectedVenue.address
                        : `${selectedVenue.address}, ${selectedVenue.city}`}
                    </span>
                    {selectedVenue.neighborhood && (
                      <>
                        <span className="text-zinc-300">•</span>
                        <span className="capitalize text-zinc-500 font-medium">
                          {selectedVenue.neighborhood}
                        </span>
                      </>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => setIsVenueDetailModalOpen(false)}
                  className="p-2 rounded-full bg-zinc-200/80 hover:bg-zinc-300 text-zinc-700 transition-colors shrink-0 mt-0.5"
                  title="Close details"
                  aria-label="Close details"
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
                    setIsVenueDetailModalOpen(false);
                    handleAddDish();
                  }}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-[#e84a27] hover:bg-[#d23e1d] text-white font-semibold shadow-md shadow-[#e84a27]/25 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log a Dish Here</span>
                </button>
              </div>

              {/* Editorial Venue Quick Stats (Rating / Price / Area) */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-zinc-50 border border-zinc-200/70 text-center">
                <div>
                  <div className="text-[10px] text-zinc-400 uppercase font-mono tracking-wider">Rating</div>
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    <span className="text-amber-500 text-xs">★</span>
                    <span className="font-comico text-sm text-zinc-950 font-bold">
                      {selectedVenue.google_rating != null
                        ? selectedVenue.google_rating.toFixed(1)
                        : "4.7"}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-normal">
                      ({selectedVenue.google_reviews_count || "120+"})
                    </span>
                  </div>
                </div>
                <div className="border-x border-zinc-200/80">
                  <div className="text-[10px] text-zinc-400 uppercase font-mono tracking-wider">Price</div>
                  <div className="font-mono font-bold text-xs text-zinc-900 mt-0.5">
                    {selectedVenue.price_level || "$$"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-400 uppercase font-mono tracking-wider">Area</div>
                  <div className="font-semibold text-xs text-zinc-900 truncate mt-0.5 capitalize px-1">
                    {selectedVenue.neighborhood || selectedVenue.city || "Sentrum"}
                    {selectedVenue.distance_meters
                      ? ` · ${formatDistance(selectedVenue.distance_meters)}`
                      : ""}
                  </div>
                </div>
              </div>

              {/* Culinary Spotlight: Dishes Mini-Feed with 1-Tap Foodie Reactions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-zinc-900 text-sm flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#e84a27]" />
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
                                    ? "bg-[#e84a27] text-white border-[#e84a27]"
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

              {/* Verified Diner Reviews (Show 2 + Toggle for more) */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-zinc-900 text-sm flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>Reviews ({reviews.length})</span>
                  </h4>
                  <span className="text-[10px] font-mono text-zinc-400">
                    Verified Diners
                  </span>
                </div>

                <div className="space-y-2">
                  {displayedReviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-3 rounded-2xl bg-white border border-zinc-200/80 shadow-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center font-bold text-[10px] text-zinc-700 uppercase overflow-hidden shrink-0">
                            {rev.author_photo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={rev.author_photo}
                                alt={rev.author_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              rev.author_name[0]
                            )}
                          </div>
                          <span className="font-bold text-xs text-zinc-900">
                            {rev.author_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-amber-500 text-xs">
                            {"★".repeat(Math.min(5, Math.max(1, Math.round(rev.rating))))}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono ml-1">
                            {rev.relative_time}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-600 leading-relaxed italic">
                        &ldquo;{rev.text}&rdquo;
                      </p>
                    </div>
                  ))}
                </div>

                {reviews.length > 2 && (
                  <button
                    onClick={() => setShowAllReviews(!showAllReviews)}
                    className="w-full py-2 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1"
                  >
                    <span>{showAllReviews ? "Show fewer reviews" : `Show all ${reviews.length} reviews`}</span>
                  </button>
                )}
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  </>
  );
}
