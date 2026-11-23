import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { ingestGooglePhotoToSupabase } from "@/lib/storage/ingestGooglePhoto";
import { requireAdmin } from "@/app/api/admin/_auth";
import {
  readStagedCandidates,
  writeStagedCandidates,
} from "@/lib/admin/stagedCandidatesStore";
import {
  detectImageSource,
  isDeliveryAppImageUrl,
  isValidDishPhotoUrl,
  isValidVenueCoverUrl,
  type DishImageSource,
  type PhotoVisionTag,
} from "@/lib/admin/imageSource";

export const runtime = "nodejs";

const OFFICIAL_AUTHOR_ID = "1be02016-43ec-476a-a9dc-97630b063846";
const STORAGE_BUCKET = "dish-photos";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .replace(/æ/g, "ae")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export type VerificationStatus = "pending" | "approved" | "needs_photo" | "rejected" | "seeded";

export interface StagedDishHighlight {
  id: string;
  dish_name: string;
  category: string;
  price_nok: number | null;
  dish_image: string;
  is_verified_food_photo: boolean;
  review_text: string;
  taste_tags: string[];
  menu_description?: string | null;
  image_source?: DishImageSource;
  source_url?: string | null;
  vision_confidence?: number | null;
  vision_reason?: string | null;
  is_ai_enhanced?: boolean;
}

export interface StagedCandidateSpot {
  id: string;
  name: string;
  address: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  food_category: string;
  icon: string;
  spot_type: "restaurant" | "cafe" | "food_truck" | "popup" | "pop_up";
  cover_image_url: string;
  place_photos?: string[];
  candidate_photos?: string[];
  photo_vision_tags?: Record<string, PhotoVisionTag>;
  google_place_id?: string;
  google_reviews_count?: number;
  price_level?: "$" | "$$" | "$$$";
  google_rating?: number | null;
  signature_dish?: string;
  why_curated: string;
  verification_status: VerificationStatus;
  notes?: string;
  instagram_url?: string;
  website_uri?: string;
  opening_hours_text?: string;
  opening_hours?: Record<string, string>;
  popup_meta?: Record<string, any>;
  dish_highlights: StagedDishHighlight[];
}

function isValidSeedPhotoUrl(rawUrl: string): boolean {
  return isValidDishPhotoUrl(rawUrl);
}

function resolveLocalPublicFile(relUrl: string): string | null {
  const cleanRel = relUrl.replace(/^\//, "");
  const p1 = path.join(process.cwd(), "public", cleanRel);
  if (fs.existsSync(p1)) return p1;
  const p2 = path.join(process.cwd(), "frontend", "public", cleanRel);
  if (fs.existsSync(p2)) return p2;
  return null;
}

function bustLiveCaches() {
  try {
    revalidateTag("venues");
    revalidateTag("food_posts");
    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/seeding-lab");
  } catch {
    // Ignore outside request context
  }
}

// Ingest remote or local image into Supabase Storage dish-photos via Sharp WebP
async function ingestPhotoToStorage(
  supabase: SupabaseClient,
  imageUrl: string,
  prefix = ""
): Promise<string> {
  if (!imageUrl) return imageUrl;
  const trimmed = imageUrl.trim();

  // If already in our Supabase storage CDN, return as-is
  if (trimmed.includes("supabase.co/storage/v1/object/public/dish-photos")) {
    return trimmed;
  }

  // If it's a Google Places photo ref, use ingestGooglePhotoToSupabase
  if (trimmed.startsWith("places/") || trimmed.includes("/api/places/photos")) {
    return ingestGooglePhotoToSupabase(trimmed);
  }

  const hash = crypto.createHash("sha256").update(trimmed).digest("hex").slice(0, 24);
  const storagePath = prefix ? `${prefix}_${hash}.webp` : `${hash}.webp`;
  const publicUrl = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath).data.publicUrl;

  try {
    let rawBuffer: Buffer;

    if (trimmed.startsWith("data:image/")) {
      const base64Part = trimmed.split(",")[1];
      if (!base64Part) return trimmed;
      rawBuffer = Buffer.from(base64Part, "base64");
    } else if (trimmed.startsWith("/")) {
      const localPath = resolveLocalPublicFile(trimmed);
      if (localPath) {
        rawBuffer = fs.readFileSync(localPath);
      } else {
        const siteOrigin =
          process.env.NEXT_PUBLIC_SITE_URL ||
          (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
        if (!siteOrigin) return trimmed;
        const absUrl = new URL(trimmed, siteOrigin).toString();
        const res = await fetch(absUrl);
        if (!res.ok) return trimmed;
        rawBuffer = Buffer.from(await res.arrayBuffer());
      }
    } else {
      const res = await fetch(trimmed, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "image/webp,image/apng,image/*,*/*;q=0.8",
        },
      });

      if (!res.ok) {
        console.warn(`Failed to fetch photo from ${trimmed}: ${res.status}`);
        return trimmed;
      }
      rawBuffer = Buffer.from(await res.arrayBuffer());
    }

    const webpBuffer = await sharp(rawBuffer)
      .rotate()
      .resize({ width: 1080, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    const { error: uploadErr } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, webpBuffer, {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: true,
      });

    if (uploadErr) {
      console.warn(`Supabase storage upload error for ${storagePath}:`, uploadErr.message);
      return trimmed;
    }

    return publicUrl;
  } catch (err: any) {
    console.warn(`Error ingesting photo ${trimmed}:`, err.message);
    return trimmed;
  }
}

async function syncSpotToSupabase(
  supabase: SupabaseClient,
  spot: StagedCandidateSpot,
  options: { previousSpotName?: string; previousDishNames?: Record<string, string>; onlyVerifiedDishes?: boolean } = {}
): Promise<{ seededDishesCount: number; errors: string[] }> {
  const errors: string[] = [];
  let seededDishesCount = 0;

  // 1. Ingest Dish Photos to Supabase CDN and capture provenance before CDN rewrite
  const ingestedDishes: { dish: StagedDishHighlight; finalUrl: string }[] = [];
  const dishProvenance: Record<
    string,
    {
      image_source: DishImageSource;
      is_ai_enhanced: boolean;
      source_url?: string | null;
      vision_confidence?: number | null;
    }
  > = {};

  for (const dish of spot.dish_highlights) {
    if (options.onlyVerifiedDishes && !isValidSeedPhotoUrl(dish.dish_image)) {
      continue;
    }
    if (isDeliveryAppImageUrl(dish.dish_image)) {
      errors.push(`Skipped delivery-app photo on "${dish.dish_name}" — replace Wolt/Foodora URL first.`);
      continue;
    }
    const originalUrl = dish.dish_image;
    const inferredSource =
      dish.image_source && dish.image_source !== "unknown"
        ? dish.image_source
        : detectImageSource(originalUrl);
    const cdnUrl = await ingestPhotoToStorage(supabase, originalUrl, "dish");
    dish.dish_image = cdnUrl;
    dish.image_source = inferredSource;
    if (!dish.source_url && originalUrl && originalUrl !== cdnUrl) {
      dish.source_url = originalUrl;
    }
    const isAiEnhanced = Boolean(
      dish.is_ai_enhanced ||
        inferredSource === "ai_polish" ||
        detectImageSource(cdnUrl) === "ai_polish"
    );
    dish.is_ai_enhanced = isAiEnhanced;
    dishProvenance[dish.dish_name] = {
      image_source: inferredSource,
      is_ai_enhanced: isAiEnhanced,
      source_url: dish.source_url || null,
      vision_confidence: dish.vision_confidence ?? null,
    };
    ingestedDishes.push({ dish, finalUrl: cdnUrl });
  }

  // 2. Ingest Cover Photo to Supabase CDN (explicitly allows entrance/exterior/logo shots)
  let finalCoverUrl =
    (isValidVenueCoverUrl(spot.cover_image_url) && !isDeliveryAppImageUrl(spot.cover_image_url)
      ? spot.cover_image_url
      : "") ||
    ingestedDishes[0]?.finalUrl ||
    "";
  if (finalCoverUrl) {
    finalCoverUrl = await ingestPhotoToStorage(supabase, finalCoverUrl, "cover");
    spot.cover_image_url = finalCoverUrl;
  }

  // Build deduplicated pre-ingested Supabase CDN gallery for VenuePhotoStrip / VenuePhotoStack
  // Preserves entrance/interior/signage shots from place_photos alongside hero dish photos.
  const rawGallery = [
    ...(finalCoverUrl ? [finalCoverUrl] : []),
    ...(spot.place_photos ?? []),
    ...(spot.candidate_photos ?? []),
    ...ingestedDishes.map((d) => d.finalUrl),
  ].filter(
    (u): u is string =>
      typeof u === "string" &&
      isValidVenueCoverUrl(u) &&
      !isDeliveryAppImageUrl(u)
  );

  const ingestedPlacePhotos: string[] = [];
  for (const rawUrl of rawGallery) {
    if (ingestedPlacePhotos.length >= 8) break;
    const cdnUrl = await ingestPhotoToStorage(supabase, rawUrl, "cover");
    if (cdnUrl && isValidVenueCoverUrl(cdnUrl) && !ingestedPlacePhotos.includes(cdnUrl)) {
      ingestedPlacePhotos.push(cdnUrl);
    }
  }

  const signatureDishes = spot.signature_dish
    ? [
        spot.signature_dish,
        ...spot.dish_highlights
          .map((d) => d.dish_name)
          .filter((n) => n !== spot.signature_dish),
      ]
    : spot.dish_highlights.map((d) => d.dish_name);

  // 3. Find existing Venue by slug or name (handles renames too)
  let venueId: string;
  const isPopup = spot.spot_type === "popup" || spot.spot_type === "pop_up";
  const extractedIg =
    spot.instagram_url ||
    spot.notes?.match(/https:\/\/(www\.)?instagram\.com\/[^\s"')]+/i)?.[0] ||
    null;
  const dropScheduleMatch = spot.notes?.match(/Drop schedule:\s*([^.\n]+(?:\([^)]*\))?[^.\n]*)/i);
  const dropScheduleText = dropScheduleMatch
    ? dropScheduleMatch[1].trim()
    : (spot.notes?.split(".")[0]?.trim() || "Pop-Up Drops");

  const popupMeta = isPopup
    ? {
        brand_id: slugify(spot.id || spot.name),
        residency_status: "active" as const,
        dates_label: dropScheduleText.length > 55 ? dropScheduleText.slice(0, 52) + "..." : dropScheduleText,
        daily_hours: "Drop Days · See Instagram",
        portion_cap: "Limited Batches",
        host_venue_name: spot.address.replace(/,\s*0\d{3}\s*Oslo/i, "").replace(/,\s*Oslo/i, "").trim() || "Oslo Residency",
        host_address: spot.address,
        instagram_url: extractedIg,
        entry_type: "walk_in" as const,
        ...(spot.popup_meta || {}),
      }
    : undefined;

  const candidateSlugLookup = slugify(spot.id || spot.name);
  const resolvedWebsite = spot.website_uri || extractedIg || null;
  const resolvedHours = isPopup ? dropScheduleText : spot.opening_hours_text || null;
  let existingVenue: { id: string; name: string; vibe_signals: unknown } | null = null;

  if (spot.google_place_id) {
    const byPlaceId = await supabase
      .from("venues")
      .select("id, name, vibe_signals")
      .eq("google_place_id", spot.google_place_id)
      .maybeSingle();
    existingVenue = byPlaceId.data;
  }

  if (!existingVenue) {
    const bySlug = await supabase
      .from("venues")
      .select("id, name, vibe_signals")
      .eq("slug", candidateSlugLookup)
      .maybeSingle();
    existingVenue = bySlug.data;
  }

  if (!existingVenue) {
    const byName = await supabase
      .from("venues")
      .select("id, name, vibe_signals")
      .ilike("name", spot.name)
      .maybeSingle();
    existingVenue = byName.data;
  }

  if (!existingVenue && options.previousSpotName && options.previousSpotName !== spot.name) {
    const byPrev = await supabase
      .from("venues")
      .select("id, name, vibe_signals")
      .ilike("name", options.previousSpotName)
      .maybeSingle();
    existingVenue = byPrev.data;
  }

  if (existingVenue) {
    venueId = existingVenue.id;
    const prevSignals =
      existingVenue.vibe_signals && typeof existingVenue.vibe_signals === "object"
        ? (existingVenue.vibe_signals as Record<string, unknown>)
        : {};

    const { error: updateErr } = await supabase
      .from("venues")
      .update({
        name: spot.name,
        address: spot.address,
        neighborhood: spot.neighborhood || "sentrum",
        category: spot.food_category || "restaurant",
        latitude: spot.latitude,
        longitude: spot.longitude,
        image_url: finalCoverUrl || undefined,
        price_level: spot.price_level || "$$",
        google_rating: spot.google_rating ?? 4.7,
        ...(spot.google_reviews_count !== undefined ? { google_reviews_count: spot.google_reviews_count } : {}),
        ...(spot.google_place_id ? { google_place_id: spot.google_place_id } : {}),
        spot_type: spot.spot_type || "restaurant",
        description: spot.why_curated || null,
        signature_dishes: signatureDishes,
        website_uri: resolvedWebsite || undefined,
        current_opening_hours_text: resolvedHours || undefined,
        ...(spot.opening_hours ? { opening_hours: spot.opening_hours } : {}),
        updated_at: new Date().toISOString(),
        vibe_signals: {
          ...prevSignals,
          icon: spot.icon,
          spot_type: spot.spot_type || "restaurant",
          ...(ingestedPlacePhotos.length ? { place_photos: ingestedPlacePhotos } : {}),
          ...(spot.candidate_photos?.length ? { candidate_photos: spot.candidate_photos } : {}),
          ...(Object.keys(dishProvenance).length
            ? {
                dish_provenance: {
                  ...((prevSignals.dish_provenance as Record<string, unknown>) || {}),
                  ...dishProvenance,
                },
              }
            : {}),
          ...(popupMeta ? { popup_meta: popupMeta } : {}),
        },
      })
      .eq("id", venueId);

    if (updateErr) {
      throw new Error(`Failed to update venue "${spot.name}": ${updateErr.message}`);
    }
  } else {
    const baseSlug = slugify(spot.id || spot.name) || `spot-${Date.now()}`;
    let insertedId: string | null = null;
    let lastVenueErr = "";

    for (let attempt = 0; attempt < 3; attempt++) {
      const candidateSlug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
      const { data: newVenue, error: venueErr } = await supabase
        .from("venues")
        .insert({
          name: spot.name,
          slug: candidateSlug,
          address: spot.address,
          neighborhood: spot.neighborhood || "sentrum",
          category: spot.food_category || "restaurant",
          latitude: spot.latitude,
          longitude: spot.longitude,
          image_url: finalCoverUrl || ingestedDishes[0]?.finalUrl,
          price_level: spot.price_level || "$$",
          open_now: true,
          google_rating: spot.google_rating ?? 4.7,
          google_reviews_count: spot.google_reviews_count ?? 45,
          google_place_id: spot.google_place_id || null,
          spot_type: spot.spot_type || "restaurant",
          description: spot.why_curated || null,
          signature_dishes: signatureDishes,
          website_uri: resolvedWebsite,
          current_opening_hours_text: resolvedHours,
          opening_hours: spot.opening_hours ?? {},
          vibe_signals: {
            icon: spot.icon,
            spot_type: spot.spot_type || "restaurant",
            ...(ingestedPlacePhotos.length ? { place_photos: ingestedPlacePhotos } : {}),
            ...(spot.candidate_photos?.length ? { candidate_photos: spot.candidate_photos } : {}),
            ...(Object.keys(dishProvenance).length ? { dish_provenance: dishProvenance } : {}),
            ...(popupMeta ? { popup_meta: popupMeta } : {}),
          },
        })
        .select("id")
        .single();

      if (!venueErr && newVenue) {
        insertedId = newVenue.id;
        break;
      }
      lastVenueErr = venueErr?.message || "Unknown insert error";
    }

    if (!insertedId) {
      throw new Error(`Failed to insert venue "${spot.name}": ${lastVenueErr}`);
    }
    venueId = insertedId;
  }

  // 4. Upsert Dish Posts in `public.food_posts`
  for (const { dish, finalUrl } of ingestedDishes) {
    const prevDishName = options.previousDishNames?.[dish.id];
    let { data: existingPost } = await supabase
      .from("food_posts")
      .select("id")
      .eq("venue_id", venueId)
      .ilike("dish_name", dish.dish_name)
      .maybeSingle();

    if (!existingPost && prevDishName && prevDishName !== dish.dish_name) {
      const prevRes = await supabase
        .from("food_posts")
        .select("id")
        .eq("venue_id", venueId)
        .ilike("dish_name", prevDishName)
        .maybeSingle();
      existingPost = prevRes.data;
    }

    if (existingPost) {
      const { error: updPostErr } = await supabase
        .from("food_posts")
        .update({
          dish_name: dish.dish_name,
          dish_image: finalUrl,
          review_text: dish.review_text || spot.why_curated,
          price_nok: dish.price_nok,
          category: dish.category || spot.food_category,
          taste_tags: dish.taste_tags || [],
          is_published: true,
          is_archived: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingPost.id);

      if (updPostErr) {
        errors.push(`Dish update failed ("${dish.dish_name}"): ${updPostErr.message}`);
      } else {
        seededDishesCount++;
      }
    } else {
      const { error: postErr } = await supabase.from("food_posts").insert({
        venue_id: venueId,
        author_id: OFFICIAL_AUTHOR_ID,
        dish_name: dish.dish_name,
        dish_image: finalUrl,
        review_text: dish.review_text || spot.why_curated,
        price_nok: dish.price_nok,
        rating: 5,
        category: dish.category || spot.food_category,
        taste_tags: dish.taste_tags || [],
        is_published: true,
        is_archived: false,
        is_official_pick: false,
      });

      if (postErr) {
        errors.push(`Dish insert failed ("${dish.dish_name}"): ${postErr.message}`);
      } else {
        seededDishesCount++;
      }
    }
  }

  return { seededDishesCount, errors };
}

// GET: Read staged candidates (cloud Supabase Storage merged with git baseline)
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const candidates = await readStagedCandidates(auth.adminClient);
    return NextResponse.json({ candidates });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH: Update specific candidate spot or dish (auto-syncs seeded spots to Supabase!)
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const { spotId, updates, dishId, dishUpdates, action, newDish } = body;

    if (!spotId) {
      return NextResponse.json({ error: "Missing spotId" }, { status: 400 });
    }

    const candidates = await readStagedCandidates(auth.adminClient);
    if (candidates.length === 0) {
      return NextResponse.json({ error: "Staged candidates not found" }, { status: 404 });
    }

    const spotIndex = candidates.findIndex((s) => s.id === spotId);
    if (spotIndex === -1) {
      return NextResponse.json({ error: "Spot not found" }, { status: 404 });
    }

    const spot = candidates[spotIndex];
    const previousSpotName = spot.name;
    const previousDishNames: Record<string, string> = {};

    // Support adding/removing a dish highlight directly
    if (action === "add_dish" && newDish && typeof newDish === "object") {
      const created: StagedDishHighlight = {
        id: newDish.id || `${spot.id}-dish-${Date.now().toString(36)}`,
        dish_name: String(newDish.dish_name || spot.signature_dish || "House Special"),
        category: String(newDish.category || spot.food_category || "restaurant"),
        price_nok: typeof newDish.price_nok === "number" ? newDish.price_nok : null,
        dish_image: String(newDish.dish_image || ""),
        is_verified_food_photo:
          isValidSeedPhotoUrl(String(newDish.dish_image || "")) &&
          !isDeliveryAppImageUrl(String(newDish.dish_image || "")),
        review_text: String(newDish.review_text || spot.why_curated || ""),
        taste_tags: Array.isArray(newDish.taste_tags) ? newDish.taste_tags : [],
        image_source: detectImageSource(String(newDish.dish_image || "")),
      };
      spot.dish_highlights.push(created);
    }

    // Update spot level fields
    if (updates && typeof updates === "object") {
      if (
        typeof updates.cover_image_url === "string" &&
        (updates.cover_image_url.includes("/api/places/photos") ||
          updates.cover_image_url.startsWith("places/"))
      ) {
        updates.cover_image_url = await ingestGooglePhotoToSupabase(updates.cover_image_url);
      }

      Object.assign(spot, updates);

      // When curator explicitly clicks Approve, mark all dishes with valid non-delivery images as verified
      if (updates.verification_status === "approved") {
        for (const d of spot.dish_highlights) {
          if (isValidSeedPhotoUrl(d.dish_image) && !isDeliveryAppImageUrl(d.dish_image)) {
            d.is_verified_food_photo = true;
          }
        }
      }
    }

    // Update specific dish if requested
    if (dishId && dishUpdates && typeof dishUpdates === "object") {
      const dish = spot.dish_highlights.find((d) => d.id === dishId);
      if (dish) {
        previousDishNames[dish.id] = dish.dish_name;
        const incomingUrl =
          typeof dishUpdates.dish_image === "string" ? dishUpdates.dish_image : null;
        if (
          incomingUrl &&
          (incomingUrl.includes("/api/places/photos") || incomingUrl.startsWith("places/"))
        ) {
          if (!dishUpdates.source_url) dishUpdates.source_url = incomingUrl;
          if (!dishUpdates.image_source) dishUpdates.image_source = "google";
          dishUpdates.dish_image = await ingestGooglePhotoToSupabase(incomingUrl);
        }

        Object.assign(dish, dishUpdates);

        if (typeof dishUpdates.dish_image === "string") {
          const detected = detectImageSource(dish.dish_image, dish.image_source);
          if (!dishUpdates.image_source) {
            dish.image_source = detected;
          }
          if (detected === "ai_polish") {
            dish.is_ai_enhanced = true;
          }
          const valid =
            isValidSeedPhotoUrl(dish.dish_image) && !isDeliveryAppImageUrl(dish.dish_image);
          if (dishUpdates.is_verified_food_photo === undefined) {
            dish.is_verified_food_photo = valid;
          }
        }
      }
    }

    const allDishesVerified =
      spot.dish_highlights.length > 0 &&
      spot.dish_highlights.every(
        (d) => d.is_verified_food_photo && isValidSeedPhotoUrl(d.dish_image)
      );

    if (dishId && allDishesVerified && spot.verification_status === "needs_photo") {
      spot.verification_status = "approved";
    }

    // If this spot is already seeded (or curator explicitly triggered sync_seeded), sync live DB!
    let syncedToSupabase = false;
    let syncErrors: string[] = [];
    if (spot.verification_status === "seeded" || action === "sync_seeded") {
      try {
        const res = await syncSpotToSupabase(auth.adminClient, spot, {
          previousSpotName,
          previousDishNames,
          onlyVerifiedDishes: true,
        });
        syncedToSupabase = res.errors.length === 0;
        syncErrors = res.errors;
        bustLiveCaches();
      } catch (syncErr: any) {
        syncErrors.push(syncErr?.message || "Failed to sync seeded spot to Supabase.");
      }
    }

    candidates[spotIndex] = spot;
    await writeStagedCandidates(auth.adminClient, candidates);

    return NextResponse.json({
      success: true,
      spot,
      syncedToSupabase,
      syncErrors,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Safe Seeding Pipeline (Only processes spots with verification_status === "approved" or targeted IDs)
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    let targetSpotIds: string[] | null = null;
    if (req) {
      try {
        const body = await req.json();
        if (body && Array.isArray(body.spotIds) && body.spotIds.length > 0) {
          targetSpotIds = body.spotIds;
        }
      } catch {
        // No JSON body provided, default to committing all approved
      }
    }

    const supabase = auth.adminClient;
    const candidates = await readStagedCandidates(supabase);
    if (candidates.length === 0) {
      return NextResponse.json({ error: "Staged candidates not found" }, { status: 404 });
    }

    let approved: StagedCandidateSpot[] = [];
    if (targetSpotIds && targetSpotIds.length > 0) {
      approved = candidates.filter((s) => targetSpotIds!.includes(s.id));
    } else {
      approved = candidates.filter((s) => s.verification_status === "approved");
    }

    if (approved.length === 0) {
      return NextResponse.json(
        { error: "No candidates selected or marked as approved for seeding." },
        { status: 400 }
      );
    }

    // Pre-flight Guardrail Check
    const deliveryBlocked: string[] = [];
    for (const spot of approved) {
      const blockedDishNames = spot.dish_highlights
        .filter((d) => isDeliveryAppImageUrl(d.dish_image))
        .map((d) => d.dish_name);
      if (blockedDishNames.length > 0) {
        deliveryBlocked.push(`${spot.name}: ${blockedDishNames.join(", ")}`);
      }
    }
    if (deliveryBlocked.length > 0) {
      return NextResponse.json(
        {
          error: `Pre-flight Guardrail Blocked — replace Wolt/Foodora dish photos before committing: ${deliveryBlocked.join(" | ")}`,
          blockedDishes: deliveryBlocked,
        },
        { status: 400 }
      );
    }

    for (const spot of approved) {
      for (const dish of spot.dish_highlights) {
        if (!dish.is_verified_food_photo || !isValidSeedPhotoUrl(dish.dish_image)) {
          return NextResponse.json(
            {
              error: `Pre-flight Guardrail Failed: Spot "${spot.name}" dish "${dish.dish_name}" has unverified photo.`,
            },
            { status: 400 }
          );
        }
      }
    }

    let seededVenuesCount = 0;
    let seededDishesCount = 0;
    const errors: string[] = [];

    for (const spot of approved) {
      try {
        const res = await syncSpotToSupabase(supabase, spot);
        seededVenuesCount++;
        seededDishesCount += res.seededDishesCount;
        errors.push(...res.errors);
        spot.verification_status = "seeded";
      } catch (err: any) {
        errors.push(`Error seeding "${spot.name}": ${err.message}`);
      }
    }

    await writeStagedCandidates(supabase, candidates);
    bustLiveCaches();

    if (seededVenuesCount === 0 && errors.length > 0) {
      return NextResponse.json(
        {
          error: `Seeding failed: ${errors.join(" | ")}`,
          seededVenuesCount,
          seededDishesCount,
          errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      seededVenuesCount,
      seededDishesCount,
      errors,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
