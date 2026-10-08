import type { FoodPost, UserProfile, Venue, WeeklyPick } from "@/types";

/**
 * Tiny client-side cache for the heavy store slices.
 *
 * Purpose: paint the previous session's venues / posts / user immediately on
 * load (stale-while-revalidate) instead of flashing an empty feed for the
 * duration of the Supabase round-trips. Supabase remains the source of truth —
 * `useSyncAppData` / `AuthProvider` overwrite these values as soon as the live
 * data resolves.
 */

const CACHE_KEY = "smakr_app_cache_v1";
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export interface AppCache {
  venues?: Venue[];
  foodPosts?: FoodPost[];
  weeklyPick?: WeeklyPick;
  currentUser?: UserProfile | null;
  savedAt?: number;
}

export function readAppCache(): AppCache | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppCache;
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.savedAt && Date.now() - parsed.savedAt > MAX_AGE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeAppCache(patch: AppCache): void {
  if (typeof window === "undefined") return;
  try {
    const current = readAppCache() ?? {};
    const next: AppCache = { ...current, ...patch, savedAt: Date.now() };
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(next));
  } catch {
    // Quota exceeded / private mode — best-effort only.
  }
}
