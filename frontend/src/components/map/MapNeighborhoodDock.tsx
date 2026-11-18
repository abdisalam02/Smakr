"use client";

import React, { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Calendar, MapPin, SlidersHorizontal, Clock } from "lucide-react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { resolveVenueDisplayBadge, resolveEntityTaxonomy, resolveDishIconKey, FOOD_GROUPS } from "@/lib/taxonomy";
import { getVenueLiveOpenStatus } from "@/lib/openingHours";
import { formatOsloLocation, formatVenueLocationLine, normalizeOsloNeighborhoodDisplay, getDirectionsUrl } from "@/lib/location";
import {
  isVisibleInFeed,
  getPopupStatus,
  getPopupMeta,
  resolvePopupLifecycle,
} from "@/lib/popupUtils";
import { SmakrFoodIcon } from "@/components/food/FoodIcons";
import { VenuePhotoStrip, useVenueHeroGallery } from "@/components/venue/VenuePhotoStrip";
import { endInstantVenueSheet } from "@/lib/venueMorph";
import type { Venue, VenueDetail, FoodPost } from "@/types";

type VenueWithDishes = Venue & {
  dishes?: Array<{ image_url?: string | null }>;
};

/**
 * Venue thumbnail with a resilient fallback chain: cover image → first verified
 * dish photo → matching feed dish photo → warm paper placeholder tile.
 * Never renders the browser's broken-image icon.
 */
function VenueThumb({
  sources,
  alt,
  eager = false,
}: {
  sources: Array<string | null | undefined>;
  alt: string;
  /** Spotlight card must never lazy-load: a late image mid-transition pops. */
  eager?: boolean;
}) {
  const chain = Array.from(
    new Set(sources.filter((src): src is string => Boolean(src && src.trim())))
  );
  const [index, setIndex] = useState(0);
  const [exhausted, setExhausted] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (chain.length === 0 || exhausted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#F5EDE0] to-[#E8E0D2] dark:from-[#2C2521] dark:to-[#1E1A17] text-[#e84a27]">
        <span aria-hidden="true" className="text-[18px] leading-none">
          ✦
        </span>
      </div>
    );
  }

  const src = chain[Math.min(index, chain.length - 1)];

  return (
    <div className="w-full h-full bg-[#ECE6DA]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={(el) => {
          if (el?.complete && el.naturalWidth > 0 && !loaded) setLoaded(true);
        }}
        src={src}
        alt={alt}
        data-parallax-img="true"
        style={{ transform: "translateX(0px) scale(1.12)" }}
        className={`w-full h-full object-cover pointer-events-none will-change-transform transition-opacity duration-200 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        loading={eager ? "eager" : "lazy"}
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (index + 1 < chain.length) setIndex(index + 1);
          else setExhausted(true);
        }}
      />
    </div>
  );
}

interface DockCarouselCardProps {
  venue: Venue;
  fallbackPhoto?: string;
  onSelect: (venue: Venue) => void;
  onRef: (id: string, el: HTMLDivElement | null) => void;
  /** Hide the slot whose card has lifted into the focused spotlight card. */
  concealed?: boolean;
}

/** Memoized compact carousel card — the parent's sheet state changes never
    re-render the 32-card deck. */
const DockCarouselCard = React.memo(function DockCarouselCard({
  venue,
  fallbackPhoto,
  onSelect,
  onRef,
  concealed = false,
}: DockCarouselCardProps) {
  const badge = resolveVenueDisplayBadge(venue);
  const mainTag = (badge.mainTag || "FOOD")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
  const locationLine = formatVenueLocationLine(venue);
  const signature = venue.signature_dishes?.[0] || mainTag;
  const flagIso = badge.flag ? FLAG_ISO_MAP[badge.flag] : null;
  const ratingText = venue.google_rating != null ? venue.google_rating.toFixed(1) : "4.8";
  const isPopup = venue.spot_type === "popup" || venue.spot_type === "pop_up";
  const popupLifecycle = isPopup ? resolvePopupLifecycle(venue) : null;
  const bottomAccentText = isPopup && popupLifecycle
    ? popupLifecycle.shortDateLabel
    : `✦ ${signature}`;
  const hasLegacyCover = Boolean(venue.cover_image_url?.includes("192446b9a93be33d7cbe"));
  const thumbSources = isPopup || hasLegacyCover
    ? [
        fallbackPhoto,
        (venue as VenueWithDishes).dishes?.[0]?.image_url,
        venue.cover_image_url,
      ]
    : [
        venue.cover_image_url,
        (venue as VenueWithDishes).dishes?.[0]?.image_url,
        fallbackPhoto,
      ];

  return (
    <div
      ref={(el) => onRef(venue.id, el)}
      onClick={() => onSelect(venue)}
      className={`relative w-[260px] h-[118px] shrink-0 snap-center rounded-2xl overflow-hidden cursor-pointer select-none bg-[#181615] shadow-lg will-change-transform ${
        isPopup
          ? popupLifecycle?.state === "live" || popupLifecycle?.state === "upcoming"
            ? "border-2 border-[#E84A27]/85 hover:border-[#E84A27]"
            : "border-2 border-white/80 hover:border-white"
          : "border border-white/15 hover:border-white/35"
      }`}
    >
      {/* Concealed state lives on this inner layer: the parallax engine writes
          the root's transform every scroll frame, so a scale class there would
          be overwritten. */}
      <div
        className={`absolute inset-0 transition-[opacity,transform] duration-200 ${
          concealed ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"
        }`}
      >
        <div className="absolute inset-0 overflow-hidden">
          <VenueThumb sources={thumbSources} alt={venue.name} />
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/15 pointer-events-none" />

        <div className="relative z-10 w-full h-full p-2.5 flex flex-col justify-between">
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            {isPopup ? (
              <span
                className={`text-[10px] font-comico font-normal px-2.5 py-0.5 rounded-full shadow-xs whitespace-nowrap inline-flex items-center gap-1 ${
                  popupLifecycle?.state === "live"
                    ? "bg-[#E84A27] text-white"
                    : popupLifecycle?.state === "upcoming"
                    ? "bg-[#FAF7F2] text-[#E84A27] border border-[#E84A27]/35"
                    : "bg-[#FAF7F2]/95 text-[#181615]"
                }`}
              >
                {popupLifecycle?.state === "live" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                )}
                <span>POP-UP</span>
              </span>
            ) : (
              <div className="bg-[#FAF7F2]/95 text-[#181615] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 truncate border border-[#EAE5DC] shadow-xs max-w-[140px]">
                {flagIso ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={`https://flagcdn.com/16x12/${flagIso}.png`}
                    width={14}
                    height={10}
                    alt={mainTag}
                    className="inline-block rounded-[2px] object-cover shrink-0"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <span className="text-[10px] leading-none shrink-0">
                    {badge.flag || "✦"}
                  </span>
                )}
                <span className="uppercase tracking-wider truncate">{mainTag}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {!isPopup && (
              <span className="bg-[#E84A27] text-white text-[10px] font-comico font-bold px-2 py-0.5 rounded-full shadow-xs whitespace-nowrap">
                {venue.price_level || "$$"}
              </span>
            )}
            <span className="bg-[#FAF7F2]/95 text-[#181615] text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 border border-[#EAE5DC] shadow-xs">
              <span className="text-[#E84A27]">★</span>
              <span>{ratingText}</span>
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-end min-w-0">
          <h4 className="font-comico font-normal text-[16px] leading-tight text-white drop-shadow-xs uppercase truncate">
            {venue.name}
          </h4>
          <div className="flex items-center gap-1 text-[#FAF7F2]/90 text-[11px] truncate mt-0.5">
            <MapPin className="w-3 h-3 text-[#E84A27] shrink-0" />
            <span className="truncate">{locationLine}</span>
            <span className="text-white/40 shrink-0">·</span>
            <span className="text-[#FDEA6B] font-semibold truncate">
              {bottomAccentText}
            </span>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
});

const MAP_CARD_DESIGN = "design2" as "design1" | "design2";

const SpotlightCard = React.memo(function SpotlightCard({
  venue,
  foodPosts,
  fallbackPhoto,
  isWeeklyPick,
  isActive,
  isNeighbor,
  cardOpen,
  onDismiss,
  onOpenDetails,
  onSelectSide,
  cardRef,
}: {
  venue: Venue;
  foodPosts: FoodPost[];
  fallbackPhoto?: string;
  isWeeklyPick: boolean;
  isActive: boolean;
  isNeighbor: boolean;
  cardOpen: boolean;
  onDismiss: () => void;
  onOpenDetails: () => void;
  onSelectSide: () => void;
  cardRef: (el: HTMLDivElement | null) => void;
}) {
  const isPopup = venue.spot_type === "popup" || venue.spot_type === "pop_up";
  const popupMeta = getPopupMeta(venue);
  const popupLifecycle = isPopup ? resolvePopupLifecycle(venue) : null;
  const popupHostVenue =
    popupMeta?.host_venue_name &&
    !popupMeta.host_venue_name.toLowerCase().includes("tba") &&
    !popupMeta.host_venue_name.toLowerCase().includes("host")
      ? popupMeta.host_venue_name
      : null;

  const locationLine = formatVenueLocationLine(venue);
  const matchingPost = foodPosts.find(
    (p) => (p.spot_id === venue.id || p.spot_name === venue.name) && p.dish_name && !p.is_archived
  );
  const heroDishName =
    venue.signature_dishes?.[0] ||
    matchingPost?.dish_name ||
    (venue.vibe_signals as Record<string, any> | null)?.signature_dish ||
    resolveEntityTaxonomy(venue).dishCategory ||
    venue.name;
  const heroDishPrice =
    matchingPost?.price_nok && matchingPost.price_nok > 0
      ? `${matchingPost.price_nok} kr`
      : null;
  const dishIconKey = resolveDishIconKey(heroDishName, venue.food_category);

  const badgeLabel = isPopup ? "POP-UP" : venue.price_level || "$$";
  const directionsUrl = getDirectionsUrl(venue);
  const instagramUrl = popupMeta?.instagram_url || null;
  const instagramHandle = instagramUrl
    ? instagramUrl
        .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
        .replace(/\/.*$/, "")
        .replace(/^@/, "")
    : null;
  const live = getVenueLiveOpenStatus(venue);
  // Keep rating consistent with DockCarouselCard fallback ("4.8")
  const rating = venue.google_rating != null ? venue.google_rating.toFixed(1) : "4.8";
  const hasLegacyCover = Boolean(venue.cover_image_url?.includes("192446b9a93be33d7cbe"));
  const imageSources =
    isPopup || hasLegacyCover
      ? [
          fallbackPhoto,
          matchingPost?.image_url,
          (venue as VenueWithDishes).dishes?.[0]?.image_url,
          venue.cover_image_url,
        ]
      : [
          venue.cover_image_url,
          (venue as VenueWithDishes).dishes?.[0]?.image_url,
          fallbackPhoto,
        ];
  const gallery = useVenueHeroGallery(venue, venue.cover_image_url, isActive);
  const activeHeroImage =
    isActive && gallery.activePhotoUrl ? gallery.activePhotoUrl : null;

  if (MAP_CARD_DESIGN === "design1") {
    return (
      <div
        ref={cardRef}
        data-spotlight-card={isActive ? "true" : undefined}
        data-state={isActive ? (cardOpen ? "open" : "closing") : "neighbor"}
        aria-hidden={!isActive}
        onClick={(e) => {
          if (!isActive && isNeighbor) {
            e.stopPropagation();
            onSelectSide();
          } else if (isActive && cardOpen) {
            e.stopPropagation();
            onOpenDetails();
          }
        }}
        style={{
          contain: "layout paint",
          transformOrigin: "50% 100%",
          pointerEvents: isActive || isNeighbor ? "auto" : "none",
        }}
        className={`absolute inset-0 overflow-hidden rounded-[26px] bg-[#121110] shadow-[0_20px_50px_rgba(0,0,0,0.45)] will-change-transform ${
          (!isActive && isNeighbor) || (isActive && cardOpen) ? "cursor-pointer" : ""
        } ${
          isPopup
            ? "border-2 border-white/90"
            : isWeeklyPick
            ? "border border-[#E84A27]/60 ring-1 ring-[#E84A27]/35"
            : "border border-white/15"
        }`}
      >
        {/* Full-bleed dish/venue photo with sequential parallax crossfade */}
        <div className="absolute inset-0 overflow-hidden">
          <VenueThumb sources={imageSources} alt={venue.name || "Venue"} eager />
          {activeHeroImage && (
            <AnimatePresence initial={false} mode="sync">
              <motion.img
                key={activeHeroImage}
                src={activeHeroImage}
                alt={venue.name || "Venue"}
                initial={{ opacity: 0, scale: 1.06, x: 12 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.98, x: -12 }}
                transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
                onError={() => gallery.reportBroken(activeHeroImage)}
                className="absolute inset-0 w-full h-full object-cover object-center will-change-transform"
              />
            </AnimatePresence>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#121110] via-[#121110]/80 to-black/15 pointer-events-none" />

        {/* Top row: frosted glass rating/open on left; glass close on right */}
        <div
          data-slot-top="true"
          className="relative z-10 flex items-center gap-2 p-3.5 will-change-transform"
        >
          <div
            className={`flex items-center gap-1.5 min-w-0 transition-[margin] duration-300 ${
              isWeeklyPick && isActive ? "ml-[76px]" : ""
            }`}
          >
            <span className="bg-white/20 backdrop-blur-xl text-white text-[11px] font-bold px-2.5 py-1 rounded-full border border-white/40 shadow-[0_4px_16px_rgba(0,0,0,0.18)] flex items-center gap-1 whitespace-nowrap">
              <span className="text-[#F5B301]">★</span>
              <span>{rating}</span>
              {!isPopup && (
                <>
                  <span className="text-white/60">·</span>
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full ${
                      live?.isOpen ? "bg-emerald-400" : "bg-red-400"
                    }`}
                  />
                  <span>{live?.isOpen ? "Open" : "Closed"}</span>
                </>
              )}
            </span>
            {isPopup && (
              <span className="font-comico font-normal text-[11px] px-2.5 py-1 rounded-full shadow-xs whitespace-nowrap bg-white text-[#181615]">
                {badgeLabel}
              </span>
            )}
          </div>

          <div className="ml-auto flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              data-slot-close="true"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              aria-label="Close venue card"
              className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-xl text-white hover:bg-white/30 border border-white/40 shadow-[0_4px_16px_rgba(0,0,0,0.18)] flex items-center justify-center text-[11px] font-bold active:scale-90 transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Bottom editorial stack */}
        <div className="absolute inset-x-0 bottom-0 z-10 p-4 pt-0 flex flex-col justify-end">
          <div data-slot-title="true" className="will-change-transform">
            <h4 className="font-comico font-normal text-[21px] leading-tight text-white drop-shadow-xs truncate">
              {venue.name}
            </h4>
            <p className="text-white/80 text-[11.5px] flex items-center gap-1 truncate mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-[#E84A27] shrink-0" />
              <span className="truncate">{locationLine}</span>
            </p>
          </div>

          <div
            data-slot-story="true"
            data-slot-actions="true"
            className="relative mt-2.5 min-h-[68px]"
          >
            {isPopup ? (
              <div className="flex items-center justify-between gap-2 pt-3">
                <div className="inline-flex items-center gap-2 min-w-0 bg-[#FAF7F2]/15 backdrop-blur-md border border-white/20 rounded-xl px-3 py-1.5 text-xs font-bold text-[#FAF7F2]">
                  <Calendar className="w-3.5 h-3.5 text-[#E84A27] shrink-0" />
                  <span className="truncate">
                    {popupMeta?.dates_label || venue.current_opening_hours_text || "Next Drop TBA"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDetails();
                  }}
                  className="shrink-0 h-8 px-3.5 rounded-full bg-white text-[#181615] font-comico text-[11px] flex items-center justify-center gap-1 shadow-sm active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  <span>Details</span>
                  <span>↗</span>
                </button>
              </div>
            ) : (
              <>
                {gallery.photos.length > 1 && (
                  <div onClick={(e) => e.stopPropagation()} className="w-full">
                    <VenuePhotoStrip
                      photos={gallery.photos}
                      activeIndex={gallery.activeIndex}
                      onSelect={gallery.selectPhoto}
                      onImageError={gallery.reportBroken}
                      venueName={venue.name}
                      variant="tapered"
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDetails();
                  }}
                  className="absolute bottom-0 right-0 z-20 h-8 px-4 rounded-full bg-white text-[#181615] font-comico text-[11px] flex items-center justify-center gap-1 shadow-md active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  <span>Details</span>
                  <span>↗</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Design 2: Dark bottom hue, borderless top close, bottom title & location inline with white Details ↗ + top pointer arrow
  return (
    <div
      ref={cardRef}
      data-spotlight-card={isActive ? "true" : undefined}
      data-state={isActive ? (cardOpen ? "open" : "closing") : "neighbor"}
      aria-hidden={!isActive}
      onClick={(e) => {
        if (!isActive && isNeighbor) {
          e.stopPropagation();
          onSelectSide();
        } else if (isActive && cardOpen) {
          e.stopPropagation();
          onOpenDetails();
        }
      }}
      style={{
        contain: "layout",
        transformOrigin: "50% 100%",
        pointerEvents: isActive || isNeighbor ? "auto" : "none",
      }}
      className={`absolute inset-0 overflow-visible rounded-[26px] will-change-transform ${
        (!isActive && isNeighbor) || (isActive && cardOpen) ? "cursor-pointer" : ""
      }`}
    >
      {/* Top pointer caret matched cleanly to card border & top edge vignette */}
      {(() => {
        const isHotPopup =
          isPopup &&
          (popupLifecycle?.state === "live" || popupLifecycle?.state === "upcoming");
        const arrowFill = isHotPopup
          ? "#E84A27"
          : isPopup
          ? "#FAF7F2"
          : "#181615";
        const arrowStroke = isHotPopup
          ? "#E84A27"
          : isPopup
          ? "rgba(250,247,242,0.95)"
          : "rgba(255,255,255,0.24)";
        return (
          <svg
            data-slot-arrow="true"
            data-weekly={isWeeklyPick ? "true" : "false"}
            aria-hidden="true"
            width="22"
            height="11"
            viewBox="0 0 22 11"
            style={{
              left: "50%",
              top: "-8.5px",
              transform: "translate3d(-50%, 0, 0)",
              opacity: isActive && cardOpen && !isWeeklyPick ? 1 : 0,
            }}
            className={`pointer-events-none absolute z-20 ${
              isActive ? "drop-shadow-[0_-2px_5px_rgba(0,0,0,0.24)]" : ""
            }`}
          >
            <path
              d="M 2 10.5 L 9.8 2.1 Q 11 0.8 12.2 2.1 L 20 10.5 Z"
              fill={arrowFill}
              stroke={arrowStroke}
              strokeWidth="1.25"
              strokeLinejoin="round"
            />
          </svg>
        );
      })()}

      <div
        style={{ contain: "layout paint" }}
        className={`relative w-full h-full overflow-hidden rounded-[26px] bg-[#121110] ${
          isPopup
            ? popupLifecycle?.state === "live" || popupLifecycle?.state === "upcoming"
              ? `border-2 border-[#E84A27]/90 ring-2 ring-[#E84A27]/25 ${
                  isActive ? "shadow-[0_22px_54px_rgba(232,74,39,0.28)]" : "shadow-md"
                }`
              : `border-2 border-[#FAF7F2]/85 ring-1 ring-white/25 ${
                  isActive ? "shadow-[0_20px_50px_rgba(0,0,0,0.45)]" : "shadow-md"
                }`
            : isWeeklyPick
            ? `border border-[#E84A27]/60 ring-1 ring-[#E84A27]/35 ${
                isActive ? "shadow-[0_20px_50px_rgba(0,0,0,0.42)]" : "shadow-md"
              }`
            : `border border-white/15 ${
                isActive ? "shadow-[0_20px_50px_rgba(0,0,0,0.42)]" : "shadow-md"
              }`
        }`}
      >
        {/* Full-bleed venue photo */}
        <div className="absolute inset-0 overflow-hidden">
          <VenueThumb sources={imageSources} alt={venue.name || "Venue"} eager />
        </div>

        {/* Top edge vignette for regular spots so the dark pointer tip blends seamlessly with bright top photos */}
        {!isPopup && (
          <div
            aria-hidden="true"
            style={{
              background:
                "linear-gradient(to bottom, rgba(24,22,21,0.82) 0%, rgba(24,22,21,0.28) 55%, rgba(24,22,21,0) 100%)",
            }}
            className="absolute inset-x-0 top-0 h-8 pointer-events-none z-[1]"
          />
        )}

        {/* Soft dark hue at bottom so white text needs no boxes */}
        <div
          style={{
            background:
              "linear-gradient(to top, rgba(18,17,16,0.96) 0%, rgba(18,17,16,0.82) 56%, rgba(18,17,16,0) 100%)",
          }}
          className="absolute inset-x-0 bottom-0 h-[56%] pointer-events-none"
        />

        {/* Top row: borderless ✕ close button */}
        <div
          data-slot-top="true"
          className="relative z-10 flex items-center justify-end gap-2 px-4 pt-3.5 pb-1 will-change-transform"
        >
          <button
            type="button"
            data-slot-close="true"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            aria-label="Close venue card"
            className="w-7 h-7 flex items-center justify-center text-white/90 hover:text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.85)] text-[15px] font-bold active:scale-90 transition-[transform,opacity] cursor-pointer touch-manipulation"
          >
            ✕
          </button>
        </div>

        {/* Bottom dark hue: title + Pop-up tag + Last pop-up date + address inline with white Details ↗ */}
        <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-3.5 pt-2 flex flex-col justify-end gap-1">
          <div data-slot-title="true" className="will-change-transform">
            <h4 className="font-comico font-bold tracking-wide text-[18px] sm:text-[19px] leading-snug text-white drop-shadow-xs line-clamp-1">
              {venue.name}
            </h4>
            {isPopup && (
              <>
                <p className="inline-flex items-center gap-1 text-[11px] font-bold text-white/90 mt-0.5">
                  <SmakrFoodIcon name="popup" className="w-3.5 h-3.5 shrink-0" />
                  <span>Pop-up</span>
                </p>
                <div
                  data-slot-story="true"
                  className="w-full flex items-center gap-1.5 text-[11px] font-semibold text-white/90 mt-0.5"
                >
                  <Calendar className="w-3.5 h-3.5 text-[#E84A27] shrink-0" />
                  <span className="truncate">
                    {popupLifecycle?.shortDateLabel || "Oslo Pop-Up"}
                  </span>
                </div>
              </>
            )}
          </div>

          <div
            data-slot-actions="true"
            className="flex items-end justify-between gap-2.5"
          >
            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="text-white/85 text-[11.5px] font-medium flex items-center gap-1 truncate">
                <MapPin className="w-3.5 h-3.5 text-[#E84A27] shrink-0" />
                <span className="truncate">{locationLine}</span>
              </p>
              {!isPopup && (
                <p className="text-[11px] font-bold flex items-center gap-1.5 truncate">
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${
                      live?.isOpen === true
                        ? "bg-emerald-400"
                        : live?.isOpen === false
                        ? "bg-red-400"
                        : "bg-zinc-400"
                    }`}
                  />
                  <span
                    className={
                      live?.isOpen === true
                        ? "text-emerald-400"
                        : live?.isOpen === false
                        ? "text-red-400"
                        : "text-white/75 font-medium"
                    }
                  >
                    {live?.isOpen === true
                      ? `Open${live.detailText ? ` · ${live.detailText}` : ""}`
                      : live?.isOpen === false
                      ? `Closed${live.detailText ? ` · ${live.detailText}` : ""}`
                      : live?.label || "Hours on Google Maps"}
                  </span>
                </p>
              )}
            </div>

            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetails();
              }}
              className="group/btn touch-manipulation shrink-0 h-8 px-4 rounded-full bg-white hover:bg-white/95 text-[#181615] font-comico text-[11px] flex items-center justify-center gap-1 shadow-sm transition-all duration-150 ease-out active:scale-[0.94] active:brightness-90 cursor-pointer whitespace-nowrap"
            >
              <span>Details</span>
              <span className="inline-block transition-transform duration-150 group-active/btn:translate-x-0.5 group-active/btn:-translate-y-0.5">
                ↗
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

interface NeighborhoodOption {
  id: string;
  label: string;
  coords: [number, number]; // [lng, lat]
  match: (v: Venue) => boolean;
}

const OSLO_NEIGHBORHOODS: NeighborhoodOption[] = [
  {
    id: "all",
    label: "All Oslo",
    coords: [10.7522, 59.9139],
    match: () => true,
  },
  {
    id: "grunerlokka",
    label: "Grünerløkka",
    coords: [10.7583, 59.9232],
    match: (v) => {
      const n = (v.neighborhood || "").toLowerCase();
      const a = (v.address || "").toLowerCase();
      return (
        n.includes("grunerlokka") ||
        n.includes("grünerløkka") ||
        a.includes("grünerløkka") ||
        a.includes("grunerlokka")
      );
    },
  },
  {
    id: "gronland",
    label: "Grønland",
    coords: [10.7618, 59.9130],
    match: (v) => {
      const n = (v.neighborhood || "").toLowerCase();
      const a = (v.address || "").toLowerCase();
      return (
        n.includes("gronland") ||
        n.includes("grønland") ||
        a.includes("grønland") ||
        a.includes("gronland") ||
        a.includes("smalgangen")
      );
    },
  },
  {
    id: "toyen",
    label: "Tøyen",
    coords: [10.7766, 59.9148],
    match: (v) => {
      const n = (v.neighborhood || "").toLowerCase();
      const a = (v.address || "").toLowerCase();
      return (
        n.includes("toyen") ||
        n.includes("tøyen") ||
        a.includes("tøyen") ||
        a.includes("toyen")
      );
    },
  },
  {
    id: "gamlebyen",
    label: "Gamlebyen",
    coords: [10.768, 59.9055],
    match: (v) => {
      const n = (v.neighborhood || "").toLowerCase();
      const a = (v.address || "").toLowerCase();
      return (
        n.includes("gamlebyen") ||
        a.includes("gamlebyen") ||
        a.includes("schweigaards") ||
        a.includes("oslogate")
      );
    },
  },
  {
    id: "torggata_sentrum",
    label: "Torggata / Sentrum",
    coords: [10.7516, 59.9171],
    match: (v) => {
      const n = (v.neighborhood || "").toLowerCase();
      const a = (v.address || "").toLowerCase();
      return (
        n.includes("torggata") ||
        n.includes("sentrum") ||
        a.includes("torggata") ||
        a.includes("youngstorget") ||
        a.includes("storgata") ||
        n.includes("centrum")
      );
    },
  },
  {
    id: "st_hanshaugen",
    label: "St. Hanshaugen",
    coords: [10.741, 59.9265],
    match: (v) => {
      const n = (v.neighborhood || "").toLowerCase();
      const a = (v.address || "").toLowerCase();
      return (
        n.includes("hanshaugen") ||
        a.includes("hanshaugen") ||
        a.includes("ullevålsveien") ||
        a.includes("waldemar thranes")
      );
    },
  },
  {
    id: "frogner",
    label: "Frogner",
    coords: [10.713, 59.9175],
    match: (v) => {
      const n = (v.neighborhood || "").toLowerCase();
      const a = (v.address || "").toLowerCase();
      return (
        n.includes("frogner") ||
        a.includes("frogner") ||
        a.includes("bygdøy")
      );
    },
  },
  {
    id: "bjorvika",
    label: "Bjørvika",
    coords: [10.755, 59.9075],
    match: (v) => {
      const n = (v.neighborhood || "").toLowerCase();
      const a = (v.address || "").toLowerCase();
      return (
        n.includes("bjorvika") ||
        n.includes("bjørvika") ||
        a.includes("bjørvika") ||
        a.includes("operagata") ||
        a.includes("oslobukta")
      );
    },
  },
  {
    id: "hasle",
    label: "Hasle",
    coords: [10.792, 59.9245],
    match: (v) => {
      const n = (v.neighborhood || "").toLowerCase();
      const a = (v.address || "").toLowerCase();
      return (
        n.includes("hasle") ||
        a.includes("hasle") ||
        a.includes("bøkkerveien")
      );
    },
  },
];

const FLAG_ISO_MAP: Record<string, string> = {
  "🇻🇳": "vn",
  "🇮🇳": "in",
  "🇯🇵": "jp",
  "🇾🇪": "ye",
  "🇭🇰": "hk",
  "🇰🇷": "kr",
  "🇲🇽": "mx",
  "🇪🇸": "es",
  "🇸🇾": "sy",
  "🇮🇹": "it",
  "🇳🇴": "no",
  "🇺🇸": "us",
  "🇹🇭": "th",
  "🇬🇧": "gb",
  "🇫🇷": "fr",
  "🇹🇼": "tw",
  "🇨🇳": "cn",
  "🇬🇷": "gr",
  "🇱🇧": "lb",
  "🇹🇷": "tr",
  "🇵🇰": "pk",
};

export const MapNeighborhoodDock = React.memo(function MapNeighborhoodDock({
  isDesktop = false,
  initialVenues = [],
  initialFoodPosts = [],
}: {
  isDesktop?: boolean;
  initialVenues?: Venue[];
  initialFoodPosts?: FoodPost[];
}) {
  const storeVenues = useCityPulseStore((state) => state.venues);
  const storeFoodPosts = useCityPulseStore((state) => state.foodPosts);
  const venues = storeVenues.length > 0 ? storeVenues : initialVenues;
  const foodPosts = storeFoodPosts.length > 0 ? storeFoodPosts : initialFoodPosts;
  const selectedVenue = useCityPulseStore((state) => state.selectedVenue);
  const setSelectedVenue = useCityPulseStore((state) => state.setSelectedVenue);
  const selectVenueById = useCityPulseStore((state) => state.selectVenueById);
  const setIsVenueDetailModalOpen = useCityPulseStore(
    (state) => state.setIsVenueDetailModalOpen
  );
  const isVenueDetailModalOpen = useCityPulseStore(
    (state) => state.isVenueDetailModalOpen
  );
  const selectedGroup = useCityPulseStore((state) => state.selectedGroup);
  const setSelectedGroup = useCityPulseStore((state) => state.setSelectedGroup);
  const selectedDishCategory = useCityPulseStore((state) => state.selectedDishCategory);
  const selectedSpotKind = useCityPulseStore((state) => state.selectedSpotKind);
  const setSelectedSpotKind = useCityPulseStore((state) => state.setSelectedSpotKind);
  const selectedCuisine = useCityPulseStore((state) => state.selectedCuisine);
  const selectedDietary = useCityPulseStore((state) => state.selectedDietary);
  const savedOnly = useCityPulseStore((state) => state.filters.saved_only);
  const savedPostIds = useCityPulseStore((state) => state.savedPostIds);
  const openNow = useCityPulseStore((state) => state.filters.open_now);
  const setFilters = useCityPulseStore((state) => state.setFilters);
  const resetAllFilters = useCityPulseStore((state) => state.resetAllFilters);
  const weeklyPick = useCityPulseStore((state) => state.weeklyPick);

  const [activeHoodId, setActiveHoodId] = useState<string>("all");
  const [isFilterDeckOpen, setIsFilterDeckOpen] = useState(false);
  // The focused/details card is a bottom-anchored overlay so it grows upward
  // out of the carousel instead of sliding in from the side. displaySpotlight
  // holds the last venue only for the 240ms exit animation.
  const [displaySpotlight, setDisplaySpotlight] = useState<Venue | null>(null);
  const flyTimerRef = useRef<number | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const carouselRef = useRef<HTMLDivElement>(null);
  // Cached card geometry: measuring every card every scroll frame forced a
  // layout each time (32 cards). Measure once per data change and reuse.
  const cardMetricsRef = useRef<
    Array<{ el: HTMLDivElement; img: HTMLElement | null; offsetLeft: number; width: number }>
  >([]);
  const carouselPadLeftRef = useRef(0);
  const spotlightStageRef = useRef<HTMLDivElement | null>(null);
  const spotlightCardElRef = useRef<HTMLDivElement | null>(null);
  const stageRafRef = useRef<number | null>(null);
  const coverStateRef = useRef<{ u: number; openProgress: number; dragY: number }>({
    u: 0,
    openProgress: 0,
    dragY: 0,
  });
  const pendingCoverOffsetRef = useRef<number | null>(null);
  const didDragRef = useRef(false);
  const dragCleanupRef = useRef<(() => void) | null>(null);
  const spotlightOpenRef = useRef(false);
  const skipNextRecenterRef = useRef(false);
  const carouselAnimRef = useRef<number | null>(null);

  const animateCarouselToVenue = useCallback(
    (venueId: string, duration: number) => {
      const carousel = carouselRef.current;
      const card = cardRefs.current[venueId];
      if (!carousel || !card) return false;
      if (carouselAnimRef.current !== null) {
        cancelAnimationFrame(carouselAnimRef.current);
      }
      // Untransformed layout offsets: getBoundingClientRect() includes the
      // parallax scale(), which pushes the target off the CSS snap point and
      // causes a jump when scroll-snap is re-enabled.
      const target =
        card.offsetLeft + card.offsetWidth / 2 - carousel.clientWidth / 2;
      const start = carousel.scrollLeft;
      const delta = target - start;
      if (Math.abs(delta) < 1) return false;

      const previousSnap = carousel.style.scrollSnapType;
      carousel.style.scrollSnapType = "none";
      carousel.style.scrollBehavior = "auto";
      const startedAt = performance.now();
      const ease = (t: number) => 1 - Math.pow(1 - t, 3);

      const tick = (now: number) => {
        const progress = Math.min(1, (now - startedAt) / duration);
        carousel.scrollLeft = start + delta * ease(progress);
        if (progress < 1) {
          carouselAnimRef.current = requestAnimationFrame(tick);
        } else {
          carousel.scrollLeft = target;
          carousel.style.scrollSnapType = previousSnap;
          carouselAnimRef.current = null;
        }
      };
      carouselAnimRef.current = requestAnimationFrame(tick);
      return true;
    },
    []
  );

  useEffect(() => {
    return () => {
      if (carouselAnimRef.current !== null) {
        cancelAnimationFrame(carouselAnimRef.current);
      }
      if (stageRafRef.current !== null) {
        cancelAnimationFrame(stageRafRef.current);
      }
      dragCleanupRef.current?.();
    };
  }, []);

  const scrollCarouselToVenue = useCallback((venueId: string) => {
    const card = cardRefs.current[venueId];
    const carousel = carouselRef.current;
    if (!card || !carousel) return false;
    // Use untransformed offsetLeft so parallax scale() never shifts center.
    const target =
      card.offsetLeft + card.offsetWidth / 2 - carousel.clientWidth / 2;
    const previousSnap = carousel.style.scrollSnapType;
    carousel.style.scrollSnapType = "none";
    carousel.scrollLeft = target;
    carousel.style.scrollSnapType = previousSnap;
    return true;
  }, []);

  // The focused map card is driven entirely by selectedVenue (one source of
  // truth shared with the map pins, the bottom sheet and the empty-map click).
  const activeSpotlight = selectedVenue ?? displaySpotlight;
  // Desktop already renders the full venue pane; never duplicate it over the map.
  const cardVisible = !isDesktop && Boolean(activeSpotlight);
  const cardOpen = Boolean(selectedVenue);
  // The weekly pick gets a unique card treatment: the mascot perches on the
  // top-left corner and speaks to the user while the pin stays centred.
  const isWeeklyPickSpot = Boolean(
    activeSpotlight && weeklyPick?.venue_id === activeSpotlight.id
  );
  const weeklyBubble =
    weeklyPick?.speech_bubble || "Grab this week's pick before it's gone!";

  useEffect(() => {
    if (selectedVenue) {
      setIsFilterDeckOpen(false);
      setDisplaySpotlight(selectedVenue);
      return;
    }
    // Hold the last venue mounted for the 340ms shrink-back & crossfade into the carousel.
    const timer = setTimeout(() => setDisplaySpotlight(null), 350);
    return () => clearTimeout(timer);
  }, [selectedVenue?.id]);

  useEffect(() => {
    return () => {
      if (flyTimerRef.current) window.clearTimeout(flyTimerRef.current);
    };
  }, []);

  // Verified dish photo per venue (first published, non-archived feed dish).
  // Used as the image fallback so a missing venue cover never renders broken.
  const dishPhotoByVenueId = useMemo(() => {
    const map = new Map<string, string>();
    for (const post of foodPosts) {
      if (!post.spot_id || !post.image_url || post.is_archived) continue;
      if (!map.has(post.spot_id)) map.set(post.spot_id, post.image_url);
    }
    return map;
  }, [foodPosts]);

  // Filter venues by all active feed filters AND active neighborhood, then
  // order by nearest-neighbor proximity so swiping glides to nearby spots.
  const displayedVenues = useMemo(() => {
    const hood = OSLO_NEIGHBORHOODS.find((h) => h.id === activeHoodId);
    const postsBySpotId = new Map<string, FoodPost[]>();
    for (const post of foodPosts) {
      if (!post.spot_id || post.is_archived) continue;
      const arr = postsBySpotId.get(post.spot_id);
      if (arr) arr.push(post);
      else postsBySpotId.set(post.spot_id, [post]);
    }

    const filtered = venues.filter((v) => {
      if (!isVisibleInFeed(v)) return false;

      const vPosts = postsBySpotId.get(v.id) ?? [];
      const tax = resolveEntityTaxonomy(v);

      if (selectedDishCategory) {
        const venueMatches =
          tax.dishCategory === selectedDishCategory ||
          v.food_category === selectedDishCategory;
        const postMatches = vPosts.some(
          (p) =>
            p.category === selectedDishCategory ||
            resolveEntityTaxonomy(v, p).dishCategory === selectedDishCategory
        );
        if (!venueMatches && !postMatches) return false;
      } else if (selectedGroup) {
        const venueMatches = tax.group.id === selectedGroup;
        const postMatches = vPosts.some(
          (p) => resolveEntityTaxonomy(v, p).group.id === selectedGroup
        );
        if (!venueMatches && !postMatches) return false;
      }

      if (selectedSpotKind) {
        if (selectedSpotKind === "popup") {
          if (v.spot_type !== "popup" && tax.spotKind !== "popup") return false;
        } else if (tax.spotKind !== selectedSpotKind) {
          return false;
        }
      }

      if (selectedCuisine) {
        const venueHas = (tax.cuisines as string[]).includes(selectedCuisine);
        const postHas = vPosts.some((p) =>
          (resolveEntityTaxonomy(v, p).cuisines as string[]).includes(selectedCuisine)
        );
        if (!venueHas && !postHas) return false;
      }

      if (selectedDietary.length > 0) {
        const vTags = v.dietary_tags ?? [];
        const venueDiet = selectedDietary.every((t) => vTags.includes(t));
        const postDiet = vPosts.some((p) => {
          const pTags = p.dietary_tags ?? vTags;
          return selectedDietary.every((t) => pTags.includes(t));
        });
        if (!venueDiet && !postDiet) return false;
      }

      if (savedOnly) {
        const postSaved = vPosts.some((p) => savedPostIds.has(p.id));
        if (!savedPostIds.has(v.id) && !postSaved) return false;
      }

      if (openNow) {
        const live = getVenueLiveOpenStatus(v);
        if (live.isOpen !== true) return false;
      }

      return true;
    });

    if (filtered.length <= 2) {
      if (hood && hood.id !== "all") {
        return [...filtered].sort((a, b) => Number(hood.match(b)) - Number(hood.match(a)));
      }
      return filtered;
    }

    const COS_OSLO = Math.cos((59.9139 * Math.PI) / 180);
    const distSq = (aLng: number, aLat: number, bLng: number, bLat: number) => {
      const dx = (aLng - bLng) * COS_OSLO;
      const dy = aLat - bLat;
      return dx * dx + dy * dy;
    };

    const withCoords: Venue[] = [];
    const withoutCoords: Venue[] = [];
    for (const v of filtered) {
      if (typeof v.longitude === "number" && typeof v.latitude === "number") {
        withCoords.push(v);
      } else {
        withoutCoords.push(v);
      }
    }
    if (withCoords.length <= 2) return [...withCoords, ...withoutCoords];

    const [anchorLng, anchorLat] = hood?.coords ?? [10.7522, 59.9139];
    const remaining = [...withCoords];
    let startIdx = 0;
    let bestAnchorDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = distSq(
        remaining[i].longitude,
        remaining[i].latitude,
        anchorLng,
        anchorLat
      );
      if (d < bestAnchorDist) {
        bestAnchorDist = d;
        startIdx = i;
      }
    }

    const ordered: Venue[] = [remaining.splice(startIdx, 1)[0]];
    while (remaining.length > 0) {
      const prev = ordered[ordered.length - 1];
      let nearestIdx = 0;
      let nearestDist = Infinity;
      for (let i = 0; i < remaining.length; i++) {
        const d = distSq(
          prev.longitude,
          prev.latitude,
          remaining[i].longitude,
          remaining[i].latitude
        );
        if (d < nearestDist) {
          nearestDist = d;
          nearestIdx = i;
        }
      }
      ordered.push(remaining.splice(nearestIdx, 1)[0]);
    }
    const allOrdered = [...ordered, ...withoutCoords];
    if (hood && hood.id !== "all") {
      const inHood: Venue[] = [];
      const outsideHood: Venue[] = [];
      for (const v of allOrdered) {
        if (hood.match(v)) inHood.push(v);
        else outsideHood.push(v);
      }
      return [...inHood, ...outsideHood];
    }
    return allOrdered;
  }, [
    venues,
    foodPosts,
    activeHoodId,
    selectedDishCategory,
    selectedGroup,
    selectedSpotKind,
    selectedCuisine,
    selectedDietary,
    savedOnly,
    savedPostIds,
    openNow,
  ]);

  // If the user taps a map pin outside the active neighborhood pill, switch
  // back to All Oslo so the clicked pin sits in the swipeable deck.
  useEffect(() => {
    if (!selectedVenue || activeHoodId === "all") return;
    if (!displayedVenues.some((v) => v.id === selectedVenue.id)) {
      setActiveHoodId("all");
    }
  }, [selectedVenue?.id, activeHoodId, displayedVenues]);

  // Warm the active venue's detail sheet photos (hero + place_photos + dishes)
  // alongside left/right swipe neighbors so opening Details is instantaneous.
  useEffect(() => {
    if (!activeSpotlight) return;
    const urls = new Set<string>();
    const addUrl = (url?: string | null) => {
      if (typeof url === "string" && url.trim().length > 0) urls.add(url);
    };

    addUrl(activeSpotlight.cover_image_url);
    addUrl(dishPhotoByVenueId.get(activeSpotlight.id));
    if (Array.isArray(activeSpotlight.place_photos)) {
      for (const p of activeSpotlight.place_photos.slice(0, 4)) addUrl(p);
    }
    const dishes = (activeSpotlight as VenueWithDishes).dishes;
    if (Array.isArray(dishes)) {
      for (const d of dishes.slice(0, 4)) addUrl(d?.image_url);
    }
    for (const post of foodPosts) {
      if (post.spot_id === activeSpotlight.id && !post.is_archived) {
        addUrl(post.image_url);
      }
    }

    if (displayedVenues.length >= 2) {
      const index = displayedVenues.findIndex((v) => v.id === activeSpotlight.id);
      if (index !== -1) {
        const neighbours = [
          displayedVenues[(index - 1 + displayedVenues.length) % displayedVenues.length],
          displayedVenues[(index + 1) % displayedVenues.length],
        ];
        for (const venue of neighbours) {
          if (!venue) continue;
          addUrl(
            venue.cover_image_url ||
              (venue as VenueWithDishes).dishes?.[0]?.image_url ||
              dishPhotoByVenueId.get(venue.id)
          );
        }
      }
    }

    for (const url of urls) {
      const img = new Image();
      img.src = url;
      img.decode?.().catch(() => {});
    }
  }, [activeSpotlight, displayedVenues, dishPhotoByVenueId, foodPosts]);

  // Parallax & 3D Focal-Scale Carousel Physics (60fps requestAnimationFrame throttled)
  const rafRef = useRef<number | null>(null);
  const carouselRectRef = useRef({ left: 0, width: 390 });
  const stageWidthRef = useRef(330);

  // Cache layout metrics once (no per-frame getBoundingClientRect per scroll frame).
  const measureCarouselMetrics = useCallback(() => {
    const container = carouselRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    carouselRectRef.current = { left: rect.left, width: Math.max(rect.width, 320) };
    carouselPadLeftRef.current =
      parseFloat(window.getComputedStyle(container).paddingLeft || "0") || 0;
    const next: typeof cardMetricsRef.current = [];
    for (const el of Object.values(cardRefs.current)) {
      if (!el) continue;
      next.push({
        el,
        img: el.querySelector<HTMLElement>("[data-parallax-img='true']"),
        offsetLeft: el.offsetLeft,
        width: el.offsetWidth,
      });
    }
    cardMetricsRef.current = next;
  }, []);

  const updateCarouselParallax = useCallback(() => {
    const container = carouselRef.current;
    if (!container) return;
    const metrics = cardMetricsRef.current;
    if (metrics.length === 0) return;

    const { left: rectLeft, width: viewportWidth } = carouselRectRef.current;
    const viewportCenter = rectLeft + viewportWidth / 2;
    const scrollLeft = container.scrollLeft;
    const contentLeft = rectLeft + carouselPadLeftRef.current;

    for (const m of metrics) {
      const cardCenter = contentLeft + m.offsetLeft - scrollLeft + m.width / 2;
      const rawOffset = (cardCenter - viewportCenter) / (viewportWidth * 0.55);
      // Skip cards more than ~1.35 viewports away — they are unseen and don't
      // need a transform/opacity write this frame.
      if (Math.abs(rawOffset) > 1.35) continue;
      const offset = Math.max(-1, Math.min(1, rawOffset));
      const absOffset = Math.abs(offset);

      // Centered card sits at scale(1) translateY(0px), tapering outward.
      const scale = (1 - absOffset * 0.09).toFixed(3);
      const translateY = (absOffset * 6).toFixed(1);
      const opacity = (1 - absOffset * 0.18).toFixed(2);
      m.el.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale})`;
      m.el.style.opacity = opacity;

      if (m.img) {
        const tx = (offset * -22).toFixed(1);
        m.img.style.transform = `translate3d(${tx}px, 0, 0) scale(1.12)`;
      }
    }
  }, []);

  const handleCarouselScroll = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      updateCarouselParallax();
    });
  }, [updateCarouselParallax]);

  useEffect(() => {
    measureCarouselMetrics();
    const timer = requestAnimationFrame(() => updateCarouselParallax());
    return () => {
      cancelAnimationFrame(timer);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [displayedVenues, selectedVenue?.id, updateCarouselParallax, measureCarouselMetrics]);

  // Re-measure on container resize / breakpoint changes.
  useEffect(() => {
    const container = carouselRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      measureCarouselMetrics();
      updateCarouselParallax();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [measureCarouselMetrics, updateCarouselParallax]);

  // Dismiss spotlight card (card shrink is the closing animation; no extra
  // camera drift so the close feels instant).
  const handleDismissSpotlight = useCallback(() => {
    setSelectedVenue(null);
  }, [setSelectedVenue]);

  // "Details" opens the full venue bottom sheet with its spring pop-up from the bottom.
  const handleOpenFullDetails = useCallback(() => {
    if (!activeSpotlight) return;
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(8);
    }
    (window as unknown as { __smakrMap?: { stop?: () => void } }).__smakrMap?.stop?.();
    endInstantVenueSheet();
    selectVenueById(activeSpotlight.id);
    window.setTimeout(() => {
      setIsVenueDetailModalOpen(true);
    }, 45);
  }, [activeSpotlight, selectVenueById, setIsVenueDetailModalOpen]);

  // Handle clicking a neighborhood pill: prioritize neighborhood cards first + camera animation + dismiss spotlight
  const handleSelectHood = (hood: NeighborhoodOption) => {
    setActiveHoodId(hood.id);
    if (selectedVenue) {
      setSelectedVenue(null);
    }
    if (carouselRef.current) {
      carouselRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
    const map = (typeof window !== "undefined" && (window as any).__smakrMap) || null;
    if (map) {
      map.flyTo({
        center: hood.coords,
        zoom: hood.id === "all" ? 13.5 : 14.2,
        duration: 850,
        essential: true,
      });
    }
  };

  // Handle clicking a card: focus the pin + rise the card, WITHOUT opening the
  // full details drawer (that only opens from the expanded card's CTA).
  const handleCardClick = useCallback((venue: Venue) => {
    // Selection alone drives the synchronized camera flight (520ms ease-out)
    // and the card rise from MapRadarView's store subscription.
    setSelectedVenue({
      ...venue,
      recent_checkins: [],
      recent_speed_tests: [],
    } as VenueDetail);
  }, [setSelectedVenue]);

  const registerCardRef = useCallback((id: string, el: HTMLDivElement | null) => {
    cardRefs.current[id] = el;
  }, []);

  const slotNodesRef = useRef<
    Record<
      string,
      {
        el: HTMLDivElement;
        topEl: HTMLElement | null;
        closeEl: HTMLElement | null;
        titleEl: HTMLElement | null;
        storyEl: HTMLElement | null;
        actionsEl: HTMLElement | null;
        imgEl: HTMLElement | null;
        arrowEl: HTMLElement | null;
      }
    >
  >({});

  const registerSlotNodes = useCallback(
    (venueId: string, isActive: boolean) => (el: HTMLDivElement | null) => {
      if (el) {
        slotNodesRef.current[venueId] = {
          el,
          topEl: el.querySelector<HTMLElement>("[data-slot-top='true']"),
          closeEl: el.querySelector<HTMLElement>("[data-slot-close='true']"),
          titleEl: el.querySelector<HTMLElement>("[data-slot-title='true']"),
          storyEl: el.querySelector<HTMLElement>("[data-slot-story='true']"),
          actionsEl: el.querySelector<HTMLElement>("[data-slot-actions='true']"),
          imgEl: el.querySelector<HTMLElement>("[data-parallax-img='true']"),
          arrowEl: el.querySelector<HTMLElement>("[data-slot-arrow='true']"),
        };
      } else {
        delete slotNodesRef.current[venueId];
      }
      if (isActive) {
        spotlightCardElRef.current = el;
      }
    },
    []
  );

  const spotlightSlots = useMemo(() => {
    if (!activeSpotlight) {
      return [] as Array<{ venue: Venue; slotIndex: number }>;
    }
    const len = displayedVenues.length;
    const idx = displayedVenues.findIndex((v) => v.id === activeSpotlight.id);
    if (len <= 1 || idx === -1) {
      return [{ venue: activeSpotlight, slotIndex: 0 }];
    }
    if (len === 2) {
      return [
        { venue: activeSpotlight, slotIndex: 0 },
        { venue: displayedVenues[(idx + 1) % 2], slotIndex: 1 },
      ];
    }
    if (len === 3) {
      return [
        { venue: displayedVenues[(idx - 1 + 3) % 3], slotIndex: -1 },
        { venue: activeSpotlight, slotIndex: 0 },
        { venue: displayedVenues[(idx + 1) % 3], slotIndex: 1 },
      ];
    }
    if (len === 4) {
      return [
        { venue: displayedVenues[(idx - 1 + 4) % 4], slotIndex: -1 },
        { venue: activeSpotlight, slotIndex: 0 },
        { venue: displayedVenues[(idx + 1) % 4], slotIndex: 1 },
        { venue: displayedVenues[(idx + 2) % 4], slotIndex: 2 },
      ];
    }
    return [
      { venue: displayedVenues[(idx - 2 + len) % len], slotIndex: -2 },
      { venue: displayedVenues[(idx - 1 + len) % len], slotIndex: -1 },
      { venue: activeSpotlight, slotIndex: 0 },
      { venue: displayedVenues[(idx + 1) % len], slotIndex: 1 },
      { venue: displayedVenues[(idx + 2) % len], slotIndex: 2 },
    ];
  }, [activeSpotlight, displayedVenues]);

  const spotlightSlotsRef = useRef(spotlightSlots);
  spotlightSlotsRef.current = spotlightSlots;

  // Cache spotlight stage width via ResizeObserver so applyStageFrame never reads offsetWidth per frame
  useEffect(() => {
    const el = spotlightStageRef.current;
    if (!el) return;
    const syncWidth = () => {
      const w = el.offsetWidth;
      if (w > 0) stageWidthRef.current = w;
    };
    syncWidth();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(syncWidth);
    observer.observe(el);
    return () => observer.disconnect();
  }, [cardVisible]);

  const getStageMetrics = useCallback(() => {
    const stageW = stageWidthRef.current || 330;
    const sideW = Math.min(260, Math.round(stageW * 0.8));
    const compactScale = sideW / stageW;
    const compactUnscaledH = 118 / compactScale;
    const gap = 12;
    const compactStep = sideW + gap;
    const expandedStep = stageW / 2 + gap + sideW / 2;
    return { stageW, sideW, compactScale, compactUnscaledH, gap, compactStep, expandedStep };
  }, []);

  const applyStageFrame = useCallback(
    (u: number, openProgress: number, dragY = 0) => {
      coverStateRef.current = { u, openProgress, dragY };
      const {
        compactScale,
        compactStep,
        expandedStep,
      } = getStageMetrics();
      const slotStep = compactStep + (expandedStep - compactStep) * openProgress;
      const slots = spotlightSlotsRef.current;
      const len = displayedVenues.length;

      if (spotlightStageRef.current) {
        // Keep stage solid through most of close so it scales down smoothly before
        // crossfading into the resting carousel card over the final 25%.
        const stageFade = openProgress < 0.25 ? Math.max(0, openProgress / 0.25) : 1;
        spotlightStageRef.current.style.opacity = stageFade.toFixed(3);
      }

      for (const slot of slots) {
        const nodes = slotNodesRef.current[slot.venue.id];
        if (!nodes) continue;

        let effectiveSlot = slot.slotIndex;
        if (len === 2 && slot.slotIndex === 1 && u < 0) effectiveSlot = -1;
        if (len === 4 && slot.slotIndex === 2 && u < 0) effectiveSlot = -2;

        const pos = effectiveSlot - u;
        const dist = Math.abs(pos);
        const focus = Math.max(0, 1 - dist) * openProgress;
        // Pure GPU transform scaling from bottom-center (eliminates per-frame clip-path paint thrash)
        const scale = (compactScale * 0.88) + (1 - compactScale * 0.88) * focus;
        const x =
          dist <= 1
            ? pos * slotStep
            : Math.sign(pos) * (slotStep + (dist - 1) * compactStep);
        const y = (effectiveSlot === 0 && dragY > 0 ? dragY * 0.75 : 0) + (1 - focus) * 14;
        const dragFade =
          effectiveSlot === 0 && dragY > 0 ? Math.max(0.4, 1 - dragY / 420) : 1;
        const cardOpacity = (0.72 + 0.28 * focus) * dragFade;

        const { el, closeEl, titleEl, storyEl, actionsEl, imgEl, arrowEl } = nodes;
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(4)})`;
        el.style.opacity = cardOpacity.toFixed(3);
        el.style.zIndex = String(Math.round(10 + focus * 10));

        if (arrowEl) {
          if (arrowEl.dataset.weekly === "true") {
            arrowEl.style.opacity = "0";
          } else {
            const arrowAlpha = Math.max(0, (focus - 0.55) / 0.45);
            arrowEl.style.opacity = arrowAlpha.toFixed(3);
            arrowEl.style.transform = `translate3d(-50%, ${((1 - focus) * 6).toFixed(1)}px, 0) scale(${(0.75 + 0.25 * focus).toFixed(3)})`;
          }
        }
        if (closeEl) {
          const closeAlpha = Math.max(0, (focus - 0.5) / 0.5);
          closeEl.style.opacity = closeAlpha.toFixed(3);
          closeEl.style.pointerEvents = focus > 0.65 ? "auto" : "none";
        }
        if (titleEl) {
          titleEl.style.transform = `translate3d(0, ${((1 - focus) * 26).toFixed(1)}px, 0)`;
        }
        if (storyEl) {
          storyEl.style.opacity = Math.max(0, (focus - 0.35) / 0.65).toFixed(3);
        }
        if (actionsEl) {
          const actAlpha = Math.max(0, (focus - 0.45) / 0.55);
          actionsEl.style.opacity = actAlpha.toFixed(3);
          actionsEl.style.pointerEvents = focus > 0.65 ? "auto" : "none";
        }
        if (imgEl) {
          const parallax = Math.max(-1.4, Math.min(1.4, pos)) * -18;
          imgEl.style.transform = `translate3d(${parallax.toFixed(1)}px, 0, 0) scale(1.12)`;
        }
      }
    },
    [displayedVenues.length, getStageMetrics]
  );

  const animateStageTo = useCallback(
    (targetU: number, targetOpen: number, duration: number, targetDragY = 0) => {
      if (stageRafRef.current !== null) {
        cancelAnimationFrame(stageRafRef.current);
        stageRafRef.current = null;
      }
      const { u: startU, openProgress: startOpen, dragY: startDragY } =
        coverStateRef.current;
      const startedAt = performance.now();
      const ease = (t: number) => 1 - Math.pow(1 - t, 3.2);

      const tick = (now: number) => {
        const raw = Math.min(1, (now - startedAt) / duration);
        const p = ease(raw);
        const curU = startU + (targetU - startU) * p;
        const curOpen = startOpen + (targetOpen - startOpen) * p;
        const curY = startDragY + (targetDragY - startDragY) * p;
        applyStageFrame(curU, curOpen, curY);
        if (raw < 1) {
          stageRafRef.current = requestAnimationFrame(tick);
        } else {
          stageRafRef.current = null;
        }
      };
      stageRafRef.current = requestAnimationFrame(tick);
    },
    [applyStageFrame]
  );

  // Unified single-carousel Cover-Flow lifecycle: grow directly out of the
  // compact slot on open, shrink cleanly back into it on close, and finish any live
  // swipe morph seamlessly across neighbors.
  useLayoutEffect(() => {
    const venueId = selectedVenue?.id ?? activeSpotlight?.id ?? null;
    if (!venueId || isDesktop) {
      spotlightOpenRef.current = false;
      return;
    }

    const wasOpen = spotlightOpenRef.current;
    const isOpening = Boolean(selectedVenue) && !wasOpen;
    const isClosing = !selectedVenue && wasOpen;
    const changingWhileOpen = Boolean(selectedVenue) && wasOpen;
    spotlightOpenRef.current = Boolean(selectedVenue);

    if (changingWhileOpen && selectedVenue) {
      if (skipNextRecenterRef.current) {
        skipNextRecenterRef.current = false;
      } else {
        animateCarouselToVenue(selectedVenue.id, 340);
      }

      if (pendingCoverOffsetRef.current !== null) {
        const startU = pendingCoverOffsetRef.current;
        pendingCoverOffsetRef.current = null;
        applyStageFrame(startU, 1, 0);
        animateStageTo(0, 1, 340);
      } else {
        applyStageFrame(0, 0.82, 0);
        animateStageTo(0, 1, 320);
      }
      return;
    }

    if (isOpening) {
      scrollCarouselToVenue(venueId);
      applyStageFrame(0, 0, 0);
      animateStageTo(0, 1, 360);
      return;
    }

    if (isClosing) {
      scrollCarouselToVenue(venueId);
      animateStageTo(0, 0, 340, 0);
    }
  }, [
    selectedVenue?.id,
    activeSpotlight?.id,
    isDesktop,
    animateCarouselToVenue,
    scrollCarouselToVenue,
    applyStageFrame,
    animateStageTo,
  ]);

  const commitSideSwitch = useCallback(
    (targetVenue: Venue, startU: number) => {
      pendingCoverOffsetRef.current = startU;
      if (animateCarouselToVenue(targetVenue.id, 320)) {
        skipNextRecenterRef.current = true;
      }
      handleCardClick(targetVenue);
    },
    [animateCarouselToVenue, handleCardClick]
  );

  const handleSpotlightPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!activeSpotlight || !cardOpen) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;

      dragCleanupRef.current?.();

      // Refresh cached stage width once before drag begins (zero offsetWidth reads during rAF)
      const stageWNow = spotlightStageRef.current?.offsetWidth;
      if (stageWNow && stageWNow > 0) stageWidthRef.current = stageWNow;

      const startX = e.clientX;
      const startY = e.clientY;
      const baseU = coverStateRef.current.u;
      let lastX = startX;
      let prevX = startX;
      let lastY = startY;
      let prevY = startY;
      let lastT = performance.now();
      let prevT = lastT;
      let lock: "x" | "y" | null = null;
      let dragRaf: number | null = null;
      let latestDx = 0;
      let latestDy = 0;

      const getStep = () => getStageMetrics().expandedStep;

      const applyDragFrame = () => {
        dragRaf = null;
        if (lock === "y") {
          const dampY = Math.max(0, latestDy);
          applyStageFrame(0, Math.max(0.55, 1 - dampY / 380), dampY);
          return;
        }
        if (lock === "x") {
          const stepPx = getStep();
          const len = displayedVenues.length;
          if (len < 2) {
            applyStageFrame((-latestDx / stepPx) * 0.25, 1, 0);
            return;
          }
          const nextU = Math.max(-1.15, Math.min(1.15, baseU - latestDx / stepPx));
          applyStageFrame(nextU, 1, 0);
        }
      };

      const onMove = (ev: PointerEvent) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;

        if (!lock) {
          if (Math.hypot(dx, dy) < 8) return;
          if (Math.abs(dx) >= Math.abs(dy)) {
            lock = "x";
          } else if (dy > 0) {
            lock = "y";
          } else {
            return;
          }
          didDragRef.current = true;
          if (stageRafRef.current !== null) {
            cancelAnimationFrame(stageRafRef.current);
            stageRafRef.current = null;
          }
        }

        const now = performance.now();
        if (now - lastT > 12) {
          prevX = lastX;
          prevY = lastY;
          prevT = lastT;
        }
        lastX = ev.clientX;
        lastY = ev.clientY;
        lastT = now;
        latestDx = dx;
        latestDy = dy;

        if (dragRaf === null) {
          dragRaf = requestAnimationFrame(applyDragFrame);
        }
      };

      const cleanup = () => {
        if (dragRaf !== null) {
          cancelAnimationFrame(dragRaf);
          dragRaf = null;
        }
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onEnd);
        window.removeEventListener("pointercancel", onEnd);
        dragCleanupRef.current = null;
      };

      const onEnd = () => {
        cleanup();
        window.setTimeout(() => {
          didDragRef.current = false;
        }, 0);

        if (!lock) return;

        const dt = Math.max(1, lastT - prevT);
        const vx = (lastX - prevX) / dt;
        const vy = (lastY - prevY) / dt;

        if (lock === "y") {
          if (latestDy > 65 || (latestDy > 20 && vy > 0.42)) {
            handleDismissSpotlight();
          } else {
            animateStageTo(0, 1, 220, 0);
          }
          return;
        }

        const len = displayedVenues.length;
        const idx = displayedVenues.findIndex((v) => v.id === activeSpotlight.id);
        const curU = coverStateRef.current.u;
        const shouldCommit =
          len >= 2 &&
          idx !== -1 &&
          (Math.abs(curU) > 0.24 || (Math.abs(latestDx) > 16 && Math.abs(vx) > 0.3));

        if (shouldCommit) {
          const step: -1 | 1 = curU !== 0 ? (curU > 0 ? 1 : -1) : latestDx < 0 ? 1 : -1;
          const next = displayedVenues[(idx + step + len) % len];
          if (next && next.id !== activeSpotlight.id) {
            commitSideSwitch(next, curU - step);
            return;
          }
        }

        animateStageTo(0, 1, 240, 0);
      };

      dragCleanupRef.current = cleanup;
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerup", onEnd, { passive: true });
      window.addEventListener("pointercancel", onEnd, { passive: true });
    },
    [
      activeSpotlight,
      cardOpen,
      displayedVenues,
      getStageMetrics,
      applyStageFrame,
      animateStageTo,
      commitSideSwitch,
      handleDismissSpotlight,
    ]
  );

  const hasActiveFilter = Boolean(
    selectedGroup ||
      selectedDishCategory ||
      selectedSpotKind ||
      selectedCuisine ||
      selectedDietary.length > 0 ||
      savedOnly ||
      openNow
  );

  const FILTER_BUBBLE_PATH =
    "M 41.4 59.6 A 29 29 0 1 1 68.6 59.6 C 65.5 64 66 71.5 76 72 L 90.5 72 A 15.5 15.5 0 0 1 90.5 103 L 19.5 103 A 15.5 15.5 0 0 1 19.5 72 L 34 72 C 44 71.5 44.5 64 41.4 59.6 Z";

  const postsBySpotIdMap = useMemo(() => {
    const map = new Map<string, FoodPost[]>();
    for (const post of foodPosts) {
      if (!post.spot_id || post.is_archived) continue;
      const arr = map.get(post.spot_id);
      if (arr) arr.push(post);
      else map.set(post.spot_id, [post]);
    }
    return map;
  }, [foodPosts]);

  const mapFilterOptions = useMemo(() => {
    const visibleVenues = venues.filter((v) => isVisibleInFeed(v));
    const popupCount = visibleVenues.filter(
      (v) => v.spot_type === "popup" || resolveEntityTaxonomy(v).spotKind === "popup"
    ).length;
    const openCount = visibleVenues.filter(
      (v) => getVenueLiveOpenStatus(v).isOpen === true
    ).length;

    const options: Array<{
      id: string;
      label: string;
      count: number;
      iconName?: string;
      kind: "all" | "open" | "popup" | "group";
      active: boolean;
    }> = [
      {
        id: "all",
        label: "All Spots",
        count: visibleVenues.length,
        iconName: "street_food",
        kind: "all",
        active: !hasActiveFilter,
      },
      {
        id: "open",
        label: "Open Now",
        count: openCount,
        kind: "open",
        active: Boolean(openNow),
      },
      {
        id: "popup",
        label: "Pop-Ups",
        count: popupCount,
        iconName: "popup",
        kind: "popup",
        active: selectedSpotKind === "popup",
      },
    ];

    for (const grp of FOOD_GROUPS) {
      const count = visibleVenues.filter((v) => {
        if (resolveEntityTaxonomy(v).group.id === grp.id) return true;
        const vPosts = postsBySpotIdMap.get(v.id) ?? [];
        return vPosts.some((p) => resolveEntityTaxonomy(v, p).group.id === grp.id);
      }).length;
      if (count > 0) {
        options.push({
          id: grp.id,
          label: grp.shortLabel,
          count,
          iconName: grp.heroIcon,
          kind: "group",
          active: selectedGroup === grp.id,
        });
      }
    }
    return options;
  }, [venues, postsBySpotIdMap, hasActiveFilter, openNow, selectedSpotKind, selectedGroup]);

  const handleSelectMapFilter = useCallback(
    (opt: { id: string; kind: "all" | "open" | "popup" | "group" }) => {
      if (selectedVenue) setSelectedVenue(null);
      if (opt.kind === "all") {
        resetAllFilters();
      } else if (opt.kind === "open") {
        resetAllFilters();
        setFilters({ open_now: true });
      } else if (opt.kind === "popup") {
        resetAllFilters();
        setSelectedSpotKind("popup");
      } else {
        resetAllFilters();
        setSelectedGroup(opt.id);
      }

      // Pan / zoom the map to fit all places matching the selected filter
      const map = (typeof window !== "undefined" && (window as any).__smakrMap) || null;
      if (map) {
        if (opt.kind === "all") {
          map.flyTo({
            center: [10.7522, 59.9139],
            zoom: 13.2,
            duration: 750,
            essential: true,
          });
        } else {
          const visible = venues.filter((v) => isVisibleInFeed(v));
          let matching = visible;
          if (opt.kind === "open") {
            matching = visible.filter((v) => getVenueLiveOpenStatus(v).isOpen === true);
          } else if (opt.kind === "popup") {
            matching = visible.filter(
              (v) => v.spot_type === "popup" || resolveEntityTaxonomy(v).spotKind === "popup"
            );
          } else if (opt.kind === "group") {
            matching = visible.filter((v) => {
              if (resolveEntityTaxonomy(v).group.id === opt.id) return true;
              const vPosts = postsBySpotIdMap.get(v.id) ?? [];
              return vPosts.some((p) => resolveEntityTaxonomy(v, p).group.id === opt.id);
            });
          }

          const coords = matching.filter(
            (v) => typeof v.longitude === "number" && typeof v.latitude === "number"
          );
          if (coords.length === 1) {
            map.flyTo({
              center: [coords[0].longitude, coords[0].latitude],
              zoom: 14.5,
              duration: 750,
              essential: true,
            });
          } else if (coords.length >= 2) {
            let minLng = Infinity;
            let maxLng = -Infinity;
            let minLat = Infinity;
            let maxLat = -Infinity;
            for (const v of coords) {
              if (v.longitude < minLng) minLng = v.longitude;
              if (v.longitude > maxLng) maxLng = v.longitude;
              if (v.latitude < minLat) minLat = v.latitude;
              if (v.latitude > maxLat) maxLat = v.latitude;
            }
            map.fitBounds(
              [
                [minLng, minLat],
                [maxLng, maxLat],
              ],
              {
                padding: { top: 96, bottom: 235, left: 44, right: 44 },
                maxZoom: 14.2,
                duration: 800,
                essential: true,
              }
            );
          }
        }
      }
    },
    [
      venues,
      postsBySpotIdMap,
      selectedVenue,
      setSelectedVenue,
      resetAllFilters,
      setFilters,
      setSelectedSpotKind,
      setSelectedGroup,
    ]
  );

  const allOsloHood = OSLO_NEIGHBORHOODS[0];
  const scrollingHoods = OSLO_NEIGHBORHOODS.slice(1);

  return (
    <div className="relative w-full max-w-full flex flex-col gap-2 select-none pointer-events-none">
        {/* ── ROW A: Static All Oslo + Filter Toggle on left; scrollable Oslo neighborhoods on right ── */}
        <div
          className={`w-full px-3 flex items-center gap-1.5 transition-all duration-300 ease-out ${
            !isDesktop && cardOpen
              ? "opacity-0 translate-y-2 pointer-events-none"
              : "opacity-100 translate-y-0 pointer-events-auto"
          }`}
        >
          <div className="shrink-0 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setIsFilterDeckOpen(false);
                handleSelectHood(allOsloHood);
              }}
              className={`h-8 px-3.5 rounded-full font-comico text-[11px] whitespace-nowrap transition-all select-none shrink-0 cursor-pointer border ${
                activeHoodId === allOsloHood.id
                  ? "bg-[#E84A27] text-white border-[#E84A27] shadow-md"
                  : "bg-[#FAF7F2]/92 backdrop-blur-sm text-[#181615] border-[#181615]/12 shadow-sm hover:bg-[#FAF7F2]"
              }`}
            >
              <span className="font-comico font-normal tracking-wide">{allOsloHood.label}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFilterDeckOpen((prev) => !prev)}
              aria-label="Filter map spots"
              aria-expanded={isFilterDeckOpen}
              className={`h-8 px-2.5 rounded-full font-comico text-[11px] flex items-center justify-center gap-1 transition-all select-none shrink-0 cursor-pointer border ${
                isFilterDeckOpen || hasActiveFilter
                  ? "bg-[#181615] text-white border-[#181615] shadow-md"
                  : "bg-[#FAF7F2]/92 backdrop-blur-sm text-[#181615] border-[#181615]/12 shadow-sm hover:bg-[#FAF7F2]"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {hasActiveFilter && !isFilterDeckOpen && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#E84A27]" />
              )}
            </button>
          </div>

          <div className="flex-1 min-w-0 overflow-x-auto no-scrollbar flex items-center gap-1.5 py-0.5">
            {scrollingHoods.map((hood) => {
              const isActive = activeHoodId === hood.id;
              return (
                <button
                  key={hood.id}
                  type="button"
                  onClick={() => {
                    setIsFilterDeckOpen(false);
                    handleSelectHood(hood);
                  }}
                  className={`h-8 px-3.5 rounded-full font-comico text-[11px] whitespace-nowrap transition-all select-none shrink-0 cursor-pointer border ${
                    isActive
                      ? "bg-[#E84A27] text-white border-[#E84A27] shadow-md"
                      : "bg-[#FAF7F2]/90 backdrop-blur-sm text-[#181615] border-[#181615]/12 shadow-sm hover:bg-[#FAF7F2]"
                  }`}
                >
                  <span className="font-comico font-normal tracking-wide">{hood.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── ROW B: Connected 2-Bubble Floating Glass Filters OR Resting Compact Carousel ── */}
        {isFilterDeckOpen && !cardOpen ? (
          <div className="relative w-full h-[138px] overflow-x-auto snap-x snap-mandatory no-scrollbar px-5 pt-3 pb-2 flex items-center gap-3 pointer-events-auto">
            {mapFilterOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelectMapFilter(opt)}
                className="relative w-[110px] h-[108px] shrink-0 snap-center flex items-center justify-center transition-transform duration-200 active:scale-90 cursor-pointer group"
              >
                {/* Unified 2-bubble + bridge translucent glass silhouette with soft fading edges */}
                <div
                  aria-hidden="true"
                  className={`absolute inset-0 backdrop-blur-xl backdrop-saturate-150 transition-all duration-200 ${
                    opt.active
                      ? "bg-gradient-to-b from-[#E84A27]/82 via-[#E84A27]/68 to-[#E84A27]/52"
                      : "bg-gradient-to-b from-white/45 via-white/30 to-white/18 group-hover:from-white/58 group-hover:via-white/42 group-hover:to-white/28"
                  }`}
                  style={{
                    clipPath: `path('${FILTER_BUBBLE_PATH}')`,
                    maskImage:
                      "radial-gradient(ellipse 92% 94% at 50% 50%, black 64%, transparent 100%)",
                    WebkitMaskImage:
                      "radial-gradient(ellipse 92% 94% at 50% 50%, black 64%, transparent 100%)",
                  }}
                />

                {/* Top circular bubble: food icon */}
                <div
                  className={`relative z-10 -mt-[34px] h-[58px] flex items-center justify-center transition-transform duration-200 ${
                    opt.active ? "scale-105" : "group-hover:scale-105"
                  }`}
                >
                  {opt.kind === "open" ? (
                    <Clock
                      className={`w-9 h-9 drop-shadow-[0_2px_6px_rgba(24,22,21,0.18)] ${
                        opt.active ? "text-white" : "text-[#3D5A45]"
                      }`}
                    />
                  ) : opt.iconName ? (
                    <SmakrFoodIcon
                      name={opt.iconName}
                      className="w-11 h-11 drop-shadow-[0_4px_8px_rgba(24,22,21,0.22)]"
                    />
                  ) : null}
                </div>

                {/* Bottom connected pill: filter name */}
                <div className="absolute top-[72px] left-0 right-0 z-10 h-[31px] px-3 flex items-center justify-center">
                  <span
                    className={`font-comico font-normal text-[11px] leading-none uppercase truncate ${
                      opt.active
                        ? "text-white drop-shadow-[0_1px_2px_rgba(24,22,21,0.25)]"
                        : "text-[#181615] drop-shadow-[0_1px_2px_rgba(255,255,255,0.85)]"
                    }`}
                  >
                    {opt.label}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div
            ref={carouselRef}
            onScroll={handleCarouselScroll}
            className={`relative w-full overflow-x-auto snap-x snap-mandatory no-scrollbar px-6 pt-3 pb-2 flex items-end gap-3 transition-opacity ease-out ${
              !isDesktop && cardOpen
                ? "opacity-0 pointer-events-none duration-200 delay-0"
                : "opacity-100 pointer-events-auto duration-300 delay-75"
            }`}
          >
          {displayedVenues.length === 0 ? (
            <div className="w-full py-4 text-center text-xs text-[#181615]/70 bg-[#FAF7F2]/85 backdrop-blur-md rounded-2xl border border-white/60 shadow-xs">
              No spots match this neighborhood and filter.
            </div>
          ) : (
            displayedVenues.map((venue) => (
              <DockCarouselCard
                key={venue.id}
                venue={venue}
                fallbackPhoto={dishPhotoByVenueId.get(venue.id)}
                onSelect={handleCardClick}
                onRef={registerCardRef}
              />
            ))
          )}
          </div>
        )}

        {/* ── UNIFIED COVER-FLOW CAROUSEL STAGE ──
            Shares the exact bottom baseline of ROW B so there is only ever ONE
            carousel on screen: the center card grows up while side neighbors
            stay compact on the left/right edges, sizing up/down as you swipe. */}
        {cardVisible && (
          <div className="absolute inset-x-0 bottom-2 z-40 flex justify-center pointer-events-none">
            <div className="relative pointer-events-none">
              {isWeeklyPickSpot && (
                <div
                  className={`pointer-events-none absolute left-2 -top-[64px] z-30 flex items-start transition-all ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    cardOpen
                      ? "opacity-100 translate-y-0 scale-100 duration-300 delay-75"
                      : "opacity-0 translate-y-4 scale-90 duration-200 delay-0"
                  }`}
                >
                  {/* Mascot perched compactly at the top-left corner so pin clears bubble above */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/mascot/smakr-pick-pointing.svg"
                    alt="Smakr Pick pointing at the venue"
                    className="w-[80px] h-[96px] shrink-0 object-contain drop-shadow-[0_6px_12px_rgba(24,22,21,0.28)]"
                  />
                  {/* Comic speech bubble beside the mascot's mouth */}
                  <div
                    className={`relative -ml-2 mt-4 max-w-[205px] rounded-[18px] bg-[#FAF7F2] border-[1.75px] border-[#181615] px-3 py-1.5 shadow-[0_6px_16px_rgba(24,22,21,0.18)] transition-all ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      cardOpen
                        ? "opacity-100 translate-x-0 scale-100 duration-300 delay-150"
                        : "opacity-0 -translate-x-2 scale-90 duration-150 delay-0"
                    }`}
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 14 14"
                      className="absolute -left-[11px] top-1/2 -translate-y-1/2 w-[12px] h-[14px] overflow-visible"
                    >
                      <path
                        d="M13 1 L1 7 L13 13"
                        fill="#FAF7F2"
                        stroke="#181615"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                      <rect x="11" y="1" width="4" height="12" fill="#FAF7F2" />
                    </svg>
                    <p className="font-comico font-normal text-[12px] leading-snug text-[#181615] line-clamp-2">
                      {weeklyBubble}
                    </p>
                  </div>
                </div>
              )}
              <div
                ref={spotlightStageRef}
                onClick={(e) => e.stopPropagation()}
                onClickCapture={(e) => {
                  if (didDragRef.current) {
                    e.stopPropagation();
                    e.preventDefault();
                  }
                }}
                onPointerDown={handleSpotlightPointerDown}
                style={{ touchAction: "none" }}
                className="relative w-[calc(100vw-56px)] max-w-[336px] h-[246px] pointer-events-auto select-none"
              >
                {spotlightSlots.map(({ venue, slotIndex }) => {
                  const isActive = slotIndex === 0;
                  const isNeighbor = Math.abs(slotIndex) === 1;
                  return (
                    <SpotlightCard
                      key={venue.id}
                      venue={venue}
                      foodPosts={foodPosts}
                      fallbackPhoto={dishPhotoByVenueId.get(venue.id)}
                      isWeeklyPick={weeklyPick?.venue_id === venue.id}
                      isActive={isActive}
                      isNeighbor={isNeighbor}
                      cardOpen={cardOpen}
                      onDismiss={handleDismissSpotlight}
                      onOpenDetails={handleOpenFullDetails}
                      onSelectSide={() => commitSideSwitch(venue, -slotIndex)}
                      cardRef={registerSlotNodes(venue.id, isActive)}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
  );
});
