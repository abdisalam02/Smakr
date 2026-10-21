"use client";

import React from "react";
import Image from "next/image";
import {
  MapPin,
  Star,
  Share2,
  X,
  ExternalLink,
  Plus,
  Pencil,
  Camera,
  Clock,
  Sparkles,
  CheckCircle2,
  Utensils,
  Truck,
  Flame,
} from "lucide-react";
import type { Venue, SpotType } from "@/types";
import { formatOsloLocation } from "@/lib/location";
import { getVenueLiveOpenStatus } from "@/lib/openingHours";
import { getPopupStatus } from "@/lib/popupUtils";

export interface PartnerDishItem {
  id: string;
  dishName: string;
  priceNok: number | null;
  imageUrl: string;
  tasteNote: string;
  rating?: number | null;
  dietaryTags?: string[];
  category?: string;
}

export interface PartnerRestaurantCardPreviewProps {
  venue: Venue;
  coverImageUrl?: string;
  openingHours?: string;
  spotType?: SpotType | "standard" | "pop_up";
  locationSchedule?: string;
  priceLevel?: string;
  dishes: PartnerDishItem[];
  selectedDishIndex?: number;
  onEditCoverPhoto?: () => void;
  onEditHours?: () => void;
  onEditDish?: (index: number) => void;
  onAddDish?: () => void;
  isVerified?: boolean;
  isProposed?: boolean;
  className?: string;
}

/**
 * Visual twin of VenueBottomSheet.tsx used in Smakr Partner Studio.
 * Renders the authentic Restaurant Sheet with direct tap-to-edit sheet triggers.
 */
export const PartnerRestaurantCardPreview = React.memo(
  function PartnerRestaurantCardPreview({
    venue,
    coverImageUrl,
    openingHours,
    spotType = "standard",
    locationSchedule,
    priceLevel,
    dishes,
    onEditCoverPhoto,
    onEditHours,
    onEditDish,
    onAddDish,
    isVerified = false,
    isProposed = true,
    className = "",
  }: PartnerRestaurantCardPreviewProps) {
    const locationInfo = formatOsloLocation(
      venue.address,
      venue.city || venue.neighborhood
    );
    const openStatus = getVenueLiveOpenStatus(venue);
    const popupStatus = getPopupStatus(venue);

    const displayCover = coverImageUrl?.trim() || venue.cover_image_url || "/images/placeholder-venue.jpg";
    const displayRating =
      typeof venue.google_rating === "number" && venue.google_rating > 0
        ? venue.google_rating.toFixed(1)
        : null;

    return (
      <div
        className={`relative w-full max-w-2xl mx-auto rounded-3xl bg-[var(--surface)] border border-[var(--surface-border)] shadow-xl overflow-hidden select-none transition-all ${className}`}
      >
        {/* Top Rubber-Stamp Diff Badge */}
        <div className="absolute top-3.5 left-4 z-30 pointer-events-none rotate-[-2deg] select-none">
          <div
            className={`px-2.5 py-0.5 rounded-md border-2 font-comico text-[10.5px] font-bold tracking-wider uppercase shadow-xs ${
              isProposed
                ? "border-[#e84a27] bg-[#FAF7F2] text-[#e84a27] shadow-[0_2px_8px_rgba(232,74,39,0.18)]"
                : "border-zinc-500 bg-[#FAF7F2] text-zinc-600 dark:text-zinc-400"
            }`}
          >
            {isProposed ? "✦ SMAKR RADAR VIEW" : "RAW GOOGLE LISTING"}
          </div>
        </div>

        {/* Top Handle Header */}
        <div className="w-full flex flex-col items-center pt-3 pb-3 px-5 sm:px-6 bg-[var(--surface)] border-b border-[var(--surface-border)]">
          <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700 mb-2.5" />

          <div className="w-full flex items-start justify-between gap-3 pt-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-comico text-2xl sm:text-3xl text-zinc-950 dark:text-white tracking-tight leading-tight truncate">
                  {venue.name || "Your Restaurant"}
                </h3>
                {isVerified && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Verified Kitchen</span>
                  </span>
                )}
              </div>

              <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1.5 flex-wrap">
                <MapPin className="w-3.5 h-3.5 text-[#e84a27] shrink-0" />
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {locationInfo.fullClean || venue.address || "Oslo, Norway"}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
              <span className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                <Share2 className="w-4 h-4" />
              </span>
              <span className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                <X className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Sheet Content */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Cover Photo with Tap-to-Edit Floating Affordance Pill */}
          <div className="group relative w-full h-52 sm:h-60 rounded-3xl overflow-hidden border border-[var(--surface-border)] bg-zinc-900 shadow-xs">
            {displayCover.startsWith("http") || displayCover.startsWith("/") ? (
              <Image
                src={
                  displayCover.startsWith("/api/places/photos") && !displayCover.includes("w=")
                    ? `${displayCover}&w=800`
                    : displayCover
                }
                alt={venue.name}
                fill
                unoptimized
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, 700px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs">
                No cover photo set
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

            {/* In-Card Bottom Badges */}
            <div className="absolute bottom-3 inset-x-3 flex items-center justify-between text-white pointer-events-none">
              <span className="font-bold text-xs sm:text-sm tracking-tight drop-shadow-md">
                {venue.live_food_status || "Oslo Culinary Hotspot"}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-mono font-bold border border-white/20">
                {priceLevel || venue.price_level || "$$"}
              </span>
            </div>

            {/* Floating Affordance Pill: [ ✎ Swap Hero Photo ] */}
            {onEditCoverPhoto && (
              <button
                type="button"
                onClick={onEditCoverPhoto}
                className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#181615]/85 hover:bg-[#e84a27] text-white text-xs font-bold backdrop-blur-md border border-white/25 shadow-md transition-all cursor-pointer active:scale-95"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Swap Hero Photo</span>
              </button>
            )}
          </div>

          {/* Pop-up / Food Truck Callouts */}
          {(spotType === "pop_up" || spotType === "popup") && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200">
              <span className="text-xl">🎪</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold">Pop-Up Residency</p>
                {venue.popup_end_date && (
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Active until {new Date(venue.popup_end_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          )}

          {spotType === "food_truck" && locationSchedule && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-900 dark:text-emerald-200">
              <Truck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold">Food Truck Location &amp; Hours</p>
                <p className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300">
                  {locationSchedule}
                </p>
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-[var(--surface-raised)] border border-[var(--surface-border)] text-zinc-700 dark:text-zinc-300 font-semibold text-xs">
              <span>Directions</span>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
            </div>

            <div className="flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-[#e84a27] text-white font-semibold text-xs shadow-xs">
              <Plus className="w-4 h-4" />
              <span>Log a Dish</span>
            </div>
          </div>

          {/* Quick Stats Row with Edit Trigger */}
          <div className="relative group p-3 rounded-2xl bg-[var(--surface-raised)] border border-[var(--surface-border)]">
            <div className="grid grid-cols-4 gap-1 text-center">
              <div>
                <div className="text-[10px] text-zinc-400 uppercase font-mono tracking-wider">Rating</div>
                <div className="flex items-center justify-center gap-0.5 mt-0.5">
                  <span className="text-amber-500 text-xs">★</span>
                  <span className="font-comico text-sm text-zinc-950 dark:text-white font-bold">
                    {displayRating || "4.8"}
                  </span>
                </div>
              </div>

              <div className="border-l border-[var(--surface-border)]">
                <div className="text-[10px] text-zinc-400 uppercase font-mono tracking-wider">Price</div>
                <div className="font-mono font-bold text-xs text-zinc-900 dark:text-zinc-100 mt-1">
                  {priceLevel || venue.price_level || "$$"}
                </div>
              </div>

              <div className="border-l border-[var(--surface-border)]">
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

              <div className="border-l border-[var(--surface-border)]">
                <div className="text-[10px] text-zinc-400 uppercase font-mono tracking-wider">Area</div>
                <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 truncate mt-1 capitalize px-1">
                  {locationInfo.neighborhood || "Oslo"}
                </div>
              </div>
            </div>

            {/* Hours display line */}
            <div className="mt-2.5 pt-2 border-t border-[var(--surface-border)] flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
              <div className="flex items-center gap-1.5 truncate">
                <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="truncate">
                  {openingHours || venue.current_opening_hours_text || "Hours set by Google Maps"}
                </span>
              </div>

              {onEditHours && (
                <button
                  type="button"
                  onClick={onEditHours}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAF7F2] dark:bg-zinc-800 border border-[var(--surface-border)] hover:border-[#e84a27] text-[11px] font-bold text-[#e84a27] shadow-xs shrink-0 ml-2 cursor-pointer transition-all active:scale-95"
                >
                  <Pencil className="w-3 h-3" />
                  <span>Hours &amp; Live Batch</span>
                </button>
              )}
            </div>
          </div>

          {/* Dishes You Can't Miss Section */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-zinc-900 dark:text-white text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#e84a27]" />
                <span>Dishes You Can't Miss ({dishes.length})</span>
              </h4>

              {onAddDish && (
                <button
                  type="button"
                  onClick={onAddDish}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#e84a27]/10 hover:bg-[#e84a27] text-[#e84a27] hover:text-white text-xs font-bold transition-all cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Dish</span>
                </button>
              )}
            </div>

            {dishes.length === 0 ? (
              <div className="p-6 rounded-2xl bg-[var(--surface-raised)] border border-dashed border-[var(--surface-border)] text-center space-y-2">
                <Utensils className="w-6 h-6 text-zinc-400 mx-auto" />
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  No signature dishes configured yet.
                </p>
                {onAddDish && (
                  <button
                    type="button"
                    onClick={onAddDish}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#e84a27] text-white text-xs font-bold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Your First Signature Dish</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {dishes.map((dish, idx) => (
                  <div
                    key={dish.id || idx}
                    className="group relative p-3 sm:p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--surface-border)] shadow-xs flex flex-col sm:flex-row gap-3.5 transition-all hover:border-[#e84a27]/40"
                  >
                    {/* Dish Photo */}
                    <div className="relative w-full sm:w-28 h-32 sm:h-28 rounded-xl overflow-hidden bg-zinc-900 shrink-0 border border-black/10">
                      {dish.imageUrl ? (
                        <Image
                          src={
                            dish.imageUrl.startsWith("/api/places/photos") && !dish.imageUrl.includes("w=")
                              ? `${dish.imageUrl}&w=400`
                              : dish.imageUrl
                          }
                          alt={dish.dishName}
                          fill
                          unoptimized
                          className="object-cover"
                          sizes="120px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs">
                          No photo
                        </div>
                      )}

                      {typeof dish.priceNok === "number" && dish.priceNok > 0 && (
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-[#e84a27] text-white font-mono font-bold text-[10px] shadow-xs">
                          {dish.priceNok} kr
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="font-black text-zinc-900 dark:text-white text-sm leading-snug">
                            {dish.dishName || "Signature Dish"}
                          </h5>

                          {onEditDish && (
                            <button
                              type="button"
                              onClick={() => onEditDish(idx)}
                              className="px-2.5 py-1 rounded-full bg-[#FAF7F2] dark:bg-zinc-800 border border-[var(--surface-border)] hover:bg-[#e84a27] hover:border-[#e84a27] text-zinc-800 dark:text-zinc-200 hover:text-white text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-xs active:scale-95"
                            >
                              <Pencil className="w-3 h-3 text-[#e84a27]" />
                              <span>Edit Dish &amp; kr</span>
                            </button>
                          )}
                        </div>

                        {dish.tasteNote && (
                          <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                            &ldquo;{dish.tasteNote}&rdquo;
                          </p>
                        )}

                        {dish.dietaryTags && dish.dietaryTags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {dish.dietaryTags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 rounded-full bg-[var(--surface-raised)] border border-[var(--surface-border)] text-zinc-600 dark:text-zinc-400 text-[10px] font-semibold capitalize"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pt-2 mt-2 border-t border-[var(--surface-border)] flex items-center justify-between text-[10px] text-zinc-400">
                        <span>Signature selection</span>
                        {isProposed && (
                          <span className="font-bold text-[#e84a27]">
                            ● Proposed for verification
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);
