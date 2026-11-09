import crypto from "crypto";
import fs from "fs";
import path from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY || "";

let adminClient: SupabaseClient | null = null;

function getAdminClient(): SupabaseClient | null {
  if (adminClient) return adminClient;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return null;
  adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return adminClient;
}

// In-flight deduplication pool to prevent concurrent duplicate Google fetches
const inFlightIngestions = new Map<string, Promise<string>>();

// Persistent memory + disk cache mapping Google photo ref -> permanent Supabase CDN URL
const resolvedCdnMemoryCache = new Map<string, string>();
let diskCacheLoaded = false;

function getPhotoCdnCachePath(): string {
  const p1 = path.join(process.cwd(), "curation", "google_photo_cdn_cache.json");
  if (fs.existsSync(path.dirname(p1))) return p1;
  return path.join(process.cwd(), "frontend", "curation", "google_photo_cdn_cache.json");
}

function loadDiskPhotoCache(): void {
  if (diskCacheLoaded) return;
  diskCacheLoaded = true;
  try {
    const filePath = getPhotoCdnCachePath();
    if (fs.existsSync(filePath)) {
      const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === "string") resolvedCdnMemoryCache.set(k, v);
      }
    }
  } catch {
    // Ignore read errors
  }
}

function saveDiskPhotoCache(ref: string, cdnUrl: string): void {
  resolvedCdnMemoryCache.set(ref, cdnUrl);
  try {
    const filePath = getPhotoCdnCachePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const obj = Object.fromEntries(resolvedCdnMemoryCache.entries());
    fs.writeFileSync(filePath, JSON.stringify(obj, null, 2), "utf8");
  } catch {
    // Ignore write errors
  }
}

/**
 * Extracts a Google Places photo resource name from a raw reference or proxy URL.
 * Accepts formats:
 * - `places/ChIJ.../photos/Aa-ng...`
 * - `/api/places/photos?ref=places%2F...&w=800`
 * - Full URLs pointing to the proxy endpoint
 */
export function extractGooglePhotoRef(input: string): string | null {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();
  if (trimmed.startsWith("places/")) return trimmed;

  if (trimmed.includes("/api/places/photos")) {
    try {
      const parsed = new URL(trimmed, "http://localhost");
      const ref = parsed.searchParams.get("ref");
      if (ref && ref.startsWith("places/")) return ref;
    } catch {
      // Fallback manual regex match
      const m = trimmed.match(/[?&]ref=([^&]+)/);
      if (m && m[1]) {
        const decoded = decodeURIComponent(m[1]);
        if (decoded.startsWith("places/")) return decoded;
      }
    }
  }

  return null;
}

/**
 * Idempotently ingests a Google Places photo to Supabase Storage CDN in WebP format.
 *
 * 1. Checks if the URL is already a Supabase Storage asset or static link (pass-through).
 * 2. Derives a deterministic SHA-256 storage path: `${prefix}/${hash}.webp`.
 * 3. Checks if the WebP file already exists in Supabase Storage (zero Google cost).
 * 4. If missing, downloads bytes from Google Places Media once, converts to WebP (quality 80)
 *    capped at 1080px width via `sharp`, and uploads to the `dish-photos` bucket.
 * 5. Returns the permanent Supabase Storage public CDN URL.
 */
export async function ingestGooglePhotoToSupabase(
  inputUrlOrRef: string,
  prefix = "google-cache"
): Promise<string> {
  if (!inputUrlOrRef || typeof inputUrlOrRef !== "string") return inputUrlOrRef;
  const trimmed = inputUrlOrRef.trim();

  // Pass-through check: already in Supabase Storage or non-Google asset
  if (trimmed.includes(".supabase.co/storage/") || trimmed.startsWith("data:")) {
    return trimmed;
  }
  if (
    !trimmed.startsWith("places/") &&
    !trimmed.includes("/api/places/photos")
  ) {
    return trimmed;
  }

  const ref = extractGooglePhotoRef(trimmed);
  if (!ref) {
    return trimmed;
  }

  // Instant memory + disk cache check (zero network calls once ingested)
  loadDiskPhotoCache();
  if (resolvedCdnMemoryCache.has(ref)) {
    return resolvedCdnMemoryCache.get(ref)!;
  }

  // Deduplicate concurrent requests in-flight for the same photo ref
  const existingPromise = inFlightIngestions.get(ref);
  if (existingPromise) {
    return existingPromise;
  }

  const ingestionPromise = (async () => {
    const supabase = getAdminClient();
    if (!supabase) {
      console.warn("[ingestGooglePhoto] Supabase admin credentials not configured.");
      return trimmed;
    }

    const hash = crypto.createHash("sha256").update(ref).digest("hex").slice(0, 28);
    const storagePath = `${prefix}/${hash}.webp`;
    const publicUrl = supabase.storage.from("dish-photos").getPublicUrl(storagePath).data.publicUrl;

    // Fast check: verify if the object already exists in the public bucket
    try {
      const headRes = await fetch(publicUrl, { method: "HEAD", cache: "no-store" });
      if (headRes.ok && Number(headRes.headers.get("content-length") || 0) > 0) {
        saveDiskPhotoCache(ref, publicUrl);
        return publicUrl;
      }
    } catch {
      // Continue to fetch and upload below
    }

    if (!GOOGLE_API_KEY) {
      console.warn("[ingestGooglePhoto] GOOGLE_PLACES_API_KEY missing, cannot download image.");
      return trimmed;
    }

    try {
      const googleUrl = `https://places.googleapis.com/v1/${ref}/media?maxWidthPx=1080&key=${GOOGLE_API_KEY}`;
      const res = await fetch(googleUrl, { redirect: "follow", cache: "no-store" });

      if (!res.ok) {
        console.warn(`[ingestGooglePhoto] Google Media fetch failed (${res.status}) for ${ref}`);
        return trimmed;
      }

      const rawBuffer = Buffer.from(await res.arrayBuffer());
      if (rawBuffer.length === 0) {
        return trimmed;
      }

      // Convert and compress to WebP using sharp
      const webpBuffer = await sharp(rawBuffer)
        .rotate()
        .resize({ width: 1080, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      const { error: uploadError } = await supabase.storage
        .from("dish-photos")
        .upload(storagePath, webpBuffer, {
          contentType: "image/webp",
          cacheControl: "31536000",
          upsert: true,
        });

      if (uploadError) {
        console.error(`[ingestGooglePhoto] Supabase upload failed for ${storagePath}:`, uploadError.message);
        return trimmed;
      }

      saveDiskPhotoCache(ref, publicUrl);
      return publicUrl;
    } catch (err) {
      console.error("[ingestGooglePhoto] Error during ingestion pipeline:", err);
      return trimmed;
    }
  })();

  inFlightIngestions.set(ref, ingestionPromise);
  try {
    return await ingestionPromise;
  } finally {
    inFlightIngestions.delete(ref);
  }
}
