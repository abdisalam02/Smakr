"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { ThumbsUp, MapPin, Bookmark, Pencil } from "lucide-react";
import { FoodPost } from "@/types";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { setPostLike, setPostSave } from "@/lib/supabase/data";
import { MascotCharacter } from "@/components/avatar/MascotCharacter";
import { getPopupStatus } from "@/lib/popupUtils";
import { formatOsloLocation } from "@/lib/location";
import { getDistanceInMeters, formatDistance } from "@/lib/math";

interface FoodPostCardProps {
  post: FoodPost;
  /** True only for the first above-the-fold card so its photo is preloaded. */
  priority?: boolean;
}

/**
  * Full-bleed photo editorial hero card with overlaid typography and actions.
  *
  * Memoized + subscribed to atomic store slices so unrelated updates (map center,
  * filters, other pins) never re-render or repaint this card.
  */
export const FoodPostCard = React.memo(function FoodPostCard({
  post,
  priority = false,
}: FoodPostCardProps) {
  // Atomic selectors: each returns a stable primitive / reference, so only the
  // cards whose own state changed re-render.
  const isLiked = useCityPulseStore((state) => state.likedPostIds.has(post.id));
  const isSaved = useCityPulseStore((state) => state.savedPostIds.has(post.id));
  const toggleLikePost = useCityPulseStore((state) => state.toggleLikePost);
  const toggleSavePost = useCityPulseStore((state) => state.toggleSavePost);
  const flyToSpot = useCityPulseStore((state) => state.flyToSpot);
  const currentUser = useCityPulseStore((state) => state.currentUser);
  const userLocation = useCityPulseStore((state) => state.userLocation);
  const setQuickEditPost = useCityPulseStore((state) => state.setQuickEditPost);
  const linkedVenue = useCityPulseStore(
    (state) => state.venues.find((v) => v.id === post.spot_id) ?? null
  );
  const mascotConfig = useCityPulseStore((state) => state.mascotConfig);

  const popupStatus = getPopupStatus(linkedVenue);

  const [showHeart, setShowHeart] = useState(false);

  const locationInfo = formatOsloLocation(
    post.spot_address || linkedVenue?.address,
    post.spot_neighborhood || linkedVenue?.city
  );

  const walkingDistance = userLocation
    ? formatDistance(
        getDistanceInMeters(
          userLocation.lat,
          userLocation.lon,
          post.spot_coords[1],
          post.spot_coords[0]
        )
      )
    : null;

  const googleRating =
    typeof linkedVenue?.google_rating === "number" && linkedVenue.google_rating > 0
      ? linkedVenue.google_rating
      : null;
  const googleCount = linkedVenue?.google_reviews_count ?? 0;
  const dinerQuotes =
    post.diner_quotes && post.diner_quotes.length > 0
      ? post.diner_quotes
      : linkedVenue?.curated_reviews ?? [];

  // Smart 5-star review picker: taste note first, then top food-keyword 5-star quote
  const bestQuote = React.useMemo(() => {
    if (post.review_text) return { text: post.review_text, rating: 5, author: null };
    if (!dinerQuotes || dinerQuotes.length === 0) return null;
    const foodKeywords = /taste|flavor|crispy|best|must try|delicious|authentic|fresh|vibes|sauce|craft|crust/i;
    const sorted = [...dinerQuotes].sort((a, b) => {
      const aFood = foodKeywords.test(a.text) ? 2 : 0;
      const bFood = foodKeywords.test(b.text) ? 2 : 0;
      return b.rating + bFood - (a.rating + aFood);
    });
    const top = sorted[0];
    return { text: top.text, rating: top.rating, author: top.author_name };
  }, [post.review_text, dinerQuotes]);

  const displayRating =
    googleRating != null
      ? googleRating.toFixed(1)
      : post.rating
      ? (post.rating > 5 ? (post.rating / 2).toFixed(1) : post.rating.toFixed(1))
      : "4.7";

  const isViewerAdmin = Boolean(
    currentUser?.role === "admin" ||
    currentUser?.is_official ||
    (currentUser?.handle || "").toLowerCase().includes("niwache") ||
    (currentUser?.handle || "").toLowerCase().includes("smak") ||
    (currentUser?.email || "").toLowerCase().includes("niwache")
  );

  const isNiwacheAdmin = Boolean(
    post.is_official_pick ||
    (post.author?.handle && (
      post.author.handle.toLowerCase().includes("niwache") ||
      post.author.handle.toLowerCase().includes("smak")
    )) ||
    (currentUser?.role === "admin" && currentUser?.handle === post.author?.handle) ||
    isViewerAdmin
  );

  const stars = (rating: number) => {
    const full = Math.max(0, Math.min(5, Math.round(rating)));
    return `${"★".repeat(full)}${"☆".repeat(5 - full)}`;
  };

  // Optimistic local count first, then best-effort Supabase persistence.
  const handleToggleLike = () => {
    const nextLiked = !isLiked;
    toggleLikePost(post.id);
    if (currentUser?.id) void setPostLike(currentUser.id, post.id, nextLiked);
  };

  const handleToggleSave = () => {
    const nextSaved = !isSaved;
    toggleSavePost(post.id);
    if (currentUser?.id) void setPostSave(currentUser.id, post.id, nextSaved);
  };

  const handleDoubleTap = () => {
    if (!isLiked) handleToggleLike();
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 700);
  };

  const handleFlyToRadar = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    flyToSpot(post.spot_coords, post.spot_id);
  };

  const handleCardClick = () => {
    flyToSpot(post.spot_coords, post.spot_id);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      onClick={handleCardClick}
      onDoubleClick={handleDoubleTap}
      className={`group relative w-full rounded-[26px] overflow-hidden border border-black/[0.08] dark:border-white/10 bg-[#181615]/80 backdrop-blur-md shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer select-none ${
        popupStatus.isDimmedCard ? "opacity-50 grayscale-[20%]" : ""
      }`}
    >
      {/* Repeating SMAKR Monogram Watermark Pattern across background layer */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.035] select-none text-white z-0"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id={`smakr-pattern-${post.id}`}
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
        <rect width="100%" height="100%" fill={`url(#smakr-pattern-${post.id})`} />
      </svg>

      {/* Full-Bleed Photography Hero Container */}
      <div className="relative w-full aspect-[4/3] min-h-[320px] overflow-hidden bg-zinc-900">
        <Image
          src={post.image_url}
          alt={post.dish_name}
          fill
          unoptimized
          priority={priority}
          loading={priority ? undefined : "lazy"}
          className="object-cover w-full opacity-90 transition-transform duration-700 ease-out group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
        />

        {/* Seamless Dark Gradient Overlay covering the bottom 60% */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-transparent pointer-events-none" />

        {/* Floating Top Badges (Over Image) */}
        <div className="absolute top-3 inset-x-3 flex items-start justify-between gap-2 z-10 pointer-events-auto">
          {/* Top-Left: Price Sticker / Price Tier / Pop-up / Truck Badge */}
          <div className="flex flex-wrap items-center gap-1.5 max-w-[70%]">
            {typeof post.price_nok === "number" && post.price_nok > 0 ? (
              <span className="font-sans font-bold tracking-tight bg-[#e84a27] text-white px-3 py-1 rounded-full text-xs shadow-md rotate-[-1deg]">
                {post.price_nok} NOK
              </span>
            ) : (post.price_tier || linkedVenue?.price_level) ? (
              <span className="font-sans font-bold tracking-tight bg-black/60 backdrop-blur-md text-zinc-200 border border-white/15 px-2.5 py-1 rounded-full text-xs shadow-md">
                {post.price_tier || linkedVenue?.price_level}
              </span>
            ) : null}

            {/* Pop-up Badges */}
            {popupStatus.status === "active" && (
              <span className="bg-amber-500 text-zinc-950 font-bold px-2.5 py-1 rounded-full text-[11px] backdrop-blur-md shadow-md animate-pulse">
                {popupStatus.label}
              </span>
            )}
            {popupStatus.status === "grace" && (
              <span className="bg-zinc-800/90 text-zinc-300 font-medium px-2.5 py-1 rounded-full text-[11px] backdrop-blur-md border border-white/10">
                {popupStatus.label}
              </span>
            )}

            {/* Food Truck Badge */}
            {linkedVenue?.spot_type === "food_truck" && (
              <span className="bg-emerald-600 text-white font-bold px-2.5 py-1 rounded-full text-[11px] backdrop-blur-md shadow-md flex items-center gap-1">
                <span>🚚</span>
                <span>Food Truck</span>
              </span>
            )}
          </div>

          {/* Top-Right: Admin Quick Edit + Rating pill + Save bookmark */}
          <div className="flex items-center gap-1.5 shrink-0">
            {isViewerAdmin && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setQuickEditPost(post);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 hover:bg-white text-[#e84a27] shadow-md backdrop-blur-md border border-white/50 text-[11px] font-bold tracking-wide transition-all hover:scale-105 active:scale-95 cursor-pointer"
                title="Admin Quick Edit"
                aria-label="Admin Quick Edit"
              >
                <Pencil className="w-3 h-3 text-[#e84a27]" />
                <span>Edit</span>
              </button>
            )}

            <span className="bg-black/60 backdrop-blur-md text-amber-400 font-bold px-2.5 py-1 rounded-full text-xs border border-white/10 flex items-center gap-1 shadow-xs">
              <span className="text-amber-400 text-xs">★</span>
              <span className="font-sans font-bold text-white text-xs tracking-tight">{displayRating}</span>
            </span>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleSave();
              }}
              className={`p-1.5 rounded-full backdrop-blur-md border transition-all active:scale-95 ${
                isSaved
                  ? "bg-white text-zinc-900 border-white shadow-xs"
                  : "bg-black/60 text-white border-white/10 hover:bg-black/80"
              }`}
              title={isSaved ? "Saved" : "Save dish"}
              aria-label={isSaved ? "Saved" : "Save dish"}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-zinc-900" : ""}`} />
            </button>
          </div>
        </div>

        {/* Double-tap heart feedback animation */}
        {showHeart && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 animate-in fade-in zoom-in-50 duration-200">
            <div className="p-3.5 rounded-full bg-white/30 backdrop-blur-md shadow-xl">
              <ThumbsUp className="w-10 h-10 text-white fill-[#e84a27] stroke-white" />
            </div>
          </div>
        )}

        {/* Overlaid Editorial Content (Bottom Half of Photo) */}
        <div className="absolute bottom-0 inset-x-0 p-3.5 sm:p-4 z-10 flex flex-col justify-end pointer-events-auto">
          {/* Dish Title (Capitalized) */}
          <h3 className="font-bold text-lg sm:text-xl leading-snug drop-shadow-sm text-white line-clamp-1 capitalize">
            {post.dish_name}
          </h3>

          {/* Venue & Location (Clean neighborhood & walking distance) */}
          <div className="text-xs font-medium text-zinc-300 drop-shadow-sm mt-0.5 flex items-center gap-1.5 flex-wrap">
            <MapPin className="w-3 h-3 text-[#e84a27] shrink-0" />
            <span className="font-semibold text-white">{post.spot_name}</span>
            <span className="text-zinc-400">·</span>
            <span>{locationInfo.neighborhood}</span>
            {walkingDistance && (
              <span className="text-emerald-400 font-semibold font-mono text-[11px]">
                · {walkingDistance}
              </span>
            )}
            {linkedVenue?.spot_type === "food_truck" && linkedVenue.location_schedule && (
              <div className="w-full text-[11px] font-mono text-emerald-300 flex items-center gap-1 mt-0.5">
                <span>🚚</span>
                <span className="truncate">{linkedVenue.location_schedule}</span>
              </div>
            )}
          </div>

          {/* Single Compact Review Quote (smart 5-star prioritized) */}
          {bestQuote && (
            <div className="bg-black/40 backdrop-blur-md border border-white/15 rounded-xl px-2.5 py-1.5 my-2 max-w-[95%]">
              <p className="text-[11px] text-zinc-100 italic leading-snug line-clamp-2">
                &ldquo;{bestQuote.text}&rdquo;
              </p>
              {bestQuote.author && (
                <p className="text-[9px] mt-0.5 flex items-center gap-1 text-zinc-300">
                  <span className="text-amber-400 font-mono">{stars(bestQuote.rating)}</span>
                  <span className="truncate">· {bestQuote.author}</span>
                </p>
              )}
            </div>
          )}

          {/* Author & Action Footer */}
          <div className="flex items-center justify-between gap-2 pt-1 mt-0.5">
            {/* Left: Author Avatar + @handle */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-7 h-7 rounded-full bg-[#FAF7F2] border border-white/25 overflow-hidden shrink-0 flex items-center justify-center">
                {isNiwacheAdmin ? (
                  <MascotCharacter config={mascotConfig} size={28} />
                ) : post.author?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.author.avatar_url}
                    alt={post.author.handle || "author"}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="w-full h-full rounded-full bg-white/20 flex items-center justify-center text-[11px] font-bold text-zinc-900">
                    {(post.author?.name || "U")[0]}
                  </span>
                )}
              </span>
              <span className="text-xs font-semibold text-zinc-200 truncate">
                {post.author?.handle?.startsWith("@") ? post.author.handle : `@${post.author?.handle || "foodie"}`}
              </span>
            </div>

            {/* Right Group: Like pill + [ 📍 Map ] Action Pill */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Like Pill */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleLike();
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md border transition-all active:scale-95 ${
                  isLiked
                    ? "bg-[#e84a27] text-white border-[#e84a27] shadow-sm"
                    : "bg-black/50 text-zinc-200 border-white/10 hover:bg-black/70"
                }`}
                title="Like dish"
              >
                <ThumbsUp className={`w-3 h-3 ${isLiked ? "fill-white" : ""}`} />
                <span className="font-mono text-[11px]">{post.likes_count}</span>
              </button>

              {/* [ 📍 Map ] Action Pill */}
              <button
                onClick={handleFlyToRadar}
                className="flex items-center gap-1 bg-white hover:bg-zinc-100 text-zinc-950 font-bold px-3 py-1 rounded-full text-xs shadow-md transition-transform active:scale-95"
                title="Locate on map"
              >
                <span aria-hidden>📍</span>
                <span>Map</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
});
