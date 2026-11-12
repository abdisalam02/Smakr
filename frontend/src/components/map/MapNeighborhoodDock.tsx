"use client";

import React, { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from "react";
import { flushSync } from "react-dom";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { resolveVenueDisplayBadge, resolveEntityTaxonomy } from "@/lib/taxonomy";
import { getVenueLiveOpenStatus } from "@/lib/openingHours";
import { formatOsloLocation, normalizeOsloNeighborhoodDisplay, getDirectionsUrl } from "@/lib/location";
import { isVisibleInFeed } from "@/lib/popupUtils";
import { beginInstantVenueSheet, endInstantVenueSheet, playVenueMorphOverlay } from "@/lib/venueMorph";
import { selectionFlightDuration, selectionPanDistance } from "@/lib/mapMotion";
import type { Venue, VenueDetail } from "@/types";

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
  const locationInfo = formatOsloLocation(venue.address, venue.city);
  const neighborhood = normalizeOsloNeighborhoodDisplay(
    venue.neighborhood || locationInfo.neighborhood
  );
  const signature = venue.signature_dishes?.[0] || mainTag;
  const flagIso = badge.flag ? FLAG_ISO_MAP[badge.flag] : null;
  const ratingText = venue.google_rating ? venue.google_rating.toFixed(1) : "4.8";
  const isPopup = venue.spot_type === "popup";
  const priceOrStatusLabel = isPopup ? "🔥 Pop-Up" : venue.price_level || "$$";
  const thumbSources = [
    venue.cover_image_url,
    (venue as VenueWithDishes).dishes?.[0]?.image_url,
    fallbackPhoto,
  ];

  return (
    <div
      ref={(el) => onRef(venue.id, el)}
      onClick={() => onSelect(venue)}
      className="relative w-[260px] h-[118px] shrink-0 snap-center rounded-2xl overflow-hidden cursor-pointer select-none bg-[#181615] shadow-lg border border-white/15 hover:border-white/35 will-change-transform"
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
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span className="bg-[#E84A27] text-white text-[10px] font-comico font-bold px-2 py-0.5 rounded-full shadow-xs whitespace-nowrap">
              {priceOrStatusLabel}
            </span>
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
            <span className="truncate">📍 {neighborhood}</span>
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
  const selectedSpotKind = useCityPulseStore((state) => state.selectedSpotKind);
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
  const spotlightTouchStartXRef = useRef<number | null>(null);
  const spotlightTouchStartYRef = useRef<number | null>(null);
  const spotlightCardElRef = useRef<HTMLDivElement | null>(null);
  const spotlightAnimRef = useRef<Animation | null>(null);
  // Ghost + in-flight entrance animation for rapid consecutive swipes.
  const swipeCleanupRef = useRef<{ ghost?: HTMLElement; anim?: Animation } | null>(
    null
  );
  const spotlightOpenRef = useRef(false);
  const skipNextRecenterRef = useRef(false);
  const carouselAnimRef = useRef<number | null>(null);

  const getSelectionDurationFor = useCallback((venue: Venue) => {
    const map = (window as unknown as {
      __smakrMap?: {
        project: (lngLat: [number, number]) => { x: number; y: number };
        getContainer: () => HTMLElement;
        getZoom: () => number;
      };
    }).__smakrMap;
    if (!map || typeof venue.longitude !== "number" || typeof venue.latitude !== "number") {
      return 640;
    }
    const mobile = typeof window !== "undefined" && window.innerWidth < 1024;
    const currentZoom = map.getZoom();
    const targetZoom = Math.max(currentZoom, 15.4);
    const pan = selectionPanDistance(
      map,
      venue.longitude,
      venue.latitude,
      mobile
    );
    return selectionFlightDuration(pan, Math.max(0, targetZoom - currentZoom));
  }, []);

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
      if (swipeCleanupRef.current) {
        swipeCleanupRef.current.anim?.cancel();
        swipeCleanupRef.current.ghost?.remove();
        swipeCleanupRef.current = null;
      }
    };
  }, []);

  const scrollCarouselToVenue = useCallback(
    (venueId: string, behavior: ScrollBehavior = "smooth") => {
      const card = cardRefs.current[venueId];
      const carousel = carouselRef.current;
      if (!card || !carousel) return false;
      const cr = card.getBoundingClientRect();
      const pr = carousel.getBoundingClientRect();
      const target =
        carousel.scrollLeft + cr.left + cr.width / 2 - (pr.left + pr.width / 2);
      carousel.scrollTo({ left: target, behavior });
      return true;
    },
    []
  );

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

  // Matched-geometry morph: the focused card grows out of the EXACT carousel
  // card rect (same position + size) instead of flying in as a separate card.
  useLayoutEffect(() => {
    const el = spotlightCardElRef.current;
    const venueId = selectedVenue?.id ?? activeSpotlight?.id ?? null;
    if (!el || !venueId) return;

    const wasOpen = spotlightOpenRef.current;
    const isOpening = Boolean(selectedVenue) && !wasOpen;
    const isClosing = !selectedVenue && wasOpen;
    const changingWhileOpen = Boolean(selectedVenue) && wasOpen;
    spotlightOpenRef.current = Boolean(selectedVenue);

    if (changingWhileOpen && selectedVenue) {
      // Move the actual carousel under the spotlight in sync with the card.
      if (skipNextRecenterRef.current) {
        skipNextRecenterRef.current = false;
      } else {
        animateCarouselToVenue(selectedVenue.id, 520);
      }
      return;
    }

    if (!isOpening && !isClosing) return;

    if (isOpening) {
      // Instant recenter so the morph starts over the tapped slot.
      scrollCarouselToVenue(venueId, "auto");
    } else if (isClosing) {
      // Keep the carousel on the active card when the spotlight hands back.
      scrollCarouselToVenue(venueId, "auto");
    }

    const source = cardRefs.current[venueId];
    const to = el.getBoundingClientRect();
    const fromRect = source?.getBoundingClientRect();
    if (!to.width || !to.height) return;

    const sx = fromRect ? fromRect.width / to.width : 0.94;
    const sy = fromRect ? fromRect.height / to.height : 0.94;
    const tx = fromRect
      ? fromRect.left + fromRect.width / 2 - (to.left + to.width / 2)
      : 0;
    const ty = fromRect
      ? fromRect.top + fromRect.height / 2 - (to.top + to.height / 2)
      : 120;

    const collapsed = {
      transform: `translate3d(${tx}px, ${ty}px, 0) scale(${sx}, ${sy})`,
      opacity: fromRect ? 0.85 : 0,
      borderRadius: "16px",
    };
    const expanded = {
      transform: "translate3d(0, 0, 0) scale(1, 1)",
      opacity: 1,
      borderRadius: "26px",
    };

    spotlightAnimRef.current?.cancel();

    if (isOpening) {
      spotlightAnimRef.current = el.animate([collapsed, expanded], {
        duration: 520,
        easing: "cubic-bezier(0.22,1,0.36,1)",
        fill: "both",
      });
      return;
    }

    // Closing: visibly size back down into the carousel slot and dissolve into
    // the real card. The mid keyframe keeps the motion continuous (no blink),
    // and the uniform scale keeps the text from squashing.
    const closeScale = fromRect ? Math.min(1, fromRect.width / to.width) : 0.72;
    const closeTx = fromRect
      ? fromRect.left + fromRect.width / 2 - (to.left + to.width / 2)
      : 0;
    const closeTy = fromRect
      ? fromRect.bottom - (to.top + to.height / 2 + (to.height * closeScale) / 2)
      : 90;
    const shrunken = {
      transform: `translate3d(${closeTx}px, ${closeTy}px, 0) scale(${closeScale}, ${closeScale})`,
      borderRadius: "16px",
    };
    const midScale = 1 - (1 - closeScale) * 0.55;

    spotlightAnimRef.current = el.animate(
      [
        {
          transform: "translate3d(0, 0, 0) scale(1, 1)",
          opacity: 1,
          borderRadius: "26px",
          offset: 0,
        },
        {
          transform: `translate3d(${closeTx * 0.55}px, ${closeTy * 0.55}px, 0) scale(${midScale}, ${midScale})`,
          opacity: 0.98,
          borderRadius: "22px",
          offset: 0.55,
        },
        { ...shrunken, opacity: 0, offset: 1 },
      ],
      {
        duration: 440,
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        fill: "both",
      }
    );
  }, [selectedVenue?.id]);

  useEffect(() => {
    if (selectedVenue) {
      setDisplaySpotlight(selectedVenue);
      return;
    }
    // Hold the last venue mounted for the full morph-back animation.
    const timer = setTimeout(() => setDisplaySpotlight(null), 470);
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

  // Filter venues by category filter AND active neighborhood
  const displayedVenues = useMemo(() => {
    const hood = OSLO_NEIGHBORHOODS.find((h) => h.id === activeHoodId);
    return venues.filter((v) => {
      if (!isVisibleInFeed(v)) return false;

      // Category / spot kind filter check
      if (selectedSpotKind === "popup" && v.spot_type !== "popup") return false;
      if (selectedGroup) {
        const tax = resolveEntityTaxonomy(v);
        if (tax.group.id !== selectedGroup) return false;
      }
      if (openNow) {
        const live = getVenueLiveOpenStatus(v);
        if (!live.isOpen) return false;
      }

      if (hood && !hood.match(v)) return false;
      return true;
    });
  }, [venues, activeHoodId, selectedSpotKind, selectedGroup, openNow]);

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

  // "Details" expands the spotlight card into the venue sheet. The card photo
  // and the sheet hero share a view-transition-name, so the browser morphs one
  // into the other; the sheet is opened in place (no slide) for the morph.
  const handleOpenFullDetails = useCallback(() => {
    if (!activeSpotlight) return;
    const cardEl = spotlightCardElRef.current;
    const img = cardEl?.querySelector("img");
    const rect = cardEl?.getBoundingClientRect();
    const imageUrl = img?.getAttribute("src") ?? null;
    const sourceRect = rect
      ? { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
      : null;

    // Settle any residual camera motion, then open the sheet in place.
    (window as unknown as { __smakrMap?: { stop?: () => void } }).__smakrMap?.stop?.();
    beginInstantVenueSheet(imageUrl, sourceRect);
    selectVenueById(activeSpotlight.id);
    setIsVenueDetailModalOpen(true);

    // After the sheet mounts, fly the cached card photo into the hero.
    if (imageUrl && sourceRect) {
      window.setTimeout(() => playVenueMorphOverlay(sourceRect, imageUrl), 30);
    } else {
      window.setTimeout(() => endInstantVenueSheet(), 30);
    }
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

  const spotlightLocationInfo = activeSpotlight
    ? formatOsloLocation(activeSpotlight.address, activeSpotlight.city)
    : null;
  const spotlightNeighborhood = activeSpotlight
    ? normalizeOsloNeighborhoodDisplay(activeSpotlight.neighborhood || spotlightLocationInfo?.neighborhood)
    : "Oslo";
  // "Norway, Oslo, Vulkan, NO" → "Vulkan": drop country / city / postal tokens.
  const spotlightAddress =
    (activeSpotlight?.address || "")
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .filter(
        (part) =>
          !/^(norway|norge|no|oslo|\d{4})$/i.test(part) &&
          !/^\d{4}\s/i.test(part)
      )[0] || spotlightNeighborhood;
  const spotlightStory =
    activeSpotlight?.description ||
    (activeSpotlight?.vibe_signals as any)?.editorial_story ||
    (activeSpotlight?.vibe_signals as any)?.vibe_description ||
    "Standout Oslo culinary spot preparing authentic specialties daily.";
  const matchingFoodPost = activeSpotlight
    ? foodPosts.find((p) => p.spot_id === activeSpotlight.id && p.dish_name && !p.is_archived)
    : null;
  const spotlightPrice = matchingFoodPost?.price_nok
    ? `${matchingFoodPost.price_nok} KR`
    : activeSpotlight?.spot_type === "popup"
    ? "POP-UP"
    : activeSpotlight?.price_level || "$$";
  const spotlightDirectionsUrl = activeSpotlight ? getDirectionsUrl(activeSpotlight) : "#";
  const spotlightBadge = activeSpotlight ? resolveVenueDisplayBadge(activeSpotlight) : null;
  const spotlightMainTag = (spotlightBadge?.mainTag || "FOOD")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
  const spotlightLive = activeSpotlight ? getVenueLiveOpenStatus(activeSpotlight) : null;
  const spotlightRating =
    activeSpotlight?.google_rating != null
      ? activeSpotlight.google_rating.toFixed(1)
      : "4.7";
  const spotlightImageSources = activeSpotlight
    ? [
        activeSpotlight.cover_image_url,
        (activeSpotlight as VenueWithDishes).dishes?.[0]?.image_url,
        dishPhotoByVenueId.get(activeSpotlight.id),
      ]
    : [];

  return (
    <div className="relative w-full max-w-full flex flex-col gap-2 select-none pointer-events-none">
        {/* ── ROW A: Oslo Neighborhood Quick-Jump Pills (Warm-Oat Frosted Glass) ── */}
        <div className="w-full overflow-x-auto no-scrollbar pointer-events-auto px-3 flex items-center gap-1.5 transition-all duration-300">

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

        {/* ── ROW B: Feed-Matched Full-Bleed Editorial Spot Cards + Parallax Physics ── */}
        <div
          ref={carouselRef}
          onScroll={handleCarouselScroll}
          className="relative w-full overflow-x-auto snap-x snap-mandatory no-scrollbar pointer-events-auto px-6 pt-3 pb-1.5 flex items-end gap-3"
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
                concealed={!isDesktop && cardOpen && activeSpotlight?.id === venue.id}
              />
            ))
          )}
        </div>

        {/* ── FOCUSED CARD OVERLAY ──
            Anchored at the carousel card row (bottom) and grown upward, so it
            reads as an extension of the tapped card rather than a side panel. */}
        {cardVisible && (
          <div className="absolute inset-x-0 bottom-5 z-40 flex justify-center pointer-events-none pb-[env(safe-area-inset-bottom,0px)]">
            <div className="relative pointer-events-none">
              {isWeeklyPickSpot && (
                <div
                  className={`pointer-events-none absolute left-0 -top-[138px] z-20 flex flex-col items-start transition-all duration-200 ease-out ${
                    cardOpen
                      ? "opacity-100 translate-y-0 scale-100"
                      : "opacity-0 -translate-y-2 scale-95"
                  }`}
                >
                  <div className="relative ml-3 mb-1 max-w-[230px] rounded-2xl rounded-bl-md bg-[#FAF7F2]/95 backdrop-blur-md border border-[#E6DFD3] px-3 py-2 shadow-lg">
                    <p className="text-[11px] font-semibold leading-snug text-[#181615] line-clamp-2">
                      &ldquo;{weeklyBubble}&rdquo;
                    </p>
                    <span
                      aria-hidden="true"
                      className="absolute -bottom-1 left-6 h-2.5 w-2.5 rotate-45 bg-[#FAF7F2] border-r border-b border-[#E6DFD3]"
                    />
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/mascot/smakr-pick-pointing.svg"
                    alt="Smakr Pick pointing at the venue"
                    className="w-[92px] h-[112px] object-contain drop-shadow-[0_4px_8px_rgba(24,22,21,0.2)]"
                  />
                </div>
              )}
              <div
                ref={spotlightCardElRef}
                data-spotlight-card="true"
                data-state={cardOpen ? "open" : "closing"}
                onClick={(e) => e.stopPropagation()}
                onTouchStart={(e) => {
                  spotlightTouchStartXRef.current = e.touches[0]?.clientX ?? null;
                  spotlightTouchStartYRef.current = e.touches[0]?.clientY ?? null;
                }}
                onTouchEnd={(e) => {
                  const startX = spotlightTouchStartXRef.current;
                  const startY = spotlightTouchStartYRef.current;
                  spotlightTouchStartXRef.current = null;
                  spotlightTouchStartYRef.current = null;
                  if (startX == null) return;
                  const dx = (e.changedTouches[0]?.clientX ?? startX) - startX;
                  const dy =
                    startY != null
                      ? (e.changedTouches[0]?.clientY ?? startY) - startY
                      : 0;

                  // Swipe down closes the card.
                  if (Math.abs(dy) > Math.abs(dx) && dy > 60) {
                    handleDismissSpotlight();
                    return;
                  }

                  // Swipe left/right moves through the carousel and focuses that
                  // venue (the camera + icon follow via handleCardClick).
                  if (Math.abs(dx) <= 55 || !activeSpotlight) return;
                  const list = displayedVenues;
                  const index = list.findIndex((v) => v.id === activeSpotlight.id);
                  if (index === -1 || list.length < 2) return;
                  const step = dx < 0 ? 1 : -1;
                  const next = list[(index + step + list.length) % list.length];
                  if (!next || next.id === activeSpotlight.id) return;

                  // Simultaneous choreography (t = 0): a ghost of the outgoing
                  // card flies off while the real card swaps content and rises
                  // out of the deck plane. The surface never fades to nothing,
                  // so the deck/map can't show through mid-swipe.
                  const dir = dx < 0 ? -1 : 1;
                  const card = spotlightCardElRef.current;
                  const parent = card?.parentElement;
                  if (!card || !parent) {
                    handleCardClick(next);
                    return;
                  }

                  // Clean up any in-flight swipe so rapid gestures don't stack.
                  if (swipeCleanupRef.current) {
                    swipeCleanupRef.current.anim?.cancel();
                    swipeCleanupRef.current.ghost?.remove();
                    swipeCleanupRef.current = null;
                  }
                  card.style.transformOrigin = "";

                  const flight = getSelectionDurationFor(next);
                  const inMs = Math.min(
                    620,
                    Math.max(480, Math.round(flight * 0.78))
                  );

                  // 1. Ghost = outgoing card cloned at the exact coordinates,
                  //    captured before the state swap replaces its content.
                  const ghost = card.cloneNode(true) as HTMLElement;
                  ghost.removeAttribute("id");
                  ghost.removeAttribute("data-spotlight-card");
                  Object.assign(ghost.style, {
                    position: "absolute",
                    left: `${card.offsetLeft}px`,
                    top: `${card.offsetTop}px`,
                    width: `${card.offsetWidth}px`,
                    height: `${card.offsetHeight}px`,
                    margin: "0",
                    pointerEvents: "none",
                    zIndex: "39",
                    transformOrigin: "50% 50%",
                  });
                  parent.appendChild(ghost);

                  const ghostAnim = ghost.animate(
                    [
                      { transform: "translate3d(0, 0, 0) scale(1)", opacity: 1 },
                      {
                        transform: `translate3d(${dir * 84}px, 8px, 0) scale(0.90)`,
                        opacity: 0,
                      },
                    ],
                    {
                      duration: 240,
                      easing: "cubic-bezier(0.32, 0, 0.67, 0)",
                      fill: "forwards",
                    }
                  );
                  ghostAnim.onfinish = () => ghost.remove();

                  // 2. Deck scroll + state swap (which starts the camera flight)
                  //    begin on the same frame as the ghost exit.
                  if (animateCarouselToVenue(next.id, inMs)) {
                    skipNextRecenterRef.current = true;
                  }
                  flushSync(() => handleCardClick(next));

                  // 3. The incoming card rises and expands from the deck plane.
                  const nextCard = spotlightCardElRef.current;
                  if (nextCard) {
                    nextCard.style.transformOrigin = "50% 88%";
                    nextCard.style.zIndex = "40";

                    const incoming = nextCard.animate(
                      [
                        {
                          transform: `translate3d(${-dir * 52}px, 38px, 0) scale(0.76)`,
                          opacity: 0,
                          offset: 0,
                        },
                        {
                          transform: `translate3d(${-dir * 26}px, 16px, 0) scale(0.87)`,
                          opacity: 1,
                          offset: 0.2,
                        },
                        {
                          transform: "translate3d(0, 0, 0) scale(1)",
                          opacity: 1,
                          offset: 1,
                        },
                      ],
                      {
                        duration: inMs,
                        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
                        fill: "both",
                      }
                    );

                    swipeCleanupRef.current = { ghost, anim: incoming };

                    incoming.onfinish = () => {
                      incoming.cancel();
                      nextCard.style.transformOrigin = "";
                      if (swipeCleanupRef.current?.anim === incoming) {
                        swipeCleanupRef.current = null;
                      }
                    };
                  }
                }}
                style={{ contain: "layout paint" }}
                className={`pointer-events-auto relative w-[calc(100vw-28px)] max-w-[356px] h-[255px] overflow-hidden rounded-[26px] bg-[#121110] shadow-[0_20px_50px_rgba(0,0,0,0.45)] border will-change-transform ${
                  isWeeklyPickSpot
                    ? "border-[#E84A27]/60 ring-1 ring-[#E84A27]/35"
                    : "border-white/15"
                }`}
              >
              <div
                key={activeSpotlight?.id ?? "spotlight"}
                className="absolute inset-0"
              >
              {/* Full-bleed dish/venue photo */}
              <div className="absolute inset-0">
                <VenueThumb
                  sources={spotlightImageSources}
                  alt={activeSpotlight?.name || "Venue"}
                  eager
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#121110] via-[#121110]/80 to-black/15 pointer-events-none" />

              {/* Top row: price/cuisine + rating/open + close */}
              <div className="relative z-10 flex items-center justify-between gap-2 p-3.5">
                <span className="bg-[#E84A27] text-white font-comico text-[11px] px-2.5 py-1 rounded-full shadow-xs whitespace-nowrap">
                  {spotlightPrice}
                </span>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="bg-black/50 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full border border-white/15 flex items-center gap-1 whitespace-nowrap">
                    <span className="text-[#F5B301]">★</span>
                    <span>{spotlightRating}</span>
                    <span className="text-white/50">·</span>
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full ${
                        spotlightLive?.isOpen ? "bg-emerald-400" : "bg-red-400"
                      }`}
                    />
                    <span>{spotlightLive?.isOpen ? "Open" : "Closed"}</span>
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDismissSpotlight();
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
                <h4 className="font-comico font-normal text-[21px] leading-tight text-white drop-shadow-xs truncate">
                  {activeSpotlight?.name}
                </h4>
                <p className="text-white/75 text-[11.5px] truncate">
                  📍 {spotlightAddress} · {spotlightNeighborhood}
                </p>
                <p className="text-white/85 text-[11.5px] italic line-clamp-2 mt-1.5 leading-snug">
                  &ldquo;{spotlightStory}&rdquo;
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenFullDetails();
                    }}
                    className="flex-1 h-9 rounded-full bg-white text-[#181615] font-comico text-[11.5px] flex items-center justify-center gap-1 shadow-sm active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    <span>Details</span>
                    <span>↗</span>
                  </button>
                  <a
                    href={spotlightDirectionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="h-9 px-3.5 rounded-full bg-white/15 backdrop-blur-md text-white border border-white/20 font-comico text-[11px] flex items-center justify-center gap-1 active:scale-95 whitespace-nowrap"
                  >
                    <span>Directions</span>
                    <span>↗</span>
                  </a>
                </div>
              </div>
              </div>
            </div>
            </div>
          </div>
        )}
      </div>
  );
}
