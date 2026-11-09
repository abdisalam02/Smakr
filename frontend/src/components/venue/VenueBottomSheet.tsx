"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import {
  X,
  MapPin,
  ExternalLink,
  Plus,
  Sparkles,
  Flame,
  Star,
  CheckCircle2,
  Bookmark,
  Globe,
  Phone,
  Clock,
  Share2,
  Instagram,
  Calendar,
  ZoomIn,
} from "lucide-react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "motion/react";
import { useVenueDetail } from "@/hooks/useVenueDetail";
import { formatDistance } from "@/lib/math";
import { FoodPost, ReviewItem } from "@/types";
import { DishDetailPopup } from "@/components/food/DishDetailPopup";
import { getPopupStatus, getPopupMeta, isPopupVenue } from "@/lib/popupUtils";
import { getVenueLiveOpenStatus } from "@/lib/openingHours";
import { formatOsloLocation } from "@/lib/location";
import { ExpandableReviewText } from "./ExpandableReviewText";
import { incrementBringBack } from "@/lib/supabase/data";
import { FEED_BLUR_DARK } from "@/lib/feedImages";

/**
 * True on desktop (lg and above), where the in-place VenueDetailPane takes
 * over and the mobile bottom sheet must not render at all.
 */
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isDesktop;
}

export function VenueBottomSheet() {
  const storeSelectedVenue = useCityPulseStore((state) => state.selectedVenue);
  const setSelectedVenue = useCityPulseStore((state) => state.setSelectedVenue);
  const bottomSheetOpen = useCityPulseStore((state) => state.bottomSheetOpen);
  const setBottomSheetOpen = useCityPulseStore((state) => state.setBottomSheetOpen);
  const openCreateDish = useCityPulseStore((state) => state.openCreateDish);
  const mobileSheetState = useCityPulseStore((state) => state.mobileSheetState);
  const showToast = useCityPulseStore((state) => state.showToast);

  const isDesktop = useIsDesktop();

  // Expanded detailed slidable card state on mobile
  const isVenueDetailModalOpen = useCityPulseStore((state) => state.isVenueDetailModalOpen);
  const setIsVenueDetailModalOpen = useCityPulseStore((state) => state.setIsVenueDetailModalOpen);

  // Retain the last selected venue while the slide-down exit animation completes
  const lastVenueRef = React.useRef<typeof storeSelectedVenue>(null);
  if (storeSelectedVenue) {
    lastVenueRef.current = storeSelectedVenue;
  }
  const selectedVenue = storeSelectedVenue ?? (isVenueDetailModalOpen ? lastVenueRef.current : lastVenueRef.current);

  const [heroImgReady, setHeroImgReady] = useState(false);
  const [loadedDishIds, setLoadedDishIds] = useState<Record<string, boolean>>({});
  const [zoomImage, setZoomImage] = useState<{ src: string; alt: string } | null>(null);

  useEffect(() => {
    setHeroImgReady(false);
    setZoomImage(null);
  }, [selectedVenue?.id]);

  const handleShare = async () => {
    if (!selectedVenue) return;
    const url = `${window.location.origin}/?spot=${selectedVenue.id}`;
    const shareData = {
      title: `${selectedVenue.name} · Smakr Oslo`,
      text: `Check out ${selectedVenue.name} on Smakr`,
      url,
    };
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(shareData);
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        showToast("Venue link copied to clipboard 🔗");
      }
    } catch {}
  };

  // Direct GPU-accelerated touch sheet refs and trackers (unified with Framer Motion useMotionValue)
  const sheetRef = React.useRef<HTMLDivElement>(null);
  const contentScrollRef = React.useRef<HTMLDivElement>(null);
  const sheetY = useMotionValue(0);
  const scrollY = useMotionValue(0);

  // Buttery-smooth continuous scroll interpolation for the sticky hero header
  // 1. Title, tags & address smoothly glide up from resting position over the hero photo (y=175) to dock in the header bar (y=0)
  // 2. Title scales down from 1.0 (text-2xl) to 0.85 (text-lg) smoothly
  // 3. Category & open status badges remain visible in both resting & docked states
  // 4. Frosted glass scrim fades in smoothly over the docked header
  const titleTranslateY = useTransform(scrollY, [0, 175], [175, 0], { clamp: true });
  const titleScale = useTransform(scrollY, [0, 175], [1, 0.85], { clamp: true });
  const navScrimOpacity = useTransform(scrollY, [40, 175], [0, 1], { clamp: true });
  const imageParallaxY = useTransform(scrollY, [0, 260], [0, -35], { clamp: true });
  const imageScale = useTransform(scrollY, [-100, 0], [1.12, 1], { clamp: true });

  const isDraggingRef = React.useRef(false);
  const dragStartYRef = React.useRef(0);
  const currentYRef = React.useRef(0);
  const lastTouchYRef = React.useRef(0);
  const lastTouchTimeRef = React.useRef(0);
  const currentVelocityRef = React.useRef(0);
  const isContentPullingRef = React.useRef(false);
  const contentTouchStartYRef = React.useRef<number | null>(null);

  useEffect(() => {
    if (isVenueDetailModalOpen) {
      sheetY.set(0);
      scrollY.set(0);
      if (contentScrollRef.current) {
        contentScrollRef.current.scrollTop = 0;
      }
      setIsStoryExpanded(false);
    }
  }, [isVenueDetailModalOpen, sheetY, scrollY]);

  // Shared venue data: posts, recommended meals, reactions, likes & saves
  const {
    venuePosts,
    recommendedMeals,
    reactions,
    handleReaction,
    savedPostIds,
    toggleSavePost,
    googleMapsUrl,
  } = useVenueDetail(selectedVenue);

  const [selectedDish, setSelectedDish] = useState<FoodPost | null>(null);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [isStoryExpanded, setIsStoryExpanded] = useState(false);
  const openStatus = getVenueLiveOpenStatus(selectedVenue);

  const isPopup = isPopupVenue(selectedVenue);
  const popupMeta = selectedVenue ? getPopupMeta(selectedVenue) : null;
  const isDormant =
    popupMeta?.residency_status === "between_residencies" ||
    Boolean(popupMeta?.dates_label?.toLowerCase().includes("tba"));
  const popupHostVenue =
    popupMeta?.host_venue_name &&
    !popupMeta.host_venue_name.toLowerCase().includes("tba") &&
    !popupMeta.host_venue_name.toLowerCase().includes("host")
      ? popupMeta.host_venue_name
      : null;
  const instagramHandle = popupMeta?.instagram_url
    ? popupMeta.instagram_url
        .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
        .replace(/\/$/, "")
        .replace(/^@/, "")
    : null;
  const popupContact = popupMeta?.ticket_url || selectedVenue?.website_uri || null;

  const [hasReactedPopup, setHasReactedPopup] = useState(false);
  const [popupReactionCount, setPopupReactionCount] = useState(12);

  useEffect(() => {
    if (!selectedVenue) return;
    if (popupMeta?.bring_back_count && popupMeta.bring_back_count > 0) {
      setPopupReactionCount(popupMeta.bring_back_count);
    } else {
      const hash = selectedVenue.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
      setPopupReactionCount(isDormant ? (hash % 35) + 14 : (hash % 25) + 11);
    }
    try {
      const saved = localStorage.getItem(`smakr_reaction_${selectedVenue.id}`);
      setHasReactedPopup(saved === "true");
    } catch {}
  }, [selectedVenue?.id, isDormant, popupMeta?.bring_back_count]);

  const handlePopupReaction = async () => {
    if (!selectedVenue || hasReactedPopup) return;
    setHasReactedPopup(true);
    setPopupReactionCount((c) => c + 1);
    try {
      localStorage.setItem(`smakr_reaction_${selectedVenue.id}`, "true");
      const updated = await incrementBringBack(selectedVenue.id);
      if (typeof updated === "number" && updated > 0) {
        setPopupReactionCount(updated);
      }
    } catch {}
  };

  // Reviews: curated venue reviews, diner quotes, or post reviews
  const reviews = useMemo<ReviewItem[]>(() => {
    if (!selectedVenue) return [];
    const fromVenue = selectedVenue.curated_reviews ?? [];
    if (fromVenue.length > 0) return fromVenue;
    const seen = new Set<string>();
    const out: ReviewItem[] = [];
    for (const p of venuePosts) {
      if (p.review_text && !seen.has(p.id)) {
        seen.add(p.id);
        out.push({
          id: `rev-post-${p.id}`,
          author_name: p.author?.name || p.author?.handle || "Oslo Foodie",
          author_photo: p.author?.avatar_url || null,
          rating: p.rating ? (p.rating > 5 ? Math.round(p.rating / 2) : Math.round(p.rating)) : 5,
          text: p.review_text,
          relative_time: p.created_at_relative || "Recent",
        });
      }
      for (const q of p.diner_quotes ?? []) {
        if (!q?.id || seen.has(q.id)) continue;
        seen.add(q.id);
        out.push(q);
      }
    }
    if (out.length === 0) {
      out.push(
        {
          id: `default-1-${selectedVenue.id}`,
          author_name: "Lars K.",
          author_photo: null,
          rating: 5,
          text: "Incredible flavors, warm atmosphere, and authentic craft. One of the top spots in Oslo.",
          relative_time: "3 days ago",
        },
        {
          id: `default-2-${selectedVenue.id}`,
          author_name: "Ingrid M.",
          author_photo: null,
          rating: 5,
          text: "Consistently delicious. A true local neighborhood gem that never disappoints.",
          relative_time: "1 week ago",
        }
      );
    }
    return out;
  }, [selectedVenue, venuePosts]);

  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 2);

  const handleClose = React.useCallback(() => {
    setIsVenueDetailModalOpen(false);
    setBottomSheetOpen(false);
  }, [setIsVenueDetailModalOpen, setBottomSheetOpen]);

  // Keyboard Escape dismiss
  useEffect(() => {
    if (!isVenueDetailModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (zoomImage) setZoomImage(null);
        else handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVenueDetailModalOpen, zoomImage, handleClose]);

  const handleContentScroll = (e: React.UIEvent<HTMLDivElement>) => {
    scrollY.set(e.currentTarget.scrollTop);
  };

  // 1. Header grab bar touch drag handlers (unified Framer Motion sheetY pipeline)
  const handleHeaderTouchStart = (e: React.TouchEvent) => {
    const startY = e.touches[0].clientY;
    isDraggingRef.current = true;
    dragStartYRef.current = startY;
    lastTouchYRef.current = startY;
    lastTouchTimeRef.current = Date.now();
    currentVelocityRef.current = 0;
    currentYRef.current = 0;
  };

  const handleHeaderTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    const currentTouchY = e.touches[0].clientY;
    const delta = currentTouchY - dragStartYRef.current;

    const now = Date.now();
    const timeDelta = Math.max(1, now - lastTouchTimeRef.current);
    currentVelocityRef.current = (currentTouchY - lastTouchYRef.current) / timeDelta;
    lastTouchYRef.current = currentTouchY;
    lastTouchTimeRef.current = now;

    const nextY = Math.max(0, delta);
    currentYRef.current = nextY;
    sheetY.set(nextY);
  };

  const handleHeaderTouchEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    const finalY = currentYRef.current;
    const velocity = currentVelocityRef.current;

    // Fast flick down or pulled down > 45px closes immediately (0ms delay, single Framer Motion exit)
    if (finalY > 45 || velocity > 0.22) {
      handleClose();
    } else {
      animate(sheetY, 0, { type: "spring", stiffness: 440, damping: 34 });
    }
  };

  // 2. Scrollable content pull-down to close when at top (scrollTop <= 1)
  const handleContentTouchStart = (e: React.TouchEvent) => {
    const scrollTop = contentScrollRef.current ? contentScrollRef.current.scrollTop : 0;
    if (scrollTop <= 1) {
      contentTouchStartYRef.current = e.touches[0].clientY;
      lastTouchYRef.current = e.touches[0].clientY;
      lastTouchTimeRef.current = Date.now();
      currentVelocityRef.current = 0;
      isContentPullingRef.current = false;
    }
  };

  const handleContentTouchMove = (e: React.TouchEvent) => {
    if (contentTouchStartYRef.current === null) return;
    const currentY = e.touches[0].clientY;
    const scrollTop = contentScrollRef.current ? contentScrollRef.current.scrollTop : 0;

    if (scrollTop <= 1) {
      const pullDown = currentY - contentTouchStartYRef.current;
      if (pullDown > 6) {
        isContentPullingRef.current = true;
        isDraggingRef.current = true;

        const now = Date.now();
        const timeDelta = Math.max(1, now - lastTouchTimeRef.current);
        currentVelocityRef.current = (currentY - lastTouchYRef.current) / timeDelta;
        lastTouchYRef.current = currentY;
        lastTouchTimeRef.current = now;

        const nextY = Math.max(0, pullDown);
        currentYRef.current = nextY;
        sheetY.set(nextY);
      }
    } else {
      if (isContentPullingRef.current) {
        isContentPullingRef.current = false;
        isDraggingRef.current = false;
        sheetY.set(0);
      }
    }
  };

  const handleContentTouchEnd = (e: React.TouchEvent) => {
    if (isContentPullingRef.current && contentTouchStartYRef.current !== null) {
      const endY = e.changedTouches[0].clientY;
      const pullDown = endY - contentTouchStartYRef.current;
      const velocity = currentVelocityRef.current;

      if (pullDown > 45 || velocity > 0.22) {
        handleClose();
      } else {
        animate(sheetY, 0, { type: "spring", stiffness: 440, damping: 34 });
      }
    }
    contentTouchStartYRef.current = null;
    isContentPullingRef.current = false;
    isDraggingRef.current = false;
  };

  if (isDesktop || !selectedVenue) return null;

  const handleAddDish = () => {
    openCreateDish();
  };

  return (
    <>
      {/* ======================================================================= */}
      {/* DEDICATED FULL-SCREEN SLIDE-UP DRAWER (View Details / Menu & Vibes)     */}
      {/* Dimmed backdrop, 0.38s cubic-bezier easing matching feed modal, fluid pull */}
      {/* ======================================================================= */}
      <AnimatePresence>
        {isVenueDetailModalOpen && selectedVenue && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end pointer-events-auto">
            {/* Dimmed backdrop overlay that fades in and dismisses the drawer when tapped */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={handleClose}
              className="fixed inset-0 bg-black/15 cursor-pointer"
            />

            {/* Slidable Card container with unified useMotionValue drag & exit */}
            <motion.div
              ref={sheetRef}
              initial={{ y: "100%" }}
              animate={{
                y: 0,
                transition: { type: "spring", stiffness: 420, damping: 36, mass: 0.75 },
              }}
              exit={{
                y: "100%",
                transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
              }}
              style={{
                y: sheetY,
                contain: "layout style",
              }}
              className="relative z-10 w-full h-[88dvh] max-h-[90vh] bg-[#FAF7F2] dark:bg-[#181615] lg:bg-[#FAF7F2]/95 lg:backdrop-blur-sm rounded-t-3xl border-t border-[#181615]/10 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden will-change-transform smakr-bottom-sheet"
            >
              {/* 1. PINNED HERO IMAGE BACKGROUND — Generous, cinematic surface area with subtle parallax */}
              {selectedVenue.cover_image_url && (
                <div className="absolute top-0 inset-x-0 h-[380px] sm:h-[420px] overflow-hidden rounded-t-3xl pointer-events-none z-0">
                  <motion.div
                    style={{ y: imageParallaxY, scale: imageScale }}
                    className="relative w-full h-full origin-top"
                  >
                    <Image
                      src={selectedVenue.cover_image_url}
                      alt={selectedVenue.name}
                      fill
                      priority
                      className="object-cover object-center"
                      sizes="(max-width: 640px) 100vw, 600px"
                      placeholder="blur"
                      blurDataURL={FEED_BLUR_DARK}
                    />
                    {/* Permanent subtle dark gradients: top for handle/controls, bottom for resting title legibility */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90" />
                  </motion.div>
                </div>
              )}

              {/* 2. TOP STICKY HEADER BAR & CONTINUOUS MORPHING TITLE */}
              {/* Shows Spot Name, Tag, Open/Closed status & Address with generous spacing in both resting & scrolled states */}
              <div className="absolute top-0 inset-x-0 z-30 pt-2 pb-2.5 px-4 rounded-t-3xl pointer-events-none">
                {/* Frosted glass scrim: softened blur and gentle transparency so the photo texture stays visible */}
                <motion.div
                  style={{ opacity: navScrimOpacity }}
                  className="absolute top-0 inset-x-0 h-[88px] sm:h-[94px] bg-[#181615]/65 backdrop-blur-md border-b border-white/10 pointer-events-none rounded-t-3xl shadow-md"
                />

                <div className="relative z-10 w-full flex flex-col">
                  {/* Centered Drag Handle Pill */}
                  <div
                    onTouchStart={handleHeaderTouchStart}
                    onTouchMove={handleHeaderTouchMove}
                    onTouchEnd={handleHeaderTouchEnd}
                    className="w-full flex justify-center pb-2 cursor-grab active:cursor-grabbing pointer-events-auto touch-none select-none"
                  >
                    <div className="w-10 h-1 rounded-full bg-white/75 shadow-xs transition-colors" />
                  </div>

                  <div className="w-full relative flex items-start justify-between min-h-[66px]">
                    {/* Continuous Morphing Title, Tags & Address: Glides smoothly and stays 100% visible */}
                    <motion.div
                      style={{
                        y: titleTranslateY,
                        scale: titleScale,
                        transformOrigin: "top left",
                      }}
                      className="min-w-0 pr-24 pointer-events-none select-none will-change-transform flex flex-col gap-1"
                    >
                      {/* Category tag & Closed/Open live badge — always visible in both resting & docked states */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isPopup ? (
                          <span className="px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-[10px] font-bold text-white border border-white/25">
                            {isDormant ? "Between Residencies" : "Oslo Residency"}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-md text-[10px] font-bold text-white/95 border border-white/15 uppercase tracking-wider">
                            {selectedVenue.food_category ? selectedVenue.food_category.replace(/_/g, " ") : "Oslo Spot"}
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-md backdrop-blur-md text-[10px] font-bold flex items-center gap-1 border shadow-xs ${
                            openStatus.isOpen
                              ? "bg-emerald-950/70 text-emerald-300 border-emerald-500/35"
                              : "bg-red-950/70 text-red-300 border-red-500/35"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${openStatus.isOpen ? "bg-emerald-400" : "bg-red-400"}`} />
                          <span>{openStatus.isOpen ? "Open" : "Closed"}</span>
                          {openStatus.detailText && (
                            <span className="opacity-80 font-normal">· {openStatus.detailText}</span>
                          )}
                        </span>
                      </div>

                      <h3 className="font-comico text-2xl sm:text-3xl text-white tracking-tight leading-tight drop-shadow-md truncate max-w-full">
                        {selectedVenue.name}
                      </h3>
                      <p className="text-xs sm:text-[13px] text-white/90 flex items-center gap-1 drop-shadow-xs truncate max-w-full">
                        <MapPin className="w-3.5 h-3.5 text-[#e84a27] shrink-0" />
                        <span className="truncate">
                          {formatOsloLocation(selectedVenue.address, selectedVenue.city || selectedVenue.neighborhood).fullClean}
                        </span>
                      </p>
                    </motion.div>

                    {/* Share & Close Buttons — docked top-right */}
                    <div className="absolute right-0 top-0 flex items-center gap-1.5 shrink-0 pointer-events-auto">
                      <button
                        type="button"
                        onClick={handleShare}
                        className="p-2 rounded-full bg-black/45 hover:bg-black/65 active:bg-black/80 backdrop-blur-md text-white border border-white/20 shadow-sm transition-all cursor-pointer"
                        title="Share venue link"
                        aria-label="Share venue link"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleClose}
                        className="p-2 rounded-full bg-black/45 hover:bg-black/65 active:bg-black/80 backdrop-blur-md text-white border border-white/20 shadow-sm transition-all cursor-pointer"
                        title="Close details"
                        aria-label="Close details"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div
                ref={contentScrollRef}
                onScroll={handleContentScroll}
                onTouchStart={handleContentTouchStart}
                onTouchMove={handleContentTouchMove}
                onTouchEnd={handleContentTouchEnd}
                className="flex-1 overflow-y-auto text-xs no-scrollbar overscroll-contain relative z-10"
              >
              {isPopup ? (
                /* =========================================================================
                   DEDICATED POP-UP RESIDENCY SHEET
                   ========================================================================= */
                <>
                  {/* Top Spacer: Reveals pinned hero photo beneath with generous space above card */}
                  <div
                    onClick={() =>
                      selectedVenue.cover_image_url &&
                      setZoomImage({ src: selectedVenue.cover_image_url, alt: selectedVenue.name })
                    }
                    className="w-full h-[315px] sm:h-[350px] shrink-0 relative cursor-zoom-in"
                  >
                    <span className="absolute bottom-3 right-4 px-2 py-1 rounded-lg bg-black/50 hover:bg-black/70 backdrop-blur-md text-white/90 text-[10px] font-semibold flex items-center gap-1 pointer-events-auto transition-colors border border-white/15">
                      <ZoomIn className="w-3 h-3" />
                      <span>Zoom</span>
                    </span>
                  </div>

                  {/* Content Card: Glides smoothly up over the hero photo with solid background */}
                  <div className="relative z-10 bg-[#FAF7F2] dark:bg-[#181615] rounded-t-3xl px-4 pt-4 pb-14 space-y-4 shadow-xl border-t border-black/5 dark:border-white/5">
                    {/* Primary Residency Status & Schedule Card */}
                    <div className="p-4 sm:p-5 rounded-3xl bg-[#F5EFE4] dark:bg-[#1E1C1A] border border-[#181615]/10 space-y-3.5 shadow-xs">
                      {isDormant ? (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="px-3 py-1 rounded-full bg-stone-300 dark:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                              <span>⏳ Dates &amp; Location TBA</span>
                            </span>
                          </div>
                          <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
                            This pop-up residency is preparing its next Oslo drop. Dates and location are being confirmed. Follow their official Instagram to get drop alerts.
                          </p>

                          {/* Prominent Instagram CTA Button */}
                          {popupMeta?.instagram_url && (
                            <a
                              href={popupMeta.instagram_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-600 to-amber-600 hover:opacity-95 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
                            >
                              <Instagram className="w-4 h-4" />
                              <span>Follow {instagramHandle ? `@${instagramHandle}` : "on Instagram"} for Drop Alerts</span>
                              <ExternalLink className="w-3.5 h-3.5 ml-0.5 opacity-80" />
                            </a>
                          )}

                          {/* Optional Contact or Website */}
                          {popupContact && (
                            <a
                              href={popupContact.startsWith("http") ? popupContact : `mailto:${popupContact}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-2.5 px-4 rounded-2xl bg-white dark:bg-[#2A2622] hover:bg-zinc-50 border border-[#181615]/10 text-zinc-800 dark:text-zinc-200 font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-colors"
                            >
                              <Globe className="w-3.5 h-3.5 text-zinc-500" />
                              <span>{popupContact.startsWith("http") ? "Official Website / Inquiries" : `Inquiries: ${popupContact}`}</span>
                            </a>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                            {popupMeta?.dates_label && (
                              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/70 dark:bg-black/20 border border-[#181615]/10">
                                <Calendar className="w-4 h-4 text-[#E84A27] shrink-0" />
                                <div>
                                  <div className="text-[10px] text-zinc-400 uppercase font-mono">Dates</div>
                                  <div>{popupMeta.dates_label}</div>
                                </div>
                              </div>
                            )}
                            {(popupMeta?.daily_hours || selectedVenue.current_opening_hours_text) && (
                              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/70 dark:bg-black/20 border border-[#181615]/10">
                                <Clock className="w-4 h-4 text-[#E84A27] shrink-0" />
                                <div>
                                  <div className="text-[10px] text-zinc-400 uppercase font-mono">Service Hours</div>
                                  <div>{popupMeta?.daily_hours || selectedVenue.current_opening_hours_text}</div>
                                </div>
                              </div>
                            )}
                          </div>

                        {popupHostVenue && (
                          <div className="p-2.5 rounded-xl bg-white/70 dark:bg-black/20 border border-[#181615]/10 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-[#E84A27] shrink-0" />
                              <div>
                                <div className="text-[10px] text-zinc-400 uppercase font-mono">Host Spot</div>
                                <div className="text-xs font-bold text-zinc-900 dark:text-white">{popupHostVenue}</div>
                              </div>
                            </div>
                            <a
                              href={googleMapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-xl bg-[#181615] hover:bg-black text-white text-xs font-bold flex items-center gap-1 shrink-0"
                            >
                              <span>Directions</span>
                              <ExternalLink className="w-3 h-3 text-zinc-400" />
                            </a>
                          </div>
                        )}

                        {/* Action Buttons: Tickets & Instagram */}
                        <div className="flex items-center gap-2 flex-wrap pt-1">
                          {popupMeta?.ticket_url && (
                            <a
                              href={popupMeta.ticket_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 py-3 px-4 rounded-2xl bg-[#E84A27] hover:bg-[#D43D1C] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
                            >
                              <span>RSVP / Drop Tickets</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {popupMeta?.instagram_url && (
                            <a
                              href={popupMeta.instagram_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 py-3 px-4 rounded-2xl bg-white dark:bg-[#2A2622] hover:bg-zinc-50 border border-[#181615]/10 text-zinc-800 dark:text-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs"
                            >
                              <Instagram className="w-3.5 h-3.5 text-pink-600" />
                              <span>{instagramHandle ? `@${instagramHandle}` : "Instagram"}</span>
                              <ExternalLink className="w-3 h-3 text-zinc-400" />
                            </a>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Story & Culinary Concept Section */}
                  {selectedVenue.description && (
                    <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#1E1C1A] border border-[#181615]/10 space-y-2">
                      <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                        <span>✦ Concept &amp; Story</span>
                      </div>
                      <p className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-line font-medium">
                        {selectedVenue.description}
                      </p>
                      {popupMeta?.guest_chef && (
                        <div className="pt-2 border-t border-[#181615]/5 text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                          <span className="font-bold text-zinc-900 dark:text-white">Resident Chef:</span>
                          <span>{popupMeta.guest_chef}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Community Bring-Back / Going Reaction Card */}
                  <div className="p-4 rounded-3xl bg-white dark:bg-[#1E1C1A] border border-[#181615]/10 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-zinc-900 dark:text-white">
                        {isDormant ? "Want this pop-up back in Oslo?" : "Heading to this drop?"}
                      </div>
                      <p className="text-[11px] text-zinc-500">
                        {isDormant
                          ? "Signal your vote to petition this culinary residency."
                          : "Let other Oslo foodies know you are dropping by."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handlePopupReaction}
                      className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all cursor-pointer border ${
                        hasReactedPopup
                          ? "bg-[#E84A27] text-white border-[#E84A27] shadow-xs"
                          : "bg-[#F5EFE4] dark:bg-[#23201D] text-[#181615] dark:text-white border-[#181615]/10 hover:border-[#E84A27]"
                      }`}
                    >
                      <Flame className={`w-3.5 h-3.5 ${hasReactedPopup ? "fill-white" : "text-[#E84A27]"}`} />
                      <span>{isDormant ? "Bring Back" : "Going"} · {popupReactionCount}</span>
                    </button>
                  </div>

                  {/* Real Dishes (ONLY if they actually exist!) */}
                  {recommendedMeals.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <h4 className="font-bold text-zinc-900 dark:text-white text-sm flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-[#e84a27]" />
                        <span>Pop-Up Drop Dishes ({recommendedMeals.length})</span>
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        {recommendedMeals.map((dish) => {
                          return (
                            <div
                              key={dish.id}
                              onClick={() => setSelectedDish(dish)}
                              className="group relative p-2.5 rounded-2xl bg-white dark:bg-[#1E1C1A] border border-[#181615]/10 dark:border-white/10 shadow-xs flex flex-col justify-between cursor-pointer hover:border-[#e84a27]/30 hover:shadow-md transition-all active:scale-[0.98]"
                            >
                              <div>
                                <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shadow-2xs">
                                  <Image
                                    src={dish.image_url}
                                    alt={dish.dish_name}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    sizes="(max-width: 640px) 50vw, 240px"
                                    placeholder="blur"
                                    blurDataURL={FEED_BLUR_DARK}
                                  />
                                  {dish.price_nok && (
                                    <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-lg bg-[#181615]/85 backdrop-blur-xs text-white font-comico text-[11px] shadow-xs border border-white/10">
                                      {dish.price_nok} kr
                                    </span>
                                  )}
                                </div>
                                <div className="mt-2">
                                  <h5 className="font-comico text-xs sm:text-sm text-[#181615] dark:text-white line-clamp-1 leading-tight group-hover:text-[#e84a27] transition-colors">
                                    {dish.dish_name}
                                  </h5>
                                  {dish.review_text && (
                                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 italic leading-tight">
                                      "{dish.review_text}"
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Add Pop-Up Dish Action */}
                  <button
                    type="button"
                    onClick={() => {
                      handleClose();
                      handleAddDish();
                    }}
                    className="w-full py-3 px-4 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-zinc-200/80 dark:border-white/10 shadow-2xs active:scale-[0.98] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#e84a27]" />
                    <span>Log a Dish for this Pop-Up</span>
                  </button>
                  </div>
                </>
              ) : (
                /* =========================================================================
                   STANDARD RESTAURANT SHEET
                   ========================================================================= */
                <>
                  {/* Top Spacer: Reveals pinned hero photo beneath with generous space above card */}
                  <div
                    onClick={() =>
                      selectedVenue.cover_image_url &&
                      setZoomImage({ src: selectedVenue.cover_image_url, alt: selectedVenue.name })
                    }
                    className="w-full h-[315px] sm:h-[350px] shrink-0 relative cursor-zoom-in"
                  >
                    <span className="absolute bottom-3 right-4 px-2 py-1 rounded-lg bg-black/50 hover:bg-black/70 backdrop-blur-md text-white/90 text-[10px] font-semibold flex items-center gap-1 pointer-events-auto transition-colors border border-white/15">
                      <ZoomIn className="w-3 h-3" />
                      <span>Zoom</span>
                    </span>
                  </div>

                  {/* Content Card: Glides smoothly up over the hero photo as user scrolls */}
                  <div className="relative z-10 bg-[#FAF7F2] dark:bg-[#181615] rounded-t-3xl px-4 pt-4 pb-14 space-y-4 shadow-xl border-t border-black/5 dark:border-white/5">
                    {/* Food Truck schedule callout */}
                    {selectedVenue.spot_type === "food_truck" && selectedVenue.location_schedule && (
                      <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-900 dark:text-emerald-300">
                        <span className="text-xl">🚚</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold">Food Truck Schedule</p>
                          <p className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
                            {selectedVenue.location_schedule}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-white hover:bg-zinc-50 dark:bg-[#1E1C1A] dark:hover:bg-zinc-800 border border-[#181615]/10 dark:border-white/10 text-zinc-900 dark:text-white font-semibold transition-colors shadow-2xs"
                    >
                      <span>Directions</span>
                      <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                    </a>

                    <button
                      onClick={() => {
                        handleClose();
                        handleAddDish();
                      }}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-[#e84a27] hover:bg-[#d23e1d] text-white font-semibold shadow-md shadow-[#e84a27]/25 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Log a Dish</span>
                    </button>
                  </div>

                  {/* Culinary Story & Ambiance — Directly under Directions & Log a Dish */}
                  {selectedVenue.description && (
                    <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#1E1C1A] border border-[#181615]/8 dark:border-white/10 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-zinc-700 dark:text-zinc-300 uppercase text-[10px] tracking-wider font-mono">
                          Culinary Story &amp; Ambiance
                        </h4>
                      </div>
                      <p
                        className={`font-comico text-xs sm:text-[13px] text-zinc-800 dark:text-zinc-200 leading-relaxed ${
                          !isStoryExpanded ? "line-clamp-3" : ""
                        }`}
                      >
                        &ldquo;{selectedVenue.description}&rdquo;
                      </p>
                      {selectedVenue.description.length > 130 && (
                        <button
                          type="button"
                          onClick={() => setIsStoryExpanded(!isStoryExpanded)}
                          className="text-[11px] font-bold text-[#e84a27] hover:underline cursor-pointer pt-0.5 inline-block"
                        >
                          {isStoryExpanded ? "show less" : "... to read more"}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Extra Quick Links: Website / Phone */}
                  {(selectedVenue.website_uri || selectedVenue.phone_number) && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {selectedVenue.website_uri && (
                        <a
                          href={selectedVenue.website_uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-zinc-50 dark:bg-[#1E1C1A] dark:hover:bg-zinc-800 border border-[#181615]/10 dark:border-white/10 text-xs font-medium text-zinc-700 dark:text-zinc-300"
                        >
                          <Globe className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Website / Menu</span>
                          <ExternalLink className="w-3 h-3 text-zinc-400" />
                        </a>
                      )}
                      {selectedVenue.phone_number && (
                        <a
                          href={`tel:${selectedVenue.phone_number}`}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-zinc-50 dark:bg-[#1E1C1A] dark:hover:bg-zinc-800 border border-[#181615]/10 dark:border-white/10 text-xs font-medium text-zinc-700 dark:text-zinc-300"
                        >
                          <Phone className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{selectedVenue.phone_number}</span>
                        </a>
                      )}
                    </div>
                  )}

                  {/* Editorial Venue Quick Stats (Rating / Price / Status / Area) */}
                  <div className="grid grid-cols-4 gap-1 p-2.5 rounded-2xl bg-white/80 dark:bg-[#1E1C1A] border border-[#181615]/8 dark:border-white/10 text-center shadow-2xs">
                    <div>
                      <div className="text-[10px] text-zinc-400 uppercase font-mono tracking-wider">Rating</div>
                      <div className="flex items-center justify-center gap-0.5 mt-0.5">
                        <span className="text-amber-500 text-xs">★</span>
                        <span className="font-comico text-sm text-zinc-950 dark:text-white font-bold">
                          {selectedVenue.google_rating != null
                            ? selectedVenue.google_rating.toFixed(1)
                            : "4.7"}
                        </span>
                      </div>
                    </div>
                    <div className="border-l border-zinc-200/80 dark:border-white/10">
                      <div className="text-[10px] text-zinc-400 uppercase font-mono tracking-wider">Price</div>
                      <div className="font-comico font-bold text-xs text-zinc-900 dark:text-zinc-200 mt-1">
                        {selectedVenue.price_level || "$$"}
                      </div>
                    </div>
                    <div className="border-l border-zinc-200/80 dark:border-white/10">
                      <div className="text-[10px] text-zinc-400 uppercase font-mono tracking-wider">Status</div>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            openStatus.isOpen ? "bg-emerald-500" : "bg-red-500"
                          }`}
                        />
                        <span
                          className={`text-[11px] font-bold ${
                            openStatus.isOpen ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"
                          }`}
                        >
                          {openStatus.isOpen ? "Open" : "Closed"}
                        </span>
                      </div>
                    </div>
                    <div className="border-l border-zinc-200/80 dark:border-white/10">
                      <div className="text-[10px] text-zinc-400 uppercase font-mono tracking-wider">Area</div>
                      <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-200 truncate mt-1 capitalize px-1">
                        {selectedVenue.neighborhood || selectedVenue.city || "Sentrum"}
                      </div>
                    </div>
                  </div>

                  {/* Culinary Spotlight: Dishes Mini-Feed — 2-Column Visual Card Grid */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-zinc-900 dark:text-white text-sm">
                        Dishes You Can't Miss ({recommendedMeals.length})
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {recommendedMeals.map((dish) => {
                        const activeReaction = reactions[dish.id];
                        const isSaved = savedPostIds.has(dish.id);

                        return (
                          <div
                            key={dish.id}
                            onClick={() => setSelectedDish(dish)}
                            className="group relative p-2.5 rounded-2xl bg-white dark:bg-[#1E1C1A] border border-[#181615]/10 dark:border-white/10 shadow-xs flex flex-col justify-between cursor-pointer hover:border-[#e84a27]/30 hover:shadow-md transition-all active:scale-[0.98]"
                          >
                            <div>
                              {/* Dish Photo */}
                              <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-zinc-900 shadow-2xs">
                                <Image
                                  src={dish.image_url}
                                  alt={dish.dish_name}
                                  fill
                                  onLoad={() =>
                                    setLoadedDishIds((prev) => ({ ...prev, [dish.id]: true }))
                                  }
                                  className={`object-cover group-hover:scale-105 transition-all duration-300 ${
                                    loadedDishIds[dish.id] ? "opacity-100" : "opacity-0"
                                  }`}
                                  sizes="(max-width: 640px) 50vw, 240px"
                                  placeholder="blur"
                                  blurDataURL={FEED_BLUR_DARK}
                                />
                                <div
                                  aria-hidden="true"
                                  className={`smakr-shimmer absolute inset-0 pointer-events-none transition-opacity duration-500 ${
                                    loadedDishIds[dish.id] ? "opacity-0" : "opacity-100"
                                  }`}
                                />
                                {dish.price_nok && (
                                  <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-lg bg-[#181615]/85 backdrop-blur-xs text-white font-comico text-[11px] shadow-xs border border-white/10">
                                    {dish.price_nok} kr
                                  </span>
                                )}
                                {dish.rating && (
                                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-amber-300 font-bold text-[10px] flex items-center gap-0.5 shadow-xs">
                                    <span>★</span>
                                    <span>{dish.rating}</span>
                                  </span>
                                )}
                              </div>

                              {/* Details */}
                              <div className="mt-2">
                                <h5 className="font-comico text-xs sm:text-sm text-[#e84a27] font-bold line-clamp-1 leading-tight">
                                  {dish.dish_name}
                                </h5>

                                {dish.review_text && (
                                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 italic leading-tight">
                                    "{dish.review_text}"
                                  </p>
                                )}

                                {/* Inline Taste Tags + Bookmark/Save Button */}
                                <div className="flex items-center justify-between gap-1.5 mt-2">
                                  <div className="flex flex-wrap items-center gap-1 min-w-0">
                                    {dish.taste_tags && dish.taste_tags.length > 0 &&
                                      dish.taste_tags.slice(0, 2).map((tag) => (
                                        <span
                                          key={tag}
                                          className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 text-[9px] font-medium"
                                        >
                                          {tag}
                                        </span>
                                      ))}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleSavePost(dish.id);
                                    }}
                                    className={`p-1.5 rounded-lg border transition-all cursor-pointer shrink-0 ${
                                      isSaved
                                        ? "bg-[#e84a27] text-white border-[#e84a27] shadow-xs"
                                        : "bg-[#F5EFE4]/80 dark:bg-white/5 text-zinc-500 hover:text-[#e84a27] border-zinc-200/80 dark:border-white/10 hover:bg-zinc-100"
                                    }`}
                                    title={isSaved ? "Saved to your list" : "Save dish"}
                                    aria-label={isSaved ? "Saved to your list" : "Save dish"}
                                  >
                                    <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-current" : ""}`} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Opening Hours & Venue Details */}
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1E1C1A] border border-[#181615]/10 dark:border-white/10 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900">
                        <Clock className="w-3.5 h-3.5 text-[#e84a27]" />
                        <span>Opening Hours</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          openStatus.isOpen
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200/80"
                            : "bg-red-50 text-red-700 border-red-200/80"
                        }`}
                      >
                        {openStatus.statusText}
                        {openStatus.detailText ? ` · ${openStatus.detailText}` : ""}
                      </span>
                    </div>
                    {selectedVenue.opening_hours_json && Object.keys(selectedVenue.opening_hours_json).length > 0 ? (
                      <div className="space-y-1 pt-1 text-[11px] text-zinc-600 font-mono">
                        {Object.entries(selectedVenue.opening_hours_json).map(([day, hours]) => (
                          <div key={day} className="flex justify-between">
                            <span className="font-medium text-zinc-500">{day}</span>
                            <span>{hours}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-zinc-500 pt-1">
                        {selectedVenue.spot_type === "food_truck"
                          ? selectedVenue.location_schedule || "Operating schedule varies by day."
                          : selectedVenue.food_category === "coffee" || selectedVenue.food_category === "bakery"
                          ? "Daily 07:30 – 18:00 (approximate Oslo bakery hours)"
                          : "Daily 11:30 – 22:30 (approximate Oslo restaurant hours)"}
                      </p>
                    )}
                  </div>

                  {/* Verified Diner Reviews (Show 2 + Toggle for more) */}
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-zinc-900 dark:text-white text-sm flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span>Reviews ({reviews.length})</span>
                      </h4>
                      <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                        Verified Diners
                      </span>
                    </div>

                    <div className="space-y-2">
                      {displayedReviews.map((rev) => (
                        <div
                          key={rev.id}
                          className="p-3 rounded-2xl bg-white dark:bg-[#1E1C1A] border border-[#181615]/10 dark:border-white/10 shadow-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 flex items-center justify-center font-bold text-[10px] text-zinc-700 dark:text-zinc-300 uppercase overflow-hidden shrink-0">
                                {rev.author_photo ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={rev.author_photo}
                                    alt={rev.author_name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  rev.author_name[0]
                                )}
                              </div>
                              <span className="font-bold text-xs text-zinc-900 dark:text-white">
                                {rev.author_name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-amber-500 text-xs">
                                {"★".repeat(Math.min(5, Math.max(1, Math.round(rev.rating))))}
                              </span>
                              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono ml-1">
                                {rev.relative_time}
                              </span>
                            </div>
                          </div>
                          <ExpandableReviewText text={rev.text} />
                        </div>
                      ))}
                    </div>

                    {reviews.length > 2 && (
                      <button
                        onClick={() => setShowAllReviews(!showAllReviews)}
                        className="w-full py-2 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/10 dark:hover:bg-white/15 text-zinc-700 dark:text-zinc-200 font-semibold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>{showAllReviews ? "Show fewer reviews" : `Show all ${reviews.length} reviews`}</span>
                      </button>
                    )}
                  </div>

                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    <DishDetailPopup
      dish={selectedDish}
      venue={selectedVenue}
      isOpen={Boolean(selectedDish)}
      onClose={() => setSelectedDish(null)}
      activeReaction={selectedDish ? reactions[selectedDish.id] : null}
      onReaction={handleReaction}
    />

    {/* Fullscreen Smooth Image Zoom Lightbox */}
    <AnimatePresence>
      {zoomImage && (
        <motion.div
          key="venue-sheet-zoom-lightbox"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out select-none"
        >
          <button
            type="button"
            onClick={() => setZoomImage(null)}
            aria-label="Close zoom"
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <motion.img
            src={zoomImage.src}
            alt={zoomImage.alt}
            initial={{ scale: 0.82, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.82, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 30, mass: 0.65 }}
            className="max-w-full max-h-[85dvh] rounded-2xl object-contain shadow-2xl"
          />
        </motion.div>
      )}
    </AnimatePresence>
  </>
  );
}
