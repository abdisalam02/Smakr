"use client";

import React from "react";
import { MapPin, ArrowUpRight } from "lucide-react";
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
  const flyToSpot = useCityPulseStore((state) => state.flyToSpot);
  const selectVenueById = useCityPulseStore((state) => state.selectVenueById);
  const setViewMode = useCityPulseStore((state) => state.setViewMode);
  const setIsVenueDetailModalOpen = useCityPulseStore(
    (state) => state.setIsVenueDetailModalOpen
  );

  const venue = venues.find((v) => v.id === weeklyPick.venue_id) ?? null;
  const venueName = venue?.name ?? "Em Oi!";
  const locationInfo = formatOsloLocation(venue?.address, venue?.city);
  const neighborhood =
    venue?.neighborhood || locationInfo.neighborhood || "Grønland";
  const dishName = weeklyPick.dish_name || "COCONUT COFFEE";
  const priceDisplay =
    typeof weeklyPick.price_nok === "number" && weeklyPick.price_nok > 0
      ? `${weeklyPick.price_nok} KR`
      : "79 KR";

  const note =
    weeklyPick.speech_bubble ||
    "Order the warm 🥥 coconut coffee with ube/egg foam — rich, velvety & worth the walk.";

  const dishImage =
    weeklyPick.dish_image ||
    venue?.cover_image_url ||
    "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=80";

  const handleCheckSpot = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (weeklyPick.venue_id) {
      selectVenueById(weeklyPick.venue_id);
      setIsVenueDetailModalOpen(true);
    }
  };

  const handleFlyMap = (e: React.MouseEvent) => {
    e.stopPropagation();
    flyToSpot(weeklyPick.coords, weeklyPick.venue_id);
    setViewMode("map");
  };

  return (
    <article
      onClick={handleCheckSpot}
      className={`relative w-full min-h-[140px] sm:min-h-[148px] rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#FAF3EA] via-[#FDF9F4] to-[#FAF3EA] dark:from-[#231E1C] dark:via-[#1D1A19] dark:to-[#231E1C] border border-[#e84a27]/25 dark:border-[#e84a27]/35 shadow-sm hover:shadow-md transition-all cursor-pointer select-none overflow-hidden flex items-stretch col-span-full ${className}`}
    >
      {/* ── LEFT SECTION (~35% width): Pointing Mascot breaking slightly out of frame ── */}
      <div className="w-[34%] max-w-[145px] sm:max-w-[170px] shrink-0 relative bg-gradient-to-br from-[#F5EDE0] to-[#EBE0CD] dark:from-[#2C2521] dark:to-[#1E1A17] border-r border-[#e84a27]/15 dark:border-white/10 flex items-end justify-center overflow-visible">
        {/* Subtle decorative warm aura */}
        <div className="absolute inset-x-2 bottom-2 h-16 rounded-full bg-[#e84a27]/10 dark:bg-[#e84a27]/20 blur-md pointer-events-none" />

        {/* Mascot Asset breaking out slightly above the top edge and pointing right */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mascot/smakr-pick-pointing.svg"
          alt="Smakr Pick Pointing Mascot"
          className="relative z-10 w-auto h-[148px] sm:h-[158px] max-w-none -bottom-0.5 left-1/2 -translate-x-[47%] object-contain drop-shadow-[0_4px_8px_rgba(24,22,21,0.18)] pointer-events-none transition-transform duration-300 hover:scale-105"
        />
      </div>

      {/* ── RIGHT SECTION (~65% width): Weekly Pick Details & Actions ── */}
      <div className="flex-1 min-w-0 p-3 sm:p-3.5 flex flex-col justify-between">
        {/* Top Kicker Row: Pill + Price */}
        <div className="flex items-center justify-between gap-1.5 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#e84a27]/10 dark:bg-[#e84a27]/20 text-[#e84a27] text-[10px] sm:text-[11px] font-black uppercase tracking-wider">
            ✦ SMAKR WEEKLY PICK
          </span>
          <span className="font-comico font-bold text-xs bg-[#e84a27] text-white px-2 py-0.5 rounded-full shadow-2xs whitespace-nowrap">
            {priceDisplay}
          </span>
        </div>

        {/* Center: Title, Spot & Handwritten Curator Note */}
        <div className="my-1">
          <h3 className="font-comico font-black text-[16px] sm:text-[18px] text-[#181615] dark:text-white uppercase leading-tight line-clamp-1 tracking-tight">
            {dishName}
          </h3>
          <div className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-zinc-600 dark:text-zinc-300 mt-0.5 truncate">
            <MapPin className="w-3 h-3 text-[#e84a27] shrink-0" />
            <span className="truncate">
              {venueName} · {neighborhood}
            </span>
          </div>
          <p className="text-[11px] sm:text-[11.5px] italic text-[#6E655F] dark:text-[#A89E96] line-clamp-2 leading-snug mt-1 font-sans">
            &ldquo;{note}&rdquo;
          </p>
        </div>

        {/* Bottom Action Row: Dish Thumbnail + CTAs */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-black/[0.06] dark:border-white/[0.08]">
          <div className="flex items-center gap-2 min-w-0">
            {/* 56x56 Thumbnail rounded frame */}
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border border-black/10 dark:border-white/20 shrink-0 shadow-2xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={dishImage}
                alt={dishName}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-[10px] sm:text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 hidden xs:inline truncate">
              Staff approved
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleCheckSpot}
              className="px-2.5 py-1 rounded-lg bg-black/[0.04] dark:bg-white/10 hover:bg-[#e84a27]/10 text-zinc-700 dark:text-zinc-200 hover:text-[#e84a27] text-[11px] font-bold transition-colors cursor-pointer"
            >
              Check Spot ↗
            </button>
            <button
              type="button"
              onClick={handleFlyMap}
              className="px-2.5 py-1 rounded-lg bg-[#e84a27] text-white hover:bg-[#d03d1b] text-[11px] font-bold transition-all shadow-xs flex items-center gap-0.5 cursor-pointer active:scale-95"
            >
              <span>Map</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
