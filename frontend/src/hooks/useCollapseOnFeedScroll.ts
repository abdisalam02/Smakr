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

    // Anchor baseline from whatever container or window is active
    const feedContainer = document.querySelector("[data-feed-scroll]");
    if (feedContainer instanceof HTMLElement) {
      baselineScrollRef.current = feedContainer.scrollTop;
    } else {
      baselineScrollRef.current = window.scrollY || document.documentElement.scrollTop || 0;
    }

    const checkCollapse = (currentScroll: number) => {
      if (baselineScrollRef.current === null) {
        baselineScrollRef.current = currentScroll;
        return;
      }
      const diff = Math.abs(currentScroll - baselineScrollRef.current);
      if (diff > threshold) {
        onCollapseRef.current?.();
      }
    };

    const handleScroll = (e: Event) => {
      const target = e.target;
      if (ignoreSelector && target instanceof Element && target.closest(ignoreSelector)) {
        return;
      }

      let current = 0;
      if (target instanceof HTMLElement) {
        current = target.scrollTop;
      } else {
        current = window.scrollY || document.documentElement.scrollTop || 0;
      }
      checkCollapse(current);
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
      if (touchStartYRef.current === null) return;
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

    const handleWheel = (e: WheelEvent) => {
      const target = e.target;
      if (ignoreSelector && target instanceof Element && target.closest(ignoreSelector)) {
        return;
      }
      if (Math.abs(e.deltaY) > 12) {
        onCollapseRef.current?.();
      }
    };

    window.addEventListener("scroll", handleScroll, { capture: true, passive: true });
    window.addEventListener("touchstart", handleTouchStart, { capture: true, passive: true });
    window.addEventListener("touchmove", handleTouchMove, { capture: true, passive: true });
    window.addEventListener("wheel", handleWheel, { capture: true, passive: true });

    return () => {
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
