import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  DEFAULT_WEEKLY_PICK,
  type FoodPost,
  type UserProfile,
  type Venue,
  type WeeklyPick,
} from "@/types";
import type { OnboardingAvatarConfig } from "@/types/onboarding";
import { getSupabaseServerClient } from "./server";
import {
  mapFoodPostRow,
  mapVenueRow,
  type FoodPostRow,
  type VenueRow,
  type WeeklyPickRow,
} from "./mappers";

/**
 * Server-only read layer used to prefetch the initial page payload.
 *
 * Prefetching here removes the client-side data waterfall: the first HTML
 * response already contains the venues / dishes / weekly pick, so the feed and
 * map pins are present on the very first paint instead of appearing after a
 * post-hydration network round-trip.
 *
 * The rows are mapped through the same pure `./mappers` used by the browser
 * data layer, so the shapes are guaranteed identical on both sides.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Prefer the least-privileged publishable key (mirrors the browser client's RLS
// context); fall back to the server secret if the public key is absent.
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SECRET_KEY;

let cachedClient: SupabaseClient | null | undefined;

function getServerClient(): SupabaseClient | null {
  if (cachedClient !== undefined) return cachedClient;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    cachedClient = null;
    return cachedClient;
  }
  cachedClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      // Never let Next.js cache these public-CMS reads — admins expect edits to
      // appear immediately.
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
  return cachedClient;
}

/** Live Oslo venues (server prefetch). Returns `[]` when unavailable. */
export async function fetchVenuesServer(): Promise<Venue[]> {
  const supabase = getServerClient();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("venues")
      .select("*")
      .order("name", { ascending: true });
    if (error || !data || data.length === 0) return [];
    return (data as VenueRow[])
      .map(mapVenueRow)
      .filter((v) => Number.isFinite(v.latitude) && Number.isFinite(v.longitude) && v.latitude !== 0);
  } catch (err) {
    console.warn("[serverData] fetchVenuesServer failed — returning []:", err);
    return [];
  }
}

/** Live dish feed (server prefetch). Returns `[]` when unavailable. */
export async function fetchFoodPostsServer(): Promise<FoodPost[]> {
  const supabase = getServerClient();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("food_posts")
      .select(
        "*, venue:venues!food_posts_venue_id_fkey(*), author:profiles!food_posts_author_id_fkey(handle, name, avatar_url, is_official)"
      )
      .order("created_at", { ascending: false });
    if (error || !data || data.length === 0) return [];
    return (data as FoodPostRow[]).map(mapFoodPostRow);
  } catch (err) {
    console.warn("[serverData] fetchFoodPostsServer failed — returning []:", err);
    return [];
  }
}

/** Active Weekly Drop (server prefetch). Falls back to the default pick. */
export async function fetchActiveWeeklyDropServer(): Promise<WeeklyPick> {
  const supabase = getServerClient();
  if (!supabase) return DEFAULT_WEEKLY_PICK;
  try {
    const { data, error } = await supabase
      .from("weekly_picks")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return DEFAULT_WEEKLY_PICK;
    const row = data as WeeklyPickRow;
    return {
      id: row.id,
      venue_id: row.venue_id,
      dish_name: row.dish_name ?? DEFAULT_WEEKLY_PICK.dish_name,
      dish_image: row.dish_image ?? DEFAULT_WEEKLY_PICK.dish_image,
      speech_bubble: row.speech_bubble ?? DEFAULT_WEEKLY_PICK.speech_bubble,
      coords: [
        row.longitude ?? DEFAULT_WEEKLY_PICK.coords[0],
        row.latitude ?? DEFAULT_WEEKLY_PICK.coords[1],
      ],
      price_nok: row.price_nok ?? DEFAULT_WEEKLY_PICK.price_nok,
      week_label: row.week_label ?? DEFAULT_WEEKLY_PICK.week_label,
      active: Boolean(row.is_active),
    };
  } catch (err) {
    console.warn("[serverData] fetchActiveWeeklyDropServer failed — default pick:", err);
    return DEFAULT_WEEKLY_PICK;
  }
}

/**
 * SSR session read — the signed-in user + profile, or `null` when logged out.
 * Uses the cookie-aware server client so the first rendered frame (the Header)
 * already knows who is signed in, removing the logged-out flash on hard refresh.
 */
export async function fetchCurrentUserServer(): Promise<UserProfile | null> {
  try {
    const supabase = await getSupabaseServerClient();
    if (!supabase) return null;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    const p = (profile ?? {}) as Record<string, unknown>;

    const fallback = (user.email ?? "foodie").split("@")[0];
    const rawHandle = typeof p.handle === "string" && p.handle.trim() ? p.handle : fallback;
    const cleaned = rawHandle.replace(/^[@_\s]+/, "") || fallback;

    return {
      id: user.id,
      email: user.email,
      handle: `@${cleaned}`,
      name: typeof p.name === "string" ? p.name : undefined,
      role: p.role === "admin" ? "admin" : "foodie",
      is_official: Boolean(p.is_official),
      avatar_url: typeof p.avatar_url === "string" ? p.avatar_url : undefined,
      avatar_config: (p.avatar_config as OnboardingAvatarConfig) ?? null,
      onboarding_completed: Boolean(p.onboarding_completed),
    };
  } catch (err) {
    console.warn("[serverData] fetchCurrentUserServer failed:", err);
    return null;
  }
}
