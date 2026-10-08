import { NextResponse } from "next/server";
import {
  PLACES_API_BASE,
  PLACE_DETAILS_FIELD_MASK,
  mapGooglePlace,
  mockPlace,
  type GooglePlaceNew,
} from "@/lib/places/google";

export const dynamic = "force-dynamic";

/**
 * Google Places **Place Details** proxy (Places API New).
 *
 * GET /api/places/details?place_id=ChIJ...&category=ramen
 *
 * Used by the admin curation UI to pull a venue's live rating, review count and
 * customer reviews on demand. Falls back to `?q=` (free text) → mock data when
 * the key is missing or the lookup fails.
 */

const KEY = process.env.GOOGLE_PLACES_API_KEY;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const placeId = (searchParams.get("place_id") || "").trim();
  const q = (searchParams.get("q") || "").trim();
  const category = (searchParams.get("category") || "all").toLowerCase();

  if (!placeId && !q) {
    return NextResponse.json({ error: "Provide ?place_id or ?q" }, { status: 400 });
  }

  if (KEY && placeId) {
    try {
      const res = await fetch(
        `${PLACES_API_BASE}/places/${encodeURIComponent(placeId)}?languageCode=en`,
        {
          headers: {
            "X-Goog-Api-Key": KEY,
            "X-Goog-FieldMask": PLACE_DETAILS_FIELD_MASK,
          },
          cache: "no-store",
        }
      );
      const data = (await res.json()) as GooglePlaceNew & { error?: { message?: string } };
      if (data.error) {
        console.warn("[places/details] Google error:", data.error.message);
      }
      if (data.id) {
        return NextResponse.json({ source: "google", place: mapGooglePlace(data, category) });
      }
    } catch (err) {
      console.warn("[places/details] Google lookup failed, using mock:", err);
    }
  }

  const place = mockPlace(q || placeId, category);
  return NextResponse.json({ source: "mock", place });
}
