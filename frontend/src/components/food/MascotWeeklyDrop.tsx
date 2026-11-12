"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { MapPin, ArrowUpRight, X, ChevronDown, Pencil } from "lucide-react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { MascotCharacter } from "@/components/avatar/MascotCharacter";
import {
  OFFICIAL_SMAKR_MASCOT_CONFIG,
  getOfficialSmakrMascotConfig,
} from "@/lib/officialSmakrMascot";
import { SmakrMascotRig } from "@/components/studio/SmakrMascotRig";
import { EditWeeklyDropModal } from "@/components/admin/EditWeeklyDropModal";
import { FEED_BLUR_DARK } from "@/lib/feedImages";
import { useCollapseOnFeedScroll } from "@/hooks/useCollapseOnFeedScroll";
import type { MascotConfig } from "@/types/mascot";

const MemoizedMascotBust = React.memo(function MemoizedMascotBust({
  config,
}: {
  config: MascotConfig;
}) {
  const accessories =
    !config.peepsAccessories || config.peepsAccessories === "none"
      ? "none"
      : config.peepsAccessories === "glasses"
      ? "glasses-2"
      : config.peepsAccessories;
  return (
    <div className="w-full h-full flex items-end justify-center">
      <SmakrMascotRig
        frameMode="bust-only"
        bodyPose={config.peepsBody || "pointing-up"}
        head={config.peepsHead || OFFICIAL_SMAKR_MASCOT_CONFIG.peepsHead}
        face={config.peepsFace || OFFICIAL_SMAKR_MASCOT_CONFIG.peepsFace}
        accessories={accessories}
        facialHair={config.peepsFacialHair || "none"}
        skinColor={`#${(config.skinColor || OFFICIAL_SMAKR_MASCOT_CONFIG.skinColor).replace(/^#/, "")}`}
        clothingColor={`#${(config.topColor || OFFICIAL_SMAKR_MASCOT_CONFIG.topColor).replace(/^#/, "")}`}
        innerClothingColor={`#${(config.bottomColor || OFFICIAL_SMAKR_MASCOT_CONFIG.bottomColor).replace(/^#/, "")}`}
        hatColor={`#${(config.hatColor || OFFICIAL_SMAKR_MASCOT_CONFIG.hatColor).replace(/^#/, "")}`}
        headContrastColor={`#${(config.hairColor || OFFICIAL_SMAKR_MASCOT_CONFIG.hairColor).replace(/^#/, "")}`}
        stickerOutline={false}
        size={86}
        className="origin-bottom"
      />
    </div>
  );
});

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
  const currentUser = useCityPulseStore((state) => state.currentUser);
  // Derived slice: only re-renders when the weekly pick's own venue changes.
  const venue = useCityPulseStore(
    (state) => state.venues.find((v) => v.id === state.weeklyPick.venue_id) ?? null
  );

  const isViewerAdmin = currentUser?.role === "admin";

  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [brandMascot, setBrandMascot] = useState<MascotConfig>(
    () => getOfficialSmakrMascotConfig()
  );
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setBrandMascot(getOfficialSmakrMascotConfig());
    const onUpdate = (e: Event) => {
      const detail = (e as CustomEvent<MascotConfig>).detail;
      setBrandMascot(detail ?? getOfficialSmakrMascotConfig());
    };
    window.addEventListener("smakr:brand-mascot-updated", onUpdate);
    return () => window.removeEventListener("smakr:brand-mascot-updated", onUpdate);
  }, []);

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

  const isScrolledDown = useCollapseOnFeedScroll({
    threshold: 20,
    isExpanded,
    ignoreSelector: "[data-weekly-drop-drawer]",
    onCollapse: () => setIsExpanded(false),
  });

  // Auto-collapse when sheet transitions to peek
  useEffect(() => {
    if (isPeek) {
      setIsExpanded(false);
    }
  }, [isPeek]);

  const handleSpot = () => {
    setIsExpanded(false);
    flyToSpot(weeklyPick.coords, weeklyPick.venue_id);
  };
  const handleMenu = () => {
    setIsExpanded(false);
    selectVenueById(weeklyPick.venue_id);
  };

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
      className={`w-full max-w-full px-3 sm:px-4 shrink-0 transition-all duration-200 ${
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
                  config={brandMascot}
                  size={isScrolledDown ? 20 : 28}
                  animated={isExpanded}
                />
              )}
            </div>

            {/* Capsule Text & Chevron */}
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[160px] sm:max-w-[220px]">
              <span className="text-[#e84a27] font-bold">✦ Smakr Pick</span>
              <span className="text-zinc-400 font-normal mx-1">·</span>
              <span>{shortVenue}</span>
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
                  config={brandMascot}
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
              ✦ Smakr Pick
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

      {/* ── Expanded spotlight card underneath (smooth 60fps CSS Grid accordion) ── */}
      <div
        data-weekly-drop-drawer="true"
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${
          isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="pt-2.5 pb-0.5">
            <div
              className="w-full max-w-full mx-auto relative overflow-hidden rounded-3xl bg-[#FAF7F2] dark:bg-[#181615] border border-[#181615]/10 dark:border-white/10 shadow-xl p-3 sm:p-3.5 space-y-2.5"
            >
            {/* ROW 1: Mascot on Left + Clean Speech Bubble with ✦ SMAKR PICK on Right */}
            <div className="flex gap-2.5 sm:gap-3 items-stretch">
              {/* Mascot Anchor Box (Warm Pedestal Box, Unclipped Afro) */}
              <div className="w-[86px] sm:w-[96px] h-[96px] sm:h-[102px] shrink-0 rounded-2xl bg-[#F5EFE3] dark:bg-[#25201C] border border-[#E6DDD0] dark:border-white/10 overflow-hidden flex items-end justify-center select-none pt-2">
                <div className="w-full h-full flex items-end justify-center">
                  {weeklyPick.mascot_avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={weeklyPick.mascot_avatar_url}
                      alt="Smakr Mascot"
                      className="w-full h-full object-contain object-bottom block"
                    />
                  ) : (
                    <MemoizedMascotBust config={brandMascot} />
                  )}
                </div>
              </div>

              {/* Speech Bubble (✦ SMAKR PICK Header with Pointer Tail) */}
              <div className="flex-1 min-w-0 bg-white dark:bg-[#221B17] rounded-2xl p-2.5 sm:p-3 border border-[#181615]/10 dark:border-white/10 shadow-sm relative before:content-[''] before:absolute before:-left-1.5 before:bottom-4 before:w-3 before:h-3 before:rotate-45 before:border-l before:border-b before:bg-white dark:before:bg-[#221B17] before:border-[#181615]/10 dark:border-white/10 flex flex-col justify-between">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#E84A27] font-comico">
                    ✦ SMAKR PICK
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    {isViewerAdmin && (
                      <button
                        type="button"
                        onClick={() => setIsEditModalOpen(true)}
                        className="inline-flex items-center gap-1 text-[9.5px] font-bold text-[#6E655F] dark:text-zinc-400 border border-[#181615]/10 dark:border-white/10 px-1.5 py-0.5 rounded-md hover:bg-[#F5EFE4] transition-all cursor-pointer"
                        title="Edit Weekly Drop"
                      >
                        <Pencil className="w-2.5 h-2.5 text-[#e84a27]" />
                        <span>Edit</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsExpanded(false)}
                      aria-label="Collapse weekly drop"
                      className="p-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs sm:text-[13px] font-semibold text-[#181615]/90 dark:text-[#FAF7F2]/90 leading-snug italic my-auto py-0.5">
                  &ldquo;{weeklyPick.speech_bubble}&rdquo;
                </p>

                <div className="flex items-center gap-1 text-[10px] font-medium text-stone-400 dark:text-stone-500 mt-0.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#E84A27]" />
                  <span>Handpicked weekly drop in Oslo</span>
                </div>
              </div>
            </div>

            {/* ROW 2: Featured Dish Hero Card (Clickable, Prominent Image, No Fat Buttons) */}
            <div
              role="button"
              tabIndex={0}
              onClick={handleMenu}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleMenu();
                }
              }}
              className="group/dish flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-[#221B17] border border-[#181615]/10 dark:border-white/10 hover:border-[#E84A27]/40 shadow-xs hover:shadow-sm transition-all duration-200 active:scale-[0.99] cursor-pointer"
            >
              {/* Enlarged Prominent Food Image (80x80px) */}
              <div className="relative w-20 h-20 sm:w-[86px] sm:h-[86px] rounded-xl overflow-hidden border border-[#181615]/10 shrink-0 bg-[#F5EFE4] shadow-xs group-hover/dish:scale-[1.03] transition-transform duration-200">
                <Image
                  src={weeklyPick.dish_image}
                  alt={weeklyPick.dish_name}
                  fill
                  unoptimized
                  placeholder="blur"
                  blurDataURL={FEED_BLUR_DARK}
                  className="object-cover"
                  sizes="90px"
                />
              </div>

              {/* Title, Venue, Price & Tactile Action */}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#E84A27] font-comico">
                    ✦ Featured Dish
                  </span>
                  <span className="shrink-0 text-xs sm:text-sm font-comico font-bold px-2.5 py-0.5 rounded-lg bg-[#E84A27] text-white shadow-xs rotate-[-1deg]">
                    {weeklyPick.price_nok} kr
                  </span>
                </div>
                <h4 className="font-comico font-bold text-base sm:text-lg text-[#181615] dark:text-white truncate leading-tight group-hover/dish:text-[#e84a27] transition-colors">
                  {weeklyPick.dish_name}
                </h4>
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <p className="text-xs text-stone-500 dark:text-stone-400 truncate flex items-center gap-1 font-sans">
                    <MapPin className="w-3.5 h-3.5 text-[#E84A27] shrink-0" />
                    <span className="font-semibold truncate text-[#181615] dark:text-white/90">{venueName}</span>
                  </p>
                  <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold text-[#E84A27] group-hover/dish:translate-x-0.5 transition-transform">
                    <span>Menu &amp; Vibes</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

      <EditWeeklyDropModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </section>
  );
}
