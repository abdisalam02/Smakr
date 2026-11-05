"use client";

import { useEffect, useState, useRef } from "react";

interface UseCollapseOnFeedScrollOptions {
  threshold?: number;
  isExpanded?: boolean;
  ignoreSelector?: string;
  onCollapse?: () => void;
}

/**
 * Event-delegated scroll and gesture listener that auto-collapses expanded drawers and cards
 * (e.g. Filter Drawer, Smakr Pick spotlight) whenever the user scrolls anywhere in the feed
 * by >20px — whether at the top, middle, or bottom of the page.
 */
export function useCollapseOnFeedScroll({
  threshold = 20,
  isExpanded = false,
  ignoreSelector,
  onCollapse,
}: UseCollapseOnFeedScrollOptions = {}) {
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const onCollapseRef = useRef(onCollapse);
  onCollapseRef.current = onCollapse;

  const baselineScrollRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  // Active collapse listener when isExpanded is true
  useEffect(() => {
    if (!isExpanded) {
      baselineScrollRef.current = null;
      touchStartYRef.current = null;
      return;
    }

    // Anchor baseline from whatever feed container or window is active
    const feedContainer = document.querySelector("[data-feed-scroll]");
    const isContainer = feedContainer instanceof HTMLElement;

    const getScrollY = (): number => {
      if (isContainer && feedContainer) {
        return feedContainer.scrollTop;
      }
      return window.scrollY || document.documentElement.scrollTop || 0;
    };

    baselineScrollRef.current = getScrollY();

    // Grace period: allow 280ms for open animation & tap inertia to settle before listening
    let isArmed = false;
    const armTimer = setTimeout(() => {
      isArmed = true;
      // Re-anchor baseline scroll after drawer has fully mounted
      baselineScrollRef.current = getScrollY();
    }, 280);

    const checkCollapse = () => {
      if (!isArmed || baselineScrollRef.current === null) return;
      const current = getScrollY();
      const diff = Math.abs(current - baselineScrollRef.current);
      if (diff > threshold) {
        onCollapseRef.current?.();
      }
    };

    const handleScroll = (e: Event) => {
      const target = e.target;
      if (ignoreSelector && target instanceof Element && target.closest(ignoreSelector)) {
        return;
      }
      checkCollapse();
    };

    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target;
      if (ignoreSelector && target instanceof Element && target.closest(ignoreSelector)) {
        touchStartYRef.current = null;
        return;
      }
      if (e.touches.length > 0) {
        touchStartYRef.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isArmed || touchStartYRef.current === null) return;
      const target = e.target;
      if (ignoreSelector && target instanceof Element && target.closest(ignoreSelector)) {
        return;
      }
      if (e.touches.length > 0) {
        const delta = Math.abs(e.touches[0].clientY - touchStartYRef.current);
        if (delta > threshold) {
          onCollapseRef.current?.();
        }
      }
    };

    let accumulatedWheel = 0;
    let wheelTimer: NodeJS.Timeout | null = null;
    const handleWheel = (e: WheelEvent) => {
      if (!isArmed) return;
      const target = e.target;
      if (ignoreSelector && target instanceof Element && target.closest(ignoreSelector)) {
        return;
      }
      accumulatedWheel += Math.abs(e.deltaY);
      if (wheelTimer) clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => {
        accumulatedWheel = 0;
      }, 200);

      if (accumulatedWheel > threshold) {
        onCollapseRef.current?.();
      }
    };

    window.addEventListener("scroll", handleScroll, { capture: true, passive: true });
    window.addEventListener("touchstart", handleTouchStart, { capture: true, passive: true });
    window.addEventListener("touchmove", handleTouchMove, { capture: true, passive: true });
    window.addEventListener("wheel", handleWheel, { capture: true, passive: true });

    return () => {
      clearTimeout(armTimer);
      if (wheelTimer) clearTimeout(wheelTimer);
      window.removeEventListener("scroll", handleScroll, { capture: true });
      window.removeEventListener("touchstart", handleTouchStart, { capture: true });
      window.removeEventListener("touchmove", handleTouchMove, { capture: true });
      window.removeEventListener("wheel", handleWheel, { capture: true });
    };
  }, [isExpanded, threshold, ignoreSelector]);

  // Background scroll state tracking (isScrolledDown)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleScrollTracking = (e: Event) => {
      const target = e.target;
      let scrollTop = 0;
      if (target instanceof HTMLElement) {
        scrollTop = target.scrollTop;
      } else {
        scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      }

      if (scrollTop <= 10) {
        setIsScrolledDown(false);
      } else if (scrollTop > 30) {
        setIsScrolledDown(true);
      }
    };

    window.addEventListener("scroll", handleScrollTracking, { capture: true, passive: true });
    return () => {
      window.removeEventListener("scroll", handleScrollTracking, { capture: true });
    };
  }, []);

  return isScrolledDown;
}
