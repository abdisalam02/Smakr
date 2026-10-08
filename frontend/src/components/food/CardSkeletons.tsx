"use client";

import React from "react";

/**
 * Loading skeletons mirroring the real feed cards, so the first paint after a
 * cold load looks intentional instead of empty.
 */

export function FoodPostCardSkeleton() {
  return (
    <div className="w-full rounded-[26px] overflow-hidden border border-black/[0.08] dark:border-white/10 bg-[#181615] animate-pulse">
      <div className="relative w-full aspect-[4/3] min-h-[320px] bg-zinc-800/90">
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 h-6 w-20 rounded-full bg-white/15" />
        <div className="absolute top-3 right-3 h-6 w-16 rounded-full bg-white/15" />

        {/* Bottom editorial block */}
        <div className="absolute bottom-0 inset-x-0 p-4 space-y-3">
          <div className="h-5 w-3/5 rounded bg-white/20" />
          <div className="h-3 w-2/5 rounded bg-white/15" />
          <div className="h-12 w-full rounded-xl bg-white/10" />
          <div className="flex items-center justify-between pt-1">
            <div className="h-5 w-24 rounded-full bg-white/15" />
            <div className="h-6 w-20 rounded-full bg-white/20" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function FoodSpotCardSkeleton() {
  return (
    <div className="relative flex flex-col sm:flex-row gap-3.5 p-3 rounded-3xl bg-[#fbf9f5] dark:bg-[#181615] border-2 border-black/[0.08] dark:border-white/[0.08] animate-pulse">
      <div className="w-full sm:w-28 h-32 sm:h-28 rounded-2xl bg-zinc-200/90 dark:bg-zinc-700/50 shrink-0" />
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="h-3 w-24 rounded-full bg-zinc-200/90 dark:bg-zinc-700/60" />
            <div className="h-3 w-8 rounded-full bg-zinc-200/90 dark:bg-zinc-700/60" />
          </div>
          <div className="h-4 w-2/3 rounded bg-zinc-200/90 dark:bg-zinc-700/60" />
          <div className="h-3 w-4/5 rounded bg-zinc-200/80 dark:bg-zinc-700/50" />
          <div className="h-6 w-28 rounded-xl bg-zinc-100 dark:bg-zinc-800/60" />
        </div>
        <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-white/5 h-5 w-full rounded bg-zinc-100 dark:bg-zinc-800/60" />
      </div>
    </div>
  );
}
