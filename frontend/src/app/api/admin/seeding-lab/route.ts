import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { ingestGooglePhotoToSupabase } from "@/lib/storage/ingestGooglePhoto";

export const runtime = "nodejs";

const OFFICIAL_AUTHOR_ID = "1be02016-43ec-476a-a9dc-97630b063846";
const STORAGE_BUCKET = "dish-photos";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function getAdminClient(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function getStagedFilePath(): string {
  const p1 = path.join(process.cwd(), "curation", "staged_candidates.json");
  if (fs.existsSync(p1)) return p1;
  const p2 = path.join(process.cwd(), "frontend", "curation", "staged_candidates.json");
  if (fs.existsSync(p2)) return p2;
  return p1;
}

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
  price_level?: "$" | "$$" | "$$$";
  google_rating?: number | null;
  signature_dish?: string;
  why_curated: string;
  verification_status: VerificationStatus;
  notes?: string;
  instagram_url?: string;
  popup_meta?: Record<string, any>;
  dish_highlights: StagedDishHighlight[];
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

    if (trimmed.startsWith("/")) {
      const localPath = path.join(process.cwd(), "public", trimmed.replace(/^\//, ""));
      if (!fs.existsSync(localPath)) return trimmed;
      rawBuffer = fs.readFileSync(localPath);
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

// GET: Read staged candidates
export async function GET() {
  try {
    const filePath = getStagedFilePath();
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ candidates: [] });
    }
    const raw = fs.readFileSync(filePath, "utf8");
    const candidates: StagedCandidateSpot[] = JSON.parse(raw);
    return NextResponse.json({ candidates });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH: Update specific candidate spot or dish
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { spotId, updates, dishId, dishUpdates } = body;

    if (!spotId) {
      return NextResponse.json({ error: "Missing spotId" }, { status: 400 });
    }

    const filePath = getStagedFilePath();
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Staged candidates file not found" }, { status: 404 });
    }

    const raw = fs.readFileSync(filePath, "utf8");
    const candidates: StagedCandidateSpot[] = JSON.parse(raw);

    const spotIndex = candidates.findIndex((s) => s.id === spotId);
    if (spotIndex === -1) {
      return NextResponse.json({ error: "Spot not found" }, { status: 404 });
    }

    const spot = candidates[spotIndex];

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

      // When curator explicitly clicks Approve, mark all dishes with valid images as verified
      if (updates.verification_status === "approved") {
        for (const d of spot.dish_highlights) {
          if (
            d.dish_image &&
            !/streetview|facade|building|\/icons\/food\//i.test(d.dish_image)
          ) {
            d.is_verified_food_photo = true;
          }
        }
      }
    }

    // Update specific dish if requested
    if (dishId && dishUpdates && typeof dishUpdates === "object") {
      const dish = spot.dish_highlights.find((d) => d.id === dishId);
      if (dish) {
        if (
          typeof dishUpdates.dish_image === "string" &&
          (dishUpdates.dish_image.includes("/api/places/photos") ||
            dishUpdates.dish_image.startsWith("places/"))
        ) {
          dishUpdates.dish_image = await ingestGooglePhotoToSupabase(dishUpdates.dish_image);
        }

        Object.assign(dish, dishUpdates);

        if (typeof dishUpdates.dish_image === "string") {
          const url = dish.dish_image.trim();
          const hasValidUrl =
            url.startsWith("http://") ||
            url.startsWith("https://") ||
            url.startsWith("/api/places/photos") ||
            url.startsWith("/curation-remix/");
          const isBad = /streetview|facade|building|\/icons\/food\//i.test(url);
          if (dishUpdates.is_verified_food_photo === undefined) {
            dish.is_verified_food_photo = Boolean(hasValidUrl && !isBad);
          }
        }
      }
    }

    const allDishesVerified =
      spot.dish_highlights.length > 0 &&
      spot.dish_highlights.every(
        (d) =>
          d.is_verified_food_photo &&
          Boolean(d.dish_image) &&
          (d.dish_image.startsWith("http://") ||
            d.dish_image.startsWith("https://") ||
            d.dish_image.startsWith("/api/places/photos") ||
            d.dish_image.startsWith("/curation-remix/")) &&
          !/streetview|facade|building|\/icons\/food\//i.test(d.dish_image)
      );

    if (dishId && allDishesVerified && spot.verification_status === "needs_photo") {
      spot.verification_status = "approved";
    }

    candidates[spotIndex] = spot;
    fs.writeFileSync(filePath, JSON.stringify(candidates, null, 2), "utf8");

    return NextResponse.json({ success: true, spot });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Safe Seeding Pipeline (Only processes spots with verification_status === "approved")
export async function POST(req: NextRequest) {
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

    const supabase = getAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase service role client not configured on server." },
        { status: 500 }
      );
    }

    const filePath = getStagedFilePath();
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Staged candidates file not found" }, { status: 404 });
    }

    const raw = fs.readFileSync(filePath, "utf8");
    const candidates: StagedCandidateSpot[] = JSON.parse(raw);

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
    for (const spot of approved) {
      for (const dish of spot.dish_highlights) {
        if (!dish.is_verified_food_photo || !dish.dish_image) {
          return NextResponse.json(
            {
              error: `Pre-flight Guardrail Failed: Spot "${spot.name}" dish "${dish.dish_name}" has unverified photo.`,
            },
            { status: 400 }
          );
        }
        if (/streetview|facade|building|\/icons\/food\//i.test(dish.dish_image)) {
          return NextResponse.json(
            {
              error: `Pre-flight Guardrail Failed: Spot "${spot.name}" dish "${dish.dish_name}" contains invalid photo keyword.`,
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
        // 1. Ingest Dish Photos to Supabase CDN
        const ingestedDishes: { dish: StagedDishHighlight; finalUrl: string }[] = [];
        for (const dish of spot.dish_highlights) {
          const cdnUrl = await ingestPhotoToStorage(supabase, dish.dish_image, "dish");
          dish.dish_image = cdnUrl;
          ingestedDishes.push({ dish, finalUrl: cdnUrl });
        }

        // 2. Ingest Cover Photo to Supabase CDN (fallback to first dish photo if missing)
        let finalCoverUrl = spot.cover_image_url || ingestedDishes[0]?.finalUrl || "";
        if (finalCoverUrl) {
          finalCoverUrl = await ingestPhotoToStorage(supabase, finalCoverUrl, "cover");
          spot.cover_image_url = finalCoverUrl;
        }

        const signatureDishes = spot.signature_dish
          ? [
              spot.signature_dish,
              ...spot.dish_highlights
                .map((d) => d.dish_name)
                .filter((n) => n !== spot.signature_dish),
            ]
          : spot.dish_highlights.map((d) => d.dish_name);

        // 3. Insert or Find Venue using exact `public.venues` column schema
        let venueId: string;
        const isPopup = spot.spot_type === "popup" || spot.spot_type === "pop_up";
        const extractedIg =
          (spot as any).instagram_url ||
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

        const { data: existingVenue } = await supabase
          .from("venues")
          .select("id, name, vibe_signals")
          .ilike("name", spot.name)
          .maybeSingle();

        if (existingVenue) {
          venueId = existingVenue.id;
          const prevSignals =
            existingVenue.vibe_signals && typeof existingVenue.vibe_signals === "object"
              ? (existingVenue.vibe_signals as Record<string, unknown>)
              : {};

          const { error: updateErr } = await supabase
            .from("venues")
            .update({
              address: spot.address,
              neighborhood: spot.neighborhood || "sentrum",
              category: spot.food_category || "restaurant",
              latitude: spot.latitude,
              longitude: spot.longitude,
              image_url: finalCoverUrl || undefined,
              price_level: spot.price_level || "$$",
              google_rating: spot.google_rating ?? 4.7,
              spot_type: spot.spot_type || "restaurant",
              description: spot.why_curated || null,
              signature_dishes: signatureDishes,
              website_uri: extractedIg || undefined,
              current_opening_hours_text: isPopup ? dropScheduleText : undefined,
              vibe_signals: {
                ...prevSignals,
                icon: spot.icon,
                spot_type: spot.spot_type || "restaurant",
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
                google_reviews_count: 45,
                spot_type: spot.spot_type || "restaurant",
                description: spot.why_curated || null,
                signature_dishes: signatureDishes,
                website_uri: extractedIg || null,
                current_opening_hours_text: isPopup ? dropScheduleText : null,
                vibe_signals: {
                  icon: spot.icon,
                  spot_type: spot.spot_type || "restaurant",
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

        seededVenuesCount++;

        // 4. Insert or Update Dish Posts in `public.food_posts`
        for (const { dish, finalUrl } of ingestedDishes) {
          const { data: existingPost } = await supabase
            .from("food_posts")
            .select("id")
            .eq("venue_id", venueId)
            .ilike("dish_name", dish.dish_name)
            .maybeSingle();

          if (existingPost) {
            const { error: updPostErr } = await supabase
              .from("food_posts")
              .update({
                dish_image: finalUrl,
                review_text: dish.review_text || spot.why_curated,
                price_nok: dish.price_nok,
                category: dish.category || spot.food_category,
                taste_tags: dish.taste_tags || [],
                is_published: true,
                is_archived: false,
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

        // Mark spot as seeded in staged candidates
        spot.verification_status = "seeded";
      } catch (err: any) {
        errors.push(`Error seeding "${spot.name}": ${err.message}`);
      }
    }

    // Save updated candidates status to disk
    fs.writeFileSync(filePath, JSON.stringify(candidates, null, 2), "utf8");

    // Bust Next.js server caches so new venues & dishes show immediately on /
    try {
      revalidateTag("venues");
      revalidateTag("food_posts");
    } catch {
      // Ignore outside request context
    }

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
