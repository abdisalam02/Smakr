"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { animate, motion, useMotionValue, useTransform, type MotionValue } from "motion/react";
import { FoodPostCard } from "@/components/food/FoodPostCard";
import { PopupEventCard } from "@/components/food/PopupEventCard";
import { PopupBrandWordmark } from "@/components/food/PopupBrandWordmark";
import { SmakrFoodIcon } from "@/components/food/FoodIcons";
import type { FoodPost, Venue } from "@/types";

/**
 * QUICK TOGGLE — Oslo Pop-Up Radar feed layout:
 * - "fanned_stack": Collectible fanned editorial flyer stack (flick/swipe or tap peeking flyers).
 * - "horizontal_with_scout": Horizontal KineticFeedLane + 4th Warm Oat Scout/Tip card linking to /makr.
 */
export type PopupRadarLayoutMode = "fanned_stack" | "horizontal_with_scout";
export const POPUP_RADAR_LAYOUT_MODE: PopupRadarLayoutMode = "fanned_stack";

interface CardMetric {
  el: HTMLElement;
  footerEl: HTMLElement | null;
  avatarEl: HTMLElement | null;
  offsetLeft: number;
  width: number;
}

interface KineticFeedLaneProps {
  /** Alternating horizontal counter-drift direction while scrolling vertically. */
  driftDirection?: -1 | 1;
  /** Maximum subtle horizontal drift in px (default 14). */
  maxDriftPx?: number;
  className?: string;
  children: React.ReactNode;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * GPU-friendly 60fps horizontal shelf with:
 * 1) Subtle vertical scroll counter-drift (freezes immediately when user touches/swipes shelf)
 * 2) Horizontal snap-focus scale + crisp outer-footer opacity (cached metrics, zero per-frame reads)
 * 3) Living Open Peeps avatar reaction via `[data-living-avatar]`
 */
export function KineticFeedLane({
  driftDirection = -1,
  maxDriftPx = 48,
  className = "",
  children,
}: KineticFeedLaneProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const driftWrapRef = useRef<HTMLDivElement>(null);
  const metricsRef = useRef<CardMetric[]>([]);
  const containerMetaRef = useRef<{
    clientWidth: number;
    scrollWidth: number;
    padLeft: number;
  }>({ clientWidth: 360, scrollWidth: 360, padLeft: 12 });
  const isVisibleRef = useRef<boolean>(true);
  const isHorizontalActiveRef = useRef<boolean>(false);
  const resumeDriftTimerRef = useRef<number | null>(null);
  const lastVerticalProgressRef = useRef<number | null>(null);
  const currentDriftPxRef = useRef<number>(0);
  const hRafRef = useRef<number | null>(null);
  const vRafRef = useRef<number | null>(null);
  const reducedMotionRef = useRef<boolean>(false);

  const measureLane = useCallback(() => {
    const track = scrollerRef.current;
    const driftWrap = driftWrapRef.current;
    if (!track || !driftWrap) return;

    const innerStyle = window.getComputedStyle(driftWrap);
    const padLeft = parseFloat(innerStyle.paddingLeft) || 12;
    containerMetaRef.current = {
      clientWidth: track.clientWidth || 360,
      scrollWidth: track.scrollWidth || 360,
      padLeft,
    };

    const cardEls = driftWrap.querySelectorAll<HTMLElement>("[data-lane-card='true']");
    const next: CardMetric[] = [];
    cardEls.forEach((el) => {
      next.push({
        el,
        footerEl: el.querySelector<HTMLElement>("[data-lane-footer='true']"),
        avatarEl: el.querySelector<HTMLElement>("[data-living-avatar='true']"),
        offsetLeft: el.offsetLeft,
        width: el.offsetWidth || 210,
      });
    });
    metricsRef.current = next;
  }, []);

  const applyHorizontalFocus = useCallback(() => {
    const track = scrollerRef.current;
    const metrics = metricsRef.current;
    if (!track || metrics.length === 0) return;

    if (reducedMotionRef.current) {
      for (const m of metrics) {
        m.el.style.transform = "";
        if (m.footerEl) m.footerEl.style.opacity = "";
        if (m.avatarEl) m.avatarEl.style.transform = "";
      }
      return;
    }

    const scrollLeft = track.scrollLeft;
    const { clientWidth, scrollWidth, padLeft } = containerMetaRef.current;
    const maxScroll = Math.max(0, scrollWidth - clientWidth);
    // Blend snap anchor smoothly toward the trailing card when reaching the right end
    const endBlend =
      maxScroll > 20 ? Math.max(0, Math.min(1, (scrollLeft - (maxScroll - 72)) / 72)) : 0;

    for (let i = 0; i < metrics.length; i++) {
      const m = metrics[i];
      const step = m.width + 12;
      const startAnchor = m.offsetLeft - padLeft;
      let rawOffset = (startAnchor - scrollLeft) / step;

      if (endBlend > 0 && i === metrics.length - 1) {
        rawOffset = rawOffset * (1 - endBlend);
      }

      if (Math.abs(rawOffset) > 2.2) {
        m.el.style.transform = "translate3d(0, 3px, 0) scale(0.955)";
        if (m.footerEl) m.footerEl.style.opacity = "0.74";
        if (m.avatarEl) m.avatarEl.style.transform = "translate3d(0, 0px, 0) scale(0.95)";
        continue;
      }

      const clamped = Math.max(-1, Math.min(1, rawOffset));
      const focus = 1 - Math.abs(clamped);

      const scale = (0.955 + focus * 0.045).toFixed(3);
      const ty = ((1 - focus) * 3).toFixed(1);
      m.el.style.transform = `translate3d(0, ${ty}px, 0) scale(${scale})`;

      if (m.footerEl) {
        m.footerEl.style.opacity = (0.74 + focus * 0.26).toFixed(2);
      }

      if (m.avatarEl) {
        const avY = (-focus * 4.5).toFixed(1);
        const avScale = (0.95 + focus * 0.12).toFixed(3);
        const avRot = (clamped * 4 - focus * 2.2).toFixed(1);
        m.avatarEl.style.transform = `translate3d(0, ${avY}px, 0) scale(${avScale}) rotate(${avRot}deg)`;
      }
    }
  }, []);

  const pauseDriftTemporarily = useCallback((resumeDelayMs = 420) => {
    isHorizontalActiveRef.current = true;
    if (resumeDriftTimerRef.current !== null) {
      window.clearTimeout(resumeDriftTimerRef.current);
    }
    resumeDriftTimerRef.current = window.setTimeout(() => {
      resumeDriftTimerRef.current = null;
      isHorizontalActiveRef.current = false;
    }, resumeDelayMs);
  }, []);

  const handleHorizontalScroll = useCallback(() => {
    pauseDriftTemporarily(420);

    if (hRafRef.current !== null) return;
    hRafRef.current = requestAnimationFrame(() => {
      hRafRef.current = null;
      applyHorizontalFocus();
    });
  }, [applyHorizontalFocus, pauseDriftTemporarily]);

  const handlePointerStart = useCallback(() => {
    isHorizontalActiveRef.current = true;
    if (resumeDriftTimerRef.current !== null) {
      window.clearTimeout(resumeDriftTimerRef.current);
      resumeDriftTimerRef.current = null;
    }
  }, []);

  const handlePointerRelease = useCallback(() => {
    pauseDriftTemporarily(320);
  }, [pauseDriftTemporarily]);

  useEffect(() => {
    reducedMotionRef.current = prefersReducedMotion();
    measureLane();
    const initRaf = requestAnimationFrame(() => applyHorizontalFocus());

    const track = scrollerRef.current;
    const driftWrap = driftWrapRef.current;
    if (!track || !driftWrap) {
      return () => cancelAnimationFrame(initRaf);
    }

    const feedScroller = track.closest<HTMLElement>("[data-feed-scroll]");

    const ro = new ResizeObserver(() => {
      measureLane();
      applyHorizontalFocus();
    });
    ro.observe(track);

    let io: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry) {
            isVisibleRef.current = entry.isIntersecting;
          }
        },
        { root: feedScroller || null, rootMargin: "80px 0px 80px 0px", threshold: 0 }
      );
      io.observe(track);
    }

    const applyVerticalDrift = () => {
      vRafRef.current = null;
      if (
        reducedMotionRef.current ||
        !isVisibleRef.current ||
        !feedScroller ||
        !driftWrapRef.current ||
        !scrollerRef.current
      ) {
        return;
      }
      const scrollerRect = feedScroller.getBoundingClientRect();
      const laneRect = scrollerRef.current.getBoundingClientRect();
      const totalSpan = Math.max(1, scrollerRect.height + laneRect.height);
      const rawProgress = (scrollerRect.bottom - laneRect.top) / totalSpan;
      const progress = Math.max(0, Math.min(1, rawProgress));

      const prevProgress = lastVerticalProgressRef.current;
      lastVerticalProgressRef.current = progress;

      // Never slide cards while the user's thumb is touching or actively swiping horizontally
      if (isHorizontalActiveRef.current) return;

      const minTx = -maxDriftPx;
      const maxTx = scrollerRef.current.scrollLeft > maxDriftPx ? maxDriftPx : 0;

      if (prevProgress === null) {
        currentDriftPxRef.current =
          driftDirection === -1 ? -progress * maxDriftPx : -(1 - progress) * maxDriftPx;
      } else {
        const deltaPx = (progress - prevProgress) * maxDriftPx * driftDirection;
        currentDriftPxRef.current = Math.max(
          minTx,
          Math.min(maxTx, currentDriftPxRef.current + deltaPx)
        );
      }

      driftWrapRef.current.style.transform = `translate3d(${currentDriftPxRef.current.toFixed(1)}px, 0, 0)`;
    };

    const onFeedScroll = () => {
      if (reducedMotionRef.current || !isVisibleRef.current) return;
      if (vRafRef.current !== null) return;
      vRafRef.current = requestAnimationFrame(applyVerticalDrift);
    };

    if (feedScroller && !reducedMotionRef.current) {
      feedScroller.addEventListener("scroll", onFeedScroll, { passive: true });
      vRafRef.current = requestAnimationFrame(applyVerticalDrift);
    }

    return () => {
      cancelAnimationFrame(initRaf);
      if (hRafRef.current !== null) cancelAnimationFrame(hRafRef.current);
      if (vRafRef.current !== null) cancelAnimationFrame(vRafRef.current);
      if (resumeDriftTimerRef.current !== null) window.clearTimeout(resumeDriftTimerRef.current);
      ro.disconnect();
      io?.disconnect();
      feedScroller?.removeEventListener("scroll", onFeedScroll);
    };
  }, [applyHorizontalFocus, driftDirection, maxDriftPx, measureLane]);

  return (
    <div
      ref={scrollerRef}
      onScroll={handleHorizontalScroll}
      onPointerDown={handlePointerStart}
      onPointerUp={handlePointerRelease}
      onPointerCancel={handlePointerRelease}
      onTouchStart={handlePointerStart}
      onTouchEnd={handlePointerRelease}
      onTouchCancel={handlePointerRelease}
      className={`w-full overflow-x-auto snap-x snap-mandatory scroll-px-3 lg:scroll-px-3.5 no-scrollbar ${className}`}
    >
      <div
        ref={driftWrapRef}
        className="flex gap-3 px-3 lg:px-3.5 pb-1 w-max will-change-transform"
      >
        {children}
      </div>
    </div>
  );
}

/* ============================================================================
 * OSLO POP-UP RADAR — FANNED FLYER STACK + FALLBACK HORIZONTAL SCOUT LANE
 * ============================================================================ */

export type PopupRadarItem =
  | {
      kind: "dish";
      id: string;
      post: FoodPost;
      venue: Venue | null;
      metaLine: string;
    }
  | {
      kind: "venue";
      id: string;
      venue: Venue;
    };

interface PopupRadarDeckProps {
  items: PopupRadarItem[];
  /** Override the default POPUP_RADAR_LAYOUT_MODE if needed. */
  mode?: PopupRadarLayoutMode;
}

function ScoutPopupEndCard() {
  return (
    <Link
      href="/makr"
      data-lane-card="true"
      className="w-[210px] sm:w-[225px] shrink-0 snap-start flex flex-col cursor-pointer group select-none will-change-transform"
    >
      <div className="h-[205px] sm:h-[215px] rounded-[22px] bg-[#F3EDE2] dark:bg-[#23201D] border border-[#181615]/15 dark:border-white/10 group-hover:border-[#E84A27]/55 p-4 flex flex-col justify-between transition-colors">
        <div>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#E84A27]">
            <Sparkles className="w-3 h-3" />
            <span>Oslo Pop-Up Radar</span>
          </span>
          <h4 className="mt-1.5 font-display font-bold text-[18px] leading-[1.08] uppercase text-[#181615] dark:text-[#FAF7F2]">
            Scout an Oslo Pop-Up
          </h4>
          <p className="mt-1.5 text-[11px] leading-snug text-[#181615]/70 dark:text-zinc-300">
            Running a weekend kitchen takeover or spotted a secret drop? Tip us to get on the radar.
          </p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#181615]/10 dark:border-white/10">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#181615] dark:text-[#FAF7F2]">
            <SmakrFoodIcon name="popup" className="w-4 h-4 shrink-0" />
            <span>Makr Studio</span>
          </span>
          <ArrowRight className="w-4 h-4 text-[#E84A27] transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>

      <div data-lane-footer="true" className="mt-2 px-1 transition-opacity duration-150">
        <span className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-[#E84A27] group-hover:bg-[#d23e1d] text-[#FAF7F2] font-bold text-[11.5px] py-2 px-3 shadow-xs transition-colors">
          <span>Tip us a pop-up</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </Link>
  );
}

function renderPopupCardBody(item: PopupRadarItem, isFanned: boolean) {
  if (item.kind === "venue") {
    return (
      <div
        className={`w-full overflow-hidden rounded-[20px] ${
          isFanned ? "h-[262px] sm:h-[276px]" : "h-[205px] sm:h-[215px]"
        }`}
      >
        <PopupEventCard venue={item.venue} compact />
      </div>
    );
  }

  const { post, venue, metaLine } = item;
  return (
    <>
      <div
        className={`w-full ${
          isFanned ? "h-[196px] sm:h-[208px]" : "h-[205px] sm:h-[215px]"
        }`}
      >
        <FoodPostCard
          post={post}
          index={0}
          fillHeight
          cleanPhoto
          trackSource="popup_radar"
          linkedVenue={venue}
        />
      </div>
      <div data-lane-footer="true" className="mt-2 px-1 space-y-0.5 transition-opacity duration-150">
        <div className="flex items-center justify-between gap-1.5 min-w-0">
          <PopupBrandWordmark venueName={venue?.name || post.spot_name} size="sm" />
          {typeof post.price_nok === "number" && post.price_nok > 0 && (
            <span className="font-comico font-normal text-[11.5px] text-[#E84A27] shrink-0 whitespace-nowrap">
              {post.price_nok} kr
            </span>
          )}
        </div>
        <p className="font-display text-[12.5px] font-bold text-[#181615] dark:text-zinc-100 leading-snug line-clamp-1">
          {post.dish_name}
        </p>
        <p className="text-[11px] font-medium text-[#181615]/65 dark:text-zinc-400 leading-snug line-clamp-1">
          {metaLine}
        </p>
      </div>
    </>
  );
}

/**
 * Continuous shortest signed circular distance `t` in `[-n/2, +n/2)` for Skiper48 EffectCards physics.
 */
function wrapCircularDistance(index: number, progress: number, n: number): number {
  if (n <= 1) return 0;
  const half = n / 2;
  let t = (((index - progress) % n) + n) % n;
  if (t >= half) t -= n;
  return t;
}

interface EffectCardPose {
  x: number;
  y: number;
  rotate: number;
  scale: number;
  opacity: number;
  zIndex: number;
  dimOpacity: number;
}

/**
 * Pure continuous Skiper48 / Swiper EffectCards curve evaluated from a single `progress` value:
 * - `-1 <= t <= 0`: Active card arcs out LEFT (`x -> -188px` at `t=-0.5`), drops immediately
 *   right behind the new front card (`zIndex: 50 -> 42`), and tucks neatly to `x = -22px`.
 *   Swiping RIGHT reverses the exact same curve (`-1 -> -0.5 -> 0`), pulling that previously
 *   swiped card straight back out from behind the left edge and onto the top of the deck.
 * - `0 < t <= 1`: Upcoming card on the right glides smoothly forward (`+22px -> 0px`) to center.
 * - `1 < |t| <= n/2`: Deeper fanned cards smoothly tuck behind center at `|t| = n/2` so wrapping
 *   is mathematically continuous with zero visual jump for any deck size.
 */
function evalEffectCardPose(t: number, n: number): EffectCardPose {
  const half = n / 2;
  const absT = Math.abs(t);

  // 1. Departing / previously-swiped card arc on the left (-1 <= t <= 0)
  if (t <= 0 && t >= -1) {
    const u = -t; // 0 -> 1
    const arc = Math.sin(u * Math.PI);
    return {
      x: -22 * u - 166 * arc,
      y: 5 * u - 10 * arc,
      rotate: -4.5 * u - 8.5 * arc,
      scale: 1 - 0.07 * u,
      opacity: 1,
      zIndex: u < 0.5 ? 50 : 42,
      dimOpacity: u <= 0.5 ? 0 : (u - 0.5) * 0.24,
    };
  }

  // 2. Incoming next card rising cleanly from the right (0 < t <= 1)
  if (t > 0 && t <= 1) {
    return {
      x: 22 * t,
      y: 5 * t,
      rotate: 4.5 * t,
      scale: 1 - 0.07 * t,
      opacity: 1,
      zIndex: t <= 0.5 ? 50 : 41,
      dimOpacity: t <= 0.5 ? 0 : (t - 0.5) * 0.24,
    };
  }

  // 3. Deeper cards beyond immediate ±1 neighbors (continuous meet at ±half behind center)
  const sign = t < 0 ? -1 : 1;
  if (half <= 1.55) {
    // 3-card deck: smoothly tuck from ±22px at |t|=1 back to 0px behind center at |t|=1.5
    const k = Math.min(1, (absT - 1) / Math.max(0.01, half - 1));
    return {
      x: sign * 22 * (1 - k),
      y: 5 + 5 * k,
      rotate: sign * 4.5 * (1 - k),
      scale: 0.93 - 0.07 * k,
      opacity: 1 - 0.25 * k,
      zIndex: 30,
      dimOpacity: 0.12 + 0.14 * k,
    };
  }

  if (absT <= 1.75) {
    // Visible 2nd-layer fan on 4+ card decks
    const k = (absT - 1) / 0.75;
    return {
      x: sign * (22 + 16 * k),
      y: 5 + 6 * k,
      rotate: sign * (4.5 + 3.8 * k),
      scale: 0.93 - 0.07 * k,
      opacity: 1 - 0.1 * k,
      zIndex: Math.round(35 - k * 5),
      dimOpacity: 0.12 + 0.12 * k,
    };
  }

  // Smoothly tuck & hide beyond 2nd layer so wrap across ±half is invisible
  const hideSpan = Math.max(0.15, Math.min(0.45, half - 1.75));
  const h = Math.min(1, (absT - 1.75) / hideSpan);
  return {
    x: sign * 38 * (1 - h),
    y: 11 + 3 * h,
    rotate: sign * 8.3 * (1 - h),
    scale: 0.86 - 0.06 * h,
    opacity: Math.max(0, 0.9 * (1 - h)),
    zIndex: 15,
    dimOpacity: 0.24 + 0.08 * h,
  };
}

const PROGRESS_SPRING = {
  type: "spring" as const,
  stiffness: 290,
  damping: 29,
  mass: 0.85,
};

interface EffectDeckCardProps {
  item: PopupRadarItem;
  slotIndex: number;
  deckLength: number;
  progress: MotionValue<number>;
  isTopRest: boolean;
  restRel: number;
  didDragRef: React.MutableRefObject<boolean>;
  onTapPeeking: (rel: number) => void;
}

/**
 * Single GPU-driven card subscribed directly to the deck's continuous `progress` MotionValue.
 * Zero React re-renders during drag or spring settling — exact reversible Skiper48 EffectCards feel.
 */
function EffectDeckCard({
  item,
  slotIndex,
  deckLength,
  progress,
  isTopRest,
  restRel,
  didDragRef,
  onTapPeeking,
}: EffectDeckCardProps) {
  const x = useTransform(progress, (p) => evalEffectCardPose(wrapCircularDistance(slotIndex, p, deckLength), deckLength).x);
  const y = useTransform(progress, (p) => evalEffectCardPose(wrapCircularDistance(slotIndex, p, deckLength), deckLength).y);
  const rotate = useTransform(progress, (p) => evalEffectCardPose(wrapCircularDistance(slotIndex, p, deckLength), deckLength).rotate);
  const scale = useTransform(progress, (p) => evalEffectCardPose(wrapCircularDistance(slotIndex, p, deckLength), deckLength).scale);
  const opacity = useTransform(progress, (p) => evalEffectCardPose(wrapCircularDistance(slotIndex, p, deckLength), deckLength).opacity);
  const zIndex = useTransform(progress, (p) => evalEffectCardPose(wrapCircularDistance(slotIndex, p, deckLength), deckLength).zIndex);
  const dimOpacity = useTransform(progress, (p) => evalEffectCardPose(wrapCircularDistance(slotIndex, p, deckLength), deckLength).dimOpacity);

  const isVisibleRest = Math.abs(restRel) <= 2;

  return (
    <motion.div
      style={{
        x,
        y,
        rotate,
        scale,
        opacity,
        zIndex,
        pointerEvents: isVisibleRest ? "auto" : "none",
        touchAction: "pan-y",
        transformOrigin: "50% 82%",
      }}
      onClickCapture={(e) => {
        if (didDragRef.current) {
          e.stopPropagation();
          e.preventDefault();
          return;
        }
        if (!isTopRest) {
          e.stopPropagation();
          e.preventDefault();
          onTapPeeking(restRel);
        }
      }}
      className={`absolute inset-x-0 top-0 rounded-[26px] bg-[#FAF7F2] dark:bg-[#1E1C1A] border p-1.5 pb-2 will-change-transform overflow-hidden ${
        isTopRest
          ? "border-black/[0.09] dark:border-white/12 shadow-[0_14px_32px_rgba(24,22,21,0.16)] cursor-grab active:cursor-grabbing"
          : "border-black/[0.08] dark:border-white/10 shadow-[0_8px_20px_rgba(24,22,21,0.10)] cursor-pointer"
      }`}
    >
      {renderPopupCardBody(item, true)}
      {/* Skiper48-style depth shadow veil driven smoothly by continuous deck progress */}
      <motion.div
        aria-hidden="true"
        style={{ opacity: dimOpacity }}
        className="pointer-events-none absolute inset-0 rounded-[26px] bg-[#181615]"
      />
    </motion.div>
  );
}

export function PopupRadarDeck({
  items,
  mode = POPUP_RADAR_LAYOUT_MODE,
}: PopupRadarDeckProps) {
  const count = items.length;
  // Duplicate 2-card decks into 4 slots internally so infinite looping works smoothly in both directions without wrap flips
  const deckSlots = React.useMemo(() => {
    if (count === 2) {
      return [
        { key: `${items[0].id}-a`, item: items[0] },
        { key: `${items[1].id}-a`, item: items[1] },
        { key: `${items[0].id}-b`, item: items[0] },
        { key: `${items[1].id}-b`, item: items[1] },
      ];
    }
    return items.map((item) => ({ key: item.id, item }));
  }, [count, items]);
  const deckLen = deckSlots.length;

  // Unbounded integer step counter so progress runs smoothly across ..., -1, 0, 1, 2, ...
  const [step, setStep] = useState(0);
  const stepRef = useRef(0);
  const safeIndex = count > 0 ? ((step % count) + count) % count : 0;

  const progress = useMotionValue(0);
  const animControlsRef = useRef<ReturnType<typeof animate> | null>(null);
  const stageWrapRef = useRef<HTMLDivElement | null>(null);
  const didDragRef = useRef(false);
  const isInteractingRef = useRef(false);
  const isInViewRef = useRef(true);
  const pauseAutoUntilRef = useRef<number>(0);
  const dragCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      animControlsRef.current?.stop();
      dragCleanupRef.current?.();
    };
  }, []);

  const goToStep = useCallback(
    (nextStep: number, isAuto = false) => {
      if (count <= 1) return;
      if (!isAuto) {
        pauseAutoUntilRef.current = Date.now() + 6500;
        if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
          navigator.vibrate(6);
        }
      }
      stepRef.current = nextStep;
      setStep(nextStep);
      animControlsRef.current?.stop();

      if (prefersReducedMotion()) {
        progress.set(nextStep);
        return;
      }
      animControlsRef.current = animate(progress, nextStep, PROGRESS_SPRING);
    },
    [count, progress]
  );

  const cycleBy = useCallback(
    (delta: number, isAuto = false) => {
      goToStep(stepRef.current + delta, isAuto);
    },
    [goToStep]
  );

  // Live 1:1 continuous pointer drag driving `progress` directly (fully reversible mid-swipe!)
  const handleStagePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (count <= 1) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;

      const target = e.target as HTMLElement | null;
      if (target?.closest("button, a")) return;

      dragCleanupRef.current?.();
      animControlsRef.current?.stop();
      isInteractingRef.current = true;
      pauseAutoUntilRef.current = Date.now() + 6500;

      const startX = e.clientX;
      const startY = e.clientY;
      const startProgress = progress.get();
      const baseStep = Math.round(startProgress);
      let lastX = startX;
      let prevX = startX;
      let lastT = performance.now();
      let prevT = lastT;
      let latestDx = 0;
      let lock: "x" | "y" | null = null;

      const DRAG_UNIT_PX = 225;

      const onMove = (ev: PointerEvent) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;

        if (!lock) {
          if (Math.hypot(dx, dy) < 7) return;
          if (Math.abs(dy) > Math.abs(dx) * 1.15) {
            lock = "y";
            cleanup();
            return;
          }
          lock = "x";
          didDragRef.current = true;
        }

        if (lock !== "x") return;

        const now = performance.now();
        if (now - lastT > 12) {
          prevX = lastX;
          prevT = lastT;
        }
        lastX = ev.clientX;
        lastT = now;
        latestDx = dx;

        // Clamp single drag gesture to ±1.05 cards so fast drags never overshoot two cards at once
        const deltaP = Math.max(-1.05, Math.min(1.05, -dx / DRAG_UNIT_PX));
        progress.set(startProgress + deltaP);
      };

      const cleanup = () => {
        isInteractingRef.current = false;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onEnd);
        window.removeEventListener("pointercancel", onCancel);
        dragCleanupRef.current = null;
      };

      const onCancel = () => {
        cleanup();
        animControlsRef.current = animate(progress, baseStep, PROGRESS_SPRING);
        window.setTimeout(() => {
          didDragRef.current = false;
        }, 50);
      };

      const onEnd = () => {
        cleanup();
        window.setTimeout(() => {
          didDragRef.current = false;
        }, 50);

        if (lock !== "x") return;

        const dt = Math.max(1, lastT - prevT);
        const vx = (lastX - prevX) / dt; // px/ms
        const committed =
          Math.abs(latestDx) > 46 || (Math.abs(latestDx) > 16 && Math.abs(vx) > 0.32);

        if (committed) {
          const delta = latestDx < 0 ? 1 : -1;
          goToStep(baseStep + delta);
        } else {
          animControlsRef.current = animate(progress, baseStep, PROGRESS_SPRING);
        }
      };

      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerup", onEnd, { passive: true });
      window.addEventListener("pointercancel", onCancel, { passive: true });
      dragCleanupRef.current = cleanup;
    },
    [count, goToStep, progress]
  );

  // Gently auto-shuffle forward every 4.2s when visible & idle
  useEffect(() => {
    if (mode !== "fanned_stack" || count <= 1 || prefersReducedMotion()) return;

    const el = stageWrapRef.current;
    let io: IntersectionObserver | null = null;
    if (el && typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        (entries) => {
          if (entries[0]) isInViewRef.current = entries[0].isIntersecting;
        },
        { threshold: 0.35 }
      );
      io.observe(el);
    }

    const timer = window.setInterval(() => {
      if (
        !isInViewRef.current ||
        isInteractingRef.current ||
        Date.now() < pauseAutoUntilRef.current
      ) {
        return;
      }
      cycleBy(1, true);
    }, 4200);

    return () => {
      window.clearInterval(timer);
      io?.disconnect();
    };
  }, [count, cycleBy, mode]);

  if (count === 0) return null;

  /* ── FALLBACK MODE: Horizontal KineticFeedLane + 4th Warm Oat Scout Card ── */
  if (mode === "horizontal_with_scout") {
    return (
      <KineticFeedLane driftDirection={-1} className="pb-1">
        {items.map((item) => (
          <div
            key={`popup-horiz-${item.id}`}
            data-lane-card="true"
            className="w-[210px] sm:w-[225px] shrink-0 snap-start flex flex-col will-change-transform"
          >
            {renderPopupCardBody(item, false)}
          </div>
        ))}
        <ScoutPopupEndCard />
      </KineticFeedLane>
    );
  }

  /* ── PRIMARY MODE: Continuous Skiper48 EffectCards Stack (reversible both ways!) ── */
  return (
    <div
      ref={stageWrapRef}
      onMouseEnter={() => {
        isInteractingRef.current = true;
      }}
      onMouseLeave={() => {
        isInteractingRef.current = false;
      }}
      className="w-full pt-2 pb-2 overflow-x-clip"
    >
      <div
        onPointerDown={handleStagePointerDown}
        className="relative mx-auto w-full max-w-[238px] sm:max-w-[252px] h-[292px] sm:h-[306px] select-none"
        style={{ perspective: "1100px", touchAction: "pan-y" }}
      >
        {deckSlots.map((slot, idx) => {
          const restRel = wrapCircularDistance(idx, step, deckLen);
          return (
            <EffectDeckCard
              key={`deck-card-${slot.key}`}
              item={slot.item}
              slotIndex={idx}
              deckLength={deckLen}
              progress={progress}
              isTopRest={restRel === 0}
              restRel={restRel}
              didDragRef={didDragRef}
              onTapPeeking={(rel) => {
                const delta = rel > 0 ? 1 : -1;
                cycleBy(delta);
              }}
            />
          );
        })}
      </div>

      {/* Compact Flyer Counter & Tap Controls */}
      {count > 1 && (
        <div className="mt-3 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => cycleBy(-1)}
            aria-label="Previous pop-up flyer"
            className="grid h-7 w-7 place-items-center rounded-full border border-black/[0.08] dark:border-white/10 bg-[#FAF7F2] dark:bg-[#1E1C1A] text-[#181615] dark:text-zinc-200 hover:border-[#E84A27]/50 hover:text-[#E84A27] transition-colors active:scale-95 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-1.5">
            {items.map((it, i) => {
              const active = i === safeIndex;
              return (
                <button
                  key={`dot-${it.id}`}
                  type="button"
                  onClick={() => {
                    const diff = wrapCircularDistance(i, safeIndex, count);
                    if (diff !== 0) cycleBy(diff);
                  }}
                  aria-label={`Show pop-up ${i + 1} of ${count}`}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    active
                      ? "w-5 bg-[#E84A27]"
                      : "w-1.5 bg-[#181615]/20 dark:bg-white/25 hover:bg-[#181615]/40"
                  }`}
                />
              );
            })}
            <span className="ml-1.5 text-[10.5px] font-bold tabular-nums text-[#181615]/60 dark:text-zinc-400">
              {safeIndex + 1} / {count}
            </span>
          </div>

          <button
            type="button"
            onClick={() => cycleBy(1)}
            aria-label="Next pop-up flyer"
            className="grid h-7 w-7 place-items-center rounded-full border border-black/[0.08] dark:border-white/10 bg-[#FAF7F2] dark:bg-[#1E1C1A] text-[#181615] dark:text-zinc-200 hover:border-[#E84A27]/50 hover:text-[#E84A27] transition-colors active:scale-95 cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
