"use client";

import { useLayoutEffect, useRef } from "react";
import { WeeklyPick, WEEKLY_PICK_STORAGE_KEY } from "@/types";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { readAppCache, writeAppCache } from "@/lib/clientCache";

/**
 * Restores the admin-broadcast Weekly Dispatch plus the cached venues / posts /
 * user from disk so the UI paints instantly on load, then keeps the cache warm
 * as the store changes.
 *
 * NOTE: the live Supabase session is the single source of truth for the user —
 * `AuthProvider` overwrites the cached user once the session resolves (and
 * clears it on SIGNED_OUT).
 */
export function AppStateHydrator() {
  const hydratedRef = useRef(false);

  // Runs before the browser paints → no empty-feed flash on repeat visits.
  useLayoutEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    const state = useCityPulseStore.getState();
    const cache = readAppCache();
    if (cache) {
      // The SSR-prefetched payload (applied during render) is authoritative.
      // Only fall back to the disk cache when no server payload was applied —
      // e.g. the app opened directly on a non-feed route.
      if (!state.serverDataApplied) {
        if (cache.venues && cache.venues.length > 0) state.setVenues(cache.venues);
        if (cache.foodPosts) state.setFoodPosts(cache.foodPosts);
        if (cache.weeklyPick) state.setWeeklyPick(cache.weeklyPick);
      }
      if (cache.currentUser) state.setCurrentUser(cache.currentUser);
    }

    try {
      const rawPick = localStorage.getItem(WEEKLY_PICK_STORAGE_KEY);
      if (rawPick && !cache?.weeklyPick && !state.serverDataApplied) {
        const pick = JSON.parse(rawPick) as WeeklyPick;
        if (pick && typeof pick.venue_id === "string" && Array.isArray(pick.coords)) {
          state.setWeeklyPick(pick);
        }
      }
    } catch {}
  }, []);

  // Keep the cache warm (debounced) as the live data hydrates.
  useLayoutEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const unsubscribe = useCityPulseStore.subscribe((s) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        writeAppCache({
          venues: s.venues,
          foodPosts: s.foodPosts,
          weeklyPick: s.weeklyPick,
          currentUser: s.currentUser,
        });
      }, 500);
    });
    return () => {
      if (timer) clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  return null;
}
