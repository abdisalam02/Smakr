"use client";

import React, { useState } from "react";
import Image from "next/image";
import { MapPin, Star, ChevronRight, Pencil, Clock, Compass } from "lucide-react";
import { Venue } from "@/types";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { formatDistance } from "@/lib/math";
import { FOOD_CATEGORIES } from "@/lib/foodSeeds";
import { getPopupStatus } from "@/lib/popupUtils";
import { getVenueLiveOpenStatus } from "@/lib/openingHours";
import { formatOsloLocation } from "@/lib/location";
import { FEED_BLUR_DARK } from "@/lib/feedImages";
import { SmakrFoodIcon, SMAKR_ICON_SVG_BODIES, resolveCustomIconKey } from "@/components/food/FoodIcons";
import { resolveEntityTaxonomy } from "@/lib/taxonomy";

interface FoodSpotCardProps {
  venue: Venue;
  /** True only for the first above-the-fold card so its photo is preloaded. */
  priority?: boolean;
  index?: number;
  primaryDishPhoto?: string | null;
  topDishName?: string | null;
}



export const FoodSpotCard = React.memo(function FoodSpotCard({
  venue,
  priority = false,
  index,
  primaryDishPhoto,
  topDishName,
}: FoodSpotCardProps) {
  const flyToSpot = useCityPulseStore((state) => state.flyToSpot);
  const selectVenueById = useCityPulseStore((state) => state.selectVenueById);
  const setQuickEditPost = useCityPulseStore((state) => state.setQuickEditPost);

  // Primitive boolean selector so only this card re-renders when its selection status flips
  const isSelected = useCityPulseStore(
    React.useCallback((s) => s.selectedVenue?.id === venue.id, [venue.id])
  );
  // Primitive boolean selector for admin/official status
  const isViewerAdmin = useCityPulseStore(
    React.useCallback((s) => Boolean(s.currentUser && (s.currentUser.role === "admin" || s.currentUser.is_official)), [])
  );

  const popupStatus = getPopupStatus(venue);
  const liveOpenStatus = getVenueLiveOpenStatus(venue);
  const locationInfo = formatOsloLocation(venue.address, venue.city);

  const handleAdminEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    const storeState = useCityPulseStore.getState();
    const existingPost = storeState.foodPosts.find((p) => p.spot_id === venue.id);
    const currentUser = storeState.currentUser;
    if (existingPost) {
      setQuickEditPost(existingPost);
    } else {
      setQuickEditPost({
        id: `synthetic-${venue.id}`,
        spot_id: venue.id,
        spot_name: venue.name,
        spot_address: venue.address || "",
        spot_neighborhood: venue.city || "Oslo",
        spot_coords: [venue.longitude, venue.latitude],
        dish_name: venue.signature_dishes?.[0] || venue.name,
        category: (venue.food_category as any) || "all",
        image_url: venue.cover_image_url || "",
        price_nok: null,
        rating: venue.google_rating ? Math.round(venue.google_rating) : 5,
        taste_tags: [],
        review_text: venue.curated_reviews?.[0]?.text || "",
        author: {
          name: currentUser?.name || "Admin",
          handle: currentUser?.handle || "@admin",
          avatar_url: currentUser?.avatar_url || "",
        },
        likes_count: 0,
        saves_count: 0,
        created_at_relative: "Just now",
        is_official_pick: false,
        is_published: true,
        is_archived: false,
      });
    }
  };

  const signature = venue.signature_dishes && venue.signature_dishes.length > 0 ? venue.signature_dishes[0] : null;
  const taxonomy = resolveEntityTaxonomy(venue);
  const hasGoogleRating = typeof venue.google_rating === "number" && venue.google_rating > 0;

  const handleClick = () => {
    selectVenueById(venue.id);
  };

  const handleSpotOnMap = (e: React.MouseEvent) => {
    e.stopPropagation();
    flyToSpot([venue.longitude, venue.latitude], venue.id);
  };

  const spotCoverUrl = primaryDishPhoto !== undefined ? primaryDishPhoto : venue.cover_image_url;
  const [thumbReady, setThumbReady] = useState(false);

  return (
    <div
      onClick={handleClick}
      className={`group relative flex items-center gap-3 sm:gap-3.5 p-3 sm:p-3.5 rounded-2xl sm:rounded-3xl bg-[#EFE8DC] hover:bg-[#EAE1D3] dark:bg-[#1C1917] dark:hover:bg-[#231F1C] border border-[#181615]/12 dark:border-white/10 shadow-sm hover:shadow-md transition-[background-color,box-shadow,transform] duration-200 cursor-pointer active:scale-[0.985] select-none overflow-hidden min-h-[126px] sm:min-h-[136px] ${
        isSelected ? "ring-2 ring-[#E84A27]" : ""
      } ${popupStatus.isDimmedCard ? "opacity-50 grayscale-[20%]" : ""}`}
    >
      {/* Repeating SMAKR Monogram Watermark Pattern */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.03] dark:opacity-[0.05] select-none text-zinc-950 dark:text-white z-0"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id={`smakr-spot-pattern-${venue.id}`}
            width="88"
            height="44"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-14)"
          >
            <text
              x="0"
              y="16"
              fontFamily="var(--font-comico), sans-serif"
              fontWeight="900"
              fontSize="9"
              letterSpacing="0.18em"
              fill="currentColor"
            >
              SMAKR ·
            </text>
            <text
              x="44"
              y="38"
              fontFamily="var(--font-comico), sans-serif"
              fontWeight="900"
              fontSize="9"
              letterSpacing="0.18em"
              fill="currentColor"
            >
              SMAKR ·
            </text>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#smakr-spot-pattern-${venue.id})`} />
      </svg>

      {/* Left Column — 1:1 Square Thumbnail (114x114px on mobile, 128x128px on tablet/desktop) */}
      <div className="relative z-10 w-[114px] h-[114px] min-w-[114px] min-h-[114px] sm:w-[128px] sm:h-[128px] sm:min-w-[128px] sm:min-h-[128px] rounded-2xl overflow-hidden shrink-0 bg-[#EAE6DF] shadow-sm ring-1 ring-black/10">
        {spotCoverUrl ? (
          <Image
            src={spotCoverUrl}
            alt={venue.name}
            fill
            priority={priority || (typeof index === "number" && index < 4)}
            loading={priority || (typeof index === "number" && index < 4) ? undefined : "lazy"}
            decoding="async"
            onLoad={() => setThumbReady(true)}
            placeholder="blur"
            blurDataURL={FEED_BLUR_DARK}
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 114px, 128px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-4">
            {(() => {
              const customKey = resolveCustomIconKey(venue.icon) || resolveCustomIconKey(venue.food_category);
              if (customKey) {
                return <SmakrFoodIcon name={customKey} className="w-16 h-16 object-contain" />;
              }
              return <SmakrFoodIcon name={taxonomy.spotKind} className="w-16 h-16 object-contain" />;
            })()}
          </div>
        )}
        {spotCoverUrl && (<div aria-hidden="true" className={`smakr-shimmer-light absolute inset-0 pointer-events-none transition-opacity duration-500 ${thumbReady ? "opacity-0" : "opacity-100"}`} />)}

        {/* Soft bleed gradient overlay on image edge */}
        <div className="absolute inset-y-0 right-0 w-6 bg-gradient-to-r from-transparent to-black/20 pointer-events-none z-[2]" />

        {/* Google Rating Badge bottom-left */}
        {hasGoogleRating && (
          <div className="absolute bottom-2 left-2 z-[3] flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/80 text-white text-[10px] font-bold shadow-xs">
            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
            <span className="font-sans font-bold tracking-tight text-white">{venue.google_rating!.toFixed(1)}</span>
          </div>
        )}

        {/* Floating Admin Edit Button top-left of photo */}
        {isViewerAdmin && (
          <button
            type="button"
            onClick={handleAdminEdit}
            className="absolute top-2 left-2 w-7 h-7 rounded-full bg-[#181615]/80 text-white flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-all cursor-pointer z-10"
            title="Admin Edit Spot"
          >
            <Pencil className="w-3.5 h-3.5 text-white" />
          </button>
        )}
      </div>

      {/* Right Column — 4 Clean Lines (h-[114px] sm:h-[128px]) */}
      <div className="relative z-10 flex-1 min-w-0 flex flex-col justify-between py-0.5 h-[114px] sm:h-[128px]">
        {/* Line 1: Category Icon/Name + Refined Status Pill */}
        <div className="flex items-center justify-between gap-1.5 min-w-0">
          <span className="text-[11px] font-semibold text-[#e84a27] uppercase tracking-wider flex items-center gap-1 font-comico truncate">
            <SmakrFoodIcon
              name={resolveCustomIconKey(venue.icon) || resolveCustomIconKey(venue.food_category) || taxonomy.spotKind}
              className="w-3.5 h-3.5 shrink-0"
            />
            <span className="truncate">{taxonomy.spotLabel}</span>
          </span>

          <div className="flex items-center gap-1 shrink-0">
            {venue.spot_type === "popup" && (
              <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-[#e84a27] text-white font-comico shrink-0 tracking-wide">
                Pop-up
              </span>
            )}

            {/* Refined Status Pill (Oslo Matcha / Slate — No plain green dot) */}
            {liveOpenStatus.isOpen ? (
              <span className="bg-[#4E8752]/10 text-[#4E8752] dark:text-[#6AB56F] border border-[#4E8752]/20 px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 shadow-2xs">
                <Clock className="w-2.5 h-2.5 shrink-0" />
                <span className="truncate max-w-[65px] sm:max-w-none">{liveOpenStatus.badgeText}</span>
              </span>
            ) : (
              <span className="bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20 px-2 py-0.5 rounded-full text-[10px] font-medium inline-flex items-center gap-1">
                <Clock className="w-2.5 h-2.5 shrink-0" />
                <span className="truncate max-w-[65px] sm:max-w-none">{liveOpenStatus.badgeText}</span>
              </span>
            )}
          </div>
        </div>

        {/* Line 2: Venue Title + Price Tier */}
        <div className="flex items-center justify-between gap-1.5 min-w-0">
          <h3 className="font-comico text-base sm:text-lg text-[#181615] dark:text-white group-hover:text-[#e84a27] transition-colors leading-tight truncate">
            {venue.name}
          </h3>
          {venue.price_level && (
            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded-md shrink-0">
              {venue.price_level}
            </span>
          )}
        </div>

        {/* Line 3: Neighborhood + Walking Distance */}
        <p className="text-xs font-medium text-[#6E655F] dark:text-zinc-400 flex items-center gap-1 truncate">
          <MapPin className="w-3.5 h-3.5 text-[#E84A27] shrink-0" />
          <span className="truncate">{locationInfo.neighborhood}</span>
          {venue.distance_meters && (
            <span className="shrink-0 font-semibold text-[#4E8752] dark:text-[#6AB56F] text-[10.5px] ml-0.5">
              · {formatDistance(venue.distance_meters)}
            </span>
          )}
        </p>

        {/* Line 4: Signature Dish / Fresh Batch + Tactile Map Pill */}
        <div className="border-t border-[#181615]/8 dark:border-white/10 pt-1.5 flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-1 text-xs truncate min-w-0">
            {venue.kitchen_status && venue.kitchen_status.status === "fresh_batch" ? (
              <span className="text-[10px] font-bold text-[#e84a27] flex items-center gap-1 truncate animate-pulse">
                <span>🔥</span>
                <span className="truncate">{venue.kitchen_status.batch_note || "Fresh batch ready"}</span>
              </span>
            ) : venue.kitchen_status && venue.kitchen_status.status === "low_stock" ? (
              <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1 truncate">
                <span>⚡</span>
                <span className="truncate">Few left today</span>
              </span>
            ) : (
              <span className="text-xs font-bold text-[#181615] dark:text-zinc-200 truncate flex items-center gap-1">
                <span className="text-[#e84a27]">✦</span>
                <span className="truncate">{signature || taxonomy.dishCategory || taxonomy.spotLabel}</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleSpotOnMap}
            className="px-2.5 py-1 rounded-xl bg-[#FAF6EE] dark:bg-stone-800 hover:bg-[#E84A27] hover:text-white dark:hover:bg-[#E84A27] text-[#181615] dark:text-white border border-[#181615]/12 dark:border-white/10 text-[11px] font-bold shrink-0 flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-2xs group/btn"
          >
            <Compass className="w-3 h-3 text-[#E84A27] group-hover/btn:text-white transition-colors" />
            <span>Map</span>
          </button>
        </div>
      </div>
    </div>
  );
});
