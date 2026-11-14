"use client";

import React, { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from "react";
import { MapPin } from "lucide-react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { resolveVenueDisplayBadge, resolveEntityTaxonomy, resolveDishIconKey } from "@/lib/taxonomy";
import { getVenueLiveOpenStatus } from "@/lib/openingHours";
import { formatOsloLocation, formatVenueLocationLine, normalizeOsloNeighborhoodDisplay, getDirectionsUrl } from "@/lib/location";
import { isVisibleInFeed, getPopupStatus, getPopupMeta } from "@/lib/popupUtils";
import { SmakrFoodIcon } from "@/components/food/FoodIcons";
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
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      data-parallax-img="true"
      style={{ transform: "translateX(0px) scale(1.12)" }}
      className="w-full h-full object-cover pointer-events-none will-change-transform"
      loading={eager ? "eager" : "lazy"}
      onError={() => {
        if (index + 1 < chain.length) setIndex(index + 1);
        else setExhausted(true);
      }}
    />
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
  const isPopup = venue.spot_type === "popup";
  const thumbSources = [
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
          ? "border-2 border-[#E84A27] hover:border-[#ff6a47]"
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
              <span className="bg-[#E84A27] text-white text-[10px] font-comico font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs whitespace-nowrap">
                <SmakrFoodIcon name="popup" className="w-3 h-3 shrink-0" />
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
              ✦ {signature}
            </span>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
});

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
  const isPopup = venue.spot_type === "popup";
  const popupStatus = getPopupStatus(venue);
  const popupMeta = getPopupMeta(venue);
  const isPopupInactive =
    isPopup &&
    (popupMeta?.residency_status === "between_residencies" ||
      Boolean(popupMeta?.dates_label?.toLowerCase().includes("tba")) ||
      popupStatus.status !== "active");

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
  const imageSources = [
    venue.cover_image_url,
    (venue as VenueWithDishes).dishes?.[0]?.image_url,
    fallbackPhoto,
  ];

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
        }
      }}
      style={{
        contain: "layout paint",
        transformOrigin: "50% 100%",
        pointerEvents: isActive || isNeighbor ? "auto" : "none",
      }}
      className={`absolute inset-0 overflow-hidden rounded-[26px] bg-[#121110] shadow-[0_20px_50px_rgba(0,0,0,0.45)] will-change-transform ${
        !isActive && isNeighbor ? "cursor-pointer" : ""
      } ${
        isPopup
          ? "border-2 border-[#E84A27] after:pointer-events-none after:absolute after:inset-[4px] after:rounded-[21px] after:border after:border-dashed after:border-[#E84A27]/35"
          : isWeeklyPick
          ? "border border-[#E84A27]/60 ring-1 ring-[#E84A27]/35"
          : "border border-white/15"
      }`}
    >
      {/* Full-bleed dish/venue photo */}
      <div className="absolute inset-0 overflow-hidden">
        <VenueThumb sources={imageSources} alt={venue.name || "Venue"} eager />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#121110] via-[#121110]/80 to-black/15 pointer-events-none" />

      {/* Top row: floating dish icon + badge on left; rating/status + close ml-auto on right */}
      <div
        data-slot-top="true"
        className="relative z-10 flex items-center gap-2 p-3.5 will-change-transform"
      >
        <div
          className={`flex items-center gap-1.5 min-w-0 transition-[margin] duration-300 ${
            isWeeklyPick && isActive && cardOpen ? "ml-[76px]" : ""
          }`}
        >
          <span className="w-8 h-8 rounded-full bg-[#FAF7F2]/95 border border-[#181615]/10 shadow-md flex items-center justify-center shrink-0">
            <SmakrFoodIcon name={dishIconKey} className="w-5 h-5" />
          </span>
          <span className="bg-[#E84A27] text-white font-comico text-[11px] px-2.5 py-1 rounded-full shadow-xs whitespace-nowrap flex items-center gap-1">
            {isPopup && <SmakrFoodIcon name="popup" className="w-3 h-3 shrink-0" />}
            <span>{isWeeklyPick ? `SMAKR PICK · ${badgeLabel}` : badgeLabel}</span>
          </span>
        </div>

        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          <span className="bg-black/55 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full border border-white/15 flex items-center gap-1 whitespace-nowrap">
            <span className="text-[#F5B301]">★</span>
            <span>{rating}</span>
            <span className="text-white/50">·</span>
            {isPopupInactive ? (
              <>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Next Drop TBA</span>
              </>
            ) : (
              <>
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full ${
                    live?.isOpen ? "bg-emerald-400" : "bg-red-400"
                  }`}
                />
                <span>{live?.isOpen ? "Open" : "Closed"}</span>
              </>
            )}
          </span>
          <button
            type="button"
            data-slot-close="true"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            aria-label="Close venue card"
            className="w-7 h-7 rounded-full bg-black/55 backdrop-blur-md text-white/90 hover:bg-black border border-white/15 flex items-center justify-center text-[11px] font-bold active:scale-90 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Bottom editorial stack on the dark scrim */}
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

        {/* Signature Dish Pill (replaces 2-line bio quote) */}
        <div
          data-slot-story="true"
          className="mt-2 inline-flex items-center gap-2 self-start max-w-full bg-[#FAF7F2]/15 backdrop-blur-md border border-white/20 rounded-xl px-3 py-1.5 text-xs font-bold text-[#FAF7F2]"
        >
          <SmakrFoodIcon name={dishIconKey} className="w-4 h-4 shrink-0" />
          <span className="truncate">{heroDishName}</span>
          {heroDishPrice && (
            <>
              <span className="text-white/45 shrink-0">·</span>
              <span className="text-[#FDEA6B] shrink-0">{heroDishPrice}</span>
            </>
          )}
        </div>

        <div data-slot-actions="true" className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails();
            }}
            className="flex-1 h-9 rounded-full bg-white text-[#181615] font-comico text-[11.5px] flex items-center justify-center gap-1 shadow-sm active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <span>Details</span>
            <span>↗</span>
          </button>
          {isPopupInactive && instagramUrl ? (
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="h-9 px-3.5 rounded-full bg-white/15 backdrop-blur-md text-white border border-white/20 font-comico text-[11px] flex items-center justify-center gap-1 active:scale-95 whitespace-nowrap"
            >
              <span>{instagramHandle ? `@${instagramHandle}` : "@Instagram"}</span>
              <span>↗</span>
            </a>
          ) : (
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="h-9 px-3.5 rounded-full bg-white/15 backdrop-blur-md text-white border border-white/20 font-comico text-[11px] flex items-center justify-center gap-1 active:scale-95 whitespace-nowrap"
            >
              <span>Directions</span>
              <span>↗</span>
            </a>
          )}
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

export function MapNeighborhoodDock({ isDesktop = false }: { isDesktop?: boolean }) {
  const venues = useCityPulseStore((state) => state.venues);
  const foodPosts = useCityPulseStore((state) => state.foodPosts);
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
  const selectedDishCategory = useCityPulseStore((state) => state.selectedDishCategory);
  const selectedSpotKind = useCityPulseStore((state) => state.selectedSpotKind);
  const selectedCuisine = useCityPulseStore((state) => state.selectedCuisine);
  const selectedDietary = useCityPulseStore((state) => state.selectedDietary);
  const savedOnly = useCityPulseStore((state) => state.filters.saved_only);
  const savedPostIds = useCityPulseStore((state) => state.savedPostIds);
  const openNow = useCityPulseStore((state) => state.filters.open_now);
  const weeklyPick = useCityPulseStore((state) => state.weeklyPick);

  const [activeHoodId, setActiveHoodId] = useState<string>("all");
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
      setDisplaySpotlight(selectedVenue);
      return;
    }
    // Hold the last venue mounted for the 290ms shrink-back into the carousel.
    const timer = setTimeout(() => setDisplaySpotlight(null), 300);
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
        if (!live.isOpen) return false;
      }

      if (hood && !hood.match(v)) return false;
      return true;
    });

    if (filtered.length <= 2) return filtered;

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
    return [...ordered, ...withoutCoords];
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

  // Warm the neighbourhood images so the next/previous swipe target is already
  // decoded when the gesture ends (a late decode reads as a snap mid-animation).
  useEffect(() => {
    const currentId = activeSpotlight?.id;
    if (!currentId || displayedVenues.length < 2) return;
    const index = displayedVenues.findIndex((v) => v.id === currentId);
    if (index === -1) return;
    const neighbours = [
      displayedVenues[(index - 1 + displayedVenues.length) % displayedVenues.length],
      displayedVenues[(index + 1) % displayedVenues.length],
    ];
    for (const venue of neighbours) {
      if (!venue) continue;
      const url =
        venue.cover_image_url ||
        (venue as VenueWithDishes).dishes?.[0]?.image_url ||
        dishPhotoByVenueId.get(venue.id);
      if (!url) continue;
      const img = new Image();
      img.src = url;
      img.decode?.().catch(() => {});
    }
  }, [activeSpotlight?.id, displayedVenues, dishPhotoByVenueId]);

  // Parallax & 3D Focal-Scale Carousel Physics (60fps requestAnimationFrame throttled)
  const rafRef = useRef<number | null>(null);

  // Cache layout metrics once (no per-frame getBoundingClientRect per card).
  const measureCarouselMetrics = useCallback(() => {
    const container = carouselRef.current;
    if (!container) return;
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

    const rect = container.getBoundingClientRect();
    const viewportCenter = rect.left + rect.width / 2;
    const viewportWidth = Math.max(rect.width, 320);
    const scrollLeft = container.scrollLeft;
    const contentLeft = rect.left + carouselPadLeftRef.current;

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
    (window as unknown as { __smakrMap?: { stop?: () => void } }).__smakrMap?.stop?.();
    endInstantVenueSheet();
    selectVenueById(activeSpotlight.id);
    setIsVenueDetailModalOpen(true);
  }, [activeSpotlight, selectVenueById, setIsVenueDetailModalOpen]);

  // Handle clicking a neighborhood pill: filter deck + camera animation + dismiss spotlight
  const handleSelectHood = (hood: NeighborhoodOption) => {
    setActiveHoodId(hood.id);
    if (selectedVenue) {
      setSelectedVenue(null);
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

  const getStageMetrics = useCallback(() => {
    const stageW = spotlightStageRef.current?.offsetWidth || 330;
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
        compactUnscaledH,
        compactStep,
        expandedStep,
      } = getStageMetrics();
      const slotStep = compactStep + (expandedStep - compactStep) * openProgress;
      const slots = spotlightSlotsRef.current;
      const len = displayedVenues.length;
      const maxTopClip = Math.max(0, 246 - compactUnscaledH);

      for (const slot of slots) {
        const nodes = slotNodesRef.current[slot.venue.id];
        if (!nodes) continue;

        let effectiveSlot = slot.slotIndex;
        if (len === 2 && slot.slotIndex === 1 && u < 0) effectiveSlot = -1;
        if (len === 4 && slot.slotIndex === 2 && u < 0) effectiveSlot = -2;

        const pos = effectiveSlot - u;
        const dist = Math.abs(pos);
        const focus = Math.max(0, 1 - dist) * openProgress;
        const scale = compactScale + (1 - compactScale) * focus;
        const x =
          dist <= 1
            ? pos * slotStep
            : Math.sign(pos) * (slotStep + (dist - 1) * compactStep);
        const y = effectiveSlot === 0 && dragY > 0 ? dragY * 0.75 : 0;
        const topClip = (1 - focus) * maxTopClip;
        const radius = 20 + 6 * focus;
        const dragFade =
          effectiveSlot === 0 && dragY > 0 ? Math.max(0.4, 1 - dragY / 420) : 1;
        const cardOpacity = (0.86 + 0.14 * focus) * dragFade;

        const { el, topEl, closeEl, titleEl, storyEl, actionsEl, imgEl } = nodes;
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(4)})`;
        el.style.clipPath =
          topClip > 0.5
            ? `inset(${topClip.toFixed(1)}px 0px 0px 0px round ${radius.toFixed(1)}px)`
            : "";
        el.style.opacity = cardOpacity.toFixed(3);
        el.style.zIndex = String(Math.round(10 + focus * 10));

        if (topEl) {
          topEl.style.transform = `translate3d(0, ${topClip.toFixed(1)}px, 0)`;
        }
        if (closeEl) {
          const closeAlpha = Math.max(0, (focus - 0.55) / 0.45);
          closeEl.style.opacity = closeAlpha.toFixed(3);
          closeEl.style.pointerEvents = focus > 0.65 ? "auto" : "none";
        }
        if (titleEl) {
          titleEl.style.transform = `translate3d(0, ${((1 - focus) * 84).toFixed(1)}px, 0)`;
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
          const parallax = Math.max(-1.4, Math.min(1.4, pos)) * -22;
          imgEl.style.transform = `translate3d(${parallax.toFixed(1)}px, 0, 0) scale(1.14)`;
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
      const ease = (t: number) => 1 - Math.pow(1 - t, 3.6);

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
  // compact slot on open, shrink back into it on close, and finish any live
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
        animateCarouselToVenue(selectedVenue.id, 360);
      }

      if (pendingCoverOffsetRef.current !== null) {
        const startU = pendingCoverOffsetRef.current;
        pendingCoverOffsetRef.current = null;
        applyStageFrame(startU, 1, 0);
        animateStageTo(0, 1, 360);
      } else {
        applyStageFrame(0, 0.78, 0);
        animateStageTo(0, 1, 340);
      }
      return;
    }

    if (isOpening) {
      scrollCarouselToVenue(venueId);
      applyStageFrame(0, 0, 0);
      animateStageTo(0, 1, 420);
      return;
    }

    if (isClosing) {
      scrollCarouselToVenue(venueId);
      animateStageTo(0, 0, 290, 0);
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

  return (
    <div className="relative w-full max-w-full flex flex-col gap-2 select-none pointer-events-none">
        {/* ── ROW A: Oslo Neighborhood Quick-Jump Pills (tucked away when card popped up) ── */}
        <div
          className={`w-full overflow-x-auto no-scrollbar px-3 flex items-center gap-1.5 transition-all duration-200 ${
            !isDesktop && cardVisible
              ? "opacity-0 translate-y-2 pointer-events-none"
              : "opacity-100 translate-y-0 pointer-events-auto"
          }`}
        >
          {OSLO_NEIGHBORHOODS.map((hood) => {
            const isActive = activeHoodId === hood.id;
            return (
              <button
                key={hood.id}
                type="button"
                onClick={() => handleSelectHood(hood)}
                className={`h-8 px-3.5 rounded-full font-comico text-[11px] whitespace-nowrap transition-all select-none shrink-0 cursor-pointer border ${
                  isActive
                    ? "bg-[#E84A27] text-white border-[#E84A27] shadow-md scale-105 px-4"
                    : "bg-white/45 backdrop-blur-md text-zinc-800 border-white/40 shadow-sm hover:bg-white/60"
                }`}
              >
                <span>{hood.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── ROW B: Resting Compact Carousel (hands off seamlessly to unified Cover-Flow stage) ── */}
        <div
          ref={carouselRef}
          onScroll={handleCarouselScroll}
          className={`relative w-full overflow-x-auto snap-x snap-mandatory no-scrollbar px-6 pt-3 pb-2 flex items-end gap-3 ${
            !isDesktop && cardVisible
              ? "opacity-0 pointer-events-none"
              : "opacity-100 pointer-events-auto"
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

        {/* ── UNIFIED COVER-FLOW CAROUSEL STAGE ──
            Shares the exact bottom baseline of ROW B so there is only ever ONE
            carousel on screen: the center card grows up while side neighbors
            stay compact on the left/right edges, sizing up/down as you swipe. */}
        {cardVisible && (
          <div className="absolute inset-x-0 bottom-2 z-40 flex justify-center pointer-events-none">
            <div className="relative pointer-events-none">
              {isWeeklyPickSpot && (
                <div
                  className={`pointer-events-none absolute left-2 -top-[82px] z-30 flex items-start transition-all ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    cardOpen
                      ? "opacity-100 translate-y-0 scale-100 duration-300 delay-75"
                      : "opacity-0 translate-y-4 scale-90 duration-200 delay-0"
                  }`}
                >
                  {/* Mascot perched directly into the top-left corner of the card */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/mascot/smakr-pick-pointing.svg"
                    alt="Smakr Pick pointing at the venue"
                    className="w-[96px] h-[116px] shrink-0 object-contain drop-shadow-[0_6px_12px_rgba(24,22,21,0.28)]"
                  />
                  {/* Comic speech bubble beside the mascot's mouth */}
                  <div
                    className={`relative -ml-2.5 mt-3 max-w-[215px] rounded-[18px] bg-[#FAF7F2] border-[1.75px] border-[#181615] px-3 py-1.5 shadow-[0_6px_16px_rgba(24,22,21,0.18)] transition-all ease-[cubic-bezier(0.22,1,0.36,1)] ${
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
}
