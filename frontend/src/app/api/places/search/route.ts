import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
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

// Persistent server-side search cache to guarantee zero repeated Google Places API calls
const memorySearchCache = new Map<string, { source: string; place: PlaceResult; results: PlaceResult[] }>();
let searchDiskCacheLoaded = false;

function getSearchCachePath(): string {
  const p1 = path.join(process.cwd(), "curation", "google_places_search_cache.json");
  if (fs.existsSync(path.dirname(p1))) return p1;
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
          memorySearchCache.set(k, v as any);
        }
      }
    }
  } catch {
    // Ignore cache read error
  }
}

function saveSearchDiskCache(
  key: string,
  payload: { source: string; place: PlaceResult; results: PlaceResult[] }
): void {
  memorySearchCache.set(key, payload);
  try {
    const filePath = getSearchCachePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const serialized = Object.fromEntries(memorySearchCache.entries());
    fs.writeFileSync(filePath, JSON.stringify(serialized, null, 2), "utf8");
  } catch {
    // Ignore cache write error
  }
}

export async function GET(request: Request) {
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
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
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
        saveSearchDiskCache(cacheKey, payload);
        return NextResponse.json(payload, {
          headers: {
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
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
