"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import {
  X,
  Bookmark,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { FoodPost, Venue } from "@/types";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { VenueReaction } from "@/hooks/useVenueDetail";
import { FEED_BLUR_DARK } from "@/lib/feedImages";
import { formatOsloLocation } from "@/lib/location";

interface DishDetailPopupProps {
  dish: FoodPost | null;
  venue?: Venue | null;
  isOpen: boolean;
  onClose: () => void;
  activeReaction?: VenueReaction | null;
  onReaction?: (dishId: string, type: VenueReaction) => void;
}

export function DishDetailPopup({
  dish,
  venue,
  isOpen,
  onClose,
  activeReaction,
  onReaction,
}: DishDetailPopupProps) {
  const flyToSpot = useCityPulseStore((state) => state.flyToSpot);
  const likedPostIds = useCityPulseStore((state) => state.likedPostIds);
  const savedPostIds = useCityPulseStore((state) => state.savedPostIds);
  const toggleLikePost = useCityPulseStore((state) => state.toggleLikePost);
  const toggleSavePost = useCityPulseStore((state) => state.toggleSavePost);

  // Preserve last non-null dish during exit animation so AnimatePresence can zoom out smoothly
  const lastDishRef = useRef<FoodPost | null>(null);
  if (dish) lastDishRef.current = dish;
  const activeDish = dish ?? lastDishRef.current;

  const [imgReady, setImgReady] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  useEffect(() => {
    setImgReady(false);
    setIsImageZoomed(false);
    setIsDescExpanded(false);
  }, [activeDish?.id]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isImageZoomed) setIsImageZoomed(false);
        else onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isImageZoomed, onClose]);

  if (!activeDish) return null;

  const isLiked = likedPostIds.has(activeDish.id);
  const isSaved = savedPostIds.has(activeDish.id);
  const spotName = venue?.name || activeDish.spot_name;
  const spotAddress = venue?.address || activeDish.spot_address;
  const spotNeighborhood = venue?.neighborhood || activeDish.spot_neighborhood;

  const handleFlyToMap = () => {
    onClose();
    if (activeDish.spot_coords) {
      flyToSpot(activeDish.spot_coords, activeDish.spot_id);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && dish && (
        <motion.div
          key={`dish-popup-${activeDish.id}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="dish-popup-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="fixed inset-0 z-[60] bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 select-none"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 10 }}
            transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.65 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm sm:max-w-md bg-[#FAF7F2] dark:bg-stone-900 rounded-3xl shadow-2xl border border-zinc-200/90 dark:border-white/10 overflow-hidden flex flex-col max-h-[90dvh]"
          >
            {/* Top Floating Close + Save Buttons */}
            <div className="absolute top-3 inset-x-3 z-20 flex items-center justify-between pointer-events-none">
              {activeDish.category ? (
                <span className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-white font-comico text-[10.5px] uppercase tracking-wider border border-white/15 pointer-events-auto">
                  {activeDish.category.replace(/_/g, " ")}
                </span>
              ) : (
                <span />
              )}

              <div className="flex items-center gap-1.5 pointer-events-auto">
                <button
                  type="button"
                  onClick={() => toggleSavePost(activeDish.id)}
                  aria-label={isSaved ? "Saved" : "Save dish"}
                  className={`w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center border transition-all active:scale-90 cursor-pointer ${
                    isSaved
                      ? "bg-[#E84A27] text-white border-[#E84A27]"
                      : "bg-black/45 hover:bg-black/65 text-white border-white/15"
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-white" : ""}`} />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close dialog"
                  className="w-8 h-8 rounded-full bg-black/45 hover:bg-black/65 text-white flex items-center justify-center backdrop-blur-md border border-white/15 transition-all active:scale-90 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Dish Full-Bleed Hero Photo with Integrated Title & Price Overlay */}
            <div
              onClick={() => activeDish.image_url && setIsImageZoomed(true)}
              className={`group/photo relative w-full h-[270px] sm:h-[300px] bg-zinc-900 shrink-0 overflow-hidden ${
                activeDish.image_url ? "cursor-zoom-in" : ""
              }`}
            >
              {activeDish.image_url ? (
                <>
                  <Image
                    src={activeDish.image_url}
                    alt={activeDish.dish_name}
                    fill
                    onLoad={() => setImgReady(true)}
                    placeholder="blur"
                    blurDataURL={FEED_BLUR_DARK}
                    className={`object-cover transition-all duration-500 group-hover/photo:scale-[1.03] ${
                      imgReady ? "opacity-100" : "opacity-0"
                    }`}
                    sizes="(max-width: 640px) 100vw, 448px"
                    unoptimized
                  />
                  <div
                    aria-hidden="true"
                    className={`smakr-shimmer absolute inset-0 pointer-events-none transition-opacity duration-500 ${
                      imgReady ? "opacity-0" : "opacity-100"
                    }`}
                  />
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl bg-orange-50">
                  🍽️
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-[#181615]/90 via-[#181615]/20 to-black/10 pointer-events-none" />

              {/* Bottom Hero Overlay: Title + Price */}
              <div className="absolute inset-x-4 bottom-3.5 z-10 flex items-end justify-between gap-3">
                <h2
                  id="dish-popup-title"
                  className="font-comico font-normal text-[21px] sm:text-[23px] uppercase text-white leading-[1.08] drop-shadow-sm line-clamp-2 min-w-0"
                >
                  {activeDish.dish_name}
                </h2>

                {activeDish.price_nok && (
                  <span className="shrink-0 px-2.5 py-1 rounded-full bg-[#E84A27] text-white font-bold text-[11.5px] shadow-md">
                    {activeDish.price_nok} kr
                  </span>
                )}
              </div>
            </div>

            {/* Clean Warm Oat Editorial Body */}
            <div className="px-5 pt-4 pb-5 overflow-y-auto space-y-3.5 flex-1 bg-[#FAF7F2] dark:bg-stone-900">
              {/* Venue & Pin Location Area */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-[15px] text-[#181615] dark:text-zinc-100 leading-snug">
                    {spotName}
                  </p>
                  <p className="text-[12px] text-[#181615]/65 dark:text-zinc-400 flex items-center gap-1 mt-0.5 leading-snug">
                    <MapPin className="w-3.5 h-3.5 text-[#E84A27] shrink-0" />
                    <span>
                      {formatOsloLocation(spotAddress, spotNeighborhood).fullClean}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleFlyToMap}
                  className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#EFE9DF] hover:bg-[#E5DDD0] dark:bg-white/10 dark:hover:bg-white/15 text-[#181615] dark:text-white font-semibold text-[11.5px] transition-all active:scale-95 cursor-pointer"
                >
                  <span>Map</span>
                  <ExternalLink className="w-3 h-3 text-[#E84A27]" />
                </button>
              </div>

              {/* Hashtags (#) + Expandable Description */}
              {((activeDish.taste_tags && activeDish.taste_tags.length > 0) || activeDish.review_text) && (
                <div className="pt-3 border-t border-[#181615]/8 dark:border-white/10 space-y-2.5">
                  {activeDish.taste_tags && activeDish.taste_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {activeDish.taste_tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-0.5 rounded-full bg-[#EFE9DF]/85 dark:bg-stone-800 text-[#181615]/75 dark:text-stone-300 font-medium text-[11px]"
                        >
                          #{tag.replace(/^#/, "")}
                        </span>
                      ))}
                    </div>
                  )}

                  {activeDish.review_text && (
                    <div className="space-y-1.5">
                      {isDescExpanded && (
                        <div className="space-y-1 pt-0.5">
                          <p className="text-[13.5px] text-[#181615]/85 dark:text-zinc-200 leading-relaxed">
                            {activeDish.review_text}
                          </p>
                          {activeDish.author?.name && (
                            <p className="text-[11px] text-[#181615]/50 dark:text-zinc-400 font-medium">
                              {activeDish.author.name} · {activeDish.author.handle || "@smakr"}
                            </p>
                          )}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsDescExpanded((v) => !v)}
                        className="text-[12px] font-semibold text-[#E84A27] hover:underline cursor-pointer"
                      >
                        {isDescExpanded ? "Show less" : "Show more"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* Fullscreen Smooth Zoom Lightbox */}
          <AnimatePresence>
            {isImageZoomed && activeDish.image_url && (
              <motion.div
                key="dish-zoom-lightbox"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsImageZoomed(false);
                }}
                className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
              >
                <button
                  type="button"
                  onClick={() => setIsImageZoomed(false)}
                  aria-label="Close zoom"
                  className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
                <motion.img
                  src={activeDish.image_url}
                  alt={activeDish.dish_name}
                  initial={{ scale: 0.82, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.82, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 380, damping: 30, mass: 0.65 }}
                  className="max-w-full max-h-[85dvh] rounded-2xl object-contain shadow-2xl select-none"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
