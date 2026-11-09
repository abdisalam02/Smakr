"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import {
  X,
  Star,
  Flame,
  CheckCircle2,
  Heart,
  Bookmark,
  MapPin,
  ExternalLink,
  ZoomIn,
} from "lucide-react";
import { FoodPost, Venue } from "@/types";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { VenueReaction } from "@/hooks/useVenueDetail";
import { FEED_BLUR_DARK } from "@/lib/feedImages";

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

  useEffect(() => {
    setImgReady(false);
    setIsImageZoomed(false);
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
            {/* Top Floating Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-95 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Dish High-Res Photo Header (Click to Zoom Fullscreen) */}
            <div
              onClick={() => activeDish.image_url && setIsImageZoomed(true)}
              className={`group/photo relative w-full aspect-[4/3] bg-zinc-900 shrink-0 overflow-hidden ${
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
                  <span className="absolute bottom-3 left-3 px-2 py-1 rounded-lg bg-black/55 backdrop-blur-md text-white/90 text-[10px] font-semibold flex items-center gap-1 opacity-0 group-hover/photo:opacity-100 transition-opacity pointer-events-none">
                    <ZoomIn className="w-3 h-3" />
                    <span>Tap to zoom</span>
                  </span>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl bg-orange-50">
                  🍽️
                </div>
              )}

              {/* Price Sticker Tag */}
              {activeDish.price_nok && (
                <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-xl bg-[#181615]/85 backdrop-blur-md text-white font-comico text-xs shadow-md border border-white/10">
                  {activeDish.price_nok} kr
                </div>
              )}

              {/* Category Pill Tag */}
              {activeDish.category && (
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider border border-white/10">
                  {activeDish.category.replace(/_/g, " ")}
                </div>
              )}
            </div>

            {/* Scrollable Dish Details Content */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
              {/* Dish Title & Rating */}
              <div className="flex items-start justify-between gap-3">
                <h2
                  id="dish-popup-title"
                  className="font-comico text-lg sm:text-xl text-[#e84a27] leading-tight"
                >
                  {activeDish.dish_name}
                </h2>
                {activeDish.rating && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold text-xs shrink-0 border border-amber-200/60 dark:border-amber-800/40">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    <span className="font-comico">{activeDish.rating}</span>
                  </div>
                )}
              </div>

              {/* Restaurant Location Capsule */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F5EFE4] dark:bg-[#1E1C1A] border border-[#181615]/8">
                <div className="min-w-0 pr-2">
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate font-comico">
                    {spotName}
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-[#e84a27] shrink-0" />
                    <span>{spotAddress || spotNeighborhood || "Oslo"}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleFlyToMap}
                  className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#e84a27] hover:bg-[#d43d1c] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <span>Map</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              {/* Editorial Review & Author Quote */}
              {activeDish.review_text && (
                <div className="p-3.5 rounded-2xl bg-[#F5EFE4] dark:bg-[#1E1C1A] border border-[#181615]/8 space-y-1.5">
                  <p className="font-comico text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 italic leading-relaxed">
                    &ldquo;{activeDish.review_text}&rdquo;
                  </p>
                  {activeDish.author?.name && (
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono flex items-center gap-1.5 pt-1 border-t border-[#181615]/5">
                      <span className="font-semibold text-zinc-600 dark:text-zinc-400">
                        {activeDish.author.name}
                      </span>
                      <span>· {activeDish.author.handle || "@smak"}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Taste Tags + Save Button Inline */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#181615]/8">
                <div className="flex flex-wrap gap-1.5 min-w-0">
                  {activeDish.taste_tags && activeDish.taste_tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md bg-[#F5EFE4] dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[10px] font-medium border border-[#181615]/5"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => toggleSavePost(activeDish.id)}
                  className={`p-2 rounded-xl border transition-all active:scale-95 shrink-0 cursor-pointer ${
                    isSaved
                      ? "bg-[#e84a27] text-white border-[#e84a27] shadow-xs"
                      : "bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-[#181615]/10 hover:border-[#e84a27]"
                  }`}
                  title={isSaved ? "Saved" : "Save dish"}
                  aria-label="Save dish"
                >
                  <Bookmark className={`w-4 h-4 ${isSaved ? "fill-white text-white" : ""}`} />
                </button>
              </div>
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
