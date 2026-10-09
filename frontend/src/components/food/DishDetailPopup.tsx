"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import {
  X,
  Star,
  Flame,
  CheckCircle2,
  Heart,
  Bookmark,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { FoodPost, Venue } from "@/types";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { VenueReaction } from "@/hooks/useVenueDetail";

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

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !dish) return null;

  const isLiked = likedPostIds.has(dish.id);
  const isSaved = savedPostIds.has(dish.id);
  const spotName = venue?.name || dish.spot_name;
  const spotAddress = venue?.address || dish.spot_address;
  const spotNeighborhood = venue?.neighborhood || dish.spot_neighborhood;

  const handleFlyToMap = () => {
    onClose();
    if (dish.spot_coords) {
      flyToSpot(dish.spot_coords, dish.spot_id);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dish-popup-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm sm:max-w-md bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-zinc-200/90 dark:border-white/10 overflow-hidden flex flex-col max-h-[90dvh] animate-in zoom-in-95 duration-200"
      >
        {/* Top Floating Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-95"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Dish High-Res Photo Header */}
        <div className="relative w-full aspect-[4/3] bg-zinc-100 dark:bg-stone-800 shrink-0 overflow-hidden">
          {dish.image_url ? (
            <Image
              src={dish.image_url}
              alt={dish.dish_name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 448px"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl bg-orange-50">
              🍽️
            </div>
          )}

          {/* Price Sticker Tag */}
          <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-xl bg-[#e84a27] text-white font-mono font-bold text-xs shadow-md shadow-[#e84a27]/30">
            {dish.price_nok} NOK
          </div>

          {/* Category Pill Tag */}
          {dish.category && (
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold capitalize">
              {dish.category.replace("_", " ")}
            </div>
          )}
        </div>

        {/* Scrollable Dish Details Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1">
          {/* Dish Title & Rating */}
          <div className="flex items-start justify-between gap-3">
            <h2
              id="dish-popup-title"
              className="text-base sm:text-lg font-black text-zinc-950 dark:text-white leading-tight"
            >
              {dish.dish_name}
            </h2>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold text-xs shrink-0 border border-amber-200/60 dark:border-amber-800/40">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
              <span className="font-mono">{dish.rating}</span>
            </div>
          </div>

          {/* Restaurant Location Capsule */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-stone-800/50 border border-zinc-200/70 dark:border-white/5">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
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
              className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#e84a27]/10 hover:bg-[#e84a27]/20 text-[#e84a27] text-[11px] font-bold transition-colors"
            >
              <span>Map</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* Editorial Review & Author Quote */}
          {dish.review_text && (
            <div className="p-3 rounded-xl bg-orange-50/60 dark:bg-stone-800/40 border border-orange-100 dark:border-white/5">
              <p className="text-xs text-zinc-700 dark:text-zinc-300 italic leading-relaxed">
                &ldquo;{dish.review_text}&rdquo;
              </p>
              {dish.author?.name && (
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2 font-medium flex items-center gap-1.5">
                  <span className="font-semibold text-zinc-600 dark:text-zinc-400">
                    {dish.author.name}
                  </span>
                  <span>· {dish.author.handle}</span>
                </p>
              )}
            </div>
          )}

          {/* Taste Tags */}
          {dish.taste_tags && dish.taste_tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {dish.taste_tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-stone-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Sticky Action Footer */}
        <div className="p-3 sm:p-4 bg-zinc-50 dark:bg-stone-900 border-t border-zinc-100 dark:border-white/10 flex items-center justify-between gap-2 shrink-0">
          {/* Reaction Buttons */}
          <div className="flex items-center gap-1.5">
            {onReaction && (
              <>
                <button
                  type="button"
                  onClick={() => onReaction(dish.id, "craving")}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition-all active:scale-95 ${
                    activeReaction === "craving"
                      ? "bg-[#e84a27] text-white border-[#e84a27] shadow-sm"
                      : "bg-white dark:bg-stone-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  <Flame className="w-3 h-3" />
                  <span>Craving</span>
                </button>
                <button
                  type="button"
                  onClick={() => onReaction(dish.id, "must_try")}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition-all active:scale-95 ${
                    activeReaction === "must_try"
                      ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                      : "bg-white dark:bg-stone-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  <Star className="w-3 h-3" />
                  <span>Must Try</span>
                </button>
                <button
                  type="button"
                  onClick={() => onReaction(dish.id, "ate_here")}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition-all active:scale-95 ${
                    activeReaction === "ate_here"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-white dark:bg-stone-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Tried</span>
                </button>
              </>
            )}
          </div>

          {/* Social Like & Bookmark */}
          <div className="flex items-center gap-1.5 ml-auto">
            <button
              type="button"
              onClick={() => toggleLikePost(dish.id)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all active:scale-95 ${
                isLiked
                  ? "bg-[#e84a27] text-white border-[#e84a27]"
                  : "bg-white dark:bg-stone-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100"
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-current" : ""}`} />
              <span className="font-mono">{dish.likes_count}</span>
            </button>
            <button
              type="button"
              onClick={() => toggleSavePost(dish.id)}
              className={`p-2 rounded-xl border transition-all active:scale-95 ${
                isSaved
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-white dark:bg-stone-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100"
              }`}
              title={isSaved ? "Saved" : "Save dish"}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-current" : ""}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
