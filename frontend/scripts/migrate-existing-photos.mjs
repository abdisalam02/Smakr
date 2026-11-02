import fs from "fs";
import path from "path";
import crypto from "crypto";

if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = class DummyWebSocket {
    constructor() {}
    addEventListener() {}
    removeEventListener() {}
  };
}

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

// 1. Load environment from frontend/.env.local
const envPath = path.resolve("frontend/.env.local");
if (!fs.existsSync(envPath)) {
  console.error("Missing frontend/.env.local file");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, "utf8");
const env = {};
envContent.split("\n").forEach((line) => {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, "");
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_KEY = env.GOOGLE_PLACES_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase admin credentials (URL or SERVICE_ROLE_KEY) in .env.local");
  process.exit(1);
}

if (!GOOGLE_KEY) {
  console.error("Missing GOOGLE_PLACES_API_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { createWebSocket: () => null },
});

// Cache map for ref -> permanent Supabase CDN URL
const cache = new Map();

function extractRef(url) {
  if (!url || typeof url !== "string") return null;
  if (url.startsWith("places/")) return url;
  try {
    const parsed = new URL(url, "http://localhost");
    const ref = parsed.searchParams.get("ref");
    if (ref && ref.startsWith("places/")) return ref;
  } catch {
    const m = url.match(/[?&]ref=([^&]+)/);
    if (m && m[1]) {
      const decoded = decodeURIComponent(m[1]);
      if (decoded.startsWith("places/")) return decoded;
    }
  }
  return null;
}

async function ingestRef(ref) {
  if (cache.has(ref)) {
    return cache.get(ref);
  }

  const hash = crypto.createHash("sha256").update(ref).digest("hex").slice(0, 28);
  const storagePath = `google-cache/${hash}.webp`;
  const publicUrl = supabase.storage.from("dish-photos").getPublicUrl(storagePath).data.publicUrl;

  // Check if already in Supabase Storage
  try {
    const headRes = await fetch(publicUrl, { method: "HEAD", cache: "no-store" });
    if (headRes.ok && Number(headRes.headers.get("content-length") || 0) > 0) {
      cache.set(ref, publicUrl);
      return publicUrl;
    }
  } catch {
    // Continue to fetch & upload
  }

  const googleUrl = `https://places.googleapis.com/v1/${ref}/media?maxWidthPx=1080&key=${GOOGLE_KEY}`;
  const res = await fetch(googleUrl, { redirect: "follow", cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Google Places Media fetch failed (${res.status}) for ref ${ref.slice(0, 30)}...`);
  }

  const rawBuffer = Buffer.from(await res.arrayBuffer());
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
    throw new Error(`Supabase upload failed: ${uploadError.message}`);
  }

  cache.set(ref, publicUrl);
  return publicUrl;
}

async function run() {
  console.log("=== Starting Google Photo -> Supabase Storage Backfill ===");

  // 1. Migrate Venues
  const { data: venues, error: vErr } = await supabase
    .from("venues")
    .select("id, name, image_url")
    .like("image_url", "/api/places/photos%");

  if (vErr) {
    console.error("Failed to query venues:", vErr.message);
    process.exit(1);
  }

  console.log(`Found ${venues?.length || 0} venues with proxy image URLs.`);
  let vMigrated = 0;

  for (const v of venues || []) {
    const ref = extractRef(v.image_url);
    if (!ref) {
      console.warn(`Could not extract ref from venue "${v.name}": ${v.image_url}`);
      continue;
    }
    try {
      process.stdout.write(`Migrating venue "${v.name}"... `);
      const cdnUrl = await ingestRef(ref);
      const { error: uErr } = await supabase
        .from("venues")
        .update({ image_url: cdnUrl })
        .eq("id", v.id);

      if (uErr) {
        console.log(`FAILED DB update: ${uErr.message}`);
      } else {
        vMigrated++;
        console.log(`DONE -> ${cdnUrl.slice(0, 65)}...`);
      }
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
    }
  }

  // 2. Migrate Food Posts
  const { data: posts, error: pErr } = await supabase
    .from("food_posts")
    .select("id, dish_name, dish_image")
    .like("dish_image", "/api/places/photos%");

  if (pErr) {
    console.error("Failed to query food_posts:", pErr.message);
    process.exit(1);
  }

  console.log(`\nFound ${posts?.length || 0} food posts with proxy image URLs.`);
  let pMigrated = 0;

  for (const p of posts || []) {
    const ref = extractRef(p.dish_image);
    if (!ref) {
      console.warn(`Could not extract ref from post "${p.dish_name}": ${p.dish_image}`);
      continue;
    }
    try {
      process.stdout.write(`Migrating dish "${p.dish_name}"... `);
      const cdnUrl = await ingestRef(ref);
      const { error: uErr } = await supabase
        .from("food_posts")
        .update({ dish_image: cdnUrl })
        .eq("id", p.id);

      if (uErr) {
        console.log(`FAILED DB update: ${uErr.message}`);
      } else {
        pMigrated++;
        console.log(`DONE -> ${cdnUrl.slice(0, 65)}...`);
      }
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
    }
  }

  console.log("\n=== Migration Summary ===");
  console.log(`Venues migrated:    ${vMigrated} / ${venues?.length || 0}`);
  console.log(`Food Posts migrated: ${pMigrated} / ${posts?.length || 0}`);
  console.log(`Unique photos cached: ${cache.size}`);
}

run();
