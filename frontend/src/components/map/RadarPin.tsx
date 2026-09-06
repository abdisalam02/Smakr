"use client";

import React from "react";
import { Venue } from "@/types";

interface RadarPinProps {
  venue: Venue;
  isSelected?: boolean;
  onClick?: () => void;
}

export function RadarPin({ venue, isSelected, onClick }: RadarPinProps) {
  const status = venue.vibe.overall_status;

  // Colors according to live vibe
  const statusConfig = {
    optimal: {
      pinBg: "bg-emerald-500",
      pingBg: "bg-emerald-400",
      glowColor: "rgba(16, 185, 129, 0.45)",
      borderColor: "border-emerald-300",
    },
    moderate: {
      pinBg: "bg-amber-500",
      pingBg: "bg-amber-400",
      glowColor: "rgba(245, 158, 11, 0.45)",
      borderColor: "border-amber-300",
    },
    packed: {
      pinBg: "bg-rose-500",
      pingBg: "bg-rose-400",
      glowColor: "rgba(239, 68, 68, 0.45)",
      borderColor: "border-rose-300",
    },
  }[status];

  const placeEmoji = {
    cafe: "☕",
    library: "📚",
    coworking: "💼",
    hotel_lobby: "🏨",
  }[venue.place_type] || "📍";

  return (
    <div
      onClick={onClick}
      className="relative flex items-center justify-center cursor-pointer group select-none transition-transform hover:scale-110"
      style={{ transform: isSelected ? "scale(1.25)" : "scale(1.0)" }}
    >
      {/* Outer Animated Pulsing Radar Waves */}
      <span
        className={`absolute inline-flex h-12 w-12 rounded-full ${statusConfig.pingBg} opacity-30 animate-ping`}
        style={{ animationDuration: status === "optimal" ? "2.5s" : "1.8s" }}
      />
      <span
        className={`absolute inline-flex h-8 w-8 rounded-full ${statusConfig.pingBg} opacity-50 animate-pulse`}
      />

      {/* Main Radar Core Pin */}
      <div
        className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${statusConfig.pinBg} border-2 ${statusConfig.borderColor} shadow-lg shadow-black/60 transition-all group-hover:ring-4 group-hover:ring-white/20`}
        style={{
          boxShadow: `0 0 16px ${statusConfig.glowColor}, 0 4px 6px -1px rgba(0, 0, 0, 0.5)`,
        }}
      >
        <span className="text-xs">{placeEmoji}</span>
      </div>

      {/* Live Badge Indicator on Top Right */}
      {venue.vibe.is_live && (
        <div className="absolute -top-1 -right-1 z-20 w-3 h-3 bg-white rounded-full flex items-center justify-center shadow">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
        </div>
      )}

      {/* Hover Floating Mini Tooltip */}
      <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-30 whitespace-nowrap">
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 text-slate-100 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-xl flex items-center gap-1.5">
          <span>{venue.name}</span>
          <span className="text-[10px] font-normal text-slate-400">
            • {venue.vibe.seat_label}
          </span>
        </div>
        <div className="w-2 h-2 bg-slate-900 border-r border-b border-slate-700 transform rotate-45 -mt-1" />
      </div>
    </div>
  );
}
