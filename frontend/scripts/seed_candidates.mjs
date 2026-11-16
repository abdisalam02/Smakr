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
  console.error("Missing Supabase admin credentials");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Official Smakr profile author ID
const OFFICIAL_AUTHOR_ID = "1be02016-43ec-476a-a9dc-97630b063846";

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

async function fetchGooglePhotoUrl(spotName, address) {
  if (!GOOGLE_KEY) return null;
  try {
    const query = `${spotName} ${address} Oslo`;
    const searchRes = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_KEY,
        "X-Goog-FieldMask": "places.id,places.displayName,places.photos",
      },
      body: JSON.stringify({ textQuery: query }),
    });

    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const place = searchData.places?.[0];
    if (!place?.photos?.[0]?.name) return null;

    const photoRef = place.photos[0].name;
    const hash = crypto.createHash("sha256").update(photoRef).digest("hex").slice(0, 28);
    const storagePath = `google-cache/${hash}.webp`;
    const publicUrl = supabase.storage.from("dish-photos").getPublicUrl(storagePath).data.publicUrl;

    // Check if already in Supabase Storage
    try {
      const headRes = await fetch(publicUrl, { method: "HEAD", cache: "no-store" });
      if (headRes.ok && Number(headRes.headers.get("content-length") || 0) > 0) {
        return { publicUrl, placeId: place.id };
      }
    } catch {
      // Continue to download and upload
    }

    const googleUrl = `https://places.googleapis.com/v1/${photoRef}/media?maxWidthPx=1080&key=${GOOGLE_KEY}`;
    const mediaRes = await fetch(googleUrl, { redirect: "follow", cache: "no-store" });
    if (!mediaRes.ok) return null;

    const rawBuffer = Buffer.from(await mediaRes.arrayBuffer());
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
      console.warn("Storage upload failed, fallback to icon:", uploadError.message);
      return null;
    }

    return { publicUrl, placeId: place.id };
  } catch (err) {
    console.warn(`Could not fetch photo for ${spotName}:`, err.message);
    return null;
  }
}

async function seed() {
  console.log("=== Seeding Curated Oslo Spots & Signature Dishes ===");

  const candidatesPath = path.resolve("curation/audits/new_oslo_candidates.json");
  if (!fs.existsSync(candidatesPath)) {
    console.error("Candidates file not found:", candidatesPath);
    process.exit(1);
  }

  const candidates = JSON.parse(fs.readFileSync(candidatesPath, "utf8"));
  console.log(`Loaded ${candidates.length} candidate spots.`);

  // 1. Fetch current venues to avoid duplicates
  const { data: existingVenues, error: vErr } = await supabase
    .from("venues")
    .select("id, name, slug");

  if (vErr) {
    console.error("Failed to query existing venues:", vErr);
    process.exit(1);
  }

  const existingMap = new Map();
  for (const v of existingVenues || []) {
    existingMap.set(v.name.toLowerCase().trim(), v.id);
  }
  console.log(`Found ${existingMap.size} existing venues in DB.`);

  let venuesInserted = 0;
  let dishesInserted = 0;

  for (const spot of candidates) {
    const spotKey = spot.name.toLowerCase().trim();
    let venueId = existingMap.get(spotKey);

    // If venue doesn't exist yet, insert it
    if (!venueId) {
      console.log(`\n[Venue] Processing: ${spot.name}...`);
      const photoResult = await fetchGooglePhotoUrl(spot.name, spot.address);
      const imageUrl = photoResult?.publicUrl || `/icons/food/${spot.icon || "street_food"}.webp`;
      const googlePlaceId = photoResult?.placeId || null;

      const newVenueRow = {
        name: spot.name,
        slug: slugify(spot.name),
        address: spot.address,
        neighborhood: spot.neighborhood,
        category: spot.food_category,
        latitude: spot.coords[1],
        longitude: spot.coords[0],
        price_level: spot.price_level,
        spot_type: spot.spot_type || "restaurant",
        image_url: imageUrl,
        google_place_id: googlePlaceId,
        google_rating: spot.google_rating,
        google_reviews_count: spot.google_reviews_count,
        website_uri: spot.website_uri || null,
        current_opening_hours_text: spot.opening_hours_text || null,
        description: spot.why_curated,
        signature_dishes: spot.signature_dishes || [],
        open_now: true,
        is_official_pick: false,
        vibe_signals: {
          icon: spot.icon,
          spot_type: spot.spot_type || "restaurant",
          source_attribution: spot.source_attribution,
          instagram_url: spot.instagram_url,
          kitchen_status: {
            status: "normal",
            updated_at: new Date().toISOString(),
            verified_kitchen: true,
          },
        },
      };

      const { data: insertedVenue, error: insErr } = await supabase
        .from("venues")
        .insert(newVenueRow)
        .select("id")
        .single();

      if (insErr) {
        console.error(`Failed to insert venue ${spot.name}:`, insErr);
        continue;
      }

      venueId = insertedVenue.id;
      existingMap.set(spotKey, venueId);
      venuesInserted++;
      console.log(`-> Inserted venue ${spot.name} (${venueId}) with photo: ${imageUrl.slice(0, 50)}...`);
    } else {
      console.log(`[Venue] ${spot.name} already exists (${venueId}).`);
    }

    // 2. Insert dish highlights into food_posts
    if (spot.dish_highlights && spot.dish_highlights.length > 0) {
      // Check existing food_posts for this venue
      const { data: existingPosts } = await supabase
        .from("food_posts")
        .select("id, dish_name")
        .eq("venue_id", venueId);

      const existingDishNames = new Set((existingPosts || []).map((p) => p.dish_name.toLowerCase().trim()));

      for (const dish of spot.dish_highlights) {
        const dishKey = dish.dish_name.toLowerCase().trim();
        if (existingDishNames.has(dishKey)) {
          console.log(`   [Dish] "${dish.dish_name}" already exists.`);
          continue;
        }

        // Get venue's image_url
        const { data: venueData } = await supabase
          .from("venues")
          .select("image_url")
          .eq("id", venueId)
          .single();

        const dishImage = venueData?.image_url || `/icons/food/${spot.icon || "street_food"}.webp`;

        const newPostRow = {
          venue_id: venueId,
          author_id: OFFICIAL_AUTHOR_ID,
          dish_name: dish.dish_name,
          dish_image: dishImage,
          review_text: dish.review_text || spot.why_curated,
          price_nok: dish.price_nok || null,
          rating: 5,
          category: dish.category || spot.food_category,
          taste_tags: dish.taste_tags || [],
          is_published: true,
          is_archived: false,
          is_official_pick: false,
        };

        const { error: postErr } = await supabase
          .from("food_posts")
          .insert(newPostRow);

        if (postErr) {
          console.error(`   Failed to insert dish "${dish.dish_name}":`, postErr);
        } else {
          dishesInserted++;
          console.log(`   -> Inserted dish "${dish.dish_name}" (${dish.price_nok} NOK)`);
        }
      }
    }
  }

  console.log(`\n=== Seed Complete ===`);
  console.log(`Venues inserted: ${venuesInserted}`);
  console.log(`Dishes inserted: ${dishesInserted}`);
}

seed().catch(console.error);
