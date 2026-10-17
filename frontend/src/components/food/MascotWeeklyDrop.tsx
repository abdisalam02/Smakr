"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { MapPin, ArrowUpRight, X, ChevronDown, Pencil } from "lucide-react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { MascotCharacter } from "@/components/avatar/MascotCharacter";
import { SmakrMascotRig } from "@/components/studio/SmakrMascotRig";
import { EditWeeklyDropModal } from "@/components/admin/EditWeeklyDropModal";

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

  const isViewerAdmin = Boolean(
    currentUser?.role === "admin" ||
    currentUser?.is_official ||
    (currentUser?.handle || "").toLowerCase().includes("niwache") ||
    (currentUser?.handle || "").toLowerCase().includes("smak") ||
    (currentUser?.email || "").toLowerCase().includes("niwache")
  );

  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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
            {typeof feedCount === "number" && feedCount >= 25 && (
              <span className="text-[10px] font-mono font-medium text-zinc-500 bg-stone-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                {feedCount}
              </span>
            )}
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
          isExpanded ? "grid-rows-[1fr] opacity-100 mt-2.5" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div
            className="rounded-3xl border p-3.5 space-y-3 shadow-[0_10px_28px_rgba(24,22,21,0.08)]"
            style={{
              background: "var(--surface, #FAF7F2)",
              borderColor: "var(--surface-border, #E5DEC9)",
            }}
          >
            {/* Top Stage: Half-Body Bust Mascot on Left + Editorial Speech Bubble on Right */}
            <div className="flex items-stretch gap-3">
              <div className="relative shrink-0 w-[104px] sm:w-[114px] min-h-[112px] rounded-2xl bg-[#F5EFE3] border border-[#E6DDD0] pt-2 px-1 flex items-end justify-center overflow-hidden">
                <span className="absolute top-1.5 left-2 text-[8px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-white/90 text-[#E84A27] border border-[#E84A27]/20 z-10">
                  ✦ Week {weekNumber}
                </span>
                {weeklyPick.mascot_avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={weeklyPick.mascot_avatar_url}
                    alt="Smakr Mascot"
                    className="w-full h-full object-cover object-top block rounded-xl"
                  />
                ) : (
                  <div className="w-[96px] h-[104px] flex items-end justify-center translate-y-1">
                    <SmakrMascotRig
                      frameMode="bust-only"
                      bodyPose={mascotConfig.prop === "coffee-cup" ? "coffee" : "pointing-up"}
                      head={mascotConfig.peepsHead || "afro"}
                      face={mascotConfig.peepsFace || "smileBig"}
                      accessories={
                        mascotConfig.peepsAccessories === "none"
                          ? "none"
                          : mascotConfig.peepsAccessories === "sunglasses"
                          ? "sunglasses-1"
                          : "glasses-2"
                      }
                      facialHair={mascotConfig.peepsFacialHair || "none"}
                      skinColor={mascotConfig.skinColor || "d08b5b"}
                      clothingColor={mascotConfig.topColor || "e84a27"}
                      innerClothingColor={mascotConfig.bottomColor || "1f2937"}
                      hatColor={mascotConfig.hatColor || "e84a27"}
                      headContrastColor={mascotConfig.hairColor || "241c16"}
                      stickerOutline={true}
                      size={92}
                    />
                  </div>
                )}
              </div>

              {/* Speech bubble with tail pointing to the half-body bust */}
              <div
                className="relative flex-1 rounded-2xl border px-3.5 py-3 shadow-xs flex flex-col justify-between bg-white border-[#E6DDD0]"
              >
                {/* Speech bubble arrow/tail pointing left towards the mascot bust */}
                <span
                  aria-hidden
                  className="absolute top-8 -left-1.5 w-3 h-3 rotate-45 border-l border-b bg-white border-[#E6DDD0]"
                />
                <div className="flex items-center justify-between gap-1.5">
                  <span className="inline-flex items-center gap-1 text-[9.5px] font-extrabold uppercase tracking-wider text-[#e84a27]">
                    ✦ Smakr Critic Verdict
                  </span>
                  <div className="flex items-center gap-1 relative z-20">
                    {isViewerAdmin && (
                      <button
                        type="button"
                        onClick={() => setIsEditModalOpen(true)}
                        className="h-6 px-2 rounded-lg bg-[#FAF7F2] border border-[#E6DDD0] text-[10px] font-bold text-[#e84a27] hover:bg-amber-50 transition-all flex items-center gap-1"
                        title="Edit Weekly Drop"
                      >
                        <Pencil className="w-2.5 h-2.5" />
                        <span>Edit</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsExpanded(false)}
                      aria-label="Collapse weekly drop"
                      className="w-6 h-6 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-black/[0.04] transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-[13.5px] sm:text-[14px] font-bold leading-snug text-stone-800 my-auto py-1 relative z-10">
                  &ldquo;{weeklyPick.speech_bubble}&rdquo;
                </p>
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-stone-500">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#e84a27]" />
                  <span>Handpicked weekly drop in Oslo</span>
                </div>
              </div>
            </div>

            {/* Warm Editorial Featured Dish Spotlight Banner (No Black) */}
            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#FFF6F2] border border-[#F3D7CA] shadow-xs">
              <div className="relative w-[68px] h-[68px] sm:w-[74px] sm:h-[74px] rounded-xl overflow-hidden border border-[#E84A27]/15 shrink-0 bg-[#F5EFE3]">
                <Image
                  src={weeklyPick.dish_image}
                  alt={weeklyPick.dish_name}
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="76px"
                />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#E84A27]">
                    ✦ Featured Dish
                  </span>
                  <span className="shrink-0 text-[11px] font-mono font-extrabold px-2.5 py-0.5 rounded-full bg-[#E84A27] text-white shadow-xs">
                    {weeklyPick.price_nok} kr
                  </span>
                </div>
                <p className="text-sm sm:text-[15px] font-comico font-bold text-stone-900 truncate">
                  {weeklyPick.dish_name}
                </p>
                <p className="text-[11px] text-stone-600 truncate flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#E84A27] shrink-0" />
                  <span className="font-semibold">{venueName}</span>
                </p>
              </div>
            </div>

            {/* Responsive 2-Button Grid Action Bar */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleSpot}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#E84A27] hover:bg-[#d23e1d] text-white text-xs font-bold shadow-sm shadow-[#e84a27]/20 transition-all active:scale-[0.98] cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>Spot on Map</span>
              </button>
              <button
                type="button"
                onClick={handleMenu}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white text-stone-800 border border-[#E6DDD0] hover:bg-[#F5EFE3] text-xs font-bold transition-all active:scale-[0.98] cursor-pointer"
              >
                <span>Spot &amp; Menu</span>
                <ArrowUpRight className="w-3.5 h-3.5 shrink-0 text-[#e84a27]" />
              </button>
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
