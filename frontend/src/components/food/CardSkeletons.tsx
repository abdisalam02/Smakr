"use client";

import React from "react";

/**
 * Loading skeletons mirroring the current editorial feed cards, so the first
 * paint after a cold load matches the real layout instead of the old 1-column
 * list cards.
 */

/** 2-column editorial dish card (compact, Warm Oat sheen, zero CLS). */
export function FoodPostCardSkeleton() {
  return (
    <div className="relative w-full aspect-[4/5] rounded-[26px] overflow-hidden bg-[#ECE6DA] border border-[#181615]/[0.08]">
      <div className="smakr-shimmer-light absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#2B1810]/35 via-transparent to-transparent" />

      {/* Top row: price pill + bookmark */}
      <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between">
        <div className="h-5 w-14 rounded-full bg-[#FAF7F2]/80" />
        <div className="h-7 w-7 rounded-full bg-[#FAF7F2]/80" />
      </div>

      {/* Bottom editorial block */}
      <div className="absolute inset-x-0 bottom-0 p-2.5 space-y-1.5">
        <div className="h-4 w-4/5 rounded-md bg-[#FAF7F2]/85" />
        <div className="h-3 w-1/2 rounded-md bg-[#FAF7F2]/65" />
        <div className="h-3 w-2/3 rounded-md bg-[#FAF7F2]/50" />
      </div>
    </div>
  );
}

/** Grid-mode spot card: photo header + warm paper body. */
export function FoodSpotCardSkeleton() {
  return (
    <div className="w-full h-full rounded-2xl overflow-hidden bg-[#FAF7F2] dark:bg-[#181615] border border-[#181615]/[0.08] dark:border-white/10">
      <div className="relative w-full aspect-[4/3] bg-[#ECE6DA] dark:bg-zinc-800 overflow-hidden">
        <div className="smakr-shimmer-light absolute inset-0" />
      </div>
      <div className="p-2.5 sm:p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="h-3 w-20 rounded-full bg-[#ECE6DA] dark:bg-white/10" />
          <div className="h-4 w-8 rounded bg-[#ECE6DA] dark:bg-white/10" />
        </div>
        <div className="h-4 w-3/4 rounded bg-[#E4DDD0] dark:bg-white/15" />
        <div className="h-3 w-1/2 rounded bg-[#ECE6DA] dark:bg-white/10" />
        <div className="pt-2 border-t border-[#181615]/[0.08] dark:border-white/10">
          <div className="h-3 w-2/3 rounded bg-[#ECE6DA] dark:bg-white/10" />
        </div>
      </div>
    </div>
  );
}

/** Pop-up panel placeholder while venues hydrate. */
export function PopupEventCardSkeleton() {
  return (
    <div className="relative w-full aspect-[16/10] min-h-[230px] max-h-[270px] rounded-[24px] overflow-hidden bg-[#ECE6DA] border border-[#181615]/[0.08]">
      <div className="smakr-shimmer-light absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#2B1810]/35 via-transparent to-transparent" />
      <div className="absolute top-3 left-3 h-5 w-16 rounded-full bg-[#FAF7F2]/85" />
      <div className="absolute bottom-4 inset-x-4 space-y-2">
        <div className="h-4 w-3/5 rounded-md bg-[#FAF7F2]/90" />
        <div className="h-3 w-2/5 rounded-md bg-[#FAF7F2]/70" />
        <div className="h-9 w-full rounded-full bg-[#FAF7F2]/85" />
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
          className="h-9 shrink-0 rounded-full bg-[#ECE6DA] dark:bg-white/10 smakr-shimmer-light"
          style={{ width: w }}
        />
      ))}
    </div>
  );
}

/** Weekly Pick banner placeholder (centred title + mascot + bubble + photo). */
export function WeeklyPickSkeleton() {
  return (
    <div className="col-span-full">
      <div className="flex justify-center mb-2">
        <div className="h-3 w-28 rounded-full bg-[#E84A27]/20" />
      </div>
      <div className="flex items-center gap-2 py-1.5">
        <div className="w-[92px] h-[112px] rounded-2xl bg-[#ECE6DA] smakr-shimmer-light shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-10 w-full rounded-2xl bg-[#ECE6DA] smakr-shimmer-light" />
          <div className="h-4 w-3/5 rounded bg-[#E4DDD0]" />
          <div className="h-3 w-1/2 rounded bg-[#ECE6DA]" />
        </div>
        <div className="w-[92px] h-[92px] rounded-xl bg-[#ECE6DA] smakr-shimmer-light shrink-0" />
      </div>
    </div>
  );
}
