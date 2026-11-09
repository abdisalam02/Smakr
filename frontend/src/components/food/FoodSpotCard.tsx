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
import { resolveEntityTaxonomy, resolveVenueDisplayBadge } from "@/lib/taxonomy";

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
  const displayBadge = resolveVenueDisplayBadge(venue);
  const hasGoogleRating = typeof venue.google_rating === "number" && venue.google_rating > 0;

  // Look up matching food post to pull authentic signature dish name and NOK price
  const existingPost = useCityPulseStore(
    React.useCallback((s) => s.foodPosts.find((p) => p.spot_id === venue.id), [venue.id])
  );
  const signatureDishName = topDishName || existingPost?.dish_name || signature || taxonomy.dishCategory || taxonomy.spotLabel;
  const signaturePrice = existingPost?.price_nok;

  const handleClick = () => {
    selectVenueById(venue.id);
  };

  const handleSpotOnMap = (e: React.MouseEvent) => {
    e.stopPropagation();
    flyToSpot([venue.longitude, venue.latitude], venue.id);
  };

  const spotCoverUrl = primaryDishPhoto !== undefined ? primaryDishPhoto : venue.cover_image_url;
  const [thumbReady, setThumbReady] = useState(false);
  const feedLayout = useCityPulseStore((state) => state.feedLayout);
  const isGridMode = feedLayout === "grid" && venue.spot_type !== "popup";
  const spotIconKey =
    resolveCustomIconKey(venue.icon) ||
    resolveCustomIconKey(venue.food_category) ||
    displayBadge.pinIcon ||
    taxonomy.spotKind;

  return (
    <div
      onClick={handleClick}
      className={`group relative ${
        isGridMode
          ? "flex flex-col rounded-2xl h-full"
          : "flex items-center gap-3 sm:gap-3.5 p-2.5 sm:p-3 rounded-2xl sm:rounded-3xl min-h-[152px] sm:min-h-[168px]"
      } bg-[#FAF7F2] hover:bg-[#F5EFE4] dark:bg-[#181615] dark:hover:bg-[#1E1C1A] border border-[#181615]/12 dark:border-white/10 shadow-xs hover:shadow-md transition-[background-color,box-shadow] duration-150 cursor-pointer active:scale-[0.985] select-none overflow-hidden ${
        isSelected ? "ring-2 ring-[#E84A27]" : ""
      } ${popupStatus.isDimmedCard ? "opacity-50 grayscale-[20%]" : ""}`}
    >
      {/* Translucent Restaurant Food Icon Watermark on the Right Side */}
      <div
        aria-hidden="true"
        className={`pointer-events-none select-none absolute z-[1] opacity-[0.13] dark:opacity-[0.17] transition-transform duration-300 group-hover:scale-105 ${
          isGridMode
            ? "-right-3 -bottom-3 w-20 h-20 rotate-[-10deg]"
            : "-right-3 top-1/2 -translate-y-1/2 w-28 h-28 sm:w-32 sm:h-32 rotate-[-8deg]"
        }`}
      >
        <SmakrFoodIcon name={spotIconKey} className="w-full h-full object-contain" />
      </div>

      {/* Unified Photo Container (never unmounts when switching 1x <-> 2x) */}
      <div
        className={`relative z-10 overflow-hidden shrink-0 bg-[#EAE6DF] ${
          isGridMode
            ? "w-full aspect-[4/3] min-h-[136px] sm:min-h-[158px]"
            : "w-[138px] h-[138px] min-w-[138px] min-h-[138px] sm:w-[154px] sm:h-[154px] sm:min-w-[154px] sm:min-h-[154px] rounded-2xl shadow-xs ring-1 ring-black/5 dark:ring-white/10"
        }`}
      >
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
            sizes="(max-width: 640px) 48vw, 220px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-4">
            <SmakrFoodIcon name={spotIconKey} className="w-16 h-16 sm:w-20 sm:h-20 object-contain" />
          </div>
        )}
        {spotCoverUrl && (
          <div
            aria-hidden="true"
            className={`smakr-shimmer-light absolute inset-0 pointer-events-none transition-opacity duration-500 ${
              thumbReady ? "opacity-0" : "opacity-100"
            }`}
          />
        )}

        {/* Soft bleed gradient overlay on image edge (1x mode) */}
        {!isGridMode && (
          <div className="absolute inset-y-0 right-0 w-6 bg-gradient-to-r from-transparent to-black/20 pointer-events-none z-[2]" />
        )}

        {/* Google Rating Badge bottom-left */}
        {hasGoogleRating && (
          <div className="absolute bottom-2 left-2 z-[3] flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#181615]/80 backdrop-blur-md text-white text-[10.5px] font-bold shadow-xs border border-white/15">
            <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-400 text-amber-400" />
            <span className="font-comico tracking-tight text-white">{venue.google_rating!.toFixed(1)}</span>
          </div>
        )}

        {/* Live Status Pill top-right of photo in 2x grid mode */}
        {isGridMode && (
          <div className="absolute top-2 right-2 z-[3]">
            {liveOpenStatus.isOpen ? (
              <span className="bg-[#181615]/75 backdrop-blur-md text-emerald-300 border border-white/15 px-2 py-0.5 rounded-full text-[9.5px] font-bold inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Open</span>
              </span>
            ) : (
              <span className="bg-[#181615]/75 backdrop-blur-md text-stone-300 border border-white/15 px-2 py-0.5 rounded-full text-[9.5px] font-medium inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                <span>Closed</span>
              </span>
            )}
          </div>
        )}

        {/* Floating Admin Edit Button top-left of photo */}
        {isViewerAdmin && (
          <button
            type="button"
            onClick={handleAdminEdit}
            className="absolute top-2 left-2 w-7 h-7 rounded-full bg-[#181615]/80 text-white flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-all cursor-pointer z-10 border border-white/10"
            title="Admin Edit Spot"
          >
            <Pencil className="w-3.5 h-3.5 text-white" />
          </button>
        )}
      </div>

      {/* Unified Editorial Body */}
      <div
        className={`relative z-10 flex-1 min-w-0 flex flex-col justify-between ${
          isGridMode ? "p-2.5 sm:p-3 gap-1.5" : "py-1 h-[138px] sm:h-[154px]"
        }`}
      >
        {/* Line 1: Origin Flag + Category Tag + Live Status Pill (in 1x mode) */}
        <div className="flex items-center justify-between gap-1.5 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            {displayBadge.flag && (
              <span className="text-xs shrink-0 select-none">
                {displayBadge.flag}
              </span>
            )}
            <span
              className={`${
                isGridMode ? "text-[10px]" : "text-[11px] sm:text-xs"
              } font-bold text-[#e84a27] uppercase tracking-wider flex items-center gap-1 font-comico truncate`}
            >
              <SmakrFoodIcon
                name={spotIconKey}
                className={isGridMode ? "w-3.5 h-3.5 shrink-0" : "w-4 h-4 shrink-0"}
              />
              <span className="truncate">{displayBadge.mainTag || taxonomy.spotLabel}</span>
            </span>
          </div>

          {isGridMode ? (
            venue.price_level && (
              <span className="text-[9.5px] font-bold font-comico text-zinc-600 dark:text-zinc-300 bg-stone-200/60 dark:bg-white/10 px-1.5 py-0.2 rounded shrink-0">
                {venue.price_level}
              </span>
            )
          ) : (
            <div className="flex items-center gap-1 shrink-0">
              {venue.spot_type === "popup" && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#e84a27] text-white font-comico shrink-0 tracking-wide">
                  Pop-up
                </span>
              )}

              {/* Refined Live Status Pill */}
              {liveOpenStatus.isOpen ? (
                <span className="bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold inline-flex items-center gap-1 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="truncate max-w-[70px] sm:max-w-none">{liveOpenStatus.badgeText}</span>
                </span>
              ) : (
                <span className="bg-stone-500/10 text-stone-600 dark:text-stone-400 border border-stone-500/20 px-2.5 py-0.5 rounded-full text-[10.5px] font-medium inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                  <span className="truncate max-w-[70px] sm:max-w-none">{liveOpenStatus.badgeText}</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Line 2: Venue Title + Price Tier (in 1x mode) */}
        <div className="flex items-center justify-between gap-1.5 min-w-0">
          <h3
            className={`font-comico ${
              isGridMode ? "text-[15px] sm:text-base leading-snug" : "text-[17px] sm:text-[19px] leading-tight"
            } text-[#181615] dark:text-white group-hover:text-[#e84a27] transition-colors truncate`}
          >
            {venue.name}
          </h3>
          {!isGridMode && venue.price_level && (
            <span className="text-[10.5px] font-bold font-comico text-zinc-600 dark:text-zinc-300 bg-stone-200/60 dark:bg-white/10 px-1.5 py-0.5 rounded-md shrink-0 border border-black/5">
              {venue.price_level}
            </span>
          )}
        </div>

        {/* Line 3: Neighborhood + Walking Distance */}
        <p
          className={`${
            isGridMode ? "text-[11px]" : "text-[12.5px] sm:text-[13px]"
          } font-medium text-[#6E655F] dark:text-zinc-400 flex items-center gap-1 truncate`}
        >
          <MapPin className={isGridMode ? "w-3 h-3 text-[#E84A27] shrink-0" : "w-3.5 h-3.5 text-[#E84A27] shrink-0"} />
          <span className="truncate">{locationInfo.neighborhood}</span>
          {!isGridMode && venue.distance_meters && (
            <span className="shrink-0 font-semibold text-[#4E8752] dark:text-[#6AB56F] text-[11px] ml-0.5">
              · {formatDistance(venue.distance_meters)}
            </span>
          )}
        </p>

        {/* Line 4: Signature Dish Hero Chip with Price (Map button removed per design) */}
        <div
          className={`border-t border-[#181615]/8 dark:border-white/10 ${
            isGridMode ? "pt-1.5" : "pt-2"
          } flex items-center justify-between gap-2 min-w-0`}
        >
          <div className="flex items-center gap-1 truncate min-w-0">
            {venue.kitchen_status && venue.kitchen_status.status === "fresh_batch" ? (
              <span className="text-[11px] font-bold text-[#e84a27] flex items-center gap-1 truncate animate-pulse">
                <span>🔥</span>
                <span className="truncate">{venue.kitchen_status.batch_note || "Fresh batch ready"}</span>
              </span>
            ) : venue.kitchen_status && venue.kitchen_status.status === "low_stock" ? (
              <span className="text-[11px] font-bold text-amber-600 flex items-center gap-1 truncate">
                <span>⚡</span>
                <span className="truncate">Few left today</span>
              </span>
            ) : (
              <span
                className={`${
                  isGridMode ? "text-[11px]" : "text-[12.5px] sm:text-[13px]"
                } font-bold text-[#181615] dark:text-zinc-200 truncate flex items-center gap-1`}
              >
                <span className="text-[#e84a27] shrink-0">✦</span>
                <span className="truncate font-medium">{signatureDishName}</span>
                {!isGridMode && signaturePrice && (
                  <span className="text-[#e84a27] font-comico text-[11px] shrink-0 font-bold ml-0.5">
                    · {signaturePrice} kr
                  </span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
