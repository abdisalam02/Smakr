"use client";

import React from "react";
import Image from "next/image";
import { MapPin, Sparkles, Star, ChevronRight } from "lucide-react";
import { Venue } from "@/types";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { formatDistance } from "@/lib/math";
import { FOOD_CATEGORIES } from "@/lib/foodSeeds";

interface FoodSpotCardProps {
  venue: Venue;
}

export function FoodSpotCard({ venue }: FoodSpotCardProps) {
  const flyToSpot = useCityPulseStore((state) => state.flyToSpot);

  const categoryDef = FOOD_CATEGORIES.find((c) => c.id === venue.food_category);
  const signature = venue.signature_dishes && venue.signature_dishes.length > 0 ? venue.signature_dishes[0] : null;

  const handleClick = () => {
    flyToSpot([venue.longitude, venue.latitude], venue.id);
  };

  return (
    <div
      onClick={handleClick}
      className="group relative flex flex-col sm:flex-row gap-3.5 p-3 rounded-2xl bg-white hover:bg-zinc-50/80 border border-zinc-200/80 hover:border-[#ff5500]/40 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.99] select-none"
    >
      {/* Cover Image */}
      <div className="relative w-full sm:w-28 h-32 sm:h-28 rounded-xl overflow-hidden shrink-0 bg-zinc-100 border border-zinc-200/60">
        {venue.cover_image_url ? (
          <Image
            src={venue.cover_image_url}
            alt={venue.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, 120px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">
            {categoryDef?.emoji || "🍽️"}
          </div>
        )}

        {/* Rating Badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-white text-[11px] font-bold shadow-xs">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          <span>9.5</span>
        </div>
      </div>

      {/* Spot Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          {/* Category & Price */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[11px] font-semibold text-[#ff5500] uppercase tracking-wider flex items-center gap-1">
              <span>{categoryDef?.emoji || "📍"}</span>
              <span>{categoryDef?.label || venue.food_category || "Food Spot"}</span>
            </span>
            {venue.price_level && (
              <span className="text-[11px] font-mono font-medium text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">
                {venue.price_level}
              </span>
            )}
          </div>

          {/* Venue Name */}
          <h3 className="font-bold text-sm text-zinc-950 group-hover:text-[#ff5500] transition-colors truncate">
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
        </div>

        {/* Signature Dish Pill & View on Map Button */}
        <div className="pt-2 mt-2 border-t border-zinc-100 flex items-center justify-between text-xs gap-2">
          {signature ? (
            <div className="flex items-center gap-1 text-[11px] text-zinc-600 truncate min-w-0">
              <Sparkles className="w-3 h-3 text-[#ff5500] shrink-0" />
              <span className="font-medium text-zinc-500 shrink-0">Signature:</span>
              <span className="truncate font-semibold text-zinc-800">{signature}</span>
            </div>
          ) : (
            <span className="text-[11px] text-zinc-400">Curated Oslo Spot</span>
          )}

          <div className="flex items-center gap-0.5 text-[11px] font-semibold text-[#ff5500] group-hover:translate-x-0.5 transition-transform shrink-0">
            <span>Map</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}
