"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { ThumbsUp, MapPin, Bookmark, Pencil, Flame, Send, Compass, ArrowUpRight } from "lucide-react";
import { FoodPost } from "@/types";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { setPostLike, setPostSave } from "@/lib/supabase/data";
import { OfficialSmakrMascot } from "@/lib/officialSmakrMascot";
import { getPopupStatus, getPopupMeta } from "@/lib/popupUtils";
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
  const selectVenueById = useCityPulseStore((state) => state.selectVenueById);
  const setIsVenueDetailModalOpen = useCityPulseStore((state) => state.setIsVenueDetailModalOpen);
  const currentUser = useCityPulseStore((state) => state.currentUser);
  const userLocation = useCityPulseStore((state) => state.userLocation);
  const setQuickEditPost = useCityPulseStore((state) => state.setQuickEditPost);
  const linkedVenue = useCityPulseStore(
    (state) => state.venues.find((v) => v.id === post.spot_id) ?? null
  );
  const mascotConfig = useCityPulseStore((state) => state.mascotConfig);

  const popupStatus = getPopupStatus(linkedVenue);
  const popupMeta = linkedVenue ? getPopupMeta(linkedVenue) : null;
  const isPopup = linkedVenue?.spot_type === "popup" || post.spot_type === "popup";
  const isPopupInactive = Boolean(
    isPopup && (
      !popupMeta?.dates_label ||
      popupMeta.dates_label.toLowerCase().includes("tba") ||
      popupMeta.residency_status === "between_residencies" ||
      popupStatus.status === "dormant" ||
      popupStatus.status === "expired" ||
      popupStatus.status === "grace" ||
      (!linkedVenue?.popup_start_date && !linkedVenue?.popup_end_date && !popupMeta?.dates_label)
    )
  );
  const isPopupActive = isPopup && !isPopupInactive;

  // A pop-up has no confirmed location if address is TBA, host venue is TBA, or dormant
  const isLocationTBA = Boolean(
    isPopup && (
      !linkedVenue?.address ||
      linkedVenue.address.toLowerCase().includes("tba") ||
      !post.spot_address ||
      post.spot_address.toLowerCase().includes("tba") ||
      popupMeta?.host_venue_name?.toLowerCase().includes("tba") ||
      isPopupInactive
    )
  );
  const hasConfirmedLocation = !isLocationTBA;
  const kStatus = linkedVenue?.kitchen_status || post.kitchen_status;
  const activeKitchenStatus = kStatus?.status && kStatus.status !== "normal" ? kStatus.status : null;
  const kitchenBatchNote = kStatus?.batch_note;
  const isVerifiedKitchen = Boolean(kStatus?.verified_kitchen);

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

  const showToast = useCityPulseStore((state) => state.showToast);

  const [aiEnrichedNote, setAiEnrichedNote] = useState<string | null>(null);

  const isGenericSignatureText = (txt?: string | null) => {
    if (!txt || !txt.trim()) return true;
    return /^Signature .+ prepared fresh at /i.test(txt.trim());
  };

  // Auto-generate real AI taste notes for the primary hero dish if imported without a note
  React.useEffect(() => {
    if (currentUser?.role !== "admin") return;
    if (!priority || !isGenericSignatureText(post.review_text)) return;
    if (dinerQuotes.length === 0) return;
    const cacheKey = `smakr_ai_note_v4_${post.id}_${post.dish_name}`;
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setAiEnrichedNote(cached);
        return;
      }
    }
    let cancelled = false;
    fetch("/api/admin/ai-curate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "generate-dish-note",
        dishName: post.dish_name,
        venueName: post.spot_name,
        category: post.category,
        rawGoogleReviews: dinerQuotes.map((q) => q.text),
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const generated = (data?.tasteNote || data?.note || "").trim();
        if (generated && !isGenericSignatureText(generated)) {
          setAiEnrichedNote(generated);
          if (typeof window !== "undefined") {
            sessionStorage.setItem(cacheKey, generated);
          }
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [priority, post.id, post.review_text, post.dish_name, post.spot_name, post.category, dinerQuotes, currentUser?.role]);

  // Dish-specific Smakr Taste Note / Verdict (never generic "Signature X prepared fresh at Y")
  const dishVerdict = React.useMemo(() => {
    if (aiEnrichedNote) return aiEnrichedNote;
    const cleanReview = post.review_text?.trim();
    if (cleanReview && !isGenericSignatureText(cleanReview)) return cleanReview;
    if (post.taste_tags && post.taste_tags.length > 0) {
      return `${post.taste_tags.slice(0, 3).join(" · ")} — standout ${post.dish_name.toLowerCase()} at ${post.spot_name}.`;
    }
    const lower = `${post.dish_name} ${post.spot_name}`.toLowerCase();
    if (lower.includes("fried chicken") || lower.includes("k-fried") || lower.includes("korean") || lower.includes("wings")) {
      return `Double-fried shatteringly crisp crust glazed in sticky sweet-heat gochujang and toasted sesame at ${post.spot_name}.`;
    }
    if (lower.includes("dumpling") || lower.includes("gyoza") || lower.includes("dim sum") || lower.includes("yum cha")) {
      return `Delicate hand-pleated wrappers with juicy aromatic filling and a savoury chili-soy dip at ${post.spot_name}.`;
    }
    if (lower.includes("kebab") || lower.includes("shawarma") || lower.includes("falafel") || lower.includes("döner")) {
      return "Charcoal-kissed spiced meat shaved thin into warm flatbread with bright herbs and garlic toum.";
    }
    if (lower.includes("pho") || lower.includes("vietnamese") || lower.includes("bánh mì") || lower.includes("banh mi")) {
      return "Fragrant 12-hour star-anise bone broth with silky rice noodles, fresh Thai basil, and lime.";
    }
    if (lower.includes("curry") || lower.includes("masala") || lower.includes("indian") || lower.includes("biryani")) {
      return "Slow-simmered aromatic spice gravy with tender charred tikka and blistered garlic naan.";
    }
    if (lower.includes("matcha") || lower.includes("hojicha") || lower.includes("ochaya") || lower.includes("boba")) {
      return "Velvety microfoam whisked over ceremonial-grade green matcha with zero bitterness and a creamy finish.";
    }
    if (lower.includes("coffee") || lower.includes("espresso") || lower.includes("latte") || lower.includes("cà phê")) {
      return "Silky textured milk poured over a bright, caramel-sweet espresso shot roasted in Oslo.";
    }
    if (lower.includes("bakery") || lower.includes("bun") || lower.includes("croissant") || lower.includes("brød") || lower.includes("sourdough")) {
      return "Flaky, deeply caramelized crust with a tender brown-butter cardamom crumb fresh from the oven.";
    }
    if (lower.includes("pizza")) {
      return "Blistered wood-fired sourdough cornicione with bright San Marzano tomatoes and stretchy fior di latte.";
    }
    if (lower.includes("burger") || lower.includes("smash")) {
      return "Lacy hard-seared beef edges, melted aged cheddar, and house pickles on a toasted potato bun.";
    }
    if (lower.includes("ramen") || lower.includes("noodle")) {
      return "Rich, collagen-dense broth paired with springy wheat noodles, jammy ajitama egg, and smoky chashu.";
    }
    if (lower.includes("taco") || lower.includes("birria")) {
      return "Warm pressed corn tortillas loaded with slow-braised meat, bright cilantro, onion, and smoky salsa.";
    }
    if (lower.includes("pasta")) {
      return "Al dente handmade pasta tossed in a glossy, deeply savoury emulsion with aged Parmigiano.";
    }
    return `Crisp texture, bold seasoning, and standout flavour—the essential order at ${post.spot_name}.`;
  }, [aiEnrichedNote, post.review_text, post.taste_tags, post.dish_name, post.spot_name, post.category]);

  const displayRating =
    googleRating != null
      ? googleRating.toFixed(1)
      : post.rating
      ? (post.rating > 5 ? (post.rating / 2).toFixed(1) : post.rating.toFixed(1))
      : "4.7";

  const isViewerAdmin = currentUser?.role === "admin";

  const isNiwacheAdmin = Boolean(
    post.is_official_pick ||
    post.author?.badge === "Verified Foodie" ||
    (currentUser?.role === "admin" && currentUser?.handle === post.author?.handle) ||
    isViewerAdmin
  );

  // Seed every curated dish with a baseline count of at least 1 from @smak so no card ever displays 0
  const worthItCount = Math.max(1, post.likes_count || 1) + (isLiked ? 1 : 0);

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

  const handleShareDish = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/?spot=${encodeURIComponent(post.spot_id)}&dish=${encodeURIComponent(post.dish_name)}`;
    const shareData = {
      title: `${post.dish_name} · ${post.spot_name}`,
      text: `Spise her? 👀 ${post.dish_name} at ${post.spot_name} on Smakr Oslo`,
      url,
    };
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(shareData);
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        showToast("Link copied! Send 'Spise her?' to a friend 🥟");
      }
    } catch {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        showToast("Link copied! Send 'Spise her?' to a friend 🥟");
      }
    }
  };

  const handleDoubleTap = () => {
    if (!isLiked) handleToggleLike();
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 700);
  };

  const handleOpenDetails = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (post.spot_id) {
      selectVenueById(post.spot_id);
      setIsVenueDetailModalOpen(true);
    }
  };

  const handleFlyToRadar = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isPopup && !hasConfirmedLocation) {
      handleOpenDetails();
      return;
    }
    flyToSpot(post.spot_coords, post.spot_id);
  };

  const handleCardClick = () => {
    if (isPopup && !hasConfirmedLocation) {
      handleOpenDetails();
    } else {
      flyToSpot(post.spot_coords, post.spot_id);
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      onClick={handleCardClick}
      onDoubleClick={handleDoubleTap}
      className={`group relative w-full rounded-[26px] overflow-hidden border bg-[#181615]/80 backdrop-blur-md shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer select-none ${
        isPopupActive
          ? "border-[#E84A27]/40 dark:border-[#E84A27]/50 shadow-[0_4px_20px_rgba(232,74,39,0.14)]"
          : isPopupInactive
          ? "border-black/[0.08] dark:border-white/10 opacity-95"
          : "border-black/[0.08] dark:border-white/10"
      } ${
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
          src={
            post.image_url?.startsWith("/api/places/photos") && !post.image_url.includes("w=")
              ? `${post.image_url}&w=640`
              : post.image_url
          }
          alt={post.dish_name}
          fill
          unoptimized
          priority={priority}
          loading={priority ? undefined : "lazy"}
          decoding="async"
          className="object-cover w-full opacity-90 transition-transform duration-700 ease-out group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
        />

        {/* Seamless Dark Gradient Overlay covering the bottom 60% */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-transparent pointer-events-none" />

        {/* Floating Top Badges (Over Image) */}
        <div className="absolute top-3 inset-x-3 flex items-start justify-between gap-2 z-10 pointer-events-auto">
          {/* Top-Left: Pop-up / Price / Kitchen Badge */}
          <div className="flex flex-wrap items-center gap-1.5 max-w-[70%]">
            {/* Pop-up Badge in Top-Left so the fact that it's a popup immediately sticks out! */}
            {isPopup && (
              <span
                className={`font-sans font-bold tracking-tight px-3 py-1 rounded-full text-xs shadow-md flex items-center gap-1.5 ${
                  isPopupActive
                    ? "bg-[#E84A27] text-white"
                    : "bg-[#FAF7F2] text-[#181615] border border-black/10"
                }`}
              >
                <span>🎟️</span>
                <span>{isPopupActive ? "Live Pop-Up Drop" : "Pop-Up Residency"}</span>
              </span>
            )}

            {/* Price (ONLY if there is a real NOK price; never show the '$$ · + kr' money thing for popups) */}
            {typeof post.price_nok === "number" && post.price_nok > 0 ? (
              <span className="font-sans font-bold tracking-tight bg-[#e84a27] text-white px-3 py-1 rounded-full text-xs shadow-md rotate-[-1deg]">
                {post.price_nok} kr
              </span>
            ) : !isPopup && isViewerAdmin ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setQuickEditPost(post);
                }}
                className="font-sans font-bold tracking-tight bg-black/65 hover:bg-[#e84a27] backdrop-blur-md text-zinc-100 border border-white/20 px-2.5 py-1 rounded-full text-[11px] shadow-md transition-colors"
                title="Add NOK price"
              >
                {post.price_tier || linkedVenue?.price_level ? `${post.price_tier || linkedVenue?.price_level} · + kr` : "+ Add kr"}
              </button>
            ) : !isPopup && (post.price_tier || linkedVenue?.price_level) ? (
              <span className="font-sans font-bold tracking-tight bg-black/60 backdrop-blur-md text-zinc-200 border border-white/15 px-2.5 py-1 rounded-full text-xs shadow-md">
                {post.price_tier || linkedVenue?.price_level}
              </span>
            ) : null}

            {/* Live Kitchen Batch Badges */}
            {activeKitchenStatus === "fresh_batch" && (
              <span className="bg-[#e84a27] text-white font-bold px-2.5 py-1 rounded-full text-[11px] backdrop-blur-md shadow-md flex items-center gap-1 animate-pulse">
                <span>🔥</span>
                <span>Fresh Batch</span>
              </span>
            )}
            {activeKitchenStatus === "low_stock" && (
              <span className="bg-amber-500 text-zinc-950 font-bold px-2.5 py-1 rounded-full text-[11px] backdrop-blur-md shadow-md flex items-center gap-1">
                <span>⚡</span>
                <span>Few Left Today</span>
              </span>
            )}
            {activeKitchenStatus === "sold_out" && (
              <span className="bg-zinc-900/90 text-zinc-300 font-bold px-2.5 py-1 rounded-full text-[11px] backdrop-blur-md border border-white/20 flex items-center gap-1">
                <span>❌</span>
                <span>Sold Out Today</span>
              </span>
            )}

            {!isPopup && popupStatus.status === "active" && (
              <span className="bg-[#E84A27] text-white font-bold px-2.5 py-1 rounded-full text-[11px] shadow-sm flex items-center gap-1">
                <Flame className="w-3 h-3 fill-white" />
                <span>{popupStatus.label}</span>
              </span>
            )}
            {!isPopup && popupStatus.status === "grace" && (
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

            {!isPopup && (
              <span className="bg-black/60 backdrop-blur-md text-amber-400 font-bold px-2.5 py-1 rounded-full text-xs border border-white/10 flex items-center gap-1 shadow-xs">
                <span className="text-amber-400 text-xs">★</span>
                <span className="font-sans font-bold text-white text-xs tracking-tight">{displayRating}</span>
              </span>
            )}

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
          {/* Pop-Up Status Header (Clean typography, zero neon) */}
          {isPopup && (
            <div className="flex items-center gap-1.5 mb-1 text-[11px]">
              <span className={`font-mono font-extrabold uppercase tracking-wider flex items-center gap-1 text-[11px] ${
                isPopupActive ? "text-[#FF8566]" : "text-[#FAF7F2]"
              }`}>
                <span className="text-[#E84A27]">✦</span>
                <span>{isPopupActive ? `Pop-Up Drop · ${popupMeta?.dates_label || "Live Now"}` : "Pop-Up Residency · Next Dates TBA"}</span>
              </span>
            </div>
          )}

          {/* Dish Title (Capitalized) */}
          <h3 className="font-bold text-lg sm:text-xl leading-snug drop-shadow-sm text-white line-clamp-1 capitalize">
            {post.dish_name}
          </h3>

          {/* Venue & Location (Clean neighborhood & walking distance) */}
          <div className="text-xs font-medium text-zinc-300 drop-shadow-sm mt-0.5 flex items-center gap-1.5 flex-wrap">
            <MapPin className="w-3 h-3 text-[#e84a27] shrink-0" />
            <span className="font-semibold text-white">{post.spot_name}</span>
            {isPopup && (
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[9.5px] font-bold border ${
                  isPopupActive
                    ? "bg-[#E84A27]/25 border-[#E84A27]/40 text-[#FF8566]"
                    : "bg-white/15 border-white/20 text-[#FAF7F2]"
                }`}
              >
                Pop-Up
              </span>
            )}
            {isVerifiedKitchen && (
              <span
                className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-emerald-500/25 border border-emerald-400/40 text-[9.5px] text-emerald-300 font-bold"
                title="Verified Kitchen"
              >
                <span>✓</span>
                <span>Verified</span>
              </span>
            )}
            <span className="text-zinc-400">·</span>
            <span>{hasConfirmedLocation ? locationInfo.neighborhood : "Location TBA"}</span>
            {hasConfirmedLocation && walkingDistance && (
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

          {/* Kitchen Live Batch Soundbite */}
          {kitchenBatchNote && activeKitchenStatus !== null && (
            <div className="bg-orange-500/20 border border-orange-500/35 backdrop-blur-md rounded-xl px-2.5 py-1.5 my-1.5 max-w-[96%] flex items-center gap-1.5 text-[11px] text-orange-200">
              <span className="shrink-0">👨‍🍳</span>
              <span className="font-medium italic leading-snug line-clamp-1">
                &ldquo;{kitchenBatchNote}&rdquo;
              </span>
            </div>
          )}

          {/* Concise Dish-Specific Smakr Verdict (✦ Quote Only — Permanent spots only; removed for popups) */}
          {!isPopup && dishVerdict && (
            <div className="bg-black/45 backdrop-blur-md border border-white/15 rounded-xl px-2.5 py-1.5 my-2 max-w-[96%]">
              <p className="text-[11px] text-zinc-100 leading-snug line-clamp-2">
                <span className="text-[#E84A27] font-bold not-italic mr-1">✦</span>
                <span className="italic">&ldquo;{dishVerdict}&rdquo;</span>
              </p>
            </div>
          )}

          {/* Author & Interactive Foodie Reactions Footer */}
          <div className="flex items-center justify-between gap-1.5 pt-1 mt-0.5 flex-wrap">
            {/* Left: Author Avatar + @handle */}
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-6 h-6 rounded-full bg-[#FAF7F2] border border-white/25 overflow-hidden shrink-0 flex items-center justify-center">
                {isNiwacheAdmin ? (
                  <OfficialSmakrMascot size={24} />
                ) : post.author?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.author.avatar_url}
                    alt={post.author.handle || "author"}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="w-full h-full rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold text-zinc-900">
                    {(post.author?.name || "U")[0]}
                  </span>
                )}
              </span>
              <span className="text-[11px] font-semibold text-zinc-200 truncate max-w-[90px]">
                {post.author?.handle?.startsWith("@") ? post.author.handle : `@${post.author?.handle || "smak"}`}
              </span>
            </div>

            {/* Right Group: 3 Clean Balanced Tactile Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Action 1: Single Tactile Flame Reaction Pill */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleLike();
                }}
                className={`h-9 px-3 rounded-full text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer backdrop-blur-md ${
                  isLiked
                    ? "bg-[#E84A27] border border-[#FF7A5C] text-white shadow-[0_4px_12px_rgba(232,74,39,0.4)]"
                    : "bg-[#181615]/75 border border-white/20 text-[#FAF7F2] hover:bg-[#181615]"
                }`}
                title={isLiked ? "Liked" : "Worth It"}
                aria-label="React with fire"
              >
                <Flame className={`w-3.5 h-3.5 ${isLiked ? "fill-white text-white" : "text-[#E84A27]"}`} />
                <span className="font-mono text-xs">{worthItCount}</span>
              </button>

              {/* Action 2: Clean Circular Share Icon Button */}
              <button
                type="button"
                onClick={handleShareDish}
                className="h-9 w-9 rounded-full bg-[#181615]/75 hover:bg-[#181615] backdrop-blur-md border border-white/20 text-[#FAF7F2] active:scale-90 transition-all flex items-center justify-center cursor-pointer shrink-0"
                title="Send 'Spise her?' to a friend"
                aria-label="Share dish"
              >
                <Send className="w-3.5 h-3.5 stroke-[2] -translate-x-[0.5px] translate-y-[0.5px]" />
              </button>

              {/* Action 3: [Map ↗] Flight Button (ONLY if location is confirmed) or [Details ↗] */}
              {hasConfirmedLocation ? (
                <button
                  type="button"
                  onClick={handleFlyToRadar}
                  className="h-9 px-3.5 rounded-full bg-[#FAF7F2] text-[#181615] border-2 border-[#181615] shadow-[0_2px_0_#181615] hover:bg-[#E84A27] hover:text-white hover:border-[#181615] active:translate-y-[1px] active:shadow-none transition-all text-xs font-extrabold flex items-center gap-1 cursor-pointer shrink-0"
                  title="Locate on map"
                  aria-label="Locate on map"
                >
                  <Compass className="w-3.5 h-3.5 stroke-[2.2]" />
                  <span>Map</span>
                  <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              ) : isPopup ? (
                <button
                  type="button"
                  onClick={handleOpenDetails}
                  className="h-9 px-3.5 rounded-full bg-[#FAF7F2] text-[#181615] border-2 border-[#181615] shadow-[0_2px_0_#181615] hover:bg-[#E84A27] hover:text-white hover:border-[#181615] active:translate-y-[1px] active:shadow-none transition-all text-xs font-extrabold flex items-center gap-1 cursor-pointer shrink-0"
                  title="View drop details"
                  aria-label="View drop details"
                >
                  <span>Details</span>
                  <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
});
