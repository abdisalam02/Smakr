import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { requireAuthenticatedUser, checkIpRateLimit } from "@/app/api/_authHelpers";
import {
  PLACES_API_BASE,
  PLACES_FIELD_MASK,
  mapGooglePlace,
  mockPlace,
  type GooglePlaceNew,
  type PlaceResult,
} from "@/lib/places/google";

export const dynamic = "force-dynamic";

const KEY = process.env.GOOGLE_PLACES_API_KEY;

// In-memory search cache (read-only seed preload when local file exists; never writes to Vercel EROFS)
const memorySearchCache = new Map<string, { source: string; place: PlaceResult; results: PlaceResult[] }>();
let searchDiskCacheLoaded = false;

function getSearchCachePath(): string {
  const p1 = path.join(process.cwd(), "curation", "google_places_search_cache.json");
  if (fs.existsSync(p1)) return p1;
  return path.join(process.cwd(), "frontend", "curation", "google_places_search_cache.json");
}

function loadSearchDiskCache(): void {
  if (searchDiskCacheLoaded) return;
  searchDiskCacheLoaded = true;
  try {
    const filePath = getSearchCachePath();
    if (fs.existsSync(filePath)) {
      const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
      for (const [k, v] of Object.entries(raw)) {
        if (v && typeof v === "object") {
          memorySearchCache.set(k, v as { source: string; place: PlaceResult; results: PlaceResult[] });
        }
      }
    }
  } catch {
    // Ignore cache read error
  }
}

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUser();
  if (!auth.ok) return auth.response;

  const rate = checkIpRateLimit(request, "places-search", 20, 60_000);
  if (!rate.ok) return rate.response;

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  const category = (searchParams.get("category") || "all").toLowerCase();
  const forceRefresh = searchParams.get("refresh") === "1";

  if (!q) {
    return NextResponse.json({ error: "Missing required ?q parameter" }, { status: 400 });
  }

  loadSearchDiskCache();
  const cacheKey = `${q.toLowerCase()}__${category}`;

  if (!forceRefresh && memorySearchCache.has(cacheKey)) {
    const cached = memorySearchCache.get(cacheKey)!;
    return NextResponse.json(
      { ...cached, cached: true },
      {
        headers: {
          "Cache-Control": "private, max-age=86400",
        },
      }
    );
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
        next: { revalidate: 86400 },
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
        const payload = { source: "google", place: results[0], results };
        memorySearchCache.set(cacheKey, payload);
        return NextResponse.json(payload, {
          headers: {
            "Cache-Control": "private, max-age=86400",
          },
        });
      }
    } catch (err) {
      console.warn("[places/search] Google lookup failed, using mock:", err);
    }
  }

  const place = mockPlace(q, category);
  return NextResponse.json({ source: "mock", place, results: [place] });
}
