"use client";

import React from "react";

/**
 * Loading skeletons mirroring the current editorial feed cards, so the first
 * paint after a cold load matches the real layout instead of the old 1-column
 * list cards.
 */

/** 2-column editorial dish card (compact, full-bleed photo). */
export function FoodPostCardSkeleton() {
  return (
    <div className="relative w-full aspect-[4/5] rounded-[26px] overflow-hidden bg-[#181615] border border-white/10 animate-pulse">
      {/* Photo layer */}
      <div className="absolute inset-0 bg-zinc-800/80" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/10" />

      {/* Top row: price pill + bookmark */}
      <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between">
        <div className="h-5 w-14 rounded-full bg-white/15" />
        <div className="h-7 w-7 rounded-full bg-white/15" />
      </div>

      {/* Bottom editorial block */}
      <div className="absolute inset-x-0 bottom-0 p-2.5 space-y-1.5">
        <div className="h-4 w-4/5 rounded bg-white/20" />
        <div className="h-3 w-1/2 rounded bg-white/15" />
        <div className="h-3 w-2/3 rounded bg-white/10" />
      </div>
    </div>
  );
}

/** Grid-mode spot card: photo header + warm paper body. */
export function FoodSpotCardSkeleton() {
  return (
    <div className="w-full h-full rounded-2xl overflow-hidden bg-[#FAF7F2] dark:bg-[#181615] border border-[#181615]/10 dark:border-white/10 animate-pulse">
      <div className="w-full aspect-[4/3] bg-[#E8E3DA] dark:bg-zinc-800" />
      <div className="p-2.5 sm:p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="h-3 w-20 rounded-full bg-[#181615]/10 dark:bg-white/10" />
          <div className="h-4 w-8 rounded bg-[#181615]/10 dark:bg-white/10" />
        </div>
        <div className="h-4 w-3/4 rounded bg-[#181615]/15 dark:bg-white/15" />
        <div className="h-3 w-1/2 rounded bg-[#181615]/10 dark:bg-white/10" />
        <div className="pt-2 border-t border-[#181615]/10 dark:border-white/10">
          <div className="h-3 w-2/3 rounded bg-[#181615]/10 dark:bg-white/10" />
        </div>
      </div>
    </div>
  );
}

/** Pop-up panel placeholder while venues hydrate. */
export function PopupEventCardSkeleton() {
  return (
    <div className="relative w-full aspect-[16/10] min-h-[230px] max-h-[270px] rounded-[24px] overflow-hidden bg-[#181615] border border-white/10 animate-pulse">
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
      <div className="absolute top-3 left-3 h-5 w-16 rounded-full bg-white/15" />
      <div className="absolute bottom-4 inset-x-4 space-y-2">
        <div className="h-4 w-3/5 rounded bg-white/20" />
        <div className="h-3 w-2/5 rounded bg-white/[0.12]" />
        <div className="h-9 w-full rounded-full bg-white/15" />
      </div>
    </div>
  );
}

/** Filter strip placeholder used while the first payload is hydrating. */
export function FeedFilterBarSkeleton() {
  return (
    <div className="w-full flex items-center gap-2 px-3.5 py-2.5 overflow-hidden">
      {[64, 48, 76, 60, 52].map((w, i) => (
        <div
          key={i}
          className="h-9 shrink-0 rounded-full bg-[#181615]/[0.08] dark:bg-white/10 animate-pulse"
          style={{ width: w, animationDelay: `${i * 70}ms` }}
        />
      ))}
    </div>
  );
}

/** Weekly Pick banner placeholder (centred title + mascot + bubble + photo). */
export function WeeklyPickSkeleton() {
  return (
    <div className="col-span-full animate-pulse">
      <div className="flex justify-center mb-2">
        <div className="h-3 w-28 rounded-full bg-[#E84A27]/20" />
      </div>
      <div className="flex items-center gap-2 py-1.5">
        <div className="w-[92px] h-[112px] rounded-2xl bg-[#181615]/10 dark:bg-white/10 shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-10 w-full rounded-2xl bg-[#181615]/10 dark:bg-white/10" />
          <div className="h-4 w-3/5 rounded bg-[#181615]/12 dark:bg-white/15" />
          <div className="h-3 w-1/2 rounded bg-[#181615]/10 dark:bg-white/10" />
        </div>
        <div className="w-[92px] h-[92px] rounded-xl bg-[#E8E3DA] dark:bg-zinc-800 shrink-0" />
      </div>
    </div>
  );
}
