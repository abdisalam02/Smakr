"use client";

import React from "react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { formatOsloLocation } from "@/lib/location";

interface SmakrWeeklyPickSplitBannerProps {
  className?: string;
}

export function SmakrWeeklyPickSplitBanner({
  className = "",
}: SmakrWeeklyPickSplitBannerProps) {
  const weeklyPick = useCityPulseStore((state) => state.weeklyPick);
  const venues = useCityPulseStore((state) => state.venues);
  const selectVenueById = useCityPulseStore((state) => state.selectVenueById);
  const setIsVenueDetailModalOpen = useCityPulseStore(
    (state) => state.setIsVenueDetailModalOpen
  );

  const venue = venues.find((v) => v.id === weeklyPick.venue_id) ?? null;
  const venueName = venue?.name ?? "Em Oi!";
  const locationInfo = formatOsloLocation(venue?.address, venue?.city);
  const neighborhood =
    venue?.neighborhood || locationInfo.neighborhood || "Grønland";
  const dishName = weeklyPick.dish_name || "COCONUT COFFEE";

  const note =
    weeklyPick.speech_bubble ||
    "Order the warm 🥥 coconut coffee with ube/egg foam — rich, velvety & worth the walk.";

  const handleCheckSpot = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (weeklyPick.venue_id) {
      selectVenueById(weeklyPick.venue_id);
      setIsVenueDetailModalOpen(true);
    }
  };

  const dishImage = weeklyPick.dish_image || venue?.cover_image_url || "";

  return (
    <div className={`col-span-full ${className}`}>
      {/* Centred section title above the card */}
      <div className="flex items-center justify-center mb-1.5">
        <span className="text-[12px] font-comico tracking-[0.12em] uppercase text-[#E84A27]">
          ✦ Smakr Weekly Pick
        </span>
      </div>

      <article
        onClick={handleCheckSpot}
        className="relative flex items-center gap-2 py-1.5 cursor-pointer select-none"
      >
        {/* ── Bigger mascot ── */}
        <div className="w-[92px] shrink-0 flex items-end justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mascot/smakr-pick-pointing.svg"
            alt="Smakr Pick Pointing Mascot"
            className="w-[96px] h-[112px] object-contain pointer-events-none"
          />
        </div>

        {/* ── Speech bubble + title + location ── */}
        <div className="flex-1 min-w-0">
          <div className="relative rounded-2xl rounded-bl-md bg-white/75 dark:bg-white/10 border border-[#E6DFD3] dark:border-white/15 px-3 py-2 shadow-xs">
            <p className="text-[11px] italic text-[#181615]/80 dark:text-zinc-300 line-clamp-2 leading-snug font-sans">
              &ldquo;{note}&rdquo;
            </p>
            {/* Tail pointing back at the mascot */}
            <span
              aria-hidden="true"
              className="absolute -left-[5px] bottom-1.5 h-2.5 w-2.5 rotate-45 bg-white/75 border-l border-b border-[#E6DFD3] dark:border-white/15"
            />
          </div>

          <h3 className="mt-2 font-comico font-normal text-[17px] leading-tight text-[#181615] dark:text-white uppercase truncate">
            {dishName}
          </h3>
          <p className="text-[11.5px] font-semibold text-[#181615]/75 dark:text-zinc-300 truncate mt-0.5">
            📍 {venueName} · {neighborhood}
          </p>
        </div>

        {/* ── Dish photo (price badge removed) ── */}
        <div className="relative w-[92px] h-[92px] shrink-0 rounded-xl overflow-hidden bg-[#E8E0D2] dark:bg-[#24201D]">
          {dishImage ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={dishImage}
              alt={dishName}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#E84A27] text-lg">
              ✦
            </div>
          )}
        </div>
      </article>
    </div>
  );
}