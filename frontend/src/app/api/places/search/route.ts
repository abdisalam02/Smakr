import { NextResponse } from "next/server";
import {
  PLACES_API_BASE,
  PLACES_FIELD_MASK,
  mapGooglePlace,
  mockPlace,
  type GooglePlaceNew,
} from "@/lib/places/google";

export const dynamic = "force-dynamic";

/**
 * Google Places Text Search proxy (Places API **New**).
 *
 * GET /api/places/search?q=Koie+Ramen+Oslo&category=ramen
 *
 * Uses GOOGLE_PLACES_API_KEY when present (server-only, never exposed to the
 * client) against `places.googleapis.com/v1/places:searchText`, and falls back
 * to a fully-functional mock (curated photography + plausible Oslo coords +
 * realistic customer reviews) when the key is missing, the API errors, or no
 * match is found.
 */

const KEY = process.env.GOOGLE_PLACES_API_KEY;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  const category = (searchParams.get("category") || "all").toLowerCase();

  if (!q) {
    return NextResponse.json({ error: "Missing required ?q parameter" }, { status: 400 });
  }

  if (KEY) {
    try {
      const res = await fetch(`${PLACES_API_BASE}/places:searchText`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": KEY,
          "X-Goog-FieldMask": PLACES_FIELD_MASK,
        },
        body: JSON.stringify({ textQuery: q, maxResultCount: 5, languageCode: "en" }),
        cache: "no-store",
      });
      const data = (await res.json()) as {
        places?: GooglePlaceNew[];
        error?: { message?: string };
      };
      if (data.error) {
        console.warn("[places/search] Google error:", data.error.message);
      }
      const results = (data.places ?? []).slice(0, 5).map((p) => mapGooglePlace(p, category));
      if (results.length > 0) {
        return NextResponse.json({ source: "google", place: results[0], results });
      }
    } catch (err) {
      console.warn("[places/search] Google lookup failed, using mock:", err);
    }
  }

  const place = mockPlace(q, category);
  return NextResponse.json({ source: "mock", place, results: [place] });
}
