"use client";

import React from "react";
import Image from "next/image";
import { Star, MapPin, Clock, ChevronRight } from "lucide-react";
import { FOOD_CATEGORIES } from "@/lib/foodSeeds";
import type { FoodCategory, SpotType } from "@/types";

export interface PartnerSpotCardPreviewProps {
  venueName: string;
  address: string;
  neighborhood: string;
  category: FoodCategory;
  imageUrl: string;
  signatureDish?: string;
  priceNok?: number | null;
  openingHours?: string;
  spotType?: SpotType | "standard" | "pop_up";
  locationSchedule?: string;
  rating?: number | null;
  isVerified?: boolean;
  className?: string;
}

/**
 * Visual twin of FoodSpotCard.tsx used in Smakr Partner Studio and Admin Claims Queue.
 * Renders the authentic horizontal spot card with left thumbnail, rating, category, and hours.
 */
export const PartnerSpotCardPreview = React.memo(function PartnerSpotCardPreview({
  venueName,
  address,
  neighborhood,
  category = "all",
  imageUrl,
  signatureDish,
  priceNok,
  openingHours,
  spotType = "standard",
  locationSchedule,
  rating = null,
  isVerified = false,
  className = "",
}: PartnerSpotCardPreviewProps) {
  const categoryDef = FOOD_CATEGORIES.find((c) => c.id === category);
  const displayRating = typeof rating === "number" && rating > 0 ? rating.toFixed(1) : null;
  const displayImage = imageUrl?.trim() || "/images/placeholder-dish.jpg";

  return (
    <div
      className={`group relative flex flex-row items-stretch rounded-3xl bg-[var(--surface)] ring-1 ring-black/[0.06] dark:ring-white/[0.08] shadow-md hover:shadow-lg transition-all select-none overflow-hidden min-h-[148px] ${className}`}
    >
      {/* Repeating SMAKR Monogram Watermark Pattern */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.03] dark:opacity-[0.05] select-none text-zinc-950 dark:text-white"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="smakr-spot-partner-pattern"
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
        <rect width="100%" height="100%" fill="url(#smakr-spot-partner-pattern)" />
      </svg>

      {/* Cover Image — Left Column (~40% width) */}
      <div className="relative w-[38%] min-w-[124px] max-w-[160px] sm:w-44 self-stretch min-h-[148px] overflow-hidden shrink-0 bg-zinc-900">
        {displayImage.startsWith("http") || displayImage.startsWith("/") ? (
          <Image
            src={
              displayImage.startsWith("/api/places/photos") && !displayImage.includes("w=")
                ? `${displayImage}&w=640`
                : displayImage
            }
            alt={venueName}
            fill
            unoptimized
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 40vw, 176px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">
            {categoryDef?.emoji || "🍽️"}
          </div>
        )}

        {/* Rating Badge */}
        {displayRating && (
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-white text-[11px] font-bold shadow-xs">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="font-sans font-bold tracking-tight text-white">{displayRating}</span>
          </div>
        )}
      </div>

      {/* Spot Details Right Column */}
      <div className="flex-1 min-w-0 flex flex-col justify-between p-3.5 sm:p-4 z-10">
        <div className="space-y-1">
          {/* Category & Status Row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-[#e84a27] uppercase tracking-wider flex items-center gap-1 font-comico">
              <span>{categoryDef?.emoji || "📍"}</span>
              <span>{categoryDef?.label || "Food Spot"}</span>
            </span>

            {isVerified && (
              <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 flex items-center gap-0.5">
                <span>✓</span>
                <span>Verified</span>
              </span>
            )}

            {spotType === "food_truck" && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-0.5">
                <span>🚚</span>
                <span>Food Truck</span>
              </span>
            )}
            {(spotType === "pop_up" || spotType === "popup") && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-zinc-950">
                <span>⏳ Pop-Up</span>
              </span>
            )}

            <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300">
              Open Now
            </span>
          </div>

          {/* Venue Name */}
          <h3 className="font-black text-sm sm:text-base text-zinc-900 dark:text-white leading-tight truncate">
            {venueName || "Your Venue"}
          </h3>

          {/* Address & Neighborhood */}
          <div className="text-[11px] text-zinc-500 flex items-center gap-1 truncate">
            <MapPin className="w-3 h-3 text-[#e84a27] shrink-0" />
            <span className="truncate">{address || "Oslo, Norway"}</span>
            <span>·</span>
            <span className="capitalize shrink-0">{neighborhood || "Oslo"}</span>
          </div>

          {/* Truck Schedule or Hours */}
          {spotType === "food_truck" && locationSchedule ? (
            <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-mono flex items-center gap-1 pt-0.5 truncate">
              <span>🚚</span>
              <span className="truncate">{locationSchedule}</span>
            </div>
          ) : openingHours ? (
            <div className="text-[11px] text-zinc-500 flex items-center gap-1 pt-0.5 truncate">
              <Clock className="w-3 h-3 text-zinc-400 shrink-0" />
              <span className="truncate">{openingHours}</span>
            </div>
          ) : null}
        </div>

        {/* Signature Dish Pill at Bottom */}
        {signatureDish && (
          <div className="pt-2 mt-1 border-t border-[var(--surface-border)] flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 shrink-0">
                Signature:
              </span>
              <span className="font-bold text-zinc-800 dark:text-zinc-200 truncate">
                {signatureDish}
              </span>
            </div>

            {typeof priceNok === "number" && priceNok > 0 && (
              <span className="text-[#e84a27] font-bold text-xs shrink-0 font-sans">
                {priceNok} kr
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
