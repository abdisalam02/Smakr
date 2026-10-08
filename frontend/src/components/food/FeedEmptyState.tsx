"use client";

import React from "react";
import Link from "next/link";
import { Plus, ArrowRight } from "lucide-react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { MascotCharacter } from "@/components/avatar/MascotCharacter";

/**
 * Minimal feed empty state shown when the database has no dishes (or the active
 * filters exclude them). Admins get a direct link into the Control Center.
 */
export function FeedEmptyState({ className = "" }: { className?: string }) {
  const currentUser = useCityPulseStore((s) => s.currentUser);
  const mascotConfig = useCityPulseStore((s) => s.mascotConfig);
  const totalPosts = useCityPulseStore((s) => s.foodPosts.length);
  const setFeedCategory = useCityPulseStore((s) => s.setFeedCategory);

  const isAdmin = currentUser?.role === "admin";

  return (
    <div
      className={`flex flex-col items-center justify-center text-center gap-3 py-12 px-6 rounded-3xl border bg-[var(--surface,#ffffff)] ${className}`}
      style={{ borderColor: "var(--surface-border, #E7E0D4)" }}
    >
      {/* Warm mascot bust illustration */}
      <div className="w-16 h-16 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center overflow-hidden">
        <MascotCharacter config={mascotConfig} size={46} />
      </div>

      <h3 className="font-comico text-lg text-zinc-900 leading-tight">
        No dishes logged yet
      </h3>
      <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
        Curated picks are coming soon. Check the Weekly Drop or explore spots on the map.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
        {isAdmin && (
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#e84a27] hover:bg-[#d23e1d] text-white text-xs font-bold shadow-md shadow-[#e84a27]/25 transition-all active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add First Dish in Admin</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}

        {/* Only relevant when dishes exist but the active filters hide them. */}
        {totalPosts > 0 && (
          <button
            onClick={() => setFeedCategory("all")}
            className="inline-flex items-center px-4 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold transition-colors"
          >
            Show all dishes
          </button>
        )}
      </div>
    </div>
  );
}
