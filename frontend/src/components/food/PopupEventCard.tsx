"use client";

import React from "react";
import Image from "next/image";
import { Bookmark, Flame, Calendar, Clock, ExternalLink } from "lucide-react";
import type { FoodPost, Venue } from "@/types";
import { getPopupStatus, getPopupMeta } from "@/lib/popupUtils";
import { useCityPulseStore } from "@/store/useCityPulseStore";

export interface PopupEventCardProps {
  post?: FoodPost | null;
  venue: Venue;
  priority?: boolean;
  /** Uniform-height swimlane treatment (215x265 wrapper). */
  compact?: boolean;
}

export function PopupEventCard({
  post,
  venue,
  priority = false,
  compact = false,
}: PopupEventCardProps) {
  const selectVenueById = useCityPulseStore((s) => s.selectVenueById);
  const setIsVenueDetailModalOpen = useCityPulseStore((s) => s.setIsVenueDetailModalOpen);
  const savedPostIds = useCityPulseStore((s) => s.savedPostIds);
  const toggleSavePost = useCityPulseStore((s) => s.toggleSavePost);

  const popupStatus = getPopupStatus(venue);
  const popupMeta = getPopupMeta(venue);

  const title = venue.name || "Oslo Pop-Up";

  const displayImage =
    venue.cover_image_url ||
    post?.image_url ||
    "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=80";

  const rawCategory = venue.food_category || post?.category || "pop_up";
  const displayCategory =
    rawCategory.charAt(0).toUpperCase() + rawCategory.slice(1).replace(/_/g, " ");

  const residencyStatus =
    popupMeta?.residency_status ||
    (popupStatus.status === "upcoming"
      ? "next_confirmed"
      : popupStatus.status === "expired" || popupStatus.status === "grace" || popupStatus.status === "dormant"
      ? "between_residencies"
      : "active");

  const isDormant =
    residencyStatus === "between_residencies" ||
    Boolean(popupMeta?.dates_label?.toLowerCase().includes("tba"));
  const isUpcoming = residencyStatus === "next_confirmed";
  const isActive = residencyStatus === "active" && !isDormant;

  const postId = post?.id || `popup_post_${venue.id}`;
  const isSaved = savedPostIds ? savedPostIds.has(postId) : false;

  const handleOpenDetails = () => {
    selectVenueById(venue.id);
    setIsVenueDetailModalOpen(true);
  };

  const handleToggleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSavePost(postId);
  };

  return (
    <article
      onClick={handleOpenDetails}
      className={`group relative w-full ${
        compact
          ? "aspect-auto h-full min-h-0 max-h-none rounded-[24px] p-3"
          : "aspect-[16/10] sm:aspect-[16/9] min-h-[230px] max-h-[270px] rounded-[24px] sm:rounded-[28px] p-3.5 sm:p-4"
      } overflow-hidden bg-[#181615] border transition-all duration-300 cursor-pointer select-none flex flex-col justify-between ${
        isDormant
          ? "grayscale-[25%] opacity-90 border-black/10 dark:border-white/10 shadow-md"
          : isActive
          ? "border-[#E84A27]/40 shadow-[0_4px_20px_rgba(232,74,39,0.14)] hover:shadow-xl"
          : "border-black/10 dark:border-white/10 shadow-lg hover:shadow-xl"
      }`}
    >
      {/* Background Photo */}
      <Image
        src={displayImage}
        alt={title}
        fill
        priority={priority}
        unoptimized={displayImage.startsWith("/api/places/photos")}
        className="object-cover transition-transform duration-700 group-hover:scale-105 pointer-events-none"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />

      {/* Dark Vignette & Gradient Overlay (Crisp bottom readability) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/25 pointer-events-none" />

      {/* =====================================================================
          TOP HEADER BAR: CATEGORY PILL + STATUS PILL & BOOKMARK
          ===================================================================== */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        {/* Left: Category / Dietary Badge */}
        <span className="px-2.5 py-0.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-[11px] font-semibold tracking-wide border border-white/20 transition-colors shadow-2xs">
          {displayCategory}
        </span>

        {/* Right: Status Pill & Bookmark Button */}
        <div className="flex items-center gap-1.5">
          {isDormant ? (
            <span className="px-2.5 py-0.5 rounded-full bg-stone-900/80 backdrop-blur-md text-stone-300 text-[10px] font-bold border border-white/15 uppercase tracking-wider">
              Inactive · TBA
            </span>
          ) : isActive ? (
            <span className="px-2.5 py-0.5 rounded-full bg-[#E84A27] text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-xs">
              <Flame className="w-2.5 h-2.5 fill-white" />
              <span>Live Now</span>
            </span>
          ) : !compact ? (
            <span className="px-2.5 py-0.5 rounded-full bg-[#FAF7F2] text-[#181615] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-xs">
              <Calendar className="w-2.5 h-2.5" />
              <span>Next Drop</span>
            </span>
          ) : null}

          <button
            type="button"
            onClick={handleToggleBookmark}
            aria-label="Bookmark pop-up"
            className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/20 transition-all cursor-pointer shadow-2xs active:scale-90"
          >
            <Bookmark
              className={`w-3.5 h-3.5 transition-colors ${
                isSaved ? "fill-white text-white" : "text-white"
              }`}
            />
          </button>
        </div>
      </div>

      {/* =====================================================================
          BOTTOM CONTENT: TITLE + CONCEPT STORY + COMPACT FULL-WIDTH CTA PILL
          ===================================================================== */}
      <div className={`relative z-10 ${compact ? "space-y-1.5 pt-1.5" : "space-y-2 pt-2"}`}>
        <div>
          <h3 className={`font-comico font-normal ${compact ? "text-[15px]" : "text-xl sm:text-2xl"} text-white tracking-tight leading-tight line-clamp-1 drop-shadow-md`}>
            {title}
          </h3>
        </div>

        {/* Inactive hint or Drop details indicator */}
        {isDormant ? (
          <div className="text-[10px] font-medium text-stone-300/80">
            Dates &amp; location announcing soon
          </div>
        ) : popupMeta?.dates_label ? (
          <div
            className={`flex items-center ${
              compact ? "justify-between gap-2" : "gap-2"
            } text-[10.5px] font-semibold text-white/90 min-w-0`}
          >
            <span className="flex items-center gap-1 text-[#FF8566] whitespace-nowrap shrink-0">
              <Calendar className="w-3 h-3 shrink-0" />
              <span>{popupMeta.dates_label}</span>
            </span>
            {popupMeta?.host_venue_name && !popupMeta.host_venue_name.toLowerCase().includes("tba") && (
              <>
                {!compact && <span>·</span>}
                <span className="truncate min-w-0">At {popupMeta.host_venue_name}</span>
              </>
            )}
          </div>
        ) : null}

        {/* Honey Glazed Chicken Style White Rounded Pill CTA */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenDetails();
          }}
          className={`w-full ${compact ? "py-2 text-[11px]" : "py-2 sm:py-2.5 text-xs"} rounded-full font-bold tracking-wide flex items-center justify-center gap-1.5 shadow-md transition-transform active:scale-[0.98] cursor-pointer ${
            isDormant
              ? "bg-[#FAF7F2]/95 hover:bg-white text-[#181615]"
              : "bg-white hover:bg-stone-100 text-[#181615]"
          }`}
        >
          <span>{isDormant ? "View Pop-Up Residency" : compact ? "View Details" : "View Pop-Up Details"}</span>
        </button>
      </div>
    </article>
  );
}
