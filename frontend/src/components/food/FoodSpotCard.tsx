"use client";

import React from "react";
import { useShallow } from "zustand/react/shallow";
import Image from "next/image";
import { MapPin, Sparkles, Star, ChevronRight } from "lucide-react";
import { ReviewItem, Venue } from "@/types";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { formatDistance } from "@/lib/math";
import { FOOD_CATEGORIES } from "@/lib/foodSeeds";
import { DietaryBadge } from "@/components/ui/DietaryBadge";

interface FoodSpotCardProps {
  venue: Venue;
  /** True only for the first above-the-fold card so its photo is preloaded. */
  priority?: boolean;
}

export const FoodSpotCard = React.memo(function FoodSpotCard({
  venue,
  priority = false,
}: FoodSpotCardProps) {
  const flyToSpot = useCityPulseStore((state) => state.flyToSpot);

  const selectVenueById = useCityPulseStore((state) => state.selectVenueById);

  const categoryDef = FOOD_CATEGORIES.find((c) => c.id === venue.food_category);
  const signature = venue.signature_dishes && venue.signature_dishes.length > 0 ? venue.signature_dishes[0] : null;

  // Prefer reviews curated onto the venue; otherwise fall back to the quotes
  // attached to its dishes so the card is never empty when reviews exist.
  // `useShallow` keeps the derived array referentially stable, so liking some
  // other dish doesn't re-render this card.
  const reviewQuotes = useCityPulseStore(
    useShallow((s) => {
      const fromVenue = venue.curated_reviews ?? [];
      if (fromVenue.length > 0) return fromVenue;
      const seen = new Set<string>();
      const out: ReviewItem[] = [];
      for (const p of s.foodPosts) {
        if (p.spot_id !== venue.id) continue;
        for (const q of p.diner_quotes ?? []) {
          if (!q?.id || seen.has(q.id)) continue;
          seen.add(q.id);
          out.push(q);
        }
      }
      return out;
    })
  );

  const topReview = reviewQuotes.length > 0 ? reviewQuotes[0] : null;
  const hasGoogleRating = typeof venue.google_rating === "number" && venue.google_rating > 0;
  const googleCount = venue.google_reviews_count ?? 0;

  const stars = (rating: number) => {
    const full = Math.max(0, Math.min(5, Math.round(rating)));
    return `${"★".repeat(full)}${"☆".repeat(5 - full)}`;
  };

  const handleClick = () => {
    selectVenueById(venue.id);
  };

  const handleSpotOnMap = (e: React.MouseEvent) => {
    e.stopPropagation();
    flyToSpot([venue.longitude, venue.latitude], venue.id);
  };

  return (
    <div
      onClick={handleClick}
      className="group relative flex flex-col sm:flex-row gap-3.5 p-3 rounded-3xl bg-[#fbf9f5] dark:bg-[#181615] border-2 border-black/[0.08] dark:border-white/[0.08] shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:border-black/15 transition-all duration-200 cursor-pointer active:scale-[0.99] select-none overflow-hidden"
    >
      {/* Repeating SMAKR Monogram Watermark Pattern */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.035] dark:opacity-[0.06] select-none text-zinc-950 dark:text-white"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id={`smakr-spot-pattern-${venue.id}`}
            width="88"
            height="44"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-14)"
          >
            <text
              x="0"
              y="16"
              fontFamily="var(--font-comico), sans-serif"
              fontWeight="900"
              fontSize="9"
              letterSpacing="0.18em"
              fill="currentColor"
            >
              SMAKR ·
            </text>
            <text
              x="44"
              y="38"
              fontFamily="var(--font-comico), sans-serif"
              fontWeight="900"
              fontSize="9"
              letterSpacing="0.18em"
              fill="currentColor"
            >
              SMAKR ·
            </text>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#smakr-spot-pattern-${venue.id})`} />
      </svg>

      {/* Cover Image */}
      <div className="relative w-full sm:w-28 h-32 sm:h-28 rounded-2xl overflow-hidden shrink-0 bg-zinc-100 ring-1 ring-black/5">
        {venue.cover_image_url ? (
          <Image
            src={venue.cover_image_url}
            alt={venue.name}
            fill
            priority={priority}
            loading={priority ? undefined : "lazy"}
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, 120px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">
            {venue.icon || categoryDef?.emoji || "🍽️"}
          </div>
        )}

        {/* Google Rating Badge */}
        {hasGoogleRating && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-white text-[11px] font-bold shadow-xs">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="font-comico">{venue.google_rating!.toFixed(1)}</span>
            {googleCount > 0 && (
              <span className="font-normal text-white/70 text-[9px]">({googleCount})</span>
            )}
          </div>
        )}
      </div>

      {/* Spot Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          {/* Category & Price */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[11px] font-semibold text-[#e84a27] uppercase tracking-wider flex items-center gap-1 font-comico">
              <span>{venue.icon || categoryDef?.emoji || "📍"}</span>
              <span>{categoryDef?.label || venue.food_category || "Food Spot"}</span>
            </span>
            {venue.price_level && (
              <span className="text-[11px] font-comico font-bold text-zinc-700 bg-black/5 px-2 py-0.5 rounded-full">
                {venue.price_level}
              </span>
            )}
          </div>

          {/* Venue Name */}
          <h3 className="font-comico text-base text-zinc-950 group-hover:text-[#e84a27] transition-colors truncate">
            {venue.name}
          </h3>

          {/* Location & Distance */}
          <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1 truncate">
            <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="truncate">{venue.address}, {venue.city}</span>
            {venue.distance_meters && (
              <span className="shrink-0 font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded-full text-[10px] ml-1">
                {formatDistance(venue.distance_meters)}
              </span>
            )}
          </p>

          {/* Dietary badges */}
          {venue.dietary_tags && venue.dietary_tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 mt-1.5">
              {venue.dietary_tags.map((tag) => (
                <DietaryBadge key={tag} tag={tag} />
              ))}
            </div>
          )}

          {/* Curated Google review soundbite */}
          {topReview && (
            <div className="mt-2 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] px-2.5 py-2">
              <p className="text-[10px] italic leading-snug text-zinc-600 dark:text-zinc-300 line-clamp-2">
                &ldquo;{topReview.text}&rdquo;
              </p>
              <p className="text-[9px] text-zinc-400 mt-1 flex items-center gap-1 truncate">
                <span className="text-amber-500 font-mono shrink-0">{stars(topReview.rating)}</span>
                <span className="truncate">· {topReview.author_name}</span>
                {reviewQuotes.length > 1 && (
                  <span className="shrink-0 text-zinc-400">+{reviewQuotes.length - 1} more</span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Signature Dish Pill & View on Map Button */}
        <div className="pt-2 mt-2 border-t border-zinc-100 flex items-center justify-between text-xs gap-2">
          {signature ? (
            <div className="flex items-center gap-1 text-[11px] text-zinc-600 truncate min-w-0">
              <Sparkles className="w-3 h-3 text-[#e84a27] shrink-0" />
              <span className="font-medium text-zinc-500 shrink-0">Signature:</span>
              <span className="truncate font-semibold text-zinc-800">{signature}</span>
            </div>
          ) : (
            <span className="text-[11px] text-zinc-400">Curated Oslo Spot</span>
          )}

          <div className="flex items-center gap-0.5 text-[11px] font-semibold text-[#e84a27] group-hover:translate-x-0.5 transition-transform shrink-0">
            <span>Map</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
});
