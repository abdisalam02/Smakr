"use client";

import React from "react";
import Image from "next/image";
import { MapPin, Star, ChevronRight, Pencil } from "lucide-react";
import { Venue } from "@/types";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { formatDistance } from "@/lib/math";
import { FOOD_CATEGORIES } from "@/lib/foodSeeds";
import { getPopupStatus } from "@/lib/popupUtils";
import { getVenueLiveOpenStatus } from "@/lib/openingHours";
import { formatOsloLocation } from "@/lib/location";

interface FoodSpotCardProps {
  venue: Venue;
  /** True only for the first above-the-fold card so its photo is preloaded. */
  priority?: boolean;
}

function resolveFoodCategoryAndIcon(venue: Venue, topDish?: string | null): {
  label: string;
  emoji: string;
} {
  const text = `${venue.name} ${topDish || ""} ${(venue.signature_dishes || []).join(" ")}`.toLowerCase();

  if (text.includes("yum cha") || text.includes("dim sum") || text.includes("dumpling") || text.includes("gyoza") || text.includes("wonton") || text.includes("momo")) {
    return { label: "Dim Sum & Dumplings", emoji: "🥟" };
  }
  if (text.includes("bao") || text.includes("steamed bun")) {
    return { label: "Bao Buns", emoji: "🥠" };
  }
  if (text.includes("ramen") || text.includes("noodle") || text.includes("udon") || text.includes("soba")) {
    return { label: "Ramen & Noodles", emoji: "🍜" };
  }
  if (text.includes("pho") || text.includes("bánh mì") || text.includes("banh mi") || text.includes("vietnamese")) {
    return { label: "Pho & Vietnamese", emoji: "🍲" };
  }
  if (text.includes("burger") || text.includes("smash")) {
    return { label: "Burgers", emoji: "🍔" };
  }
  if (text.includes("pizza") || text.includes("pizzeria")) {
    return { label: "Pizza", emoji: "🍕" };
  }
  if (text.includes("taco") || text.includes("birria") || text.includes("carnitas") || text.includes("mexican")) {
    return { label: "Tacos & Mexican", emoji: "🌮" };
  }
  if (text.includes("fried chicken") || text.includes("korean") || text.includes("wings")) {
    return { label: "Fried Chicken", emoji: "🍗" };
  }
  if (text.includes("kebab") || text.includes("shawarma") || text.includes("falafel")) {
    return { label: "Kebab & Street Food", emoji: "🥙" };
  }
  if (text.includes("indian") || text.includes("curry") || text.includes("masala") || text.includes("tandoori")) {
    return { label: "Indian & Curry", emoji: "🍛" };
  }
  if (text.includes("mandi") || text.includes("kabsa") || text.includes("yemeni")) {
    return { label: "Mandi & Rice", emoji: "🍚" };
  }
  if (text.includes("matcha") || text.includes("sencha") || text.includes("hojicha")) {
    return { label: "Matcha & Tea", emoji: "🍵" };
  }
  if (text.includes("bakery") || text.includes("bakeri") || text.includes("croissant") || text.includes("bolle") || text.includes("pastry")) {
    return { label: "Bakery", emoji: "🥐" };
  }
  if (text.includes("coffee") || text.includes("kaffe") || text.includes("espresso") || text.includes("roaster") || text.includes("kaffebar")) {
    return { label: "Specialty Coffee", emoji: "☕" };
  }
  if (text.includes("sushi") || text.includes("sashimi") || text.includes("raw bar") || text.includes("seafood")) {
    return { label: "Sushi & Seafood", emoji: "🍣" };
  }
  if (text.includes("pasta") || text.includes("trattoria") || text.includes("italian")) {
    return { label: "Pasta & Italian", emoji: "🍝" };
  }

  const catDef = FOOD_CATEGORIES.find((c) => c.id === venue.food_category);
  if (catDef && catDef.id !== "all") {
    return { label: catDef.label, emoji: venue.icon || catDef.emoji };
  }

  return { label: "Oslo Spot", emoji: venue.icon || "🍽️" };
}

export const FoodSpotCard = React.memo(function FoodSpotCard({
  venue,
  priority = false,
}: FoodSpotCardProps) {
  const flyToSpot = useCityPulseStore((state) => state.flyToSpot);
  const selectVenueById = useCityPulseStore((state) => state.selectVenueById);
  const currentUser = useCityPulseStore((state) => state.currentUser);
  const setQuickEditPost = useCityPulseStore((state) => state.setQuickEditPost);
  const foodPosts = useCityPulseStore((state) => state.foodPosts);
  const popupStatus = getPopupStatus(venue);
  const liveOpenStatus = getVenueLiveOpenStatus(venue);
  const locationInfo = formatOsloLocation(venue.address, venue.city);

  const isViewerAdmin = currentUser?.role === "admin";

  const handleAdminEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    const existingPost = foodPosts.find((p) => p.spot_id === venue.id);
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

  const categoryDef = FOOD_CATEGORIES.find((c) => c.id === venue.food_category);
  const signature = venue.signature_dishes && venue.signature_dishes.length > 0 ? venue.signature_dishes[0] : null;

  const categoryInfo = resolveFoodCategoryAndIcon(venue, signature);
  const hasGoogleRating = typeof venue.google_rating === "number" && venue.google_rating > 0;

  const handleClick = () => {
    selectVenueById(venue.id);
  };

  const handleSpotOnMap = (e: React.MouseEvent) => {
    e.stopPropagation();
    flyToSpot([venue.longitude, venue.latitude], venue.id);
  };

  const curatedDishPhoto = foodPosts.find(
    (p) => p.spot_id === venue.id && p.image_url && !p.is_archived
  )?.image_url;
  const spotCoverUrl = curatedDishPhoto || venue.cover_image_url;

  return (
    <div
      onClick={handleClick}
      className={`group relative flex items-center gap-3.5 p-3 rounded-3xl bg-[#FAF7F2] dark:bg-[#181615] border border-[#181615]/10 dark:border-white/10 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.99] select-none overflow-hidden min-h-[116px] max-h-[136px] ${
        popupStatus.isDimmedCard ? "opacity-50 grayscale-[20%]" : ""
      }`}
    >
      {/* Repeating SMAKR Monogram Watermark Pattern */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.03] dark:opacity-[0.05] select-none text-zinc-950 dark:text-white"
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

      {/* Left Column — Fixed 1:1 Square Thumbnail (112x112px) */}
      <div className="relative w-[112px] h-[112px] min-w-[112px] min-h-[112px] max-w-[112px] max-h-[112px] rounded-2xl overflow-hidden shrink-0 bg-[#EAE6DF] ring-1 ring-black/5">
        {spotCoverUrl ? (
          <Image
            src={spotCoverUrl}
            alt={venue.name}
            fill
            priority={priority}
            loading={priority ? undefined : "lazy"}
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="112px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">
            {categoryInfo.emoji || "🍽️"}
          </div>
        )}

        {/* Google Rating Badge bottom-left */}
        {hasGoogleRating && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-white text-[10px] font-bold shadow-xs">
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

      {/* Right Column — Strictly 4 Clean Lines (flex-1 min-w-0) */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 h-[112px]">
        {/* Line 1: Category + Live Status */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold text-[#e84a27] uppercase tracking-wider flex items-center gap-1 font-comico truncate">
            <span>{categoryInfo.emoji}</span>
            <span className="truncate">{categoryInfo.label}</span>
          </span>

          <div className="flex items-center gap-1 shrink-0">
            {venue.spot_type === "popup" && (
              <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500 text-zinc-950">
                Pop-up
              </span>
            )}
            <span
              className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                liveOpenStatus.color === "green"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : liveOpenStatus.color === "orange"
                  ? "bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300"
                  : "bg-zinc-100 text-zinc-600 border-zinc-200/80 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              <span>{liveOpenStatus.badgeText}</span>
            </span>
          </div>
        </div>

        {/* Line 2: Venue Title + Price Tier */}
        <div className="flex items-center justify-between gap-1.5">
          <h3 className="font-comico text-base text-[#181615] dark:text-white group-hover:text-[#e84a27] transition-colors truncate">
            {venue.name}
          </h3>
          {venue.price_level && (
            <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 bg-black/5 dark:bg-white/10 px-1.5 py-0.2 rounded-md shrink-0">
              {venue.price_level}
            </span>
          )}
        </div>

        {/* Line 3: Neighborhood + Walking Distance */}
        <p className="text-xs text-[#6E655F] dark:text-zinc-400 flex items-center gap-1 truncate">
          <MapPin className="w-3 h-3 text-[#6E655F]/70 shrink-0" />
          <span className="truncate">{locationInfo.neighborhood}</span>
          {venue.distance_meters && (
            <span className="shrink-0 font-semibold text-emerald-600 dark:text-emerald-400 text-[10px] ml-0.5">
              · {formatDistance(venue.distance_meters)}
            </span>
          )}
        </p>

        {/* Line 4: Signature Dish / Batch Note + Map Action */}
        <div className="border-t border-[#181615]/8 dark:border-white/10 pt-1.5 flex items-center justify-between gap-2">
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
              <span className="text-xs font-semibold text-[#181615] dark:text-zinc-200 truncate flex items-center gap-1">
                <span className="text-[#e84a27]">✦</span>
                <span className="truncate">{signature || "Curated Oslo Spot"}</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleSpotOnMap}
            className="px-2.5 py-1 rounded-full bg-[#181615] hover:bg-[#2B1810] text-[#FAF7F2] text-[11px] font-bold shrink-0 flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-xs"
          >
            <span>Map</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
});
