import crypto from "crypto";
import fs from "fs";
import path from "path";
import sharp from "sharp";

if (!globalThis.WebSocket) {
  globalThis.WebSocket = class DummyWebSocket {};
}
const { createClient } = await import("@supabase/supabase-js");

function loadEnvLocal() {
  const candidates = [
    path.join(process.cwd(), ".env.local"),
    path.join(process.cwd(), "frontend", ".env.local"),
  ];
  for (const p of candidates) {
    if (!fs.existsSync(p)) continue;
    const raw = fs.readFileSync(p, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const key = m[1];
      let val = m[2].trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
    break;
  }
}

loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY || "";

if (!SUPABASE_URL || !SUPABASE_KEY || !GOOGLE_API_KEY) {
  console.error("Missing required env vars in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const cachePathCandidates = [
  path.join(process.cwd(), "curation", "google_photo_cdn_cache.json"),
  path.join(process.cwd(), "frontend", "curation", "google_photo_cdn_cache.json"),
];
const cachePath =
  cachePathCandidates.find((p) => fs.existsSync(path.dirname(p))) ||
  cachePathCandidates[0];

const cdnCache = new Map();
if (fs.existsSync(cachePath)) {
  try {
    const parsed = JSON.parse(fs.readFileSync(cachePath, "utf8"));
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === "string") cdnCache.set(k, v);
    }
  } catch {
    // ignore corrupt cache
  }
}

function flushDiskCache() {
  try {
    fs.mkdirSync(path.dirname(cachePath), { recursive: true });
    fs.writeFileSync(
      cachePath,
      JSON.stringify(Object.fromEntries(cdnCache.entries()), null, 2),
      "utf8"
    );
  } catch {
    // ignore write error
  }
}

function extractPhotoRef(input) {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();
  if (trimmed.startsWith("places/")) return trimmed;
  if (trimmed.includes("/api/places/photos")) {
    try {
      const parsed = new URL(trimmed, "http://localhost");
      const ref = parsed.searchParams.get("ref");
      if (ref && ref.startsWith("places/")) return ref;
    } catch {
      // ignore
    }
  }
  return null;
}

async function ingestPhotoRef(inputRef) {
  const ref = extractPhotoRef(inputRef);
  if (!ref) return null;

  if (cdnCache.has(ref)) {
    return cdnCache.get(ref);
  }

  const hash = crypto.createHash("sha256").update(ref).digest("hex").slice(0, 28);
  const storagePath = `google-cache/${hash}.webp`;
  const publicUrl = supabase.storage
    .from("dish-photos")
    .getPublicUrl(storagePath).data.publicUrl;

  try {
    const headRes = await fetch(publicUrl, { method: "HEAD" });
    if (headRes.ok && Number(headRes.headers.get("content-length") || 0) > 0) {
      cdnCache.set(ref, publicUrl);
      return publicUrl;
    }
  } catch {
    // fetch and upload below
  }

  const mediaUrl = `https://places.googleapis.com/v1/${ref}/media?maxWidthPx=1080&key=${GOOGLE_API_KEY}`;
  const mediaRes = await fetch(mediaUrl, { redirect: "follow" });
  if (!mediaRes.ok) {
    console.warn(`  [warn] Media fetch ${mediaRes.status} for ${ref}`);
    return null;
  }

  const rawBuf = Buffer.from(await mediaRes.arrayBuffer());
  if (rawBuf.length === 0) return null;

  const webpBuf = await sharp(rawBuf)
    .rotate()
    .resize({ width: 1080, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  const { error: uploadErr } = await supabase.storage
    .from("dish-photos")
    .upload(storagePath, webpBuf, {
      contentType: "image/webp",
      cacheControl: "31536000",
      upsert: true,
    });

  if (uploadErr) {
    console.warn(`  [warn] Storage upload error for ${storagePath}:`, uploadErr.message);
    return null;
  }

  cdnCache.set(ref, publicUrl);
  return publicUrl;
}

async function fetchPlacePhotoRefs(placeId) {
  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=en`;
  const res = await fetch(url, {
    headers: {
      "X-Goog-Api-Key": GOOGLE_API_KEY,
      "X-Goog-FieldMask": "id,photos",
    },
  });
  if (!res.ok) {
    console.warn(`  [warn] Place details ${res.status} for ${placeId}`);
    return [];
  }
  const data = await res.json();
  if (!Array.isArray(data?.photos)) return [];
  return data.photos
    .map((p) => p?.name)
    .filter((n) => typeof n === "string" && n.startsWith("places/"))
    .slice(0, 6);
}

async function resolvePlaceIdAndPhotos(venue) {
  const query = `${venue.name}, ${venue.address || "Oslo"}, Norway`;
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_API_KEY,
      "X-Goog-FieldMask": "places.id,places.displayName,places.photos",
    },
    body: JSON.stringify({
      textQuery: query,
      languageCode: "en",
      maxResultCount: 1,
      locationBias: {
        circle: {
          center: {
            latitude: typeof venue.latitude === "number" ? venue.latitude : 59.9139,
            longitude: typeof venue.longitude === "number" ? venue.longitude : 10.7522,
          },
          radius: 5000.0,
        },
      },
    }),
  });
  if (!res.ok) {
    console.warn(`  [warn] TextSearch ${res.status} for ${venue.name}`);
    return { placeId: null, refs: [] };
  }
  const data = await res.json();
  const place = Array.isArray(data?.places) ? data.places[0] : null;
  if (!place?.id) return { placeId: null, refs: [] };
  const refs = Array.isArray(place.photos)
    ? place.photos
        .map((p) => p?.name)
        .filter((n) => typeof n === "string" && n.startsWith("places/"))
        .slice(0, 6)
    : [];
  return { placeId: place.id, refs };
}

async function main() {
  const { data: venues, error } = await supabase
    .from("venues")
    .select("id, name, address, latitude, longitude, spot_type, google_place_id, image_url, vibe_signals")
    .order("name", { ascending: true });

  if (error || !venues) {
    console.error("Failed to fetch venues:", error?.message);
    process.exit(1);
  }

  console.log(`Loaded ${venues.length} venues from Supabase.`);

  let updated = 0;
  let skipped = 0;
  let noPlaceId = 0;
  let ingestedImages = 0;

  for (const venue of venues) {
    const signals =
      venue.vibe_signals &&
      typeof venue.vibe_signals === "object" &&
      !Array.isArray(venue.vibe_signals)
        ? { ...venue.vibe_signals }
        : {};

    const existingPhotos = Array.isArray(signals.place_photos)
      ? signals.place_photos.filter(
          (u) => typeof u === "string" && u.includes(".supabase.co/storage/")
        )
      : [];

    const coverIsProxy =
      typeof venue.image_url === "string" &&
      venue.image_url.includes("/api/places/photos");

    if (existingPhotos.length >= 2 && !coverIsProxy) {
      skipped++;
      continue;
    }

    let placeId = venue.google_place_id;
    let refs = [];

    if (!placeId && venue.spot_type !== "popup") {
      console.log(`Resolving Google Place ID + photos for: ${venue.name}`);
      const resolved = await resolvePlaceIdAndPhotos(venue);
      placeId = resolved.placeId;
      refs = resolved.refs;
    }

    if (!placeId) {
      noPlaceId++;
      if (coverIsProxy) {
        const cdn = await ingestPhotoRef(venue.image_url);
        if (cdn) {
          ingestedImages++;
          await supabase
            .from("venues")
            .update({
              image_url: cdn,
              vibe_signals: { ...signals, place_photos: [cdn] },
            })
            .eq("id", venue.id);
          updated++;
        }
      }
      continue;
    }

    if (refs.length === 0) {
      console.log(`Fetching Google Places photos for: ${venue.name} (${placeId})`);
      refs = await fetchPlacePhotoRefs(placeId);
    }

    // If existing cover image is a proxy ref, include it too so it gets converted
    const coverRef = extractPhotoRef(venue.image_url);
    if (coverRef && !refs.includes(coverRef)) {
      refs.unshift(coverRef);
    }

    const cdnUrls = [];
    for (const ref of refs.slice(0, 6)) {
      const cdn = await ingestPhotoRef(ref);
      if (cdn && !cdnUrls.includes(cdn)) {
        cdnUrls.push(cdn);
        ingestedImages++;
      }
    }

    if (cdnUrls.length === 0) {
      console.log(`  [skip] No photos returned for ${venue.name}`);
      continue;
    }

    const patch = {
      vibe_signals: {
        ...signals,
        place_photos: cdnUrls,
      },
    };
    if (!venue.google_place_id && placeId) {
      patch.google_place_id = placeId;
    }
    if (!venue.image_url || coverIsProxy) {
      patch.image_url = cdnUrls[0];
    }

    const { error: updateErr } = await supabase
      .from("venues")
      .update(patch)
      .eq("id", venue.id);

    if (updateErr) {
      console.warn(`  [warn] Failed to update ${venue.name}:`, updateErr.message);
    } else {
      updated++;
      console.log(`  [ok] Saved ${cdnUrls.length} WebP photos to Supabase for ${venue.name}`);
    }
  }

  flushDiskCache();
  console.log(
    `\nDone! updated=${updated}, skipped=${skipped}, noPlaceId=${noPlaceId}, totalImagesProcessed=${ingestedImages}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
