import crypto from "crypto";
import fs from "fs";
import path from "path";
import sharp from "sharp";

if (!globalThis.WebSocket) {
  globalThis.WebSocket = class DummyWebSocket {};
}
const { createClient } = await import("@supabase/supabase-js");

function loadEnvLocal() {
  for (const p of [
    path.join(process.cwd(), ".env.local"),
    path.join(process.cwd(), "frontend", ".env.local"),
  ]) {
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let val = m[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[m[1]]) process.env[m[1]] = val;
    }
    break;
  }
}

loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY || "";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

async function uploadLocalFolder(dirPath, slug) {
  if (!fs.existsSync(dirPath)) {
    console.warn(`Folder missing: ${dirPath}`);
    return [];
  }
  const files = fs
    .readdirSync(dirPath)
    .filter((f) => IMAGE_EXTS.has(path.extname(f).toLowerCase()))
    .sort();

  const urls = [];
  for (const file of files) {
    const full = path.join(dirPath, file);
    const raw = fs.readFileSync(full);
    const hash = crypto.createHash("sha256").update(raw).digest("hex").slice(0, 20);
    const storagePath = `popups/${slug}/${hash}.webp`;
    const publicUrl = supabase.storage.from("dish-photos").getPublicUrl(storagePath).data.publicUrl;

    const webp = await sharp(raw)
      .rotate()
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 84 })
      .toBuffer();

    const { error } = await supabase.storage.from("dish-photos").upload(storagePath, webp, {
      contentType: "image/webp",
      cacheControl: "31536000",
      upsert: true,
    });
    if (error) {
      console.warn(`Upload failed for ${file}:`, error.message);
      continue;
    }
    urls.push(publicUrl);
  }
  return urls;
}

async function fetchGooglePhotos(placeId, maxCount = 10) {
  if (!GOOGLE_API_KEY) return [];
  const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=en`, {
    headers: {
      "X-Goog-Api-Key": GOOGLE_API_KEY,
      "X-Goog-FieldMask": "photos.name",
    },
  });
  if (!res.ok) return [];
  const json = await res.json();
  const refs = (json.photos || []).slice(0, maxCount).map((p) => p.name).filter(Boolean);
  const urls = [];
  for (const ref of refs) {
    const hash = crypto.createHash("sha256").update(ref).digest("hex").slice(0, 28);
    const storagePath = `google-cache/${hash}.webp`;
    const publicUrl = supabase.storage.from("dish-photos").getPublicUrl(storagePath).data.publicUrl;
    try {
      const head = await fetch(publicUrl, { method: "HEAD" });
      if (head.ok && Number(head.headers.get("content-length") || 0) > 0) {
        urls.push(publicUrl);
        continue;
      }
    } catch {}
    const mediaRes = await fetch(
      `https://places.googleapis.com/v1/${ref}/media?maxWidthPx=1080&key=${GOOGLE_API_KEY}`,
      { redirect: "follow" }
    );
    if (!mediaRes.ok) continue;
    const raw = Buffer.from(await mediaRes.arrayBuffer());
    if (!raw.length) continue;
    const webp = await sharp(raw).rotate().resize({ width: 1080, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
    const { error } = await supabase.storage.from("dish-photos").upload(storagePath, webp, {
      contentType: "image/webp",
      cacheControl: "31536000",
      upsert: true,
    });
    if (!error) urls.push(publicUrl);
  }
  return urls;
}

async function updateVenueGallery(venueId, photos, { setCover = true, iconOverride } = {}) {
  const { data: venue } = await supabase.from("venues").select("id,name,image_url,vibe_signals").eq("id", venueId).maybeSingle();
  if (!venue) {
    console.warn(`Venue not found: ${venueId}`);
    return;
  }
  const existingSignals = (venue.vibe_signals && typeof venue.vibe_signals === "object") ? venue.vibe_signals : {};
  const mergedPhotos = Array.from(new Set(photos.filter(Boolean)));
  const patch = {
    vibe_signals: {
      ...existingSignals,
      ...(iconOverride ? { icon: iconOverride } : {}),
      place_photos: mergedPhotos,
    },
  };
  if (setCover && mergedPhotos[0]) {
    patch.image_url = mergedPhotos[0];
  }
  const { error } = await supabase.from("venues").update(patch).eq("id", venueId);
  console.log(`Updated ${venue.name}: ${mergedPhotos.length} photos${error ? ` (ERR: ${error.message})` : ""}`);
}

async function main() {
  const UWAN_ID = "d8d80f28-7757-41bc-8b46-e64cbe103992";
  const MINT_ID = "e41bc1ac-192c-4508-b882-8ade4bb65005";
  const CRANTZ_ID = "dd829981-3f91-4126-b732-78d1b50ab6a8";

  // Inspect U WAN SUM dishes (preserve user-added dishes)
  const { data: uwanPosts } = await supabase
    .from("food_posts")
    .select("id,dish_name,price_nok,dish_image")
    .eq("venue_id", UWAN_ID);
  console.log("U WAN SUM current food_posts:", JSON.stringify(uwanPosts || [], null, 2));

  // Upload Downloads folders
  const uwanPhotos = await uploadLocalFolder("C:\\Users\\abdis\\Downloads\\u-wan-sum", "u-wan-sum");
  const mintPhotos = await uploadLocalFolder("C:\\Users\\abdis\\Downloads\\Minton", "mint-on-wheels");
  const crantzLocal = await uploadLocalFolder("C:\\Users\\abdis\\Downloads\\Crantz", "crantz-cookies");
  const crantzGoogle = await fetchGooglePhotos("ChIJ619F3ahvQUYRGFRQFupBhDk", 10);

  console.log(`Uploaded -> uwan: ${uwanPhotos.length}, minton: ${mintPhotos.length}, crantz local: ${crantzLocal.length}, crantz google: ${crantzGoogle.length}`);

  await updateVenueGallery(UWAN_ID, uwanPhotos, { setCover: true });
  await updateVenueGallery(MINT_ID, mintPhotos, { setCover: true });
  const crantzAll = [...crantzLocal, ...crantzGoogle];
  await updateVenueGallery(CRANTZ_ID, crantzAll, { setCover: true, iconOverride: "cookie" });

  // Also update Crantz hero dish image to first local uploaded cookie photo
  if (crantzLocal[0]) {
    await supabase.from("food_posts").update({ dish_image: crantzLocal[0] }).eq("venue_id", CRANTZ_ID);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
