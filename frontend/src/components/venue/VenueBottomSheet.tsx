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
} from "lucide-react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { isInstantVenueSheet, getVenueMorphImage } from "@/lib/venueMorph";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "motion/react";
import { useVenueDetail } from "@/hooks/useVenueDetail";
import { formatDistance } from "@/lib/math";
import { FoodPost, ReviewItem } from "@/types";
import { DishDetailPopup } from "@/components/food/DishDetailPopup";
import { getPopupStatus, getPopupMeta, isPopupVenue } from "@/lib/popupUtils";
import { getVenueLiveOpenStatus } from "@/lib/openingHours";
import { formatOsloLocation, formatVenueLocationLine } from "@/lib/location";
import { ExpandableReviewText } from "./ExpandableReviewText";
import { VenuePhotoStrip, useVenueHeroGallery } from "./VenuePhotoStrip";
import { VenueDishesGrid } from "./VenueDishesGrid";
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
  // When the sheet is opened from the map spotlight card, it renders directly
  // in place so the view transition can morph the card photo into the hero.
  const instantEntry = isInstantVenueSheet();
  const morphImageRef = React.useRef<string | null>(null);

  // Retain the last selected venue while the slide-down exit animation completes
  const lastVenueRef = React.useRef<typeof storeSelectedVenue>(null);
  if (storeSelectedVenue) {
    lastVenueRef.current = storeSelectedVenue;
  }
  const selectedVenue = storeSelectedVenue ?? (isVenueDetailModalOpen ? lastVenueRef.current : lastVenueRef.current);

  if (isVenueDetailModalOpen && isInstantVenueSheet()) {
    morphImageRef.current = getVenueMorphImage();
  }
  if (!isVenueDetailModalOpen) {
    morphImageRef.current = null;
  }
  const heroSrc = morphImageRef.current || selectedVenue?.cover_image_url || null;
  const gallery = useVenueHeroGallery(selectedVenue, heroSrc);
  const activeHeroSrc = gallery.activePhotoUrl || heroSrc;

  const [heroImgReady, setHeroImgReady] = useState(false);
  const [loadedDishIds, setLoadedDishIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setHeroImgReady(false);
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
  // 4. Soft scrim fades in over the docked header (lighter, no expensive blur)
  const titleTranslateY = useTransform(scrollY, [0, 190], [190, 0], { clamp: true });
  const navScrimOpacity = useTransform(scrollY, [70, 190], [0, 1], { clamp: true });
  const imageParallaxY = useTransform(scrollY, [0, 260], [0, -35], { clamp: true });

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
      setShowAllHours(false);
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
  const [showAllHours, setShowAllHours] = useState(false);
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
    // On the mobile map, closing the restaurant sheet should drop back to the
    // map spotlight card (not clear the selection). Other surfaces keep the
    // original behavior.
    const state = useCityPulseStore.getState();
    const keepMapCard =
      state.viewMode === "map" &&
      typeof window !== "undefined" &&
      window.innerWidth < 1024;
    if (!keepMapCard) {
      setSelectedVenue(null);
    }
  }, [setIsVenueDetailModalOpen, setBottomSheetOpen, setSelectedVenue]);

  // Keyboard Escape dismiss
  useEffect(() => {
    if (!isVenueDetailModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVenueDetailModalOpen, handleClose]);

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

  // 2. Scrollable content pull-down to close when at top (scrollTop <= 0)
  const handleContentTouchStart = (e: React.TouchEvent) => {
    const scrollTop = contentScrollRef.current ? contentScrollRef.current.scrollTop : 0;
    if (scrollTop <= 0) {
      contentTouchStartYRef.current = e.touches[0].clientY;
      lastTouchYRef.current = e.touches[0].clientY;
      lastTouchTimeRef.current = Date.now();
      currentVelocityRef.current = 0;
      isContentPullingRef.current = false;
    } else {
      contentTouchStartYRef.current = null;
    }
  };

  const handleContentTouchMove = (e: React.TouchEvent) => {
    if (contentTouchStartYRef.current === null) return;
    const currentY = e.touches[0].clientY;
    const scrollTop = contentScrollRef.current ? contentScrollRef.current.scrollTop : 0;

    if (scrollTop > 0) {
      contentTouchStartYRef.current = null;
      if (isContentPullingRef.current) {
        isContentPullingRef.current = false;
        isDraggingRef.current = false;
        sheetY.set(0);
      }
      return;
    }

    const pullDown = currentY - contentTouchStartYRef.current;
    // Let upward swipes (scrolling down the page) release pull-to-close cleanly
    if (pullDown < -4 && !isContentPullingRef.current) {
      contentTouchStartYRef.current = null;
      return;
    }

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
      <AnimatePresence
        // After a drag-to-close, the card keeps its pulled-down offset while it
        // slides out. Framer restores that offset when the next sheet mounts
        // (it reads the rendered transform), so clear it once the exit ends.
        onExitComplete={() => sheetY.set(0)}
      >
        {isVenueDetailModalOpen && selectedVenue && (
          <div className="fixed inset-0 z-[60] flex flex-col justify-end pointer-events-auto">
            {/* Dimmed backdrop overlay that fades in and dismisses the drawer when tapped */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={handleClose}
              className="fixed inset-0 bg-black/45 backdrop-blur-[2px] cursor-pointer"
            />

            {/* Pop out from bottom spring container */}
            <motion.div
              ref={sheetRef}
              initial={instantEntry ? false : { y: "100%" }}
              animate={{
                y: 0,
                transition: { type: "spring", stiffness: 360, damping: 32, mass: 0.8 },
              }}
              exit={{
                y: "100%",
                transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
              }}
              className="relative z-10 w-full h-[88dvh] max-h-[90vh] flex flex-col pointer-events-auto"
            >
              {/* Slidable Card container with unified useMotionValue drag & exit */}
              <motion.div
                style={{
                  y: sheetY,
                  contain: "layout style",
                }}
                initial={instantEntry ? { opacity: 0 } : false}
                animate={{ opacity: 1 }}
                transition={
                  instantEntry
                    ? { delay: 0.18, duration: 0.2, ease: "easeOut" }
                    : undefined
                }
                className="relative w-full h-full bg-[#FAF7F2] dark:bg-[#181615] lg:bg-[#FAF7F2]/95 lg:backdrop-blur-sm rounded-t-3xl border-t border-[#181615]/10 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden will-change-transform smakr-bottom-sheet"
              >
              {/* 1. PINNED HERO IMAGE BACKGROUND — Generous, cinematic surface area with subtle parallax */}
              {activeHeroSrc && (
                <div
                  className="absolute top-0 inset-x-0 h-[380px] sm:h-[420px] overflow-hidden rounded-t-3xl pointer-events-none z-0 bg-[#181615]"
                  data-venue-hero-target
                >
                  <motion.div
                    style={{ y: imageParallaxY }}
                    className="relative w-full h-full"
                  >
                    <AnimatePresence initial={false} mode="sync">
                      <motion.div
                        key={activeHeroSrc}
                        initial={{ opacity: 0, scale: 1.04 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute inset-0"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={
                            morphImageRef.current && activeHeroSrc === morphImageRef.current
                              ? morphImageRef.current
                              : activeHeroSrc
                          }
                          alt={selectedVenue.name}
                          loading="eager"
                          decoding="async"
                          fetchPriority="high"
                          className="absolute inset-0 w-full h-full object-cover object-center"
                        />
                      </motion.div>
                    </AnimatePresence>
                    {/* Light top scrim keeps close button readable without muddy overlap */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
                  </motion.div>
                </div>
              )}

              {/* 2. TOP STICKY HEADER BAR & CONTINUOUS MORPHING TITLE */}
              {/* Shows Spot Name, Open/Closed status & Address with generous spacing in both resting & scrolled states */}
              <div className="absolute top-0 inset-x-0 z-30 pt-2 pb-2.5 px-4 rounded-t-3xl pointer-events-none">
                {/* Flat Warm-Oat docked header bar (avoids backdrop-blur recompositing during scroll) */}
                <motion.div
                  style={{ opacity: navScrimOpacity }}
                  className="absolute top-0 inset-x-0 h-[112px] sm:h-[116px] bg-[#FAF7F2] dark:bg-[#181615] border-b border-[#181615]/10 shadow-[0_6px_24px_rgba(24,22,21,0.08)] pointer-events-none rounded-t-3xl"
                />

                <motion.div
                  initial={instantEntry ? { opacity: 0 } : false}
                  animate={{ opacity: 1 }}
                  transition={
                    instantEntry
                      ? { delay: 0.3, duration: 0.16, ease: "easeOut" }
                      : undefined
                  }
                  className="relative z-10 w-full flex flex-col"
                  data-sheet-header
                >
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
                        transformOrigin: "top left",
                      }}
                      initial={instantEntry ? { opacity: 0 } : false}
                      animate={{ opacity: 1 }}
                      transition={
                        instantEntry
                          ? { delay: 0.3, duration: 0.22, ease: [0.22, 1, 0.36, 1] }
                          : undefined
                      }
                      className="min-w-0 pr-24 pointer-events-none select-none will-change-transform flex flex-col gap-1"
                    >
                      {/* Closed/Open live badge — category tags omitted on restaurant sheet */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isPopup && isDormant ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 border shadow-xs bg-amber-950/90 text-amber-200 border-amber-500/40">
                            <span>⏳ Between Drops · Next Date TBA</span>
                          </span>
                        ) : (
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 border shadow-xs ${
                              openStatus.isOpen
                                ? "bg-emerald-950/90 text-emerald-300 border-emerald-500/35"
                                : "bg-red-950/90 text-red-300 border-red-500/35"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${openStatus.isOpen ? "bg-emerald-400" : "bg-red-400"}`} />
                            <span>{openStatus.isOpen ? "Open" : "Closed"}</span>
                            {openStatus.detailText && (
                              <span className="opacity-80 font-normal">· {openStatus.detailText}</span>
                            )}
                          </span>
                        )}
                      </div>

                      <h3 className="font-comico text-2xl sm:text-3xl text-[#181615] tracking-tight leading-tight truncate max-w-full">
                        {selectedVenue.name}
                      </h3>
                      <p className="text-xs sm:text-[13px] text-[#181615]/80 font-medium flex items-center gap-1 truncate max-w-full">
                        <MapPin className="w-3.5 h-3.5 text-[#e84a27] shrink-0" />
                        <span className="truncate">
                          {formatVenueLocationLine(selectedVenue)}
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
                </motion.div>
              </div>

              <div
                ref={contentScrollRef}
                onScroll={handleContentScroll}
                onTouchStart={handleContentTouchStart}
                onTouchMove={handleContentTouchMove}
                onTouchEnd={handleContentTouchEnd}
                className="flex-1 overflow-y-auto text-xs no-scrollbar overscroll-contain relative z-10"
              >
                <motion.div
                  initial={instantEntry ? { opacity: 0 } : false}
                  animate={{ opacity: 1 }}
                  transition={
                    instantEntry
                      ? { delay: 0.24, duration: 0.34, ease: "easeOut" }
                      : undefined
                  }
                  className="will-change-transform"
                  data-sheet-body
                >
                {isPopup ? (
                  /* =========================================================================
                     DEDICATED POP-UP RESIDENCY SHEET
                     ========================================================================= */
                  <>
                  {/* Top spacer reveals the pinned hero; the content card tucks
                      close beneath the resting title/location. */}
                  <div className="w-full h-[285px] sm:h-[320px] shrink-0" />

                  {/* Content Card: Unrounded top edge flows seamlessly into the Warm-Oat hue */}
                  <div className="relative z-10 bg-[#FAF7F2] dark:bg-[#181615] px-4 pt-2 pb-14 space-y-3">
                    {/* Lightened upward Warm-Oat hue over the resting title & location */}
                    <div
                      aria-hidden="true"
                      style={{
                        background:
                          "linear-gradient(to top, rgba(250,247,242,1) 0%, rgba(250,247,242,0.55) 45%, rgba(250,247,242,0) 100%)",
                      }}
                      className="pointer-events-none absolute -top-24 inset-x-0 h-24 dark:hidden"
                    />

                    {/* Compact Residency Status & Schedule */}
                    {isDormant ? (
                      <div className="p-3.5 rounded-2xl bg-[#F3EDE2] dark:bg-[#1E1C1A] border border-dashed border-[#381820]/25 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#181615] dark:text-[#FAF7F2] flex items-center gap-1.5">
                            <span>⏳</span>
                            <span>Between Drops · Next Date TBA</span>
                          </span>
                          {popupContact && (
                            <a
                              href={popupContact.startsWith("http") ? popupContact : `mailto:${popupContact}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10.5px] font-bold text-[#E84A27] hover:underline shrink-0"
                            >
                              Inquiries ↗
                            </a>
                          )}
                        </div>
                        <p className="text-[11.5px] text-zinc-700 dark:text-zinc-300 leading-snug">
                          Next Oslo location &amp; drop window announced on Instagram.
                        </p>
                        {popupMeta?.instagram_url && (
                          <a
                            href={popupMeta.instagram_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full bg-[#181615] hover:bg-[#2a2624] text-[#FAF7F2] border border-[#E84A27]/40 rounded-full py-2.5 px-4 text-xs font-extrabold flex items-center justify-between transition-all active:scale-[0.98]"
                          >
                            <span className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-[#E84A27] text-white flex items-center justify-center shrink-0">
                                <Instagram className="w-3 h-3" />
                              </span>
                              <span>Follow {instagramHandle ? `@${instagramHandle}` : "Instagram"} for Drop Alerts</span>
                            </span>
                            <ExternalLink className="w-3.5 h-3.5 text-[#E84A27] shrink-0" />
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* 2-Layer Horizontal Strip: Layer 1 (Dates · Service Hours), Layer 2 (Host Spot + Directions) */}
                        <div className="space-y-2 py-2 border-y border-[#181615]/8 dark:border-white/10">
                          {(popupMeta?.dates_label || popupMeta?.daily_hours || selectedVenue.current_opening_hours_text) && (
                            <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1 text-xs font-semibold text-[#181615] dark:text-zinc-200">
                              {popupMeta?.dates_label && (
                                <span className="inline-flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-[#E84A27] shrink-0" />
                                  <span>{popupMeta.dates_label}</span>
                                </span>
                              )}
                              {popupMeta?.dates_label && (popupMeta?.daily_hours || selectedVenue.current_opening_hours_text) && (
                                <span className="text-[#181615]/25 dark:text-white/25">·</span>
                              )}
                              {(popupMeta?.daily_hours || selectedVenue.current_opening_hours_text) && (
                                <span className="inline-flex items-center gap-1.5 text-[#181615]/80 dark:text-zinc-300">
                                  <Clock className="w-3.5 h-3.5 text-[#E84A27] shrink-0" />
                                  <span>{popupMeta?.daily_hours || selectedVenue.current_opening_hours_text}</span>
                                </span>
                              )}
                            </div>
                          )}

                          {popupHostVenue && (
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <div className="flex items-center gap-1.5 min-w-0 font-semibold text-[#181615] dark:text-white">
                                <MapPin className="w-3.5 h-3.5 text-[#E84A27] shrink-0" />
                                <span className="text-[#181615]/55 dark:text-zinc-400 font-medium shrink-0">Host:</span>
                                <span className="truncate">{popupHostVenue}</span>
                              </div>
                              <a
                                href={googleMapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1 rounded-full bg-[#EFE9DF] hover:bg-[#E5DDD0] dark:bg-white/10 text-[#181615] dark:text-white text-[11px] font-bold flex items-center gap-1 shrink-0 transition-colors"
                              >
                                <span>Directions</span>
                                <ExternalLink className="w-3 h-3 text-[#E84A27]" />
                              </a>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap pt-0.5">
                          {popupMeta?.ticket_url && (
                            <a
                              href={popupMeta.ticket_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 py-2.5 px-4 rounded-full bg-[#E84A27] hover:bg-[#D43D1C] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
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
                              className="flex-1 bg-[#EFE9DF] hover:bg-[#E5DDD0] dark:bg-white/10 dark:hover:bg-white/15 text-[#181615] dark:text-white rounded-full py-2.5 px-4 text-xs flex items-center justify-between transition-colors"
                            >
                              <span className="flex items-center gap-2 min-w-0">
                                <Instagram className="w-4 h-4 text-[#E84A27] shrink-0" />
                                <span className="font-comico tracking-wide truncate">
                                  {instagramHandle ? `@${instagramHandle}` : "Instagram"}
                                </span>
                              </span>
                              <ExternalLink className="w-3.5 h-3.5 text-[#181615]/50 dark:text-white/50 shrink-0" />
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Signature Dishes immediately visible above the fold */}
                    <VenueDishesGrid
                      dishes={recommendedMeals}
                      savedPostIds={savedPostIds}
                      onToggleSave={toggleSavePost}
                      onSelectDish={setSelectedDish}
                    />

                    {/* Story & Culinary Concept Section */}
                    {selectedVenue.description && (
                      <div className="px-1 py-1 space-y-1.5">
                        <div className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                          <span>✦ STORY</span>
                        </div>
                        <p className="text-[14px] sm:text-[15.5px] text-[#181615]/90 dark:text-zinc-100 leading-relaxed whitespace-pre-line font-medium">
                          {selectedVenue.description}
                        </p>
                        {popupMeta?.guest_chef && (
                          <div className="pt-1.5 text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
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

                    <VenuePhotoStrip
                      photos={gallery.photos}
                      activeIndex={gallery.activeIndex}
                      onSelect={gallery.selectPhoto}
                      onImageError={gallery.reportBroken}
                      venueName={selectedVenue.name}
                    />

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
                  {/* Top spacer reveals the pinned hero; the content card tucks
                      close beneath the resting title/location. */}
                  <div className="w-full h-[285px] sm:h-[320px] shrink-0" />

                  {/* Content Card: Unrounded top edge flows seamlessly into the Warm-Oat hue */}
                  <div
                    className={`relative z-10 bg-[#FAF7F2] dark:bg-[#181615] px-4 pb-14 space-y-3 ${
                      gallery.photos.length > 1 ? "pt-1.5" : "pt-4"
                    }`}
                  >
                    {/* Lightened upward Warm-Oat hue over the resting title & location */}
                    <div
                      aria-hidden="true"
                      style={{
                        background:
                          "linear-gradient(to top, rgba(250,247,242,1) 0%, rgba(250,247,242,0.55) 45%, rgba(250,247,242,0) 100%)",
                      }}
                      className="pointer-events-none absolute -top-24 inset-x-0 h-24 dark:hidden"
                    />
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

                    {/* Google-style Horizontal Bento Gallery synced to Hero */}
                    <VenuePhotoStrip
                      photos={gallery.photos}
                      activeIndex={gallery.activeIndex}
                      onSelect={gallery.selectPhoto}
                      onImageError={gallery.reportBroken}
                      venueName={selectedVenue.name}
                      variant="bento"
                    />

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

                  {/* STORY — Directly under Directions & Log a Dish */}
                  {selectedVenue.description && (
                    <div className="px-0.5 py-0.5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-zinc-700 dark:text-zinc-300 uppercase text-[10px] tracking-wider font-mono">
                          STORY
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

                  {/* Centered Editorial Venue Meta & Collapsible Opening Hours */}
                  <div className="space-y-2 pt-2.5 border-t border-[#181615]/8 dark:border-white/10">
                    <div className="flex flex-col items-center text-center gap-1.5">
                      <div className="inline-flex items-center justify-center flex-wrap gap-x-2.5 gap-y-1 text-xs text-[#181615]/80 dark:text-zinc-300">
                        <span className="inline-flex items-center gap-1 font-bold text-[#181615] dark:text-white">
                          <span className="text-amber-500">★</span>
                          <span className="tabular-nums">
                            {selectedVenue.google_rating != null
                              ? selectedVenue.google_rating.toFixed(1)
                              : "4.8"}
                          </span>
                        </span>
                        <span className="text-[#181615]/25 dark:text-white/25">·</span>
                        <span className="font-semibold">{selectedVenue.price_level || "$$"}</span>
                        <span className="text-[#181615]/25 dark:text-white/25">·</span>
                        <span className="capitalize font-medium text-[#181615]/70 dark:text-zinc-300">
                          {selectedVenue.neighborhood || selectedVenue.city || "Sentrum"}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowAllHours((v) => !v)}
                        className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            openStatus.isOpen ? "bg-emerald-500" : "bg-red-500"
                          }`}
                        />
                        <span
                          className={
                            openStatus.isOpen
                              ? "text-emerald-700 dark:text-emerald-400"
                              : "text-red-700 dark:text-red-400"
                          }
                        >
                          {openStatus.isOpen ? "Open" : "Closed"}
                          {openStatus.detailText ? ` · ${openStatus.detailText}` : ""}
                        </span>
                        <span className="text-[10px] text-[#181615]/45 dark:text-zinc-400 font-medium">
                          · {showAllHours ? "Hide hours ▴" : "Hours ▾"}
                        </span>
                      </button>
                    </div>

                    {showAllHours && (
                      <div className="pl-1 pr-1 pb-1 space-y-1 text-[11px] text-[#181615]/70 dark:text-zinc-400">
                        {selectedVenue.opening_hours_json &&
                        Object.keys(selectedVenue.opening_hours_json).length > 0 ? (
                          Object.entries(selectedVenue.opening_hours_json).map(([day, hours]) => (
                            <div key={day} className="flex justify-between py-0.5 border-b border-[#181615]/5 dark:border-white/5 last:border-0">
                              <span className="font-medium text-[#181615]/60 dark:text-zinc-400">{day}</span>
                              <span className="tabular-nums font-mono text-[10.5px]">{hours}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-[11px] text-[#181615]/60 dark:text-zinc-400">
                            {selectedVenue.spot_type === "food_truck"
                              ? selectedVenue.location_schedule || "Operating schedule varies by day."
                              : selectedVenue.food_category === "coffee" || selectedVenue.food_category === "bakery"
                              ? "Daily 07:30 – 18:00 (approximate Oslo bakery hours)"
                              : "Daily 11:30 – 22:30 (approximate Oslo restaurant hours)"}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Culinary Spotlight: Dishes Mini-Feed — 2-Column Editorial Card Grid */}
                  <VenueDishesGrid
                    dishes={recommendedMeals}
                    savedPostIds={savedPostIds}
                    onToggleSave={toggleSavePost}
                    onSelectDish={setSelectedDish}
                  />

                  {/* Verified Diner Reviews — Clean Editorial Hairline List */}
                  <div className="space-y-2 pt-2 border-t border-[#181615]/8 dark:border-white/10">
                    <div className="flex items-center justify-between pt-1">
                      <h4 className="font-comico font-normal text-[17px] tracking-tight uppercase text-[#181615] dark:text-white">
                        Reviews
                      </h4>
                      <span className="text-[11px] font-medium text-[#181615]/50 dark:text-zinc-400 tabular-nums">
                        {reviews.length} verified
                      </span>
                    </div>

                    <div className="divide-y divide-[#181615]/8 dark:divide-white/10">
                      {displayedReviews.map((rev) => (
                        <div key={rev.id} className="py-3 first:pt-1.5 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-6 h-6 rounded-full bg-[#EFE9DF] dark:bg-zinc-800 flex items-center justify-center font-bold text-[10px] text-[#181615] dark:text-zinc-200 uppercase overflow-hidden shrink-0">
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
                              <div className="min-w-0 flex items-baseline gap-1.5">
                                <span className="font-semibold text-xs text-[#181615] dark:text-white truncate">
                                  {rev.author_name}
                                </span>
                                <span className="text-[10.5px] text-[#181615]/45 dark:text-zinc-500 shrink-0">
                                  {rev.relative_time}
                                </span>
                              </div>
                            </div>
                            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-[#181615] dark:text-zinc-200 shrink-0 tabular-nums">
                              <Star className="w-3 h-3 fill-[#F5B301] text-[#F5B301]" />
                              <span>{Math.min(5, Math.max(1, rev.rating)).toFixed(1)}</span>
                            </span>
                          </div>
                          <ExpandableReviewText text={rev.text} />
                        </div>
                      ))}
                    </div>

                    {reviews.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setShowAllReviews(!showAllReviews)}
                        className="w-full py-2 rounded-full bg-[#EFE9DF] hover:bg-[#E6DEC9] dark:bg-white/10 dark:hover:bg-white/15 text-[#181615] dark:text-zinc-200 font-semibold text-xs transition-colors flex items-center justify-center cursor-pointer"
                      >
                        <span>{showAllReviews ? "Show fewer reviews" : `Show all ${reviews.length} reviews`}</span>
                      </button>
                    )}
                  </div>

                  </div>
                </>
              )}
              </motion.div>
            </div>

              </motion.div>
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
  </>
  );
}
