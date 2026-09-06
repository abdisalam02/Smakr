"use client";

import React from "react";
import { SavedCollection, Venue } from "@/types";
import { MapPin, ArrowRight } from "lucide-react";

interface CollectionCardProps {
  collection: SavedCollection;
  venues?: Venue[];
  onClick?: () => void;
}

export function CollectionCard({
  collection,
  venues = [],
  onClick,
}: CollectionCardProps) {
  return (
    <div
      onClick={onClick}
      className="group bg-[#ffffff] hover:bg-[#faf8f5] border border-[#e3dcce] hover:border-[#b85434] rounded-xl p-4 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3"
    >
      <div className="space-y-2">
        {/* Top Tag & Emoji */}
        <div className="flex items-center justify-between">
          <span className="text-2xl p-2 rounded-lg bg-[#f6f3ee] border border-[#e3dcce]">
            {collection.emoji}
          </span>
          {collection.tag && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#f6f3ee] text-[#b85434] border border-[#edd8b2]">
              {collection.tag}
            </span>
          )}
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="text-sm font-bold text-[#221e19] group-hover:text-[#b85434] transition-colors">
            {collection.title}
          </h3>
          {collection.description && (
            <p className="text-xs text-[#6b6459] mt-1 line-clamp-2 leading-relaxed">
              {collection.description}
            </p>
          )}
        </div>
      </div>

      {/* Footer count & preview */}
      <div className="flex items-center justify-between pt-2.5 border-t border-[#e3dcce] text-xs text-[#6b6459]">
        <div className="flex items-center gap-1">
          <MapPin className="w-3 h-3 text-[#b85434]" />
          <span>{collection.venue_ids.length} spots</span>
        </div>

        <span className="flex items-center gap-1 text-[#b85434] font-medium group-hover:translate-x-0.5 transition-transform text-xs">
          <span>View</span>
          <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
}
