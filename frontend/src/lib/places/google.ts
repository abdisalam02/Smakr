import type { ReviewItem } from "@/types";
import { curatedVenuePhotos, hashString } from "@/lib/places/curatedPhotos";

/**
 * Shared Google Places (Places API **New**) helpers used by the server routes
 * `/api/places/search` and `/api/places/details`.
 */

export const PLACES_API_BASE = "https://places.googleapis.com/v1";

/** Field mask covering the venue metrics + customer reviews we curate. */
export const PLACES_FIELD_MASK = [
  "id",
  "displayName",
  "formattedAddress",
  "location",
  "rating",
  "userRatingCount",
  "priceLevel",
  "reviews",
  "photos",
]
  .map((f) => (f === "id" ? "places.id" : `places.${f}`))
  .join(",");

/**
 * Place **Details** returns the place object directly (not wrapped in `places`),
 * so its field mask must NOT carry the `places.` prefix.
 */
export const PLACE_DETAILS_FIELD_MASK = [
  "id",
  "displayName",
  "formattedAddress",
  "location",
  "rating",
  "userRatingCount",
  "priceLevel",
  "reviews",
  "photos",
].join(",");

const NEIGHBORHOOD_HINTS: [RegExp, string][] = [
  [/gr(ü|u)nerl(ø|o)kka|markveien|thorvald|olaf ryes|sofienberg/i, "grunerlokka"],
  [/torggata|youngstorget|torggaten/i, "torggata"],
  [/t(ø|o)yen|gr(ø|o)nlandsleiret|hagegata/i, "toyen"],
  [/gr(ø|o)nland|smalgangen|tøyengata/i, "gronland"],
  [/frogner|bogstadveien|majorstuen|hegdehaugsveien|bygd(ø|o)y/i, "frogner"],
  [/kampen|br(ø|a)ten|kampen park/i, "kampen"],
];

export function inferNeighborhood(address: string): string {
  for (const [re, id] of NEIGHBORHOOD_HINTS) {
    if (re.test(address)) return id;
  }
  return "sentrum";
}

export interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  neighborhood: string;
  location: { lat: number; lng: number };
  google_rating: number | null;
  google_reviews_count: number;
  price_level: "$" | "$$" | "$$$" | null;
  reviews: ReviewItem[];
  /** Back-compat aliases consumed elsewhere in the app. */
  rating: number | null;
  user_ratings_total: number | null;
  /** Places API (New) photo resource names, e.g. `places/<id>/photos/<ref>`. */
  photos: string[];
}

/** Shape of a single review in a Places API (New) result. */
export interface GoogleReviewNew {
  name?: string;
  relativePublishTimeDescription?: string;
  rating?: number;
  text?: { text?: string };
  originalText?: { text?: string };
  authorAttribution?: { displayName?: string; uri?: string; photoUri?: string };
  publishTime?: string;
}

/** Shape of a Places API (New) place. */
export interface GooglePlaceNew {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  reviews?: GoogleReviewNew[];
  photos?: { name?: string }[];
}

export function mapPriceLevel(raw?: string): "$" | "$$" | "$$$" | null {
  switch (raw) {
    case "PRICE_LEVEL_FREE":
    case "PRICE_LEVEL_INEXPENSIVE":
      return "$";
    case "PRICE_LEVEL_MODERATE":
      return "$$";
    case "PRICE_LEVEL_EXPENSIVE":
    case "PRICE_LEVEL_VERY_EXPENSIVE":
      return "$$$";
    default:
      return null;
  }
}

export function mapReview(r: GoogleReviewNew, i: number): ReviewItem {
  return {
    id: r.name ? String(r.name) : r.publishTime ? String(r.publishTime) : `rev-${i}`,
    author_name: r.authorAttribution?.displayName || "Anonymous Diner",
    author_photo: r.authorAttribution?.photoUri || null,
    rating: typeof r.rating === "number" ? r.rating : 5,
    text: r.text?.text || r.originalText?.text || "",
    relative_time: r.relativePublishTimeDescription || "Recently",
  };
}

export function mapGooglePlace(p: GooglePlaceNew, category = "all"): PlaceResult {
  const address = p.formattedAddress ?? "Oslo, Norway";
  const googleRating = typeof p.rating === "number" ? p.rating : null;
  const reviewCount = typeof p.userRatingCount === "number" ? p.userRatingCount : 0;
  const liveReviews = (p.reviews ?? []).slice(0, 5).map(mapReview);
  const name = p.displayName?.text ?? "Imported venue";
  return {
    place_id: p.id ?? `google-${hashString(address)}`,
    name,
    formatted_address: address,
    neighborhood: inferNeighborhood(address),
    location: {
      lat: p.location?.latitude ?? 59.9171,
      lng: p.location?.longitude ?? 10.7516,
    },
    google_rating: googleRating,
    google_reviews_count: reviewCount,
    price_level: mapPriceLevel(p.priceLevel),
    // Google sometimes returns no reviews — keep the UI useful.
    reviews: liveReviews.length ? liveReviews : mockReviews(name, category),
    rating: googleRating,
    user_ratings_total: googleRating != null ? reviewCount : null,
    photos: (p.photos ?? [])
      .map((photo) => photo.name)
      .filter((name): name is string => Boolean(name))
      .slice(0, 10),
  };
}

export function titleCase(value: string): string {
  return value
    .replace(/\+/g, " ")
    .trim()
    .split(/\s+/)
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/* ------------------------------------------------------------------ */
/* Mock / fallback data (realistic Oslo food soundbites)               */
/* ------------------------------------------------------------------ */

const MOCK_REVIEW_POOL: { author: string; rating: number; text: string; time: string }[] = [
  {
    author: "Ingrid H.",
    rating: 5,
    text: "Best bowl of ramen I've had in Oslo — the broth is deeply savoury and the chashu melts in your mouth. Worth the queue.",
    time: "2 weeks ago",
  },
  {
    author: "Marius L.",
    rating: 4,
    text: "Cosy little spot with friendly staff and generous portions. It gets busy after 18:00, so come early if you want a seat.",
    time: "1 month ago",
  },
  {
    author: "Sofie A.",
    rating: 5,
    text: "A true neighbourhood gem. The flavours are bold and authentic — I keep coming back every single weekend.",
    time: "3 days ago",
  },
  {
    author: "Jonas K.",
    rating: 4,
    text: "Great value for money right in the city centre. The cardamom bun alone is worth the trip across town.",
    time: "2 months ago",
  },
];

export function mockReviews(seed: string, category = "all"): ReviewItem[] {
  const h = hashString(`${seed}-${category}`);
  const start = h % MOCK_REVIEW_POOL.length;
  return Array.from({ length: 4 }, (_, i) => {
    const r = MOCK_REVIEW_POOL[(start + i) % MOCK_REVIEW_POOL.length];
    return {
      id: `mock-review-${hashString(seed)}-${i}`,
      author_name: r.author,
      author_photo: null,
      rating: r.rating,
      text: r.text,
      relative_time: r.time,
    };
  });
}

export function mockPlace(query: string, category = "all"): PlaceResult {
  const clean = titleCase(query);
  const h = hashString(query.toLowerCase());
  const lat = 59.913 + ((h % 41) - 20) / 1000;
  const lng = 10.748 + (((h >> 3) % 41) - 20) / 1000;
  const photoCount = Math.max(6, Math.min(10, curatedVenuePhotos(category, 10).length));
  const name = clean.replace(/,?\s*oslo.*$/i, "") || "Imported venue";
  const rating = Number((4.4 + (h % 5) / 10).toFixed(1));
  const count = 120 + (h % 800);
  return {
    place_id: `mock-${h}`,
    name,
    formatted_address: `${clean}, Oslo, Norway`,
    neighborhood: inferNeighborhood(clean),
    location: { lat, lng },
    google_rating: rating,
    google_reviews_count: count,
    price_level: h % 3 === 0 ? "$$$" : h % 2 === 0 ? "$$" : "$",
    reviews: mockReviews(name, category),
    rating,
    user_ratings_total: count,
    photos: Array.from({ length: photoCount }, (_, i) => `mock:${i}`),
  };
}
