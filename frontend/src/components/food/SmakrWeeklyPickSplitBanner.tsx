"use client";

import React from "react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { formatOsloLocation } from "@/lib/location";

interface SmakrWeeklyPickSplitBannerProps {
  className?: string;
}

const MAX_WEEKLY_BUBBLE_CHARS = 58;

function clampWeeklyBubble(raw: string, maxChars = MAX_WEEKLY_BUBBLE_CHARS): string {
  const cleaned = raw.trim().replace(/\s+/g, " ");
  if (!cleaned) return "6 pop-up dates at Tullinløkka · Nov 22 – Dec 13";
  if (cleaned.length <= maxChars) return cleaned;
  // Drop trailing dash/em-dash clauses first if that brings it cleanly inside the limit.
  const firstClause = cleaned.split(/\s+[—–]\s+/)[0].trim();
  if (firstClause.length > 0 && firstClause.length <= maxChars) {
    return firstClause;
  }
  const sliced = firstClause.slice(0, maxChars);
  const lastSpace = sliced.lastIndexOf(" ");
  const boundary = lastSpace >= Math.floor(maxChars * 0.6) ? sliced.slice(0, lastSpace) : sliced;
  // Never end awkwardly on a dangling preposition/conjunction after clamping.
  return boundary
    .replace(/\b(for|at|with|and|or|the|to|in|on|of|from)\s*$/i, "")
    .replace(/[.,;:\-–—\s]+$/, "");
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
  const rawNeighborhood = locationInfo.neighborhood || venue?.neighborhood || "Grønland";
  const neighborhood = rawNeighborhood
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const dishName = weeklyPick.dish_name || "COCONUT COFFEE";

  const note = clampWeeklyBubble(
    weeklyPick.speech_bubble ||
      "6 pop-up dates at Tullinløkka · Nov 22 – Dec 13"
  );

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
      {/* Centred section kicker above the card (bold clean display sans, no star) */}
      <div className="flex items-center justify-center mb-1.5">
        <span className="font-display text-[11px] font-bold tracking-[0.12em] uppercase text-[#E84A27]">
          Smakr Weekly Pick
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
          <div className="relative rounded-2xl rounded-bl-md bg-white/85 dark:bg-white/10 border border-[#E6DFD3] dark:border-white/15 px-3 py-2 shadow-xs">
            <p className="font-display text-[11.5px] font-semibold text-[#181615]/90 dark:text-zinc-200 leading-[1.28]">
              &ldquo;{note}&rdquo;
            </p>
            {/* Tail pointing back at the mascot */}
            <span
              aria-hidden="true"
              className="absolute -left-[5px] bottom-1.5 h-2.5 w-2.5 rotate-45 bg-white/85 border-l border-b border-[#E6DFD3] dark:border-white/15"
            />
          </div>

          <h3 className="mt-2 font-display font-bold text-[16.5px] sm:text-[18px] leading-[1.15] text-[#181615] dark:text-white uppercase line-clamp-2">
            {dishName}
          </h3>
          <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[11.5px] font-semibold text-[#181615]/75 dark:text-zinc-300 leading-snug mt-0.5">
            <span className="whitespace-nowrap">📍 {venueName}</span>
            <span className="text-[#181615]/40 dark:text-zinc-500">·</span>
            <span className="whitespace-nowrap">{neighborhood}</span>
            {typeof weeklyPick.price_nok === "number" && weeklyPick.price_nok > 0 && (
              <>
                <span className="text-[#181615]/40 dark:text-zinc-500">·</span>
                <span className="text-[#E84A27] font-bold whitespace-nowrap">{weeklyPick.price_nok} kr</span>
              </>
            )}
          </div>
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