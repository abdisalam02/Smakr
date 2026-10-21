"use client";

import React from "react";
import Image from "next/image";
import {
  Flame,
  Calendar,
  MapPin,
  ExternalLink,
  Navigation,
  Sparkles,
  Ticket,
  ChefHat,
  Clock,
  Zap,
} from "lucide-react";
import type { FoodPost, Venue } from "@/types";
import {
  getPopupStatus,
  getPopupMeta,
  getPopupUrgencyLabel,
} from "@/lib/popupUtils";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { incrementBringBack } from "@/lib/supabase/data";

export interface PopupEventCardProps {
  post?: FoodPost | null;
  venue: Venue;
  priority?: boolean;
}

export function PopupEventCard({
  post,
  venue,
  priority = false,
}: PopupEventCardProps) {
  const selectVenueById = useCityPulseStore((s) => s.selectVenueById);
  const flyToSpot = useCityPulseStore((s) => s.flyToSpot);
  const setIsVenueDetailModalOpen = useCityPulseStore(
    (s) => s.setIsVenueDetailModalOpen
  );

  const popupStatus = getPopupStatus(venue);
  const popupMeta = getPopupMeta(venue);
  const urgencyLabel = getPopupUrgencyLabel(venue);

  const dishName =
    post?.dish_name ||
    venue.signature_dishes?.[0] ||
    venue.name ||
    "Residency Special";
  const displayImage =
    post?.image_url ||
    venue.cover_image_url ||
    "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80";

  const priceNok = post?.price_nok || 195;
  const hostVenueName =
    popupMeta?.host_venue_name || venue.address || "Oslo, Norway";
  const guestChef = popupMeta?.guest_chef || null;
  const eventHours = popupMeta?.event_hours || "17:00 – Sold Out";
  const dateLabel =
    popupMeta?.date_label ||
    (venue.popup_end_date
      ? `Til ${new Date(venue.popup_end_date).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        })}`
      : "This Weekend");
  const batchLimit = popupMeta?.batch_limit || "Limited batch";
  const tasteNote =
    post?.review_text ||
    venue.description ||
    "Limited residency serving authentic small-batch food in Oslo.";

  const handleOpenVenue = () => {
    selectVenueById(venue.id);
    setIsVenueDetailModalOpen(true);
  };

  const handleFlyToMap = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectVenueById(venue.id);
    if (
      Number.isFinite(venue.latitude) &&
      Number.isFinite(venue.longitude) &&
      venue.latitude !== 0
    ) {
      flyToSpot([venue.longitude, venue.latitude], venue.id);
    }
  };

  const isDimmed = popupStatus.isDimmedCard;
  const isExpired = popupStatus.status === "expired" || popupStatus.status === "grace";

  const residencyStatus =
    popupMeta?.residency_status ||
    (popupStatus.status === "upcoming"
      ? "next_confirmed"
      : popupStatus.status === "expired" || popupStatus.status === "grace" || popupStatus.status === "dormant"
      ? "between_residencies"
      : "active");

  const isDormant = residencyStatus === "between_residencies";
  const isUpcoming = residencyStatus === "next_confirmed";
  const isActive = residencyStatus === "active";

  const [hasReacted, setHasReacted] = React.useState(false);
  const [reactionCount, setReactionCount] = React.useState(() => {
    if (popupMeta?.bring_back_count && popupMeta.bring_back_count > 0) {
      return popupMeta.bring_back_count;
    }
    const hash = venue.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return isDormant ? (hash % 35) + 14 : (hash % 25) + 11;
  });

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(`smakr_reaction_${venue.id}`);
      if (saved === "true") {
        setHasReacted(true);
      }
    } catch {}
  }, [venue.id]);

  const handleToggleReaction = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasReacted) return;
    setHasReacted(true);
    setReactionCount((c) => c + 1);
    try {
      localStorage.setItem(`smakr_reaction_${venue.id}`, "true");
      const updatedCount = await incrementBringBack(venue.id);
      if (typeof updatedCount === "number" && updatedCount > 0) {
        setReactionCount(updatedCount);
      }
    } catch {}
  };

  return (
    <article
      onClick={handleOpenVenue}
      className={`group relative w-full rounded-[26px] bg-[#FAF7F2] dark:bg-[#1E1C1A] border-2 border-[#181615] dark:border-white/15 shadow-[0_8px_24px_rgba(24,22,21,0.08)] overflow-hidden cursor-pointer select-none transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 ${
        isDormant ? "bg-[#F3EFE8] dark:bg-[#1A1816]" : ""
      }`}
    >
      {/* =========================================================================
          TOP URGENCY RIBBON BY RESIDENCY STATE
          ========================================================================= */}
      <div
        className={`flex items-center justify-between gap-1.5 px-3 sm:px-4 py-2 border-b-2 border-[#181615] flex-wrap ${
          isActive
            ? "bg-[#181615] text-[#FAF7F2]"
            : isUpcoming
            ? "bg-[#2B1810] text-[#FAF7F2]"
            : "bg-[#262320] text-[#FAF7F2]"
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {isActive && (
            <span className="px-2.5 py-0.5 rounded-full bg-[#E84A27] text-white font-extrabold text-[10px] sm:text-[11px] tracking-wide uppercase flex items-center gap-1 shrink-0 animate-pulse">
              <Flame className="w-3 h-3 fill-white" />
              <span>LIVE NOW · {urgencyLabel}</span>
            </span>
          )}

          {isUpcoming && (
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-black font-extrabold text-[10px] sm:text-[11px] tracking-wide uppercase flex items-center gap-1 shrink-0">
              <Calendar className="w-3 h-3 fill-black" />
              <span>NEXT DROP · {dateLabel}</span>
            </span>
          )}

          {isDormant && (
            <span className="px-2.5 py-0.5 rounded-full bg-stone-700 text-stone-200 font-extrabold text-[10px] sm:text-[11px] tracking-wide uppercase flex items-center gap-1 shrink-0">
              <span>⏸</span>
              <span>BETWEEN RESIDENCIES · OSLO</span>
            </span>
          )}

          <span className="text-[11px] font-bold text-zinc-300 truncate">
            {isDormant
              ? `PREVIOUSLY AT: ${hostVenueName.replace(/^Hosted at /i, "")}`
              : `HOSTED AT: ${hostVenueName.replace(/^Hosted at /i, "")}`}
          </span>
        </div>

        <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 shrink-0">
          <Clock className="w-3 h-3 text-[#E84A27]" />
          <span>{eventHours}</span>
        </div>
      </div>

      {/* =========================================================================
          HERO DISH PHOTO (16:10 or 4:3 Full Bleed)
          ========================================================================= */}
      <div className="relative aspect-[16/10] sm:aspect-[4/3] w-full overflow-hidden bg-stone-900">
        <Image
          src={displayImage}
          alt={dishName}
          fill
          priority={priority}
          unoptimized={displayImage.startsWith("/api/places/photos")}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, 500px"
        />

        {/* Bottom dark scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

        {/* Tilted Burnt Paprika Price Sticker (-1.5deg) */}
        <div
          style={{ transform: "rotate(-1.5deg)" }}
          className="absolute top-3 right-3 px-3 py-1 rounded-xl bg-[#E84A27] text-white font-comico text-sm sm:text-base font-black shadow-md border border-white/20"
        >
          {priceNok} kr
        </div>

        {/* Guest Chef Badge */}
        {guestChef && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAF7F2]/95 dark:bg-[#1E1C1A]/95 backdrop-blur-md text-[#181615] dark:text-white text-[11px] font-bold shadow-sm border border-[#181615]/10">
            <ChefHat className="w-3 h-3 text-[#E84A27]" />
            <span>{guestChef}</span>
          </div>
        )}

        {/* Overlay Title at bottom of photo */}
        <div className="absolute bottom-2.5 inset-x-3.5 text-white pointer-events-none">
          <div className="text-[10px] font-mono uppercase tracking-widest text-amber-300 font-bold">
            {isDormant ? "OSLO CHEF COLLECTIVE" : "OSLO POP-UP RESIDENCY"}
          </div>
          <h3 className="font-comico text-xl sm:text-2xl font-black text-white tracking-tight leading-tight truncate drop-shadow-md">
            {dishName}
          </h3>
        </div>
      </div>

      {/* =========================================================================
          BODY: TACTILE TICKET SECTION WITH DASHED DIVIDER
          ========================================================================= */}
      <div className="p-4 sm:p-5 space-y-3 bg-[#FAF7F2] dark:bg-[#1E1C1A] text-[#181615] dark:text-[#FAF7F2]">
        {/* Host Venue Subtitle */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-[#181615] dark:text-white truncate">
            <MapPin className="w-3.5 h-3.5 text-[#E84A27] shrink-0" />
            <span className="truncate">
              {venue.name} · {venue.neighborhood || venue.city || "Oslo"}
            </span>
          </div>

          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#181615]/5 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 shrink-0">
            {isDormant ? "Brand Profile" : "Residency"}
          </span>
        </div>

        {/* Dashed Ticket Divider */}
        <div className="border-t-2 border-dashed border-[#181615]/15 dark:border-white/15 pt-2">
          {/* Insider Taste Note */}
          <p className="text-xs text-[#2B1810]/80 dark:text-zinc-300 leading-relaxed italic line-clamp-2">
            ✦ "{tasteNote}"
          </p>
        </div>

        {/* =========================================================================
            FOOTER BAR: DATES, BATCH GAUGE & ACTIONS
            ========================================================================= */}
        <div className="pt-2 border-t border-[#181615]/10 dark:border-white/10 flex items-center justify-between gap-2 flex-wrap text-xs">
          {/* Dates & Batch Pill */}
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#2B1810]/75 dark:text-zinc-400">
            <span className="font-bold text-[#E84A27] flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{dateLabel}</span>
            </span>
            <span>·</span>
            <span className="flex items-center gap-1 truncate font-medium">
              <Zap className="w-3 h-3 text-amber-500 shrink-0" />
              <span className="truncate">{batchLimit}</span>
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            {/* Interactive Reaction Button */}
            <button
              type="button"
              onClick={handleToggleReaction}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
                hasReacted
                  ? "bg-[#E84A27] text-white border-[#E84A27] shadow-xs"
                  : isDormant
                  ? "bg-orange-500/10 hover:bg-orange-500/20 text-[#E84A27] border-orange-500/30"
                  : "bg-black/5 dark:bg-white/10 hover:bg-[#E84A27]/10 text-[#181615] dark:text-zinc-200 border-[#181615]/10 dark:border-white/10"
              }`}
              title={
                isDormant
                  ? "Vote to petition this chef for another Oslo residency"
                  : isUpcoming
                  ? "Remind me when residency opens"
                  : "Signal you are attending"
              }
            >
              {isDormant ? (
                <>
                  <Flame className={`w-3.5 h-3.5 ${hasReacted ? "fill-white text-white" : "text-[#E84A27] fill-[#E84A27]"}`} />
                  <span>Bring Back · {reactionCount}</span>
                </>
              ) : isUpcoming ? (
                <>
                  <span className="text-xs">🔔</span>
                  <span>Remind Me · {reactionCount}</span>
                </>
              ) : (
                <>
                  <span className="text-xs">🙋</span>
                  <span>Going · {reactionCount}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleFlyToMap}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-[#E84A27] hover:text-white text-[#181615] dark:text-zinc-200 font-bold text-[11px] transition-all cursor-pointer"
              title="Locate on Map Radar"
            >
              <Navigation className="w-3 h-3 text-[#E84A27] group-hover:text-white" />
              <span>Radar</span>
            </button>

            {popupMeta?.rsvp_url ? (
              <a
                href={popupMeta.rsvp_url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#181615] hover:bg-[#2B1810] text-white font-bold text-[11px] shadow-xs transition-all cursor-pointer"
              >
                <Ticket className="w-3 h-3 text-amber-400" />
                <span>{isUpcoming ? "RSVP / Info" : "RSVP"}</span>
              </a>
            ) : (
              <span className="px-2.5 py-1.5 rounded-xl bg-[#E84A27]/10 text-[#E84A27] font-bold text-[10px] tracking-wide font-mono uppercase">
                Walk-in
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
