"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { MapPin, ArrowUpRight, X, ChevronDown } from "lucide-react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { MascotCharacter } from "@/components/avatar/MascotCharacter";

/**
 * "✦ This Week's Drop" — a compact, expandable mascot capsule replacing the old
 * oversized Weekly Dispatch hero. Lives directly above the filter bar.
 *
 * - Collapsed: a one-line pill (36px mascot bust + week chip + headline).
 * - Expanded: dish snapshot, speech-bubble hot-take, NOK pill + map/menu actions.
 * - Auto-collapses when the user scrolls a feed container down by >35px.
 */
interface MascotWeeklyDropProps {
  compact?: boolean;
  feedCount?: number;
  isPeek?: boolean;
  onOpen?: () => void;
}

export function MascotWeeklyDrop({
  compact = false,
  feedCount,
  isPeek = false,
  onOpen,
}: MascotWeeklyDropProps) {
  const weeklyPick = useCityPulseStore((state) => state.weeklyPick);
  const mascotConfig = useCityPulseStore((state) => state.mascotConfig);
  const flyToSpot = useCityPulseStore((state) => state.flyToSpot);
  const selectVenueById = useCityPulseStore((state) => state.selectVenueById);
  // Derived slice: only re-renders when the weekly pick's own venue changes.
  const venue = useCityPulseStore(
    (state) => state.venues.find((v) => v.id === state.weeklyPick.venue_id) ?? null
  );

  const [isExpanded, setIsExpanded] = useState(false);
  const rootRef = useRef<HTMLElement>(null);

  const venueName = venue?.name ?? "This week's spot";
  // Trim parentheticals ("Koie Ramen (Torggata)" → "Koie Ramen").
  const shortVenue = venueName.replace(/\s*[\(（].*?[\)）]\s*$/, "").trim();
  const dishShort = weeklyPick.dish_name
    .split(/[\(\-–—]/)[0]
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join(" ");
  const weekChip = (weeklyPick.week_label || "This Week").replace(/\s*pick$/i, "").trim();
  const weekNumber = weekChip.replace(/[^0-9]/g, "") || "41";

  const [isScrolledDown, setIsScrolledDown] = useState(false);

  // Auto-collapse when sheet transitions to peek
  useEffect(() => {
    if (isPeek) {
      setIsExpanded(false);
    }
  }, [isPeek]);

  // Scroll-driven collapse: listen to feed container scroll (passive)
  useEffect(() => {
    const containers = Array.from(
      document.querySelectorAll<HTMLElement>("[data-feed-scroll]")
    );
    const cleanups = containers.map((el) => {
      const onScroll = () => {
        if (el.scrollTop > 35) {
          setIsScrolledDown(true);
          setIsExpanded(false);
        } else if (el.scrollTop <= 10) {
          setIsScrolledDown(false);
        }
      };
      el.addEventListener("scroll", onScroll, { passive: true });
      return () => el.removeEventListener("scroll", onScroll);
    });
    return () => cleanups.forEach((fn) => fn());
  }, []);

  const handleSpot = () => flyToSpot(weeklyPick.coords, weeklyPick.venue_id);
  const handleMenu = () => selectVenueById(weeklyPick.venue_id);

  const handleToggle = () => {
    if (!isExpanded && onOpen) {
      onOpen();
    }
    setIsExpanded((v) => !v);
  };

  const isUnifiedHeader = feedCount !== undefined;

  return (
    <section
      ref={rootRef}
      className={`w-full px-4 shrink-0 transition-all duration-200 ${
        isScrolledDown ? "pt-0 pb-0" : compact ? "pt-1 pb-1" : "pt-2 pb-1"
      }`}
    >
      {isUnifiedHeader ? (
        /* ── Unified Header Row: Smakr Feed {count} on Left, ✦ Drop Pill on Right ── */
        <div
          className={`flex items-center justify-between gap-2.5 transition-all duration-200 ${
            isScrolledDown ? "min-h-[30px]" : "min-h-[36px]"
          }`}
        >
          <div className="flex items-center gap-2">
            <h2 className="font-comico text-sm sm:text-base tracking-wider text-[#e84a27] uppercase">
              FEED
            </h2>
            <span className="text-[10px] font-mono font-medium text-zinc-500 bg-stone-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
              {feedCount}
            </span>
          </div>

          <button
            type="button"
            onClick={handleToggle}
            aria-expanded={isExpanded}
            className={`inline-flex items-center gap-2 rounded-full bg-white/90 dark:bg-stone-900/90 border border-black/10 dark:border-white/10 shadow-sm transition-all active:scale-95 max-w-full overflow-hidden ${
              isScrolledDown
                ? "h-7 pl-1 pr-2.5 py-0.5 text-[11px]"
                : "pl-1 pr-3 py-1"
            }`}
          >
            {/* Avatar Circle Frame with rigid sizing */}
            <div
              className={`relative rounded-full overflow-hidden shrink-0 bg-stone-100 dark:bg-stone-800 ring-1 ring-black/10 dark:ring-white/10 flex items-center justify-center ${
                isScrolledDown ? "w-5 h-5" : "w-7 h-7 sm:w-8 sm:h-8"
              }`}
            >
              {weeklyPick.mascot_avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={weeklyPick.mascot_avatar_url}
                  alt="Smakr Mascot"
                  className="w-full h-full object-cover object-top block"
                />
              ) : (
                <MascotCharacter
                  config={mascotConfig}
                  size={isScrolledDown ? 20 : 28}
                  animated={isExpanded}
                />
              )}
            </div>

            {/* Capsule Text & Chevron */}
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[140px] sm:max-w-[180px]">
              <span className="text-[#e84a27] font-bold mr-1">✦ Drop {weekNumber}</span>
              {shortVenue}
            </span>

            <ChevronDown
              className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform duration-300 ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      ) : (
        /* ── Standalone capsule trigger ── */
        <div
          className="rounded-2xl border shadow-xs overflow-hidden transition-all duration-300 ease-out"
          style={{
            background: "var(--surface, #FFFFFF)",
            borderColor: "var(--surface-border, #E7E0D4)",
          }}
        >
          <button
            type="button"
            onClick={handleToggle}
            aria-expanded={isExpanded}
            className={`w-full flex items-center text-left hover:bg-black/[0.02] transition-colors ${
              isScrolledDown ? "h-[28px] pl-1 pr-2 gap-1.5" : "h-[36px] pl-1.5 pr-2.5 gap-2"
            }`}
          >
            <div
              className={`relative rounded-full overflow-hidden shrink-0 bg-stone-100 dark:bg-stone-800 ring-1 ring-black/10 dark:ring-white/10 flex items-center justify-center ${
                isScrolledDown ? "w-5 h-5" : "w-7 h-7 sm:w-8 sm:h-8"
              }`}
            >
              {weeklyPick.mascot_avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={weeklyPick.mascot_avatar_url}
                  alt="Smakr Mascot"
                  className="w-full h-full object-cover object-top block"
                />
              ) : (
                <MascotCharacter
                  config={mascotConfig}
                  size={isScrolledDown ? 20 : 28}
                  animated={isExpanded}
                />
              )}
            </div>

            <span
              className={`shrink-0 inline-flex items-center gap-1 rounded-full bg-[#e84a27] text-white font-bold tracking-tight whitespace-nowrap shadow-xs ${
                isScrolledDown ? "text-[9px] px-1.5 py-0.5" : "text-[10px] px-2 py-0.5"
              }`}
            >
              ✦ Drop {weekNumber}
            </span>

            <span
              className={`flex-1 min-w-0 font-bold text-zinc-800 truncate ${
                isScrolledDown ? "text-[11px]" : "text-xs"
              }`}
            >
              {shortVenue}
              <span className="text-zinc-400 font-normal"> · </span>
              <span className="text-[#e84a27]">{dishShort}</span>
            </span>

            <ChevronDown
              className={`${isScrolledDown ? "w-3 h-3" : "w-3.5 h-3.5"} text-zinc-400 shrink-0 transition-transform duration-300 ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      )}

      {/* ── Expanded spotlight card underneath ── */}
      <div
        className={`grid transition-all duration-300 ease-out ${
          isExpanded ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div
            className="rounded-2xl border p-3 space-y-2.5 shadow-xs"
            style={{
              background: "var(--surface, #FFFFFF)",
              borderColor: "var(--surface-border, #E7E0D4)",
            }}
          >
            {/* Mascot on left presenting the speech bubble on right */}
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#f5efe3] dark:bg-stone-800 border border-[#e7e0d4] dark:border-white/10 p-1 flex items-center justify-center shadow-xs overflow-hidden">
                {weeklyPick.mascot_avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={weeklyPick.mascot_avatar_url}
                    alt="Smakr Mascot"
                    className="w-full h-full object-cover object-top block rounded-xl"
                  />
                ) : (
                  <MascotCharacter
                    config={mascotConfig}
                    size={76}
                    animated={isExpanded}
                  />
                )}
              </div>

              {/* Speech bubble with tail pointing to the mascot */}
              <div
                className="relative flex-1 rounded-2xl border px-3.5 py-3 shadow-xs min-h-[80px] flex flex-col justify-center"
                style={{
                  background: "var(--surface-raised, #F5EFE3)",
                  borderColor: "var(--surface-border, #E7E0D4)",
                }}
              >
                {/* Speech bubble arrow/tail pointing left towards the mascot */}
                <span
                  aria-hidden
                  className="absolute top-6 -left-1.5 w-3 h-3 rotate-45 border-l border-b"
                  style={{
                    background: "var(--surface-raised, #F5EFE3)",
                    borderColor: "var(--surface-border, #E7E0D4)",
                  }}
                />
                <div className="flex items-center gap-1.5 mb-1 text-[9px] font-bold uppercase tracking-wider text-[#e84a27]">
                  <span>✦ Mascot Drop Note</span>
                </div>
                <p className="text-[13px] font-medium italic leading-snug text-zinc-900 dark:text-zinc-100 relative z-10">
                  &ldquo;{weeklyPick.speech_bubble}&rdquo;
                </p>
              </div>
            </div>

            {/* Restructured featured dish section */}
            <div className="flex items-center gap-3 p-2 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/5 dark:border-white/5">
              <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden border border-black/10 shrink-0 bg-zinc-100 shadow-xs">
                <Image
                  src={weeklyPick.dish_image}
                  alt={weeklyPick.dish_name}
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="72px"
                />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {weeklyPick.dish_name}
                  </p>
                  <span className="shrink-0 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xs">
                    {weeklyPick.price_nok} NOK
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#e84a27] shrink-0" />
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">{venueName}</span>
                </p>
              </div>
            </div>

            {/* Actions + close */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSpot}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#e84a27] hover:bg-[#d23e1d] text-white text-xs font-bold shadow-sm shadow-[#e84a27]/25 transition-all active:scale-[0.98]"
              >
                <span aria-hidden>📍</span>
                <span>Spot on Map</span>
              </button>
              <button
                onClick={handleMenu}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold text-zinc-700 hover:text-zinc-950 hover:bg-black/[0.03] transition-all active:scale-[0.98]"
                style={{ borderColor: "var(--surface-border, #E7E0D4)" }}
              >
                <span>View Menu &amp; Vibes</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                aria-label="Collapse weekly drop"
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-black/[0.04] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
