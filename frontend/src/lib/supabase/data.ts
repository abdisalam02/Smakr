"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  DEFAULT_WEEKLY_PICK,
  type FoodPost,
  type OnboardingAvatarConfig,
  type ReviewItem,
  type Venue,
  type WeeklyPick,
} from "@/types";
import { curatedVenuePhotos } from "@/lib/places/curatedPhotos";

/**
 * Smakr live data layer.
 *
 * A thin, resilient service that reads the public Supabase tables and maps the
 * database shapes onto the app's domain types. The database is the single
 * source of truth: reads return empty collections when the tables are empty or
 * a query fails, so the UI always reflects exactly what an admin has curated.
 */

import {
  type FoodPostRow,
  type VenueRow,
  type WeeklyPickRow,
  mapFoodPostRow,
  mapVenueRow,
  sanitizeReviews,
} from "./mappers";

// The row shapes + pure mappers now live in `./mappers` so the server prefetch
// layer (`serverData.ts`) can reuse them without pulling in this client module.

/* ------------------------------------------------------------------ */
/* Mappers                                                             */
/* ------------------------------------------------------------------ */

// Pure row → domain mappers are shared with the server prefetch layer and now
// live in `./mappers`. They are re-exported here for backwards compatibility.
export { mapFoodPostRow, mapVenueRow, sanitizeReviews };

/* ------------------------------------------------------------------ */
/* Read API (pure database — no seed fallback)                         */
/* ------------------------------------------------------------------ */

/**
 * Live Oslo venues. The database is the single source of truth: this returns an
 * empty array when the table has no rows or the query fails — there is NO seed
 * fallback, so the map renders only venues an admin has curated.
 */
export async function fetchVenues(): Promise<Venue[]> {
  const supabase = getSupabaseBrowserClient();
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
    console.warn("[data] fetchVenues failed — returning an empty map:", err);
    return [];
  }
}

/**
 * Live dish feed. The database is the single source of truth: this returns an
 * empty array when the table has no rows or the query fails — there is NO seed
 * fallback, so the admin can curate dishes entirely from scratch.
 */
export async function fetchFoodPosts(): Promise<FoodPost[]> {
  const supabase = getSupabaseBrowserClient();
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
    console.warn("[data] fetchFoodPosts failed — returning an empty feed:", err);
    return [];
  }
}

export async function fetchActiveWeeklyDrop(): Promise<WeeklyPick> {
  const supabase = getSupabaseBrowserClient();
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
    console.warn("[data] fetchActiveWeeklyDrop failed — using default pick:", err);
    return DEFAULT_WEEKLY_PICK;
  }
}

/* ------------------------------------------------------------------ */
/* Writes (optimistic UI is driven by Zustand; these are best-effort)  */
/* ------------------------------------------------------------------ */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(value: string | null | undefined): boolean {
  return typeof value === "string" && UUID_RE.test(value);
}

export async function setPostLike(userId: string, postId: string, liked: boolean): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  // Only live (UUID) rows can be persisted — seed ids are local-only.
  if (!supabase || !isUuid(userId) || !isUuid(postId)) return;
  try {
    if (liked) {
      await supabase.from("post_likes").upsert({ user_id: userId, post_id: postId });
    } else {
      await supabase.from("post_likes").delete().eq("user_id", userId).eq("post_id", postId);
    }
  } catch (err) {
    console.warn("[data] setPostLike failed (kept optimistic):", err);
  }
}

export async function setPostSave(userId: string, postId: string, saved: boolean): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase || !isUuid(userId) || !isUuid(postId)) return;
  try {
    if (saved) {
      await supabase.from("post_saves").upsert({ user_id: userId, post_id: postId });
    } else {
      await supabase.from("post_saves").delete().eq("user_id", userId).eq("post_id", postId);
    }
  } catch (err) {
    console.warn("[data] setPostSave failed (kept optimistic):", err);
  }
}

export interface OnboardingPersistInput {
  userId: string;
  handle: string;
  avatarConfig: OnboardingAvatarConfig;
  avatarUrl: string;
}

/** Persists the onboarding result. Returns false when the columns are missing. */
export async function persistOnboarding(input: OnboardingPersistInput): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from("profiles")
      .update({
        handle: input.handle,
        avatar_config: input.avatarConfig,
        avatar_url: input.avatarUrl,
        onboarding_completed: true,
      })
      .eq("id", input.userId);
    if (error) {
      console.warn("[data] persistOnboarding failed:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[data] persistOnboarding threw:", err);
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Admin writes — Google Places import & data cleanup                  */
/* ------------------------------------------------------------------ */

const CATEGORY_LABELS: Record<string, string> = {
  all: "Food",
  coffee: "Coffee",
  bakery: "Bakery",
  ramen: "Ramen",
  burger: "Burger",
  pizza: "Pizza",
  street_food: "Street Food",
  sushi: "Sushi",
  dessert: "Dessert",
  drinks: "Drinks",
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export interface VenueInsertInput {
  name: string;
  address: string;
  neighborhood?: string;
  category?: string; // FoodCategory id
  /** Admin-curated emoji persisted to `vibe_signals.icon`. */
  icon?: string;
  latitude: number;
  longitude: number;
  imageUrl?: string | null;
  priceLevel?: string | null;
  openNow?: boolean;
  googlePlaceId?: string | null;
  googleRating?: number | null;
  googleReviewsCount?: number | null;
  googleMapsUrl?: string | null;
  dietaryTags?: string[];
  /** Hand-picked Google reviews persisted to `venues.curated_reviews`. */
  curatedReviews?: ReviewItem[];
  slug?: string;
}

export type VenueWriteErrorCode =
  | "no-session"
  | "permission-denied"
  | "unconfigured"
  | "error";

export interface VenueInsertResult {
  success: boolean;
  venue: Venue | null;
  error: string | null;
  /** Machine-readable failure reason for the admin UI. */
  code: VenueWriteErrorCode | null;
  /** True when an existing venue (matching slug or Google Place ID) was reused. */
  reused: boolean;
}

/** Inserts a venue straight into the live `public.venues` table. */
export async function insertVenue(input: VenueInsertInput): Promise<VenueInsertResult> {
  const fail = (error: string, code: VenueWriteErrorCode): VenueInsertResult => ({
    success: false,
    venue: null,
    error,
    code,
    reused: false,
  });
  const reuse = (row: VenueRow): VenueInsertResult => ({
    success: true,
    venue: mapVenueRow(row),
    error: null,
    code: null,
    reused: true,
  });

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return fail("Supabase is not configured.", "unconfigured");

  // A real writable session is required. The local "Beta Dev Bypass" only sets
  // a Zustand user — there is no Supabase session to authenticate with.
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    return fail(
      "You are currently using the local Beta Dev Bypass. Real database inserts require signing in with your email/password admin account.",
      "no-session"
    );
  }

  const baseSlug = input.slug || slugify(input.name) || "venue";
  const buildRow = (slug: string) => ({
    name: input.name,
    slug,
    address: input.address,
    neighborhood: input.neighborhood ?? "sentrum",
    category: CATEGORY_LABELS[input.category ?? "all"] ?? "Food",
    latitude: input.latitude,
    longitude: input.longitude,
    // `venues.image_url` is NOT NULL — fall back to a curated, type-matched photo.
    image_url: input.imageUrl || curatedVenuePhotos(input.category, 1)[0],
    price_level: input.priceLevel ?? "$$",
    open_now: input.openNow ?? true,
    google_place_id: input.googlePlaceId ?? null,
    google_rating: input.googleRating ?? null,
    google_reviews_count: input.googleReviewsCount ?? 0,
    curated_reviews: sanitizeReviews(input.curatedReviews),
    google_maps_url: input.googleMapsUrl ?? null,
    dietary_tags: input.dietaryTags ?? [],
    // The curated emoji lives alongside the vibe signals (no schema migration).
    vibe_signals: input.icon ? { icon: input.icon } : {},
  });

  try {
    // 1) Idempotent imports: reuse an existing venue for the same Google Place ID.
    if (input.googlePlaceId) {
      const { data: byPlace } = await supabase
        .from("venues")
        .select("*")
        .eq("google_place_id", input.googlePlaceId)
        .limit(1)
        .maybeSingle();
      if (byPlace) return reuse(byPlace as VenueRow);
    }

    // 2) Insert, resolving slug conflicts (409) by reusing or suffixing.
    let slug = baseSlug;
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, error } = await supabase
        .from("venues")
        .insert(buildRow(slug))
        .select("*")
        .single();
      if (!error && data) {
        return {
          success: true,
          venue: mapVenueRow(data as VenueRow),
          error: null,
          code: null,
          reused: false,
        };
      }

      const message = error?.message ?? "";
      const pgCode = (error as { code?: string } | null)?.code ?? "";

      // RLS / permission failures: 401 (unauthorized) or 42501 (insufficient_privilege).
      if (
        pgCode === "42501" ||
        pgCode === "401" ||
        /row-level security|permission denied|not authorized|jwt/i.test(message)
      ) {
        return fail(
          "Database permission denied: Ensure your user role in public.profiles is set to 'admin'.",
          "permission-denied"
        );
      }

      const isDuplicate =
        pgCode === "23505" || /duplicate key|unique constraint|conflict/i.test(message);
      if (isDuplicate) {
        // Look up the conflicting row by slug (or Google Place ID) and reuse it.
        const { data: existing } = await supabase
          .from("venues")
          .select("*")
          .eq("slug", slug)
          .limit(1)
          .maybeSingle();
        if (existing) {
          const ex = existing as VenueRow;
          const samePlace =
            !input.googlePlaceId || !ex.google_place_id || ex.google_place_id === input.googlePlaceId;
          if (samePlace) return reuse(ex);
        }
        // Different place with a colliding name (or a stale schema cache) —
        // append a short timestamp hash and retry.
        slug = `${baseSlug}-${Date.now().toString(36)}`;
        continue;
      }

      return fail(message || "Insert failed.", "error");
    }
    return fail("Could not generate a unique venue slug.", "error");
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Insert failed.", "error");
  }
}

export interface VenueUpdateInput {
  name?: string;
  address?: string;
  neighborhood?: string;
  category?: string;
  icon?: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string | null;
  priceLevel?: string | null;
  openNow?: boolean;
  dietaryTags?: string[];
  googleRating?: number | null;
  googleReviewsCount?: number | null;
  /** Hand-picked Google reviews persisted to `venues.curated_reviews`. */
  curatedReviews?: ReviewItem[];
}

/** Updates an existing venue (used to refresh Google metrics + curated reviews). */
export async function updateVenue(
  venueId: string,
  input: VenueUpdateInput
): Promise<{ success: boolean; error: string | null }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { success: false, error: "Supabase is not configured." };
  if (!isUuid(venueId)) return { success: false, error: "Invalid venue id." };

  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.address !== undefined) patch.address = input.address;
  if (input.neighborhood !== undefined) patch.neighborhood = input.neighborhood;
  if (input.category !== undefined)
    patch.category = CATEGORY_LABELS[input.category] ?? input.category;
  if (input.latitude !== undefined) patch.latitude = input.latitude;
  if (input.longitude !== undefined) patch.longitude = input.longitude;
  if (input.imageUrl !== undefined)
    patch.image_url = input.imageUrl || curatedVenuePhotos(input.category, 1)[0];
  if (input.priceLevel !== undefined) patch.price_level = input.priceLevel ?? "$$";
  if (input.openNow !== undefined) patch.open_now = input.openNow;
  if (input.dietaryTags !== undefined) patch.dietary_tags = input.dietaryTags;
  if (input.googleRating !== undefined) patch.google_rating = input.googleRating;
  if (input.googleReviewsCount !== undefined) patch.google_reviews_count = input.googleReviewsCount;
  if (input.curatedReviews !== undefined)
    patch.curated_reviews = sanitizeReviews(input.curatedReviews);
  if (input.icon !== undefined) patch.vibe_signals = { icon: input.icon };
  if (Object.keys(patch).length === 0) return { success: true, error: null };

  try {
    const { error } = await supabase.from("venues").update(patch).eq("id", venueId);
    if (error) {
      const message = error.message ?? "";
      const pgCode = (error as { code?: string } | null)?.code ?? "";
      if (
        pgCode === "42501" ||
        pgCode === "401" ||
        /row-level security|permission denied|not authorized|jwt/i.test(message)
      ) {
        return {
          success: false,
          error: "Database permission denied: Ensure your user role in public.profiles is set to 'admin'.",
        };
      }
      return { success: false, error: message || "Update failed." };
    }
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Update failed." };
  }
}

/** Quick vibe/taste signal chosen when logging a dish. */
export type VibeTag = "craving" | "must_try" | "tried";

export interface FoodPostInsertInput {
  venueId: string;
  authorId: string;
  dishName: string;
  dishImage?: string | null;
  reviewText?: string;
  priceNok?: number;
  rating?: number;
  dietaryTags?: string[];
  isOfficialPick?: boolean;
  /** Quick community vibe → bumps the matching counter column. */
  vibe?: VibeTag;
  /** Customer soundbites persisted to `food_posts.diner_quotes`. */
  dinerQuotes?: ReviewItem[];
}

export interface FoodPostInsertResult {
  success: boolean;
  dish: { id: string } | null;
  error: string | null;
}

/** Inserts a signature dish into `public.food_posts`. */
export async function insertFoodPost(input: FoodPostInsertInput): Promise<FoodPostInsertResult> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { success: false, dish: null, error: "Supabase is not configured." };
  try {
    const { data, error } = await supabase
      .from("food_posts")
      .insert({
        venue_id: input.venueId,
        author_id: input.authorId,
        dish_name: input.dishName,
        // Several `food_posts` columns are NOT NULL — always send concrete values.
        dish_image: input.dishImage?.trim() || "",
        review_text: input.reviewText?.trim() || "",
        price_nok: Number(input.priceNok ?? 0) || 0,
        rating: Number(input.rating ?? 0) || 0,
        dietary_tags: input.dietaryTags ?? [],
        is_official_pick: input.isOfficialPick ?? true,
        diner_quotes: sanitizeReviews(input.dinerQuotes),
        likes_count: 0,
        saves_count: 0,
        craving_count: input.vibe === "craving" ? 1 : 0,
        must_try_count: input.vibe === "must_try" ? 1 : 0,
        tried_count: input.vibe === "tried" ? 1 : 0,
      })
      .select("id")
      .single();
    if (error || !data) {
      return { success: false, dish: null, error: error?.message || "Insert failed." };
    }
    return { success: true, dish: { id: (data as { id: string }).id }, error: null };
  } catch (err) {
    return {
      success: false,
      dish: null,
      error: err instanceof Error ? err.message : "Insert failed.",
    };
  }
}

export interface FoodPostUpdateInput {
  dishName?: string;
  venueId?: string;
  dishImage?: string | null;
  reviewText?: string | null;
  priceNok?: number;
  rating?: number | null;
  dietaryTags?: string[];
  isOfficialPick?: boolean;
  /** Customer soundbites persisted to `food_posts.diner_quotes`. */
  dinerQuotes?: ReviewItem[];
}

/**
 * Updates a dish in `public.food_posts`. Local (non-UUID) rows are skipped —
 * the caller keeps the optimistic Zustand update either way.
 */
export async function updateFoodPost(
  postId: string,
  input: FoodPostUpdateInput
): Promise<{ error: string | null }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { error: "Supabase is not configured." };
  if (!isUuid(postId)) return { error: null };

  const patch: Record<string, unknown> = {};
  if (input.dishName !== undefined) patch.dish_name = input.dishName;
  if (input.venueId !== undefined) patch.venue_id = input.venueId;
  // `dish_image` / `review_text` / `rating` are NOT NULL — never send null.
  if (input.dishImage !== undefined) patch.dish_image = input.dishImage?.trim() || "";
  if (input.reviewText !== undefined) patch.review_text = (input.reviewText ?? "").trim();
  if (input.priceNok !== undefined) patch.price_nok = Number(input.priceNok) || 0;
  if (input.rating !== undefined) patch.rating = Number(input.rating ?? 0) || 0;
  if (input.dietaryTags !== undefined) patch.dietary_tags = input.dietaryTags;
  if (input.isOfficialPick !== undefined) patch.is_official_pick = input.isOfficialPick;
  if (input.dinerQuotes !== undefined) patch.diner_quotes = sanitizeReviews(input.dinerQuotes);
  if (Object.keys(patch).length === 0) return { error: null };

  try {
    const { error } = await supabase.from("food_posts").update(patch).eq("id", postId);
    return { error: error?.message ?? null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Update failed." };
  }
}

export interface WeeklyPickBroadcastInput {
  venueId: string;
  dishName: string;
  dishImage: string;
  priceNok: number;
  speechBubble: string;
  weekLabel: string;
  latitude: number;
  longitude: number;
}

/**
 * Broadcasts a new Weekly Drop: deactivates the previous pick and inserts the
 * new active row in `public.weekly_picks`.
 */
export async function broadcastWeeklyPick(
  input: WeeklyPickBroadcastInput
): Promise<{ error: string | null }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { error: "Supabase is not configured." };
  if (!isUuid(input.venueId)) {
    return { error: "Pick a dish linked to a registered venue." };
  }
  try {
    // Exactly one active pick at a time.
    await supabase.from("weekly_picks").update({ is_active: false }).eq("is_active", true);
    const { error } = await supabase.from("weekly_picks").insert({
      venue_id: input.venueId,
      dish_name: input.dishName,
      // `weekly_picks.dish_image` is NOT NULL — fall back to an empty string.
      dish_image: input.dishImage || "",
      price_nok: input.priceNok,
      speech_bubble: input.speechBubble,
      week_label: input.weekLabel,
      latitude: input.latitude,
      longitude: input.longitude,
      is_active: true,
    });
    return { error: error?.message ?? null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Broadcast failed." };
  }
}

/**
 * Deletes placeholder (non–Google-imported) venues — i.e. rows with no
 * `google_place_id` — so only curated imported spots remain.
 */
export async function clearSeedVenues(): Promise<{ deleted: number; error: string | null }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { deleted: 0, error: "Supabase is not configured." };
  try {
    const { data, error } = await supabase
      .from("venues")
      .delete()
      .is("google_place_id", null)
      .select("id");
    if (error) return { deleted: 0, error: error.message };
    return { deleted: (data as { id: string }[] | null)?.length ?? 0, error: null };
  } catch (err) {
    return { deleted: 0, error: err instanceof Error ? err.message : "Delete failed." };
  }
}

/** Deletes every demo/seed food post. */
export async function clearFoodPosts(): Promise<{ deleted: number; error: string | null }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { deleted: 0, error: "Supabase is not configured." };
  try {
    const { data, error } = await supabase
      .from("food_posts")
      .delete()
      .not("id", "is", null)
      .select("id");
    if (error) return { deleted: 0, error: error.message };
    return { deleted: (data as { id: string }[] | null)?.length ?? 0, error: null };
  } catch (err) {
    return { deleted: 0, error: err instanceof Error ? err.message : "Delete failed." };
  }
}
