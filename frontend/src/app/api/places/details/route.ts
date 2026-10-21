import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  PLACES_API_BASE,
  PLACE_DETAILS_FIELD_MASK,
  mapGooglePlace,
  mockPlace,
  type GooglePlaceNew,
} from "@/lib/places/google";

export const dynamic = "force-dynamic";

/**
 * Google Places Place Details proxy (Places API New).
 *
 * GET /api/places/details?place_id=ChIJ...&category=ramen&venue_id=...
 *
 * Used by the admin curation and partner studio UI to pull a venue's live rating,
 * review count, customer reviews, and photos on demand.
 * Enriches with food_posts photos when available or when photos count < 4.
 */

const KEY = process.env.GOOGLE_PLACES_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

function getSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const placeId = (searchParams.get("place_id") || "").trim();
  const q = (searchParams.get("q") || "").trim();
  const category = (searchParams.get("category") || "all").toLowerCase();
  const venueId = (searchParams.get("venue_id") || "").trim();

  if (!placeId && !q && !venueId) {
    return NextResponse.json({ error: "Provide ?place_id, ?q, or ?venue_id" }, { status: 400 });
  }

  let place: any = null;
  let source = "mock";

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
        place = mapGooglePlace(data, category);
        source = "google";
      }
    } catch (err) {
      console.warn("[places/details] Google lookup failed, using mock:", err);
    }
  }

  if (!place) {
    place = mockPlace(q || placeId || "Oslo Venue", category);
  }

  // Hybrid description fallback when editorialSummary is missing
  if (!place.description || !place.description.trim()) {
    const geminiKey = process.env.GEMINI_API_KEY;
    let synthesized = "";
    if (geminiKey && place.reviews && place.reviews.length > 0) {
      try {
        const reviewSnippets = place.reviews
          .slice(0, 4)
          .map((r: any) => r.text)
          .filter(Boolean)
          .join(" ");
        const prompt = `Write a factual, single-sentence Warm Nordic description (12-18 words, no exclamation marks, no adjectives like "seamless" or "curated") for this Oslo restaurant. Name: ${place.name}, Category: ${category}, Neighborhood: ${place.neighborhood || "Oslo"}. Reviews context: ${reviewSnippets.slice(0, 400)}`;
        const aiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { maxOutputTokens: 60, temperature: 0.3 },
            }),
            signal: AbortSignal.timeout(3000),
          }
        );
        if (aiRes.ok) {
          const aiData = await aiRes.json();
          synthesized = aiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
          synthesized = synthesized.replace(/^["']|["']$/g, "").replace(/\n/g, " ").trim();
        }
      } catch {
        // Fallback to deterministic template below
      }
    }

    if (!synthesized) {
      const area = place.neighborhood && place.neighborhood !== "sentrum" ? place.neighborhood : "Oslo";
      const catLabel = category && category !== "all" ? category.replace(/_/g, " ") : "culinary";
      synthesized = `Standout ${catLabel} spot in ${area} preparing fresh specialties and drinks daily.`;
    }

    place.description = synthesized;
  }

  // Enrich photos with database dish posts if venue_id provided or photo count < 4
  const client = getSupabaseClient();
  if (client && (venueId || placeId)) {
    try {
      let targetVenueId = venueId;
      if (!targetVenueId && placeId) {
        const { data: v } = await client
          .from("venues")
          .select("id")
          .eq("google_place_id", placeId)
          .maybeSingle();
        if (v?.id) targetVenueId = v.id;
      }
      if (targetVenueId) {
        const { data: posts } = await client
          .from("food_posts")
          .select("dish_image")
          .eq("spot_id", targetVenueId)
          .not("dish_image", "is", null)
          .limit(8);
        if (posts && posts.length > 0) {
          const dishImgs = posts.map((p) => p.dish_image).filter(Boolean);
          const existing = new Set(place.photos || []);
          dishImgs.forEach((img) => {
            if (img && !existing.has(img)) {
              place.photos.push(img);
              existing.add(img);
            }
          });
        }
      }
    } catch (err) {
      console.warn("[places/details] failed to enrich with dish photos:", err);
    }
  }

  return NextResponse.json({ source, place });
}
