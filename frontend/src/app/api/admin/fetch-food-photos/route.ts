import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_auth";
import { fetchGooglePlacePhotoUrls } from "@/lib/places/google";
import { isDeliveryAppImageUrl } from "@/lib/admin/imageSource";

export const runtime = "nodejs";

const SERPAPI_FOOD_CATEGORY_ID = "CgIYIA";
const MAX_COMBINED_POOL = 30;

interface SerpApiCategory {
  id?: string;
  title?: string;
}

interface SerpApiPhotoItem {
  image?: string;
  thumbnail?: string;
}

interface SerpApiPhotosResponse {
  photos?: SerpApiPhotoItem[];
  categories?: SerpApiCategory[];
  serpapi_pagination?: {
    next_page_token?: string;
  };
  error?: string;
}

function normalizePhotoUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of urls) {
    const trimmed = (raw || "").trim();
    if (!trimmed || isDeliveryAppImageUrl(trimmed) || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

async function resolveSerpApiDataId(
  apiKey: string,
  spotName: string,
  address: string
): Promise<string | null> {
  const q = [spotName, address, "Oslo Norway"].filter(Boolean).join(" ").trim();
  const params = new URLSearchParams({
    engine: "google_maps",
    q,
    type: "search",
    hl: "en",
    api_key: apiKey,
  });

  const res = await fetch(`https://serpapi.com/search.json?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    place_results?: { data_id?: string };
    local_results?: Array<{ data_id?: string }>;
  };

  return data.place_results?.data_id || data.local_results?.[0]?.data_id || null;
}

async function fetchSerpApiPhotoCategory(params: {
  apiKey: string;
  dataId: string;
  categoryId?: string | null;
  maxPages: number;
  limit: number;
}): Promise<{ photos: string[]; categories: SerpApiCategory[] }> {
  const collected: string[] = [];
  let categories: SerpApiCategory[] = [];
  let nextPageToken: string | undefined;

  for (let page = 0; page < params.maxPages && collected.length < params.limit; page++) {
    const qs = new URLSearchParams({
      engine: "google_maps_photos",
      data_id: params.dataId,
      hl: "en",
      api_key: params.apiKey,
    });
    if (params.categoryId) qs.set("category_id", params.categoryId);
    if (nextPageToken) qs.set("next_page_token", nextPageToken);

    const res = await fetch(`https://serpapi.com/search.json?${qs.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) break;

    const json = (await res.json()) as SerpApiPhotosResponse;
    if (json.error) break;

    if (page === 0 && Array.isArray(json.categories)) {
      categories = json.categories;
    }

    const pageUrls = (json.photos || [])
      .map((item) => item.image || item.thumbnail || "")
      .filter((u): u is string => Boolean(u && u.startsWith("http")));

    for (const u of pageUrls) {
      if (!collected.includes(u) && !isDeliveryAppImageUrl(u)) {
        collected.push(u);
      }
      if (collected.length >= params.limit) break;
    }

    nextPageToken = json.serpapi_pagination?.next_page_token;
    if (!nextPageToken) break;
  }

  return { photos: collected, categories };
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = (await req.json()) as {
      spotId?: string;
      spotName?: string;
      address?: string;
      googlePlaceId?: string | null;
      existingPhotos?: string[];
      mode?: "both" | "food" | "vibe";
    };

    const spotName = (body.spotName || "").trim();
    const address = (body.address || "").trim();
    const mode = body.mode || "both";
    const existingClean = normalizePhotoUrls(body.existingPhotos || []);

    if (!spotName) {
      return NextResponse.json({ error: "Missing spotName" }, { status: 400 });
    }

    const serpKey = (process.env.SERPAPI_API_KEY || "").trim();
    let source: "serpapi_maps" | "google_places" = "google_places";
    let foodPhotos: string[] = [];
    let vibePhotos: string[] = [];
    let resolvedDataId: string | null = null;
    let resolvedPlaceId: string | null = body.googlePlaceId || null;

    // 1. Primary path: SerpApi Google Maps Photos (Food & drink + dynamic Vibe/Exterior/Interior)
    if (serpKey) {
      try {
        resolvedDataId = await resolveSerpApiDataId(serpKey, spotName, address);
        if (resolvedDataId) {
          let discoveredCategories: SerpApiCategory[] = [];

          if (mode === "both" || mode === "food") {
            const foodLimit = mode === "food" ? 20 : 15;
            const foodRes = await fetchSerpApiPhotoCategory({
              apiKey: serpKey,
              dataId: resolvedDataId,
              categoryId: SERPAPI_FOOD_CATEGORY_ID,
              maxPages: 2,
              limit: foodLimit,
            });
            foodPhotos = foodRes.photos;
            discoveredCategories = foodRes.categories;
          }

          if (mode === "both" || mode === "vibe") {
            if (discoveredCategories.length === 0) {
              const probe = await fetchSerpApiPhotoCategory({
                apiKey: serpKey,
                dataId: resolvedDataId,
                categoryId: null,
                maxPages: 1,
                limit: 8,
              });
              discoveredCategories = probe.categories;
              vibePhotos = probe.photos;
            } else {
              const vibeCat = discoveredCategories.find(
                (c) =>
                  c.id &&
                  c.id !== SERPAPI_FOOD_CATEGORY_ID &&
                  /vibe|atmosphere|exterior|interior|by owner/i.test(c.title || "")
              );
              const vibeRes = await fetchSerpApiPhotoCategory({
                apiKey: serpKey,
                dataId: resolvedDataId,
                categoryId: vibeCat?.id || null,
                maxPages: 1,
                limit: 8,
              });
              vibePhotos = vibeRes.photos.filter((u) => !foodPhotos.includes(u));
            }
          }

          if (foodPhotos.length > 0 || vibePhotos.length > 0) {
            source = "serpapi_maps";
          }
        }
      } catch (serpErr) {
        console.warn("[fetch-food-photos] SerpApi fallback to Google Places:", serpErr);
      }
    }

    // 2. Automatic fallback: Google Places API (up to 10 mixed food + entrance/interior shots)
    let fallbackAllPhotos: string[] = [];
    if (foodPhotos.length === 0 && vibePhotos.length === 0) {
      const gp = await fetchGooglePlacePhotoUrls({
        spotName,
        address,
        googlePlaceId: body.googlePlaceId,
        maxCount: 10,
        widthPx: 800,
      });
      resolvedPlaceId = gp.resolvedPlaceId || resolvedPlaceId;
      fallbackAllPhotos = normalizePhotoUrls(gp.photos);
      source = "google_places";
    }

    const fetchedAll = normalizePhotoUrls(
      source === "serpapi_maps"
        ? [...foodPhotos, ...vibePhotos]
        : fallbackAllPhotos
    );

    const existingSet = new Set(existingClean);
    const newlyAdded = fetchedAll.filter((u) => !existingSet.has(u));
    const mergedPool = normalizePhotoUrls([...existingClean, ...newlyAdded]).slice(
      0,
      MAX_COMBINED_POOL
    );

    return NextResponse.json({
      success: true,
      source,
      foodPhotos,
      vibePhotos,
      allPhotos: fetchedAll,
      photos: fetchedAll,
      mergedPool,
      addedCount: newlyAdded.length,
      resolvedPlaceId,
      dataId: resolvedDataId,
    });
  } catch (err: any) {
    console.error("[fetch-food-photos] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch venue photos" },
      { status: 500 }
    );
  }
}
