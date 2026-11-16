"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, type PanInfo } from "motion/react";
import { ChevronLeft, ChevronRight, X, Images } from "lucide-react";
import type { Venue } from "@/types";

interface VenuePhotoStackProps {
  venue: Venue | null;
  extraPhotos?: string[];
}

/**
 * Swipeable Google Places photo deck backed strictly by pre-ingested
 * Supabase Storage URLs (`venue.place_photos`) — zero runtime Google API calls.
 */
export function VenuePhotoStack({ venue, extraPhotos = [] }: VenuePhotoStackProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [brokenUrls, setBrokenUrls] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setActiveIdx(0);
    setLightboxOpen(false);
    setBrokenUrls({});
  }, [venue?.id]);

  const photos = useMemo(() => {
    if (!venue) return [];
    const candidates: string[] = [];

    if (Array.isArray(venue.place_photos)) {
      for (const u of venue.place_photos) {
        if (typeof u === "string" && u.trim() && !u.includes("/api/places/photos")) {
          candidates.push(u.trim());
        }
      }
    }

    if (
      venue.cover_image_url &&
      !venue.cover_image_url.includes("/api/places/photos")
    ) {
      candidates.push(venue.cover_image_url.trim());
    }

    for (const u of extraPhotos) {
      if (typeof u === "string" && u.trim() && !u.includes("/api/places/photos")) {
        candidates.push(u.trim());
      }
    }

    return Array.from(new Set(candidates)).slice(0, 8);
  }, [venue, extraPhotos]);

  const validPhotos = useMemo(
    () => photos.filter((u) => !brokenUrls[u]),
    [photos, brokenUrls]
  );

  const orderedDeck = useMemo(() => {
    if (validPhotos.length === 0) return [];
    const len = validPhotos.length;
    const result: Array<{ url: string; origIndex: number }> = [];
    for (let i = 0; i < Math.min(len, 4); i++) {
      const idx = (activeIdx + i) % len;
      result.push({ url: validPhotos[idx], origIndex: idx });
    }
    return result;
  }, [validPhotos, activeIdx]);

  const handleNext = () => {
    if (validPhotos.length <= 1) return;
    setActiveIdx((prev) => (prev + 1) % validPhotos.length);
  };

  const handlePrev = () => {
    if (validPhotos.length <= 1) return;
    setActiveIdx((prev) => (prev - 1 + validPhotos.length) % validPhotos.length);
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (validPhotos.length <= 1) return;
    if (info.offset.x < -50 || info.velocity.x < -320) {
      handleNext();
    } else if (info.offset.x > 50 || info.velocity.x > 320) {
      handlePrev();
    }
  };

  if (validPhotos.length === 0) return null;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-comico font-normal text-[17px] tracking-tight uppercase text-[#181615] dark:text-white flex items-center gap-1.5">
          <Images className="w-4 h-4 text-[#E84A27]" />
          <span>Place Photos</span>
        </h4>
        {validPhotos.length > 1 && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-comico text-[#181615]/65 dark:text-white/65 tabular-nums mr-1">
              {activeIdx + 1} / {validPhotos.length}
            </span>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous place photo"
              className="w-7 h-7 rounded-full bg-[#F2EDE4] dark:bg-white/10 hover:bg-[#E84A27] hover:text-white text-[#181615] dark:text-white flex items-center justify-center transition-colors cursor-pointer active:scale-90"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next place photo"
              className="w-7 h-7 rounded-full bg-[#F2EDE4] dark:bg-white/10 hover:bg-[#E84A27] hover:text-white text-[#181615] dark:text-white flex items-center justify-center transition-colors cursor-pointer active:scale-90"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="relative h-[220px] sm:h-[240px] w-full max-w-[315px] mx-auto select-none touch-pan-y">
        <AnimatePresence initial={false} mode="popLayout">
          {orderedDeck.map((item, stackIdx) => {
            const isTop = stackIdx === 0;
            const tilt =
              stackIdx === 0 ? 0 : stackIdx % 2 === 1 ? 3.2 : -3.2;

            return (
              <motion.div
                key={item.url}
                style={{
                  zIndex: orderedDeck.length - stackIdx,
                  originY: 0.85,
                }}
                initial={{ scale: 0.9, opacity: 0, y: 18 }}
                animate={{
                  scale: 1 - stackIdx * 0.055,
                  y: stackIdx * 10,
                  rotate: tilt,
                  opacity: 1 - stackIdx * 0.14,
                  zIndex: orderedDeck.length - stackIdx,
                }}
                exit={{
                  x: -220,
                  opacity: 0,
                  rotate: -12,
                  scale: 0.88,
                  transition: { duration: 0.2 },
                }}
                transition={{ type: "spring", stiffness: 320, damping: 26 }}
                drag={isTop && validPhotos.length > 1 ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.48}
                whileDrag={{ scale: 1.02, rotate: 2 }}
                onDragEnd={isTop ? handleDragEnd : undefined}
                onClick={() => {
                  if (isTop) setLightboxOpen(true);
                }}
                className={`absolute inset-x-0 top-0 h-[196px] sm:h-[214px] rounded-[24px] overflow-hidden bg-[#181615] border-[2.5px] border-white shadow-[0_12px_28px_rgba(24,22,21,0.2)] ${
                  isTop
                    ? "cursor-grab active:cursor-grabbing"
                    : "pointer-events-none"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={`${venue?.name || "Spot"} photo ${item.origIndex + 1}`}
                  draggable={false}
                  onError={() =>
                    setBrokenUrls((prev) => ({ ...prev, [item.url]: true }))
                  }
                  className="w-full h-full object-cover pointer-events-none select-none"
                />
                <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/55 to-transparent pointer-events-none" />
                {isTop && validPhotos.length > 1 && (
                  <span className="absolute bottom-2.5 right-3 px-2.5 py-0.5 rounded-full bg-black/55 backdrop-blur-md text-white/90 font-comico text-[10px] tracking-wide pointer-events-none">
                    Swipe photo →
                  </span>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Fullscreen Photo Lightbox */}
      <AnimatePresence>
        {lightboxOpen && validPhotos[activeIdx] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxOpen(false)}
            className="fixed inset-0 z-[90] bg-black/92 backdrop-blur-md flex items-center justify-center p-4"
          >
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              aria-label="Close photo"
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {validPhotos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrev();
                  }}
                  aria-label="Previous photo"
                  className="absolute left-3 sm:left-6 z-10 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  aria-label="Next photo"
                  className="absolute right-3 sm:right-6 z-10 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <motion.img
              key={validPhotos[activeIdx]}
              src={validPhotos[activeIdx]}
              alt={venue?.name || "Place photo"}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-full max-h-[84dvh] rounded-2xl object-contain shadow-2xl select-none"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
