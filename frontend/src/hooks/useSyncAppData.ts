"use client";

import { useEffect, useRef } from "react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import {
  fetchActiveWeeklyDrop,
  fetchFoodPosts,
  fetchVenues,
} from "@/lib/supabase/data";

/**
 * App initialisation hook — one-time revalidation of the Zustand store from the
 * live Supabase tables.
 *
 * With SSR prefetching the server already delivered the initial payload, so the
 * caller passes `enabled = false` and this is skipped entirely (removing the
 * client-side waterfall). It is only used as a fallback when the server had no
 * data to send.
 */
export function useSyncAppData(enabled = true) {
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    let cancelled = false;

    (async () => {
      try {
        const [venues, posts, drop] = await Promise.all([
          fetchVenues(),
          fetchFoodPosts(),
          fetchActiveWeeklyDrop(),
        ]);
        if (cancelled) return;

        const state = useCityPulseStore.getState();
        if (venues.length > 0) state.setVenues(venues);
        // Always sync posts (including an empty array) so the feed mirrors the DB.
        state.setFoodPosts(posts);
        if (drop) state.setWeeklyPick(drop);
      } finally {
        if (!cancelled) useCityPulseStore.getState().setIsHydratingData(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);
}
