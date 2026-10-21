import type {
  DietaryTag,
  FoodCategory,
  FoodPost,
  KitchenLiveStatus,
  Neighborhood,
  PopupResidencyMeta,
  ReviewItem,
  SpotType,
  Venue,
  VibeMetrics,
} from "@/types";

/**
 * Pure row → domain mappers shared by the client data layer (`data.ts`) and the
 * server prefetch layer (`serverData.ts`).
 *
 * This module MUST stay free of `"use client"` / `"use server"` directives and
 * of any browser/server-only APIs so it can be imported from both bundles.
 */

/* ------------------------------------------------------------------ */
/* Database row shapes (only the columns we consume)                   */
/* ------------------------------------------------------------------ */

export interface VenueRow {
  id: string;
  name: string;
  slug?: string | null;
  address?: string | null;
  neighborhood?: string | null;
  category?: string | null;
  dietary_tags?: string[] | null;
  latitude?: number | null;
  longitude?: number | null;
  image_url?: string | null;
  price_level?: string | null;
  open_now?: boolean | null;
  opening_hours?: unknown;
  current_opening_hours_text?: string | null;
  signature_dishes?: string[] | null;
  description?: string | null;
  is_official_pick?: boolean | null;
  vibe_signals?: Record<string, unknown> | null;
  google_place_id?: string | null;
  google_maps_url?: string | null;
  google_rating?: number | null;
  google_reviews_count?: number | null;
  curated_reviews?: unknown;
  created_at?: string | null;
  updated_at?: string | null;
  spot_type?: string | null;
  popup_start_date?: string | null;
  popup_end_date?: string | null;
  location_schedule?: string | null;
  website_uri?: string | null;
  google_maps_uri?: string | null;
  phone_number?: string | null;
}

export interface WeeklyPickRow {
  id: string;
  venue_id: string;
  dish_name?: string | null;
  dish_image?: string | null;
  mascot_avatar_url?: string | null;
  price_nok?: number | null;
  speech_bubble?: string | null;
  week_label?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  is_active?: boolean | null;
}

export interface ProfileLite {
  handle?: string | null;
  name?: string | null;
  avatar_url?: string | null;
  is_official?: boolean | null;
}

export interface FoodPostRow {
  id: string;
  venue_id: string;
  author_id?: string | null;
  dish_name?: string | null;
  dish_image?: string | null;
  review_text?: string | null;
  price_nok?: number | null;
  rating?: number | null;
  dietary_tags?: string[] | null;
  is_official_pick?: boolean | null;
  likes_count?: number | null;
  saves_count?: number | null;
  diner_quotes?: unknown;
  created_at?: string | null;
  category?: string | null;
  taste_tags?: string[] | null;
  drop_badge?: string | null;
  item_availability?: string | null;
  price_tier?: string | null;
  venue?: VenueRow | null;
  author?: ProfileLite | null;
  is_published?: boolean | null;
  is_archived?: boolean | null;
}

/* ------------------------------------------------------------------ */
/* Mappers                                                             */
/* ------------------------------------------------------------------ */

const DIETARY_TAGS: DietaryTag[] = ["vegan", "vegetarian", "halal", "gluten_free"];
const NEIGHBORHOODS: Neighborhood[] = [
  "all",
  "grunerlokka",
  "torggata",
  "toyen",
  "gronland",
  "sentrum",
  "frogner",
  "kampen",
];

export function mapCategory(raw?: string | null): FoodCategory {
  const key = (raw ?? "").toLowerCase().replace(/[^a-z]/g, "");
  if (!key) return "all";
  if (key.includes("dumpling") || key.includes("gyoza") || key.includes("dimsum") || key.includes("momo"))
    return "dumplings";
  if (key.includes("bao")) return "bao";
  if (key.includes("taco") || key.includes("burrito") || key.includes("birria") || key.includes("mexic"))
    return "tacos";
  if (key.includes("matcha") || key.includes("hojicha")) return "matcha";
  if (key.includes("pasta") || key.includes("spaghetti") || key.includes("italian")) return "pasta";
  if (key.includes("ramen") || key.includes("noodle") || key.includes("asian")) return "ramen";
  if (key.includes("burger") || key.includes("smash")) return "burger";
  if (key.includes("pizza")) return "pizza";
  if (key.includes("bak") || key.includes("pastry") || key.includes("bread") || key.includes("bun"))
    return "bakery";
  if (key.includes("dessert") || key.includes("sweet") || key.includes("gelato") || key.includes("icecream"))
    return "dessert";
  if (key.includes("coffee") || key.includes("cafe") || key.includes("tea") || key.includes("brew") || key.includes("espresso")) return "coffee";
  if (key.includes("street") || key.includes("viet") || key.includes("banh"))
    return "street_food";
  if (key.includes("sushi") || key.includes("seafood") || key.includes("fish") || key.includes("raw"))
    return "sushi";
  if (key.includes("bar") || key.includes("wine") || key.includes("cocktail") || key.includes("drink"))
    return "drinks";
  return "all";
}

function mapDietary(raw?: string[] | null): DietaryTag[] | undefined {
  if (!raw || raw.length === 0) return undefined;
  const mapped = raw
    .map((t) => t.toLowerCase().replace(/\s+|-/g, "_"))
    .filter((t): t is DietaryTag => DIETARY_TAGS.includes(t as DietaryTag));
  return mapped.length ? mapped : undefined;
}

function mapNeighborhood(raw?: string | null): Neighborhood | undefined {
  const key = (raw ?? "").toLowerCase();
  return NEIGHBORHOODS.includes(key as Neighborhood) ? (key as Neighborhood) : undefined;
}

function mapPriceLevel(raw?: string | null): "$" | "$$" | "$$$" | undefined {
  return raw === "$" || raw === "$$" || raw === "$$$" ? raw : undefined;
}

function buildVibe(row: VenueRow): VibeMetrics {
  const signals = (row.vibe_signals ?? {}) as Record<string, unknown>;
  const seating = typeof signals.seating === "string" ? signals.seating : "";
  const speed = typeof signals.speed === "string" ? signals.speed : "";
  const isOptimal = /optimal|great|fast/i.test(speed);
  return {
    seat_score: 2,
    seat_label: seating || "Comfortable",
    noise_score: 2,
    noise_label: "Moderate",
    outlets_percentage: 50,
    outlets_label: "Some",
    overall_status: isOptimal ? "optimal" : "moderate",
    overall_score: isOptimal ? 1.4 : 2.0,
    active_checkins_count: 0,
    last_checkin_at: null,
    is_live: false,
    decay_factor: 1,
    avg_download_mbps: null,
    avg_ping_ms: null,
  };
}

/**
 * Coerces any (possibly malformed) review array into a safe JSONB-serializable
 * `ReviewItem[]`. Never throws — every field gets a concrete fallback.
 */
export function sanitizeReviews(raw?: ReviewItem[] | null): ReviewItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((r): r is ReviewItem => Boolean(r) && typeof r === "object")
    .map((r, i) => ({
      id: typeof r.id === "string" && r.id ? r.id : `review-${i}`,
      author_name:
        typeof r.author_name === "string" && r.author_name.trim()
          ? r.author_name.trim()
          : "Anonymous Diner",
      author_photo: typeof r.author_photo === "string" && r.author_photo ? r.author_photo : null,
      rating: Number.isFinite(Number(r.rating)) ? Number(r.rating) : 5,
      text: typeof r.text === "string" ? r.text : "",
      relative_time:
        typeof r.relative_time === "string" && r.relative_time ? r.relative_time : "Recently",
    }));
}

function mapReviews(raw: unknown): ReviewItem[] {
  return sanitizeReviews(Array.isArray(raw) ? (raw as ReviewItem[]) : []);
}

export function parseKitchenLiveStatus(raw: unknown): KitchenLiveStatus | null {
  if (!raw || typeof raw !== "object") return null;
  const k = raw as Record<string, unknown>;
  const status = typeof k.status === "string" ? k.status : "normal";
  if (!["normal", "fresh_batch", "low_stock", "sold_out"].includes(status)) return null;
  const updatedAt = typeof k.updated_at === "string" ? k.updated_at : new Date().toISOString();

  // Auto-expire non-normal status after 14 hours
  let activeStatus: "normal" | "fresh_batch" | "low_stock" | "sold_out" = status as any;
  if (activeStatus !== "normal") {
    const parsedTime = new Date(updatedAt).getTime();
    if (Number.isFinite(parsedTime)) {
      const diff = Date.now() - parsedTime;
      if (diff > 14 * 60 * 60 * 1000) {
        activeStatus = "normal";
      }
    }
  }

  return {
    status: activeStatus,
    batch_note: typeof k.batch_note === "string" ? k.batch_note : undefined,
    dish_highlight: typeof k.dish_highlight === "string" ? k.dish_highlight : undefined,
    updated_at: updatedAt,
    kitchen_token: typeof k.kitchen_token === "string" ? k.kitchen_token : "",
    verified_kitchen: Boolean(k.verified_kitchen),
  };
}

export function mapVenueRow(row: VenueRow): Venue {
  const signals = (row.vibe_signals ?? {}) as Record<string, unknown>;
  return {
    id: row.id,
    name: row.name,
    address: row.address ?? "",
    city: "Oslo",
    latitude: typeof row.latitude === "number" ? row.latitude : 0,
    longitude: typeof row.longitude === "number" ? row.longitude : 0,
    place_type: "cafe",
    spot_type: ((row.spot_type || signals.spot_type) as SpotType) || "restaurant",
    food_category: mapCategory(row.category),
    icon: typeof signals.icon === "string" && signals.icon ? signals.icon : undefined,
    price_level: mapPriceLevel(row.price_level),
    signature_dishes: Array.isArray(row.signature_dishes)
      ? row.signature_dishes
      : Array.isArray(signals.signature_dishes)
      ? (signals.signature_dishes as string[])
      : [],
    description: row.description ?? null,
    current_opening_hours_text:
      row.current_opening_hours_text || (signals.current_opening_hours_text as string) || null,
    is_official_pick: Boolean(row.is_official_pick),
    live_food_status: undefined,
    google_place_id: row.google_place_id ?? null,
    google_rating: typeof row.google_rating === "number" ? row.google_rating : null,
    google_reviews_count:
      typeof row.google_reviews_count === "number" ? row.google_reviews_count : null,
    curated_reviews: mapReviews(row.curated_reviews),
    opening_hours_json: (row.opening_hours as Record<string, string> | null) ?? null,
    cover_image_url: row.image_url ?? null,
    has_wifi: false,
    has_outlets: false,
    silent_zone: false,
    outdoor_seating: false,
    dog_friendly: false,
    open_late: false,
    baseline_seats: 2,
    baseline_noise: 2,
    baseline_outlets: false,
    created_at: row.created_at ?? null,
    vibe: buildVibe(row),
    distance_meters: null,
    neighborhood: mapNeighborhood(row.neighborhood),
    dietary_tags: mapDietary(row.dietary_tags),
    open_now: Boolean(row.open_now),
    popup_start_date: row.popup_start_date || (signals.popup_start_date as string) || null,
    popup_end_date: row.popup_end_date || (signals.popup_end_date as string) || null,
    location_schedule: row.location_schedule || (signals.location_schedule as string) || null,
    website_uri: row.website_uri || (signals.website_uri as string) || null,
    google_maps_uri: row.google_maps_uri || row.google_maps_url || (signals.google_maps_uri as string) || null,
    phone_number: row.phone_number || (signals.phone_number as string) || null,
    vibe_signals: signals,
    kitchen_status: parseKitchenLiveStatus(signals.kitchen_status),
    popup_meta:
      signals.popup_meta && typeof signals.popup_meta === "object" && !Array.isArray(signals.popup_meta)
        ? (signals.popup_meta as PopupResidencyMeta)
        : null,
  };
}

function relativeTime(iso?: string | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const diffMin = Math.floor(Math.max(0, Date.now() - then) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const hours = Math.floor(diffMin / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatHandle(raw?: string | null, fallback = "smakr"): string {
  const base = (raw || fallback).replace(/^[@_\s]+/, "");
  return `@${base || fallback}`;
}

function mapItemAvailability(raw?: string | null): FoodPost["item_availability"] {
  if (!raw) return undefined;
  const lower = raw.toLowerCase().replace(/_/g, " ");
  if (lower.includes("fresh")) return "Fresh From Oven";
  if (lower.includes("sold")) return "Sold Out Today";
  if (lower.includes("weekend")) return "Weekend Only";
  if (lower.includes("avail")) return "Available Now";
  return undefined;
}

export function mapFoodPostRow(row: FoodPostRow): FoodPost {
  const venue = row.venue ?? null;
  const author = row.author ?? null;
  const lng = venue?.longitude ?? 0;
  const lat = venue?.latitude ?? 0;
  return {
    id: row.id,
    spot_id: row.venue_id,
    spot_name: venue?.name ?? "Smakr Spot",
    spot_address: venue?.address ?? "",
    spot_neighborhood: venue?.neighborhood
      ? venue.neighborhood.charAt(0).toUpperCase() + venue.neighborhood.slice(1)
      : "Oslo",
    spot_coords: [lng, lat],
    dish_name: row.dish_name ?? "Untitled dish",
    category: (() => {
      if (row.category) return mapCategory(row.category);
      const catTag = row.dietary_tags?.find((t) => t.startsWith("cat_"));
      if (catTag) return mapCategory(catTag.slice(4));
      const inferredFromDish = mapCategory(row.dish_name);
      if (inferredFromDish !== "all") return inferredFromDish;
      return mapCategory(venue?.category);
    })(),
    image_url: row.dish_image ?? "",
    price_nok: typeof row.price_nok === "number" && row.price_nok > 0 ? row.price_nok : null,
    rating: Number(row.rating ?? 0),
    taste_tags: Array.isArray(row.taste_tags) ? row.taste_tags : [],
    drop_badge: row.drop_badge ?? undefined,
    item_availability: mapItemAvailability(row.item_availability),
    price_tier: row.price_tier ?? null,
    review_text: row.review_text ?? "",
    author: {
      name: author?.name ?? "Smakr Foodie",
      handle: formatHandle(author?.handle),
      avatar_url: author?.avatar_url ?? "",
      badge: author?.is_official ? "Verified Foodie" : undefined,
    },
    likes_count: row.likes_count ?? 0,
    saves_count: row.saves_count ?? 0,
    created_at_relative: relativeTime(row.created_at),
    is_official_pick: Boolean(row.is_official_pick),
    dietary_tags: mapDietary(row.dietary_tags),
    diner_quotes: mapReviews(row.diner_quotes),
    spot_type: ((venue?.spot_type || (venue?.vibe_signals as any)?.spot_type) as SpotType) || "restaurant",
    is_published: row.is_published ?? true,
    is_archived: row.is_archived ?? false,
    kitchen_status: parseKitchenLiveStatus((venue?.vibe_signals as any)?.kitchen_status),
  };
}
