"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Venue } from "@/types";

interface UseVenueHeroGalleryResult {
  photos: string[];
  activeIndex: number;
  activePhotoUrl: string | null;
  selectPhoto: (index: number) => void;
  reportBroken: (url: string) => void;
}

/**
 * Manages the pre-ingested Supabase Storage photo deck for a venue card's
 * hero showcase and sequential thumbnail strip (3s cadence, resets on click).
 */
export function useVenueHeroGallery(
  venue: Venue | null,
  fallbackCover?: string | null,
  autoPlay = true
): UseVenueHeroGalleryResult {
  const [activeIndex, setActiveIndex] = useState(0);
  const [resetNonce, setResetNonce] = useState(0);
  const [brokenUrls, setBrokenUrls] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setActiveIndex(0);
    setResetNonce(0);
    setBrokenUrls({});
  }, [venue?.id]);

  const rawPhotos = useMemo(() => {
    if (!venue) return [];
    const candidates: string[] = [];

    if (Array.isArray(venue.place_photos)) {
      for (const u of venue.place_photos) {
        if (typeof u === "string" && u.trim() && !u.includes("/api/places/photos")) {
          candidates.push(u.trim());
        }
      }
    }

    const pushIfValid = (u?: string | null) => {
      if (typeof u === "string" && u.trim() && !u.includes("/api/places/photos")) {
        candidates.push(u.trim());
      }
    };

    pushIfValid(fallbackCover);
    pushIfValid(venue.cover_image_url);

    return Array.from(new Set(candidates)).slice(0, 8);
  }, [venue, fallbackCover]);

  const photos = useMemo(
    () => rawPhotos.filter((u) => !brokenUrls[u]),
    [rawPhotos, brokenUrls]
  );

  const safeIndex = photos.length > 0 ? activeIndex % photos.length : 0;

  useEffect(() => {
    if (!autoPlay || photos.length <= 1) return;
    const id = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % photos.length);
    }, 4500);
    return () => window.clearInterval(id);
  }, [autoPlay, venue?.id, photos.length, resetNonce]);

  const selectPhoto = useCallback((index: number) => {
    setActiveIndex(index);
    setResetNonce((n) => n + 1);
  }, []);

  const reportBroken = useCallback((url: string) => {
    setBrokenUrls((prev) => (prev[url] ? prev : { ...prev, [url]: true }));
  }, []);

  const activePhotoUrl =
    photos[safeIndex] ?? fallbackCover ?? venue?.cover_image_url ?? null;

  return {
    photos,
    activeIndex: safeIndex,
    activePhotoUrl,
    selectPhoto,
    reportBroken,
  };
}

interface VenuePhotoStripProps {
  photos: string[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onImageError?: (url: string) => void;
  venueName?: string;
  compact?: boolean;
  variant?: "strip" | "bento" | "tapered";
}

/**
 * Harbor-Echoes-style venue photo showcase synced to the hero image.
 * - `bento`: Google-style horizontal bento grid (1 big, 2 small, 1 big...).
 * - `tapered`: left-to-right stepped strip for the map card with Details ↗ bottom-right.
 * - `strip`: classic centered sequential thumbnail strip.
 */
export function VenuePhotoStrip({
  photos,
  activeIndex,
  onSelect,
  onImageError,
  venueName = "Venue",
  compact = false,
  variant = "strip",
}: VenuePhotoStripProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // Center the newly active thumbnail strictly along X so vertical page scroll is untouched
  useEffect(() => {
    const container = stripRef.current;
    const item = itemRefs.current[activeIndex];
    if (!container || !item) return;

    const targetLeft =
      item.offsetLeft - container.clientWidth / 2 + item.clientWidth / 2;
    container.scrollTo({
      left: Math.max(0, targetLeft),
      behavior: "smooth",
    });
  }, [activeIndex, photos.length]);

  if (photos.length <= 1) return null;

  // Google-style horizontal bento grid: 1 big, 2 playfully tilted cartoonish stacked small tiles, 1 big...
  if (variant === "bento") {
    const groups: Array<{
      big: { url: string; idx: number };
      smalls: Array<{ url: string; idx: number; tilt: number }>;
    }> = [];
    const tilts = [-3.5, 3.2, 2.8, -3.8, -2.6, 3.6];
    for (let i = 0; i < photos.length; i += 3) {
      const smalls: Array<{ url: string; idx: number; tilt: number }> = [];
      if (photos[i + 1]) {
        smalls.push({
          url: photos[i + 1],
          idx: i + 1,
          tilt: tilts[(i + 1) % tilts.length],
        });
      }
      if (photos[i + 2]) {
        smalls.push({
          url: photos[i + 2],
          idx: i + 2,
          tilt: tilts[(i + 2) % tilts.length],
        });
      }
      groups.push({ big: { url: photos[i], idx: i }, smalls });
    }

    return (
      <div
        ref={stripRef}
        role="tablist"
        aria-label={`${venueName} photos`}
        data-horizontal-carousel="true"
        className="flex items-stretch gap-3.5 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-4 px-4 py-2.5 touch-pan-x"
      >
        {groups.map((group, gIdx) => {
          const bigActive = group.big.idx === activeIndex;
          const bigTilt = [-2.5, 2.2, -2.0, 2.5][gIdx % 4];
          return (
            <React.Fragment key={group.big.url}>
              <button
                ref={(el) => {
                  itemRefs.current[group.big.idx] = el;
                }}
                type="button"
                role="tab"
                aria-selected={bigActive}
                aria-label={`Show ${venueName} photo ${group.big.idx + 1} of ${photos.length}`}
                style={{
                  transform: `rotate(${bigActive ? 0 : bigTilt}deg) scale(${bigActive ? 1.02 : 1})`,
                  opacity: bigActive ? 1 : 0.9,
                }}
                onClick={() => onSelect(group.big.idx)}
                className={`relative snap-start shrink-0 w-[128px] sm:w-[142px] h-[148px] sm:h-[164px] rounded-2xl overflow-hidden cursor-pointer select-none focus:outline-none transition-transform duration-200 ease-out after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:bg-gradient-to-b after:from-white/20 after:via-transparent after:to-black/10 ${
                  bigActive
                    ? "border-2 border-white dark:border-white/90 shadow-[0_8px_20px_rgba(24,22,21,0.22)] z-10"
                    : "border-2 border-white/80 dark:border-white/25 shadow-[0_4px_12px_rgba(24,22,21,0.12)] hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={group.big.url}
                  alt={`${venueName} photo ${group.big.idx + 1}`}
                  loading="eager"
                  decoding="async"
                  draggable={false}
                  style={{ transform: `scale(${bigActive ? 1.0 : 1.06})` }}
                  onError={() => onImageError?.(group.big.url)}
                  className="w-full h-full object-cover object-center will-change-transform transition-transform duration-200 ease-out"
                />
              </button>

              {group.smalls.length > 0 && (
                <div className="flex flex-col gap-3 w-[96px] sm:w-[106px] h-[148px] sm:h-[164px] shrink-0 snap-start">
                  {group.smalls.map(({ url, idx, tilt }) => {
                    const isActive = idx === activeIndex;
                    return (
                      <button
                        key={url}
                        ref={(el) => {
                          itemRefs.current[idx] = el;
                        }}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        aria-label={`Show ${venueName} photo ${idx + 1} of ${photos.length}`}
                        style={{
                          transform: `rotate(${isActive ? 0 : tilt}deg) scale(${isActive ? 1.04 : 1})`,
                          opacity: isActive ? 1 : 0.9,
                        }}
                        onClick={() => onSelect(idx)}
                        className={`relative flex-1 w-full rounded-xl overflow-hidden cursor-pointer select-none focus:outline-none transition-transform duration-200 ease-out after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:bg-gradient-to-b after:from-white/20 after:via-transparent after:to-black/10 ${
                          isActive
                            ? "border-2 border-white dark:border-white/90 shadow-[0_8px_18px_rgba(24,22,21,0.24)] z-10"
                            : "border-2 border-white dark:border-white/30 shadow-[0_4px_12px_rgba(24,22,21,0.14)] hover:opacity-100"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`${venueName} photo ${idx + 1}`}
                          loading="eager"
                          decoding="async"
                          draggable={false}
                          style={{ transform: `scale(${isActive ? 1.0 : 1.08})` }}
                          onError={() => onImageError?.(url)}
                          className="w-full h-full object-cover object-center will-change-transform transition-transform duration-200 ease-out"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  // Conveyor-style tapered map-card strip: active photo sits large on left, marches out left & back in from right
  if (variant === "tapered") {
    const ordered = photos.map((_, slot) => {
      const origIdx = (activeIndex + slot) % photos.length;
      return { url: photos[origIdx], origIdx, slot };
    });

    return (
      <div
        role="tablist"
        aria-label={`${venueName} photos`}
        style={{
          maskImage:
            "linear-gradient(to right, black 0%, black 88%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, black 0%, black 88%, transparent 100%)",
        }}
        className="flex items-start gap-1.5 overflow-hidden pr-4 min-h-[68px]"
      >
        <AnimatePresence initial={false} mode="popLayout">
          {ordered.map(({ url, origIdx, slot }) => {
            const isActive = slot === 0;
            const targetW = slot === 0 ? 50 : slot === 1 ? 44 : slot === 2 ? 40 : 36;
            const targetH = slot === 0 ? 66 : slot === 1 ? 56 : slot === 2 ? 46 : 32;
            return (
              <motion.button
                key={url}
                layout
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Show ${venueName} photo ${origIdx + 1} of ${photos.length}`}
                initial={{ opacity: 0, x: 20, scale: 0.85 }}
                animate={{
                  width: targetW,
                  height: targetH,
                  opacity: isActive ? 1 : 0.82,
                  x: 0,
                  scale: 1,
                }}
                exit={{ opacity: 0, x: -22, scale: 0.85 }}
                transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => onSelect(origIdx)}
                className={`relative shrink-0 overflow-hidden cursor-pointer select-none focus:outline-none after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:bg-gradient-to-b after:from-white/25 after:via-transparent after:to-black/10 ${
                  isActive
                    ? "rounded-xl border border-white shadow-[0_6px_16px_rgba(0,0,0,0.35)] z-10"
                    : "rounded-lg border border-white/45 shadow-xs hover:opacity-100"
                }`}
              >
                <img
                  src={url}
                  alt={`${venueName} photo ${origIdx + 1}`}
                  loading="eager"
                  draggable={false}
                  onError={() => onImageError?.(url)}
                  className="w-full h-full object-cover object-center"
                />
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center">
      <div
        ref={stripRef}
        role="tablist"
        aria-label={`${venueName} photos`}
        data-horizontal-carousel="true"
        style={{
          maskImage:
            "linear-gradient(to right, transparent 0%, black 11%, black 89%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, black 11%, black 89%, transparent 100%)",
        }}
        className={`mx-auto w-fit max-w-full flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 px-4 touch-pan-x ${
          compact ? "min-h-[54px]" : "min-h-[64px]"
        }`}
      >
        {photos.map((url, idx) => {
          const isActive = idx === activeIndex;
          const parallaxShift = isActive ? 0 : idx < activeIndex ? -4 : 4;
          return (
            <motion.button
              key={url}
              ref={(el) => {
                itemRefs.current[idx] = el;
              }}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={`Show ${venueName} photo ${idx + 1} of ${photos.length}`}
              initial={false}
              animate={{
                width: isActive ? (compact ? 42 : 50) : (compact ? 34 : 40),
                height: isActive ? (compact ? 48 : 58) : (compact ? 38 : 46),
                y: isActive ? -2 : 0,
                opacity: isActive ? 1 : 0.76,
              }}
              transition={{
                duration: 0.85,
                ease: [0.16, 1, 0.3, 1],
              }}
              onClick={() => onSelect(idx)}
              className={`relative shrink-0 overflow-hidden cursor-pointer select-none focus:outline-none after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:bg-gradient-to-b after:from-white/25 after:via-transparent after:to-black/10 ${
                isActive
                  ? "rounded-xl border border-white/80 dark:border-white/35 shadow-[0_8px_20px_rgba(24,22,21,0.22)] z-10"
                  : "rounded-lg border border-white/55 dark:border-white/20 shadow-[0_2px_8px_rgba(24,22,21,0.10)] hover:opacity-100"
              }`}
            >
              <motion.img
                src={url}
                alt={`${venueName} photo ${idx + 1}`}
                loading="eager"
                draggable={false}
                initial={false}
                animate={{
                  scale: isActive ? 1.0 : 1.14,
                  x: parallaxShift,
                }}
                transition={{
                  duration: 0.85,
                  ease: [0.16, 1, 0.3, 1],
                }}
                onError={() => onImageError?.(url)}
                className="w-full h-full object-cover object-center will-change-transform"
              />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
