"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { ThumbsUp, MapPin, Bookmark, Pencil, Flame, Send, Compass, ArrowUpRight, Calendar } from "lucide-react";
import { FoodPost, Venue } from "@/types";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { setPostLike, setPostSave } from "@/lib/supabase/data";
import { OfficialSmakrMascot } from "@/lib/officialSmakrMascot";
import { SmakrFoodIcon } from "@/components/food/FoodIcons";
import {
  openPeepsConfigFromPreset,
  buildOpenPeepsDataUri,
  ensureBustAvatarSvg,
  type OpenPeepsPresetId,
} from "@/lib/onboardingAvatar";
import { getPopupStatus, getPopupMeta } from "@/lib/popupUtils";
import { formatOsloLocation } from "@/lib/location";
import { getDistanceInMeters, formatDistance } from "@/lib/math";

const LOADED_FEED_IMAGES = new Set<string>();
const PRESET_AVATAR_CACHE = new Map<OpenPeepsPresetId, string>();

function getCachedPresetAvatar(preset: OpenPeepsPresetId): string {
  let cached = PRESET_AVATAR_CACHE.get(preset);
  if (!cached) {
    cached = buildOpenPeepsDataUri(openPeepsConfigFromPreset(preset));
    PRESET_AVATAR_CACHE.set(preset, cached);
  }
  return cached;
}

interface FoodPostCardProps {
  post: FoodPost;
  /** True only for the first above-the-fold card so its photo is preloaded. */
  priority?: boolean;
  linkedVenue?: Venue | null;
  index?: number;
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
  linkedVenue: propLinkedVenue,
  index,
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
  const userLocation = useCityPulseStore((state) => state.userLocation);
  const setQuickEditPost = useCityPulseStore((state) => state.setQuickEditPost);
  const mascotConfig = useCityPulseStore((state) => state.mascotConfig);
  const rawGridMode = useCityPulseStore((state) => state.feedLayout === "grid");

  // Decoupled atomic selectors
  const isSelected = useCityPulseStore(
    React.useCallback((s) => Boolean(s.selectedVenue && s.selectedVenue.id === post.spot_id), [post.spot_id])
  );
  const isViewerAdmin = useCityPulseStore(
    React.useCallback((s) => Boolean(s.currentUser && (s.currentUser.role === "admin" || s.currentUser.is_official)), [])
  );
  const isCurrentUserAuthor = useCityPulseStore(
    React.useCallback((s) => Boolean(s.currentUser && s.currentUser.handle === post.author?.handle), [post.author?.handle])
  );

  // Avoid store subscription to venues when precomputed linkedVenue prop is provided
  const storeLinkedVenue = useCityPulseStore(
    React.useCallback(
      (state) => {
        if (propLinkedVenue !== undefined) return null;
        return state.venues.find((v) => v.id === post.spot_id) ?? null;
      },
      [propLinkedVenue, post.spot_id]
    )
  );
  const linkedVenue = propLinkedVenue !== undefined ? propLinkedVenue : storeLinkedVenue;

  const popupStatus = getPopupStatus(linkedVenue);
  const popupMeta = linkedVenue ? getPopupMeta(linkedVenue) : null;
  const isPopup = linkedVenue?.spot_type === "popup" || post.spot_type === "popup";
  // Pop-ups always span a full row, so they keep the large layout even in 2-up grid mode.
  const isGridMode = rawGridMode && !isPopup;
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
  const [imgReady, setImgReady] = useState(() =>
    Boolean(post.image_url && LOADED_FEED_IMAGES.has(post.image_url))
  );

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
    if (!isViewerAdmin) return;
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
        rawGoogleReviews: dinerQuotes.map((q: any) => typeof q === "string" ? q : q.text || ""),
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
  }, [priority, post.id, post.review_text, post.dish_name, post.spot_name, post.category, dinerQuotes, isViewerAdmin]);

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

  const isNiwacheAdmin = Boolean(
    post.is_official_pick ||
    post.author?.badge === "Verified Foodie" ||
    (isViewerAdmin && isCurrentUserAuthor) ||
    isViewerAdmin
  );

  // Seed every curated dish with a baseline count of at least 1 from @smak so no card ever displays 0
  const worthItCount = Math.max(1, post.likes_count || 1) + (isLiked ? 1 : 0);

  // Optimistic local count first, then best-effort Supabase persistence.
  const handleToggleLike = () => {
    const nextLiked = !isLiked;
    toggleLikePost(post.id);
    const uid = useCityPulseStore.getState().currentUser?.id;
    if (uid) void setPostLike(uid, post.id, nextLiked);
  };

  const handleToggleSave = () => {
    const nextSaved = !isSaved;
    toggleSavePost(post.id);
    const uid = useCityPulseStore.getState().currentUser?.id;
    if (uid) void setPostSave(uid, post.id, nextSaved);
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
    useCityPulseStore.getState().setViewMode("map");
    flyToSpot(post.spot_coords, post.spot_id);
  };

  const avatarSrc = React.useMemo(() => {
    const rawUrl = post.author?.avatar_url;
    // Strict Rule: NEVER render a legacy Micah / head-only SVG with a background box!
    // Check if the resolved avatar string contains explicit "open-peeps-bust" and is NOT a Micah avatar
    if (
      rawUrl &&
      rawUrl.includes("open-peeps-bust") &&
      !rawUrl.includes("micah") &&
      !rawUrl.includes("360 360")
    ) {
      let raw = rawUrl.trim();
      if (raw.startsWith("data:image/svg+xml")) {
        const commaIdx = raw.indexOf(",");
        if (commaIdx > 0) {
          const payload = raw.slice(commaIdx + 1);
          try {
            raw = raw.includes(";base64,") ? atob(payload) : decodeURIComponent(payload);
          } catch {
            // Keep raw if decoding fails
          }
        }
      }
      // Unwrap DiceBear's viewboxMask FIRST before stripping background <rect>s so the head/face is never masked out!
      raw = raw
        .replace(/<mask[^>]*id="viewboxMask"[^>]*>[\s\S]*?<\/mask>/gi, "")
        .replace(/\s*mask="url\(#viewboxMask\)"/gi, "")
        .replace(/<rect[^>]*?(?:width="100%"|width="360")[^>]*?>/gi, "");
      // Guarantee bright high-contrast shirt against dark card (#181615)
      raw = raw.replace(/fill="#(?:262e33|181615|1f2937|111827|000000|241c16)"/gi, 'fill="#e84a27"');
      // Normalize viewBox so BOTH the full head (y=36..568) AND sweater torso (y=568..725) fit with zero clipping
      raw = raw.replace(/viewBox="[^"]+"/, 'viewBox="64 20 576 710"');
      return raw.startsWith("data:") ? raw : "data:image/svg+xml;charset=utf-8," + encodeURIComponent(raw);
    }

    // Otherwise ALWAYS generate a clean transparent Open Peeps Upper-Body Bust (head + neck + sweater torso, zero background square)
    const presets: OpenPeepsPresetId[] = ["male1", "male2", "female1", "female2"];
    const seedStr = post.author?.handle || (post as any).user_handle || (post as any).user_id || post.id || "guest";
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
      hash = (hash << 5) - hash + seedStr.charCodeAt(i);
      hash |= 0;
    }
    const chosenPreset = presets[Math.abs(hash) % presets.length];
    return getCachedPresetAvatar(chosenPreset);
  }, [post.author?.avatar_url, post.author?.handle, post.id]);

  const handleCardClick = () => {
    if (isPopup && !hasConfirmedLocation) {
      handleOpenDetails();
    } else {
      flyToSpot(post.spot_coords, post.spot_id);
    }
  };

  const popupInstagramUrl =
    popupMeta?.instagram_url ||
    (linkedVenue?.website_uri?.includes("instagram.com") ? linkedVenue.website_uri : null) ||
    ((linkedVenue?.vibe_signals as any)?.instagram_url ?? null);

  const popupDateOnlyLine = React.useMemo(() => {
    if (!isPopup) return null;
    const rawDates = (popupMeta?.dates_label || post.drop_badge || "").replace(/\s*Drop$/i, "").trim();
    if (rawDates && !rawDates.toLowerCase().includes("tba")) {
      return rawDates;
    }
    const hours = popupMeta?.daily_hours || linkedVenue?.current_opening_hours_text;
    if (hours && !hours.toLowerCase().includes("tba")) {
      return hours.replace(/\s*until sold out/i, "").trim();
    }
    if (isPopupInactive) return "Next Drop TBA";
    return "Weekend Drop";
  }, [isPopup, popupMeta?.dates_label, popupMeta?.daily_hours, post.drop_badge, linkedVenue?.current_opening_hours_text, isPopupInactive]);

  return (
    <article
      style={{ contain: "layout paint style" }}
      onClick={handleCardClick}
      className={`group relative w-full rounded-[26px] overflow-hidden border bg-[#181615] shadow-md hover:shadow-xl transition-shadow duration-200 cursor-pointer select-none ${
        isSelected ? "ring-2 ring-[#E84A27]" : ""
      } ${
        isPopupActive
          ? "border-[#E84A27]/40 dark:border-[#E84A27]/50 shadow-[0_4px_20px_rgba(232,74,39,0.14)]"
          : isPopupInactive
          ? "border-black/[0.08] dark:border-white/10 opacity-95"
          : "border-black/[0.08] dark:border-white/10"
      } ${
        popupStatus.isDimmedCard ? "opacity-50 grayscale-[20%]" : ""
      }`}
    >
      {/* Full-Bleed Photography Hero Container */}
      <div className={`relative w-full overflow-hidden bg-[#E8E0D2] dark:bg-[#24201D] ${
        isGridMode ? "aspect-[4/5] min-h-[220px] sm:min-h-[260px]" : "aspect-[4/3] min-h-[320px]"
      }`}>
        <Image
          src={
            post.image_url?.startsWith("/api/places/photos") && !post.image_url.includes("w=")
              ? `${post.image_url}&w=640`
              : post.image_url
          }
          alt={post.dish_name}
          fill
          unoptimized={post.image_url?.startsWith("/") || post.image_url?.startsWith("data:")}
          priority={priority || (typeof index === "number" && index < 4)}
          loading={priority || (typeof index === "number" && index < 6) ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => {
            if (post.image_url) LOADED_FEED_IMAGES.add(post.image_url);
            setImgReady(true);
          }}
          className="object-cover w-full opacity-100 transition-transform duration-700 ease-out group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
        />

        <div
          aria-hidden="true"
          className={`smakr-shimmer absolute inset-0 pointer-events-none transition-opacity duration-150 ${
            imgReady ? "opacity-0" : "opacity-100"
          }`}
        />

        {/* Seamless Dark Gradient Overlay covering the bottom 60% */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-transparent pointer-events-none" />

        {/* Floating Top Badges (Over Image) */}
        <div className="absolute top-3 inset-x-3 flex items-start justify-between gap-2 z-10 pointer-events-auto">
          {/* Top-Left: Pop-up / Price / Kitchen Badge */}
          <div className="flex flex-wrap items-center gap-1.5 max-w-[75%]">
            {/* Pop-up Badge in Top-Left (Clean neutral paper badge, icon + "Pop-Up", no orange background) */}
            {isPopup && (
              <span
                className={`font-comico font-bold tracking-tight rounded-full shadow-md flex items-center gap-1.5 whitespace-nowrap bg-[#FAF7F2]/95 backdrop-blur-xs text-[#181615] border border-black/12 ${
                  isGridMode ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1 text-xs"
                }`}
              >
                <SmakrFoodIcon name="popup" className={`${isGridMode ? "w-3.5 h-3.5" : "w-4 h-4"} shrink-0`} />
                <span>Pop-Up</span>
              </span>
            )}

            {/* Price for non-popups in Top-Left (Pop-ups render price in Top-Right) */}
            {!isPopup && typeof post.price_nok === "number" && post.price_nok > 0 ? (
              <span
                className={`font-comico font-bold tracking-tight bg-[#e84a27] text-white rounded-full shadow-md rotate-[-1deg] whitespace-nowrap ${
                  isGridMode ? "px-2.5 py-1 text-[11px]" : "px-3 py-1 text-xs"
                }`}
              >
                {post.price_nok} kr
              </span>
            ) : !isPopup && !isGridMode && isViewerAdmin ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setQuickEditPost(post);
                }}
                className="font-comico font-bold tracking-tight bg-black/65 hover:bg-[#e84a27] text-zinc-100 border border-white/20 px-2.5 py-1 rounded-full text-[11px] shadow-md transition-colors whitespace-nowrap"
                title="Add NOK price"
              >
                {post.price_tier || linkedVenue?.price_level ? `${post.price_tier || linkedVenue?.price_level} · + kr` : "+ Add kr"}
              </button>
            ) : !isPopup && (post.price_tier || linkedVenue?.price_level) ? (
              <span
                className={`font-comico font-bold tracking-tight bg-black/75 text-zinc-200 border border-white/15 rounded-full shadow-md whitespace-nowrap ${
                  isGridMode ? "px-2.5 py-1 text-[11px]" : "px-2.5 py-1 text-xs"
                }`}
              >
                {post.price_tier || linkedVenue?.price_level}
              </span>
            ) : null}

            {/* Live Kitchen Batch Badges (1-column mode only to keep 2-col grid clean) */}
            {!isGridMode && activeKitchenStatus === "fresh_batch" && (
              <span className="bg-[#e84a27] text-white font-bold px-2.5 py-1 rounded-full text-[11px] shadow-md flex items-center gap-1 animate-pulse whitespace-nowrap">
                <span>🔥</span>
                <span>Fresh Batch</span>
              </span>
            )}
            {!isGridMode && activeKitchenStatus === "low_stock" && (
              <span className="bg-amber-500 text-zinc-950 font-bold px-2.5 py-1 rounded-full text-[11px] shadow-md flex items-center gap-1 whitespace-nowrap">
                <span>⚡</span>
                <span>Few Left Today</span>
              </span>
            )}
            {!isGridMode && activeKitchenStatus === "sold_out" && (
              <span className="bg-zinc-900/90 text-zinc-300 font-bold px-2.5 py-1 rounded-full text-[11px] border border-white/20 flex items-center gap-1 whitespace-nowrap">
                <span>❌</span>
                <span>Sold Out Today</span>
              </span>
            )}

            {!isPopup && !isGridMode && popupStatus.status === "active" && (
              <span className="bg-[#E84A27] text-white font-bold px-2.5 py-1 rounded-full text-[11px] shadow-sm flex items-center gap-1 whitespace-nowrap">
                <Flame className="w-3 h-3 fill-white" />
                <span>{popupStatus.label}</span>
              </span>
            )}
            {!isPopup && !isGridMode && popupStatus.status === "grace" && (
              <span className="bg-zinc-800/90 text-zinc-300 font-medium px-2.5 py-1 rounded-full text-[11px] border border-white/10 whitespace-nowrap">
                {popupStatus.label}
              </span>
            )}

            {/* Food Truck Badge */}
            {!isGridMode && linkedVenue?.spot_type === "food_truck" && (
              <span className="bg-emerald-600 text-white font-bold px-2.5 py-1 rounded-full text-[11px] shadow-md flex items-center gap-1 whitespace-nowrap">
                <span>🚚</span>
                <span>Food Truck</span>
              </span>
            )}
          </div>

          {/* Top-Right: Admin Quick Edit + Rating pill (or Pop-Up Price Pill) + Save bookmark */}
          <div className="flex items-center gap-1.5 shrink-0">
            {isViewerAdmin && !isGridMode && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setQuickEditPost(post);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 hover:bg-white text-[#e84a27] shadow-md border border-white/50 text-[11px] font-bold tracking-wide transition-all hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
                title="Admin Quick Edit"
                aria-label="Admin Quick Edit"
              >
                <Pencil className="w-3 h-3 text-[#e84a27]" />
                <span>Edit</span>
              </button>
            )}

            {/* Pop-Up Price Pill in Top-Right next to Bookmark */}
            {isPopup && typeof post.price_nok === "number" && post.price_nok > 0 && (
              <span className="font-comico font-bold tracking-tight bg-[#e84a27] text-white px-2.5 py-1 rounded-full text-xs shadow-md whitespace-nowrap">
                {post.price_nok} kr
              </span>
            )}

            {/* Regular Spot Rating Pill (hidden in 2-col grid mode to de-clutter top row) */}
            {!isPopup && !isGridMode && (
              <span className="bg-black/75 text-amber-400 font-bold px-2.5 py-1 rounded-full text-xs border border-white/10 flex items-center gap-1 shadow-xs whitespace-nowrap">
                <span className="text-amber-400 text-xs">★</span>
                <span className="font-sans font-bold text-white text-xs tracking-tight">{displayRating}</span>
              </span>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleSave();
              }}
              className={`p-1.5 rounded-full border transition-all active:scale-95 ${
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
            <div className="p-3.5 rounded-full bg-white/30 shadow-xl">
              <ThumbsUp className="w-10 h-10 text-white fill-[#e84a27] stroke-white" />
            </div>
          </div>
        )}

        {/* Overlaid Editorial Content (Bottom Half of Photo) */}
        <div className={`absolute bottom-0 inset-x-0 z-10 flex flex-col justify-end pointer-events-auto ${
          isGridMode ? "p-2.5 sm:p-3" : "p-3.5 sm:p-4"
        }`}>
          {/* Dish Title (Comico brand font — 2 lines allowed in grid mode) */}
          <h3 className={`font-comico font-black tracking-wide leading-[1.15] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)] capitalize ${
            isGridMode
              ? "text-[14px] sm:text-[15px] line-clamp-2"
              : "text-[21px] sm:text-[23px] line-clamp-1"
          }`}>
            {post.dish_name}
          </h3>

          {/* Pop-Up Date Only Under Title */}
          {isPopup && popupDateOnlyLine && !isGridMode && (
            <div className="mt-1 flex items-center gap-1.5 text-[12px] font-bold text-[#FF8566] drop-shadow-xs">
              <Calendar className="w-3.5 h-3.5 text-[#E84A27] shrink-0" />
              <span>{popupDateOnlyLine}</span>
            </div>
          )}

          {/* Venue & Location (Pop-Up Icon + Pop-Up Name for pop-ups; MapPin + Venue Name for regular spots) */}
          <div className={`${isGridMode ? "text-[11.5px]" : "text-[13.5px]"} font-semibold text-white/95 drop-shadow-xs mt-1 flex items-center gap-1.5 flex-wrap`}>
            {isPopup ? (
              <SmakrFoodIcon name="popup" className={`${isGridMode ? "w-4 h-4" : "w-4 h-4"} shrink-0`} />
            ) : (
              <MapPin className={`${isGridMode ? "w-3.5 h-3.5" : "w-[15px] h-[15px]"} text-[#e84a27] shrink-0`} />
            )}
            <span className="font-semibold text-white truncate max-w-[175px] sm:max-w-none">
              {post.spot_name}
            </span>
            {!isGridMode && (
              <>
                <span className="text-zinc-400">·</span>
                <span>{hasConfirmedLocation ? locationInfo.neighborhood : "Location TBA"}</span>
              </>
            )}
            {hasConfirmedLocation && walkingDistance && !isGridMode && (
              <span className="text-emerald-400 font-semibold font-mono text-[11px]">
                · {walkingDistance}
              </span>
            )}
            {linkedVenue?.spot_type === "food_truck" && linkedVenue.location_schedule && !isGridMode && (
              <div className="w-full text-[11px] font-mono text-emerald-300 flex items-center gap-1 mt-0.5">
                <span>🚚</span>
                <span className="truncate">{linkedVenue.location_schedule}</span>
              </div>
            )}
          </div>

          {/* Kitchen Live Batch Soundbite */}
          {kitchenBatchNote && activeKitchenStatus !== null && !isGridMode && (
            <div className="bg-orange-500/20 border border-orange-500/35 rounded-xl px-2.5 py-1.5 my-1.5 max-w-[96%] flex items-center gap-1.5 text-[11px] text-orange-200">
              <span className="shrink-0">👨‍🍳</span>
              <span className="font-medium italic leading-snug line-clamp-1">
                &ldquo;{kitchenBatchNote}&rdquo;
              </span>
            </div>
          )}

          {/* Author & Interactive Actions Footer (Hidden in 2-col Grid Mode) */}
          {!isGridMode && (
            <div className={`flex items-center ${isPopup ? "justify-end" : "justify-between"} gap-2 pt-1.5 mt-0.5 flex-wrap`}>
              {/* Left: Author Avatar Badge + @handle (inline and grounded) */}
              {!isPopup && (
                <div className="flex items-center gap-2 min-w-0">
                  {isNiwacheAdmin ? (
                    <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full overflow-hidden bg-black/40 border border-white/25 shrink-0 flex items-center justify-center shadow-xs">
                      <div className="w-9 h-9 translate-y-1">
                        <OfficialSmakrMascot size={36} />
                      </div>
                    </div>
                  ) : (
                    <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full overflow-hidden bg-black/40 border border-white/25 shrink-0 flex items-center justify-center shadow-xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={avatarSrc}
                        alt={post.author?.handle || "author"}
                        className="w-full h-full object-cover pointer-events-none"
                      />
                    </div>
                  )}
                  <span className="text-[12px] font-bold text-zinc-100 truncate max-w-[110px] leading-none self-center drop-shadow-xs">
                    {post.author?.handle?.startsWith("@") ? post.author.handle : `@${post.author?.handle || "smak"}`}
                  </span>
                </div>
              )}

              {/* Right Group: Tactile Actions */}
              <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                {/* Action 1: Clean Circular Share Icon Button */}
                <button
                  type="button"
                  onClick={handleShareDish}
                  className="relative before:absolute before:-inset-2 before:content-[''] touch-manipulation h-9 w-9 rounded-full bg-[#181615]/75 hover:bg-[#181615] border border-white/20 text-[#FAF7F2] active:scale-90 transition-all flex items-center justify-center cursor-pointer shrink-0"
                  title="Send 'Spise her?' to a friend"
                  aria-label="Share dish"
                >
                  <Send className="w-3.5 h-3.5 stroke-[2] -translate-x-[0.5px] translate-y-[0.5px]" />
                </button>

                {/* Pop-Up IG ↗ Pill right next to MAP ↗ */}
                {isPopup && popupInstagramUrl && (
                  <a
                    href={popupInstagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="relative before:absolute before:-inset-2 before:content-[''] touch-manipulation h-9 px-3 text-xs rounded-full bg-[#181615]/80 hover:bg-[#E84A27] text-[#FAF7F2] hover:text-white border border-white/20 shadow-sm active:scale-95 transition-all font-bold flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap"
                    title="Follow on Instagram for drop alerts"
                    aria-label="Follow on Instagram"
                  >
                    <span className="font-comico font-bold tracking-tight">IG</span>
                    <ArrowUpRight className="w-3 h-3 stroke-[2.8] text-[#E84A27]" />
                  </a>
                )}

                {/* Action 2: Clean Solid Cream [Map ↗] Button */}
                {hasConfirmedLocation ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFlyToRadar(e);
                    }}
                    className="relative before:absolute before:-inset-2 before:content-[''] touch-manipulation h-9 px-3.5 text-xs rounded-full bg-[#FAF7F2] hover:bg-white text-[#181615] border border-[#181615]/15 shadow-sm active:scale-95 transition-transform duration-100 font-bold flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap"
                    title="Locate on map"
                    aria-label="Locate on map"
                  >
                    <span className="font-comico font-bold tracking-tight text-[#181615]">Map</span>
                    <ArrowUpRight className="w-3 h-3 stroke-[2.8] text-[#E84A27]" />
                  </button>
                ) : isPopup ? (
                  <button
                    type="button"
                    onClick={handleOpenDetails}
                    className="h-9 px-3.5 text-xs rounded-full bg-[#FAF7F2] text-[#181615] border-2 border-[#181615] shadow-[0_2px_0_#181615] hover:bg-[#E84A27] hover:text-white hover:border-[#181615] active:translate-y-[1px] active:shadow-none transition-all font-extrabold flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap"
                    title="View drop details"
                    aria-label="View drop details"
                  >
                    <span>Details</span>
                    <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
                  </button>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
});
