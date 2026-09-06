"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  X,
  MapPin,
  ExternalLink,
  ChevronRight,
  Plus,
  Wifi,
  Sparkles,
  Utensils,
  Navigation,
} from "lucide-react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { formatDistance } from "@/lib/math";

export function VenueBottomSheet() {
  const selectedVenue = useCityPulseStore((state) => state.selectedVenue);
  const setSelectedVenue = useCityPulseStore((state) => state.setSelectedVenue);
  const bottomSheetOpen = useCityPulseStore((state) => state.bottomSheetOpen);
  const setBottomSheetOpen = useCityPulseStore((state) => state.setBottomSheetOpen);
  const setIsCreateBiteModalOpen = useCityPulseStore((state) => state.setIsCreateBiteModalOpen);
  const currentUser = useCityPulseStore((state) => state.currentUser);
  const setIsAuthModalOpen = useCityPulseStore((state) => state.setIsAuthModalOpen);
  const foodPosts = useCityPulseStore((state) => state.foodPosts);
  const mobileSheetState = useCityPulseStore((state) => state.mobileSheetState);

  // Expanded detailed slidable card state on mobile
  const [isExpandedModalOpen, setIsExpandedModalOpen] = useState(false);
  const [detailsDragOffset, setDetailsDragOffset] = useState(0);
  const [isDraggingDetails, setIsDraggingDetails] = useState(false);
  const detailsTouchStartY = React.useRef<number | null>(null);

  const handleDetailsTouchStart = (e: React.TouchEvent) => {
    detailsTouchStartY.current = e.touches[0].clientY;
    setIsDraggingDetails(true);
  };

  const handleDetailsTouchMove = (e: React.TouchEvent) => {
    if (detailsTouchStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - detailsTouchStartY.current;
    if (deltaY > 0) {
      setDetailsDragOffset(deltaY);
    }
  };

  const handleDetailsTouchEnd = (e: React.TouchEvent) => {
    if (detailsTouchStartY.current === null) return;
    const endY = e.changedTouches[0].clientY;
    const deltaY = endY - detailsTouchStartY.current;
    detailsTouchStartY.current = null;
    setIsDraggingDetails(false);

    if (deltaY > 90) {
      setIsExpandedModalOpen(false);
      setDetailsDragOffset(0);
    } else {
      setDetailsDragOffset(0);
    }
  };

  if (!selectedVenue || !bottomSheetOpen) return null;

  const venuePosts = foodPosts.filter(
    (p) =>
      p.spot_id === selectedVenue.id ||
      p.spot_name.toLowerCase() === selectedVenue.name.toLowerCase()
  );

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    selectedVenue.name + ", " + selectedVenue.address + ", Oslo"
  )}`;

  const handleAddDish = () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
    } else {
      setIsCreateBiteModalOpen(true);
    }
  };

  const handleClose = () => {
    setBottomSheetOpen(false);
    setSelectedVenue(null);
    setIsExpandedModalOpen(false);
  };

  return (
    <>
      {/* ======================================================================= */}
      {/* 1. MOBILE FLOATING CARD (Neat, clean, photo + info + neon orange CTA)   */}
      {/* ======================================================================= */}
      {mobileSheetState === "peek" && (
        <div className="sm:hidden fixed bottom-[156px] left-3 right-3 z-40 bg-white/98 backdrop-blur-xl rounded-2xl border border-zinc-200/90 shadow-2xl p-3 flex flex-col space-y-2.5 animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-3">
            {/* Photo Preview */}
            {selectedVenue.cover_image_url && (
              <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-zinc-100 shrink-0 border border-zinc-100 shadow-xs">
                <Image
                  src={selectedVenue.cover_image_url}
                  alt={selectedVenue.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
                {selectedVenue.price_level && (
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-black/75 backdrop-blur-sm text-white text-[10px] font-mono font-bold">
                    {selectedVenue.price_level}
                  </span>
                )}
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0 pr-6">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-extrabold text-zinc-950 truncate tracking-tight">
                  {selectedVenue.name}
                </h3>
              </div>

              {selectedVenue.signature_dishes && selectedVenue.signature_dishes[0] && (
                <p className="text-[11px] font-medium text-[#ff5500] truncate mt-0.5">
                  ★ {selectedVenue.signature_dishes[0]}
                </p>
              )}

              <p className="text-[11px] text-zinc-500 truncate mt-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="truncate">{selectedVenue.address}, {selectedVenue.city}</span>
              </p>

              {selectedVenue.distance_meters && (
                <p className="text-[10px] font-semibold text-emerald-600 mt-0.5">
                  {formatDistance(selectedVenue.distance_meters)} away
                </p>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-2.5 right-2.5 text-zinc-400 hover:text-zinc-700 p-1 rounded-full hover:bg-zinc-100 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Action Row */}
          <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-2 text-xs">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-700 font-semibold text-[11px] border border-zinc-200/80 transition-colors"
            >
              <span>Google Maps</span>
              <ExternalLink className="w-3 h-3 text-zinc-400" />
            </a>

            <button
              onClick={() => setIsExpandedModalOpen(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#ff5500] hover:bg-[#e04b00] text-white font-semibold text-[11px] shadow-md shadow-[#ff5500]/25 transition-all"
            >
              <span>More Details</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* 2. DESKTOP FLOATING CARD (Leaves map visible & pins unobstructed)        */}
      {/* ======================================================================= */}
      <div className="hidden sm:flex fixed bottom-6 right-6 z-40 w-[380px] bg-white/95 backdrop-blur-md rounded-2xl border border-zinc-200/90 shadow-2xl p-4 flex-col space-y-3 animate-in slide-in-from-bottom-5 duration-200">
        <div className="flex items-start gap-3">
          {/* Thumbnail */}
          {selectedVenue.cover_image_url && (
            <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-zinc-100 shrink-0 border border-zinc-200 shadow-xs">
              <Image
                src={selectedVenue.cover_image_url}
                alt={selectedVenue.name}
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-sm font-bold text-zinc-900 truncate">
                {selectedVenue.name}
              </h3>
              {selectedVenue.price_level && (
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600">
                  {selectedVenue.price_level}
                </span>
              )}
            </div>

            <p className="text-[11px] text-zinc-500 truncate mt-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              <span className="truncate">{selectedVenue.address}, {selectedVenue.city}</span>
            </p>

            {selectedVenue.distance_meters && (
              <p className="text-[10px] font-medium text-emerald-600 mt-0.5">
                {formatDistance(selectedVenue.distance_meters)} away
              </p>
            )}

            {selectedVenue.live_food_status && (
              <p className="text-[10px] text-zinc-400 truncate mt-1">
                {selectedVenue.live_food_status}
              </p>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-700 p-1.5 rounded-full hover:bg-zinc-100 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Row */}
        <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-2 text-xs">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-700 font-semibold text-[11px] border border-zinc-200/80 transition-colors shadow-xs"
          >
            <span>Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
          </a>

          <button
            onClick={() => setIsExpandedModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 text-white font-semibold text-[11px] shadow-xs hover:bg-zinc-800 transition-colors"
          >
            <span>More Details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* 3. SLIDABLE EXPANDED FULL DETAILS CARD (Map slightly visible at top)     */}
      {/* ======================================================================= */}
      {isExpandedModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end pointer-events-auto">
          {/* Top gap: slightly shows map at top (~14vh) with dismiss on tap */}
          <div
            onClick={() => setIsExpandedModalOpen(false)}
            className="w-full h-[14vh] bg-black/30 backdrop-blur-[2px] cursor-pointer flex items-center justify-center transition-opacity"
          >
            <div className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-zinc-800 text-[11px] font-semibold shadow-xs">
              Slide down or tap map to close
            </div>
          </div>

          {/* Slidable Card container */}
          <div
            style={{
              transform: `translate3d(0, ${detailsDragOffset}px, 0)`,
              transition: isDraggingDetails
                ? "none"
                : "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            className="w-full h-[86vh] max-h-[86vh] bg-white rounded-t-3xl border-t border-zinc-200/90 shadow-2xl flex flex-col overflow-hidden will-change-transform"
          >
            {/* Grab Handle Header for dragging */}
            <div
              onTouchStart={handleDetailsTouchStart}
              onTouchMove={handleDetailsTouchMove}
              onTouchEnd={handleDetailsTouchEnd}
              className="w-full flex flex-col items-center pt-2.5 pb-2 px-5 cursor-grab active:cursor-grabbing bg-white border-b border-zinc-100 shrink-0 touch-none select-none"
            >
              {/* Pill grab bar */}
              <div className="w-12 h-1.5 rounded-full bg-zinc-300 hover:bg-zinc-400 transition-colors mb-2" />

              <div className="w-full flex items-center justify-between">
                <div className="min-w-0 pr-4">
                  <h3 className="text-base font-extrabold text-zinc-950 truncate tracking-tight">
                    {selectedVenue.name}
                  </h3>
                  <p className="text-xs text-zinc-500 truncate">
                    {selectedVenue.address}, {selectedVenue.city}
                  </p>
                </div>
                <button
                  onClick={() => setIsExpandedModalOpen(false)}
                  className="p-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 transition-colors shrink-0"
                  title="Close details"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs no-scrollbar">
              {/* Cover Photo */}
              {selectedVenue.cover_image_url && (
                <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-100">
                  <Image
                    src={selectedVenue.cover_image_url}
                    alt={selectedVenue.name}
                    fill
                    className="object-cover"
                    sizes="480px"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-700 font-semibold"
                >
                  <span>Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                </a>

                <button
                  onClick={() => {
                    setIsExpandedModalOpen(false);
                    handleAddDish();
                  }}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#ff5500] hover:bg-[#e04b00] text-white font-semibold shadow-md shadow-[#ff5500]/25 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Dish</span>
                </button>
              </div>

              {/* Signature Dishes */}
              {selectedVenue.signature_dishes && selectedVenue.signature_dishes.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="font-bold text-zinc-700 uppercase text-[10px] tracking-wider">Must Try Dishes</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedVenue.signature_dishes.map((dish) => (
                      <span
                        key={dish}
                        className="px-2.5 py-1 rounded-lg bg-orange-50/80 border border-orange-200/60 text-zinc-900 text-[11px] font-medium"
                      >
                        ⭐ {dish}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* About description */}
              {selectedVenue.description && (
                <div className="space-y-1">
                  <h4 className="font-bold text-zinc-700 uppercase text-[10px] tracking-wider">About</h4>
                  <p className="text-zinc-600 leading-relaxed bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                    {selectedVenue.description}
                  </p>
                </div>
              )}

              {/* Community dishes */}
              {venuePosts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-zinc-700 uppercase text-[10px] tracking-wider">Community Posts ({venuePosts.length})</h4>
                  <div className="grid grid-cols-2 gap-2 pb-6">
                    {venuePosts.map((p) => (
                      <div
                        key={p.id}
                        className="rounded-xl overflow-hidden border border-zinc-200 bg-white shadow-xs"
                      >
                        <div className="relative aspect-video w-full bg-zinc-100">
                          <Image src={p.image_url} alt={p.dish_name} fill className="object-cover" />
                        </div>
                        <div className="p-2 space-y-0.5">
                          <p className="font-bold text-zinc-900 truncate text-[11px]">{p.dish_name}</p>
                          <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                            <span>{p.price_nok} NOK</span>
                            <span className="font-bold text-zinc-800">★ {p.rating}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
