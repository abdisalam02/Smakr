"use client";

import React from "react";
import Image from "next/image";
import { MapPin, Wifi, Users, Volume2 } from "lucide-react";
import { Venue } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { formatDistance } from "@/lib/math";

interface VenueCardProps {
  venue: Venue;
  onClick?: () => void;
}

export function VenueCard({ venue, onClick }: VenueCardProps) {
  return (
    <div
      onClick={onClick}
      className="group flex flex-col sm:flex-row gap-3 p-3 rounded-xl bg-[#ffffff] hover:bg-[#faf8f5] border border-[#e3dcce] hover:border-[#b85434] cursor-pointer shadow-xs hover:shadow-md transition-all"
    >
      {/* Thumbnail */}
      {venue.cover_image_url && (
        <div className="relative w-full sm:w-24 h-24 rounded-lg overflow-hidden shrink-0 border border-[#e3dcce]">
          <Image
            src={venue.cover_image_url}
            alt={venue.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 96px"
          />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 flex flex-col justify-between space-y-1.5">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-xs sm:text-sm text-[#221e19] group-hover:text-[#b85434] transition-colors line-clamp-1">
              {venue.name}
            </h3>
            <Badge variant="vibe" vibeStatus={venue.vibe.overall_status} />
          </div>

          <p className="text-xs text-[#6b6459] flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-[#b85434] shrink-0" />
            <span className="line-clamp-1">{venue.address}</span>
            {venue.distance_meters && (
              <span className="text-[#8c8374] ml-1">
                • {formatDistance(venue.distance_meters)}
              </span>
            )}
          </p>
        </div>

        {/* Live Vibe Summary */}
        <div className="flex items-center gap-3 text-[11px] text-[#6b6459] pt-1 border-t border-[#e3dcce]">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3 text-[#8c8374]" />
            <span>{venue.vibe.seat_label}</span>
          </span>

          <span className="flex items-center gap-1">
            <Volume2 className="w-3 h-3 text-[#8c8374]" />
            <span>{venue.vibe.noise_label}</span>
          </span>

          {venue.vibe.avg_download_mbps && (
            <span className="flex items-center gap-1 text-[#b85434] font-medium ml-auto">
              <Wifi className="w-3 h-3" />
              <span>{venue.vibe.avg_download_mbps} Mbps</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
