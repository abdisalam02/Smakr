"use client";

import React from "react";
import Image from "next/image";
import { MapPin, Bookmark, Star } from "lucide-react";
import type { SpotType } from "@/types";

export interface PartnerCardPreviewProps {
  venueName: string;
  neighborhood: string;
  dishName: string;
  priceNok: number | null;
  imageUrl: string;
  tasteNote: string;
  rating?: number | null;
  spotType?: SpotType | "standard" | "pop_up";
  locationSchedule?: string;
  isVerified?: boolean;
  activeStatus?: "normal" | "fresh_batch" | "low_stock" | "sold_out";
  batchNote?: string;
  className?: string;
  compact?: boolean;
}

/**
 * Visual twin of FoodPostCard.tsx used in Smakr Partner Studio and Admin Claims Queue.
 * Renders 1:1 identical 4:3 photo ratio, Burnt Paprika price sticker, and editorial typography.
 */
export const PartnerCardPreview = React.memo(function PartnerCardPreview({
  venueName,
  neighborhood,
  dishName,
  priceNok,
  imageUrl,
  tasteNote,
  rating = null,
  spotType = "standard",
  locationSchedule,
  isVerified = false,
  activeStatus = "normal",
  batchNote,
  className = "",
  compact = false,
}: PartnerCardPreviewProps) {
  const displayRating = typeof rating === "number" && rating > 0 ? rating.toFixed(1) : null;
  const displayImage = imageUrl?.trim() || "/images/placeholder-dish.jpg";

  return (
    <article
      className={`group relative w-full rounded-[26px] overflow-hidden border border-black/[0.08] dark:border-white/10 bg-[#181615] shadow-xl select-none transition-all duration-200 ${className}`}
    >
      {/* Repeating SMAKR Monogram Watermark Pattern */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.035] select-none text-white z-0"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="smakr-partner-preview-pattern"
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
        <rect width="100%" height="100%" fill="url(#smakr-partner-preview-pattern)" />
      </svg>

      {/* 4:3 Full-Bleed Photography Hero Container */}
      <div className={`relative w-full aspect-[4/3] ${compact ? "min-h-[220px]" : "min-h-[300px] sm:min-h-[330px]"} overflow-hidden bg-zinc-900`}>
        {displayImage.startsWith("http") || displayImage.startsWith("/") ? (
          <Image
            src={
              displayImage.startsWith("/api/places/photos") && !displayImage.includes("w=")
                ? `${displayImage}&w=640`
                : displayImage
            }
            alt={dishName || venueName}
            fill
            unoptimized
            decoding="async"
            className="object-cover w-full opacity-90 transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, 500px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-600 bg-zinc-900 text-xs font-semibold">
            Select or upload dish photo
          </div>
        )}

        {/* Seamless Dark Gradient Overlay covering the bottom 60% */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-transparent pointer-events-none" />

        {/* Floating Top Badges (Over Image) */}
        <div className="absolute top-3 inset-x-3 flex items-start justify-between gap-2 z-10 pointer-events-auto">
          {/* Top-Left: Explicit kr Price Sticker / Badges */}
          <div className="flex flex-wrap items-center gap-1.5 max-w-[70%]">
            {typeof priceNok === "number" && priceNok > 0 ? (
              <span className="font-sans font-bold tracking-tight bg-[#e84a27] text-white px-3 py-1 rounded-full text-xs shadow-md rotate-[-1deg] animate-in fade-in zoom-in-75 duration-200">
                {priceNok} kr
              </span>
            ) : (
              <span className="font-sans font-semibold tracking-tight bg-black/60 backdrop-blur-md text-zinc-300 border border-white/15 px-2.5 py-1 rounded-full text-[11px] shadow-xs">
                In-house price
              </span>
            )}

            {/* Live Kitchen Batch Badges */}
            {activeStatus === "fresh_batch" && (
              <span className="bg-[#e84a27] text-white font-bold px-2.5 py-1 rounded-full text-[11px] backdrop-blur-md shadow-md flex items-center gap-1 animate-pulse">
                <span>🔥</span>
                <span>Fresh Batch</span>
              </span>
            )}
            {activeStatus === "low_stock" && (
              <span className="bg-amber-500 text-zinc-950 font-bold px-2.5 py-1 rounded-full text-[11px] backdrop-blur-md shadow-md flex items-center gap-1">
                <span>⚡</span>
                <span>Few Left</span>
              </span>
            )}
            {activeStatus === "sold_out" && (
              <span className="bg-zinc-900/90 text-zinc-300 font-bold px-2.5 py-1 rounded-full text-[11px] backdrop-blur-md border border-white/20 flex items-center gap-1">
                <span>❌</span>
                <span>Sold Out</span>
              </span>
            )}

            {/* Food Truck / Pop-up Badge */}
            {spotType === "food_truck" && (
              <span className="bg-emerald-600 text-white font-bold px-2.5 py-1 rounded-full text-[11px] backdrop-blur-md shadow-md flex items-center gap-1">
                <span>🚚</span>
                <span>Food Truck</span>
              </span>
            )}
            {(spotType === "pop_up" || spotType === "popup") && (
              <span className="bg-amber-500 text-zinc-950 font-bold px-2.5 py-1 rounded-full text-[11px] backdrop-blur-md shadow-md flex items-center gap-1">
                <span>⏳</span>
                <span>Pop-Up</span>
              </span>
            )}
          </div>

          {/* Top-Right: Rating pill + Save bookmark */}
          <div className="flex items-center gap-1.5 shrink-0">
            {displayRating && (
              <span className="bg-black/60 backdrop-blur-md text-amber-400 font-bold px-2.5 py-1 rounded-full text-xs border border-white/10 flex items-center gap-1 shadow-xs">
                <Star className="w-3 h-3 fill-amber-400 stroke-none text-amber-400" />
                <span className="font-sans font-bold text-white text-xs tracking-tight">{displayRating}</span>
              </span>
            )}

            <div className="p-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white">
              <Bookmark className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Overlaid Editorial Content (Bottom Half of Photo) */}
        <div className="absolute bottom-0 inset-x-0 p-3.5 sm:p-4 z-10 flex flex-col justify-end pointer-events-auto">
          {/* Dish Title */}
          <h3 className="font-bold text-lg sm:text-xl leading-snug drop-shadow-sm text-white line-clamp-1 capitalize">
            {dishName || "Signature Dish"}
          </h3>

          {/* Venue & Location */}
          <div className="text-xs font-medium text-zinc-300 drop-shadow-sm mt-0.5 flex items-center gap-1.5 flex-wrap">
            <MapPin className="w-3 h-3 text-[#e84a27] shrink-0" />
            <span className="font-semibold text-white">{venueName || "Venue Name"}</span>

            {isVerified && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500/25 border border-emerald-400/40 text-[9.5px] text-emerald-300 font-bold">
                <span>✓</span>
                <span>Verified</span>
              </span>
            )}

            <span className="text-zinc-400">·</span>
            <span>{neighborhood || "Oslo"}</span>
            <span className="text-emerald-400 font-semibold font-mono text-[11px]">
              · 350m
            </span>

            {spotType === "food_truck" && locationSchedule && (
              <div className="w-full text-[11px] font-mono text-emerald-300 flex items-center gap-1 mt-0.5">
                <span>🚚</span>
                <span className="truncate">{locationSchedule}</span>
              </div>
            )}
          </div>

          {/* Kitchen Live Batch Soundbite */}
          {batchNote && activeStatus !== "normal" && (
            <div className="bg-orange-500/20 border border-orange-500/35 backdrop-blur-md rounded-xl px-2.5 py-1.5 my-1.5 max-w-[96%] flex items-center gap-1.5 text-[11px] text-orange-200">
              <span className="shrink-0">👨‍🍳</span>
              <span className="font-medium italic leading-snug line-clamp-1">
                &ldquo;{batchNote}&rdquo;
              </span>
            </div>
          )}

          {/* Taste Note Quote Box */}
          {tasteNote && (
            <div className="bg-black/45 backdrop-blur-md border border-white/15 rounded-xl px-2.5 py-1.5 my-2 max-w-[96%]">
              <p className="text-[11px] text-zinc-100 leading-snug line-clamp-2">
                <span className="text-[#E84A27] font-bold not-italic mr-1">✦</span>
                <span className="italic">&ldquo;{tasteNote}&rdquo;</span>
              </p>
            </div>
          )}

          {/* Footer Action Bar */}
          <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-xs text-zinc-300">
            <span className="font-semibold text-[11px] text-zinc-400">
              Smakr Card Preview
            </span>
            <span className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-white font-bold text-[11px]">
              Radar Ready
            </span>
          </div>
        </div>
      </div>
    </article>
  );
});
