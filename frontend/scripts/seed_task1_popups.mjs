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
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function ingestPhotoRef(ref) {
  if (!ref || !GOOGLE_API_KEY) return null;
  const hash = crypto.createHash("sha256").update(ref).digest("hex").slice(0, 28);
  const storagePath = `google-cache/${hash}.webp`;
  const publicUrl = supabase.storage.from("dish-photos").getPublicUrl(storagePath).data.publicUrl;

  try {
    const head = await fetch(publicUrl, { method: "HEAD" });
    if (head.ok && Number(head.headers.get("content-length") || 0) > 0) return publicUrl;
  } catch {}

  const mediaRes = await fetch(
    `https://places.googleapis.com/v1/${ref}/media?maxWidthPx=1080&key=${GOOGLE_API_KEY}`,
    { redirect: "follow" }
  );
  if (!mediaRes.ok) return null;
  const buf = Buffer.from(await mediaRes.arrayBuffer());
  if (!buf.length) return null;

  const webp = await sharp(buf).rotate().resize({ width: 1080, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  const { error } = await supabase.storage.from("dish-photos").upload(storagePath, webp, {
    contentType: "image/webp",
    cacheControl: "31536000",
    upsert: true,
  });
  if (error) {
    console.warn("Storage upload error:", error.message);
    return null;
  }
  return publicUrl;
}

async function fetchGooglePlace(placeId) {
  if (!GOOGLE_API_KEY) return null;
  const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=en`, {
    headers: {
      "X-Goog-Api-Key": GOOGLE_API_KEY,
      "X-Goog-FieldMask": "id,displayName,formattedAddress,location,rating,userRatingCount,photos.name",
    },
  });
  if (!res.ok) {
    console.warn("Google Places fetch failed:", res.status);
    return null;
  }
  return res.json();
}

async function getAuthorId() {
  const { data } = await supabase.from("profiles").select("id").eq("role", "admin").limit(1).maybeSingle();
  if (data?.id) return data.id;
  const { data: anyProfile } = await supabase.from("profiles").select("id").limit(1).maybeSingle();
  return anyProfile?.id || "1be02016-43ec-476a-a9dc-97630b063846";
}

async function main() {
  const authorId = await getAuthorId();

  // 1. Update U WAN SUM
  const { data: uwan } = await supabase
    .from("venues")
    .select("*")
    .ilike("name", "%U WAN SUM%")
    .limit(1)
    .maybeSingle();

  if (uwan) {
    const existingSignals = (uwan.vibe_signals && typeof uwan.vibe_signals === "object") ? uwan.vibe_signals : {};
    const existingMeta = (existingSignals.popup_meta && typeof existingSignals.popup_meta === "object") ? existingSignals.popup_meta : {};
    const { error: uErr } = await supabase
      .from("venues")
      .update({
        address: "Kristian Augusts gate 21, 0164 Oslo",
        neighborhood: "sentrum",
        latitude: 59.9179,
        longitude: 10.7374,
        spot_type: "popup",
        category: "Coffee",
        popup_start_date: "2026-11-22",
        popup_end_date: "2026-11-22",
        current_opening_hours_text: "12:00 – til sold out",
        description:
          "Vietnamese Robusta phin coffee meets Egyptian hospitality, founded by Amira Nasr El Din. Catch their next live Oslo pop-up at Kristian Augusts gate 21 (Tullinløkka) on November 22.",
        vibe_signals: {
          ...existingSignals,
          icon: "viet_coffee",
          spot_type: "popup",
          popup_start_date: "2026-11-22",
          popup_end_date: "2026-11-22",
          popup_meta: {
            ...existingMeta,
            residency_status: "next_confirmed",
            host_venue_name: "Kristian Augusts gate 21, Tullinløkka",
            host_address: "Kristian Augusts gate 21, 0164 Oslo",
            dates_label: "Sun Nov 22 + Dec 6",
            daily_hours: "12:00 – til sold out",
            instagram_url: "https://instagram.com/uwansamofficial",
          },
        },
      })
      .eq("id", uwan.id);
    console.log("U WAN SUM update:", uErr ? uErr.message : `OK (${uwan.id})`);

    const { data: uwanPost } = await supabase
      .from("food_posts")
      .select("id")
      .eq("venue_id", uwan.id)
      .limit(1)
      .maybeSingle();
    if (uwanPost) {
      await supabase
        .from("food_posts")
        .update({
          dish_name: "Vietnamese Egg & Coconut Phin Coffee",
          category: "Coffee",
          price_nok: 75,
        })
        .eq("id", uwanPost.id);
    }
  } else {
    console.warn("U WAN SUM venue not found in Supabase");
  }

  // 2. Update Mint on Wheels
  const { data: mint } = await supabase
    .from("venues")
    .select("*")
    .ilike("name", "%Mint on Wheels%")
    .limit(1)
    .maybeSingle();

  if (mint) {
    const existingSignals = (mint.vibe_signals && typeof mint.vibe_signals === "object") ? mint.vibe_signals : {};
    const existingMeta = (existingSignals.popup_meta && typeof existingSignals.popup_meta === "object") ? existingSignals.popup_meta : {};
    const { error: mErr } = await supabase
      .from("venues")
      .update({
        neighborhood: "bjorvika",
        spot_type: "popup",
        popup_start_date: "2026-11-14",
        popup_end_date: "2026-11-14",
        description:
          "Oslo's roaming ceremonial Uji, Kyoto matcha cart. Just wrapped a 1-day drop at Mike's Corner in Oslobukta—track their next street stop on Smakr.",
        vibe_signals: {
          ...existingSignals,
          icon: "matcha",
          spot_type: "popup",
          popup_start_date: "2026-11-14",
          popup_end_date: "2026-11-14",
          popup_meta: {
            ...existingMeta,
            residency_status: "active",
            host_venue_name: "Mike's Corner, Oslobukta",
            host_address: "Operagata 77d, 0194 Oslo",
            dates_label: "Nov 14 · Mike's Corner",
            instagram_url: "https://instagram.com/mintonwheels",
          },
        },
      })
      .eq("id", mint.id);
    console.log("Mint on Wheels update:", mErr ? mErr.message : `OK (${mint.id})`);
  } else {
    console.warn("Mint on Wheels venue not found in Supabase");
  }

  // 3. Seed Crantz Cookies (Google Place ID: ChIJ619F3ahvQUYRGFRQFupBhDk)
  const placeId = "ChIJ619F3ahvQUYRGFRQFupBhDk";
  const gPlace = await fetchGooglePlace(placeId);
  const photoRefs = (gPlace?.photos || []).slice(0, 6).map((p) => p.name).filter(Boolean);
  const cdnPhotos = [];
  for (const ref of photoRefs) {
    const url = await ingestPhotoRef(ref);
    if (url) cdnPhotos.push(url);
  }
  console.log(`Crantz Cookies Google photos ingested: ${cdnPhotos.length}`);

  const { data: existingCrantz } = await supabase
    .from("venues")
    .select("*")
    .or(`google_place_id.eq.${placeId},name.ilike.%Crantz Cookies%`)
    .limit(1)
    .maybeSingle();

  const crantzSignals = {
    ...(existingCrantz?.vibe_signals || {}),
    icon: "bakery",
    spot_type: "popup",
    popup_start_date: "2026-11-14",
    popup_end_date: "2026-11-15",
    place_photos: cdnPhotos.length > 0 ? cdnPhotos : existingCrantz?.vibe_signals?.place_photos || [],
    popup_meta: {
      residency_status: "active",
      host_venue_name: "Operagata 61a, Bjørvika",
      host_address: "Operagata 61a, 0191 Oslo",
      dates_label: "Nov 14–15 · Bjørvika",
      daily_hours: "11:00–16:00",
      instagram_url: "https://instagram.com/crantzcookies",
    },
  };

  const crantzPayload = {
    name: "Crantz Cookies",
    slug: "crantz-cookies",
    address: "Operagata 61a, 0191 Oslo",
    neighborhood: "bjorvika",
    latitude: gPlace?.location?.latitude ?? 59.9082,
    longitude: gPlace?.location?.longitude ?? 10.7574,
    spot_type: "popup",
    category: "Bakery",
    price_level: "$",
    google_place_id: placeId,
    google_rating: gPlace?.rating ?? 4.8,
    google_reviews_count: gPlace?.userRatingCount ?? null,
    website_uri: "https://crantz.no",
    popup_start_date: "2026-11-14",
    popup_end_date: "2026-11-15",
    current_opening_hours_text: "11:00–16:00",
    image_url: cdnPhotos[0] || existingCrantz?.image_url || "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=1200&q=80",
    description:
      "Founded by sisters Felicia & Adele after testing 100+ recipes. Famous across Oslo for sell-out pop-up drops featuring chunky NYC-style cookies with molten Biscoff, Kinder, and cream cheese cores.",
    signature_dishes: ["Biscoff ('The Golden One') Cookie"],
    vibe_signals: crantzSignals,
  };

  let crantzVenueId = existingCrantz?.id;
  if (crantzVenueId) {
    const { error } = await supabase.from("venues").update(crantzPayload).eq("id", crantzVenueId);
    console.log("Crantz Cookies updated:", error ? error.message : crantzVenueId);
  } else {
    const { data: inserted, error } = await supabase.from("venues").insert(crantzPayload).select("id").single();
    if (error) {
      console.error("Crantz insert failed:", error.message);
      process.exit(1);
    }
    crantzVenueId = inserted.id;
    console.log("Crantz Cookies inserted:", crantzVenueId);
  }

  const { data: crantzPost } = await supabase
    .from("food_posts")
    .select("id")
    .eq("venue_id", crantzVenueId)
    .limit(1)
    .maybeSingle();

  const dishPayload = {
    venue_id: crantzVenueId,
    author_id: authorId,
    dish_name: "Biscoff ('The Golden One') Cookie",
    category: "Bakery",
    price_nok: 60,
    rating: 9.6,
    dish_image: crantzPayload.image_url,
    review_text:
      "Warm, chunky NYC-style snickerdoodle cookie stuffed with a molten Biscoff spread core, crunchy Biscoff crumbs, and white chocolate (60 kr · Classic 50 kr).",
    taste_tags: ["NYC Cookie", "Molten Biscoff", "Gooey Core", "Oslo Pop-Up"],
    is_official_pick: true,
    is_published: true,
    is_archived: false,
  };

  if (crantzPost) {
    const { error } = await supabase.from("food_posts").update(dishPayload).eq("id", crantzPost.id);
    console.log("Crantz dish updated:", error ? error.message : crantzPost.id);
  } else {
    const { data: insDish, error } = await supabase.from("food_posts").insert(dishPayload).select("id").single();
    console.log("Crantz dish inserted:", error ? error.message : insDish?.id);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
