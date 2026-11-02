import { NextResponse } from "next/server";
import { curatedPhotoFor } from "@/lib/places/curatedPhotos";
import { ingestGooglePhotoToSupabase } from "@/lib/storage/ingestGooglePhoto";

export const dynamic = "force-dynamic";

/**
 * Google Places photo proxy & self-healing redirector (Places API New).
 *
 * GET /api/places/photos?ref=<photoResourceName>&category=ramen&i=0&w=600
 *
 * - When requested with w >= 600 (feed cards and full displays), ingests the photo
 *   into Supabase Storage once and responds with a permanent 301 redirect to the
 *   Supabase Storage CDN URL.
 * - When requested with w < 600 (VisualPhotoSwitcher thumbnails), caches preview
 *   responses with max-age=31536000 so thumbnails are never re-fetched twice.
 * - Missing keys or mock refs redirect to curated category food photography.
 */

const KEY = process.env.GOOGLE_PLACES_API_KEY;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ref = searchParams.get("ref") || "";
  const category = searchParams.get("category");
  const index = Number.parseInt(searchParams.get("i") || "0", 10) || 0;
  const maxWidth = Math.min(
    1200,
    Math.max(200, Number.parseInt(searchParams.get("w") || "600", 10) || 600)
  );

  const curated = () => NextResponse.redirect(curatedPhotoFor(ref, category, index), 302);

  // Only Places API (New) photo resources can be proxied to Google.
  if (!KEY || !ref || ref.startsWith("mock") || !ref.startsWith("places/")) {
    return curated();
  }

  // Self-healing path: for full-size / feed cards (w >= 600), ingest to Supabase Storage CDN and 301 redirect
  if (maxWidth >= 600) {
    try {
      const cdnUrl = await ingestGooglePhotoToSupabase(ref);
      if (cdnUrl && cdnUrl.includes(".supabase.co/storage/")) {
        const response = NextResponse.redirect(cdnUrl, 301);
        response.headers.set("Cache-Control", "public, max-age=31536000, immutable");
        return response;
      }
    } catch (ingestErr) {
      console.warn("[places/photos] Ingestion redirect fallback:", ingestErr);
    }
  }

  // Thumbnail preview path (w < 600, e.g. w=200 switcher thumbnail)
  const googleUrl = `https://places.googleapis.com/v1/${ref}/media?maxWidthPx=${maxWidth}&key=${KEY}`;

  try {
    const upstream = await fetch(googleUrl, {
      redirect: "follow",
      next: { revalidate: 86400 },
    });
    if (!upstream.ok || !upstream.body) return curated();

    const headers = new Headers();
    headers.set("Content-Type", upstream.headers.get("content-type") || "image/jpeg");
    headers.set("Cache-Control", "public, max-age=31536000, s-maxage=31536000, immutable");
    return new NextResponse(upstream.body, { status: 200, headers });
  } catch (err) {
    console.warn("[places/photos] proxy failed, using curated photo:", err);
    return curated();
  }
}
