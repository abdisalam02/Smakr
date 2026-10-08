import { NextResponse } from "next/server";
import { curatedPhotoFor } from "@/lib/places/curatedPhotos";

export const dynamic = "force-dynamic";

/**
 * Google Places photo proxy (Places API **New**).
 *
 * GET /api/places/photos?ref=<photoResourceName>&category=ramen&i=0
 *
 * `ref` is a photo resource name (`places/<placeId>/photos/<photoRef>`).
 * - Real reference + key: streams `places.googleapis.com/v1/<ref>/media`
 *   server-side so the API key is never exposed to the browser.
 * - `mock:` references (no key) or upstream failures: redirects to a curated,
 *   category-matched high-res food photo so the UI stays functional.
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

  const googleUrl = `https://places.googleapis.com/v1/${ref}/media?maxWidthPx=${maxWidth}&key=${KEY}`;

  try {
    const upstream = await fetch(googleUrl, { redirect: "follow", cache: "no-store" });
    if (!upstream.ok || !upstream.body) return curated();

    const headers = new Headers();
    headers.set("Content-Type", upstream.headers.get("content-type") || "image/jpeg");
    headers.set("Cache-Control", "public, max-age=86400, immutable");
    return new NextResponse(upstream.body, { status: 200, headers });
  } catch (err) {
    console.warn("[places/photos] proxy failed, using curated photo:", err);
    return curated();
  }
}
