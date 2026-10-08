"use client";

import React from "react";
import { MapPin, Clock } from "lucide-react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { Neighborhood } from "@/types";

const NEIGHBORHOOD_OPTIONS: { id: Neighborhood; label: string }[] = [
  { id: "all", label: "All Oslo" },
  { id: "grunerlokka", label: "Grünerløkka" },
  { id: "torggata", label: "Torggata" },
  { id: "toyen", label: "Tøyen" },
  { id: "gronland", label: "Grønland" },
  { id: "sentrum", label: "Sentrum" },
  { id: "frogner", label: "Frogner" },
];

/**
 * Geographic map filters: Oslo neighborhood + live "Open Now" status.
 * Writes to `mapNeighborhood` and `filters.open_now`.
 */
export function MapFilterBar() {
  const mapNeighborhood = useCityPulseStore((state) => state.mapNeighborhood);
  const setMapNeighborhood = useCityPulseStore(
    (state) => state.setMapNeighborhood
  );
  const openNow = useCityPulseStore((state) => state.filters.open_now);
  const setFilters = useCityPulseStore((state) => state.setFilters);

  return (
    <div className="absolute top-14 sm:top-16 left-3 right-3 sm:left-4 sm:right-4 z-20 overflow-x-auto no-scrollbar pointer-events-auto flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/95 backdrop-blur-md border border-zinc-200/80 shadow-md shadow-zinc-950/5">
      <span className="hidden sm:flex items-center pl-1.5 pr-0.5 text-zinc-400 shrink-0">
        <MapPin className="w-3.5 h-3.5" />
      </span>

      {NEIGHBORHOOD_OPTIONS.map((hood) => {
        const isActive = mapNeighborhood === hood.id;
        return (
          <button
            key={hood.id}
            onClick={() => setMapNeighborhood(hood.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all select-none ${
              isActive
                ? "bg-[#e84a27] text-white font-bold shadow-md shadow-[#e84a27]/25"
                : "bg-transparent hover:bg-zinc-100 text-zinc-600 hover:text-zinc-950 font-medium"
            }`}
          >
            <span>{hood.label}</span>
          </button>
        );
      })}

      <div className="w-px h-5 bg-zinc-200 mx-0.5 shrink-0" />

      <button
        onClick={() => setFilters({ open_now: openNow ? null : true })}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all select-none font-bold ${
          openNow
            ? "text-white shadow-md"
            : "bg-transparent hover:bg-zinc-100 text-zinc-600 hover:text-zinc-950"
        }`}
        style={openNow ? { backgroundColor: "var(--success, #3D5A45)" } : undefined}
        title="Show only spots that are open now"
      >
        <Clock className="w-3.5 h-3.5" />
        <span>Open Now</span>
      </button>
    </div>
  );
}
