"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Check,
  AlertTriangle,
  Pencil,
  Image as ImageIcon,
  MapPin,
  Star,
  Clock,
  Compass,
  X,
  Camera,
  Link as LinkIcon,
  Search,
  RefreshCw,
} from "lucide-react";
import { IconPickerModal } from "@/components/admin/IconPickerModal";
import {
  QuickDishEditModal,
  getCachedPhotosForQuery,
  setCachedPhotosForQuery,
} from "@/components/admin/QuickDishEditModal";
import {
  SmakrFoodIcon,
  isCustomFoodIcon,
  resolveCustomIconKey,
} from "@/components/food/FoodIcons";
import { resolveVenueDisplayBadge, resolveEntityTaxonomy } from "@/lib/taxonomy";
import type {
  StagedCandidateSpot,
  StagedDishHighlight,
  VerificationStatus,
} from "@/app/api/admin/seeding-lab/route";

interface SeedingCandidateCardProps {
  spot: StagedCandidateSpot;
  onUpdateSpot: (spotId: string, updates: Partial<StagedCandidateSpot>) => Promise<void>;
  onUpdateDish: (
    spotId: string,
    dishId: string,
    dishUpdates: Partial<StagedDishHighlight>
  ) => Promise<void>;
}

export function SeedingCandidateCard({
  spot,
  onUpdateSpot,
  onUpdateDish,
}: SeedingCandidateCardProps) {
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<StagedDishHighlight | null>(null);
  const [isEditingRestaurantCard, setIsEditingRestaurantCard] = useState(false);

  // Restaurant Card Modal state
  const [spotName, setSpotName] = useState(spot.name);
  const [spotAddress, setSpotAddress] = useState(spot.address);
  const [spotNeighborhood, setSpotNeighborhood] = useState(spot.neighborhood);
  const [spotCategory, setSpotCategory] = useState(spot.food_category);
  const [spotPriceLevel, setSpotPriceLevel] = useState<"$" | "$$" | "$$$">(
    spot.price_level || "$$"
  );
  const [spotRating, setSpotRating] = useState<string>(String(spot.google_rating ?? 4.7));
  const [spotSignatureDish, setSpotSignatureDish] = useState(
    spot.signature_dish || spot.dish_highlights[0]?.dish_name || ""
  );
  const [spotCoverUrl, setSpotCoverUrl] = useState(spot.cover_image_url || "");
  const [spotWhyCurated, setSpotWhyCurated] = useState(spot.why_curated || "");
  const [spotPhotoTab, setSpotPhotoTab] = useState<"google" | "url">("google");
  const [spotGoogleQuery, setSpotGoogleQuery] = useState(`${spot.name} Oslo`);
  const [spotGooglePhotos, setSpotGooglePhotos] = useState<string[]>(
    () => getCachedPhotosForQuery(`${spot.name} Oslo`) || []
  );
  const [isLoadingSpotGoogle, setIsLoadingSpotGoogle] = useState(false);
  const [isSavingSpot, setIsSavingSpot] = useState(false);

  // Keep local state synced when parent spot updates
  useEffect(() => {
    setSpotName(spot.name);
    setSpotAddress(spot.address);
    setSpotNeighborhood(spot.neighborhood);
    setSpotCategory(spot.food_category);
    setSpotPriceLevel(spot.price_level || "$$");
    setSpotRating(String(spot.google_rating ?? 4.7));
    setSpotSignatureDish(spot.signature_dish || spot.dish_highlights[0]?.dish_name || "");
    setSpotCoverUrl(spot.cover_image_url || "");
    setSpotWhyCurated(spot.why_curated || "");
  }, [spot]);

  const fetchSpotGooglePhotos = async (query: string, forceRefresh = false) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    if (!forceRefresh) {
      const cached = getCachedPhotosForQuery(trimmed);
      if (cached) {
        setSpotGooglePhotos(cached);
        return;
      }
    }
    setIsLoadingSpotGoogle(true);
    try {
      const res = await fetch(
        `/api/places/search?q=${encodeURIComponent(trimmed)}${
          forceRefresh ? "&refresh=1" : ""
        }`
      );
      const data = await res.json();
      const place = data?.places?.[0] || data?.place;
      const rawPhotos = place?.photos || [];
      const urls = rawPhotos
        .map((p: any) => {
          const ref = p.name || p.photo_reference || p;
          if (typeof ref === "string" && ref.startsWith("places/")) {
            return `/api/places/photos?ref=${encodeURIComponent(ref)}&w=640`;
          }
          return null;
        })
        .filter((u: any): u is string => Boolean(u));
      setCachedPhotosForQuery(trimmed, urls);
      setSpotGooglePhotos(urls);
    } catch (err) {
      console.warn("Failed to load spot Google photos:", err);
    } finally {
      setIsLoadingSpotGoogle(false);
    }
  };

  useEffect(() => {
    if (
      isEditingRestaurantCard &&
      spotPhotoTab === "google" &&
      getCachedPhotosForQuery(spotGoogleQuery) === null
    ) {
      void fetchSpotGooglePhotos(spotGoogleQuery, false);
    }
  }, [isEditingRestaurantCard, spotPhotoTab]);

  const handleSaveRestaurantCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSpot(true);
    try {
      const parsedRating = Number.parseFloat(spotRating);
      await onUpdateSpot(spot.id, {
        name: spotName.trim(),
        address: spotAddress.trim(),
        neighborhood: spotNeighborhood.trim().toLowerCase(),
        food_category: spotCategory.trim(),
        price_level: spotPriceLevel,
        google_rating: Number.isFinite(parsedRating) ? parsedRating : 4.7,
        signature_dish: spotSignatureDish.trim(),
        cover_image_url: spotCoverUrl.trim(),
        why_curated: spotWhyCurated.trim(),
      });
      setIsEditingRestaurantCard(false);
    } finally {
      setIsSavingSpot(false);
    }
  };

  // Resolve authentic cultural flag and taxonomy
  const venueBadge = resolveVenueDisplayBadge({
    name: spot.name,
    food_category: spot.food_category,
    icon: spot.icon,
    spot_type: spot.spot_type,
    category: spot.food_category,
  } as any);

  const taxonomy = resolveEntityTaxonomy({
    name: spot.name,
    food_category: spot.food_category as any,
    icon: spot.icon,
    spot_type: spot.spot_type,
    signature_dishes: spot.dish_highlights.map((d) => d.dish_name),
  } as any);

  const allDishesVerified =
    spot.dish_highlights.length > 0 &&
    spot.dish_highlights.every(
      (d) =>
        d.is_verified_food_photo &&
        Boolean(d.dish_image) &&
        !/streetview|facade|building|\/icons\/food\//i.test(d.dish_image)
    );

  const handleStatusChange = async (newStatus: VerificationStatus) => {
    const anyMissingPhoto = spot.dish_highlights.some(
      (d) => !d.dish_image || /\/icons\/food\//i.test(d.dish_image)
    );
    if (newStatus === "approved" && anyMissingPhoto) {
      alert("Cannot approve spot until every dish has a real photo URL (not an SVG fallback).");
      return;
    }
    await onUpdateSpot(spot.id, { verification_status: newStatus });
  };

  const displayRating = typeof spot.google_rating === "number" ? spot.google_rating : 4.7;
  const displayPriceLevel = spot.price_level || "$$";
  const displaySignature =
    spot.signature_dish ||
    spot.dish_highlights[0]?.dish_name ||
    taxonomy.dishCategory ||
    taxonomy.spotLabel;
  const effectiveCoverUrl = spot.cover_image_url || spot.dish_highlights[0]?.dish_image || "";

  return (
    <div className="relative rounded-3xl bg-white border border-[#EAE5DC] text-[#181615] shadow-[0_8px_30px_rgb(24,22,21,0.06)] overflow-hidden flex flex-col transition-all hover:shadow-[0_12px_36px_rgb(24,22,21,0.10)]">
      {/* ── TOP HEADER BAR ── */}
      <div className="px-5 py-4 border-b border-[#EAE5DC] bg-[#FAF7F2] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white border border-[#E0D9CE] text-[10px] font-extrabold tracking-wide uppercase shadow-xs">
            {venueBadge.flag && <span>{venueBadge.flag}</span>}
            <span className="text-[#E84A27] font-comico">{venueBadge.mainTag}</span>
          </div>
          <h2 className="text-lg font-black text-[#181615] tracking-tight truncate">
            {spot.name}
          </h2>
          <span className="text-xs font-semibold text-zinc-400 hidden sm:inline">·</span>
          <span className="text-xs font-semibold text-zinc-500 capitalize hidden sm:inline">
            {spot.neighborhood}
          </span>
        </div>

        {/* Interactive Map Pin Selector */}
        <button
          type="button"
          onClick={() => setIsIconPickerOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white hover:bg-zinc-50 border border-[#EAE5DC] text-xs font-bold transition-all shadow-xs text-zinc-800 hover:border-[#E84A27]/40 cursor-pointer"
          title="Click to customize map radar pin icon"
        >
          <span className="w-5 h-5 flex items-center justify-center">
            {isCustomFoodIcon(spot.icon) ? (
              <SmakrFoodIcon name={spot.icon} className="w-5 h-5 object-contain" />
            ) : (
              <span className="text-sm">{spot.icon || "📍"}</span>
            )}
          </span>
          <span className="text-xs font-extrabold text-[#E84A27]">Map Pin: {spot.icon}</span>
        </button>
      </div>

      {/* ── MAIN WORKSPACE: RESTAURANT CARD (LEFT) + DISH FEED CARDS (RIGHT) ── */}
      <div className="p-5 sm:p-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white items-start">
        {/* LEFT COLUMN (5 cols): 100% Exact FoodSpotCard Restaurant Card Preview */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400">
              1. Restaurant Card (Spots Tab)
            </span>
            <span className="text-[10.5px] text-zinc-400 font-semibold">
              Exact FoodSpotCard Layout
            </span>
          </div>

          <div className="rounded-3xl overflow-hidden border border-[#EAE5DC] bg-[#FAF7F2] shadow-sm">
            {/* Exact Clone of FoodSpotCard.tsx */}
            <div className="relative flex items-center gap-3 sm:gap-3.5 p-3.5 bg-[#EFE8DC] border-b border-[#181615]/10 select-none overflow-hidden min-h-[136px]">
              {/* Repeating SMAKR Monogram Watermark Pattern */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.03] select-none text-zinc-950 z-0"
                aria-hidden="true"
              >
                <defs>
                  <pattern
                    id={`smakr-lab-spot-${spot.id}`}
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
                <rect width="100%" height="100%" fill={`url(#smakr-lab-spot-${spot.id})`} />
              </svg>

              {/* Left Column — 1:1 Square Thumbnail (128x128px) */}
              <div className="relative z-10 w-[114px] h-[114px] sm:w-[128px] sm:h-[128px] rounded-2xl overflow-hidden shrink-0 bg-[#EAE6DF] shadow-sm ring-1 ring-black/10">
                {effectiveCoverUrl ? (
                  <Image
                    src={effectiveCoverUrl}
                    alt={spot.name}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-4">
                    <SmakrFoodIcon
                      name={
                        resolveCustomIconKey(spot.icon) ||
                        resolveCustomIconKey(spot.food_category) ||
                        taxonomy.spotKind
                      }
                      className="w-14 h-14 object-contain"
                    />
                  </div>
                )}

                <div className="absolute inset-y-0 right-0 w-6 bg-gradient-to-r from-transparent to-black/20 pointer-events-none z-[2]" />

                {/* Google Rating Badge bottom-left */}
                <div className="absolute bottom-2 left-2 z-[3] flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/80 text-white text-[10px] font-bold shadow-xs">
                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                  <span className="font-sans font-bold tracking-tight text-white">
                    {displayRating.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Right Column — 4 Clean Lines */}
              <div className="relative z-10 flex-1 min-w-0 flex flex-col justify-between py-0.5 h-[114px] sm:h-[128px]">
                {/* Line 1: Category Icon/Name + Open Pill */}
                <div className="flex items-center justify-between gap-1.5 min-w-0">
                  <span className="text-[11px] font-semibold text-[#e84a27] uppercase tracking-wider flex items-center gap-1 font-comico truncate">
                    <SmakrFoodIcon
                      name={
                        resolveCustomIconKey(spot.icon) ||
                        resolveCustomIconKey(spot.food_category) ||
                        taxonomy.spotKind
                      }
                      className="w-3.5 h-3.5 shrink-0"
                    />
                    <span className="truncate">{taxonomy.spotLabel}</span>
                  </span>

                  <span className="bg-[#4E8752]/10 text-[#4E8752] border border-[#4E8752]/20 px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 shrink-0">
                    <Clock className="w-2.5 h-2.5 shrink-0" />
                    <span>Open now</span>
                  </span>
                </div>

                {/* Line 2: Venue Title + Price Tier */}
                <div className="flex items-center justify-between gap-1.5 min-w-0">
                  <h3 className="font-comico text-base sm:text-lg text-[#181615] leading-tight truncate">
                    {spot.name}
                  </h3>
                  <span className="text-[10px] font-bold text-zinc-500 bg-black/5 px-1.5 py-0.5 rounded-md shrink-0">
                    {displayPriceLevel}
                  </span>
                </div>

                {/* Line 3: Neighborhood + Address */}
                <p className="text-xs font-medium text-[#6E655F] flex items-center gap-1 truncate">
                  <MapPin className="w-3.5 h-3.5 text-[#E84A27] shrink-0" />
                  <span className="capitalize truncate">{spot.neighborhood}</span>
                  <span className="text-zinc-400">·</span>
                  <span className="truncate text-[11px]">{spot.address}</span>
                </p>

                {/* Line 4: Signature Dish + Map Pill */}
                <div className="border-t border-[#181615]/8 pt-1.5 flex items-center justify-between gap-2 min-w-0">
                  <span className="text-xs font-bold text-[#181615] truncate flex items-center gap-1">
                    <span className="text-[#e84a27]">✦</span>
                    <span className="truncate">{displaySignature}</span>
                  </span>

                  <span className="px-2.5 py-1 rounded-xl bg-[#FAF6EE] text-[#181615] border border-[#181615]/12 text-[11px] font-bold shrink-0 flex items-center gap-1 shadow-2xs">
                    <Compass className="w-3 h-3 text-[#E84A27]" />
                    <span>Map</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Curated Note & Restaurant Edit Button */}
            <div className="p-3 bg-[#FAF7F2] space-y-2.5">
              {spot.why_curated && (
                <p className="text-[11.5px] text-zinc-600 italic border-l-2 border-[#E84A27] pl-2.5 line-clamp-2">
                  "{spot.why_curated}"
                </p>
              )}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-zinc-600">
                  {spot.cover_image_url ? "🟢 Cover Photo Ready" : "🟡 Using Dish Fallback"}
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingRestaurantCard(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#E84A27] hover:text-white text-[#181615] border border-[#DDD6C9] hover:border-[#E84A27] text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit Restaurant Card</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (7 cols): Dish Feed Cards (Exact FoodPostCard Layout & Comico Typography) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400">
              2. Dish Feed Cards ({spot.dish_highlights.length})
            </span>
            <span className="text-[10.5px] text-zinc-400 font-semibold">
              Exact FoodPostCard 4:3 Layout
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {spot.dish_highlights.map((dish) => {
              const isBadImage =
                !dish.dish_image ||
                /streetview|facade|building|\/icons\/food\//i.test(dish.dish_image) ||
                !dish.is_verified_food_photo;

              return (
                <div
                  key={dish.id}
                  className="group relative rounded-3xl overflow-hidden bg-[#181615] border border-black/10 shadow-md flex flex-col transition-all hover:shadow-xl"
                >
                  {/* Full-Bleed 4:3 Photography Container */}
                  <div className="relative w-full aspect-[4/3] overflow-hidden bg-[#E8E0D2]">
                    {dish.dish_image && (
                      <Image
                        src={dish.dish_image}
                        alt={dish.dish_name}
                        fill
                        unoptimized
                        className="object-cover w-full opacity-100 transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                    )}

                    {/* Seamless Dark Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-transparent pointer-events-none" />

                    {/* Warning Overlay if unverified */}
                    {isBadImage && (
                      <div className="absolute inset-x-3 top-3 z-20 p-2 rounded-2xl bg-amber-500/95 text-black text-[11px] font-black flex items-center gap-1.5 shadow-lg backdrop-blur-md">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-black" />
                        <span className="truncate">⚠️ Click Edit to verify or swap photo</span>
                      </div>
                    )}

                    {/* Floating Price Badge top-right */}
                    {dish.price_nok && (
                      <div className="absolute top-3 right-3 z-10 px-3 py-1 rounded-full bg-[#E84A27] text-white font-black text-xs shadow-md">
                        {dish.price_nok} NOK
                      </div>
                    )}

                    {/* Overlaid Editorial Content */}
                    <div className="absolute bottom-0 inset-x-0 p-4 z-10 flex flex-col justify-end pointer-events-none">
                      <h3 className="font-comico font-black text-[20px] sm:text-[22px] tracking-wide leading-[1.15] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)] line-clamp-1 capitalize">
                        {dish.dish_name}
                      </h3>

                      <div className="text-[12.5px] font-semibold text-white/95 drop-shadow-xs mt-1 flex items-center gap-1.5 flex-wrap">
                        <MapPin className="w-[13px] h-[13px] text-[#e84a27] shrink-0" />
                        <span className="font-semibold text-white">{spot.name}</span>
                        <span className="text-zinc-400">·</span>
                        <span className="text-zinc-300 capitalize">{spot.neighborhood}</span>
                      </div>

                      {dish.review_text && (
                        <p className="text-[11px] text-zinc-200 line-clamp-2 mt-1 drop-shadow-sm font-medium">
                          {dish.review_text}
                        </p>
                      )}

                      {dish.taste_tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {dish.taste_tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-[9.5px] font-bold text-white"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Action Strip */}
                  <div className="p-3 bg-[#FAF7F2] border-t border-[#EAE5DC] flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateDish(spot.id, dish.id, {
                          is_verified_food_photo: !dish.is_verified_food_photo,
                        })
                      }
                      title="Click to toggle dish photo verification"
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                        dish.is_verified_food_photo
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                          : "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                      }`}
                    >
                      {dish.is_verified_food_photo ? "🟢 Food Verified" : "🟡 Verify Photo"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingDish(dish)}
                      className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#E84A27] hover:text-white text-[#181615] border border-[#DDD6C9] hover:border-[#E84A27] text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit / AI Shift</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── CURATOR ACTION BAR ── */}
      <div className="p-4 sm:p-5 border-t border-[#EAE5DC] bg-[#FAF7F2] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-black text-zinc-500 uppercase tracking-wider">Status:</span>
          {spot.verification_status === "seeded" ? (
            <span className="px-3.5 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-700 border border-purple-200 shadow-xs">
              🟣 Seeded to Database
            </span>
          ) : (
            <div className="inline-flex rounded-2xl bg-white p-1 border border-[#DDD6C9] gap-1 shadow-xs">
              <button
                type="button"
                onClick={() => handleStatusChange("approved")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  spot.verification_status === "approved"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-zinc-600 hover:text-black hover:bg-emerald-50"
                }`}
                title="Approve for database seeding"
              >
                🟢 Approve
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange("needs_photo")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  spot.verification_status === "needs_photo"
                    ? "bg-amber-400 text-black shadow-xs"
                    : "text-zinc-600 hover:text-black hover:bg-zinc-100"
                }`}
              >
                🟡 Needs Photo
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange("rejected")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  spot.verification_status === "rejected"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "text-zinc-600 hover:text-black hover:bg-zinc-100"
                }`}
              >
                🔴 Reject
              </button>
            </div>
          )}
        </div>

        {/* Verification helper summary */}
        <div className="text-xs">
          {!allDishesVerified ? (
            <span className="text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              ⚠️ {spot.dish_highlights.filter((d) => !d.is_verified_food_photo).length} dish requires macro photo
            </span>
          ) : (
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              ✓ Restaurant Card + Dish Cards ready for production seed
            </span>
          )}
        </div>
      </div>

      {/* ── MODALS ── */}
      {isIconPickerOpen && (
        <IconPickerModal
          currentIcon={spot.icon}
          initialTab={spot.food_category}
          onSelect={async (newIcon) => {
            await onUpdateSpot(spot.id, { icon: newIcon });
            setIsIconPickerOpen(false);
          }}
          onClose={() => setIsIconPickerOpen(false)}
        />
      )}

      {editingDish && (
        <QuickDishEditModal
          dish={editingDish}
          spotName={spot.name}
          onSave={async (dishUpdates) => {
            await onUpdateDish(spot.id, editingDish.id, dishUpdates);
          }}
          onClose={() => setEditingDish(null)}
        />
      )}

      {/* Restaurant Card (FoodSpotCard) Edit Modal */}
      {isEditingRestaurantCard && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-[#FAF7F2] border border-[#EAE5DC] text-[#181615] shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAE5DC] bg-white">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#E84A27] bg-[#E84A27]/10 px-2 py-0.5 rounded-full">
                  Restaurant Card Editor (FoodSpotCard)
                </span>
                <h3 className="font-comico font-black text-lg text-[#181615] tracking-wide mt-0.5">
                  {spotName || spot.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingRestaurantCard(false)}
                className="p-2 rounded-xl text-zinc-400 hover:text-[#181615] hover:bg-zinc-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleSaveRestaurantCard}
              className="p-6 space-y-4 overflow-y-auto flex-1"
            >
              {/* Live 1:1 Cover Photo Preview */}
              <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-[#EFE8DC] border border-[#181615]/10">
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 bg-[#EAE6DF] ring-1 ring-black/10">
                  {spotCoverUrl ? (
                    <Image
                      src={spotCoverUrl}
                      alt={spotName}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-400">
                      <ImageIcon className="w-7 h-7 opacity-40" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <span className="text-[11px] font-semibold text-[#e84a27] uppercase font-comico block">
                    {taxonomy.spotLabel}
                  </span>
                  <h4 className="font-comico text-base text-[#181615] truncate">{spotName}</h4>
                  <p className="text-xs text-zinc-600 truncate">
                    {spotNeighborhood} · {spotPriceLevel} · ★ {spotRating}
                  </p>
                  <p className="text-xs font-bold text-[#181615] truncate">
                    <span className="text-[#e84a27]">✦</span> {spotSignatureDish}
                  </p>
                </div>
              </div>

              {/* Cover Photo Source Switcher */}
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-1 bg-[#EFEAE1] p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setSpotPhotoTab("google")}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                      spotPhotoTab === "google"
                        ? "bg-white text-[#181615] shadow-xs"
                        : "text-zinc-600"
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Google Places ({spotGooglePhotos.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSpotPhotoTab("url")}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                      spotPhotoTab === "url"
                        ? "bg-white text-[#181615] shadow-xs"
                        : "text-zinc-600"
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Direct Cover URL</span>
                  </button>
                </div>

                {spotPhotoTab === "google" ? (
                  <div className="p-3 rounded-2xl bg-white border border-[#EAE5DC] space-y-2.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={spotGoogleQuery}
                        onChange={(e) => setSpotGoogleQuery(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-[#FAF7F2] border border-[#DDD6C9]"
                      />
                      <button
                        type="button"
                        onClick={() => fetchSpotGooglePhotos(spotGoogleQuery, false)}
                        disabled={isLoadingSpotGoogle}
                        className="px-3 py-1.5 rounded-lg bg-[#181615] text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Search className="w-3 h-3" />
                        <span>Search</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fetchSpotGooglePhotos(spotGoogleQuery, true)}
                        disabled={isLoadingSpotGoogle}
                        title="Force fresh API call"
                        className="p-1.5 rounded-lg bg-[#FAF7F2] border border-[#DDD6C9] text-zinc-600 cursor-pointer"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${isLoadingSpotGoogle ? "animate-spin" : ""}`}
                        />
                      </button>
                    </div>

                    {isLoadingSpotGoogle ? (
                      <div className="py-4 text-center text-xs text-zinc-500">
                        Loading Google photos...
                      </div>
                    ) : spotGooglePhotos.length === 0 ? (
                      <div className="py-3 text-center text-xs text-zinc-500">
                        No Google photos loaded yet. Click Search or paste a Direct URL.
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1">
                        {spotGooglePhotos.map((pUrl, i) => (
                          <button
                            key={pUrl + i}
                            type="button"
                            onClick={() => setSpotCoverUrl(pUrl)}
                            className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer ${
                              spotCoverUrl === pUrl ? "border-[#E84A27]" : "border-transparent"
                            }`}
                          >
                            <Image
                              src={pUrl}
                              alt="Venue photo"
                              fill
                              unoptimized
                              className="object-cover"
                            />
                            {spotCoverUrl === pUrl && (
                              <div className="absolute inset-0 bg-[#E84A27]/30 flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-white border border-[#EAE5DC] space-y-1.5">
                    <label className="block text-xs font-bold">Restaurant Cover Image URL</label>
                    <input
                      type="url"
                      value={spotCoverUrl}
                      onChange={(e) => setSpotCoverUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF7F2] border border-[#DDD6C9]"
                    />
                  </div>
                )}
              </div>

              {/* Restaurant Metadata Inputs */}
              <div className="p-4 rounded-2xl bg-white border border-[#EAE5DC] space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Restaurant Name
                    </label>
                    <input
                      type="text"
                      value={spotName}
                      onChange={(e) => setSpotName(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-[#FAF7F2] border border-[#DDD6C9]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Signature Dish (Line 4)
                    </label>
                    <input
                      type="text"
                      value={spotSignatureDish}
                      onChange={(e) => setSpotSignatureDish(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-[#FAF7F2] border border-[#DDD6C9]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Address</label>
                    <input
                      type="text"
                      value={spotAddress}
                      onChange={(e) => setSpotAddress(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-[#FAF7F2] border border-[#DDD6C9]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Neighborhood
                    </label>
                    <input
                      type="text"
                      value={spotNeighborhood}
                      onChange={(e) => setSpotNeighborhood(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-[#FAF7F2] border border-[#DDD6C9]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Category</label>
                    <input
                      type="text"
                      value={spotCategory}
                      onChange={(e) => setSpotCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-[#FAF7F2] border border-[#DDD6C9]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Price Tier
                    </label>
                    <select
                      value={spotPriceLevel}
                      onChange={(e) => setSpotPriceLevel(e.target.value as "$" | "$$" | "$$$")}
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-[#FAF7F2] border border-[#DDD6C9]"
                    >
                      <option value="$">$ (Budget)</option>
                      <option value="$$">$$ (Moderate)</option>
                      <option value="$$$">$$$ (Elevated)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Google Rating
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      value={spotRating}
                      onChange={(e) => setSpotRating(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-[#FAF7F2] border border-[#DDD6C9]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Why Curated / Venue Description
                  </label>
                  <textarea
                    rows={2}
                    value={spotWhyCurated}
                    onChange={(e) => setSpotWhyCurated(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF7F2] border border-[#DDD6C9] resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#EAE5DC]">
                <button
                  type="button"
                  onClick={() => setIsEditingRestaurantCard(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-zinc-500 hover:text-[#181615] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSpot}
                  className="px-6 py-2.5 text-xs font-black rounded-xl bg-[#E84A27] hover:bg-[#d03d1b] text-white shadow-md shadow-[#E84A27]/25 cursor-pointer"
                >
                  {isSavingSpot ? "Saving..." : "Save Restaurant Card"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
