"use client";

import React from "react";
import {
  Zap,
  VolumeX,
  Wifi,
  Moon,
  RotateCcw,
  Coffee,
  BookOpen,
  Briefcase,
  Building2,
  LayoutGrid,
} from "lucide-react";
import { useCityPulseStore } from "@/store/useCityPulseStore";

export function FilterBar() {
  const filters = useCityPulseStore((state) => state.filters);
  const setFilters = useCityPulseStore((state) => state.setFilters);
  const resetFilters = useCityPulseStore((state) => state.resetFilters);
  const venues = useCityPulseStore((state) => state.venues);

  const isAnyFilterActive =
    filters.place_type !== null ||
    filters.has_outlets !== null ||
    filters.silent_zone !== null ||
    filters.open_late !== null ||
    filters.min_download_mbps !== null ||
    filters.vibe_status !== null ||
    filters.search_query !== "";

  const placeTypes: {
    id: "cafe" | "library" | "coworking" | "hotel_lobby" | null;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: null, label: "All Spots", icon: LayoutGrid },
    { id: "cafe", label: "Cafés", icon: Coffee },
    { id: "library", label: "Libraries", icon: BookOpen },
    { id: "coworking", label: "Coworking", icon: Briefcase },
    { id: "hotel_lobby", label: "Lounges", icon: Building2 },
  ];

  return (
    <div className="w-full bg-[#fbf9f5] border-b border-[#e5dec9] px-4 py-2.5 shadow-xs overflow-x-auto no-scrollbar">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 min-w-max text-xs">
        {/* Left: Place Type Segmented Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-[#ede6d8]/70 rounded-xl border border-[#ded5c2]">
          {placeTypes.map((pt) => {
            const active = filters.place_type === pt.id;
            const Icon = pt.icon;
            return (
              <button
                key={pt.label}
                onClick={() => setFilters({ place_type: pt.id })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  active
                    ? "bg-[#ffffff] text-[#b85434] shadow-xs"
                    : "text-[#6b6459] hover:text-[#221e19] hover:bg-[#ffffff]/50"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? "text-[#b85434]" : "text-[#7a7265]"}`} />
                <span>{pt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Center: Vibe & Feature Quick Toggles */}
        <div className="flex items-center gap-1.5">
          {/* Optimal / Quiet Seats */}
          <button
            onClick={() =>
              setFilters({
                vibe_status: filters.vibe_status === "optimal" ? null : "optimal",
              })
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all border ${
              filters.vibe_status === "optimal"
                ? "bg-[#edf6f0] border-[#9fd3ad] text-[#225c37] shadow-xs"
                : "bg-[#ffffff] border-[#ded5c2] text-[#6b6459] hover:text-[#221e19] hover:border-[#b8dec4]"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#3e7953]" />
            <span>Open Seats</span>
          </button>

          {/* Abundant Power Outlets */}
          <button
            onClick={() =>
              setFilters({ has_outlets: filters.has_outlets ? null : true })
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all border ${
              filters.has_outlets
                ? "bg-[#fcf5e8] border-[#e2be7e] text-[#8c590b] shadow-xs"
                : "bg-[#ffffff] border-[#ded5c2] text-[#6b6459] hover:text-[#221e19] hover:border-[#edd8b2]"
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${filters.has_outlets ? "text-[#c28421]" : "text-[#8c8374]"}`} />
            <span>Power Outlets</span>
          </button>

          {/* Silent Study Zone */}
          <button
            onClick={() =>
              setFilters({ silent_zone: filters.silent_zone ? null : true })
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all border ${
              filters.silent_zone
                ? "bg-[#edf2f8] border-[#a9c1dd] text-[#1d3d63] shadow-xs"
                : "bg-[#ffffff] border-[#ded5c2] text-[#6b6459] hover:text-[#221e19] hover:border-[#c8d4e4]"
            }`}
          >
            <VolumeX className={`w-3.5 h-3.5 ${filters.silent_zone ? "text-[#2d496e]" : "text-[#8c8374]"}`} />
            <span>Silent Zone</span>
          </button>

          {/* Fast Fiber WiFi */}
          <button
            onClick={() =>
              setFilters({
                min_download_mbps: filters.min_download_mbps ? null : 50.0,
              })
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all border ${
              filters.min_download_mbps
                ? "bg-[#edf2f8] border-[#a9c1dd] text-[#1d3d63] shadow-xs"
                : "bg-[#ffffff] border-[#ded5c2] text-[#6b6459] hover:text-[#221e19] hover:border-[#c8d4e4]"
            }`}
          >
            <Wifi className={`w-3.5 h-3.5 ${filters.min_download_mbps ? "text-[#2d496e]" : "text-[#8c8374]"}`} />
            <span>Fast WiFi (50+ Mbps)</span>
          </button>

          {/* Open Late */}
          <button
            onClick={() =>
              setFilters({ open_late: filters.open_late ? null : true })
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all border ${
              filters.open_late
                ? "bg-[#edf2f8] border-[#a9c1dd] text-[#1d3d63] shadow-xs"
                : "bg-[#ffffff] border-[#ded5c2] text-[#6b6459] hover:text-[#221e19] hover:border-[#c8d4e4]"
            }`}
          >
            <Moon className={`w-3.5 h-3.5 ${filters.open_late ? "text-[#2d496e]" : "text-[#8c8374]"}`} />
            <span>Open Late</span>
          </button>
        </div>

        {/* Right: Results Count & Reset */}
        <div className="flex items-center gap-2 pl-2">
          <span className="text-[11px] font-mono text-[#7a7265] bg-[#ede6d8]/60 px-2 py-1 rounded-md">
            {venues.length} spots
          </span>

          {isAnyFilterActive && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-[#b84534] hover:bg-[#b84534]/10 rounded-md transition-all font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
