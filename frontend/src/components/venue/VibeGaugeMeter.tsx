"use client";

import React from "react";
import { Users, Volume2, Zap, Clock } from "lucide-react";
import { VibeMetrics } from "@/types";
import { formatRelativeTime } from "@/lib/math";

interface VibeGaugeMeterProps {
  vibe: VibeMetrics;
}

export function VibeGaugeMeter({ vibe }: VibeGaugeMeterProps) {
  const seatPct = Math.min(100, Math.max(0, ((vibe.seat_score - 1.0) / 2.0) * 100));
  const noisePct = Math.min(100, Math.max(0, ((vibe.noise_score - 1.0) / 2.0) * 100));

  return (
    <div className="bg-[#f6f3ee] border border-[#e3dcce] rounded-xl p-4 space-y-4">
      {/* Vibe Header */}
      <div className="flex items-center justify-between border-b border-[#e3dcce] pb-2.5">
        <span className="text-xs font-semibold text-[#221e19]">
          Live Radar Conditions
        </span>

        <div className="flex items-center gap-1 text-[11px] text-[#6b6459]">
          <Clock className="w-3 h-3 text-[#8c8374]" />
          {vibe.is_live ? (
            <span className="text-[#3e7953] font-medium">
              Live ({vibe.active_checkins_count} check-ins • {formatRelativeTime(vibe.last_checkin_at)})
            </span>
          ) : (
            <span className="text-[#6b6459]">Baseline estimate</span>
          )}
        </div>
      </div>

      {/* 1. Seat Crowding Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-[#6b6459]">
            <Users className="w-3.5 h-3.5 text-[#8c8374]" />
            <span>Seat Availability</span>
          </span>
          <span
            className={`font-semibold ${
              vibe.seat_score <= 1.5
                ? "text-[#2e6843]"
                : vibe.seat_score <= 2.2
                ? "text-[#9e6717]"
                : "text-[#9c3426]"
            }`}
          >
            {vibe.seat_label}
          </span>
        </div>
        {/* Soft Watercolor Track */}
        <div className="w-full h-2 bg-[#e8e2d4] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              vibe.seat_score <= 1.5
                ? "bg-[#3e7953]"
                : vibe.seat_score <= 2.2
                ? "bg-[#c28421]"
                : "bg-[#b84534]"
            }`}
            style={{ width: `${Math.max(12, seatPct)}%` }}
          />
        </div>
      </div>

      {/* 2. Noise Level Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-[#6b6459]">
            <Volume2 className="w-3.5 h-3.5 text-[#8c8374]" />
            <span>Noise Environment</span>
          </span>
          <span
            className={`font-semibold ${
              vibe.noise_score <= 1.5
                ? "text-[#2e6843]"
                : vibe.noise_score <= 2.2
                ? "text-[#9e6717]"
                : "text-[#9c3426]"
            }`}
          >
            {vibe.noise_label}
          </span>
        </div>
        {/* Soft Watercolor Track */}
        <div className="w-full h-2 bg-[#e8e2d4] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              vibe.noise_score <= 1.5
                ? "bg-[#3e7953]"
                : vibe.noise_score <= 2.2
                ? "bg-[#c28421]"
                : "bg-[#b84534]"
            }`}
            style={{ width: `${Math.max(12, noisePct)}%` }}
          />
        </div>
      </div>

      {/* 3. Outlet Availability */}
      <div className="flex items-center justify-between pt-1 text-xs">
        <span className="flex items-center gap-1.5 text-[#6b6459]">
          <Zap className="w-3.5 h-3.5 text-[#c28421]" />
          <span>Power Outlets</span>
        </span>
        <span
          className={`font-semibold ${
            vibe.outlets_percentage >= 60
              ? "text-[#2e6843]"
              : vibe.outlets_percentage >= 30
              ? "text-[#9e6717]"
              : "text-[#9c3426]"
          }`}
        >
          {vibe.outlets_label} ({vibe.outlets_percentage}%)
        </span>
      </div>
    </div>
  );
}
