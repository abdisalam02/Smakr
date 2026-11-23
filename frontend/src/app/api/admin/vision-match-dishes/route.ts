import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { requireAdmin } from "@/app/api/admin/_auth";
import { captureGeminiGeneration, createAiTraceId } from "@/lib/posthog-ai";
import {
  isDeliveryAppImageUrl,
  type PhotoVisionBucket,
} from "@/lib/admin/imageSource";

export const runtime = "nodejs";

const MAX_CANDIDATES_PER_SPOT = 16;
const DOWNLOAD_CONCURRENCY = 4;
const VISION_MODELS = ["gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-2.5-flash"];

interface InputDish {
  id: string;
  dish_name: string;
  category?: string;
  review_text?: string;
  menu_description?: string | null;
}

interface VisionMatchItem {
  dish_id: string;
  matched_index: number | null;
  matched_url: string | null;
  confidence: number;
  visual_reason: string;
}

function resolveGeminiApiKey(): string {
  const fromEnv =
    process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
  if (fromEnv.trim()) return fromEnv.trim();
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    const content = fs.readFileSync(envPath, "utf8");
    const match =
      content.match(/^GEMINI_API_KEY=(.+)$/m) ||
      content.match(/^GOOGLE_GENERATIVE_AI_API_KEY=(.+)$/m);
    if (match?.[1]) {
      return match[1].trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    // ignore fs errors on read-only runtimes
  }
  return "";
}

function resolveLocalPublicFile(relUrl: string): string | null {
  const cleanRel = relUrl.replace(/^\//, "");
  const p1 = path.join(process.cwd(), "public", cleanRel);
  if (fs.existsSync(p1)) return p1;
  const p2 = path.join(process.cwd(), "frontend", "public", cleanRel);
  if (fs.existsSync(p2)) return p2;
  return null;
}

function extractGooglePhotoRef(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (trimmed.startsWith("places/")) return trimmed;
  if (trimmed.includes("/api/places/photos")) {
    try {
      const parsed = new URL(trimmed, "http://localhost");
      const ref = parsed.searchParams.get("ref");
      if (ref && ref.startsWith("places/")) return ref;
    } catch {
      return null;
    }
  }
  return null;
}

async function fetchThumbnailBase64(
  rawUrl: string,
  origin: string
): Promise<{ url: string; base64: string } | null> {
  try {
    let rawBuffer: Buffer | null = null;
    const trimmed = rawUrl.trim();
    const googleRef = extractGooglePhotoRef(trimmed);

    if (googleRef) {
      const googleKey = process.env.GOOGLE_PLACES_API_KEY || "";
      if (!googleKey) return null;
      const mediaUrl = `https://places.googleapis.com/v1/${googleRef}/media?maxWidthPx=480&key=${googleKey}`;
      const res = await fetch(mediaUrl, {
        redirect: "follow",
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return null;
      rawBuffer = Buffer.from(await res.arrayBuffer());
    } else if (trimmed.startsWith("/")) {
      const localPath = resolveLocalPublicFile(trimmed);
      if (localPath) {
        rawBuffer = fs.readFileSync(localPath);
      } else {
        const res = await fetch(`${origin}${trimmed}`, {
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) return null;
        rawBuffer = Buffer.from(await res.arrayBuffer());
      }
    } else if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      const res = await fetch(trimmed, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "image/webp,image/apng,image/*,*/*;q=0.8",
        },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return null;
      rawBuffer = Buffer.from(await res.arrayBuffer());
    } else {
      return null;
    }

    if (!rawBuffer || rawBuffer.length === 0) return null;

    const thumbBuffer = await sharp(rawBuffer)
      .rotate()
      .resize({ width: 384, withoutEnlargement: true })
      .jpeg({ quality: 75 })
      .toBuffer();

    return { url: trimmed, base64: thumbBuffer.toString("base64") };
  } catch {
    return null;
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  async function runNext() {
    while (cursor < items.length) {
      const idx = cursor++;
      results[idx] = await worker(items[idx]);
    }
  }

  const runners = Array.from({ length: Math.min(limit, items.length) }, () => runNext());
  await Promise.all(runners);
  return results;
}

async function callGeminiVisionJson(
  apiKey: string,
  parts: Array<Record<string, unknown>>,
  observability: { traceId: string; distinctId: string }
): Promise<{ rawText: string; modelUsed: string }> {
  let lastError = "Gemini Vision request failed across all fallback models.";

  for (const model of VISION_MODELS) {
    const endpoints = apiKey.startsWith("AQ.")
      ? [
          `https://aiplatform.googleapis.com/v1/publishers/google/models/${model}:generateContent?key=${apiKey}`,
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        ]
      : [
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          `https://aiplatform.googleapis.com/v1/publishers/google/models/${model}:generateContent?key=${apiKey}`,
        ];

    for (const url of endpoints) {
      const startedAt = Date.now();
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts }],
            generationConfig: {
              temperature: 0.15,
              responseMimeType: "application/json",
            },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          await captureGeminiGeneration({
            ...observability,
            spanName: "vision_match_dishes",
            model,
            input: `vision_match_dishes (${parts.length} parts)`,
            output: rawText,
            temperature: 0.15,
            latencyMs: Date.now() - startedAt,
            status: res.status,
          });
          if (typeof rawText === "string" && rawText.trim()) {
            return { rawText: rawText.trim(), modelUsed: model };
          }
          lastError = `${model} returned empty text`;
        } else {
          const errSnippet = (await res.text()).slice(0, 180);
          lastError = `${model} HTTP ${res.status}: ${errSnippet}`;
          await captureGeminiGeneration({
            ...observability,
            spanName: "vision_match_dishes",
            model,
            input: `vision_match_dishes (${parts.length} parts)`,
            temperature: 0.15,
            latencyMs: Date.now() - startedAt,
            status: res.status,
            error: lastError,
          });
        }
      } catch (err: any) {
        lastError = err?.message || String(err);
        await captureGeminiGeneration({
          ...observability,
          spanName: "vision_match_dishes",
          model,
          input: `vision_match_dishes (${parts.length} parts)`,
          temperature: 0.15,
          latencyMs: Date.now() - startedAt,
          error: lastError,
        });
      }
    }
  }

  throw new Error(lastError);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const apiKey = resolveGeminiApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured in environment." },
        { status: 500 }
      );
    }

    const body = (await req.json()) as {
      spotId?: string;
      spotName?: string;
      dishes?: InputDish[];
      candidatePhotos?: string[];
    };

    const spotName = (body.spotName || "Oslo Spot").trim();
    const dishes = Array.isArray(body.dishes) ? body.dishes : [];
    const rawPool = Array.isArray(body.candidatePhotos) ? body.candidatePhotos : [];

    // Guardrail: never allow Vision to pair a dish with copyrighted Wolt/Foodora photos
    const dedupedSafe: string[] = [];
    let skippedDeliveryCount = 0;
    const seen = new Set<string>();
    for (const raw of rawPool) {
      const trimmed = (raw || "").trim();
      if (!trimmed || seen.has(trimmed)) continue;
      seen.add(trimmed);
      if (isDeliveryAppImageUrl(trimmed)) {
        skippedDeliveryCount++;
        continue;
      }
      dedupedSafe.push(trimmed);
    }

    const toEvaluate = dedupedSafe.slice(0, MAX_CANDIDATES_PER_SPOT);
    if (toEvaluate.length === 0) {
      return NextResponse.json(
        {
          error:
            skippedDeliveryCount > 0
              ? "All candidate photos are from Wolt/Foodora and were skipped. Fetch Google Maps / SerpApi photos first."
              : "No candidate photos available to analyze. Click Fetch Photos first.",
        },
        { status: 400 }
      );
    }

    // Download & resize thumbnails concurrently (max 4 in flight)
    const fetched = await mapWithConcurrency(toEvaluate, DOWNLOAD_CONCURRENCY, (u) =>
      fetchThumbnailBase64(u, req.nextUrl.origin)
    );
    const evaluated = fetched.filter(
      (item): item is { url: string; base64: string } => item !== null
    );

    if (evaluated.length === 0) {
      return NextResponse.json(
        { error: "Could not download any candidate photos for Vision analysis." },
        { status: 422 }
      );
    }

    const dishPromptBlock = dishes
      .map((d, i) => {
        const desc = [d.menu_description, d.review_text].filter(Boolean).join(" | ");
        return `${i + 1}. dish_id="${d.id}" | name="${d.dish_name}" | category="${d.category || "food"}"${desc ? ` | notes="${desc.slice(0, 140)}"` : ""}`;
      })
      .join("\n");

    const promptText = [
      `You are the culinary photo curator for Smakr Oslo, analyzing ${evaluated.length} photos for "${spotName}".`,
      `Each image is labeled [0] through [${evaluated.length - 1}] directly before its image data.`,
      ``,
      `TASK 1 — CLASSIFY EVERY IMAGE [0..${evaluated.length - 1}] INTO EXACTLY ONE OF 3 BUCKETS:`,
      `- "food": Clear plated dish, bowl, burger, pastry, sandwich, or drink close-up usable as a dish photo.`,
      `- "venue_vibe": Sharp storefront entrance, exterior building, brand signage/logo, or inviting interior dining room / counter (IMPORTANT: never mark these as junk — we use them for the restaurant cover card and gallery strip).`,
      `- "junk": Blurry/dark/unusable frames, paper receipts, close-up text menus, parking signs, bathroom/random clutter.`,
      `For every image also write a concise ~8-word description of what is visible.`,
      ``,
      `TASK 2 — MATCH EACH REQUESTED DISH TO ITS SINGLE BEST DISTINCT "food" IMAGE:`,
      dishPromptBlock || "(No dishes supplied — return empty matches array.)",
      `- Only match to images classified as "food".`,
      `- Never reuse the same image index across two different dishes unless only 1 matching food photo exists for both.`,
      `- If no photo genuinely depicts that specific dish, return matched_index: null and confidence: 0.`,
      `- Provide confidence 0-100 and a short visual_reason (e.g. "Crispy pork banh mi with pickled carrots in basket").`,
      ``,
      `TASK 3 — RECOMMEND VENUE COVER & GALLERY STRIP:`,
      `- recommended_cover_index: Pick the single cleanest "venue_vibe" entrance/signage/logo/interior photo (or the crispest hero shot if no clean venue_vibe photo exists).`,
      `- recommended_cover_reason: Short reason for the cover pick.`,
      `- ranked_gallery_indices: Array of top 5-6 best image indices mixing "venue_vibe" + "food" shots for the venue gallery strip (prioritize 1-2 recognizable entrance/signage/interior shots alongside hero dishes; exclude all "junk").`,
      ``,
      `Return STRICT JSON matching this exact schema:`,
      `{`,
      `  "classifications": [`,
      `    { "index": 0, "bucket": "food" | "venue_vibe" | "junk", "description": "8-word visual summary" }`,
      `  ],`,
      `  "matches": [`,
      `    { "dish_id": "...", "matched_index": 0 | null, "confidence": 0-100, "visual_reason": "..." }`,
      `  ],`,
      `  "recommended_cover_index": 0 | null,`,
      `  "recommended_cover_reason": "...",`,
      `  "ranked_gallery_indices": [0, 1, 2]`,
      `}`,
    ].join("\n");

    const parts: Array<Record<string, unknown>> = [{ text: promptText }];
    evaluated.forEach((item, idx) => {
      parts.push({ text: `[${idx}]` });
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: item.base64,
        },
      });
    });

    const { rawText, modelUsed } = await callGeminiVisionJson(apiKey, parts, {
      traceId: createAiTraceId(),
      distinctId: auth.userId,
    });

    const parsed = JSON.parse(rawText) as {
      classifications?: Array<{
        index?: number;
        bucket?: string;
        description?: string;
      }>;
      matches?: Array<{
        dish_id?: string;
        matched_index?: number | null;
        confidence?: number;
        visual_reason?: string;
      }>;
      recommended_cover_index?: number | null;
      recommended_cover_reason?: string;
      ranked_gallery_indices?: number[];
    };

    const evaluatedPhotos = evaluated.map((e) => e.url);
    const validIndex = (n: unknown): n is number =>
      typeof n === "number" && Number.isInteger(n) && n >= 0 && n < evaluatedPhotos.length;

    const foodIndices: number[] = [];
    const venueVibeIndices: number[] = [];
    const junkIndices: number[] = [];
    const photoDescriptions: Record<number, string> = {};
    const photoTags: Record<string, { bucket: PhotoVisionBucket; description: string }> = {};

    const classifiedSet = new Set<number>();
    for (const item of parsed.classifications || []) {
      if (!validIndex(item.index) || classifiedSet.has(item.index)) continue;
      classifiedSet.add(item.index);

      const rawBucket = String(item.bucket || "").toLowerCase().trim();
      const bucket: PhotoVisionBucket =
        rawBucket === "food"
          ? "food"
          : rawBucket === "venue_vibe" || rawBucket === "vibe" || rawBucket === "venue"
          ? "venue_vibe"
          : "junk";
      const desc = String(item.description || "").trim().slice(0, 120);

      photoDescriptions[item.index] = desc;
      photoTags[evaluatedPhotos[item.index]] = { bucket, description: desc };

      if (bucket === "food") foodIndices.push(item.index);
      else if (bucket === "venue_vibe") venueVibeIndices.push(item.index);
      else junkIndices.push(item.index);
    }

    const foodIndexSet = new Set(foodIndices);
    const junkIndexSet = new Set(junkIndices);

    // Sanitize dish matches & ensure distinct indices when multiple food photos exist
    const usedFoodIndices = new Set<number>();
    const rawMatches = Array.isArray(parsed.matches) ? parsed.matches : [];
    const matchesByDishId = new Map<string, VisionMatchItem>();

    // Sort highest confidence first so best matches keep priority on distinct indices
    const sortedRawMatches = [...rawMatches].sort(
      (a, b) => Number(b.confidence || 0) - Number(a.confidence || 0)
    );

    for (const m of sortedRawMatches) {
      const dishId = String(m.dish_id || "").trim();
      if (!dishId) continue;

      let idx: number | null = validIndex(m.matched_index) ? m.matched_index : null;
      if (idx !== null && junkIndexSet.has(idx)) {
        idx = null;
      }
      // Prefer food bucket only for dishes
      if (idx !== null && foodIndexSet.size > 0 && !foodIndexSet.has(idx)) {
        idx = null;
      }
      // Prevent duplicate photo assignment when >1 food photo is available
      if (idx !== null && usedFoodIndices.has(idx) && foodIndexSet.size > 1) {
        idx = null;
      }
      if (idx !== null) {
        usedFoodIndices.add(idx);
      }

      const confidence =
        idx === null ? 0 : Math.max(0, Math.min(100, Math.round(Number(m.confidence || 0))));

      matchesByDishId.set(dishId, {
        dish_id: dishId,
        matched_index: idx,
        matched_url: idx !== null ? evaluatedPhotos[idx] : null,
        confidence,
        visual_reason: String(m.visual_reason || "").trim().slice(0, 160),
      });
    }

    const matches: VisionMatchItem[] = dishes.map((d) => {
      const existing = matchesByDishId.get(d.id);
      if (existing) return existing;
      return {
        dish_id: d.id,
        matched_index: null,
        matched_url: null,
        confidence: 0,
        visual_reason: "No matching plated dish photo found in pool.",
      };
    });

    // Cover pick: prefer recommended_cover_index if valid & non-junk, else first venue_vibe, else first food
    let coverIdx: number | null = validIndex(parsed.recommended_cover_index)
      ? parsed.recommended_cover_index
      : null;
    if (coverIdx !== null && junkIndexSet.has(coverIdx)) coverIdx = null;
    if (coverIdx === null) {
      coverIdx = venueVibeIndices[0] ?? foodIndices[0] ?? null;
    }

    const recommendedCover = {
      index: coverIdx,
      url: coverIdx !== null ? evaluatedPhotos[coverIdx] : null,
      reason:
        String(parsed.recommended_cover_reason || "").trim() ||
        (coverIdx !== null && venueVibeIndices.includes(coverIdx)
          ? "Best venue entrance / interior / signage shot."
          : "Crispest hero photo available."),
    };

    // Ranked gallery: exclude junk, deduplicate, cap at 6
    const rankedGalleryIndices: number[] = [];
    for (const idx of parsed.ranked_gallery_indices || []) {
      if (validIndex(idx) && !junkIndexSet.has(idx) && !rankedGalleryIndices.includes(idx)) {
        rankedGalleryIndices.push(idx);
      }
      if (rankedGalleryIndices.length >= 6) break;
    }
    if (rankedGalleryIndices.length === 0) {
      const fallbackGallery = [...venueVibeIndices.slice(0, 2), ...foodIndices.slice(0, 4)];
      for (const idx of fallbackGallery) {
        if (!rankedGalleryIndices.includes(idx)) rankedGalleryIndices.push(idx);
        if (rankedGalleryIndices.length >= 6) break;
      }
    }

    return NextResponse.json({
      success: true,
      matches,
      foodIndices,
      venueVibeIndices,
      junkIndices,
      nonFoodIndices: junkIndices,
      recommendedCover,
      rankedGalleryIndices,
      rankedGalleryUrls: rankedGalleryIndices.map((i) => evaluatedPhotos[i]),
      foodUrls: foodIndices.map((i) => evaluatedPhotos[i]),
      venueVibeUrls: venueVibeIndices.map((i) => evaluatedPhotos[i]),
      junkUrls: junkIndices.map((i) => evaluatedPhotos[i]),
      photoDescriptions,
      photoTags,
      evaluatedPhotos,
      skippedDeliveryCount,
      modelUsed,
    });
  } catch (err: any) {
    console.error("[vision-match-dishes] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Vision dish matching failed" },
      { status: 500 }
    );
  }
}
