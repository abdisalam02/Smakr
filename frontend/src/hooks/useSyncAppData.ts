"use client";

import { useEffect, useRef } from "react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import {
  fetchActiveWeeklyDrop,
  fetchFoodPosts,
  fetchVenues,
} from "@/lib/supabase/data";

/**
 * App initialisation & background revalidation hook.
 *
 * When SSR already supplied `initialData` (`deferred = true`), it still performs
 * a non-blocking background reconciliation after initial paint/boot and on
 * `pageshow` / `visibilitychange`, so mobile bfcache restores or warm edge hits
 * never get stuck on stale CMS data.
 */
export function useSyncAppData(hasServerData = false) {
  const inFlightRef = useRef(false);
  const lastSyncAtRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    const syncFromDb = async () => {
      if (inFlightRef.current || cancelled) return;
      inFlightRef.current = true;
      try {
        const [venues, posts, drop] = await Promise.all([
          fetchVenues(),
          fetchFoodPosts(),
          fetchActiveWeeklyDrop(),
        ]);
        if (cancelled) return;

        const state = useCityPulseStore.getState();
        if (venues.length > 0) state.setVenues(venues);
        if (posts.length > 0) state.setFoodPosts(posts);
        if (drop) state.setWeeklyPick(drop);
        lastSyncAtRef.current = Date.now();
      } finally {
        inFlightRef.current = false;
        if (!cancelled) useCityPulseStore.getState().setIsHydratingData(false);
      }
    };

    const delayMs = hasServerData ? 1200 : 0;
    const initTimer = window.setTimeout(() => {
      void syncFromDb();
    }, delayMs);

    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) void syncFromDb();
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && Date.now() - lastSyncAtRef.current > 15000) {
        void syncFromDb();
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      window.clearTimeout(initTimer);
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [hasServerData]);
}
