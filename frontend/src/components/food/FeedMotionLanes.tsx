"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
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
  maxDriftPx = 14,
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
  }>({ clientWidth: 360, scrollWidth: 360, padLeft: 0 });
  const laneTopRef = useRef<number>(0);
  const laneHeightRef = useRef<number>(260);
  const isVisibleRef = useRef<boolean>(true);
  const driftFrozenRef = useRef<boolean>(false);
  const hRafRef = useRef<number | null>(null);
  const vRafRef = useRef<number | null>(null);
  const reducedMotionRef = useRef<boolean>(false);

  const measureLane = useCallback(() => {
    const track = scrollerRef.current;
    const driftWrap = driftWrapRef.current;
    if (!track || !driftWrap) return;

    const style = window.getComputedStyle(track);
    const padLeft = parseFloat(style.paddingLeft) || 0;
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

    // Cache vertical offset relative to the feed scroll container once (never inside scroll rAF)
    const feedScroller = track.closest<HTMLElement>("[data-feed-scroll]");
    if (feedScroller) {
      const feedRect = feedScroller.getBoundingClientRect();
      const trackRect = track.getBoundingClientRect();
      laneTopRef.current = trackRect.top - feedRect.top + feedScroller.scrollTop;
      laneHeightRef.current = trackRect.height || 260;
    }
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

  const handleHorizontalScroll = useCallback(() => {
    const track = scrollerRef.current;
    if (track && track.scrollLeft > 3 && !driftFrozenRef.current) {
      driftFrozenRef.current = true;
      if (driftWrapRef.current) {
        driftWrapRef.current.style.transition = "transform 220ms cubic-bezier(0.22,1,0.36,1)";
        driftWrapRef.current.style.transform = "translate3d(0, 0, 0)";
      }
    }

    if (hRafRef.current !== null) return;
    hRafRef.current = requestAnimationFrame(() => {
      hRafRef.current = null;
      applyHorizontalFocus();
    });
  }, [applyHorizontalFocus]);

  const freezeDriftOnInteraction = useCallback(() => {
    if (driftFrozenRef.current) return;
    driftFrozenRef.current = true;
    // Freeze in place immediately while the user's thumb is down so nothing slides under it.
    if (driftWrapRef.current) {
      driftWrapRef.current.style.transition = "";
    }
  }, []);

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
        driftFrozenRef.current ||
        !isVisibleRef.current ||
        !feedScroller ||
        !driftWrapRef.current
      ) {
        return;
      }
      const viewH = feedScroller.clientHeight || 720;
      const scrollY = feedScroller.scrollTop;
      const totalSpan = Math.max(1, viewH + laneHeightRef.current);
      const rawProgress = (scrollY + viewH - laneTopRef.current) / totalSpan;
      const progress = Math.max(0, Math.min(1, rawProgress));
      // Keep left edge flush or gently tucked negative (never pulls right into a blank left gap)
      const tx =
        driftDirection === -1 ? -progress * maxDriftPx : -(1 - progress) * maxDriftPx;
      driftWrapRef.current.style.transform = `translate3d(${tx.toFixed(1)}px, 0, 0)`;
    };

    const onFeedScroll = () => {
      if (reducedMotionRef.current || driftFrozenRef.current || !isVisibleRef.current) return;
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
      ro.disconnect();
      io?.disconnect();
      feedScroller?.removeEventListener("scroll", onFeedScroll);
    };
  }, [applyHorizontalFocus, driftDirection, maxDriftPx, measureLane]);

  return (
    <div
      ref={scrollerRef}
      onScroll={handleHorizontalScroll}
      onPointerDown={freezeDriftOnInteraction}
      onTouchStart={freezeDriftOnInteraction}
      className={`overflow-x-auto snap-x snap-mandatory no-scrollbar ${className}`}
    >
      <div
        ref={driftWrapRef}
        className="flex gap-3 pb-1 w-max will-change-transform"
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
          isFanned ? "h-[268px] sm:h-[282px]" : "h-[205px] sm:h-[215px]"
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
          isFanned ? "h-[206px] sm:h-[218px]" : "h-[205px] sm:h-[215px]"
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

export function PopupRadarDeck({
  items,
  mode = POPUP_RADAR_LAYOUT_MODE,
}: PopupRadarDeckProps) {
  const count = items.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const safeIndex = count > 0 ? activeIndex % count : 0;

  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const didDragRef = useRef(false);
  const isAnimatingOutRef = useRef(false);
  const dragCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      dragCleanupRef.current?.();
    };
  }, []);

  const getRestTransform = (slot: number) => {
    if (slot === 0) return "translate3d(0px, 0px, 0) rotate(0deg) scale(1)";
    if (slot === 1) return "translate3d(18px, 6px, 0) rotate(3.2deg) scale(0.95)";
    return "translate3d(-14px, 10px, 0) rotate(-3.4deg) scale(0.91)";
  };

  const cycleBy = useCallback(
    (delta: number, flingDir?: -1 | 1) => {
      if (count <= 1 || isAnimatingOutRef.current) return;
      const topEl = cardRefs.current[0];

      if (prefersReducedMotion() || !topEl || !flingDir) {
        setActiveIndex((prev) => (prev + delta + count) % count);
        return;
      }

      isAnimatingOutRef.current = true;
      if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
        navigator.vibrate(6);
      }

      topEl.style.transition =
        "transform 200ms cubic-bezier(0.22, 1, 0.36, 1), opacity 190ms ease-out";
      topEl.style.transform = `translate3d(${flingDir * 320}px, 14px, 0) rotate(${flingDir * 13}deg) scale(0.96)`;
      topEl.style.opacity = "0";

      const secondEl = cardRefs.current[1];
      if (secondEl) {
        secondEl.style.transition = "transform 200ms cubic-bezier(0.22, 1, 0.36, 1)";
        secondEl.style.transform = "translate3d(0px, 0px, 0) rotate(0deg) scale(1)";
      }

      window.setTimeout(() => {
        if (topEl) {
          topEl.style.transition = "";
          topEl.style.transform = "";
          topEl.style.opacity = "";
        }
        if (secondEl) {
          secondEl.style.transition = "";
          secondEl.style.transform = "";
        }
        setActiveIndex((prev) => (prev + delta + count) % count);
        isAnimatingOutRef.current = false;
      }, 205);
    },
    [count]
  );

  const handleTopPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (count <= 1 || isAnimatingOutRef.current) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;

      // Never intercept interactive bookmark/admin buttons inside the card
      const target = e.target as HTMLElement | null;
      if (target?.closest("button, a")) return;

      dragCleanupRef.current?.();

      const startX = e.clientX;
      const startY = e.clientY;
      let lastX = startX;
      let prevX = startX;
      let lastT = performance.now();
      let prevT = lastT;
      let latestDx = 0;
      let latestDy = 0;
      let lock: "x" | "y" | null = null;
      let rafId: number | null = null;

      const topEl = cardRefs.current[0];
      const secondEl = cardRefs.current[1];
      const thirdEl = cardRefs.current[2];

      const applyDragFrame = () => {
        rafId = null;
        if (lock !== "x" || !topEl) return;

        const rot = Math.max(-14, Math.min(14, latestDx * 0.045));
        topEl.style.transition = "none";
        topEl.style.transform = `translate3d(${latestDx.toFixed(1)}px, ${(latestDy * 0.08).toFixed(1)}px, 0) rotate(${rot.toFixed(2)}deg)`;

        const progress = Math.min(1, Math.abs(latestDx) / 150);
        if (secondEl) {
          const tx = (18 * (1 - progress)).toFixed(1);
          const ty = (6 * (1 - progress)).toFixed(1);
          const r = (3.2 * (1 - progress)).toFixed(2);
          const s = (0.95 + progress * 0.05).toFixed(3);
          secondEl.style.transition = "none";
          secondEl.style.transform = `translate3d(${tx}px, ${ty}px, 0) rotate(${r}deg) scale(${s})`;
        }
        if (thirdEl) {
          const tx = (-14 + progress * 8).toFixed(1);
          const ty = (10 - progress * 3).toFixed(1);
          const s = (0.91 + progress * 0.03).toFixed(3);
          thirdEl.style.transition = "none";
          thirdEl.style.transform = `translate3d(${tx}px, ${ty}px, 0) rotate(-2.8deg) scale(${s})`;
        }
      };

      const resetCards = () => {
        if (topEl) {
          topEl.style.transition = "transform 240ms cubic-bezier(0.22, 1, 0.36, 1)";
          topEl.style.transform = getRestTransform(0);
        }
        if (secondEl) {
          secondEl.style.transition = "transform 240ms cubic-bezier(0.22, 1, 0.36, 1)";
          secondEl.style.transform = getRestTransform(1);
        }
        if (thirdEl) {
          thirdEl.style.transition = "transform 240ms cubic-bezier(0.22, 1, 0.36, 1)";
          thirdEl.style.transform = getRestTransform(2);
        }
      };

      const onMove = (ev: PointerEvent) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;

        if (!lock) {
          if (Math.hypot(dx, dy) < 8) return;
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
        latestDy = dy;

        if (rafId === null) {
          rafId = requestAnimationFrame(applyDragFrame);
        }
      };

      const cleanup = () => {
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onEnd);
        window.removeEventListener("pointercancel", onCancel);
        dragCleanupRef.current = null;
      };

      const onCancel = () => {
        cleanup();
        resetCards();
        window.setTimeout(() => {
          didDragRef.current = false;
        }, 0);
      };

      const onEnd = () => {
        cleanup();
        window.setTimeout(() => {
          didDragRef.current = false;
        }, 0);

        if (lock !== "x") return;

        const dt = Math.max(1, lastT - prevT);
        const vx = (lastX - prevX) / dt;
        const shouldCommit =
          Math.abs(latestDx) > 58 || (Math.abs(latestDx) > 18 && Math.abs(vx) > 0.34);

        if (shouldCommit) {
          const flingDir: -1 | 1 = latestDx < 0 ? -1 : 1;
          const delta = latestDx < 0 ? 1 : -1;
          cycleBy(delta, flingDir);
        } else {
          resetCards();
        }
      };

      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerup", onEnd, { passive: true });
      window.addEventListener("pointercancel", onCancel, { passive: true });
      dragCleanupRef.current = cleanup;
    },
    [count, cycleBy]
  );

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

  /* ── PRIMARY MODE: Tactile Fanned Editorial Flyer Stack ── */
  const visibleSlots = Math.min(3, count);
  const stackedSlots = Array.from({ length: visibleSlots }, (_, slot) => {
    const itemIdx = (safeIndex + slot) % count;
    return { slot, itemIdx, item: items[itemIdx] };
  });

  return (
    <div className="w-full pt-1 pb-2">
      <div
        className="relative mx-auto w-full max-w-[308px] sm:max-w-[330px] h-[296px] sm:h-[310px] select-none"
        style={{ touchAction: "pan-y" }}
      >
        {/* Render back-to-front so slot 0 sits cleanly on top */}
        {[...stackedSlots].reverse().map(({ slot, itemIdx, item }) => {
          const isTop = slot === 0;
          const zClass = slot === 0 ? "z-30" : slot === 1 ? "z-20" : "z-10";
          const restTransform = getRestTransform(slot);

          return (
            <div
              key={`fanned-popup-${item.id}`}
              ref={(el) => {
                cardRefs.current[slot] = el;
              }}
              onPointerDown={isTop ? handleTopPointerDown : undefined}
              onClickCapture={
                isTop
                  ? (e) => {
                      if (didDragRef.current) {
                        e.stopPropagation();
                        e.preventDefault();
                      }
                    }
                  : (e) => {
                      // Tapping a peeking flyer brings it cleanly to the front without opening details
                      e.stopPropagation();
                      e.preventDefault();
                      setActiveIndex(itemIdx);
                    }
              }
              style={{
                transform: restTransform,
                opacity: slot === 0 ? 1 : slot === 1 ? 0.94 : 0.84,
                touchAction: "pan-y",
              }}
              className={`absolute inset-x-3 top-0 ${zClass} rounded-[26px] bg-[#FAF7F2] dark:bg-[#1E1C1A] border border-black/[0.08] dark:border-white/10 p-2 pb-2.5 will-change-transform transition-[transform,opacity,box-shadow] duration-200 ${
                isTop
                  ? "shadow-[0_12px_28px_rgba(24,22,21,0.13)] cursor-grab active:cursor-grabbing"
                  : "shadow-[0_6px_16px_rgba(24,22,21,0.08)] cursor-pointer"
              }`}
            >
              {renderPopupCardBody(item, true)}
            </div>
          );
        })}
      </div>

      {/* Compact Flyer Counter & Tap Controls */}
      {count > 1 && (
        <div className="mt-2.5 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => cycleBy(-1, 1)}
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
                  onClick={() => setActiveIndex(i)}
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
            onClick={() => cycleBy(1, -1)}
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
