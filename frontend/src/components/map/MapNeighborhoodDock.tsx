"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { resolveVenueDisplayBadge, resolveEntityTaxonomy } from "@/lib/taxonomy";
import { getVenueLiveOpenStatus } from "@/lib/openingHours";
import { formatOsloLocation } from "@/lib/location";
import { isVisibleInFeed } from "@/lib/popupUtils";
import type { Venue } from "@/types";

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

export function MapNeighborhoodDock() {
  const venues = useCityPulseStore((state) => state.venues);
  const selectedVenue = useCityPulseStore((state) => state.selectedVenue);
  const setSelectedVenue = useCityPulseStore((state) => state.setSelectedVenue);
  const selectVenueById = useCityPulseStore((state) => state.selectVenueById);
  const setIsVenueDetailModalOpen = useCityPulseStore(
    (state) => state.setIsVenueDetailModalOpen
  );
  const selectedGroup = useCityPulseStore((state) => state.selectedGroup);
  const selectedSpotKind = useCityPulseStore((state) => state.selectedSpotKind);
  const openNow = useCityPulseStore((state) => state.filters.open_now);

  const [activeHoodId, setActiveHoodId] = useState<string>("all");
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const carouselRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScroll = useRef(false);

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

  // Two-Way Sync A: When map pin is selected, scroll the bottom deck to that card
  useEffect(() => {
    if (!selectedVenue) return;
    const el = cardRefs.current[selectedVenue.id];
    if (el && carouselRef.current) {
      isProgrammaticScroll.current = true;
      el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 500);
    }
  }, [selectedVenue?.id]);

  // Handle clicking a neighborhood pill: filter deck + camera animation
  const handleSelectHood = (hood: NeighborhoodOption) => {
    setActiveHoodId(hood.id);
    const map = (typeof window !== "undefined" && (window as any).__smakrMap) || null;
    if (map) {
      map.flyTo({
        center: hood.coords,
        zoom: hood.id === "all" ? 13.5 : 14.4,
        duration: 850,
        essential: true,
      });
    }
  };

  // Handle snapping / swiping to a card in Row B: ease map to venue
  const handleCardVisible = useCallback((venue: Venue) => {
    if (isProgrammaticScroll.current) return;
    const map = (typeof window !== "undefined" && (window as any).__smakrMap) || null;
    if (map) {
      map.easeTo({
        center: [venue.longitude, venue.latitude],
        zoom: 15.2,
        duration: 450,
      });
    }
    setSelectedVenue(venue as any);
  }, [setSelectedVenue]);

  // Handle clicking a mini card: select & open VenueBottomSheet
  const handleCardClick = (venue: Venue) => {
    selectVenueById(venue.id);
    setIsVenueDetailModalOpen(true);
    const map = (typeof window !== "undefined" && (window as any).__smakrMap) || null;
    if (map) {
      map.easeTo({
        center: [venue.longitude, venue.latitude],
        zoom: 15.4,
        duration: 400,
      });
    }
  };

  return (
    <div className="w-full max-w-full flex flex-col gap-1.5 select-none pointer-events-none">
      {/* ── ROW A: Oslo Neighborhood Quick-Jump Pills (h-8) ── */}
      <div className="w-full overflow-x-auto no-scrollbar pointer-events-auto px-3 flex items-center gap-1.5">
        {OSLO_NEIGHBORHOODS.map((hood) => {
          const isActive = activeHoodId === hood.id;
          return (
            <button
              key={hood.id}
              type="button"
              onClick={() => handleSelectHood(hood)}
              className={`h-7.5 px-3 rounded-full text-[11px] whitespace-nowrap transition-all select-none shrink-0 cursor-pointer border ${
                isActive
                  ? "bg-[#181615] text-white dark:bg-white dark:text-[#181615] font-bold border-transparent shadow-xs scale-102"
                  : "bg-[#FAF7F2]/90 dark:bg-[#181615]/90 backdrop-blur-md text-zinc-700 dark:text-zinc-200 font-medium border-[#181615]/10 dark:border-white/10 hover:bg-white dark:hover:bg-[#201D1A]"
              }`}
            >
              <span>{hood.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── ROW B: Ultra-Compact Horizontal Spot Card Deck (h-[86px]) ── */}
      <div
        ref={carouselRef}
        className="w-full overflow-x-auto snap-x snap-mandatory no-scrollbar pointer-events-auto px-3 flex items-center gap-2.5 pb-1"
      >
        {displayedVenues.length === 0 ? (
          <div className="w-full py-4 text-center text-xs text-zinc-500 bg-[#FAF7F2]/90 dark:bg-[#181615]/90 rounded-2xl border border-black/5">
            No spots match this neighborhood and filter.
          </div>
        ) : (
          displayedVenues.map((venue) => {
            const isSelected = selectedVenue?.id === venue.id;
            const badge = resolveVenueDisplayBadge(venue);
            const live = getVenueLiveOpenStatus(venue);
            const locationInfo = formatOsloLocation(venue.address, venue.city);
            const neighborhood = venue.neighborhood || locationInfo.neighborhood || "Oslo";
            const signature =
              venue.signature_dishes?.[0] ||
              venue.food_category ||
              badge.mainTag ||
              "Specialty";
            const flagIso = badge.flag ? FLAG_ISO_MAP[badge.flag] : null;
            const ratingText = venue.google_rating
              ? venue.google_rating.toFixed(1)
              : "4.8";

            const coverImg =
              venue.cover_image_url ||
              "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80";

            return (
              <div
                key={venue.id}
                ref={(el) => {
                  cardRefs.current[venue.id] = el;
                }}
                onClick={() => handleCardClick(venue)}
                className={`w-[268px] h-[86px] shrink-0 snap-center flex items-center gap-2.5 p-2 rounded-2xl bg-[#FAF7F2]/95 dark:bg-[#181615]/95 backdrop-blur-md border transition-all duration-200 cursor-pointer select-none shadow-md ${
                  isSelected
                    ? "ring-2 ring-[#e84a27] border-[#e84a27] bg-white dark:bg-[#201D1A] shadow-lg scale-[1.02]"
                    : "border-[#EAE5DC] dark:border-white/10 hover:border-[#e84a27]/40 hover:bg-white dark:hover:bg-[#201D1A]"
                }`}
              >
                {/* Left: 68x68 rounded-xl food/spot thumbnail with open dot */}
                <div className="relative w-[68px] h-[68px] rounded-xl overflow-hidden bg-stone-200 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverImg}
                    alt={venue.name}
                    className="w-full h-full object-cover pointer-events-none"
                    loading="lazy"
                  />
                  {/* Status dot */}
                  <div
                    title={live.isOpen ? "Open Now" : "Closed"}
                    className={`absolute top-1 left-1 w-2 h-2 rounded-full border border-white shadow-xs ${
                      live.isOpen
                        ? "bg-emerald-500 shadow-[0_0_6px_#10B981]"
                        : "bg-zinc-400"
                    }`}
                  />
                </div>

                {/* Right: Info lines */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 h-full">
                  {/* Top micro-line: Flag + Main Tag · Price + Rating */}
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold gap-1">
                    <div className="flex items-center gap-1 truncate">
                      {flagIso ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={`https://flagcdn.com/16x12/${flagIso}.png`}
                          width={16}
                          height={12}
                          alt={badge.mainTag}
                          className="inline-block rounded-xs object-cover shrink-0 shadow-2xs"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-[10px] shrink-0">{badge.flag || "✦"}</span>
                      )}
                      <span className="uppercase tracking-wide truncate">
                        {badge.mainTag} · {venue.price_level || "$$"}
                      </span>
                    </div>
                    <span className="text-amber-500 dark:text-amber-400 font-bold shrink-0">
                      ★ {ratingText}
                    </span>
                  </div>

                  {/* Middle line: Bold font-comico spot name */}
                  <h4 className="font-comico font-black text-[14px] text-[#181615] dark:text-white uppercase leading-tight truncate">
                    {venue.name}
                  </h4>

                  {/* Bottom line: Neighborhood + Signature dish */}
                  <div className="text-[10.5px] text-zinc-600 dark:text-zinc-400 truncate">
                    <span>📍 {neighborhood}</span>
                    <span className="mx-1 text-zinc-300 dark:text-zinc-600">·</span>
                    <span className="text-[#e84a27] font-semibold">✦ {signature}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
