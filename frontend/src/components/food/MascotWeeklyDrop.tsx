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

  // Auto-collapse when sheet transitions to peek
  useEffect(() => {
    if (isPeek) {
      setIsExpanded(false);
    }
  }, [isPeek]);

  // Auto-collapse: any feed container that scrolls down >35px closes the card.
  useEffect(() => {
    if (!isExpanded) return;
    const containers = Array.from(
      document.querySelectorAll<HTMLElement>("[data-feed-scroll]")
    );
    const cleanups = containers.map((el) => {
      const startTop = el.scrollTop;
      const onScroll = () => {
        if (el.scrollTop - startTop > 30) setIsExpanded(false);
      };
      el.addEventListener("scroll", onScroll, { passive: true });
      return () => el.removeEventListener("scroll", onScroll);
    });
    return () => cleanups.forEach((fn) => fn());
  }, [isExpanded]);

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
    <section ref={rootRef} className={`w-full px-4 shrink-0 ${compact ? "pt-1 pb-1" : "pt-2 pb-1"}`}>
      {isUnifiedHeader ? (
        /* ── Unified Header Row: Smakr Feed {count} on Left, ✦ Drop Pill on Right ── */
        <div className="flex items-center justify-between gap-2.5 min-h-[36px]">
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
            className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full bg-[#fbf9f5] hover:bg-[#f5f0e6] border border-black/[0.08] dark:border-white/10 transition-all active:scale-95 shadow-2xs"
          >
            <span className="relative shrink-0 w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center overflow-visible ring-1 ring-black/5">
              <MascotCharacter
                config={mascotConfig}
                size={24}
                animated={isExpanded}
              />
              {/* Orange beacon dot */}
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#e84a27] ring-1.5 ring-white shadow-xs" />
            </span>

            <span className="text-[10px] font-bold tracking-tight text-[#e84a27] whitespace-nowrap">
              ✦ {weekChip} Drop
            </span>

            <ChevronDown
              className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform duration-300 ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      ) : (
        /* ── Standalone capsule trigger (~34px height) ── */
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
            className={`w-full flex items-center text-left hover:bg-black/[0.02] transition-colors h-[34px] ${
              compact ? "gap-2 pl-1.5 pr-2" : "gap-2.5 pl-2 pr-2.5"
            }`}
          >
            <span className="relative shrink-0 w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center overflow-visible ring-1 ring-black/5">
              <MascotCharacter
                config={mascotConfig}
                size={24}
                animated={isExpanded}
              />
              {/* Orange beacon dot */}
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#e84a27] ring-1.5 ring-white shadow-xs" />
            </span>

            <span
              className={`shrink-0 inline-flex items-center gap-1 rounded-full bg-[#e84a27] text-white font-bold tracking-tight whitespace-nowrap shadow-xs ${
                compact ? "text-[9px] px-1.5 py-0.5" : "text-[10px] px-2 py-0.5"
              }`}
            >
              ✦ {weekChip} Drop
            </span>

            <span
              className={`flex-1 min-w-0 font-bold text-zinc-800 truncate ${
                compact ? "text-[11px]" : "text-xs"
              }`}
            >
              {shortVenue}
              <span className="text-zinc-400 font-normal"> · </span>
              <span className="text-[#e84a27]">{dishShort}</span>
            </span>

            <ChevronDown
              className={`${compact ? "w-3.5 h-3.5" : "w-4 h-4"} text-zinc-400 shrink-0 transition-transform duration-300 ${
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
            <div className="flex items-start gap-2.5">
              <div className="shrink-0 w-14 h-14 rounded-2xl bg-[#f5efe3] border border-[#e7e0d4] p-1 flex items-center justify-center shadow-xs overflow-hidden">
                <MascotCharacter
                  config={mascotConfig}
                  size={50}
                  animated={isExpanded}
                />
              </div>

              {/* Speech bubble with tail pointing to the mascot */}
              <div
                className="relative flex-1 rounded-2xl border px-3.5 py-2.5 shadow-xs"
                style={{
                  background: "var(--surface-raised, #F5EFE3)",
                  borderColor: "var(--surface-border, #E7E0D4)",
                }}
              >
                {/* Speech bubble arrow/tail pointing left towards the mascot */}
                <span
                  aria-hidden
                  className="absolute top-4 -left-1.5 w-3 h-3 rotate-45 border-l border-b"
                  style={{
                    background: "var(--surface-raised, #F5EFE3)",
                    borderColor: "var(--surface-border, #E7E0D4)",
                  }}
                />
                <div className="flex items-center gap-1.5 mb-1 text-[9px] font-bold uppercase tracking-wider text-[#e84a27]">
                  <span>✦ Mascot Drop Note</span>
                </div>
                <p className="font-comico text-[13px] leading-snug text-zinc-900 relative z-10">
                  &ldquo;{weeklyPick.speech_bubble}&rdquo;
                </p>
              </div>
            </div>

            {/* Dish snapshot + price */}
            <div className="flex items-center gap-2.5">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-black/10 shrink-0 bg-zinc-100">
                <Image
                  src={weeklyPick.dish_image}
                  alt={weeklyPick.dish_name}
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="48px"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-zinc-900 truncate">
                  {weeklyPick.dish_name}
                </p>
                <p className="text-[11px] text-zinc-500 truncate flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#e84a27] shrink-0" />
                  <span>{venueName}</span>
                </p>
              </div>
              <span className="shrink-0 text-[11px] font-mono font-bold px-2 py-1 rounded-full bg-zinc-900 text-white">
                {weeklyPick.price_nok} NOK
              </span>
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
